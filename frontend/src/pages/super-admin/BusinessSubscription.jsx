// frontend/src/pages/super-admin/BusinessSubscription.jsx
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, DollarSign, Calendar, CheckCircle, XCircle,
  Clock, AlertCircle, Power, Gift, Save, RefreshCw, Building2
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Button, Badge, LoadingSpinner, Input } from '../../components/shared';
import api from '../../services/api';
import { formatDate, daysUntil } from '../../utils/helpers';

// ─── Status helper ────────────────────────────────────────────────────────────
function getStatus(business) {
  if (!business) return null;
  const now = new Date();

  if (business.subscriptionPlan === 'free_trial' && business.trialEndsAt) {
    const d = daysUntil(business.trialEndsAt);
    if (d <= 0) return { label: 'Trial Expired', variant: 'danger', icon: XCircle, days: 0 };
    return { label: `Trial — ${d}d left`, variant: d <= 3 ? 'warning' : 'info', icon: Clock, days: d };
  }

  if (business.subscriptionExpiry) {
    const d = daysUntil(business.subscriptionExpiry);
    if (d < 0)  return { label: 'Expired',          variant: 'danger',  icon: XCircle,       days: d };
    if (d <= 7) return { label: `Expiring — ${d}d`, variant: 'warning', icon: AlertCircle,   days: d };
    return       { label: 'Active',                  variant: 'success', icon: CheckCircle,   days: d };
  }

  return { label: 'No Subscription', variant: 'gray', icon: DollarSign, days: null };
}

// ─── Plan option card ─────────────────────────────────────────────────────────
function PlanCard({ value, label, desc, price, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <p className="font-bold text-gray-900">{price}</p>
          {selected && <CheckCircle className="w-4 h-4 text-blue-500 ml-auto mt-1" />}
        </div>
      </div>
    </button>
  );
}

