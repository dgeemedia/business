// frontend/src/pages/Analytics.jsx
// Store Analytics — business-facing (signed-in tenants only)
//
// Uses existing endpoint: GET /api/stats/business/:id
// Returns: totalRevenue, revenueToday, revenueThisMonth, revenueThisYear,
//          totalOrders, ordersThisMonth, totalProducts, totalUsers,
//          pendingOrders, deliveredOrders, cancelledOrders,
//          dailyRevenue [ { date, revenue } ]   ← last 30 days
//
// Route:  /dashboard/analytics
// Nav:    add to DashboardLayout navItems (see bottom of this file for instructions)

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, ShoppingBag, Package, Users, DollarSign,
  CheckCircle, XCircle, Clock, BarChart3, Activity,
  ArrowUp, ArrowDown, Download, RefreshCw, Zap,
  Star, Calendar, Eye, AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import api from '../services/api';
import useBusinessStore from '../stores/businessStore';
import { formatDate, exportToCSV } from '../utils/helpers';
import { LoadingSpinner } from '../components/shared';
import toast from 'react-hot-toast';

// ─── Constants ───────────────────────────────────────────────────────────────
const BRAND   = '#f97316';
const EMERALD = '#10b981';
const BLUE    = '#3b82f6';
const PURPLE  = '#8b5cf6';
const PIE_COLORS = [EMERALD, BRAND, '#ef4444'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtN(n) {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `₦${(v / 1_000).toFixed(0)}K`;
  return `₦${v.toLocaleString('en-NG')}`;
}
function fmtAxis(v) {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `₦${(v / 1_000).toFixed(0)}K`;
  return v === 0 ? '' : `₦${v}`;
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-xl rounded-xl px-4 py-3 text-xs min-w-[140px]">
      <p className="text-gray-400 font-semibold mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }}/>
            {p.name}
          </span>
          <span className="font-black text-gray-900">
            {p.dataKey === 'revenue'
              ? `₦${Number(p.value).toLocaleString('en-NG')}`
              : Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, accent = 'orange', delta, delay = 0 }) {
  const a = {
    orange: { ring: 'bg-orange-100', icon: 'text-orange-600' },
    green:  { ring: 'bg-emerald-100', icon: 'text-emerald-600' },
    blue:   { ring: 'bg-blue-100',  icon: 'text-blue-600'  },
    purple: { ring: 'bg-purple-100', icon: 'text-purple-600' },
    red:    { ring: 'bg-red-100',   icon: 'text-red-600'   },
  }[accent] || { ring: 'bg-orange-100', icon: 'text-orange-600' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden"
    >
      <div className={`absolute -top-8 -right-8 w-24 h-24 ${a.ring} opacity-40 rounded-full pointer-events-none`}/>
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 ${a.ring} rounded-xl flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${a.icon}`}/>
          </div>
          {delta !== undefined && (
            <span className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-1 rounded-full ${
              delta >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'
            }`}>
              {delta >= 0 ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-1 leading-snug">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, sub, children, action }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div>
          <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Period selector ──────────────────────────────────────────────────────────
function PeriodSelector({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {[7, 14, 30].map(d => (
        <button key={d} onClick={() => onChange(d)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            value === d
              ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}>
          {d}d
        </button>
      ))}
    </div>
  );
}

// ─── Build skeleton days ──────────────────────────────────────────────────────
function buildSkeleton(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() - (n - 1 - i) * 86_400_000);
    return {
      date:    d.toISOString().slice(0, 10),
      label:   d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      revenue: 0,
    };
  });
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BusinessAnalytics() {
  const { currentBusiness } = useBusinessStore();
  const bizId = currentBusiness?.id;

  const [stats,      setStats]      = useState(null);
  const [chart,      setChart]      = useState(buildSkeleton(30));
  const [period,     setPeriod]     = useState(30);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastAt,     setLastAt]     = useState(new Date());

  // ── Fetch data ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!bizId) return;
    try {
      const res = await api.get(`/api/stats/business/${bizId}`);
      setStats(res.data);

      // Merge dailyRevenue into 30-day skeleton
      const raw = res.data.dailyRevenue || [];
      const map = {};
      for (const r of raw) map[r.date] = r;
      const skel = buildSkeleton(30);
      setChart(skel.map(s => ({ ...s, revenue: map[s.date]?.revenue ?? 0 })));
    } catch {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bizId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setLastAt(new Date());
    toast.success('Analytics refreshed');
  };

  // ── Period slice ────────────────────────────────────────────────────────
  const visibleChart  = chart.slice(-period);
  const windowRevenue = visibleChart.reduce((s, d) => s + d.revenue, 0);
  const hasChart      = visibleChart.some(d => d.revenue > 0);

  // ── CSV export ──────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!hasChart) return toast.error('No revenue data to export');
    exportToCSV(
      visibleChart.map(d => ({
        'Date':        d.date,
        'Revenue (₦)': Number(d.revenue).toFixed(2),
      })),
      `${currentBusiness?.slug || 'store'}-revenue-${period}d`
    );
    toast.success('CSV exported');
  };

  if (loading) return <LoadingSpinner fullScreen/>;

  if (!stats) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <BarChart3 className="w-12 h-12 mb-3 opacity-30"/>
      <p>Analytics unavailable</p>
    </div>
  );

  // ── Derived stats ───────────────────────────────────────────────────────
  const {
    totalRevenue, revenueToday, revenueThisMonth, revenueThisYear,
    totalOrders,  ordersThisMonth,
    pendingOrders, deliveredOrders, cancelledOrders,
    totalProducts, totalUsers,
  } = stats;

  const fulfillmentRate  = totalOrders > 0 ? Math.round((deliveredOrders  / totalOrders) * 100) : 0;
  const cancellationRate = totalOrders > 0 ? Math.round((cancelledOrders  / totalOrders) * 100) : 0;

  const pieData = [
    { name: 'Delivered', value: deliveredOrders || 0 },
    { name: 'Pending',   value: pendingOrders   || 0 },
    { name: 'Cancelled', value: cancelledOrders || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-1">Store Analytics</h1>
          <p className="text-gray-400 text-sm">
            {currentBusiness?.businessName} · Last updated{' '}
            {lastAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}/>
          Refresh
        </button>
      </div>

      {/* ── Revenue KPIs ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard delay={0}    label="Revenue Today"    value={fmtN(revenueToday)}    sub="Delivered / paid orders today" icon={DollarSign}  accent="orange"/>
        <KpiCard delay={0.06} label="This Month"       value={fmtN(revenueThisMonth)} sub={`${ordersThisMonth} orders this month`} icon={TrendingUp} accent="green"/>
        <KpiCard delay={0.12} label="This Year"        value={fmtN(revenueThisYear)}  sub="Jan – now"                   icon={BarChart3}   accent="blue"/>
        <KpiCard delay={0.18} label="All-Time Revenue" value={fmtN(totalRevenue)}     sub="Since you launched"          icon={Star}        accent="purple"/>
      </div>

      {/* ── Order KPIs ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard delay={0.22} label="Total Orders"     value={totalOrders.toLocaleString()}    sub={`${pendingOrders} pending now`}          icon={ShoppingBag}  accent="blue"/>
        <KpiCard delay={0.26} label="Delivered"        value={deliveredOrders.toLocaleString()} sub={`${fulfillmentRate}% fulfillment rate`}  icon={CheckCircle}  accent="green"/>
        <KpiCard delay={0.30} label="Cancelled"        value={cancelledOrders.toLocaleString()} sub={`${cancellationRate}% cancellation rate`} icon={XCircle}     accent="red"/>
        <KpiCard delay={0.34} label="Products / Buyers" value={`${totalProducts} / ${totalUsers}`} sub="Catalogue · unique customers"        icon={Package}      accent="purple"/>
      </div>

      {/* ── Revenue chart ───────────────────────────────────────────────── */}
      <Section
        title="Revenue Over Time"
        sub={`${period}-day window · ${fmtN(windowRevenue)} total`}
        action={
          <div className="flex items-center gap-2">
            <PeriodSelector value={period} onChange={setPeriod}/>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 ml-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5"/> CSV
            </button>
          </div>
        }
      >
        {!hasChart ? (
          <div className="h-52 flex flex-col items-center justify-center text-gray-300">
            <Activity className="w-10 h-10 mb-3"/>
            <p className="text-sm font-medium text-gray-400">No revenue data in this period</p>
            <p className="text-xs mt-1 text-gray-300">Revenue appears when orders are delivered or paid</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={visibleChart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={BRAND} stopOpacity={0.22}/>
                  <stop offset="95%" stopColor={BRAND} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                interval={period <= 7 ? 0 : period <= 14 ? 1 : 4}/>
              <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={54}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="revenue" name="Revenue"
                stroke={BRAND} strokeWidth={2.5}
                fill="url(#revGrad)" dot={false}
                activeDot={{ r: 5, fill: BRAND }}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* ── Order breakdown + Scorecard ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pie chart */}
        <Section title="Order Status" sub="All-time breakdown">
          {pieData.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-gray-300">
              <ShoppingBag className="w-8 h-8 mb-2 opacity-40"/>
              <p className="text-sm">No orders yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={78}
                    paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]}/>)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v.toLocaleString(), n]}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }}/>
                      {d.name}
                    </span>
                    <span className="font-bold text-gray-900">{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>

        {/* Scorecard bars */}
        <div className="lg:col-span-2">
          <Section title="Performance Scorecard" sub="Store health at a glance">
            <div className="space-y-6">
              {[
                {
                  label:  'Fulfillment Rate',
                  value:  fulfillmentRate,
                  sub:    `${deliveredOrders} of ${totalOrders} orders delivered`,
                  color:  fulfillmentRate >= 80 ? 'bg-emerald-500' : fulfillmentRate >= 50 ? 'bg-amber-400' : 'bg-red-400',
                  badge:  fulfillmentRate >= 80 ? { text: 'Excellent', cls: 'bg-emerald-100 text-emerald-700' }
                        : fulfillmentRate >= 50 ? { text: 'Moderate',  cls: 'bg-amber-100 text-amber-700'   }
                        : { text: 'Needs work', cls: 'bg-red-100 text-red-700' },
                },
                {
                  label:  'Order Completion',
                  value:  totalOrders > 0 ? Math.max(0, 100 - cancellationRate) : 0,
                  sub:    `${cancelledOrders} cancelled · ${cancellationRate}% cancellation rate`,
                  color:  cancellationRate <= 5 ? 'bg-emerald-500' : cancellationRate <= 15 ? 'bg-amber-400' : 'bg-red-400',
                  badge:  cancellationRate <= 5  ? { text: 'Low cancellations', cls: 'bg-emerald-100 text-emerald-700' }
                        : cancellationRate <= 15 ? { text: 'Watch this', cls: 'bg-amber-100 text-amber-700' }
                        : { text: 'High cancellations', cls: 'bg-red-100 text-red-700' },
                },
                {
                  label: 'Catalogue Size',
                  value: Math.min(100, Math.round((totalProducts / Math.max(totalProducts, 20)) * 100)),
                  sub:   `${totalProducts} active product${totalProducts !== 1 ? 's' : ''} in your store`,
                  color: 'bg-blue-500',
                  badge: totalProducts >= 10 ? { text: 'Great variety', cls: 'bg-blue-100 text-blue-700' }
                       : totalProducts >= 3  ? { text: 'Growing',      cls: 'bg-blue-100 text-blue-700' }
                       : { text: 'Add more products', cls: 'bg-gray-100 text-gray-600' },
                },
              ].map(({ label, value, sub, color, badge }, i) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.text}</span>
                      <span className="text-sm font-black text-gray-900">{value}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.4 + i * 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* ── Revenue breakdown cards ──────────────────────────────────────── */}
      <Section title="Revenue by Period" sub="All figures from delivered and paid orders">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Today',      val: revenueToday,     icon: Zap,       cls: 'from-orange-50 border-orange-100', num: 'text-orange-700' },
            { label: 'This Month', val: revenueThisMonth, icon: Calendar,  cls: 'from-emerald-50 border-emerald-100', num: 'text-emerald-700' },
            { label: 'This Year',  val: revenueThisYear,  icon: TrendingUp, cls: 'from-blue-50 border-blue-100', num: 'text-blue-700' },
            { label: 'All Time',   val: totalRevenue,     icon: Star,      cls: 'from-purple-50 border-purple-100', num: 'text-purple-700' },
          ].map(({ label, val, icon: Icon, cls, num }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.07 }}
              className={`bg-gradient-to-br ${cls} border rounded-2xl p-5`}
            >
              <Icon className={`w-5 h-5 ${num} opacity-70 mb-3`}/>
              <p className={`text-2xl font-black ${num}`}>{fmtN(val)}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── Smart insights panel ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-gray-950 to-gray-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Eye className="w-5 h-5 text-white"/>
          </div>
          <div>
            <h2 className="font-bold text-base">Smart Insights</h2>
            <p className="text-white/40 text-xs">Auto-generated from your store data</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            fulfillmentRate >= 80
              ? { icon: '✅', text: `Great work! Your ${fulfillmentRate}% fulfillment rate keeps customers happy and coming back.` }
              : fulfillmentRate >= 50
              ? { icon: '⚠️', text: `Fulfillment is at ${fulfillmentRate}%. Consider processing orders faster or improving stock accuracy.` }
              : { icon: '🔴', text: `Fulfillment rate of ${fulfillmentRate}% is low. Review pending orders urgently to avoid poor reviews.` },

            cancellationRate > 15
              ? { icon: '🔴', text: `${cancellationRate}% cancellation rate is high — check that your products and stock levels are accurately listed.` }
              : cancellationRate > 5
              ? { icon: '🟡', text: `${cancellationRate}% cancellation rate is moderate. Keep an eye on this to improve customer satisfaction.` }
              : { icon: '✅', text: `Only ${cancellationRate}% cancellation rate — your listings and stock management are on point.` },

            pendingOrders > 0
              ? { icon: '📦', text: `You have ${pendingOrders} pending order${pendingOrders !== 1 ? 's' : ''} right now. Head to Orders to process them.` }
              : { icon: '🎉', text: `No pending orders — you're fully caught up! Great operational discipline.` },

            totalProducts < 3
              ? { icon: '💡', text: `Only ${totalProducts} product${totalProducts !== 1 ? 's' : ''} listed. Adding more variety significantly increases your average order value.` }
              : revenueToday === 0
              ? { icon: '📢', text: `No revenue today yet. Share your store link or run a promotion to attract orders.` }
              : { icon: '🛍️', text: `${totalProducts} products in your catalogue and revenue is flowing. Keep your stock updated.` },
          ].map(({ icon, text }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className="flex gap-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-3.5 border border-white/10"
            >
              <span className="text-xl flex-shrink-0 leading-none mt-0.5">{icon}</span>
              <p className="text-sm text-white/70 leading-relaxed">{text}</p>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}