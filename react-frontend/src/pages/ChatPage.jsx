import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';
import { CHAT_API_URL, ROLES } from '../config';
import ChatMessage from '../components/ChatMessage';
import TypingIndicator from '../components/TypingIndicator';
import RoleBadge from '../components/RoleBadge';

export default function ChatPage({ currentRole }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const roleObj = ROLES.find(r => r.id === currentRole);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    
    // Add user message to UI
    const newMessages = [...messages, { id: Date.now(), role: 'user', content: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userText,
          role: currentRole,
          user_id: 'demo-user-123'
        })
      });

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        access_denied: data.access_denied
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: "Sorry, I encountered an error connecting to the server.",
        sources: [],
        access_denied: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header */}
      <header className="glass-card" style={{
        position: 'sticky', top: 0, zIndex: 10, padding: '1rem 2rem',
        borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h2 className="font-semibold text-lg">Secure Knowledge Base</h2>
          <p className="text-xs text-muted">Answers are strictly based on internal company documents.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">Viewing as:</span>
          <RoleBadge role={roleObj} />
        </div>
      </header>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '10vh' }}>
              <div style={{
                width: '80px', height: '80px', margin: '0 auto 1.5rem',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))',
                borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)'
              }}>
                <Bot size={40} color="white" />
              </div>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>How can I help you today?</h2>
              <p className="text-muted mb-8">Ask a question, and I'll find the answer in our secure documents.</p>
              
              <div className="flex gap-4 justify-center" style={{ flexWrap: 'wrap' }}>
                {["Tell me about TechNova", "What are the engineering salary bands?", "Summarize the executive compensation package"].map((q, i) => (
                  <button 
                    key={i} 
                    onClick={() => setInput(q)}
                    className="glass-card text-sm"
                    style={{ padding: '0.75rem 1rem', cursor: 'pointer' }}
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-6">
                  <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div style={{ padding: '2rem', paddingTop: '1rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit} className="flex gap-4 items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about HR, policies, or salaries..."
              style={{
                flex: 1,
                padding: '1.25rem 1.5rem',
                borderRadius: '16px',
                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border-color)',
                fontSize: '1rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
              }}
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              style={{
                background: input.trim() ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                color: input.trim() ? 'white' : 'var(--text-muted)',
                width: '3.5rem', height: '3.5rem',
                borderRadius: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: input.trim() ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none',
                flexShrink: 0
              }}
            >
              <Send size={20} style={{ marginLeft: '2px' }} />
            </button>
          </form>
          <p className="text-center text-xs text-muted mt-3">
            AI can make mistakes. Check the source documents for verification.
          </p>
        </div>
      </div>
    </div>
  );
}
