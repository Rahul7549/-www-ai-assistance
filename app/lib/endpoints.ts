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
