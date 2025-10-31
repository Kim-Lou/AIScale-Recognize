import React from 'react';
import { NavLink } from 'react-router-dom';
import { Scale, Users, Building, BarChart, Monitor } from 'lucide-react';

function Sidebar() {
  const navItems = [
    {
      name: 'Dashboard',
      to: '/dashboard',
      icon: <BarChart className="h-5 w-5" />
    },
    {
      name: 'Weight Management',
      to: '/weight-management',
      icon: <Scale className="h-5 w-5" />
    },
    {
      name: 'User Management',
      to: '/user-management',
      icon: <Users className="h-5 w-5" />
    },
    {
      name: 'Customer Management',
      to: '/customer-management',
      icon: <Building className="h-5 w-5" />
    },
    {
      name: 'Device Management',
      to: '/device-management',
      icon: <Monitor className="h-5 w-5" />
    }
  ];

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-white shadow-md">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Scale className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-primary">ScaleSense AI</span>
            </div>
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-secondary hover:text-gray-900'
                    }`
                  }
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
