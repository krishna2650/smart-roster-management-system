import axios from 'axios';

// Dynamically determine backend API base URL
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Auto-detect Render deployment domain (e.g. datastraw-roster-frontend -> datastraw-roster-backend)
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    const host = window.location.hostname;
    const backendHost = host.replace('-frontend', '-backend');
    if (backendHost !== host) {
      return `https://${backendHost}/api`;
    }
    return 'https://datastraw-roster-backend.onrender.com/api';
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 45000 // Allow up to 45s for Render free instances to spin up from sleep
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('datastraw_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired tokens or 401s gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('datastraw_token');
        localStorage.removeItem('datastraw_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
