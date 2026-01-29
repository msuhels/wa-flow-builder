import React, { useEffect, useState } from 'react';
import api from '../lib/axios';
import { LayoutDashboard, GitBranch, MessageSquare, CheckCircle, XCircle, Send } from 'lucide-react';

interface DashboardStats {
  totalFlows: number;
  activeFlows: number;
  messagesSentToday: number;
  deliveryStatus: Record<string, number>;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-md border border-red-200">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Flows Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Total Flows</h3>
            <div className="bg-blue-100 p-2 rounded-lg">
              <GitBranch className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalFlows || 0}</p>
        </div>

        {/* Active Flows Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Active Flows</h3>
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.activeFlows || 0}</p>
        </div>

        {/* Messages Sent Today Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Messages (Today)</h3>
            <div className="bg-purple-100 p-2 rounded-lg">
              <Send className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.messagesSentToday || 0}</p>
        </div>

        {/* Delivery Success Rate (Mockup for now based on stats) */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Delivery Status</h3>
            <div className="bg-orange-100 p-2 rounded-lg">
              <MessageSquare className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="space-y-2">
             <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sent</span>
                <span className="font-medium">{stats?.deliveryStatus['sent'] || 0}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivered</span>
                <span className="font-medium text-green-600">{stats?.deliveryStatus['delivered'] || 0}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-gray-600">Failed</span>
                <span className="font-medium text-red-600">{stats?.deliveryStatus['failed'] || 0}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Placeholder for Recent Activity or Charts */}
         <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 h-64 flex items-center justify-center text-gray-400">
            Chart Visualization Coming Soon
         </div>
         <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 h-64 flex items-center justify-center text-gray-400">
            Recent Activity Log Coming Soon
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
