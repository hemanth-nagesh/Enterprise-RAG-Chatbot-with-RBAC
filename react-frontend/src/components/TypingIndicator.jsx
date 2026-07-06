import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="flex gap-1" style={{ padding: '0.5rem 0' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: '8px',
            height: '8px',
            backgroundColor: 'var(--accent-glow)',
            borderRadius: '50%',
            animation: `bounce 1.4s infinite ease-in-out both`,
            animationDelay: `${i * 0.16}s`
          }}
        />
      ))}
    </div>
  );
}
