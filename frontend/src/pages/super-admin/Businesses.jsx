// frontend/src/pages/Businesses.jsx
import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Search, Filter, Edit, Trash2, Power, 
  Calendar, DollarSign, Package, ShoppingBag, Users as UsersIcon,
  Eye, CheckCircle, XCircle, Clock, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Modal, LoadingSpinner, EmptyState } from '../../components/shared';
import api from '../../services/api';
import { formatDate, formatCurrency, daysUntil, isExpired } from '../../utils/helpers';

const SuperAdminBusinesses = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    slug: '',
    businessType: 'restaurant',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    whatsappNumber: '',
    description: ''
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/business');
      setBusinesses(response.data.businesses || response.data || []);
    } catch (error) {
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/business', formData);
      toast.success('Business created successfully!');
      setCreateModalOpen(false);
      setFormData({
        businessName: '',
        slug: '',
        businessType: 'restaurant',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        whatsappNumber: '',
        description: ''
      });
      fetchBusinesses();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create business');
    }
  };

  const handleToggleStatus = async (businessId, currentStatus) => {
    const action = currentStatus ? 'suspend' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this business?`)) return;

    try {
      await api.post(`/api/business/${businessId}/toggle-status`);
      toast.success(`Business ${action}d successfully`);
      fetchBusinesses();
    } catch (error) {
      toast.error(`Failed to ${action} business`);
    }
  };

  const handleDelete = async (businessId) => {
    if (!confirm('⚠️ This will permanently delete the business and all its data. Are you sure?')) return;

    try {
      await api.delete(`/api/business/${businessId}`);
      toast.success('Business deleted successfully');
      fetchBusinesses();
    } catch (error) {
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

  // Auto-generate slug from business name
  const handleBusinessNameChange = (value) => {
    setFormData({
      ...formData,
      businessName: value,
      slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    });
  };

  const filteredBusinesses = businesses.filter(b => {
    const matchesSearch = 
      b.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && b.isActive) ||
      (filterStatus === 'suspended' && !b.isActive) ||
      (filterStatus === 'trial' && b.subscriptionPlan === 'free_trial') ||
      (filterStatus === 'expired' && isExpired(b.subscriptionExpiry));

    return matchesSearch && matchesStatus;
  });

  const getSubscriptionBadge = (business) => {
    if (!business.isActive) {
      return <Badge variant="danger" icon={XCircle}>Suspended</Badge>;
    }

    if (business.subscriptionPlan === 'free_trial') {
      const days = daysUntil(business.trialEndsAt);
      return (
        <Badge variant={days <= 3 ? 'warning' : 'info'} icon={Clock}>
          Trial ({days}d left)
        </Badge>
      );
    }

    if (business.subscriptionExpiry) {
      const days = daysUntil(business.subscriptionExpiry);
      if (days < 0) {
        return <Badge variant="danger" icon={AlertCircle}>Expired</Badge>;
      }
      if (days <= 7) {
        return <Badge variant="warning" icon={AlertCircle}>Expiring ({days}d)</Badge>;
      }
      return <Badge variant="success" icon={CheckCircle}>Active</Badge>;
    }

    return <Badge variant="gray">No Subscription</Badge>;
  };

  const stats = {
    total: businesses.length,
    active: businesses.filter(b => b.isActive).length,
    suspended: businesses.filter(b => !b.isActive).length,
    trial: businesses.filter(b => b.subscriptionPlan === 'free_trial').length
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Businesses</h1>
          <p className="text-gray-600">Manage all onboarded businesses</p>
        </div>
        <Button icon={Plus} onClick={() => setCreateModalOpen(true)}>
          Create Business
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'blue' },
          { label: 'Active', value: stats.active, color: 'green' },
          { label: 'Suspended', value: stats.suspended, color: 'red' },
          { label: 'On Trial', value: stats.trial, color: 'yellow' }
        ].map((stat, i) => (
          <Card key={i} className={`bg-${stat.color}-50 border-${stat.color}-200`}>
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
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
          <div className="flex gap-2">
            {['all', 'active', 'suspended', 'trial', 'expired'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Businesses Grid */}
      {filteredBusinesses.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="No businesses found"
            description={searchTerm ? "Try adjusting your search" : "Create your first business to get started"}
            actionLabel="Create Business"
            onAction={() => setCreateModalOpen(true)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBusinesses.map((business, index) => (
            <motion.div
              key={business.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{business.businessName}</h3>
                      <p className="text-sm text-gray-500">{business.slug}.yourdomain.com</p>
                      {getSubscriptionBadge(business)}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Package className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-gray-900">
                      {business._count?.products || 0}
                    </p>
                    <p className="text-xs text-gray-500">Products</p>
                  </div>
                  <div className="text-center">
                    <ShoppingBag className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-gray-900">
                      {business._count?.orders || 0}
                    </p>
                    <p className="text-xs text-gray-500">Orders</p>
                  </div>
                  <div className="text-center">
                    <UsersIcon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-gray-900">
                      {business._count?.users || 0}
                    </p>
                    <p className="text-xs text-gray-500">Users</p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Plan:</span>
                    <span className="font-medium">{business.subscriptionPlan || 'None'}</span>
                  </div>
                  {business.subscriptionExpiry && (
                    <div className="flex items-center justify-between">
                      <span>Expires:</span>
                      <span className="font-medium">{formatDate(business.subscriptionExpiry, 'short')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Created:</span>
                    <span className="font-medium">{formatDate(business.createdAt, 'short')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Link to={`/super-admin/businesses/${business.id}`}>
                    <Button size="sm" variant="outline" icon={Eye}>
                      View
                    </Button>
                  </Link>

                  <Link to={`/super-admin/businesses/${business.id}/subscription`}>
                    <Button size="sm" variant="outline" icon={DollarSign}>
                      Subscription
                    </Button>
                  </Link>

                  {!business.trialStartDate && business.subscriptionPlan !== 'free_trial' && (
                    <Button 
                      size="sm" 
                      variant="info" 
                      onClick={() => handleStartTrial(business.id)}
                    >
                      Start Trial
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant={business.isActive ? 'warning' : 'success'}
                    icon={Power}
                    onClick={() => handleToggleStatus(business.id, business.isActive)}
                  >
                    {business.isActive ? 'Suspend' : 'Activate'}
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    icon={Trash2}
                    onClick={() => handleDelete(business.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Business Modal */}
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
            onChange={(e) => handleBusinessNameChange(e.target.value)}
            required
            placeholder="e.g., Mama's Kitchen"
          />

          <Input
            label="Subdomain Slug *"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
            placeholder="mamas-kitchen"
            helperText="Will be: {slug}.yourdomain.com"
          />

          <div>
            <label className="label">Business Type *</label>
            <select
              className="input"
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              required
            >
              <option value="restaurant">Restaurant</option>
              <option value="retail">Retail</option>
              <option value="services">Services</option>
              <option value="fashion">Fashion</option>
              <option value="electronics">Electronics</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Business Owner</h3>
            
            <div className="space-y-4">
              <Input
                label="Owner Name *"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                required
              />

              <Input
                label="Owner Email *"
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                required
              />

              <Input
                label="Owner Phone *"
                type="tel"
                value={formData.ownerPhone}
                onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                required
              />

              <Input
                label="WhatsApp Number"
                type="tel"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                helperText="For customer orders"
              />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the business..."
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" fullWidth>Create Business</Button>
            <Button 
              type="button" 
              variant="outline" 
              fullWidth
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SuperAdminBusinesses;