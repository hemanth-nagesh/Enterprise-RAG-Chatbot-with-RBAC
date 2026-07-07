# Enterprise RAG Chatbot with RBAC

This repository contains a full-stack, serverless enterprise chatbot that answers questions from private PDF documents while enforcing role-based access control (RBAC). The system is designed to show how a secure AI assistant can retrieve relevant information from a vector store, restrict access by user role, and provide source-backed answers.

## What this system does

- Accepts questions from a web UI
- Applies a role-based permission model before retrieval
- Searches a vector database for relevant document chunks
- Generates a grounded answer using an LLM
- Returns source citations and logs audit events
- Supports document ingestion from uploaded PDFs into a searchable knowledge base

## Current stack

### Frontend
- React + Vite for the main user experience in the react-frontend folder
- A Streamlit prototype is also included in the frontend folder for local demos
- Tailwind-style/custom CSS is used for the modern React UI

### Backend / APIs
- AWS API Gateway for REST endpoints
- AWS Lambda functions for business logic
- AWS S3 for storing uploaded PDFs
- Amazon DynamoDB for document metadata and audit logs
- Pinecone for vector storage and similarity search
- Google Gemini embeddings for semantic chunk embedding
- Groq for LLM-based answer generation

### Data and document pipeline
- PyMuPDF for PDF text extraction
- LangChain RecursiveCharacterTextSplitter for chunking document content
- Python-based Lambda handlers orchestrating ingestion, retrieval, and audit logging

## Project structure

- infrastructure/ - AWS SAM template and deployment config
- lambdas/chat/ - chat API Lambda
- lambdas/ingestion/ - PDF ingestion Lambda
- lambdas/audit/ - audit log retrieval Lambda
- react-frontend/ - main React/Vite frontend
- frontend/ - older Streamlit demo frontend
- data/sample_pdfs/ - sample PDF documents
- generate_demo_pdfs.py - utility to create sample PDF documents

## Architecture flow

1. Document ingestion
   - A PDF is uploaded to S3
   - The S3 event triggers the ingestion Lambda
   - The Lambda extracts text from the PDF using PyMuPDF
   - The content is chunked and embedded with Gemini
   - The embeddings and metadata are stored in Pinecone
   - The document metadata is written to DynamoDB

2. User query flow
   - The user opens the React frontend and selects a role
   - The frontend sends a POST request to the chat API
   - The chat Lambda receives the question and role
   - The Lambda maps the role to allowed sensitivity levels
   - A Gemini embedding is created for the question
   - Pinecone is queried with RBAC-based metadata filtering
   - The retrieved context is passed to Groq for answer generation
   - The response is returned to the UI along with source references

3. Audit flow
   - Every query is stored in DynamoDB for monitoring and review
   - The admin dashboard can retrieve those logs through the audit Lambda

## Lambda functions

### Ingestion Lambda
Location: lambdas/ingestion/handler.py

Responsibilities:
- Reads S3 events for newly uploaded PDF objects
- Downloads the PDF from S3 to /tmp
- Extracts text page by page with PyMuPDF
- Splits the text into chunks using RecursiveCharacterTextSplitter
- Generates embeddings with Gemini
- Stores the vectors in Pinecone with metadata such as source, page, and sensitivity
- Records document ingestion status in DynamoDB

### Chat Lambda
Location: lambdas/chat/handler.py

Responsibilities:
- Accepts chat requests from the frontend through API Gateway
- Parses the user question, user ID, and role
- Applies the RBAC hierarchy to decide which document sensitivity levels are allowed
- Converts the question into an embedding with Gemini
- Queries Pinecone using metadata filtering for authorized content only
- Builds a context block from retrieved chunks
- Sends that context to Groq with a strict system prompt to avoid hallucination
- Returns the answer, sources, and access-denied status
- Writes an audit event to DynamoDB

### Audit Lambda
Location: lambdas/audit/handler.py

Responsibilities:
- Fetches audit records from DynamoDB
- Returns them as JSON for the admin dashboard
- Supports simple monitoring of queries, roles, and access-denied events

## RBAC model

The app uses a simple role hierarchy:

- intern: public
- employee: public + employee
- manager: public + employee + manager
- hr: public + employee + manager + hr
- executive: public + employee + manager + hr + executive

This means a lower-privilege user cannot retrieve content marked with a higher sensitivity level.

## Tech stack summary

- Python 3.11
- AWS SAM
- API Gateway
- Lambda
- S3
- DynamoDB
- Pinecone
- Gemini API
- Groq API
- React
- Vite
- Streamlit (legacy demo UI)

## Local setup

### Prerequisites
- Python 3.11+
- Node.js and npm
- AWS CLI and AWS SAM CLI
- API keys for:
  - Groq
  - Pinecone
  - Gemini

### 1. Clone and install Python dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r frontend/requirements.txt
pip install -r lambdas/chat/requirements.txt
pip install -r lambdas/ingestion/requirements.txt
pip install -r lambdas/audit/requirements.txt
```

### 2. Install frontend dependencies

```bash
cd react-frontend
npm install
npm run dev
```

### 3. Run the legacy Streamlit UI (optional)

```bash
streamlit run frontend/app.py
```

### 4. Deploy backend infrastructure

```bash
cd infrastructure
sam build
sam deploy --guided
```

## Demo data

The repository includes a helper script to generate sample PDFs for testing:

```bash
python generate_demo_pdfs.py
```

This creates example documents in the data/sample_pdfs folder with sensitivity prefixes such as public, employee, manager, hr, and executive.

## Notes

- The current main UI is the React/Vite experience under react-frontend.
- The Streamlit app remains available as a lightweight prototype and demo interface.
- The ingestion pipeline is designed for serverless deployment and can scale with S3 uploads.

## Summary

This project demonstrates a practical enterprise AI pattern: secure document ingestion, RBAC-aware retrieval, grounded answer generation, and observability through audit logging. It is a strong example of combining modern LLM tooling with cloud-native serverless architecture.
