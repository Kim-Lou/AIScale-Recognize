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
  // 首先检查是否有明确设置的环境变量
  const envUrl = getEnvVar('REACT_APP_API_BASE_URL');
  if (envUrl) {
    return envUrl;
  }
  
  // 检测当前环境，自动适配
  // 对于生产环境，使用相对路径，确保请求不会跨域
  // 这样可以确保在不同环境中都能正确工作
  if (typeof window !== 'undefined') {
    // 使用相对路径，这样可以确保API请求与前端页面使用相同的主机和端口
    return '/api';
  }
  
  // 服务器端渲染或测试环境的默认值
  return 'http://localhost:5001/api';
};

// 获取后端服务的基础URL（用于图片等资源访问）
const getBackendBaseUrl = () => {
  // 首先检查是否有明确设置的环境变量
  const envUrl = getEnvVar('REACT_APP_BACKEND_BASE_URL');
  if (envUrl) {
    return envUrl;
  }
  
  // 检测当前环境，自动适配
  if (typeof window !== 'undefined') {
    // 使用空字符串（相对路径），这样资源URL会相对于当前页面的URL构建
    return '';
  }
  
  // 服务器端渲染或测试环境的默认值
  return 'http://localhost:5001';
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
    upload: '/upload',
    
    // Device endpoints
    devices: '/devices',
    device: (id) => `/devices/${id}`,
    deviceUpload: (id) => `/devices/${id}/upload`
  }
};

// 分页配置
export const PAGINATION_CONFIG = {
  defaultLimit: 50,
  pageSizes: [10, 25, 50, 100]
};

// 垃圾桶默认重量配置
export const BIN_WEIGHT_CONFIG = {
  // 垃圾桶类型配置，包含不同容量的垃圾桶默认重量和尺寸信息
  bins: {
    '120L': {
      capacity: '120L',
      dimensions: '470mm*550mm',
      weight: 7.3 // 默认重量（kg）
    },
    '240L': {
      capacity: '240L',
      dimensions: '720mm*580mm',
      weight: 12.1 // 默认重量（kg）
    },
    '660L': {
      capacity: '660L',
      dimensions: '1320mm*850mm',
      weight: 40.7 // 默认重量（kg）
    }
  },
  // 获取垃圾桶默认重量的辅助函数
  getBinWeight: (capacity) => {
    const binType = BIN_WEIGHT_CONFIG.bins[capacity];
    return binType ? binType.weight : null;
  },
  // 获取所有垃圾桶类型的辅助函数
  getBinTypes: () => {
    return Object.keys(BIN_WEIGHT_CONFIG.bins);
  }
};

// 应用常量
export const APP_CONSTANTS = {
  APP_NAME: 'ScaleSense AI',
  APP_VERSION: '1.0.0',
  DEFAULT_DATE_FORMAT: 'yyyy-MM-dd',
  // 默认垃圾桶类型
  DEFAULT_BIN_CAPACITY: '240L'
};