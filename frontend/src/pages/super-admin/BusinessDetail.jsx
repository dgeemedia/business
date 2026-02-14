// frontend/src/pages/super-admin/BusinessDetail.jsx
import React, { useState, useEffect } from 'react';
import {
  Building2, ArrowLeft, Power, Trash2, DollarSign,
  Package, ShoppingBag, Users as UsersIcon, CheckCircle,
  XCircle, Clock, AlertCircle, Globe, Phone, Mail,
  MessageCircle, MapPin, Edit, Gift, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Button, Badge, LoadingSpinner } from '../../components/shared';
import api from '../../services/api';
import { formatDate, daysUntil } from '../../utils/helpers';

const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || 'yourdomain.com';

function InfoRow({ icon: Icon, label, value, mono }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">{label}</p>
        <p className={`text-sm text-gray-900 font-medium break-all ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`bg-${color}-50 border border-${color}-100 rounded-xl p-4 text-center`}>
      <Icon className={`w-5 h-5 text-${color}-500 mx-auto mb-2`} />
      <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

const SuperAdminBusinessDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [users, setUsers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bizRes, usersRes] = await Promise.all([
        api.get(`/api/business/${id}`),
        api.get(`/api/users?businessId=${id}`).catch(() => ({ data: [] })),
      ]);
      setBusiness(bizRes.data);
      setUsers(usersRes.data?.users || usersRes.data || []);
    } catch (error) {
      toast.error('Failed to load business details');
      navigate('/super-admin/businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    const action = business.isActive ? 'suspend' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this business?`)) return;
    try {
      setActionLoading(true);
      await api.post(`/api/business/${id}/toggle-status`, { isActive: !business.isActive });
      toast.success(`Business ${action}d`);
      fetchData();
    } catch {
      toast.error(`Failed to ${action} business`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('⚠️ This will permanently delete the business and ALL its data. This cannot be undone. Continue?')) return;
    try {
      setActionLoading(true);
      await api.delete(`/api/business/${id}`);
      toast.success('Business deleted');
      navigate('/super-admin/businesses');
    } catch {
      toast.error('Failed to delete business');
      setActionLoading(false);
    }
  };

  const handleStartTrial = async () => {
    if (!confirm('Start 14-day free trial for this business?')) return;
    try {
      setActionLoading(true);
      await api.post(`/api/business/${id}/start-trial`);
      toast.success('Free trial started!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start trial');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Subscription badge ────────────────────────────────────────────────────
  const getSubBadge = (b) => {
    if (!b.isActive) return <Badge variant="danger" icon={XCircle}>Suspended</Badge>;
    if (b.subscriptionPlan === 'free_trial') {
      const d = daysUntil(b.trialEndsAt);
      return <Badge variant={d <= 3 ? 'warning' : 'info'} icon={Clock}>Trial — {d}d left</Badge>;
    }
    if (b.subscriptionExpiry) {
      const d = daysUntil(b.subscriptionExpiry);
      if (d < 0)  return <Badge variant="danger"  icon={AlertCircle}>Expired</Badge>;
      if (d <= 7) return <Badge variant="warning" icon={AlertCircle}>Expiring in {d}d</Badge>;
      return <Badge variant="success" icon={CheckCircle}>Active</Badge>;
    }
    return <Badge variant="gray">No Subscription</Badge>;
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!business) return null;

  const subdomainUrl = `https://${business.slug}.${ROOT_DOMAIN}`;

  return (
    <div className="space-y-6">
      {/* ── Back + Actions bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          to="/super-admin/businesses"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Businesses
        </Link>

        <div className="flex flex-wrap gap-2">
          <Link to={`/super-admin/businesses/${id}/subscription`}>
            <Button size="sm" variant="outline" icon={DollarSign}>Manage Subscription</Button>
          </Link>

          {!business.trialStartDate && business.subscriptionPlan !== 'free_trial' && (
            <Button size="sm" variant="info" icon={Gift} onClick={handleStartTrial} disabled={actionLoading}>
              Start Trial
            </Button>
          )}

          <Button
            size="sm"
            variant={business.isActive ? 'warning' : 'success'}
            icon={Power}
            onClick={handleToggleStatus}
            disabled={actionLoading}
          >
            {business.isActive ? 'Suspend' : 'Activate'}
          </Button>

          <Button size="sm" variant="danger" icon={Trash2} onClick={handleDelete} disabled={actionLoading}>
            Delete
          </Button>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-gray-900">{business.businessName}</h1>
              {getSubBadge(business)}
            </div>
            <a
              href={subdomainUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 font-mono text-sm hover:underline flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              {subdomainUrl}
            </a>
            {business.description && (
              <p className="text-gray-600 text-sm mt-2 max-w-2xl">{business.description}</p>
            )}
          </div>
        </div>
      </Card>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Package}     label="Products" value={business._count?.products ?? 0} color="blue"   />
        <StatCard icon={ShoppingBag} label="Orders"   value={business._count?.orders   ?? 0} color="green"  />
        <StatCard icon={UsersIcon}   label="Users"    value={business._count?.users    ?? 0} color="purple" />
        <StatCard icon={Clock}       label="Days Active"
          value={Math.max(0, Math.floor((Date.now() - new Date(business.createdAt)) / 86400000))}
          color="orange"
        />
      </div>

      {/* ── Two-column detail ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Business Info */}
        <Card title="Business Details">
          <InfoRow icon={Phone}          label="Phone"      value={business.phone} />
          <InfoRow icon={MessageCircle}  label="WhatsApp"   value={business.whatsappNumber} />
          <InfoRow icon={Mail}           label="Email"      value={business.email} />
          <InfoRow icon={MapPin}         label="Address"    value={business.address} />
          <InfoRow icon={Building2}      label="Category"   value={business.businessType?.replace(/_/g, ' ')} />
          <InfoRow icon={Globe}          label="Subdomain"  value={business.slug} mono />
          <InfoRow icon={Clock}          label="Created"    value={formatDate(business.createdAt)} />
        </Card>

        {/* Subscription Info */}
        <Card
          title="Subscription"
          action={
            <Link to={`/super-admin/businesses/${id}/subscription`}>
              <Button size="xs" variant="outline" icon={Edit}>Manage</Button>
            </Link>
          }
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Plan</span>
              <span className="font-semibold capitalize text-sm">
                {business.subscriptionPlan?.replace(/_/g, ' ') || 'None'}
              </span>
            </div>

            {business.subscriptionPlan === 'free_trial' && business.trialEndsAt && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Trial Started</span>
                  <span className="font-medium text-sm">{formatDate(business.trialStartDate, 'short')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Trial Ends</span>
                  <span className="font-medium text-sm text-yellow-600">{formatDate(business.trialEndsAt, 'short')}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">Days Remaining</span>
                  <span className={`font-bold text-sm ${daysUntil(business.trialEndsAt) <= 3 ? 'text-red-600' : 'text-green-600'}`}>
                    {daysUntil(business.trialEndsAt)}d
                  </span>
                </div>
              </>
            )}

            {business.subscriptionExpiry && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Started</span>
                  <span className="font-medium text-sm">{formatDate(business.subscriptionStartDate, 'short')}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">Expires</span>
                  <span className={`font-bold text-sm ${daysUntil(business.subscriptionExpiry) < 7 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(business.subscriptionExpiry, 'short')}
                  </span>
                </div>
              </>
            )}

            {!business.subscriptionExpiry && business.subscriptionPlan === 'none' && (
              <div className="text-center py-6 text-gray-500">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No active subscription</p>
                <Link to={`/super-admin/businesses/${id}/subscription`}>
                  <Button size="sm" className="mt-3" icon={DollarSign}>Set Up Subscription</Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Users in this business ─────────────────────────────────────────── */}
      <Card title={`Users (${users.length})`}>
        {users.length === 0 ? (
          <p className="text-center py-8 text-gray-500 text-sm">No users in this business</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={u.role === 'admin' ? 'primary' : 'info'} size="sm">
                    {u.role}
                  </Badge>
                  <Badge variant={u.active ? 'success' : 'danger'} size="sm">
                    {u.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SuperAdminBusinessDetail;