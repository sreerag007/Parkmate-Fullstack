import api from './api';

const authService = {
  // Register User
  registerUser: async (userData) => {
    // userData is already FormData from the component
    const response = await api.post('/auth/register-user/', userData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Register Owner
  registerOwner: async (ownerData) => {
    const formData = new FormData();
    Object.keys(ownerData).forEach(key => {
      if (key === 'verification_document_image' && ownerData[key]) {
        formData.append(key, ownerData[key]);
      } else {
        formData.append(key, ownerData[key]);
      }
    });
    
    const response = await api.post('/auth/register-owner/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    const { token, role, profile_id, username } = response.data;
    
    // Store auth data
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userId', profile_id);
    localStorage.setItem('username', username);
    
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    }
  },

  // Get current user info
  getCurrentUser: () => {
    return {
      token: localStorage.getItem('authToken'),
      role: localStorage.getItem('userRole'),
      userId: localStorage.getItem('userId'),
      username: localStorage.getItem('username'),
    };
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
};

export default authService;