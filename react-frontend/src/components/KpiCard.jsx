import React from 'react';

export default function KpiCard({ title, value, icon: Icon, color }) {
  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{
        backgroundColor: `${color}20`,
        color: color,
        padding: '1rem',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-muted text-sm font-medium">{title}</p>
        <p style={{ fontSize: '1.875rem', fontWeight: '700', lineHeight: 1 }}>{value}</p>
      </div>
    </div>
  );
}
