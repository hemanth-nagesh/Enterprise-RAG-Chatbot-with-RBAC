import os
from dotenv import load_dotenv
from google import genai
from google.genai import errors

def test_gemini_connection():
    print("Testing Gemini API Connection...")
    # Load environment variables from .env
    load_dotenv()
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("❌ Error: GEMINI_API_KEY is not set in your .env file.")
        return

    try:
        # Initialize the client
        client = genai.Client(api_key=api_key)
        
        # Try a simple embedding request
        print("Sending test request to text-embedding-004...")
        result = client.models.embed_content(
            model='gemini-embedding-001',
            contents="test connection"
        )
        
        if result.embeddings:
            print("✅ Success! Gemini API Key is valid and working.")
            print(f"Generated embedding vector of length: {len(result.embeddings[0].values)}")
        else:
            print("❌ Request succeeded but no embeddings were returned.")
            
    except errors.APIError as e:
        print(f"❌ Gemini API Error: {e.message} (Status Code: {e.code})")
    except Exception as e:
        print(f"❌ Unexpected Error: {str(e)}")

if __name__ == "__main__":
    test_gemini_connection()
