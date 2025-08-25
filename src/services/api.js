import axios from 'axios';
import { startOfWeek, endOfWeek, format, parseISO, addDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token to requests
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 (Unauthorized) error by redirecting to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Log error for debugging
    console.error('API Error:', error);
    
    return Promise.reject(error);
  }
);

// Dashboard endpoints
export const getDashboardTodayStats = () => {
  return api.get('/dashboard/today-stats');
};

export const getDashboardWeeklyCustomers = (limit = 15) => {
  return api.get(`/dashboard/weekly-customers?limit=${limit}`);
};



// Auth endpoints
export const login = (username, password) => {
  return api.post('/auth/login', { username, password });
};

// User endpoints
export const getUsers = () => {
  return api.get('/users');
};

export const getUser = (id) => {
  return api.get(`/users/${id}`);
};

export const createUser = (userData) => {
  return api.post('/users', userData);
};

export const updateUser = (id, userData) => {
  return api.put(`/users/${id}`, userData);
};

export const deleteUser = (id) => {
  return api.delete(`/users/${id}`);
};

// Customer endpoints
export const getCustomers = () => {
  return api.get('/customers');
};

export const getCustomer = (id) => {
  return api.get(`/customers/${id}`);
};

export const createCustomer = (customerData) => {
  return api.post('/customers', customerData);
};

export const updateCustomer = (id, customerData) => {
  return api.put(`/customers/${id}`, customerData);
};

export const deleteCustomer = (id) => {
  return api.delete(`/customers/${id}`);
};

// Weight record endpoints
export const getWeightRecords = () => {
  return api.get('/weights');
};

export const getCustomerWeightRecords = (customerId) => {
  return api.get(`/weights/customer/${customerId}`);
};

export const getWeightRecord = (id) => {
  return api.get(`/weights/${id}`);
};

export const createWeightRecord = (recordData) => {
  return api.post('/weights', recordData);
};

export const updateWeightRecord = (id, recordData) => {
  return api.put(`/weights/${id}`, recordData);
};

export const deleteWeightRecord = (id) => {
  return api.delete(`/weights/${id}`);
};

// File upload
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  return axios.post('http://localhost:8080/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
};

export default api;
