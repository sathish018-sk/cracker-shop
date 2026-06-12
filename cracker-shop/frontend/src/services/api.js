import axios from 'axios';

// Get base URL from env or fallback to local XAMPP host
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost/smcrackers/cracker-shop/backend',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If unauthorized, redirect to login and clear storage
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Force redirect if not already on login page
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
