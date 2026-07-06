import os
import json
import uuid
import urllib.parse
import boto3
import fitz  # PyMuPDF
from google import genai
from google.genai import types
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pinecone import Pinecone

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
# We'll expect a DYNAMODB_TABLE_NAME env var, default to 'Documents'
table = dynamodb.Table(os.environ.get('DYNAMODB_TABLE_NAME', 'Documents'))

# Initialize Pinecone
pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
index = pc.Index(host=os.environ.get("PINECONE_HOST"))

# Initialize Google GenAI — explicitly pass key since SDK reads GOOGLE_API_KEY by default
gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
# model = SentenceTransformer('all-MiniLM-L6-v2') # Replaced with Gemini API

# Valid sensitivities from least to most privileged
VALID_SENSITIVITIES = ['public', 'employee', 'manager', 'hr', 'executive']

def get_sensitivity_from_filename(filename):
    """
    Extracts sensitivity from the filename.
    Expects format: 'sensitivity_rest_of_filename.pdf'
    Defaults to 'executive' (most secure) if no valid prefix is found.
    """
    prefix = filename.split('_')[0].lower()
    if prefix in VALID_SENSITIVITIES:
        return prefix
    print(f"Warning: No valid sensitivity prefix found in {filename}. Defaulting to 'executive'.")
    return 'executive'

def process_pdf(file_path, filename):
    """
    Reads a PDF, extracts text page by page, and splits it into chunks.
    """
    chunks = []
    
    # Langchain text splitter: 500 characters, 50 character overlap
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        length_function=len,
        is_separator_regex=False,
    )
    
    doc = fitz.open(file_path)
    for page_num, page in enumerate(doc):
        text = page.get_text("text")
        if not text.strip():
            continue
            
        page_chunks = text_splitter.split_text(text)
        
        for i, chunk_text in enumerate(page_chunks):
            chunks.append({
                "id": f"{filename}-p{page_num}-c{i}-{str(uuid.uuid4())[:8]}",
                "text": chunk_text,
                "page": page_num + 1
            })
            
    return chunks

def lambda_handler(event, context):
    """
    Triggered by S3 ObjectCreated.
    """
    try:
        # 1. Parse S3 event
        record = event['Records'][0]
        bucket = record['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(record['s3']['object']['key'])
        
        filename = os.path.basename(key)
        print(f"Processing file: {filename} from bucket: {bucket}")
        
        # 2. Download PDF to /tmp
        tmp_path = f"/tmp/{filename}"
        s3_client.download_file(bucket, key, tmp_path)
        
        # 3. Determine sensitivity
        sensitivity = get_sensitivity_from_filename(filename)
        
        # 4. Extract and chunk text
        chunks = process_pdf(tmp_path, filename)
        print(f"Extracted {len(chunks)} chunks from {filename}")
        
        # 5. Embed chunks and format for Pinecone
        vectors_to_upsert = []
        for chunk in chunks:
            response = gemini_client.models.embed_content(
                model='gemini-embedding-001',
                contents=chunk['text'],
                config=types.EmbedContentConfig(output_dimensionality=768)
            )
            embedding = response.embeddings[0].values
            
            metadata = {
                "source": filename,
                "page": chunk['page'],
                "text": chunk['text'],
                "sensitivity": sensitivity
            }
            
            vectors_to_upsert.append({
                "id": chunk['id'],
                "values": embedding,
                "metadata": metadata
            })
            
        # 6. Upsert to Pinecone in batches of 100
        batch_size = 100
        for i in range(0, len(vectors_to_upsert), batch_size):
            batch = vectors_to_upsert[i:i + batch_size]
            index.upsert(vectors=batch)
            print(f"Upserted batch {i//batch_size + 1} to Pinecone")
            
        # 7. Record document ingestion in DynamoDB
        table.put_item(
            Item={
                'document_id': filename,
                's3_bucket': bucket,
                's3_key': key,
                'sensitivity': sensitivity,
                'chunk_count': len(chunks),
                'status': 'PROCESSED'
            }
        )
        print(f"Successfully recorded {filename} in DynamoDB")
        
        return {
            'statusCode': 200,
            'body': json.dumps(f"Successfully processed {filename}")
        }
        
    except Exception as e:
        print(f"Error processing document: {str(e)}")
        # You could add a status update to DynamoDB here marking it as 'FAILED'
        raise e
