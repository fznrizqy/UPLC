import axios from 'axios';

// Get LAN backend host dynamically from current browser window.location.hostname
// This allows any PC on the local network (LAN) to automatically communicate with the host's backend!
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // If NEXT_PUBLIC_API_URL is explicitly set, use it
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && !envUrl.includes('localhost')) {
      return envUrl;
    }
    // If accessed through tunnels, ngrok, or reverse proxy (non-IP / non-standard LAN hostnames),
    // use relative path `/api/v1` so Next.js rewrite proxies it to backend seamlessly
    const hostname = window.location.hostname;
    const isLocalOrLanIp =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname);

    if (!isLocalOrLanIp) {
      return '/api/v1';
    }

    // Standard local LAN access (e.g. 10.10.20.53:3000 -> 10.10.20.53:8000)
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:8000/api/v1`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
};

const api = axios.create();

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { getApiBaseUrl };
