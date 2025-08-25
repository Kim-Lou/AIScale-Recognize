import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Scale, UserCircle, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';
  
  // Use the error from auth context if available
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // For demo purposes, allow mock login
  const handleMockLogin = (e) => {
    e.preventDefault();
    // Simulate successful login with mock data
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      username: 'admin',
      name: 'Administrator'
    }));
    localStorage.setItem('token', 'mock-token');
    navigate('/');
    window.location.reload(); // Force reload to update auth state
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-light py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Scale className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">ScaleSense AI</h2>
          <p className="mt-2 text-sm text-gray-600">
            Smart Waste Management System
          </p>
        </div>
        <div className="mt-8 card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
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
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircle className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter your username"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter your password"
                />
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <p className="text-center text-sm text-gray-500 mb-2">Demo Mode</p>
              <button
                onClick={handleMockLogin}
                className="w-full btn btn-secondary"
              >
                Enter as Demo User
              </button>
              <p className="text-center text-xs text-gray-500 mt-2">
                (Bypasses backend authentication)
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
