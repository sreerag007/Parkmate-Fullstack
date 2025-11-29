import api from './api';

const parkingService = {
  // ===== USER PROFILES =====
  getUserProfile: async () => {
    const userId = localStorage.getItem('userId');
    const response = await api.get(`/user-profiles/${userId}/`);
    return response.data;
  },

  // ===== OWNER PROFILES =====
  getOwnerProfile: async () => {
    const ownerId = localStorage.getItem('ownerId');
    const response = await api.get(`/owner-profiles/${ownerId}/`);
    return response.data;
  },

  updateOwnerProfile: async (ownerId, profileData) => {
    const response = await api.patch(`/owner-profiles/${ownerId}/`, profileData);
    return response.data;
  },

  getOwnerProfiles: async () => {
    const response = await api.get('/owner-profiles/');
    return response.data;
  },

  getOwnerLots: async (ownerId) => {
    const response = await api.get(`/owner-profiles/${ownerId}/lots/`);
    return response.data;
  },

  // ===== ADMIN - USERS =====
  getUsers: async () => {
    const response = await api.get('/user-profiles/');
    return response.data;
  },

  // ===== PARKING LOTS =====
  getLots: async () => {
    const response = await api.get('/lots/');
    return response.data;
  },

  getLotById: async (id) => {
    const response = await api.get(`/lots/${id}/`);
    return response.data;
  },

  createLot: async (lotData) => {
    const response = await api.post('/lots/', lotData);
    return response.data;
  },

  updateLot: async (id, lotData) => {
    const response = await api.patch(`/lots/${id}/`, lotData);
    return response.data;
  },

  deleteLot: async (id) => {
    const response = await api.delete(`/lots/${id}/`);
    return response.data;
  },

  // ===== PARKING SLOTS =====
  getSlots: async () => {
    const response = await api.get('/slots/');
    return response.data;
  },

  getSlotById: async (id) => {
    const response = await api.get(`/slots/${id}/`);
    return response.data;
  },

  createSlot: async (slotData) => {
    const response = await api.post('/slots/', slotData);
    return response.data;
  },

  updateSlot: async (id, slotData) => {
    const response = await api.patch(`/slots/${id}/`, slotData);
    return response.data;
  },

  deleteSlot: async (id) => {
    const response = await api.delete(`/slots/${id}/`);
    return response.data;
  },

  // ===== BOOKINGS =====
  getBookings: async () => {
    const response = await api.get('/bookings/');
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}/`);
    return response.data;
  },

  createBooking: async (bookingData) => {
    const response = await api.post('/bookings/', bookingData);
    return response.data;
  },

  updateBooking: async (id, bookingData) => {
    const response = await api.patch(`/bookings/${id}/`, bookingData);
    return response.data;
  },

  cancelBooking: async (id) => {
    const response = await api.post(`/bookings/${id}/cancel/`);
    return response.data;
  },

  renewBooking: async (id, paymentData) => {
    const response = await api.post(`/bookings/${id}/renew/`, paymentData || {});
    return response.data;
  },

  // ===== PAYMENTS =====
  getPayments: async () => {
    const response = await api.get('/payments/');
    return response.data;
  },

  createPayment: async (paymentData) => {
    const response = await api.post('/payments/', paymentData);
    return response.data;
  },

  verifyPayment: async (paymentId) => {
    const response = await api.post(`/owner/payments/${paymentId}/verify/`, { verified: true });
    return response.data;
  },

  // ===== REVIEWS =====
  getReviews: async (lotId = null) => {
    const url = lotId ? `/reviews/?lot=${lotId}` : '/reviews/';
    const response = await api.get(url);
    return response.data;
  },

  createReview: async (reviewData) => {
    const response = await api.post('/reviews/', reviewData);
    return response.data;
  },

  // ===== CAR WASH =====
  getCarwashes: async () => {
    const response = await api.get('/carwashes/');
    return response.data;
  },

  getOwnerCarwashes: async () => {
    const response = await api.get('/carwashes/owner_services/');
    return response.data;
  },

  getCarwashTypes: async () => {
    const response = await api.get('/carwashtypes/');
    return response.data;
  },

  createCarwash: async (carwashData) => {
    const response = await api.post('/carwashes/', carwashData);
    return response.data;
  },

  // ===== EMPLOYEES =====
  getEmployees: async () => {
    const response = await api.get('/employees/');
    return response.data;
  },

  createEmployee: async (employeeData) => {
    const formData = new FormData();
    Object.keys(employeeData).forEach(key => {
      formData.append(key, employeeData[key]);
    });
    
    const response = await api.post('/employees/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // ===== TASKS =====
  getTasks: async () => {
    const response = await api.get('/tasks/');
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await api.post('/tasks/', taskData);
    return response.data;
  },

  // Export api for direct use if needed
  api: api,
};

export default parkingService;