import axios from 'axios';


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('api/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getActivity: () => api.get('/dashboard/activity'),
  addActivity: (data) => api.post('/dashboard/activity', data),
  removeActivity: (id) => api.delete(`/dashboard/activity/${id}`),
};

export const employeesAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  remove: (id) => api.delete(`/employees/${id}`),
  getStats: () => api.get('/employees/stats'),
};

export const attendanceAPI = {
  record: (data) => api.post('/attendance/record', data),
  getRecords: (params) => api.get('/attendance', { params }),
  getToday: () => api.get('/attendance/today'),
  getStats: (params) => api.get('/attendance/stats', { params }),
};

export const leavesAPI = {
  apply: (data) => api.post('/leaves/apply', data),
  getLeaves: (params) => api.get('/leaves', { params }),
  updateStatus: (id, data) => api.put(`/leaves/${id}/status`, data),
  deleteLeave: (id) => api.delete(`/leaves/${id}`),
  getNotifications: () => api.get('/leaves/notifications'),
  markNotificationRead: (id) => api.patch(`/leaves/notifications/${id}/read`),
  getStats: () => api.get('/leaves/stats'),
};

export const assetsAPI = {
  getAll: (params) => api.get('/assets', { params }),
  getById: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets', data),
  assign: (data) => api.post('/assets/assign', data),
  returnAsset: (id, data) => api.post(`/assets/${id}/return`, data),
  getMyAssets: () => api.get('/assets/my-assets'),
  getStats: () => api.get('/assets/stats'),
};

export const performanceAPI = {
  getAll: () => api.get('/performance'),
  addReview: (data) => api.post('/performance', data),
  updateReview: (id, data) => api.put(`/performance/${id}`, data),
  deleteReview: (id) => api.delete(`/performance/${id}`),
};

export const salaryAPI = {
  getAll: () => api.get('/salary'),
  getMyHistory: () => api.get('/salary/my-history'),
  process: (data) => api.post('/salary/process', data),
};

export default api;
