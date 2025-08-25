import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if token and user are stored in localStorage
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (e) {
        // If JSON parse fails, clear the storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);
  
  const login = async (username, password) => {
    try {
      setError('');
      
      // Always use real backend API for login
      const response = await api.login(username, password);
      const { token, user } = response.data;
      
      // Store token and user in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      return user;
    } catch (err) {
      let errorMessage = 'Invalid username or password';
      
      if (err.response) {
        errorMessage = err.response.data.message || errorMessage;
      } else if (err.request) {
        errorMessage = 'Server not responding. Please try again later.';
      } 
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  const logout = () => {
    // Clear user data and token from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    setCurrentUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };
  
  const value = {
    currentUser,
    isAuthenticated,
    error,
    login,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
