// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, ShoppingBag, Users, DollarSign,
  Package, Clock, CheckCircle, XCircle,
  CreditCard, AlertCircle, RefreshCw, Shield,
  Calendar, Zap, Star, ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, Badge, LoadingSpinner, Button, Modal } from '../components/shared';
import orderService from '../services/orderService';
import api from '../services/api';
import useBusinessStore from '../stores/businessStore';
import { formatCurrency, formatRelativeTime } from '../utils/helpers';

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION HELPERS (inline — no separate page import needed)
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

const PLANS = [
  {
    id: 'monthly', name: 'Monthly', price: '₦15,000', period: 'per month',
    description: 'Billed every 30 days — cancel anytime',
    features: ['Full platform access', 'Unlimited products', 'All analytics', 'Customer support'],
  },
  {
    id: 'annual', name: 'Annual', price: '₦150,000', period: 'per year',
    description: 'Save 17% vs monthly', badge: 'Best Value',
    features: ['Everything in Monthly', '2 months free', 'Priority support', 'New features first'],
  },
];

function PlanOption({ plan, selected, onSelect }) {
  return (
    <button type="button" onClick={() => onSelect(plan.id)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        selected ? 'border-primary-500 bg-primary-50 shadow-md' : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
      }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900">{plan.name}</span>
            {plan.badge && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{plan.badge}</span>}
          </div>
          <p className="text-sm text-gray-500 mb-2">{plan.description}</p>
          <ul className="space-y-1">
            {plan.features.map(f => (
              <li key={f} className="text-xs text-gray-600 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{f}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-black text-gray-900">{plan.price}</p>
          <p className="text-xs text-gray-400">{plan.period}</p>
          {selected && <CheckCircle className="w-5 h-5 text-primary-500 ml-auto mt-1" />}
        </div>
      </div>
    </button>
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
  const [subscription,    setSubscription]    = useState(null);
  const [subLoading,      setSubLoading]      = useState(true);
  const [renewModalOpen,  setRenewModalOpen]  = useState(false);
  const [selectedPlan,    setSelectedPlan]    = useState('monthly');
  const [paymentStep,     setPaymentStep]     = useState('select');
  const [processing,      setProcessing]      = useState(false);

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

  // ── Renewal flow ────────────────────────────────────────────────────────
  const handlePayment = async () => {
    setProcessing(true);
    setPaymentStep('payment');
    try {
      await new Promise(r => setTimeout(r, 1500));
      await api.post('/api/contact-support', {
        type: 'subscription_renewal', plan: selectedPlan,
        businessId: currentBusiness.id,
        message: `Renewal request — ${selectedPlan} — Ref: SIMULATED_${Date.now()}`,
      }).catch(() => {});
      setPaymentStep('success');
    } catch {
      setPaymentStep('select');
    } finally {
      setProcessing(false);
    }
  };

  const handleModalClose = () => {
    setRenewModalOpen(false);
    setPaymentStep('select');
    if (paymentStep === 'success') fetchSubscription();
  };

  if (loading) return <LoadingSpinner fullScreen />;

  // ── Subscription data ───────────────────────────────────────────────────
  const biz       = subscription?.business || currentBusiness || {};
  const subStatus = subscription?.status   || {};
  const isTrial   = biz.subscriptionPlan === 'free_trial';
  const expiryDate = isTrial ? biz.trialEndsAt : biz.subscriptionExpiry;

  const subStatusConfig = {
    trial_active:  { label: 'Free Trial',   variant: 'info',    icon: Zap },
    active:        { label: 'Active',        variant: 'success', icon: CheckCircle },
    expiring_soon: { label: 'Expiring Soon', variant: 'warning', icon: AlertCircle },
    trial_expired: { label: 'Trial Expired', variant: 'danger',  icon: XCircle },
    expired:       { label: 'Expired',       variant: 'danger',  icon: XCircle },
    none:          { label: 'No Plan',       variant: 'gray',    icon: CreditCard },
  };
  const subInfo   = subStatusConfig[subStatus.status] || subStatusConfig.none;
  const SubIcon   = subInfo.icon;
  const showRenewBanner = ['trial_expired', 'expired', 'expiring_soon'].includes(subStatus.status);

  // ── Stat cards ─────────────────────────────────────────────────────────
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
      PENDING:          { variant: 'warning', icon: Clock },
      CONFIRMED:        { variant: 'info',    icon: CheckCircle },
      PREPARING:        { variant: 'info',    icon: Package },
      READY:            { variant: 'success', icon: CheckCircle },
      OUT_FOR_DELIVERY: { variant: 'info',    icon: Package },
      DELIVERED:        { variant: 'success', icon: CheckCircle },
      CANCELLED:        { variant: 'danger',  icon: XCircle },
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
          Welcome back! Here's what's happening with <span className="font-semibold text-gray-700">{biz.businessName || 'your business'}</span> today.
        </p>
      </div>

      {/* ── Subscription renewal banner ─────────────────────────────────── */}
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
          <Button icon={RefreshCw} onClick={() => setRenewModalOpen(true)} className="flex-shrink-0">
            Renew Now
          </Button>
        </motion.div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
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

      {/* ── Bottom row: Recent orders + Subscription card ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Orders — takes 2/3 width */}
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
                        <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
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
                    { label: 'Orders',     val: stats?.totalOrders    || 0 },
                    { label: 'Customers',  val: stats?.totalCustomers || 0 },
                    { label: 'Revenue',    val: formatCurrency(stats?.totalRevenue || 0) },
                    { label: 'Delivered',  val: stats?.deliveredOrders || 0 },
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
                  onClick={() => setRenewModalOpen(true)}
                  className="mt-4"
                >
                  {showRenewBanner ? 'Renew Subscription' : 'Upgrade / Renew'}
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* ── Renew Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={renewModalOpen}
        onClose={handleModalClose}
        title={
          paymentStep === 'success' ? '✅ Request Submitted!' :
          paymentStep === 'payment' ? 'Processing Payment…'   :
          'Renew / Upgrade Plan'
        }
        size="lg"
      >
        {paymentStep === 'select' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Choose a plan to continue. Access is restored after payment confirmation.</p>
            <div className="space-y-3">
              {PLANS.map(p => <PlanOption key={p.id} plan={p} selected={selectedPlan === p.id} onSelect={setSelectedPlan} />)}
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800 text-sm mb-2">📋 How it works</p>
              <p>1. Select your plan and click Proceed to Payment</p>
              <p>2. Complete payment via bank transfer</p>
              <p>3. Your subscription is activated within 24 hours</p>
            </div>
            <div className="flex gap-3">
              <Button fullWidth icon={ArrowRight} onClick={() => setPaymentStep('payment')}>Proceed to Payment</Button>
              <Button variant="outline" fullWidth onClick={handleModalClose}>Cancel</Button>
            </div>
          </div>
        )}

        {paymentStep === 'payment' && (
          <div className="space-y-5 py-2">
            <div className="text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-7 h-7 text-primary-600" />
              </div>
              <p className="font-bold text-gray-900 text-lg">{PLANS.find(p => p.id === selectedPlan)?.name} Plan</p>
              <p className="text-2xl font-black text-primary-600">{PLANS.find(p => p.id === selectedPlan)?.price}</p>
              <p className="text-sm text-gray-400">{PLANS.find(p => p.id === selectedPlan)?.period}</p>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm space-y-2">
              <p className="font-semibold text-gray-800">Bank Transfer Details</p>
              {[
                ['Bank',         'First Bank Nigeria'],
                ['Account Name', 'Olumah Lucky George'],
                ['Account No',   '3117923181'],
                ['Amount',       PLANS.find(p => p.id === selectedPlan)?.price],
                ['Reference',    `${currentBusiness?.slug?.toUpperCase()}-${selectedPlan.toUpperCase()}`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}:</span>
                  <span className="font-mono font-semibold text-gray-900">{val}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-gray-400">After transfer, click below to notify our team. Subscription activated within 24h.</p>
            <div className="flex gap-3">
              <Button fullWidth icon={CheckCircle} loading={processing} onClick={handlePayment}>
                I've Made the Payment
              </Button>
              <Button variant="outline" fullWidth onClick={() => setPaymentStep('select')} disabled={processing}>Back</Button>
            </div>
          </div>
        )}

        {paymentStep === 'success' && (
          <div className="text-center py-6 space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </motion.div>
            <div>
              <p className="text-xl font-bold text-gray-900">Request Received!</p>
              <p className="text-gray-500 text-sm mt-2">
                Our team has been notified. Your subscription will be activated within 24 hours.
              </p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 text-left space-y-1">
              <p className="font-semibold">What happens next?</p>
              <p>✅ Payment confirmation sent to our team</p>
              <p>⏳ Subscription activated within 24 hours</p>
              <p>📧 You'll receive a confirmation notification</p>
            </div>
            <Button fullWidth onClick={handleModalClose}>Close</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;