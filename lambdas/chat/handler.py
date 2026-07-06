import os
import json
import uuid
import datetime
import boto3
from groq import Groq
from google import genai
from google.genai import types
from pinecone import Pinecone

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
# Default to 'AuditLog' if env var not set
audit_table = dynamodb.Table(os.environ.get('DYNAMODB_AUDIT_TABLE', 'AuditLog'))

# Initialize Pinecone
pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
index = pc.Index(host=os.environ.get("PINECONE_HOST"))

# Initialize Groq
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Initialize Google GenAI — explicitly pass key since SDK reads GOOGLE_API_KEY by default
gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# --- Phase 2: RBAC Engine ---
ROLE_HIERARCHY = {
    'intern': ['public'],
    'employee': ['public', 'employee'],
    'manager': ['public', 'employee', 'manager'],
    'hr': ['public', 'employee', 'manager', 'hr'],
    'executive': ['public', 'employee', 'manager', 'hr', 'executive']
}

def get_allowed_sensitivities(user_role):
    """
    Returns a list of allowed sensitivity levels for a given role.
    Defaults to ['public'] if role is unknown.
    """
    role_lower = str(user_role).lower().strip()
    return ROLE_HIERARCHY.get(role_lower, ['public'])

# --- Phase 3 & 4: RAG Query Pipeline & Guardrails ---
SYSTEM_PROMPT = """You are an internal corporate assistant.
Your job is to answer questions based strictly on the provided context documents.

CRITICAL INSTRUCTIONS:
1. You MUST ONLY use the provided context to answer the question.
2. If the answer is not contained in the context, you MUST say exactly: "I do not have access to information that answers this question."
3. Do not invent, hallucinate, or rely on outside knowledge.
4. If you answer the question, keep it concise and professional.
"""

def lambda_handler(event, context):
    try:
        # Parse API Gateway event body
        body = json.loads(event.get('body', '{}'))
        question = body.get('question')
        user_id = body.get('user_id', 'anonymous')
        user_role = body.get('role', 'intern')
        
        if not question:
            return {
                'statusCode': 400,
                'body': json.dumps({"error": "Missing 'question' in request body"})
            }

        print(f"User {user_id} ({user_role}) asking: {question}")

        # 1. RBAC Engine: Get allowed sensitivities
        allowed_sensitivities = get_allowed_sensitivities(user_role)
        
        # 2. Embed the user's question
        response = gemini_client.models.embed_content(
            model='gemini-embedding-001',
            contents=question,
            config=types.EmbedContentConfig(output_dimensionality=768)
        )
        query_embedding = response.embeddings[0].values
        
        # 3. Query Pinecone WITH Metadata Filter (RBAC enforced at retrieval!)
        query_response = index.query(
            vector=query_embedding,
            top_k=5,
            include_metadata=True,
            filter={
                "sensitivity": {"$in": allowed_sensitivities}
            }
        )
        
        # 4. Construct Context
        contexts = []
        sources = set()
        
        for match in query_response['matches']:
            # Require a minimum similarity score (e.g. 0.3) to ensure relevance
            if match['score'] > 0.3:
                contexts.append(match['metadata']['text'])
                sources.add(f"{match['metadata']['source']} (Page {match['metadata']['page']})")
                
        # Handle case where no relevant chunks were found (or were filtered out by RBAC)
        if not contexts:
            log_audit(user_id, user_role, question, "No context found or access denied.", allowed_sensitivities)
            return {
                'statusCode': 200,
                'body': json.dumps({
                    "answer": "I do not have access to information that answers this question, or it does not exist.",
                    "sources": [],
                    "access_denied": True
                })
            }
            
        context_block = "\n\n---\n\n".join(contexts)
        user_prompt = f"Context:\n{context_block}\n\nQuestion:\n{question}"
        
        # 5. Call Groq API (LLaMA-3)
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.1-8b-instant",  # Good for fast, free-tier processing
            temperature=0.0,  # Zero temperature for factual retrieval
        )
        
        answer = chat_completion.choices[0].message.content
        
        # Post-processing Hallucination Guardrail Check
        if "I do not have access to information" in answer:
            final_sources = []
        else:
            final_sources = list(sources)
            
        # 6. Log the transaction to DynamoDB
        log_audit(user_id, user_role, question, answer, allowed_sensitivities)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' # Required for Streamlit frontend
            },
            'body': json.dumps({
                "answer": answer,
                "sources": final_sources,
                "access_denied": False
            })
        }
        
    except Exception as e:
        print(f"Error processing chat request: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({"error": "Internal server error."})
        }

def log_audit(user_id, user_role, question, answer, allowed_sensitivities):
    """
    Logs every query, role, and response to DynamoDB for audit purposes.
    """
    try:
        audit_table.put_item(
            Item={
                'audit_id': str(uuid.uuid4()),
                'timestamp': datetime.datetime.utcnow().isoformat(),
                'user_id': user_id,
                'user_role': user_role,
                'question': question,
                'answer': answer,
                'allowed_sensitivities': allowed_sensitivities
            }
        )
    except Exception as e:
        print(f"Failed to log audit to DynamoDB: {str(e)}")
        # We don't want audit logging failure to crash the user's response
