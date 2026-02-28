// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, ShoppingBag, Users, DollarSign,
  Package, Clock, CheckCircle, XCircle,
  CreditCard, AlertCircle, RefreshCw, Shield,
  Calendar, Zap, Star, ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, Badge, LoadingSpinner, Button } from '../components/shared';
import { PaymentModal } from '../components/shared/PaymentModal';  // ✅ real payment modal
import orderService from '../services/orderService';
import api from '../services/api';
import useBusinessStore from '../stores/businessStore';
import { formatCurrency, formatRelativeTime } from '../utils/helpers';

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function getTimeRemaining(expiryDate) {
  if (!expiryDate) return null;
  const now   = new Date();
  const end   = new Date(expiryDate);
  const total = end - now;
  if (total <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    expired: false, total,
    days:    Math.floor(total / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

function formatExpiry(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function CountdownTimer({ expiryDate, isTrial }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(expiryDate));

  useEffect(() => {
    if (!expiryDate) return;
    const id = setInterval(() => setTimeLeft(getTimeRemaining(expiryDate)), 1000);
    return () => clearInterval(id);
  }, [expiryDate]);

  if (!timeLeft) return null;

  const urgency = timeLeft.expired ? 'red'
    : timeLeft.days <= 3  ? 'red'
    : timeLeft.days <= 7  ? 'orange'
    : isTrial             ? 'blue'
    : 'green';

  const colors = {
    green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  num: 'text-green-600'  },
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   num: 'text-blue-600'   },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', num: 'text-orange-600' },
    red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    num: 'text-red-600'    },
  };
  const c = colors[urgency];

  if (timeLeft.expired) {
    return (
      <div className={`p-3 rounded-xl border ${c.bg} ${c.border} text-center`}>
        <XCircle className={`w-7 h-7 mx-auto mb-1 ${c.num}`} />
        <p className={`font-bold text-sm ${c.text}`}>Subscription Expired</p>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-xl border ${c.bg} ${c.border}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wide mb-2 ${c.text}`}>
        {isTrial ? '🎁 Trial ends in' : '⏳ Expires in'}
      </p>
      <div className="grid grid-cols-4 gap-1 text-center">
        {[
          { label: 'Days',    val: timeLeft.days    },
          { label: 'Hrs',     val: timeLeft.hours   },
          { label: 'Min',     val: timeLeft.minutes },
          { label: 'Sec',     val: timeLeft.seconds },
        ].map(({ label, val }) => (
          <div key={label}>
            <div className={`text-xl font-black tabular-nums ${c.num}`}>{String(val).padStart(2, '0')}</div>
            <div className={`text-[9px] ${c.text} opacity-70`}>{label}</div>
          </div>
        ))}
      </div>
      {timeLeft.days <= 7 && (
        <p className={`text-[10px] font-medium mt-2 text-center ${c.text}`}>
          ⚠️ Renew soon to avoid interruption
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { currentBusiness } = useBusinessStore();

  const [stats,        setStats]        = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading,      setLoading]      = useState(true);

  // Subscription state
  const [subscription,       setSubscription]       = useState(null);
  const [subLoading,         setSubLoading]         = useState(true);
  const [paymentModalOpen,   setPaymentModalOpen]   = useState(false); // ✅ renamed to match PaymentModal pattern

  // ── Fetch stats ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [statsData, ordersData] = await Promise.all([
          orderService.getOrderStats(),
          orderService.getOrders({ limit: 5, sort: 'desc' }),
        ]);
        setStats(statsData);
        setRecentOrders(ordersData.orders || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Fetch subscription ──────────────────────────────────────────────────
  const fetchSubscription = useCallback(async () => {
    if (!currentBusiness?.id) return;
    try {
      setSubLoading(true);
      const res = await api.get(`/api/business/${currentBusiness.id}/subscription-status`);
      setSubscription(res.data);
    } catch {
      if (currentBusiness) {
        setSubscription({
          business: currentBusiness,
          status: {
            status: currentBusiness.subscriptionPlan === 'free_trial' ? 'trial_active' : 'active',
            daysRemaining: null,
          },
        });
      }
    } finally {
      setSubLoading(false);
    }
  }, [currentBusiness?.id]);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  if (loading) return <LoadingSpinner fullScreen />;

  // ── Subscription data ───────────────────────────────────────────────────
  const biz        = subscription?.business || currentBusiness || {};
  const subStatus  = subscription?.status   || {};
  const isTrial    = biz.subscriptionPlan === 'free_trial';
  const expiryDate = isTrial ? biz.trialEndsAt : biz.subscriptionExpiry;

  const subStatusConfig = {
    trial_active:  { label: 'Free Trial',    variant: 'info',    icon: Zap         },
    active:        { label: 'Active',         variant: 'success', icon: CheckCircle },
    expiring_soon: { label: 'Expiring Soon',  variant: 'warning', icon: AlertCircle },
    trial_expired: { label: 'Trial Expired',  variant: 'danger',  icon: XCircle     },
    expired:       { label: 'Expired',         variant: 'danger',  icon: XCircle     },
    none:          { label: 'No Plan',         variant: 'gray',    icon: CreditCard  },
  };
  const subInfo  = subStatusConfig[subStatus.status] || subStatusConfig.none;
  const SubIcon  = subInfo.icon;
  const showRenewBanner = ['trial_expired', 'expired', 'expiring_soon'].includes(subStatus.status);

  // ── Stat cards ──────────────────────────────────────────────────────────
  const statCards = [
    {
      title:   'Total Revenue',
      value:   formatCurrency(stats?.totalRevenue || 0),
      sub:     `${formatCurrency(stats?.recentRevenue || 0)} last 30d`,
      icon:    DollarSign,
      color:   'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title:   'Total Orders',
      value:   stats?.totalOrders || 0,
      sub:     `${stats?.pendingOrders || 0} pending`,
      icon:    ShoppingBag,
      color:   'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title:   'Active Products',
      value:   stats?.activeProducts || 0,
      sub:     'Available in store',
      icon:    Package,
      color:   'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title:   'Customers',
      value:   stats?.totalCustomers || 0,
      sub:     `${stats?.deliveredOrders || 0} orders delivered`,
      icon:    Users,
      color:   'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const getStatusBadge = (status) => {
    const cfg = {
      PENDING:          { variant: 'warning', icon: Clock         },
      CONFIRMED:        { variant: 'info',    icon: CheckCircle   },
      PREPARING:        { variant: 'info',    icon: Package       },
      READY:            { variant: 'success', icon: CheckCircle   },
      OUT_FOR_DELIVERY: { variant: 'info',    icon: Package       },
      DELIVERED:        { variant: 'success', icon: CheckCircle   },
      CANCELLED:        { variant: 'danger',  icon: XCircle       },
    };
    const c = cfg[status] || { variant: 'gray' };
    return <Badge variant={c.variant} icon={c.icon}>{status}</Badge>;
  };

  const getTotal = o => o.total ?? o.totalAmount ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm">
          Welcome back! Here's what's happening with{' '}
          <span className="font-semibold text-gray-700">{biz.businessName || 'your business'}</span> today.
        </p>
      </div>

      {/* ── Subscription renewal banner ──────────────────────────────────── */}
      {showRenewBanner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-800">
                {['expired', 'trial_expired'].includes(subStatus.status)
                  ? 'Your subscription has expired!'
                  : `Subscription expires in ${subStatus.daysRemaining} day${subStatus.daysRemaining !== 1 ? 's' : ''}!`}
              </p>
              <p className="text-sm text-red-600">Renew now to avoid losing dashboard access.</p>
            </div>
          </div>
          <Button icon={RefreshCw} onClick={() => setPaymentModalOpen(true)} className="flex-shrink-0">
            Renew Now
          </Button>
        </motion.div>
      )}

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-28 h-28 ${stat.bgColor} opacity-10 rounded-full -mr-14 -mt-14`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.sub && <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Bottom row: Recent Orders + Subscription card ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Orders — 2/3 width */}
        <div className="lg:col-span-2">
          <Card title="Recent Orders" subtitle="Latest orders from your customers">
            {recentOrders.length === 0 ? (
              <div className="text-center py-10 text-gray-400">No orders yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Order', 'Customer', 'Amount', 'Status', 'Time'].map(h => (
                        <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono text-sm font-semibold text-primary-600">
                            #{order.orderNumber || String(order.id).padStart(6, '0')}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-medium text-gray-900 text-sm">{order.customerName}</p>
                          <p className="text-xs text-gray-400">{order.phone || order.customerPhone}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-gray-900 text-sm">{formatCurrency(getTotal(order))}</span>
                        </td>
                        <td className="py-3 px-3">{getStatusBadge(order.status)}</td>
                        <td className="py-3 px-3 text-xs text-gray-400 whitespace-nowrap">
                          {formatRelativeTime(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Subscription card — 1/3 width */}
        <div className="space-y-4">
          <Card>
            {subLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-sm">Subscription</h3>
                  <Badge variant={subInfo.variant}>
                    <SubIcon className="w-3 h-3 mr-1 inline" />
                    {subInfo.label}
                  </Badge>
                </div>

                {/* Plan info */}
                <div className="p-3 bg-gray-50 rounded-xl mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Shield className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm capitalize">
                        {isTrial ? '14-Day Free Trial' : (biz.subscriptionPlan?.replace('_', ' ') || 'No Plan')}
                      </p>
                      {expiryDate && (
                        <p className="text-xs text-gray-500">
                          {isTrial ? 'Ends' : 'Expires'} {formatExpiry(expiryDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Countdown */}
                {expiryDate ? (
                  <CountdownTimer expiryDate={expiryDate} isTrial={isTrial} />
                ) : (
                  <div className="p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
                    <Calendar className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">No active subscription</p>
                  </div>
                )}

                {/* Stats pills */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[
                    { label: 'Orders',    val: stats?.totalOrders    || 0 },
                    { label: 'Customers', val: stats?.totalCustomers || 0 },
                    { label: 'Revenue',   val: formatCurrency(stats?.totalRevenue || 0) },
                    { label: 'Delivered', val: stats?.deliveredOrders || 0 },
                  ].map(({ label, val }) => (
                    <div key={label} className="p-2.5 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="font-bold text-gray-900 text-sm">{val}</p>
                    </div>
                  ))}
                </div>

                <Button
                  fullWidth
                  size="sm"
                  icon={RefreshCw}
                  variant={showRenewBanner ? 'primary' : 'outline'}
                  onClick={() => setPaymentModalOpen(true)}
                  className="mt-4"
                >
                  {showRenewBanner ? 'Renew Subscription' : 'Upgrade / Renew'}
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* ── Payment Modal (real gateway + bank transfer fallback) ─────────── */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        business={biz}
        onPaymentSuccess={() => {
          setPaymentModalOpen(false);
          fetchSubscription(); // ✅ refreshes subscription status after successful payment
        }}
      />
    </div>
  );
};

export default Dashboard;