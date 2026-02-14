// frontend/src/pages/super-admin/Analytics.jsx
import React from 'react';
import { BarChart3, TrendingUp, Activity, Calendar } from 'lucide-react';
import { Card } from '../../components/shared';

const SuperAdminAnalytics = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Platform Analytics</h1>
        <p className="text-gray-600">Detailed insights and performance metrics</p>
      </div>

      {/* Coming Soon */}
      <Card>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Analytics Dashboard Coming Soon
          </h2>
          
          <p className="text-gray-600 max-w-lg mb-8">
            Advanced analytics, charts, and insights are currently in development. 
            Check back soon for comprehensive platform metrics.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl">
            <div className="p-6 bg-gray-50 rounded-xl">
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">Revenue Trends</p>
              <p className="text-sm text-gray-600 mt-1">Track platform revenue over time</p>
            </div>

            <div className="p-6 bg-gray-50 rounded-xl">
              <Activity className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">User Activity</p>
              <p className="text-sm text-gray-600 mt-1">Monitor user engagement</p>
            </div>

            <div className="p-6 bg-gray-50 rounded-xl">
              <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">Growth Metrics</p>
              <p className="text-sm text-gray-600 mt-1">Analyze platform growth</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SuperAdminAnalytics;