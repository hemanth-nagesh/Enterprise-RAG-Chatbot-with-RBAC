import streamlit as st
import requests
import json
import os
import pandas as pd
import plotly.express as px
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# The API URLs
API_URL = os.environ.get("API_URL", "https://ss2dh6fw46.execute-api.us-east-1.amazonaws.com/prod/chat/")
AUDIT_API_URL = os.environ.get("AUDIT_API_URL", "")
API_KEY = os.environ.get("AWS_API_KEY", "")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "secret")

st.set_page_config(
    page_title="Enterprise HR & Policy Bot",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for styling
st.markdown("""
<style>
    .reportview-container {
        background: #f0f2f6;
    }
    .chat-message {
        padding: 1.5rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        display: flex;
    }
    .chat-message.user {
        background-color: #2b313e;
        color: white;
    }
    .chat-message.bot {
        background-color: #475063;
        color: white;
    }
    .access-denied {
        background-color: #ffebee;
        color: #c62828;
        border-left: 4px solid #c62828;
        padding: 1rem;
        margin: 1rem 0;
    }
    .source-box {
        font-size: 0.8rem;
        background-color: #e0e0e0;
        color: #333;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        margin-right: 0.5rem;
        display: inline-block;
    }
</style>
""", unsafe_allow_html=True)

# --- Sidebar Navigation ---
with st.sidebar:
    st.image("https://img.icons8.com/color/96/000000/amazon-web-services.png", width=60)
    st.title("Navigation")
    
    current_page = st.radio("Go to:", ["Chat", "Admin Dashboard"])
    
    st.markdown("---")
    
    if current_page == "Chat":
        st.title("Settings & RBAC Demo")
        st.markdown("Use this to simulate different users logging in.")
        
        current_role = st.selectbox(
            "Simulate User Role",
            ["Intern", "Employee", "Manager", "HR", "Executive"],
            index=0,
            help="Change this role to see how the Vector Database filters out unauthorized information!"
        )
        
        st.markdown("---")
        st.markdown("### Permissions Granted:")
        if current_role == "Intern":
            st.info("✅ Public Docs Only")
        elif current_role == "Employee":
            st.info("✅ Public\n✅ Employee")
        elif current_role == "Manager":
            st.info("✅ Public\n✅ Employee\n✅ Manager")
        elif current_role == "HR":
            st.info("✅ Public\n✅ Employee\n✅ Manager\n✅ HR")
        elif current_role == "Executive":
            st.error("👑 ALL ACCESS (Public, Employee, Manager, HR, Executive)")
            
        st.markdown("---")
        st.markdown("**Built with:**\n- AWS API Gateway & Lambda\n- Pinecone (Vector DB)\n- Groq (Llama-3.1-8B)")

# --- Chat Page ---
if current_page == "Chat":
    st.title("🏢 Enterprise HR & Policy Bot")
    st.markdown(f"Welcome back! You are logged in as **{current_role}**.")

    if "messages" not in st.session_state:
        st.session_state.messages = []

    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            if message.get("sources"):
                st.markdown("**Sources:**")
                for source in message["sources"]:
                    st.markdown(f"<span class='source-box'>{source}</span>", unsafe_allow_html=True)

    if prompt := st.chat_input("Ask a question about HR policies, salaries, or guidelines..."):
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            message_placeholder = st.empty()
            
            headers = {'Content-Type': 'application/json'}
            if API_KEY:
                headers['x-api-key'] = API_KEY
                
            payload = {
                "question": prompt,
                "role": current_role.lower(),
                "user_id": "demo-user-123"
            }
            
            try:
                with st.spinner("Searching secure knowledge base..."):
                    response = requests.post(API_URL, headers=headers, json=payload, timeout=10)
                    
                if response.status_code == 200:
                    data = response.json()
                    answer = data.get("answer", "")
                    sources = data.get("sources", [])
                    access_denied = data.get("access_denied", False)
                    
                    if access_denied:
                        st.markdown(f"<div class='access-denied'>🚫 <b>Access Denied:</b> {answer}</div>", unsafe_allow_html=True)
                        st.session_state.messages.append({
                            "role": "assistant", 
                            "content": f"🚫 **Access Denied:** {answer}"
                        })
                    else:
                        message_placeholder.markdown(answer)
                        
                        if sources:
                            st.markdown("**Sources:**")
                            for source in sources:
                                st.markdown(f"<span class='source-box'>{source}</span>", unsafe_allow_html=True)
                                
                        st.session_state.messages.append({
                            "role": "assistant", 
                            "content": answer,
                            "sources": sources
                        })
                else:
                    st.error(f"API Error: {response.status_code} - {response.text}")
                    
            except requests.exceptions.ConnectionError:
                st.error(f"Failed to connect to backend API at {API_URL}. Is your AWS SAM local API running?")
                st.info("Run: `sam local start-api` in the infrastructure folder.")

# --- Admin Dashboard Page ---
elif current_page == "Admin Dashboard":
    st.title("🔒 Admin Audit Dashboard")
    
    if "admin_authenticated" not in st.session_state:
        st.session_state.admin_authenticated = False
        
    if not st.session_state.admin_authenticated:
        st.warning("Please enter the Admin Password to view Audit Logs.")
        pwd_input = st.text_input("Admin Password", type="password")
        if st.button("Login"):
            if pwd_input == ADMIN_PASSWORD:
                st.session_state.admin_authenticated = True
                st.rerun()
            else:
                st.error("Incorrect password.")
    else:
        if st.button("Logout"):
            st.session_state.admin_authenticated = False
            st.rerun()
            
        if not AUDIT_API_URL:
            st.error("AUDIT_API_URL is not set in your .env file!")
        else:
            with st.spinner("Fetching logs securely from AWS..."):
                try:
                    res = requests.get(AUDIT_API_URL, headers={'x-api-key': API_KEY} if API_KEY else {}, timeout=15)
                    if res.status_code == 200:
                        logs = res.json().get("logs", [])
                        if not logs:
                            st.info("No audit logs found yet.")
                        else:
                            df = pd.DataFrame(logs)
                            
                            # Convert timestamp
                            if 'timestamp' in df.columns:
                                df['timestamp'] = pd.to_datetime(df['timestamp'])
                                
                            st.markdown("### 📊 Overview KPIs")
                            col1, col2, col3, col4 = st.columns(4)
                            col1.metric("Total Queries", len(df))
                            
                            access_denied_count = len(df[df['answer'].str.contains("I do not have access", na=False)])
                            col2.metric("Access Denied Events", access_denied_count)
                            
                            unique_users = df['user_id'].nunique() if 'user_id' in df.columns else 0
                            col3.metric("Unique Users", unique_users)
                            
                            most_active = df['user_role'].mode()[0] if not df.empty and 'user_role' in df.columns else "N/A"
                            col4.metric("Most Active Role", str(most_active).capitalize())
                            
                            st.markdown("---")
                            st.markdown("### 📈 Usage Analytics")
                            
                            chart_col1, chart_col2 = st.columns(2)
                            
                            with chart_col1:
                                role_counts = df['user_role'].value_counts().reset_index()
                                role_counts.columns = ['Role', 'Count']
                                fig1 = px.pie(role_counts, values='Count', names='Role', title="Queries by Role", hole=0.3)
                                st.plotly_chart(fig1, use_container_width=True)
                                
                            with chart_col2:
                                df['date'] = df['timestamp'].dt.date
                                daily_counts = df.groupby('date').size().reset_index(name='Queries')
                                fig2 = px.line(daily_counts, x='date', y='Queries', title="Queries Over Time", markers=True)
                                st.plotly_chart(fig2, use_container_width=True)
                                
                            st.markdown("---")
                            st.markdown("### 📝 Full Audit Log")
                            
                            # Clean up the dataframe for display
                            display_df = df.copy()
                            display_df = display_df.sort_values(by='timestamp', ascending=False)
                            display_df['timestamp'] = display_df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
                            
                            # Optional: color-code rows where access was denied
                            def highlight_denied(row):
                                if "I do not have access" in str(row.get('answer', '')):
                                    return ['background-color: #ffebee'] * len(row)
                                return [''] * len(row)
                                
                            st.dataframe(display_df.style.apply(highlight_denied, axis=1), use_container_width=True)
                    else:
                        st.error(f"Failed to fetch audit logs: {res.status_code}")
                except Exception as e:
                    st.error(f"Error fetching audit logs: {str(e)}")
