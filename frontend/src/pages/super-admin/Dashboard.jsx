// frontend/src/pages/super-admin/Dashboard.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { 
  Building2, TrendingUp, Users, DollarSign, Package, 
  AlertCircle, CheckCircle, Clock, XCircle, Calendar,
  ArrowUp, ArrowDown, Activity, ShoppingBag
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, Badge, LoadingSpinner } from '../../components/shared';
import api from '../../services/api';
import { formatCurrency, formatDate, daysUntil } from '../../utils/helpers';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [expiringSubscriptions, setExpiringSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, businessesRes, expiringRes] = await Promise.all([
        api.get('/api/stats/super-admin'),
        api.get('/api/business?limit=5&sort=recent'),
        api.get('/api/business/expiring?days=7')
      ]);
      
      setStats(statsRes.data);
      setBusinesses(businessesRes.data.businesses || []);
      setExpiringSubscriptions(expiringRes.data.businesses || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const statCards = [
    {
      title: 'Total Businesses',
      value: stats?.totalBusinesses || 0,
      change: `+${stats?.newBusinessesThisMonth || 0} this month`,
      trend: 'up',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/super-admin/businesses'
    },
    {
      title: 'Active Subscriptions',
      value: stats?.activeSubscriptions || 0,
      change: `${stats?.subscriptionRevenue || 0} revenue`,
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/super-admin/subscriptions'
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      change: `+${stats?.ordersThisMonth || 0} this month`,
      trend: 'up',
      icon: ShoppingBag,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '/super-admin/analytics'
    },
    {
      title: 'Platform Users',
      value: stats?.totalUsers || 0,
      change: `${stats?.activeBusinesses || 0} active businesses`,
      trend: 'up',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      link: '/super-admin/users'
    }
  ];

  const quickStats = [
    {
      label: 'Pending Requests',
      value: stats?.pendingRequests || 0,
      icon: Clock,
      color: 'yellow',
      link: '/super-admin/requests'
    },
    {
      label: 'Expiring Soon',
      value: expiringSubscriptions.length,
      icon: AlertCircle,
      color: 'orange',
      link: '/super-admin/subscriptions'
    },
    {
      label: 'Suspended',
      value: stats?.suspendedBusinesses || 0,
      icon: XCircle,
      color: 'red',
      link: '/super-admin/businesses?filter=suspended'
    },
    {
      label: 'On Trial',
      value: stats?.trialsActive || 0,
      icon: CheckCircle,
      color: 'blue',
      link: '/super-admin/businesses?filter=trial'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Platform Overview
          </h1>
          <p className="text-gray-600">
            Manage all businesses and platform activity
          </p>
        </div>
        <Link to="/super-admin/businesses/create">
          <button className="btn btn-primary flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <span>Create Business</span>
          </button>
        </Link>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={stat.link}>
              <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bgColor} opacity-10 rounded-full -mr-16 -mt-16`} />
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 ${stat.bgColor} rounded-xl`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    {stat.trend === 'up' ? (
                      <ArrowUp className="w-5 h-5 text-green-500" />
                    ) : (
                      <ArrowDown className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-black text-gray-900 mb-1">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </p>
                    <p className="text-xs text-gray-500">{stat.change}</p>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.05 }}
          >
            <Link to={stat.link}>
              <Card className="text-center hover:shadow-md transition-shadow cursor-pointer">
                <div className={`inline-flex p-3 rounded-xl bg-${stat.color}-100 mb-3`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Businesses */}
        <Card title="Recent Businesses" subtitle="Latest onboarded businesses">
          <div className="space-y-3">
            {businesses.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No businesses yet</p>
            ) : (
              businesses.map(business => (
                <Link 
                  key={business.id} 
                  to={`/super-admin/businesses/${business.id}`}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{business.businessName}</p>
                      <p className="text-sm text-gray-500">{business.slug}.yourdomain.com</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={business.isActive ? 'success' : 'danger'}>
                      {business.isActive ? 'Active' : 'Suspended'}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(business.createdAt, 'short')}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
          {businesses.length > 0 && (
            <div className="mt-4 text-center">
              <Link to="/super-admin/businesses" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                View All Businesses →
              </Link>
            </div>
          )}
        </Card>

        {/* Expiring Subscriptions Alert */}
        <Card title="Expiring Subscriptions" subtitle="Requires attention">
          <div className="space-y-3">
            {expiringSubscriptions.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-500">All subscriptions are healthy</p>
              </div>
            ) : (
              expiringSubscriptions.map(business => {
                const days = daysUntil(business.subscriptionExpiry);
                return (
                  <Link
                    key={business.id}
                    to={`/super-admin/businesses/${business.id}/subscription`}
                    className="flex items-center justify-between p-4 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{business.businessName}</p>
                      <p className="text-sm text-gray-600">
                        {business.subscriptionPlan} plan
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="warning">
                        {days <= 0 ? 'Expired' : `${days}d left`}
                      </Badge>
                      <p className="text-xs text-gray-600 mt-1">
                        {formatDate(business.subscriptionExpiry, 'short')}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
          {expiringSubscriptions.length > 0 && (
            <div className="mt-4 text-center">
              <Link to="/super-admin/subscriptions" className="text-orange-600 hover:text-orange-700 font-medium text-sm">
                Manage Subscriptions →
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Activity Chart Section */}
      <Card title="Platform Activity" subtitle="Last 30 days">
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Activity chart coming soon</p>
            <p className="text-sm text-gray-400">Orders, Sign-ups, Revenue trends</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;