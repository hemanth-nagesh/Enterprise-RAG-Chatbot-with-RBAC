import React from 'react';
import { FileText } from 'lucide-react';

export default function SourceBadge({ source }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '0.75rem',
      backgroundColor: 'var(--bg-elevated)',
      color: 'var(--text-muted)',
      padding: '2px 8px',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      marginRight: '6px',
      marginTop: '8px'
    }}>
      <FileText size={12} />
      {source}
    </span>
  );
}
