// frontend/src/pages/super-admin/Subscriptions.jsx
import React, { useState, useEffect } from 'react';
import {
  DollarSign, Search, CheckCircle, XCircle, Clock,
  AlertCircle, Building2, RefreshCw, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Badge, LoadingSpinner, Input } from '../../components/shared';
import api from '../../services/api';
import { formatDate, daysUntil, isExpired } from '../../utils/helpers';

function getStatusInfo(b) {
  if (!b.isActive) return { label: 'Suspended',      variant: 'danger',  icon: XCircle,     priority: 4 };
  if (b.subscriptionPlan === 'free_trial') {
    const d = daysUntil(b.trialEndsAt);
    if (d <= 0) return { label: 'Trial Expired',     variant: 'danger',  icon: XCircle,     priority: 5, days: 0 };
    return {             label: `Trial — ${d}d left`, variant: d <= 3 ? 'warning' : 'info', icon: Clock, priority: d <= 3 ? 3 : 1, days: d };
  }
  if (b.subscriptionExpiry) {
    const d = daysUntil(b.subscriptionExpiry);
    if (d < 0)  return { label: 'Expired',           variant: 'danger',  icon: XCircle,     priority: 5, days: d };
    if (d <= 7) return { label: `Expiring — ${d}d`,  variant: 'warning', icon: AlertCircle, priority: 3, days: d };
    return       { label: 'Active',                   variant: 'success', icon: CheckCircle, priority: 0, days: d };
  }
  return { label: 'No Subscription', variant: 'gray', icon: DollarSign, priority: 2 };
}

const FILTER_TABS = [
  { key: 'all',      label: 'All'          },
  { key: 'active',   label: 'Active'       },
  { key: 'trial',    label: 'On Trial'     },
  { key: 'expiring', label: 'Expiring Soon'},
  { key: 'expired',  label: 'Expired'      },
  { key: 'none',     label: 'No Plan'      },
];

const SuperAdminSubscriptions = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');

  useEffect(() => { fetchBusinesses(); }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/business');
      setBusinesses(res.data.businesses || res.data || []);
    } catch {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const filtered = businesses
    .filter(b => {
      const s = search.toLowerCase();
      if (s && !b.businessName?.toLowerCase().includes(s) && !b.slug?.toLowerCase().includes(s)) return false;
      const info = getStatusInfo(b);
      if (filter === 'active')   return info.variant === 'success';
      if (filter === 'trial')    return b.subscriptionPlan === 'free_trial' && (info.days ?? 1) > 0;
      if (filter === 'expiring') return info.label.startsWith('Expiring');
      if (filter === 'expired')  return info.label === 'Expired' || info.label === 'Trial Expired';
      if (filter === 'none')     return info.label === 'No Subscription';
      return true;
    })
    .sort((a, b) => getStatusInfo(b).priority - getStatusInfo(a).priority);

  // Summary counts
  const counts = {
    all:      businesses.length,
    active:   businesses.filter(b => getStatusInfo(b).variant === 'success').length,
    trial:    businesses.filter(b => b.subscriptionPlan === 'free_trial' && (daysUntil(b.trialEndsAt) ?? 1) > 0).length,
    expiring: businesses.filter(b => getStatusInfo(b).label.startsWith('Expiring')).length,
    expired:  businesses.filter(b => ['Expired','Trial Expired'].includes(getStatusInfo(b).label)).length,
    none:     businesses.filter(b => getStatusInfo(b).label === 'No Subscription').length,
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-1">Subscriptions</h1>
          <p className="text-gray-500">Manage all business subscription plans</p>
        </div>
        <button
          onClick={fetchBusinesses}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              filter === tab.key
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-100 bg-white hover:border-blue-200'
            }`}
          >
            <p className={`text-2xl font-black ${filter === tab.key ? 'text-blue-600' : 'text-gray-900'}`}>
              {counts[tab.key]}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{tab.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search businesses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          icon={Search}
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-16 text-gray-400">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No businesses match this filter</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b, i) => {
            const info = getStatusInfo(b);
            const StatusIcon = info.icon;
            const expiry = b.subscriptionPlan === 'free_trial' ? b.trialEndsAt : b.subscriptionExpiry;

            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link to={`/super-admin/businesses/${b.id}/subscription`}>
                  <Card className="hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>

                      {/* Business info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{b.businessName}</p>
                        <p className="text-sm text-gray-500 font-mono truncate">{b.slug}</p>
                      </div>

                      {/* Plan */}
                      <div className="hidden sm:block text-center px-4">
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Plan</p>
                        <p className="text-sm font-semibold text-gray-700 capitalize">
                          {b.subscriptionPlan?.replace(/_/g, ' ') || 'None'}
                        </p>
                      </div>

                      {/* Expiry */}
                      <div className="hidden md:block text-center px-4">
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                          {b.subscriptionPlan === 'free_trial' ? 'Trial Ends' : 'Expires'}
                        </p>
                        <p className="text-sm font-semibold text-gray-700">
                          {expiry ? formatDate(expiry, 'short') : '—'}
                        </p>
                      </div>

                      {/* Status badge */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                          info.variant === 'success' ? 'bg-green-100 text-green-700' :
                          info.variant === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                          info.variant === 'danger'  ? 'bg-red-100 text-red-700' :
                          info.variant === 'info'    ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <StatusIcon className="w-3 h-3" />
                          {info.label}
                        </span>
                      </div>

                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuperAdminSubscriptions;