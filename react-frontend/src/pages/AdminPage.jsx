import React, { useState, useEffect } from 'react';
import { Lock, RefreshCw, Users, ShieldAlert, Activity, FileSearch } from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AUDIT_API_URL, ADMIN_PASSWORD, ROLES } from '../config';
import KpiCard from '../components/KpiCard';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchLogs();
    } else {
      setError(true);
      setTimeout(() => setError(false), 500); // Reset for shake animation
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(AUDIT_API_URL);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(fetchLogs, 30000); // Auto refresh every 30s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <form 
          onSubmit={handleLogin}
          className="glass-card" 
          style={{
            padding: '2.5rem', width: '400px', textAlign: 'center',
            animation: error ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'fadeInUp 0.5s ease-out'
          }}
        >
          <div style={{
            width: '64px', height: '64px', margin: '0 auto 1.5rem',
            background: 'var(--bg-elevated)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Lock size={32} color="var(--accent-primary)" />
          </div>
          <h2 className="text-xl mb-2">Admin Access Required</h2>
          <p className="text-muted text-sm mb-6">Please enter the master password to view audit logs.</p>
          
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            style={{ marginBottom: '1rem', borderColor: error ? 'var(--danger)' : '' }}
            autoFocus
          />
          <button type="submit" className="btn-primary w-full">Unlock Dashboard</button>
        </form>
      </div>
    );
  }

  // --- Derived Metrics ---
  const totalQueries = logs.length;
  const accessDenials = logs.filter(l => l.answer?.includes('I do not have access')).length;
  
  // Unique users
  const uniqueUsers = new Set(logs.map(l => l.user_id)).size;
  
  // Role distribution for Pie Chart
  const roleCounts = logs.reduce((acc, log) => {
    acc[log.user_role] = (acc[log.user_role] || 0) + 1;
    return acc;
  }, {});
  
  const pieData = Object.keys(roleCounts).map(r => {
    const roleDef = ROLES.find(rd => rd.id === r);
    return {
      name: roleDef ? roleDef.label : r,
      value: roleCounts[r],
      color: roleDef ? roleDef.color : '#cbd5e1'
    };
  });

  return (
    <div style={{ padding: '2rem', overflowY: 'auto', height: '100vh' }}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Security & Audit Dashboard</h1>
          <p className="text-muted">Real-time monitoring of vector database access and RAG queries.</p>
        </div>
        <button onClick={fetchLogs} className="btn-primary" style={{ background: 'var(--bg-elevated)', color: 'white' }}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <KpiCard title="Total Queries" value={totalQueries} icon={Activity} color="#6366F1" />
        <KpiCard title="Access Denied Events" value={accessDenials} icon={ShieldAlert} color="#EF4444" />
        <KpiCard title="Unique Users" value={uniqueUsers} icon={Users} color="#10B981" />
        <KpiCard title="Total Documents" value="8" icon={FileSearch} color="#F59E0B" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 className="font-medium mb-4">Queries by Role</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 className="font-medium mb-4">Access Denied Log (Recent)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <th style={{ padding: '0.75rem 0' }}>Time</th>
                  <th style={{ padding: '0.75rem 0' }}>Role</th>
                  <th style={{ padding: '0.75rem 0' }}>Attempted Query</th>
                </tr>
              </thead>
              <tbody>
                {logs.filter(l => l.answer?.includes('I do not have access')).slice(0, 5).map(log => {
                  const roleObj = ROLES.find(r => r.id === log.user_role);
                  return (
                    <tr key={log.audit_id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--danger-bg)' }}>
                      <td style={{ padding: '0.75rem 0', fontSize: '0.875rem', color: '#FCA5A5' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: roleObj?.color, color: '#111' }}>
                          {roleObj?.label || log.user_role}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0', fontSize: '0.875rem', color: '#FCA5A5' }}>"{log.question}"</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Full Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 className="font-medium mb-4">Full Query Log</h3>
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <th style={{ padding: '0.75rem 0' }}>Time</th>
                  <th style={{ padding: '0.75rem 0' }}>User ID</th>
                  <th style={{ padding: '0.75rem 0' }}>Role</th>
                  <th style={{ padding: '0.75rem 0', width: '30%' }}>Question</th>
                  <th style={{ padding: '0.75rem 0', width: '30%' }}>Answer Snippet</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const isDenied = log.answer?.includes('I do not have access');
                  return (
                    <tr key={log.audit_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0', fontSize: '0.875rem' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem 0', fontSize: '0.875rem' }}>{log.user_id}</td>
                      <td style={{ padding: '0.75rem 0', fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {log.user_role}
                      </td>
                      <td style={{ padding: '0.75rem 0', fontSize: '0.875rem' }}>{log.question}</td>
                      <td style={{ padding: '0.75rem 0', fontSize: '0.875rem', color: isDenied ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {isDenied ? '🚫 Access Denied' : log.answer.substring(0, 60) + '...'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
}
