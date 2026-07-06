import React from 'react';
import { MessageSquare, LayoutDashboard, Database, Shield } from 'lucide-react';
import { ROLES } from '../config';

export default function Sidebar({ currentPage, setCurrentPage, currentRole, setCurrentRole }) {
  
  const roleObj = ROLES.find(r => r.id === currentRole);

  return (
    <aside style={{
      width: '280px',
      height: '100vh',
      backgroundColor: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem'
    }}>
      {/* Brand */}
      <div className="flex items-center gap-2 mb-8">
        <div style={{ background: 'var(--accent-primary)', padding: '6px', borderRadius: '8px' }}>
          <Database size={20} color="white" />
        </div>
        <h1 className="font-semibold" style={{ fontSize: '1.25rem' }}>NovaMind</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-col gap-2 mb-8" style={{ display: 'flex' }}>
        <button 
          onClick={() => setCurrentPage('chat')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: currentPage === 'chat' ? 'var(--bg-elevated)' : 'transparent',
            color: currentPage === 'chat' ? 'var(--accent-glow)' : 'var(--text-muted)'
          }}
        >
          <MessageSquare size={18} />
          <span className="font-medium">Secure Chat</span>
        </button>
        
        <button 
          onClick={() => setCurrentPage('admin')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: currentPage === 'admin' ? 'var(--bg-elevated)' : 'transparent',
            color: currentPage === 'admin' ? 'var(--accent-glow)' : 'var(--text-muted)'
          }}
        >
          <LayoutDashboard size={18} />
          <span className="font-medium">Admin Dashboard</span>
        </button>
      </nav>

      <div style={{ height: '1px', background: 'var(--border-color)', margin: '0 0 2rem 0' }} />

      {/* Role Simulator */}
      {currentPage === 'chat' && (
        <div className="flex-col" style={{ flex: 1 }}>
          <h3 className="text-xs font-semibold text-muted mb-4" style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            RBAC Simulator
          </h3>
          
          <div className="flex-col gap-2" style={{ marginBottom: '2rem' }}>
            {ROLES.map(role => (
              <button
                key={role.id}
                onClick={() => setCurrentRole(role.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem', borderRadius: '8px',
                  backgroundColor: currentRole === role.id ? `${role.color}15` : 'transparent',
                  border: `1px solid ${currentRole === role.id ? role.color : 'transparent'}`,
                  color: currentRole === role.id ? role.color : 'var(--text-primary)',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{role.emoji}</span>
                <span className="font-medium">{role.label}</span>
              </button>
            ))}
          </div>

          {/* Permissions Box */}
          <div className="glass-card" style={{ padding: '1rem', marginTop: 'auto' }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} color="var(--success)" />
              <span className="text-sm font-semibold text-muted">Granted Access</span>
            </div>
            <div className="flex" style={{ flexWrap: 'wrap', gap: '6px' }}>
              {roleObj?.permissions.map(p => (
                <span key={p} style={{
                  fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)'
                }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '2rem', textAlign: 'center' }}>
        <p className="text-xs text-muted">Powered by AWS & Pinecone</p>
      </div>
    </aside>
  );
}
