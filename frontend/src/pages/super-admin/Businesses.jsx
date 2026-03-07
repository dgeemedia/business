// frontend/src/pages/super-admin/SuperAdminBusinesses.jsx
// ✅ UPDATED — added "Export CSV" button that downloads all visible businesses
//   with key columns: Name, Slug, Type, Status, Plan, Trial/Expiry, Revenue
//   (Today/Month/Year/Total), Orders, Products, Created Date

import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Search, Trash2, Power,
  DollarSign, Package, ShoppingBag, Users as UsersIcon,
  Eye, CheckCircle, XCircle, Clock, AlertCircle, Gift,
  Download,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Modal, LoadingSpinner, EmptyState, Input } from '../../components/shared';
import api, { buildSubdomainUrl } from '../../services/api';
import { formatDate, daysUntil, isExpired, exportToCSV } from '../../utils/helpers';
import BusinessCreatedSuccess from '../../components/super-admin/BusinessCreatedSuccess';
import { ReferralCodeField } from '../../components/shared/ReferralCodeField';

// ============================================================================
// BUSINESS CATEGORIES
// ============================================================================
const BUSINESS_CATEGORIES = [
  { value: 'restaurant',         label: '🍽️  Restaurant' },
  { value: 'fast_food',          label: '🍔  Fast Food / Snacks' },
  { value: 'bakery',             label: '🥐  Bakery & Pastry' },
  { value: 'cafe',               label: '☕  Café & Coffee Shop' },
  { value: 'bar_lounge',         label: '🍻  Bar & Lounge' },
  { value: 'catering',           label: '🍱  Catering Service' },
  { value: 'food_delivery',      label: '🛵  Food Delivery' },
  { value: 'hotel',              label: '🏨  Hotel' },
  { value: 'apartment_shortlet', label: '🏢  Apartment / Shortlet' },
  { value: 'guesthouse',         label: '🏡  Guesthouse / B&B' },
  { value: 'hostel',             label: '🛏️  Hostel' },
  { value: 'resort',             label: '🌴  Resort' },
  { value: 'event_center',       label: '🎪  Event Center / Hall' },
  { value: 'car_sales',          label: '🚗  Car Sales / Auto Dealer' },
  { value: 'car_rental',         label: '🚙  Car Rental' },
  { value: 'auto_repair',        label: '🔧  Auto Repair / Mechanic' },
  { value: 'spare_parts',        label: '⚙️  Auto Spare Parts' },
  { value: 'logistics',          label: '🚚  Logistics / Haulage' },
  { value: 'fashion',            label: '👗  Fashion & Clothing' },
  { value: 'footwear',           label: '👟  Footwear & Shoes' },
  { value: 'accessories',        label: '💍  Accessories & Jewelry' },
  { value: 'fabric_textile',     label: '🧵  Fabric & Textile' },
  { value: 'salon_hair',         label: '💇  Salon & Hair Care' },
  { value: 'spa_beauty',         label: '💆  Spa & Beauty Center' },
  { value: 'makeup_artist',      label: '💄  Makeup Artist' },
  { value: 'pharmacy',           label: '💊  Pharmacy' },
  { value: 'hospital_clinic',    label: '🏥  Hospital / Clinic' },
  { value: 'dental',             label: '🦷  Dental Clinic' },
  { value: 'optician',           label: '👓  Optician / Eye Care' },
  { value: 'fitness_gym',        label: '🏋️  Fitness / Gym' },
  { value: 'health_supplement',  label: '🌿  Health Supplements' },
  { value: 'farm_produce',       label: '🌾  Farm Produce' },
  { value: 'livestock',          label: '🐄  Livestock / Animal Sales' },
  { value: 'poultry',            label: '🐔  Poultry Farm' },
  { value: 'fish_seafood',       label: '🐟  Fish & Seafood' },
  { value: 'agro_input',         label: '🌱  Agro Input / Fertilizer' },
  { value: 'food_processing',    label: '🏭  Food Processing' },
  { value: 'electronics',        label: '📱  Electronics & Gadgets' },
  { value: 'phone_accessories',  label: '🔌  Phone & Accessories' },
  { value: 'computer_it',        label: '💻  Computer / IT Services' },
  { value: 'solar_energy',       label: '☀️  Solar & Energy' },
  { value: 'appliances',         label: '📺  Home Appliances' },
  { value: 'supermarket',        label: '🛒  Supermarket / Mini-Mart' },
  { value: 'wholesale',          label: '📦  Wholesale / Distribution' },
  { value: 'hardware_building',  label: '🔨  Hardware & Building Materials' },
  { value: 'furniture',          label: '🪑  Furniture & Home Décor' },
  { value: 'books_stationery',   label: '📚  Books & Stationery' },
  { value: 'gift_shop',          label: '🎁  Gift Shop' },
  { value: 'cleaning',           label: '🧹  Cleaning Services' },
  { value: 'real_estate',        label: '🏘️  Real Estate' },
  { value: 'legal',              label: '⚖️  Legal Services' },
  { value: 'financial',          label: '💰  Financial / Accounting' },
  { value: 'education',          label: '🎓  Education / Tutoring' },
  { value: 'photography',        label: '📸  Photography / Videography' },
  { value: 'printing',           label: '🖨️  Printing & Branding' },
  { value: 'travel_agency',      label: '✈️  Travel Agency' },
  { value: 'security',           label: '🔐  Security Services' },
  { value: 'laundry',            label: '👕  Laundry / Dry Cleaning' },
  { value: 'event_planning',     label: '🎊  Event Planning' },
  { value: 'other',              label: '🏪  Other' },
];

