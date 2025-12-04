import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    // Don't reject requests without tokens - let the backend decide if auth is required
    
    // If data is FormData, configure it for multipart/form-data
    if (config.data instanceof FormData) {
      console.log('📤 Sending FormData - configuring for multipart upload');
      // Don't set Content-Type, let the browser set it with the boundary
      delete config.headers['Content-Type'];
      // Disable axios transformations for FormData
      config.transformRequest = [(data) => data];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('🔐 401 Unauthorized - Token invalid or expired');
      
      // Clear auth data
      const wasAuthenticated = !!localStorage.getItem('authToken');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      
      // Only redirect if user was previously authenticated (not just missing token)
      if (wasAuthenticated) {
        console.log('🔄 Redirecting to login due to expired session');
        // Use a small delay to allow state updates before redirect
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default api;