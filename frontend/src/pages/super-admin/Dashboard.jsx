// frontend/src/pages/super-admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Building2, TrendingUp, Users, DollarSign, Package,
  AlertCircle, CheckCircle, Clock, XCircle, Calendar,
  ArrowUp, ArrowDown, Activity, ShoppingBag
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card, Badge, LoadingSpinner } from '../../components/shared';
import api from '../../services/api';
import { formatCurrency, formatDate, daysUntil } from '../../utils/helpers';

// ─── Custom tooltip for charts ────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, prefix = '₦' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="text-gray-500 font-medium mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-bold text-gray-900">
            {prefix === '₦'
              ? `₦${Number(p.value).toLocaleString()}`
              : Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Format axis values ────────────────────────────────────────────────────────
function fmtAxis(v) {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `₦${(v / 1_000).toFixed(0)}K`;
  return v === 0 ? '' : `₦${v}`;
}

function fmtAxisCount(v) {
  return v === 0 ? '' : v;
}

// ─── Build last-N-days skeleton ───────────────────────────────────────────────
function buildDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() - (n - 1 - i) * 86400000);
    return {
      date:     d.toISOString().slice(0, 10),
      label:    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      revenue:  0,
      orders:   0,
      signups:  0,
    };
  });
}

const SuperAdminDashboard = () => {
  const [stats,                 setStats]                 = useState(null);
  const [businesses,            setBusinesses]            = useState([]);
  const [expiringSubscriptions, setExpiringSubscriptions] = useState([]);
  const [chartData,             setChartData]             = useState(buildDays(30));
  const [chartPeriod,           setChartPeriod]           = useState(30);
  const [loading,               setLoading]               = useState(true);
  const [chartLoading,          setChartLoading]          = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);
  useEffect(() => { fetchChartData(chartPeriod); }, [chartPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, businessesRes, expiringRes] = await Promise.all([
        api.get('/api/stats/super-admin'),
        api.get('/api/business?limit=5&sort=recent'),
        api.get('/api/business/expiring?days=7'),
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

  const fetchChartData = async (days) => {
    try {
      setChartLoading(true);
      const res = await api.get(`/api/stats/platform-activity?days=${days}`);
      const raw = res.data.daily || [];

      // Merge with full skeleton so days with no data still appear
      const skeleton = buildDays(days);
      const map = {};
      for (const r of raw) map[r.date] = r;
      setChartData(skeleton.map(s => ({ ...s, ...(map[s.date] || {}) })));
    } catch {
      // Fallback: keep zero skeleton — chart still renders cleanly
      setChartData(buildDays(days));
    } finally {
      setChartLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const statCards = [
    {
      title: 'Total Businesses',
      value: stats?.totalBusinesses || 0,
      change: `+${stats?.newBusinessesThisMonth || 0} this month`,
      trend: 'up', icon: Building2,
      color: 'text-blue-600', bgColor: 'bg-blue-100',
      link: '/super-admin/businesses',
    },
    {
      title: 'Active Subscriptions',
      value: stats?.activeSubscriptions || 0,
      change: stats?.subscriptionRevenue || '₦0 revenue',
      trend: 'up', icon: DollarSign,
      color: 'text-green-600', bgColor: 'bg-green-100',
      link: '/super-admin/subscriptions',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      change: `+${stats?.ordersThisMonth || 0} this month`,
      trend: 'up', icon: ShoppingBag,
      color: 'text-purple-600', bgColor: 'bg-purple-100',
      link: '/super-admin/analytics',
    },
    {
      title: 'Platform Users',
      value: stats?.totalUsers || 0,
      change: `${stats?.activeBusinesses || 0} active businesses`,
      trend: 'up', icon: Users,
      color: 'text-orange-600', bgColor: 'bg-orange-100',
      link: '/super-admin/users',
    },
  ];

  const quickStats = [
    { label: 'Pending Requests', value: stats?.pendingRequests || 0,         icon: Clock,         color: 'yellow', link: '/super-admin/requests'                    },
    { label: 'Expiring Soon',    value: expiringSubscriptions.length,         icon: AlertCircle,   color: 'orange', link: '/super-admin/subscriptions'               },
    { label: 'Suspended',        value: stats?.suspendedBusinesses || 0,      icon: XCircle,       color: 'red',    link: '/super-admin/businesses?filter=suspended' },
    { label: 'On Trial',         value: stats?.trialsActive || 0,             icon: CheckCircle,   color: 'blue',   link: '/super-admin/businesses?filter=trial'     },
  ];

  // Determine if any chart data has values (for empty state)
  const hasChartData = chartData.some(d => d.revenue > 0 || d.orders > 0 || d.signups > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Platform Overview</h1>
          <p className="text-gray-600">Manage all businesses and platform activity</p>
        </div>
        <Link to="/super-admin/businesses">
          <button className="btn btn-primary flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <span>Manage Businesses</span>
          </button>
        </Link>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Link to={stat.link}>
              <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bgColor} opacity-10 rounded-full -mr-16 -mt-16`} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 ${stat.bgColor} rounded-xl`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    {stat.trend === 'up'
                      ? <ArrowUp className="w-5 h-5 text-green-500" />
                      : <ArrowDown className="w-5 h-5 text-red-500" />}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-black text-gray-900 mb-1">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <p className="text-xs text-gray-500">{stat.change}</p>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + index * 0.05 }}>
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

      {/* ── PLATFORM ACTIVITY CHART ─────────────────────────────────────────── */}
      <Card
        title="Platform Activity"
        subtitle={`Revenue & orders — last ${chartPeriod} days`}
      >
        {/* Period selector */}
        <div className="flex items-center gap-2 mb-6">
          {[7, 14, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setChartPeriod(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                chartPeriod === d
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>

        {chartLoading ? (
          <div className="h-64 flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-4 border-t-blue-500 border-gray-200 rounded-full" />
          </div>
        ) : !hasChartData ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400">
            <Activity className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No activity data yet</p>
            <p className="text-sm mt-1 text-gray-400">Orders and revenue will appear here as they come in</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Revenue area chart */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Revenue (₦)</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false} axisLine={false}
                    interval={chartPeriod <= 14 ? 0 : chartPeriod <= 30 ? 4 : 9}
                  />
                  <YAxis
                    tickFormatter={fmtAxis}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false} axisLine={false} width={56}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone" dataKey="revenue" name="Revenue"
                    stroke="#3b82f6" strokeWidth={2.5}
                    fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#3b82f6' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Orders + signups bar chart */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Orders & New Businesses</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false} axisLine={false}
                    interval={chartPeriod <= 14 ? 0 : chartPeriod <= 30 ? 4 : 9}
                  />
                  <YAxis
                    tickFormatter={fmtAxisCount}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false} axisLine={false} width={28} allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip prefix="" />} />
                  <Legend
                    iconType="circle" iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />
                  <Bar dataKey="orders"  name="Orders"         fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="signups" name="New Businesses"  fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>

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
                      <p className="text-sm text-gray-500">{business.slug}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={business.isActive ? 'success' : 'danger'}>
                      {business.isActive ? 'Active' : 'Suspended'}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(business.createdAt, 'short')}</p>
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

        {/* Expiring Subscriptions */}
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
                      <p className="text-sm text-gray-600">{business.subscriptionPlan} plan</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="warning">{days <= 0 ? 'Expired' : `${days}d left`}</Badge>
                      <p className="text-xs text-gray-600 mt-1">{formatDate(business.subscriptionExpiry, 'short')}</p>
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
    </div>
  );
};

export default SuperAdminDashboard;