const defaultForm = {
  businessName:   '',
  slug:           '',
  businessType:   'restaurant',
  phone:          '',
  whatsappNumber: '',
  description:    '',
  adminEmail:     '',
  adminFirstName: '',
  adminLastName:  '',
  adminPhone:     '',
  startWithTrial: true,
};

// ============================================================================
// REVENUE FORMATTER (NGN short-form for cards)
// ============================================================================
function fmtRevenue(amount) {
  const n = Number(amount || 0);
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 100_000)   return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n.toLocaleString()}`;
}

// ============================================================================
// CSV EXPORT HELPER — shapes business + stats into clean rows
// ============================================================================
function buildExportRows(businesses, bizStats) {
  return businesses.map(b => {
    const s = bizStats[b.id] || {};

    // Subscription status label
    let subStatus = 'None';
    if (!b.isActive) {
      subStatus = 'Suspended';
    } else if (b.subscriptionPlan === 'free_trial') {
      const d = daysUntil(b.trialEndsAt);
      subStatus = d <= 0 ? 'Trial Expired' : `Trial (${d}d left)`;
    } else if (b.subscriptionExpiry) {
      const d = daysUntil(b.subscriptionExpiry);
      subStatus = d < 0 ? 'Expired' : d <= 7 ? `Expiring (${d}d)` : 'Active';
    }

    return {
      'Business Name':     b.businessName      || '',
      'Slug':              b.slug               || '',
      'Category':          (b.businessType     || '').replace(/_/g, ' '),
      'Status':            b.isActive ? 'Active' : 'Suspended',
      'Subscription':      (b.subscriptionPlan || 'none').replace(/_/g, ' '),
      'Sub Status':        subStatus,
      'Trial End':         b.trialEndsAt         ? formatDate(b.trialEndsAt,        'medium') : '',
      'Sub Expiry':        b.subscriptionExpiry  ? formatDate(b.subscriptionExpiry, 'medium') : '',
      'Last Payment':      b.lastPaymentDate     ? formatDate(b.lastPaymentDate,    'medium') : '',
      'Revenue Today':     Number(s.revenueToday       || 0).toFixed(2),
      'Revenue This Month':Number(s.revenueThisMonth   || 0).toFixed(2),
      'Revenue This Year': Number(s.revenueThisYear    || 0).toFixed(2),
      'Total Revenue':     Number(s.totalRevenue       || 0).toFixed(2),
      'Total Orders':      s.totalOrders     ?? (b._count?.orders   || 0),
      'Total Products':    s.totalProducts   ?? (b._count?.products || 0),
      'Total Users':       b._count?.users   || 0,
      'Referral Code':     b.referralCode    || '',
      'Total Referrals':   b.totalReferrals  || 0,
      'Referral Balance':  Number(b.referralBonus || 0).toFixed(2),
      'Phone':             b.phone           || '',
      'WhatsApp':          b.whatsappNumber  || '',
      'Email':             b.email           || '',
      'Address':           b.address         || '',
      'Store URL':         buildSubdomainUrl(b.slug),
      'Created Date':      b.createdAt ? formatDate(b.createdAt, 'medium') : '',
    };
  });
}

// ============================================================================
// COMPONENT
// ============================================================================
const SuperAdminBusinesses = () => {
  const [businesses,      setBusinesses]      = useState([]);
  const [bizStats,        setBizStats]        = useState({});
  const [loading,         setLoading]         = useState(true);
  const [searchTerm,      setSearchTerm]      = useState('');
  const [filterStatus,    setFilterStatus]    = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating,        setCreating]        = useState(false);
  const [formData,        setFormData]        = useState(defaultForm);
  const [referralCode,    setReferralCode]    = useState('');
  const [successData,     setSuccessData]     = useState(null);
  const [exporting,       setExporting]       = useState(false);

  useEffect(() => { fetchBusinesses(); }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/business');
      const list = res.data.businesses || res.data || [];
      setBusinesses(list);

      try {
        const statsRes = await api.get('/api/stats/all-businesses');
        const statsMap = {};
        for (const s of (statsRes.data.businesses || [])) {
          statsMap[s.id] = s;
        }
        setBizStats(statsMap);
      } catch (e) {
        console.warn('Could not load business revenue stats:', e?.response?.data?.error || e.message);
      }
    } catch {
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const rows = buildExportRows(filtered, bizStats);
    if (rows.length === 0) {
      toast.error('No businesses to export');
      return;
    }
    setExporting(true);
    try {
      exportToCSV(rows, `mypadibusiness-businesses${filterStatus !== 'all' ? `-${filterStatus}` : ''}`);
      toast.success(`Exported ${rows.length} business${rows.length !== 1 ? 'es' : ''} to CSV`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreateBusiness = async (e) => {
    e.preventDefault();

    if (!formData.businessName.trim())    return toast.error('Business name is required');
    if (!formData.slug.trim())            return toast.error('Slug is required');
    if (!formData.phone.trim())           return toast.error('Business phone is required');
    if (!formData.whatsappNumber.trim())  return toast.error('WhatsApp number is required');
    if (!formData.adminEmail.trim())      return toast.error('Owner email is required');
    if (!formData.adminFirstName.trim())  return toast.error('Owner first name is required');

    try {
      setCreating(true);
      const res = await api.post('/api/business', {
        ...formData,
        referralCode: referralCode || undefined,
      });
      setCreateModalOpen(false);
      setFormData(defaultForm);
      setReferralCode('');
      setSuccessData(res.data);
      fetchBusinesses();

      // ── WhatsApp login delivery ──────────────────────────────────────────
      const { business, admin } = res.data;
      const rawPhone = (formData.adminPhone || formData.whatsappNumber).replace(/[\s\-().]/g, '');
      const waNumber = rawPhone.startsWith('+')
        ? rawPhone.slice(1)
        : rawPhone.startsWith('0')
          ? '234' + rawPhone.slice(1)
          : rawPhone.startsWith('234')
            ? rawPhone
            : '234' + rawPhone;

      const loginMsg = [
        `Hi ${formData.adminFirstName} 👋`,
        ``,
        `Your business *${formData.businessName}* has been created on *MyPadiBusiness*! 🎉`,
        ``,
        `Here are your login details:`,
        ``,
        `🌐 *Store URL:* ${buildSubdomainUrl(business.slug)}`,
        `📧 *Email:* ${formData.adminEmail}`,
        `🔑 *Temporary Password:* ${admin.temporaryPassword}`,
        ``,
        `👉 Login at: ${window.location.origin}/login`,
        ``,
        `⚠️ Please change your password after your first login.`,
        ``,
        `Your 14-day free trial is now active. Welcome aboard! 🚀`,
        ``,
        `— MyPadiBusiness Team`,
      ].join('\n');

      window.open(
        `https://wa.me/${waNumber}?text=${encodeURIComponent(loginMsg)}`,
        '_blank'
      );
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create business');
    } finally {
      setCreating(false);
    }
  };

  const field = (key) => (e) =>
    setFormData(prev => ({ ...prev, [key]: e.target.value }));

  const handleNameChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      businessName: value,
      slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }));
  };

  const handleSlugChange = (e) => {
    setFormData(prev => ({
      ...prev,
      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/(^-|-$)/g, ''),
    }));
  };

  // ── Toggle status ─────────────────────────────────────────────────────────
  const handleToggleStatus = async (businessId, currentStatus) => {
    const action = currentStatus ? 'suspend' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this business?`)) return;
    try {
      await api.post(`/api/business/${businessId}/toggle-status`, { isActive: !currentStatus });
      toast.success(`Business ${action}d successfully`);
      fetchBusinesses();
    } catch {
      toast.error(`Failed to ${action} business`);
    }
  };

  const handleDelete = async (businessId) => {
    if (!confirm('⚠️ This will permanently delete the business and all its data. Are you sure?')) return;
    try {
      await api.delete(`/api/business/${businessId}`);
      toast.success('Business deleted');
      fetchBusinesses();
    } catch {
      toast.error('Failed to delete business');
    }
  };

  const handleStartTrial = async (businessId) => {
    if (!confirm('Start 14-day free trial for this business?')) return;
    try {
      await api.post(`/api/business/${businessId}/start-trial`);
      toast.success('Free trial started!');
      fetchBusinesses();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start trial');
    }
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = businesses.filter(b => {
    const s = searchTerm.toLowerCase();
    const matchSearch =
      b.businessName?.toLowerCase().includes(s) ||
      b.slug?.toLowerCase().includes(s) ||
      b.email?.toLowerCase().includes(s);

    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active'    && b.isActive) ||
      (filterStatus === 'suspended' && !b.isActive) ||
      (filterStatus === 'trial'     && b.subscriptionPlan === 'free_trial') ||
      (filterStatus === 'expired'   && isExpired(b.subscriptionExpiry));

    return matchSearch && matchStatus;
  });

  const getSubBadge = (b) => {
    if (!b.isActive) return <Badge variant="danger" icon={XCircle}>Suspended</Badge>;
    if (b.subscriptionPlan === 'free_trial') {
      const d = daysUntil(b.trialEndsAt);
      return <Badge variant={d <= 3 ? 'warning' : 'info'} icon={Clock}>Trial ({d}d left)</Badge>;
    }
    if (b.subscriptionExpiry) {
      const d = daysUntil(b.subscriptionExpiry);
      if (d < 0)  return <Badge variant="danger"  icon={AlertCircle}>Expired</Badge>;
      if (d <= 7) return <Badge variant="warning" icon={AlertCircle}>Expiring ({d}d)</Badge>;
      return <Badge variant="success" icon={CheckCircle}>Active</Badge>;
    }
    return <Badge variant="gray">No Subscription</Badge>;
  };

  const pageCounts = {
    total:     businesses.length,
    active:    businesses.filter(b => b.isActive).length,
    suspended: businesses.filter(b => !b.isActive).length,
    trial:     businesses.filter(b => b.subscriptionPlan === 'free_trial').length,
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">

      {/* ── Success / Credential Screen ─────────────────────────────────── */}
      {successData && (
        <BusinessCreatedSuccess
          data={successData}
          onClose={() => setSuccessData(null)}
        />
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Businesses</h1>
          <p className="text-gray-600">Manage all onboarded businesses</p>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ Export CSV */}
          <Button
            variant="outline"
            icon={Download}
            onClick={handleExportCSV}
            disabled={exporting || filtered.length === 0}
            title={`Export ${filtered.length} business${filtered.length !== 1 ? 'es' : ''} to CSV`}
          >
            Export CSV {filtered.length > 0 && `(${filtered.length})`}
          </Button>
          <Button icon={Plus} onClick={() => setCreateModalOpen(true)}>Create Business</Button>
        </div>
      </div>

      {/* ── Page-level counts ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',     value: pageCounts.total,     color: 'blue'   },
          { label: 'Active',    value: pageCounts.active,    color: 'green'  },
          { label: 'Suspended', value: pageCounts.suspended, color: 'red'    },
          { label: 'On Trial',  value: pageCounts.trial,     color: 'yellow' },
        ].map((s, i) => (
          <Card key={i} className={`bg-${s.color}-50 border-${s.color}-200`}>
            <p className="text-sm text-gray-600">{s.label}</p>
            <p className={`text-3xl font-bold text-${s.color}-600`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* ── Search & Filter ───────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search businesses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'active', 'suspended', 'trial', 'expired'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {/* Export hint when filtered */}
        {filterStatus !== 'all' && filtered.length > 0 && (
          <p className="text-xs text-gray-400 mt-3">
            Showing {filtered.length} {filterStatus} business{filtered.length !== 1 ? 'es' : ''} — Export CSV will include only these.
          </p>
        )}
      </Card>

      {/* ── Business Grid ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="No businesses found"
            description={searchTerm ? 'Try adjusting your search' : 'Create your first business to get started'}
            actionLabel="Create Business"
            onAction={() => setCreateModalOpen(true)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((b, i) => {
            const s = bizStats[b.id] || {};
            const storeUrl = buildSubdomainUrl(b.slug);

            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">

                  {/* Business header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{b.businessName}</h3>
                      <a
                        href={storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 font-mono hover:underline"
                      >
                        {storeUrl}
                      </a>
                      <div className="mt-1">{getSubBadge(b)}</div>
                    </div>
                  </div>

                  {/* Products / Orders row */}
                  <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <Package className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                      <p className="text-sm font-semibold text-gray-900">
                        {s.totalProducts ?? b._count?.products ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">Products</p>
                    </div>
                    <div className="text-center">
                      <ShoppingBag className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                      <p className="text-sm font-semibold text-gray-900">
                        {s.totalOrders ?? b._count?.orders ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">Orders</p>
                    </div>
                  </div>

                  {/* Revenue breakdown */}
                  <div className="mb-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                    <div className="flex items-center gap-1 mb-2">
                      <DollarSign className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Revenue</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-sm font-bold text-green-700">{fmtRevenue(s.revenueToday)}</p>
                        <p className="text-[10px] text-gray-500">Today</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-700">{fmtRevenue(s.revenueThisMonth)}</p>
                        <p className="text-[10px] text-gray-500">Month</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-700">{fmtRevenue(s.revenueThisYear)}</p>
                        <p className="text-[10px] text-gray-500">Year</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-green-100 flex justify-between text-xs text-gray-500">
                      <span>Total ever: <span className="font-semibold text-gray-700">{fmtRevenue(s.totalRevenue)}</span></span>
                      <span>Listed: <span className="font-semibold text-gray-700">{formatDate(b.createdAt, 'short')}</span></span>
                    </div>
                  </div>

                  {/* Subscription info */}
                  <div className="space-y-1.5 mb-4 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Plan:</span>
                      <span className="font-medium capitalize">
                        {b.subscriptionPlan?.replace('_', ' ') || 'None'}
                      </span>
                    </div>
                    {b.subscriptionPlan === 'free_trial' && b.trialEndsAt && (
                      <div className="flex justify-between">
                        <span>Trial Ends:</span>
                        <span className="font-medium text-yellow-600">{formatDate(b.trialEndsAt, 'short')}</span>
                      </div>
                    )}
                    {b.subscriptionExpiry && (
                      <div className="flex justify-between">
                        <span>Expires:</span>
                        <span className="font-medium">{formatDate(b.subscriptionExpiry, 'short')}</span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/super-admin/businesses/${b.id}`}>
                      <Button size="sm" variant="outline" icon={Eye}>View</Button>
                    </Link>
                    <Link to={`/super-admin/businesses/${b.id}/subscription`}>
                      <Button size="sm" variant="outline" icon={DollarSign}>Subscription</Button>
                    </Link>
                    {!b.trialStartDate && b.subscriptionPlan !== 'free_trial' && (
                      <Button size="sm" variant="info" icon={Gift} onClick={() => handleStartTrial(b.id)}>
                        Start Trial
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={b.isActive ? 'warning' : 'success'}
                      icon={Power}
                      onClick={() => handleToggleStatus(b.id, b.isActive)}
                    >
                      {b.isActive ? 'Suspend' : 'Activate'}
                    </Button>
                    <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(b.id)}>
                      Delete
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Create Business Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Business"
        size="lg"
      >
        <form onSubmit={handleCreateBusiness} className="space-y-4">

          <Input
            label="Business Name *"
            value={formData.businessName}
            onChange={handleNameChange}
            required
            placeholder="e.g., Mama's Kitchen"
          />

          <Input
            label="Store Slug *"
            value={formData.slug}
            onChange={handleSlugChange}
            required
            placeholder="mamas-kitchen"
            helperText={`Store URL: ${buildSubdomainUrl(formData.slug || 'your-slug')}`}
          />

          <div>
            <label className="label">Business Category *</label>
            <select
              className="input w-full"
              value={formData.businessType}
              onChange={field('businessType')}
              required
            >
              {BUSINESS_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <Input
            label="Business Phone *"
            type="tel"
            value={formData.phone}
            onChange={field('phone')}
            required
            placeholder="+234 800 000 0000"
          />

          <Input
            label="WhatsApp Number *"
            type="tel"
            value={formData.whatsappNumber}
            onChange={field('whatsappNumber')}
            required
            placeholder="+234 800 000 0000"
            helperText="Customers will use this to send orders"
          />

          <div>
            <label className="label">Description</label>
            <textarea
              className="input w-full"
              rows="2"
              value={formData.description}
              onChange={field('description')}
              placeholder="Brief description of the business..."
            />
          </div>

          {/* Owner account */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <UsersIcon className="w-4 h-4" /> Business Owner (Admin Account)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name *"
                value={formData.adminFirstName}
                onChange={field('adminFirstName')}
                required
                placeholder="John"
              />
              <Input
                label="Last Name"
                value={formData.adminLastName}
                onChange={field('adminLastName')}
                placeholder="Doe"
              />
            </div>
            <div className="mt-4">
              <Input
                label="Owner Email *"
                type="email"
                value={formData.adminEmail}
                onChange={field('adminEmail')}
                required
                placeholder="owner@business.com"
                helperText="Login credentials will be tied to this email"
              />
            </div>
            <div className="mt-4">
              <Input
                label="Owner Phone"
                type="tel"
                value={formData.adminPhone}
                onChange={field('adminPhone')}
                placeholder="+234 800 000 0000"
              />
            </div>
          </div>

          {/* Referral Code */}
          <div className="border-t pt-4">
            <ReferralCodeField
              value={referralCode}
              onChange={setReferralCode}
            />
          </div>

          {/* Trial notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <Gift className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">14-Day Free Trial Included</p>
              <p className="text-xs text-green-700 mt-0.5">
                A printable credential sheet with the login details and temporary password
                will appear immediately after creation.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" fullWidth disabled={creating} loading={creating}>
              {creating ? 'Creating...' : '✅ Create Business'}
            </Button>
            <Button type="button" variant="outline" fullWidth onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SuperAdminBusinesses;