const SuperAdminBusinessSubscription = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [customExpiry, setCustomExpiry] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [notes, setNotes] = useState('');
  const [activateBusiness, setActivateBusiness] = useState(true);

  useEffect(() => { fetchBusiness(); }, [id]);

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/business/${id}`);
      setBusiness(res.data);
      // Pre-select current plan
      if (res.data.subscriptionPlan && !['free_trial','none'].includes(res.data.subscriptionPlan)) {
        setSelectedPlan(res.data.subscriptionPlan);
      }
    } catch {
      toast.error('Failed to load business');
      navigate('/super-admin/businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return toast.error('Please select a plan');
    if (useCustomDate && !customExpiry) return toast.error('Please enter a custom expiry date');

    try {
      setSaving(true);
      await api.post(`/api/business/${id}/update-subscription`, {
        plan: selectedPlan,
        customExpiryDate: useCustomDate ? customExpiry : undefined,
        notes: notes || undefined,
        activateBusiness,
      });
      toast.success('Subscription updated!');
      setNotes('');
      fetchBusiness();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update subscription');
    } finally {
      setSaving(false);
    }
  };

  const handleStartTrial = async () => {
    if (!confirm('Start 14-day free trial for this business?')) return;
    try {
      setSaving(true);
      await api.post(`/api/business/${id}/start-trial`);
      toast.success('14-day trial started!');
      fetchBusiness();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start trial');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    const action = business.isActive ? 'suspend' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this business?`)) return;
    try {
      setSaving(true);
      await api.post(`/api/business/${id}/toggle-status`, { isActive: !business.isActive });
      toast.success(`Business ${action}d`);
      fetchBusiness();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!business) return null;

  const status = getStatus(business);
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Back ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          to={`/super-admin/businesses/${id}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {business.businessName}
        </Link>

        <Button
          size="sm"
          variant={business.isActive ? 'warning' : 'success'}
          icon={Power}
          onClick={handleToggleStatus}
          disabled={saving}
        >
          {business.isActive ? 'Suspend Business' : 'Activate Business'}
        </Button>
      </div>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Subscription Management</h1>
        <p className="text-gray-500 flex items-center gap-2 mt-1">
          <Building2 className="w-4 h-4" />
          {business.businessName} · {business.slug}.{import.meta.env.VITE_ROOT_DOMAIN || 'yourdomain.com'}
        </p>
      </div>

      {/* ── Current status card ────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Current Status</p>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                status.variant === 'success' ? 'bg-green-100' :
                status.variant === 'warning' ? 'bg-yellow-100' :
                status.variant === 'info'    ? 'bg-blue-100' :
                status.variant === 'danger'  ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                <StatusIcon className={`w-6 h-6 ${
                  status.variant === 'success' ? 'text-green-600' :
                  status.variant === 'warning' ? 'text-yellow-600' :
                  status.variant === 'info'    ? 'text-blue-600' :
                  status.variant === 'danger'  ? 'text-red-600' : 'text-gray-500'
                }`} />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{status.label}</p>
                <p className="text-sm text-gray-500 capitalize">
                  Plan: {business.subscriptionPlan?.replace(/_/g, ' ') || 'None'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {business.trialStartDate && (
              <div>
                <p className="text-gray-500">Trial Started</p>
                <p className="font-semibold">{formatDate(business.trialStartDate, 'short')}</p>
              </div>
            )}
            {business.trialEndsAt && (
              <div>
                <p className="text-gray-500">Trial Ends</p>
                <p className="font-semibold text-yellow-600">{formatDate(business.trialEndsAt, 'short')}</p>
              </div>
            )}
            {business.subscriptionStartDate && (
              <div>
                <p className="text-gray-500">Sub Started</p>
                <p className="font-semibold">{formatDate(business.subscriptionStartDate, 'short')}</p>
              </div>
            )}
            {business.subscriptionExpiry && (
              <div>
                <p className="text-gray-500">Sub Expires</p>
                <p className={`font-semibold ${daysUntil(business.subscriptionExpiry) <= 7 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(business.subscriptionExpiry, 'short')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {business.subscriptionNotes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Admin Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{business.subscriptionNotes}</p>
          </div>
        )}
      </Card>

      {/* ── Start trial (if not used) ──────────────────────────────────────── */}
      {!business.trialStartDate && (
        <Card>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-xl flex-shrink-0">
              <Gift className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">Free Trial Available</h3>
              <p className="text-sm text-gray-600 mb-3">
                This business has not used their free trial yet. Start a 14-day trial to give them
                full platform access before requiring a subscription.
              </p>
              <Button icon={Gift} onClick={handleStartTrial} disabled={saving}>
                Start 14-Day Free Trial
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Update subscription form ───────────────────────────────────────── */}
      <Card title="Update Subscription">
        <form onSubmit={handleUpdateSubscription} className="space-y-6">

          {/* Plan selection */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Select Plan</p>
            <div className="space-y-3">
              <PlanCard
                value="monthly"
                label="Monthly"
                desc="Billed every 30 days"
                price="30-day access"
                selected={selectedPlan === 'monthly'}
                onClick={setSelectedPlan}
              />
              <PlanCard
                value="annual"
                label="Annual"
                desc="Billed every 365 days"
                price="365-day access"
                selected={selectedPlan === 'annual'}
                onClick={setSelectedPlan}
              />
              <PlanCard
                value="none"
                label="No Plan"
                desc="Remove active subscription"
                price="—"
                selected={selectedPlan === 'none'}
                onClick={setSelectedPlan}
              />
            </div>
          </div>

          {/* Custom date */}
          {selectedPlan !== 'none' && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={useCustomDate}
                  onChange={e => setUseCustomDate(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Use custom expiry date</span>
              </label>

              {useCustomDate && (
                <div>
                  <label className="label text-sm">Custom Expiry Date</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={customExpiry}
                    onChange={e => setCustomExpiry(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required={useCustomDate}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave unchecked to auto-calculate from today (30 days for monthly, 365 for annual)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Re-activate option */}
          {!business.isActive && (
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-green-50 border border-green-200 rounded-lg">
              <input
                type="checkbox"
                checked={activateBusiness}
                onChange={e => setActivateBusiness(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-green-600"
              />
              <span className="text-sm font-medium text-green-800">
                Re-activate business when saving subscription
              </span>
            </label>
          )}

          {/* Admin notes */}
          <div>
            <label className="label text-sm">Admin Notes (optional)</label>
            <textarea
              className="input w-full"
              rows="2"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Payment received via transfer, renewal agreed..."
            />
            <p className="text-xs text-gray-500 mt-1">Notes are appended with a timestamp to the subscription history</p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2 border-t">
            <Button type="submit" icon={Save} disabled={saving} loading={saving} fullWidth>
              {saving ? 'Saving...' : 'Save Subscription'}
            </Button>
            <Link to={`/super-admin/businesses/${id}`} className="flex-1">
              <Button type="button" variant="outline" fullWidth>Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SuperAdminBusinessSubscription;