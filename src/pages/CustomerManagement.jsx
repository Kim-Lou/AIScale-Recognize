import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, PlusCircle, AlertCircle } from 'lucide-react';
import { format, isValid } from 'date-fns';
import * as api from '../services/api';

// 安全的日期显示辅助函数
const safeDateDisplay = (timeValue, formatStr = 'MMM dd, yyyy') => {
  try {
    if (!timeValue || 
        (typeof timeValue !== 'string' && typeof timeValue !== 'number')) {
      return '-';
    }
    
    const date = new Date(timeValue);
    if (isValid(date) && !isNaN(date.getTime())) {
      return format(date, formatStr);
    }
    
    return '-';
  } catch (error) {
    console.error('Date display error:', error);
    return '-';
  }
};

function CustomerModal({ isOpen, onClose, customer, onSave }) {
  const [formData, setFormData] = useState({
    id: '',
    rfid: '',
    name: '',
  });
  
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (customer) {
      setFormData({
        id: customer.id,
        rfid: customer.rfid,
        name: customer.name,
      });
    } else {
      setFormData({
        id: '',
        rfid: '',
        name: '',
      });
    }
    setError('');
  }, [customer, isOpen]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await onSave(formData);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {customer ? 'Edit Customer' : 'Add New Customer'}
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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer ID</label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleChange}
                className="input mt-1"
                placeholder="e.g. C001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">RFID Number</label>
              <input
                type="text"
                name="rfid"
                value={formData.rfid}
                onChange={handleChange}
                className="input mt-1"
                placeholder="e.g. RF12345"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input mt-1"
                required
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await api.getCustomers();
        setCustomers(response.data);
        setError('');
      } catch (err) {
        setError('Failed to load customers. Please try again.');
        console.error('Error fetching customers:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, []);
  
  const handleAddNew = () => {
    setCurrentCustomer(null);
    setIsModalOpen(true);
  };
  
  const handleEdit = (customer) => {
    setCurrentCustomer(customer);
    setIsModalOpen(true);
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await api.deleteCustomer(id);
        setCustomers(customers.filter(customer => customer.id !== id));
      } catch (err) {
        setError('Failed to delete customer. Please try again.');
        console.error('Error deleting customer:', err);
      }
    }
  };
  
  const handleSave = async (formData) => {
    try {
      if (currentCustomer) {
        // Edit existing customer
        const response = await api.updateCustomer(currentCustomer.id, formData);
        setCustomers(customers.map(customer => 
          customer.id === currentCustomer.id ? response.data : customer
        ));
      } else {
        // Add new customer
        const response = await api.createCustomer(formData);
        setCustomers([...customers, response.data]);
      }
      setIsModalOpen(false);
      return true;
    } catch (err) {
      console.error('Error saving customer:', err);
      throw new Error(err.response?.data?.message || 'Failed to save customer');
    }
  };
  
  const filteredCustomers = customers.filter(customer => 
    customer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.rfid.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
        <p className="text-gray-600">Manage customer information and records</p>
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
        <div className="flex flex-col sm:flex-row justify-between mb-4">
          <div className="relative mb-4 sm:mb-0 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search customers..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className="btn btn-primary flex items-center"
            onClick={handleAddNew}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Customer
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading customers...</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>RFID Number</th>
                  <th>Customer Name</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.id}</td>
                      <td>{customer.rfid}</td>
                      <td>{customer.name}</td>
                      <td>{safeDateDisplay(customer.created_at)}</td>
                      <td>{safeDateDisplay(customer.updated_at)}</td>
                      <td className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(customer)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(customer.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <CustomerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={currentCustomer}
        onSave={handleSave}
      />
    </div>
  );
}

export default CustomerManagement;
