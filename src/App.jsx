import React, { Component } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WeightManagement from './pages/WeightManagement';
import UserManagement from './pages/UserManagement';
import CustomerManagement from './pages/CustomerManagement';
import DeviceManagement from './pages/DeviceManagement';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// 简单的ErrorBoundary组件
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-center text-red-600">时间数据异常，请刷新</div>;
    }

    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="weight-management" element={<ErrorBoundary><WeightManagement /></ErrorBoundary>} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="customer-management" element={<CustomerManagement />} />
          <Route path="device-management" element={<DeviceManagement />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
