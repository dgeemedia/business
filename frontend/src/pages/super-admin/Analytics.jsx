// frontend/src/pages/super-admin/Analytics.jsx
// Full analytics page — uses existing backend endpoints:
//   GET /api/stats/super-admin          → headline numbers
//   GET /api/stats/platform-activity    → daily revenue / orders / signups
//   GET /api/stats/all-businesses       → per-business revenue breakdown
//
// Charts: Recharts (already installed for Dashboard.jsx)
// No new backend code required.

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, ShoppingBag, Building2, DollarSign, Users,
  Package, BarChart3, Activity, Calendar, ArrowUp, ArrowDown,
  Download, RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell,
} from 'recharts';
import { Card, LoadingSpinner, Button } from '../../components/shared';
import api from '../../services/api';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/helpers';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtAxis(v) {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `₦${(v / 1_000).toFixed(0)}K`;
  return v === 0 ? '' : `₦${v}`;
}
function fmtCount(v) { return v === 0 ? '' : v; }
function fmtRevenue(n) {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `₦${(v / 1_000).toFixed(0)}K`;
  return `₦${v.toLocaleString()}`;
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, currency = true }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-xl px-4 py-3 text-sm min-w-[140px]">
      <p className="text-gray-500 font-medium mb-2 text-xs">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-500 text-xs">{p.name}</span>
          </div>
          <span className="font-bold text-gray-900 text-xs">
            {currency && p.dataKey === 'revenue'
              ? `₦${Number(p.value).toLocaleString()}`
              : Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, icon: Icon, color, bgColor, trend, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 ${bgColor} opacity-10 rounded-full -mr-16 -mt-16`} />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 ${bgColor} rounded-xl`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            {trend !== undefined && (
              trend >= 0
                ? <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600"><ArrowUp className="w-3 h-3"/>{trend}%</span>
                : <span className="flex items-center gap-0.5 text-xs font-semibold text-red-500"><ArrowDown className="w-3 h-3"/>{Math.abs(trend)}%</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-black text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Period selector ──────────────────────────────────────────────────────────
function PeriodSelector({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {[7, 14, 30, 90].map(d => (
        <button key={d} onClick={() => onChange(d)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            value === d ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          {d}d
        </button>
      ))}
    </div>
  );
}

// ─── Build day skeleton ───────────────────────────────────────────────────────
function buildDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() - (n - 1 - i) * 86400000);
    return {
      date:    d.toISOString().slice(0, 10),
      label:   d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      revenue: 0, orders: 0, signups: 0,
    };
  });
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4'];

// ─── Main ─────────────────────────────────────────────────────────────────────
const SuperAdminAnalytics = () => {
  const [stats,         setStats]         = useState(null);
  const [chartData,     setChartData]     = useState(buildDays(30));
  const [bizStats,      setBizStats]      = useState([]);
  const [period,        setPeriod]        = useState(30);
  const [loading,       setLoading]       = useState(true);
  const [chartLoading,  setChartLoading]  = useState(false);
  const [bizLoading,    setBizLoading]    = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // ── Fetch headline stats ─────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/api/stats/super-admin');
      setStats(res.data);
    } catch (e) {
      console.error('Failed to fetch stats', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch activity chart ─────────────────────────────────────────────────
  const fetchChart = useCallback(async (days) => {
    setChartLoading(true);
    try {
      const res  = await api.get(`/api/stats/platform-activity?days=${days}`);
      const raw  = res.data.daily || [];
      const skel = buildDays(days);
      const map  = {};
      for (const r of raw) map[r.date] = r;
      setChartData(skel.map(s => ({ ...s, ...(map[s.date] || {}) })));
    } catch {
      setChartData(buildDays(days));
    } finally {
      setChartLoading(false);
    }
  }, []);

  // ── Fetch per-business stats ─────────────────────────────────────────────
  const fetchBizStats = useCallback(async () => {
    setBizLoading(true);
    try {
      const res = await api.get('/api/stats/all-businesses');
      // Sort by total revenue desc
      const sorted = (res.data.businesses || []).sort(
        (a, b) => Number(b.totalRevenue) - Number(a.totalRevenue)
      );
      setBizStats(sorted);
    } catch (e) {
      console.error('Failed to fetch biz stats', e);
    } finally {
      setBizLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); fetchBizStats(); }, []);
  useEffect(() => { fetchChart(period); }, [period]);

  const handleRefresh = () => {
    fetchStats();
    fetchChart(period);
    fetchBizStats();
    setLastRefreshed(new Date());
  };

  // ── CSV export ───────────────────────────────────────────────────────────
  const handleExportBizCSV = () => {
    const rows = bizStats.map(b => ({
      'Business':          b.businessName,
      'Slug':              b.slug,
      'Total Revenue (₦)': Number(b.totalRevenue || 0).toFixed(2),
      'Revenue Today (₦)': Number(b.revenueToday || 0).toFixed(2),
      'Revenue Month (₦)': Number(b.revenueThisMonth || 0).toFixed(2),
      'Revenue Year (₦)':  Number(b.revenueThisYear || 0).toFixed(2),
      'Total Orders':      b.totalOrders || 0,
      'Products':          b.totalProducts || 0,
      'Listed Since':      b.listedSince ? formatDate(b.listedSince, 'medium') : '',
    }));
    exportToCSV(rows, 'platform-business-revenue');
  };

  const handleExportActivityCSV = () => {
    const rows = chartData.map(d => ({
      'Date':        d.date,
      'Revenue (₦)': Number(d.revenue).toFixed(2),
      'Orders':      d.orders,
      'New Businesses': d.signups,
    }));
    exportToCSV(rows, `platform-activity-${period}d`);
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const hasChartData  = chartData.some(d => d.revenue > 0 || d.orders > 0 || d.signups > 0);
  const top5Biz       = bizStats.slice(0, 5);
  const pieData       = top5Biz.map(b => ({ name: b.businessName, value: Number(b.totalRevenue || 0) }));

  // Totals from chart window
  const windowRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const windowOrders  = chartData.reduce((s, d) => s + d.orders,  0);
  const windowSignups = chartData.reduce((s, d) => s + d.signups, 0);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-1">Platform Analytics</h1>
          <p className="text-gray-500 text-sm">
            Last refreshed: {lastRefreshed.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* ── Headline stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard delay={0}    title="Total Revenue"        value={fmtRevenue(stats?.totalRevenue)}      sub={`₦${(stats?.revenueThisMonth||0).toLocaleString()} this month`} icon={DollarSign}  color="text-green-600"  bgColor="bg-green-100"  />
        <StatCard delay={0.05} title="Total Orders"         value={(stats?.totalOrders||0).toLocaleString()}  sub={`+${stats?.ordersThisMonth||0} this month`}               icon={ShoppingBag} color="text-blue-600"   bgColor="bg-blue-100"   />
        <StatCard delay={0.1}  title="Total Businesses"     value={(stats?.totalBusinesses||0).toLocaleString()} sub={`${stats?.activeBusinesses||0} active`}               icon={Building2}   color="text-purple-600" bgColor="bg-purple-100" />
        <StatCard delay={0.15} title="Platform Users"       value={(stats?.totalUsers||0).toLocaleString()}      sub={`${stats?.trialsActive||0} on trial`}                  icon={Users}       color="text-orange-600" bgColor="bg-orange-100" />
      </div>

      {/* ── Secondary stat row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenue Today',     val: fmtRevenue(stats?.revenueToday),      color: 'emerald' },
          { label: 'Revenue This Year', val: fmtRevenue(stats?.revenueThisYear),   color: 'blue'    },
          { label: 'Active Subs',       val: (stats?.activeSubscriptions||0),      color: 'green'   },
          { label: 'Suspended',         val: (stats?.suspendedBusinesses||0),      color: 'red'     },
        ].map(({ label, val, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
            <div className={`bg-${color}-50 border border-${color}-100 rounded-2xl p-4`}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-xl font-black text-${color}-700`}>{val}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Period activity summary cards ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: `Revenue (${period}d)`, val: fmtRevenue(windowRevenue), icon: DollarSign, color: 'blue'   },
          { label: `Orders (${period}d)`,  val: windowOrders.toLocaleString(),   icon: ShoppingBag, color: 'purple' },
          { label: `New Biz (${period}d)`, val: windowSignups.toLocaleString(),  icon: Building2,   color: 'green'  },
        ].map(({ label, val, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + i * 0.05 }}>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
              <div className={`w-10 h-10 bg-${color}-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{val}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Revenue chart ────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-gray-900">Revenue Over Time</h2>
            <p className="text-xs text-gray-400 mt-0.5">Daily revenue across all businesses</p>
          </div>
          <div className="flex items-center gap-3">
            <PeriodSelector value={period} onChange={setPeriod} />
            <button onClick={handleExportActivityCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors">
              <Download className="w-3.5 h-3.5"/> Export
            </button>
          </div>
        </div>

        {chartLoading ? (
          <div className="h-56 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : !hasChartData ? (
          <div className="h-56 flex flex-col items-center justify-center text-gray-400">
            <Activity className="w-10 h-10 mb-3 opacity-30"/>
            <p className="font-medium text-sm">No activity in this period yet</p>
            <p className="text-xs mt-1">Revenue will appear here as orders come in</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                interval={period <= 14 ? 0 : period <= 30 ? 4 : 9}/>
              <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={54}/>
              <Tooltip content={<ChartTooltip />}/>
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2.5}
                fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#3b82f6' }}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ── Orders + signups ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Orders bar chart */}
        <Card>
          <div className="mb-5">
            <h2 className="font-bold text-gray-900">Orders per Day</h2>
            <p className="text-xs text-gray-400 mt-0.5">All orders across the platform</p>
          </div>
          {chartLoading ? (
            <div className="h-44 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                  interval={period <= 14 ? 0 : period <= 30 ? 4 : 9}/>
                <YAxis tickFormatter={fmtCount} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={24} allowDecimals={false}/>
                <Tooltip content={<ChartTooltip currency={false} />}/>
                <Bar dataKey="orders" name="Orders" fill="#8b5cf6" radius={[4,4,0,0]} maxBarSize={24}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* New businesses line chart */}
        <Card>
          <div className="mb-5">
            <h2 className="font-bold text-gray-900">New Businesses</h2>
            <p className="text-xs text-gray-400 mt-0.5">Daily signups / onboarding approvals</p>
          </div>
          {chartLoading ? (
            <div className="h-44 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                  interval={period <= 14 ? 0 : period <= 30 ? 4 : 9}/>
                <YAxis tickFormatter={fmtCount} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={24} allowDecimals={false}/>
                <Tooltip content={<ChartTooltip currency={false} />}/>
                <Line type="monotone" dataKey="signups" name="New Businesses" stroke="#10b981" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── Top businesses + pie chart ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue leaderboard */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-gray-900">Top Businesses by Revenue</h2>
                <p className="text-xs text-gray-400 mt-0.5">All-time total revenue</p>
              </div>
              <button onClick={handleExportBizCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors">
                <Download className="w-3.5 h-3.5"/> Export CSV
              </button>
            </div>

            {bizLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : bizStats.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30"/>
                <p className="text-sm">No revenue data yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Table header */}
                <div className="grid grid-cols-5 gap-2 px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <div className="col-span-2">Business</div>
                  <div className="text-right">Today</div>
                  <div className="text-right">Month</div>
                  <div className="text-right">Total</div>
                </div>
                {bizStats.slice(0, 10).map((b, i) => {
                  const maxRev = bizStats[0]?.totalRevenue || 1;
                  const pct    = Math.max(2, Math.round((Number(b.totalRevenue) / Number(maxRev)) * 100));
                  return (
                    <motion.div key={b.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="grid grid-cols-5 gap-2 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors items-center"
                    >
                      <div className="col-span-2 flex items-center gap-2.5 min-w-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                          i === 0 ? 'bg-yellow-400 text-white' :
                          i === 1 ? 'bg-gray-400 text-white'   :
                          i === 2 ? 'bg-amber-600 text-white'  :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-sm truncate">{b.businessName}</p>
                          <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }}/>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-700">{fmtRevenue(b.revenueToday)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-700">{fmtRevenue(b.revenueThisMonth)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-green-700">{fmtRevenue(b.totalRevenue)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Revenue share pie */}
        <Card>
          <h2 className="font-bold text-gray-900 mb-1">Revenue Share</h2>
          <p className="text-xs text-gray-400 mb-5">Top 5 businesses</p>

          {bizLoading || pieData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <Activity className="w-8 h-8 opacity-30 mb-2"/>
              <p className="text-xs">No data yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`₦${Number(v).toLocaleString()}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}/>
                      <span className="text-gray-600 truncate">{d.name}</span>
                    </div>
                    <span className="font-bold text-gray-900 ml-2 flex-shrink-0">{fmtRevenue(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── Platform health summary ──────────────────────────────────────── */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-5">Platform Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Subscription Health',
              val:   stats?.activeSubscriptions || 0,
              total: stats?.totalBusinesses || 1,
              color: 'green',
              sub:   `${stats?.activeSubscriptions || 0} of ${stats?.totalBusinesses || 0} on paid plans`,
            },
            {
              label: 'Trial Conversion',
              val:   (stats?.totalBusinesses || 0) - (stats?.trialsActive || 0),
              total: stats?.totalBusinesses || 1,
              color: 'blue',
              sub:   `${stats?.trialsActive || 0} still on trial`,
            },
            {
              label: 'Active Rate',
              val:   stats?.activeBusinesses || 0,
              total: stats?.totalBusinesses || 1,
              color: 'purple',
              sub:   `${stats?.suspendedBusinesses || 0} suspended`,
            },
            {
              label: 'Pending Requests',
              val:   0,
              total: Math.max(stats?.pendingRequests || 0, 1),
              // Use pendingRequests as "remaining" — full bar if 0 pending
              color: stats?.pendingRequests > 0 ? 'orange' : 'green',
              sub:   `${stats?.pendingRequests || 0} awaiting review`,
              invertBar: true,
            },
          ].map(({ label, val, total, color, sub, invertBar }) => {
            const pct = invertBar
              ? Math.max(0, 100 - Math.min(100, Math.round(((stats?.pendingRequests||0) / Math.max(stats?.totalBusinesses||1, 1)) * 100)))
              : Math.min(100, Math.round((val / total) * 100));
            return (
              <div key={label} className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-semibold text-gray-700">{label}</p>
                  <p className={`text-sm font-black text-${color}-600`}>{pct}%</p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full bg-${color}-500 rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                  />
                </div>
                <p className="text-[11px] text-gray-400">{sub}</p>
              </div>
            );
          })}
        </div>
      </Card>

    </div>
  );
};

export default SuperAdminAnalytics;