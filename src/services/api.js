import axios from 'axios';
import { startOfWeek, endOfWeek, format, parseISO, addDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { API_CONFIG } from '../config';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.baseUrl,
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
  return api.get(API_CONFIG.endpoints.todayStats);
};

export const getDashboardWeeklyCustomers = (limit = 15) => {
  return api.get(`${API_CONFIG.endpoints.weeklyCustomers}?limit=${limit}`);
};

// Auth endpoints
export const login = (username, password) => {
  return api.post(API_CONFIG.endpoints.login, { username, password });
};

// User endpoints
export const getUsers = () => {
  return api.get(API_CONFIG.endpoints.users);
};

export const getUser = (id) => {
  return api.get(API_CONFIG.endpoints.user(id));
};

export const createUser = (userData) => {
  return api.post(API_CONFIG.endpoints.users, userData);
};

export const updateUser = (id, userData) => {
  return api.put(API_CONFIG.endpoints.user(id), userData);
};

export const deleteUser = (id) => {
  return api.delete(API_CONFIG.endpoints.user(id));
};

// Customer endpoints
export const getCustomers = () => {
  return api.get(API_CONFIG.endpoints.customers);
};

export const getCustomer = (id) => {
  return api.get(API_CONFIG.endpoints.customer(id));
};

export const createCustomer = (customerData) => {
  return api.post(API_CONFIG.endpoints.customers, customerData);
};

export const updateCustomer = (id, customerData) => {
  return api.put(API_CONFIG.endpoints.customer(id), customerData);
};

export const deleteCustomer = (id) => {
  return api.delete(API_CONFIG.endpoints.customer(id));
};

// Weight record endpoints
export const getWeightRecords = (page = 1, limit = 50) => {
  return api.get(`${API_CONFIG.endpoints.weights}?page=${page}&limit=${limit}`);
};

export const getCustomerWeightRecords = (customerId) => {
  return api.get(API_CONFIG.endpoints.customerWeights(customerId));
};

export const getWeightRecord = (id) => {
  return api.get(API_CONFIG.endpoints.weight(id));
};

export const createWeightRecord = (recordData) => {
  return api.post(API_CONFIG.endpoints.weights, recordData);
};

export const updateWeightRecord = (id, recordData) => {
  return api.put(API_CONFIG.endpoints.weight(id), recordData);
};

export const deleteWeightRecord = (id) => {
  return api.delete(API_CONFIG.endpoints.weight(id));
};

// File upload
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  return api.post(API_CONFIG.endpoints.upload, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Device endpoints
export const getDevices = (filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.device_id) queryParams.append('device_id', filters.device_id);
  if (filters.registered_from) queryParams.append('registered_from', filters.registered_from);
  if (filters.registered_to) queryParams.append('registered_to', filters.registered_to);
  
  const queryString = queryParams.toString();
  const url = queryString ? `${API_CONFIG.endpoints.devices}?${queryString}` : API_CONFIG.endpoints.devices;
  
  return api.get(url);
};

export const getDevice = (id) => {
  return api.get(API_CONFIG.endpoints.device(id));
};

export const createDevice = (deviceData) => {
  return api.post(API_CONFIG.endpoints.devices, deviceData);
};

export const updateDeviceUploadTime = (id) => {
  return api.put(API_CONFIG.endpoints.deviceUpload(id));
};

export const deleteDevice = (id) => {
  return api.delete(API_CONFIG.endpoints.device(id));
};

export default api;
