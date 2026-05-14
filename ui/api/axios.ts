import axios from 'axios';

/**
 * Browser: same-origin `/api-proxy` → Next.js rewrites → FastAPI (no CORS, no direct :8000 from browser).
 * Server (SSR): `INTERNAL_API_URL` or direct `NEXT_PUBLIC_API_URL` to reach FastAPI from Node.
 * Set `NEXT_PUBLIC_API_URL` only if you need the browser to call FastAPI directly (e.g. mobile tunnel).
 */
function getBaseURL(): string {
  if (typeof window === 'undefined') {
    return (
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://127.0.0.1:8000'
    ).replace(/\/$/, '');
  }
  const direct = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (direct) {
    return direct.replace(/\/$/, '');
  }
  return '/api-proxy';
}

const baseURL = getBaseURL();

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/admin-login'];

function isPublicAuthRequest(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.startsWith('http') ? new URL(url).pathname : url;
  return PUBLIC_AUTH_PATHS.some((p) => path === p || path.endsWith(p));
}

const api = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    if (isPublicAuthRequest(config.url)) {
      delete config.headers.Authorization;
    } else {
      const token = localStorage.getItem('aaroh_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error('[Axios] Network Error: The API server might be down or unreachable.', error);
    } else if (error.response?.status === 401) {
      const reqUrl = error.config?.url as string | undefined;
      if (isPublicAuthRequest(reqUrl)) {
        console.warn('[Axios] 401 on auth endpoint (expected for bad credentials).', error.response?.data);
        return Promise.reject(error);
      }
      console.warn('[Axios] Unauthorized (401). Clearing session and redirecting to login...', error.response.data);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aaroh_token');
        localStorage.removeItem('aaroh_role');
        localStorage.removeItem('aaroh_user_name');
        localStorage.removeItem('aaroh_user_id');

        const cookies = ['aaroh_token', 'aaroh_role'];
        cookies.forEach((c) => {
          document.cookie = `${c}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
          document.cookie = `${c}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; domain=${window.location.hostname}`;
        });

        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      console.error('[Axios] Forbidden (403):', error.response.data);
    } else if (error.response?.status === 429) {
      console.error('Too many requests - account/IP temporarily locked.', error.response.data);
    } else if (error.response) {
      console.error('API Error Response:', error.response.status, error.response.data);
    } else {
      console.error('Unknown Axios Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
