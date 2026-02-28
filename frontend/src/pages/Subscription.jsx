// frontend/src/pages/Subscription.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Clock, CheckCircle, AlertCircle, XCircle,
  RefreshCw, Shield, Calendar, Zap, Star,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, Button, Badge, LoadingSpinner } from '../components/shared';
import { PaymentModal } from '../components/shared/PaymentModal';
import api from '../services/api';
import useBusinessStore from '../stores/businessStore';

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Countdown ─────────────────────────────────────────────────────────────────
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

  const c = {
    green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  num: 'text-green-600'  },
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   num: 'text-blue-600'   },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', num: 'text-orange-600' },
    red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    num: 'text-red-600'    },
  }[urgency];

  if (timeLeft.expired) {
    return (
      <div className={`p-4 rounded-xl border-2 ${c.bg} ${c.border} text-center`}>
        <XCircle className={`w-10 h-10 mx-auto mb-2 ${c.num}`} />
        <p className={`font-bold text-lg ${c.text}`}>Subscription Expired</p>
        <p className={`text-sm ${c.text} opacity-80`}>Renew now to restore access</p>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border-2 ${c.bg} ${c.border}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${c.text}`}>
        {isTrial ? '🎁 Free Trial Ends In' : '⏳ Subscription Expires In'}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Days',    val: timeLeft.days    },
          { label: 'Hours',   val: timeLeft.hours   },
          { label: 'Minutes', val: timeLeft.minutes },
          { label: 'Seconds', val: timeLeft.seconds },
        ].map(({ label, val }) => (
          <div key={label} className="text-center">
            <div className={`text-2xl font-black tabular-nums ${c.num}`}>
              {String(val).padStart(2, '0')}
            </div>
            <div className={`text-xs ${c.text} opacity-70`}>{label}</div>
          </div>
        ))}
      </div>
      {timeLeft.days <= 7 && (
        <p className={`text-xs font-medium mt-3 text-center ${c.text}`}>
          ⚠️ Renew soon to avoid service interruption
        </p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const Subscription = () => {
  const { currentBusiness } = useBusinessStore();
  const [subscription,   setSubscription]   = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!currentBusiness?.id) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/business/${currentBusiness.id}/subscription-status`);
      setSubscription(res.data);
    } catch {
      if (currentBusiness) {
        setSubscription({
          business: currentBusiness,
          status: {
            status:        currentBusiness.subscriptionPlan === 'free_trial' ? 'trial_active' : 'active',
            daysRemaining: null,
          },
        });
      }
    } finally {
      setLoading(false);
    }
  }, [currentBusiness?.id]);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  if (loading) return <LoadingSpinner fullScreen />;

  const biz      = subscription?.business || currentBusiness || {};
  const status   = subscription?.status   || {};
  const isTrial  = biz.subscriptionPlan === 'free_trial';
  const expiry   = isTrial ? biz.trialEndsAt : biz.subscriptionExpiry;
  const showRenewBanner = ['trial_expired', 'expired', 'expiring_soon'].includes(status.status);

  const statusConfig = {
    trial_active:  { label: 'Free Trial',     variant: 'info',    icon: Zap         },
    active:        { label: 'Active',          variant: 'success', icon: CheckCircle },
    expiring_soon: { label: 'Expiring Soon',   variant: 'warning', icon: AlertCircle },
    trial_expired: { label: 'Trial Expired',   variant: 'danger',  icon: XCircle     },
    expired:       { label: 'Expired',          variant: 'danger',  icon: XCircle     },
    none:          { label: 'No Subscription', variant: 'gray',    icon: CreditCard  },
  };
  const statusInfo = statusConfig[status.status] || statusConfig.none;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription</h1>
        <p className="text-gray-600">Manage your plan and billing</p>
      </div>

      {/* Renewal banner */}
      {showRenewBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-800">
                {['expired', 'trial_expired'].includes(status.status)
                  ? 'Your subscription has expired!'
                  : `Expires in ${status.daysRemaining} day${status.daysRemaining !== 1 ? 's' : ''}!`}
              </p>
              <p className="text-sm text-red-600">Renew now to avoid losing dashboard access.</p>
            </div>
          </div>
          <Button icon={RefreshCw} onClick={() => setPaymentModalOpen(true)} className="flex-shrink-0">
            Renew Now
          </Button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current plan card */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Current Plan</h2>
            <Badge variant={statusInfo.variant}>
              <StatusIcon className="w-3.5 h-3.5 mr-1 inline" />
              {statusInfo.label}
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="p-3 rounded-xl bg-primary-100">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 capitalize">
                  {isTrial ? '14-Day Free Trial' : (biz.subscriptionPlan?.replace('_', ' ') || 'No Plan')}
                </p>
                <p className="text-sm text-gray-500">
                  {isTrial ? 'Full access during trial'
                    : biz.subscriptionPlan === 'monthly' ? 'Billed monthly'
                    : biz.subscriptionPlan === 'annual'  ? 'Billed annually'
                    : 'No active subscription'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {expiry && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-xs">{isTrial ? 'Trial Ends' : 'Expires'}</p>
                  <p className={`font-semibold ${status.daysRemaining <= 7 ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatExpiry(expiry)}
                  </p>
                </div>
              )}
              {status.daysRemaining !== null && !status.expired && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-xs">Days Remaining</p>
                  <p className={`font-bold text-lg ${status.daysRemaining <= 7 ? 'text-red-600' : 'text-green-600'}`}>
                    {status.daysRemaining}
                  </p>
                </div>
              )}
              {biz.lastPaymentDate && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-xs">Last Payment</p>
                  <p className="font-semibold text-gray-800">{formatExpiry(biz.lastPaymentDate)}</p>
                </div>
              )}
              {biz.lastPaymentAmount && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-xs">Last Amount</p>
                  <p className="font-semibold text-gray-800">₦{Number(biz.lastPaymentAmount).toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-primary-50 rounded-xl">
              <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-2">Included</p>
              <ul className="space-y-1.5">
                {['Unlimited products', 'Order management', 'Customer analytics', 'Staff management', 'Custom storefront', 'WhatsApp integration'].map(f => (
                  <li key={f} className="text-sm text-primary-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5">
            <Button
              fullWidth
              icon={RefreshCw}
              onClick={() => setPaymentModalOpen(true)}
              variant={showRenewBanner ? 'primary' : 'outline'}
            >
              {showRenewBanner ? 'Renew Subscription' : 'Upgrade / Renew Plan'}
            </Button>
          </div>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {expiry ? (
            <CountdownTimer expiryDate={expiry} isTrial={isTrial} />
          ) : (
            <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">No active subscription</p>
              <p className="text-sm text-gray-400">Choose a plan to get started</p>
            </div>
          )}

          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-900 text-sm mb-1">Payment Methods</p>
                <p className="text-xs text-blue-700">
                  Card, bank transfer, USSD, and mobile money accepted.
                  International cards supported for foreign customers.
                  Subscription activated instantly on payment.
                </p>
              </div>
            </div>
          </Card>

          {biz.subscriptionNotes && (
            <Card>
              <p className="text-sm font-semibold text-gray-700 mb-2">Notes from Admin</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{biz.subscriptionNotes}</p>
            </Card>
          )}
        </div>
      </div>

      {/* ── Payment Modal ── */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        business={biz}
        onPaymentSuccess={() => {
          setPaymentModalOpen(false);
          fetchSubscription();
        }}
      />
    </div>
  );
};

export default Subscription;