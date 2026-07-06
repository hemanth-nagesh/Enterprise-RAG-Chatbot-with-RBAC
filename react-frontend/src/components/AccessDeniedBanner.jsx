import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AccessDeniedBanner({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        backgroundColor: 'var(--danger-bg)',
        borderLeft: '4px solid var(--danger)',
        padding: '1rem',
        borderRadius: '0 8px 8px 0',
        color: '#FCA5A5',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        margin: '0.5rem 0'
      }}
    >
      <ShieldAlert color="var(--danger)" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div>
        <p className="font-semibold text-sm" style={{ color: 'var(--danger)' }}>Access Denied by Vector DB RBAC</p>
        <p className="text-sm mt-1">{message}</p>
      </div>
    </motion.div>
  );
}
