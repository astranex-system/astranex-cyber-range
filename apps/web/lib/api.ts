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

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

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

  return data;
}
