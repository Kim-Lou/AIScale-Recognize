import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, ArrowUp, ArrowDown, Scale, AlertCircle } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import * as api from '../services/api';

// Card component for waste type stats
function WasteTypeCard({ title, value, icon, color, change }) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-5 border-t-4 ${color}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold">{value} kg</h3>
        </div>
        <div className={`p-2 rounded-full ${color.replace('border', 'bg').replace('-500', '-100')}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-center">
        {change >= 0 ? (
          <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
        ) : (
          <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
        )}
        <span className={change >= 0 ? "text-green-500" : "text-red-500"}>
          {Math.abs(change)}% 
        </span>
        <span className="text-gray-500 text-sm ml-1">from yesterday</span>
      </div>
    </div>
  );
}

// Customer ranking table component
function CustomerRankingTable({ customers, loading }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Weekly Customer Ranking</h2>
        <span className="text-sm text-gray-500">
          {format(startOfWeek(new Date()), 'MMM dd')} - {format(endOfWeek(new Date()), 'MMM dd, yyyy')}
        </span>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading customer rankings...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer ID
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Weight (kg)
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weighing Count
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.length > 0 ? (
                customers.map((customer, index) => (
                  <tr key={customer.customer_id} className={index < 3 ? "bg-gray-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`
                        flex items-center justify-center w-6 h-6 rounded-full text-white font-bold 
                        ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-gray-200 text-gray-600'}
                      `}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.customer_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {customer.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-medium">{(customer.total_net_weight || 0).toFixed(1)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.weighing_count}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No data available for this week
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const [todayStats, setTodayStats] = useState({
    paper: { value: 0, change: 0 },
    plastic: { value: 0, change: 0 },
    glass: { value: 0, change: 0 },
    metal: { value: 0, change: 0 }
  });
  const [customerRankings, setCustomerRankings] = useState([]);
  const [loading, setLoading] = useState({
    stats: true,
    rankings: true
  });
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        
        // Fetch today's stats from backend API
        const statsResponse = await api.getDashboardTodayStats();
        setTodayStats(statsResponse.data);
        setLoading(prevState => ({ ...prevState, stats: false }));
        
        // Fetch weekly customer rankings from backend API
        const rankingsResponse = await api.getDashboardWeeklyCustomers();
        setCustomerRankings(rankingsResponse.data);
        setLoading(prevState => ({ ...prevState, rankings: false }));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
        
        // Set loading states to false even on error
        setLoading({
          stats: false,
          rankings: false
        });
        
        // Don't use demo data on error, let the UI handle the empty state
        setTodayStats({
          paper: { value: 0, change: 0 },
          plastic: { value: 0, change: 0 },
          glass: { value: 0, change: 0 },
          metal: { value: 0, change: 0 }
        });
        
        setCustomerRankings([]);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of today's recycling statistics and weekly customer rankings</p>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Today's Statistics Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <BarChart3 className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-medium">Today's Recycling Statistics</h2>
          <span className="ml-auto text-sm text-gray-500">{format(new Date(), 'MMMM dd, yyyy')}</span>
        </div>
        
        {loading.stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-md p-5 animate-pulse">
                <div className="flex justify-between">
                  <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                </div>
                <div className="mt-3 w-16 h-7 bg-gray-200 rounded"></div>
                <div className="mt-3 w-24 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <WasteTypeCard 
              title="Paper"
              value={todayStats.paper?.value?.toFixed(1) || '0.0'}
              icon={<Scale className="h-6 w-6 text-blue-500" />}
              color="border-blue-500"
              change={todayStats.paper?.change || 0}
            />
            <WasteTypeCard 
              title="Plastic"
              value={todayStats.plastic?.value?.toFixed(1) || '0.0'}
              icon={<Scale className="h-6 w-6 text-yellow-500" />}
              color="border-yellow-500"
              change={todayStats.plastic?.change || 0}
            />
            <WasteTypeCard 
              title="Glass"
              value={todayStats.glass?.value?.toFixed(1) || '0.0'}
              icon={<Scale className="h-6 w-6 text-green-500" />}
              color="border-green-500"
              change={todayStats.glass?.change || 0}
            />
            <WasteTypeCard 
              title="Metal"
              value={todayStats.metal?.value?.toFixed(1) || '0.0'}
              icon={<Scale className="h-6 w-6 text-red-500" />}
              color="border-red-500"
              change={todayStats.metal?.change || 0}
            />
          </div>
        )}
      </div>
      
      {/* Weekly Customer Rankings Section */}
      <div>
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-medium">Weekly Customer Rankings</h2>
        </div>
        
        <CustomerRankingTable 
          customers={customerRankings}
          loading={loading.rankings}
        />
      </div>
    </div>
  );
}

export default Dashboard;
