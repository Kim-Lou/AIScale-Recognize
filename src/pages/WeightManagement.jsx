import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Filter, Trash2, Edit, Image, AlertCircle, Copy } from 'lucide-react';
import { format } from 'date-fns';
import * as api from '../services/api';
import { API_CONFIG } from '../config';

function WeightRecordModal({ isOpen, onClose, record, onSave, customers }) {
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    waste_type: '',
    bin_type: '',
    total_weight: 0,
    bin_weight: 0,
    net_weight: 0,
    image_url: ''
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (record) {
      setFormData({
        customer_id: record.customer_id || '',
        customer_name: record.customer_name || '',
        waste_type: record.waste_type || '',
        bin_type: record.bin_type || '',
        total_weight: record.total_weight || 0,
        bin_weight: record.bin_weight || 0,
        net_weight: record.net_weight || 0,
        image_url: record.image_url || ''
      });
      setFilePreview(record.image_url || null);
    } else {
      setFormData({
        customer_id: '',
        customer_name: '',
        waste_type: '',
        bin_type: '',
        total_weight: 0,
        bin_weight: 0,
        net_weight: 0,
        image_url: ''
      });
      setFilePreview(null);
    }
    setSelectedFile(null);
    setError('');
  }, [record, isOpen]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'customer_id' && value) {
      // Find customer name for the selected customer ID
      const selectedCustomer = customers.find(c => c.id === value);
      if (selectedCustomer) {
        setFormData({
          ...formData,
          customer_id: value,
          customer_name: selectedCustomer.name
        });
      }
    } else if (name === 'total_weight' || name === 'bin_weight') {
      // Calculate net weight automatically
      const total = name === 'total_weight' ? parseFloat(value) : formData.total_weight;
      const bin = name === 'bin_weight' ? parseFloat(value) : formData.bin_weight;
      const net = Math.max(0, total - bin).toFixed(1);
      
      setFormData({
        ...formData,
        [name]: parseFloat(value),
        net_weight: parseFloat(net)
      });
    } else {
      setFormData({
        ...formData,
        [name]: name === 'total_weight' || name === 'bin_weight' || name === 'net_weight' 
          ? parseFloat(value) 
          : value
      });
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      let imageUrl = formData.image_url;
      
      // If a new file was selected, upload it first
      if (selectedFile) {
        setUploading(true);
        const response = await api.uploadImage(selectedFile);
        imageUrl = response.data.filePath;
        setUploading(false);
      }
      
      // Submit the form data with the image URL
      await onSave({
        ...formData,
        image_url: imageUrl
      });
      
    } catch (err) {
      setError(err.message || 'An error occurred');
      setUploading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {record ? 'Edit Weight Record' : 'Add New Weight Record'}
        </h2>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
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
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer</label>
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                className="input mt-1"
                required
              >
                <option value="">Select customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.id} - {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                readOnly
                className="input mt-1 bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Waste Type</label>
              <select
                name="waste_type"
                value={formData.waste_type}
                onChange={handleChange}
                className="input mt-1"
                required
              >
                <option value="">Select type</option>
                <option value="Paper">Paper</option>
                <option value="Plastic">Plastic</option>
                <option value="Glass">Glass</option>
                <option value="Metal">Metal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bin Type</label>
              <select
                name="bin_type"
                value={formData.bin_type}
                onChange={handleChange}
                className="input mt-1"
                required
              >
                <option value="">Select bin</option>
                <option value="120L">120L</option>
                <option value="240L">240L</option>
                <option value="660L">660L</option>
                <option value="Cage">Cage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                name="total_weight"
                value={formData.total_weight}
                onChange={handleChange}
                className="input mt-1"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bin Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                name="bin_weight"
                value={formData.bin_weight}
                onChange={handleChange}
                className="input mt-1"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Net Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                name="net_weight"
                value={formData.net_weight}
                readOnly
                className="input mt-1 bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Weight Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1"
              />
            </div>
            
            {filePreview && (
              <div className="col-span-2 mt-2">
                <div className="border border-gray-200 rounded-md p-2">
                  <img 
                    src={filePreview} 
                    alt="Weight Record Preview" 
                    className="h-40 mx-auto object-contain"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImagePreviewModal({ imageUrl, onClose }) {
  if (!imageUrl) return null;
  
  // Check if the image URL is relative or absolute
  const fullUrl = imageUrl.startsWith('http') 
    ? imageUrl 
    : `${API_CONFIG.backendBaseUrl}${imageUrl}`;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Weighing Image</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex justify-center">
          <img src={fullUrl} alt="Weighing Record" className="max-h-96 object-contain" />
        </div>
      </div>
    </div>
  );
}

function WeighRecordIdCopyButton({ weighRecordId }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(weighRecordId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button 
      onClick={handleCopy}
      className="text-gray-500 hover:text-primary focus:outline-none relative"
      title={copied ? "Copied!" : "Copy WeighRecordId"}
    >
      <Copy className="h-4 w-4" />
      {copied && (
        <span className="absolute mt-8 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg">
          Copied!
        </span>
      )}
    </button>
  );
}

function WeightManagement() {
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterWasteType, setFilterWasteType] = useState('');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 1
  });
  
  // Fetch weight records and customers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch weight records with pagination
        const recordsResponse = await api.getWeightRecords(pagination.page, pagination.limit);
        setRecords(recordsResponse.data.records);
        setPagination(prev => ({
          ...prev,
          totalCount: recordsResponse.data.pagination.totalCount,
          totalPages: recordsResponse.data.pagination.totalPages
        }));
        
        // Fetch customers for the dropdown in the form
        const customersResponse = await api.getCustomers();
        setCustomers(customersResponse.data);
        
        setError('');
      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [pagination.page, pagination.limit]);
  
  const handleAddNew = () => {
    setCurrentRecord(null);
    setIsModalOpen(true);
  };
  
  const handleEdit = (record) => {
    setCurrentRecord(record);
    setIsModalOpen(true);
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await api.deleteWeightRecord(id);
        
        // Refresh current page data
        const recordsResponse = await api.getWeightRecords(pagination.page, pagination.limit);
        setRecords(recordsResponse.data.records);
        setPagination(prev => ({
          ...prev,
          totalCount: recordsResponse.data.pagination.totalCount,
          totalPages: recordsResponse.data.pagination.totalPages,
          // If current page is now empty and not the first page, go to previous page
          page: recordsResponse.data.records.length === 0 && pagination.page > 1 
            ? pagination.page - 1 
            : pagination.page
        }));
      } catch (err) {
        setError('Failed to delete record. Please try again.');
        console.error('Error deleting record:', err);
      }
    }
  };
  
  const handleSave = async (formData) => {
    try {
      if (currentRecord) {
        // Edit existing record
        await api.updateWeightRecord(currentRecord.id, formData);
      } else {
        // Add new record
        await api.createWeightRecord(formData);
      }
      
      // Refresh current page data
      const recordsResponse = await api.getWeightRecords(pagination.page, pagination.limit);
      setRecords(recordsResponse.data.records);
      setPagination(prev => ({
        ...prev,
        totalCount: recordsResponse.data.pagination.totalCount,
        totalPages: recordsResponse.data.pagination.totalPages
      }));
      
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving record:', err);
      throw new Error(err.response?.data?.message || 'Failed to save record');
    }
  };
  
  const handleImageClick = (imageUrl) => {
    setImagePreview(imageUrl);
  };
  
  const handleFilterChange = (e) => {
    setFilterWasteType(e.target.value);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ 
      ...prev, 
      limit: parseInt(newLimit), 
      page: 1 // Reset to first page when changing limit
    }));
  };
  
  // Apply filters and search (now applied to current page records)
  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      (record.customer_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.waste_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.weighRecordId && record.weighRecordId.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesFilter = filterWasteType ? record.waste_type === filterWasteType : true;
    
    return matchesSearch && matchesFilter;
  });
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Weight Management</h1>
        <p className="text-gray-600">Manage and track weight records</p>
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
      
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search records..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-full sm:w-auto">
              <select
                value={filterWasteType}
                onChange={handleFilterChange}
                className="input"
              >
                <option value="">All Waste Types</option>
                <option value="Paper">Paper</option>
                <option value="Plastic">Plastic</option>
                <option value="Glass">Glass</option>
                <option value="Metal">Metal</option>
              </select>
            </div>
          </div>
          
          <button 
            className="btn btn-primary flex items-center w-full sm:w-auto"
            onClick={handleAddNew}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading records...</p>
          </div>
        ) : (
          <div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>WeighRecordId</th>
                    <th>Customer ID</th>
                    <th>Customer Name</th>
                    <th>Waste Type</th>
                    <th>Bin Type</th>
                    <th>Total Weight (kg)</th>
                    <th>Bin Weight (kg)</th>
                    <th>Net Weight (kg)</th>
                    <th>Weighing Time</th>
                    <th>Image</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="flex items-center">
                          <span className="truncate max-w-[100px] mr-1" title={record.weighRecordId}>
                            {record.weighRecordId?.substring(0, 8)}...
                          </span>
                          <WeighRecordIdCopyButton weighRecordId={record.weighRecordId} />
                        </td>
                        <td>{record.customer_id}</td>
                        <td>{record.customer_name}</td>
                        <td>{record.waste_type}</td>
                        <td>{record.bin_type}</td>
                        <td>{parseFloat(record.total_weight).toFixed(1)}</td>
                        <td>{parseFloat(record.bin_weight).toFixed(1)}</td>
                        <td>{parseFloat(record.net_weight).toFixed(1)}</td>
                        <td>{format(new Date(record.weighing_time), 'MMM dd, yyyy HH:mm')}</td>
                        <td>
                          {record.image_url && (
                            <button 
                              onClick={() => handleImageClick(record.image_url)}
                              className="text-primary hover:text-primary-dark"
                            >
                              <Image className="h-5 w-5" />
                            </button>
                          )}
                        </td>
                        <td className="flex space-x-2">
                          <button 
                            onClick={() => handleEdit(record)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(record.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className="text-center py-4">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Show:</label>
                  <select
                    value={pagination.limit}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    className="input text-sm py-1 px-2 h-8"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-700">per page</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev || loading}
                    className="btn btn-secondary text-sm py-1 px-3 h-8 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext || loading}
                    className="btn btn-secondary text-sm py-1 px-3 h-8 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                
                <div className="text-sm text-gray-700">
                  Total: {pagination.totalCount} records
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <WeightRecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        record={currentRecord}
        onSave={handleSave}
        customers={customers}
      />
      
      <ImagePreviewModal 
        imageUrl={imagePreview}
        onClose={() => setImagePreview(null)}
      />
    </div>
  );
}

export default WeightManagement;
