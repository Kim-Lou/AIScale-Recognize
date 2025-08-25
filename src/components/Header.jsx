import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const { currentUser, logout } = useAuth();
  
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">ScaleSense AI</h1>
          </div>
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <User className="h-5 w-5 text-gray-400" />
              <span className="ml-2 text-sm font-medium text-gray-700">
                {currentUser?.name || 'User'}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
