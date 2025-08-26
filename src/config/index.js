// 统一配置管理文件
// 所有API端点和关键配置都从这里获取

// 检查环境变量是否可用的辅助函数
const getEnvVar = (key, defaultValue) => {
  // 在Vite中，环境变量需要通过import.meta.env访问
  const value = typeof window !== 'undefined' && import.meta.env
    ? import.meta.env[key]
    : process.env[key];
  return value || defaultValue;
};

// 从环境变量或默认值中获取API基础URL
const getApiBaseUrl = () => {
  return getEnvVar('REACT_APP_API_BASE_URL', 'http://localhost:5001/api');
};

// 获取后端服务的基础URL（用于图片等资源访问）
const getBackendBaseUrl = () => {
  return getEnvVar('REACT_APP_BACKEND_BASE_URL', 'http://localhost:5001');
};

// API端点配置
export const API_CONFIG = {
  baseUrl: getApiBaseUrl(),
  backendBaseUrl: getBackendBaseUrl(),
  endpoints: {
    // Auth endpoints
    login: '/auth/login',
    
    // User endpoints
    users: '/users',
    user: (id) => `/users/${id}`,
    
    // Customer endpoints
    customers: '/customers',
    customer: (id) => `/customers/${id}`,
    
    // Weight record endpoints
    weights: '/weights',
    weight: (id) => `/weights/${id}`,
    customerWeights: (customerId) => `/weights/customer/${customerId}`,
    
    // Dashboard endpoints
    todayStats: '/dashboard/today-stats',
    weeklyCustomers: '/dashboard/weekly-customers',
    
    // File upload
    upload: '/upload'
  }
};

// 分页配置
export const PAGINATION_CONFIG = {
  defaultLimit: 50,
  pageSizes: [10, 25, 50, 100]
};

// 应用常量
export const APP_CONSTANTS = {
  APP_NAME: 'ScaleSense AI',
  APP_VERSION: '1.0.0',
  DEFAULT_DATE_FORMAT: 'yyyy-MM-dd'
};