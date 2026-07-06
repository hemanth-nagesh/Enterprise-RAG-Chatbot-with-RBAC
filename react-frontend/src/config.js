export const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'https://ss2dh6fw46.execute-api.us-east-1.amazonaws.com/prod/chat/';
export const AUDIT_API_URL = import.meta.env.VITE_AUDIT_API_URL || 'https://ss2dh6fw46.execute-api.us-east-1.amazonaws.com/prod/audit';
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin';

export const ROLES = [
  { id: 'intern',    label: 'Intern',    emoji: '🎓', color: '#94A3B8', permissions: ['public'] },
  { id: 'employee',  label: 'Employee',  emoji: '👤', color: '#60A5FA', permissions: ['public', 'employee'] },
  { id: 'manager',   label: 'Manager',   emoji: '📊', color: '#A78BFA', permissions: ['public', 'employee', 'manager'] },
  { id: 'hr',        label: 'HR',        emoji: '🧑‍💼', color: '#34D399', permissions: ['public', 'employee', 'manager', 'hr'] },
  { id: 'executive', label: 'Executive', emoji: '👑', color: '#FBBF24', permissions: ['public', 'employee', 'manager', 'hr', 'executive'] },
];
