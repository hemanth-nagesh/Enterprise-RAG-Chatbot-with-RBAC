import React from 'react';
import { motion } from 'framer-motion';
import SourceBadge from './SourceBadge';
import AccessDeniedBanner from './AccessDeniedBanner';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{ marginBottom: '1.5rem' }}
    >
      <div style={{
        maxWidth: '80%',
        padding: '1.25rem',
        borderRadius: '12px',
        borderTopRightRadius: isUser ? '4px' : '12px',
        borderTopLeftRadius: !isUser ? '4px' : '12px',
        backgroundColor: isUser ? 'var(--accent-primary)' : 'var(--bg-elevated)',
        border: !isUser ? '1px solid var(--border-color)' : 'none',
        boxShadow: isUser ? '0 4px 15px rgba(99, 102, 241, 0.2)' : 'none'
      }}>
        <div style={{ fontSize: '0.9375rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          {message.access_denied ? (
            <AccessDeniedBanner message={message.content} />
          ) : (
            message.content
          )}
        </div>
        
        {!message.access_denied && message.sources && message.sources.length > 0 && (
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${isUser ? 'rgba(255,255,255,0.2)' : 'var(--border-color)'}` }}>
            <p className="text-xs font-semibold mb-1" style={{ color: isUser ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>SOURCES</p>
            <div className="flex" style={{ flexWrap: 'wrap' }}>
              {message.sources.map((src, idx) => (
                <SourceBadge key={idx} source={src} />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
