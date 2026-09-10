const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://astranex-cyber-range.onrender.com/api').replace(/\/$/, '');

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('astranex_token');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('astranex_token', token);
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('astranex_token');
  }
}

const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60000; // 1 minute cache for static data

export function warmupBackend() {
  if (typeof window !== 'undefined') {
    fetch(`${API_BASE}/`, { method: 'GET', mode: 'cors' }).catch(() => {});
  }
}

// Trigger background warmup immediately on script load
warmupBackend();

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Serve from cache for static GET endpoints if fresh
  if (method === 'GET' && (cleanEndpoint === '/stages' || cleanEndpoint.startsWith('/challenges/'))) {
    const cached = apiCache.get(cleanEndpoint);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    removeAuthToken();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'API request failed');
  }

  // Save to cache if GET
  if (method === 'GET' && (cleanEndpoint === '/stages' || cleanEndpoint.startsWith('/challenges/'))) {
    apiCache.set(cleanEndpoint, { data, timestamp: Date.now() });
  }

  // Clear cache on state mutations (POST/PUT/DELETE)
  if (method !== 'GET') {
    apiCache.clear();
  }

  return data;
}
