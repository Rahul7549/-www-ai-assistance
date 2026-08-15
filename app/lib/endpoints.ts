// ─────────────────────────────────────────────────────
// All backend API paths in one place.
// If a path changes on the backend, update it here only.
// ─────────────────────────────────────────────────────

export const ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
  },
  assistants: {
    list: '/api/assistants',
    create: '/api/assistants',
    get: (id: string) => `/api/assistants/${id}`,
    update: (id: string) => `/api/assistants/${id}`,
    delete: (id: string) => `/api/assistants/${id}`,
  },
  conversations: {
    create: '/api/conversations',
    listByAssistant: (assistantId: string) => `/api/conversations/assistant/${assistantId}`,
    messages: (id: string) => `/api/conversations/${id}/messages`,
    sendMessage: (id: string) => `/api/conversations/${id}/messages`,
    editMessage: (id: string, messageId: string) => `/api/conversations/${id}/messages/${messageId}`,
    deleteMessage: (id: string, messageId: string) => `/api/conversations/${id}/messages/${messageId}`,
    delete: (id: string) => `/api/conversations/${id}`,
  },
  pdf: {
    generate: '/api/pdf/generate',
    download: (fileName: string) => `/api/pdf/download/${fileName}`,
  },
  health: '/health',
} as const;

export const AVATARS = [
  { name: 'Nova', src: '/avatars/nova.png' },
  { name: 'Lumen', src: '/avatars/lumen.png' },
  { name: 'Orion', src: '/avatars/orion.png' },
  { name: 'Sage', src: '/avatars/sage.png' },
] as const;

export const VOICES = [
  'Nova - Energetic & Fast',
  'Echo - Soft & Calm',
  'Atlas - Deep & Professional',
] as const;
