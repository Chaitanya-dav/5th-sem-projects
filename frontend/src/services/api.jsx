import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),

  register: (userData) => api.post("/auth/register", userData),

  getCurrentUser: () => api.get("/auth/me"),
};

export const employeesAPI = {
  getAll: (params) => api.get("/employees", { params }),

  getById: (id) => api.get(`/employees/${id}`),

  update: (id, data) => api.put(`/employees/${id}`, data),
};

export const attendanceAPI = {
  record: (data) => api.post("/attendance/record", data),

  getRecords: (params) => api.get("/attendance", { params }),
};

export const leavesAPI = {
  apply: (data) => api.post("/leaves/apply", data),

  getLeaves: (params) => api.get("/leaves", { params }),
};

export const assetsAPI = {
  getAll: (params) => api.get("/assets", { params }),

  assign: (data) => api.post("/assets/assign", data),
};

export default api;
 