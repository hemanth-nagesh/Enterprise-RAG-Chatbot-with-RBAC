# Enterprise RAG Chatbot with Role-Based Access Control (RBAC) 🛡️

A production-grade, 100% serverless Retrieval-Augmented Generation (RAG) chatbot designed for enterprise security. It securely answers employee questions based on private company PDFs, dynamically filtering knowledge retrieval based on the user's role (RBAC) to ensure sensitive data (like executive salaries) is only accessible to authorized users.

Built entirely within the **AWS Free Tier** using Groq's ultra-fast LLaMA-3 inference and Pinecone Serverless vector database.

## ✨ Key Features
- **Role-Based Access Control (RBAC):** Vector database queries are dynamically filtered using metadata based on the user's IAM-equivalent role (e.g., Intern vs. Executive).
- **Zero Hallucination Guardrails:** Prompt engineering and post-processing ensure the LLM *only* answers from the retrieved context. If the answer isn't there, it safely admits it.
- **Source Citations:** Every answer includes the exact document name and page number it was sourced from.
- **100% Serverless Architecture:** Uses AWS API Gateway, AWS Lambda, S3, and DynamoDB. No EC2 instances, zero idle costs.
- **Local Embedding:** Document chunking and semantic embedding (`all-MiniLM-L6-v2`) happen completely inside the AWS Lambda environment, requiring no expensive Bedrock/SageMaker calls.

---

## 🏛️ Architecture

![Architecture](docs/architecture.png) *Note: Add your own Excalidraw or draw.io diagram here*

1. **Ingestion Pipeline:** 
   `PDF Upload to S3` ➔ `S3 ObjectCreated Event` ➔ `Ingestion Lambda` ➔ `PyMuPDF Chunking` ➔ `Sentence-Transformers Embedding` ➔ `Pinecone Upsert (with sensitivity metadata)`
2. **Query Pipeline:**
   `Streamlit UI` ➔ `API Gateway` ➔ `Chat Lambda` ➔ `RBAC Check` ➔ `Pinecone Metadata Filtered Search` ➔ `Groq API (LLaMA-3.1-8B)` ➔ `DynamoDB Audit Log`

---

## 🚀 Getting Started

### 1. Prerequisites
- **AWS Account** with AWS SAM CLI installed.
- **Groq API Key** (Free Tier)
- **Pinecone API Key & Host URL** (Free Tier Serverless Index - Dimension: 384, Metric: Cosine)

### 2. Local Setup
Clone the repository and set up your environment variables:
```bash
cp .env.template .env
# Fill in your GROQ_API_KEY, PINECONE_API_KEY, and PINECONE_HOST
```

Install local dependencies for the Streamlit UI:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r frontend/requirements.txt
```

### 3. Running the UI Locally
```bash
streamlit run frontend/app.py
```

### 4. Deploying to AWS
Use AWS SAM to deploy the serverless infrastructure:
```bash
cd infrastructure
sam build
sam deploy --guided
```

---

## 💼 For Recruiters / Resume Impact

*If you are reviewing this project for a Generative AI or Cloud Engineering role, here is what this architecture demonstrates:*

- **Security-First AI Design:** Understanding that enterprise AI isn't just about calling an API; it's about data governance. The RBAC engine prevents data leakage at the vector retrieval layer, ensuring the LLM never even sees unauthorized text.
- **Cost Optimization:** Architected to run at **$0/month**. Embedding models are executed locally within the Lambda memory footprint instead of using expensive managed endpoints.
- **Serverless Orchestration:** Demonstrates strong command of AWS native services (Lambda, API Gateway, S3 event triggers, DynamoDB) and Infrastructure-as-Code (AWS SAM).

---
*Built by Hemanth*
# Enterprise-RAG-Chatbot-with-RBAC
# Enterprise-RAG-Chatbot-with-RBAC
