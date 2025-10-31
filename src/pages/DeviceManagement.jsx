import React, { useState, useEffect } from 'react';
import { Search, Trash2, AlertCircle } from 'lucide-react';
import { format, isValid } from 'date-fns';
import * as api from '../services/api';

// 安全的日期显示辅助函数，将UTC时间转换为东八区时间
const safeDateDisplay = (timeValue, formatStr = 'MMM dd, yyyy HH:mm') => {
  try {
    if (!timeValue || 
        (typeof timeValue !== 'string' && typeof timeValue !== 'number')) {
      return '-';
    }
    
    // 创建日期对象
    const date = new Date(timeValue);
    
    if (isValid(date) && !isNaN(date.getTime())) {
      // 将UTC时间转换为东八区时间（+8小时）
      const utcTime = date.getTime();
      const eastEightTime = utcTime + 8 * 60 * 60 * 1000;
      const localDate = new Date(eastEightTime);
      
      return format(localDate, formatStr);
    }
    
    return '-';
  } catch (error) {
    console.error('Date display error:', error);
    return '-';
  }
};

function DeviceManagement() {
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [registeredFrom, setRegisteredFrom] = useState('');
  const [registeredTo, setRegisteredTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterApplied, setFilterApplied] = useState(false);
  
  // Fetch devices with filters
  const fetchDevices = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await api.getDevices(filters);
      // 从嵌套结构中获取devices数组
      setDevices(response.data.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load devices. Please try again.');
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchDevices();
  }, []);
  
  // Handle search and filters
  const handleSearch = () => {
    const filters = {};
    let hasFilter = false;
    
    if (searchTerm.trim()) {
      filters.device_id = searchTerm.trim();
      hasFilter = true;
    }
    
    if (registeredFrom) {
      filters.registered_from = registeredFrom;
      hasFilter = true;
    }
    
    if (registeredTo) {
      // 设置为当天的结束时间
      const toDate = new Date(registeredTo);
      toDate.setHours(23, 59, 59, 999);
      filters.registered_to = toDate.toISOString();
      hasFilter = true;
    }
    
    setFilterApplied(hasFilter);
    fetchDevices(filters);
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setRegisteredFrom('');
    setRegisteredTo('');
    setFilterApplied(false);
    fetchDevices();
  };
  
  // Handle delete device
  const handleDelete = async (deviceId) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        await api.deleteDevice(deviceId);
        setDevices(devices.filter(device => device.device_id !== deviceId));
        // 显示成功消息（可以通过状态管理改进）
        alert('Device deleted successfully');
      } catch (err) {
        setError('Failed to delete device. Please try again.');
        console.error('Error deleting device:', err);
      }
    }
  };
  
  // 复制文本到剪贴板
  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${fieldName} copied to clipboard`);
    }).catch(() => {
      alert('Failed to copy text');
    });
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
        <p className="text-gray-600">Manage device information and registration</p>
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}
      
      <div className="card mb-6">
        <div className="p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Search & Filters</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Device ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by Device ID"
                  className="input pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Registered From</label>
              <input
                type="date"
                className="input w-full"
                value={registeredFrom}
                onChange={(e) => setRegisteredFrom(e.target.value)}
              />
            </div>
            <div className="min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Registered To</label>
              <input
                type="date"
                className="input w-full"
                value={registeredTo}
                onChange={(e) => setRegisteredTo(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <button 
                className="btn btn-primary"
                onClick={handleSearch}
              >
                Apply Filters
              </button>
              {(filterApplied || searchTerm || registeredFrom || registeredTo) && (
                <button 
                  className="btn btn-secondary"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading devices...</p>
          </div>
        ) : (
          <div className="table-container overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="text-uppercase">Device ID</th>
                  <th className="text-uppercase">API KEY</th>
                  <th className="text-uppercase">REGISTRATION STATUS</th>
                  <th className="text-uppercase">REGISTRATION INFO</th>
                  <th className="text-uppercase">LAST UPLOADED</th>
                  <th className="text-uppercase">REGISTER AT</th>
                  <th className="text-uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {devices.length > 0 ? (
                  devices.map((device) => (
                    <tr key={device.device_id}>
                      <td className="font-mono text-sm">
                        <div className="flex items-center">
                          <span>{device.device_id}</span>
                          <button 
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            onClick={() => copyToClipboard(device.device_id, 'Device ID')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="font-mono text-sm">
                        <div className="flex items-center">
                          <span className="truncate max-w-[200px]">{device.api_key}</span>
                          <button 
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            onClick={() => copyToClipboard(device.api_key, 'API Key')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${device.registration_status === 'success' ? 'bg-green-100 text-green-800' : device.registration_status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {device.registration_status}
                        </span>
                      </td>
                      <td>{device.registration_info || '-'}</td>
                      <td>{safeDateDisplay(device.last_uploaded_at)}</td>
                      <td>{safeDateDisplay(device.registered_at)}</td>
                      <td className="flex space-x-2">
                        <button 
                          onClick={() => handleDelete(device.device_id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-gray-100 p-3 mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <path d="M21 15l-5-5L5 21"></path>
                          </svg>
                        </div>
                        <p className="text-gray-500">No devices found</p>
                        {filterApplied && (
                          <button 
                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                            onClick={handleClearFilters}
                          >
                            Clear filters to view all devices
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeviceManagement;