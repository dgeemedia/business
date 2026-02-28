// frontend/src/pages/Subscription.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Clock, CheckCircle, AlertCircle, XCircle,
  RefreshCw, Shield, Calendar, Zap, Star, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Card, Button, Badge, LoadingSpinner, Modal } from '../components/shared';
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
    expired: false,
    total,
    days:    Math.floor(total / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

function formatExpiry(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Countdown component ───────────────────────────────────────────────────────
function CountdownTimer({ expiryDate, isTrial }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(expiryDate));

  useEffect(() => {
    if (!expiryDate) return;
    const interval = setInterval(() => {
      setTimeLeft(getTimeRemaining(expiryDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiryDate]);

  if (!timeLeft) return null;

  const urgency = timeLeft.expired
    ? 'red'
    : timeLeft.days <= 3
    ? 'red'
    : timeLeft.days <= 7
    ? 'orange'
    : isTrial
    ? 'blue'
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

// ── Plan Card ─────────────────────────────────────────────────────────────────
function PlanOption({ plan, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(plan.id)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        selected
          ? 'border-primary-500 bg-primary-50 shadow-md'
          : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900">{plan.name}</span>
            {plan.badge && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                {plan.badge}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{plan.description}</p>
          <ul className="mt-2 space-y-1">
            {plan.features.map(f => (
              <li key={f} className="text-xs text-gray-600 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                {f}
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

// ── Main Component ────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '₦15,000',
    period: 'per month',
    description: 'Billed every 30 days — cancel anytime',
    features: ['Full platform access', 'Unlimited products', 'All reports & analytics', 'Customer support'],
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '₦150,000',
    period: 'per year',
    description: 'Save 17% compared to monthly billing',
    badge: 'Best Value',
    features: ['Everything in Monthly', '2 months free', 'Priority support', 'Early access to new features'],
  },
];

const Subscription = () => {
  const { currentBusiness } = useBusinessStore();
  const [subscription, setSubscription]   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan]   = useState('monthly');
  const [paymentStep, setPaymentStep]     = useState('select'); // 'select' | 'payment' | 'success'
  const [processing, setProcessing]       = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!currentBusiness?.id) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/business/${currentBusiness.id}/subscription-status`);
      setSubscription(res.data);
    } catch (error) {
      // Fallback: build from business data
      if (currentBusiness) {
        setSubscription({
          business: currentBusiness,
          status: {
            status: currentBusiness.subscriptionPlan === 'free_trial' ? 'trial_active' : 'active',
            daysRemaining: null,
          },
          canStartTrial: !currentBusiness.trialStartDate,
          needsPayment: false,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [currentBusiness?.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleRenewRequest = () => {
    setPaymentStep('select');
    setRenewModalOpen(true);
  };

  // ── Simulated payment (replace with real gateway e.g. Paystack/Flutterwave) ──
  const handlePayment = async () => {
    setProcessing(true);
    setPaymentStep('payment');

    try {
      // 🔧 TODO: Integrate real payment gateway here
      // Example with Paystack:
      //   const paystackRes = await initializePaystackPayment({ plan: selectedPlan, ... });
      //   window.location.href = paystackRes.data.authorization_url;

      // For now — simulate processing then contact super-admin flow
      await new Promise(resolve => setTimeout(resolve, 2000));

      // After payment, request super-admin to update the subscription
      // In production, your payment webhook should call /api/business/:id/update-subscription
      await api.post('/api/contact-support', {
        type: 'subscription_renewal',
        plan: selectedPlan,
        businessId: currentBusiness.id,
        message: `Business requesting ${selectedPlan} subscription renewal. Payment reference: SIMULATED_${Date.now()}`,
      }).catch(() => {}); // Non-critical

      setPaymentStep('success');
      toast.success('Renewal request submitted! Your subscription will be updated shortly.');
    } catch {
      toast.error('Payment failed. Please try again or contact support.');
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

  const biz    = subscription?.business || currentBusiness || {};
  const status = subscription?.status   || {};
  const plan   = biz.subscriptionPlan;
  const isTrial = plan === 'free_trial';
  const expiryDate = isTrial ? biz.trialEndsAt : biz.subscriptionExpiry;

  const statusConfig = {
    trial_active:   { label: 'Free Trial',     variant: 'info',    icon: Zap,          color: 'blue'  },
    active:         { label: 'Active',          variant: 'success', icon: CheckCircle,  color: 'green' },
    expiring_soon:  { label: 'Expiring Soon',   variant: 'warning', icon: AlertCircle,  color: 'orange'},
    trial_expired:  { label: 'Trial Expired',   variant: 'danger',  icon: XCircle,      color: 'red'   },
    expired:        { label: 'Expired',          variant: 'danger',  icon: XCircle,      color: 'red'   },
    none:           { label: 'No Subscription', variant: 'gray',    icon: CreditCard,   color: 'gray'  },
  };

  const statusInfo = statusConfig[status.status] || statusConfig.none;
  const StatusIcon = statusInfo.icon;
  const showRenewBanner = ['trial_expired', 'expired', 'expiring_soon'].includes(status.status);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription</h1>
        <p className="text-gray-600">Manage your plan and billing to keep your business running</p>
      </div>

      {/* Renewal Banner */}
      {showRenewBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-800">
                {status.status === 'expired' || status.status === 'trial_expired'
                  ? 'Your subscription has expired!'
                  : `Your subscription expires in ${status.daysRemaining} day${status.daysRemaining !== 1 ? 's' : ''}!`}
              </p>
              <p className="text-sm text-red-600">Renew now to avoid losing access to your dashboard.</p>
            </div>
          </div>
          <Button icon={RefreshCw} onClick={handleRenewRequest} className="flex-shrink-0">
            Renew Now
          </Button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Plan Card */}
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
              <div className={`p-3 rounded-xl bg-${statusInfo.color}-100`}>
                <Shield className={`w-6 h-6 text-${statusInfo.color}-600`} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 capitalize">
                  {isTrial ? '14-Day Free Trial' : (plan?.replace('_', ' ') || 'No Plan')}
                </p>
                <p className="text-sm text-gray-500">
                  {isTrial
                    ? 'Full access during trial period'
                    : plan === 'monthly' ? 'Billed monthly'
                    : plan === 'annual'  ? 'Billed annually'
                    : 'No active subscription'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {biz.trialStartDate && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-xs">Trial Started</p>
                  <p className="font-semibold text-gray-800">{formatExpiry(biz.trialStartDate)}</p>
                </div>
              )}
              {biz.subscriptionStartDate && !isTrial && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-xs">Started</p>
                  <p className="font-semibold text-gray-800">{formatExpiry(biz.subscriptionStartDate)}</p>
                </div>
              )}
              {expiryDate && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-xs">{isTrial ? 'Trial Ends' : 'Renews / Expires'}</p>
                  <p className={`font-semibold ${status.daysRemaining <= 7 ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatExpiry(expiryDate)}
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
            </div>

            {/* Features included */}
            <div className="p-4 bg-primary-50 rounded-xl">
              <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-2">
                Included in your plan
              </p>
              <ul className="space-y-1.5">
                {[
                  'Unlimited products',
                  'Order management',
                  'Customer analytics',
                  'Staff management',
                  'Custom storefront',
                  'WhatsApp integration',
                ].map(f => (
                  <li key={f} className="text-sm text-primary-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5">
            <Button fullWidth icon={RefreshCw} onClick={handleRenewRequest} variant={showRenewBanner ? 'primary' : 'outline'}>
              {showRenewBanner ? 'Renew Subscription' : 'Upgrade / Renew Plan'}
            </Button>
          </div>
        </Card>

        {/* Countdown Timer */}
        <div className="space-y-4">
          {expiryDate ? (
            <CountdownTimer expiryDate={expiryDate} isTrial={isTrial} />
          ) : (
            <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">No active subscription</p>
              <p className="text-sm text-gray-400">Choose a plan to get started</p>
            </div>
          )}

          {/* Contact support card */}
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-900 text-sm mb-1">Payment Methods</p>
                <p className="text-xs text-blue-700">
                  We accept bank transfer, card payments, and mobile money.
                  After payment, your subscription will be activated within 24 hours.
                </p>
                <p className="text-xs text-blue-600 mt-2 font-medium">
                  Need help? Contact support to renew your plan.
                </p>
              </div>
            </div>
          </Card>

          {/* Subscription history placeholder */}
          {biz.subscriptionNotes && (
            <Card>
              <p className="text-sm font-semibold text-gray-700 mb-2">Notes from Admin</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{biz.subscriptionNotes}</p>
            </Card>
          )}
        </div>
      </div>

      {/* ── Renew / Upgrade Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={renewModalOpen}
        onClose={handleModalClose}
        title={
          paymentStep === 'success' ? '✅ Request Submitted!' :
          paymentStep === 'payment' ? 'Processing Payment…' :
          'Renew / Upgrade Plan'
        }
        size="lg"
      >
        {/* Step 1: Select plan */}
        {paymentStep === 'select' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Choose a plan to continue. Your access will be restored immediately after payment confirmation.
            </p>

            <div className="space-y-3">
              {PLANS.map(plan => (
                <PlanOption
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlan === plan.id}
                  onSelect={setSelectedPlan}
                />
              ))}
            </div>

            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
              <p className="font-semibold text-gray-800 mb-2">📋 How it works</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Select your plan and click Proceed to Payment</li>
                <li>Complete payment via your preferred method</li>
                <li>Your subscription is activated within 24 hours</li>
                <li>You'll receive a confirmation notification</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button fullWidth icon={ArrowRight} onClick={() => setPaymentStep('payment')}>
                Proceed to Payment
              </Button>
              <Button variant="outline" fullWidth onClick={handleModalClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Payment processing */}
        {paymentStep === 'payment' && (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-primary-600" />
              </div>
              <p className="font-bold text-gray-900 text-lg mb-1">
                {PLANS.find(p => p.id === selectedPlan)?.name} Plan
              </p>
              <p className="text-2xl font-black text-primary-600">
                {PLANS.find(p => p.id === selectedPlan)?.price}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {PLANS.find(p => p.id === selectedPlan)?.period}
              </p>
            </div>

            {/* Bank Transfer details */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-sm">
              <p className="font-semibold text-gray-800">Bank Transfer Details</p>
              <div className="flex justify-between"><span className="text-gray-500">Bank:</span><span className="font-medium">First Bank Nigeria</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Account Name:</span><span className="font-medium">MyPadi Business Ltd</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Account No:</span><span className="font-mono font-bold">0123456789</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount:</span><span className="font-bold text-primary-600">{PLANS.find(p => p.id === selectedPlan)?.price}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Reference:</span><span className="font-mono text-xs">{`${currentBusiness?.slug?.toUpperCase()}-${selectedPlan.toUpperCase()}`}</span></div>
            </div>

            <p className="text-xs text-center text-gray-500">
              After making the transfer, click the button below to notify our team.
              Your subscription will be activated within 24 hours.
            </p>

            <div className="flex gap-3">
              <Button
                fullWidth
                icon={CheckCircle}
                loading={processing}
                onClick={handlePayment}
              >
                I've Made the Payment
              </Button>
              <Button variant="outline" fullWidth onClick={() => setPaymentStep('select')} disabled={processing}>
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {paymentStep === 'success' && (
          <div className="text-center py-6 space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
            >
              <CheckCircle className="w-10 h-10 text-green-500" />
            </motion.div>

            <div>
              <p className="text-xl font-bold text-gray-900">Request Received!</p>
              <p className="text-gray-600 text-sm mt-2">
                Our team has been notified of your payment. Your subscription will be
                activated within 24 hours. You'll receive a notification once it's live.
              </p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              <p className="font-semibold mb-1">What happens next?</p>
              <ul className="text-left space-y-1 text-xs">
                <li>✅ Payment confirmation sent to our team</li>
                <li>⏳ Subscription activated within 24 hours</li>
                <li>📧 You'll receive a confirmation notification</li>
              </ul>
            </div>

            <Button fullWidth onClick={handleModalClose}>
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Subscription;