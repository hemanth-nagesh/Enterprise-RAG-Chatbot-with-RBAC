import React from 'react';

export default function RoleBadge({ role, style }) {
  if (!role) return null;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '0.75rem',
      fontWeight: '600',
      backgroundColor: 'var(--bg-elevated)',
      color: role.color || 'var(--text-primary)',
      padding: '4px 10px',
      borderRadius: '16px',
      border: `1px solid ${role.color || 'var(--border-color)'}40`,
      ...style
    }}>
      {role.emoji} {role.label}
    </span>
  );
}
