// frontend/src/pages/super-admin/Users.jsx
// ✅ FIXES:
//   1. businessesRes.data.businesses || businessesRes.data || []  ← handles plain-array API response
//   2. Added "Select a business" placeholder option in the create-user modal
//   3. businessId validated before submit
import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon, Plus, Search, Trash2,
  UserCheck, UserX, Building2, Mail, Phone
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Modal, LoadingSpinner, EmptyState, Input, Select } from '../../components/shared';
import api from '../../services/api';
import { formatDate, getInitials } from '../../utils/helpers';

const SuperAdminUsers = () => {
  const [users, setUsers]           = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole]         = useState('all');
  const [filterBusiness, setFilterBusiness] = useState('all');

  const [formData, setFormData] = useState({
    firstName:  '',
    lastName:   '',
    email:      '',
    phone:      '',
    role:       'staff',
    businessId: '',
    password:   '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, bizRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/business'),
      ]);

      setUsers(usersRes.data?.users || usersRes.data || []);

      // ✅ FIX 1: backend returns a plain array from getAllBusinesses,
      //           not { businesses: [...] }. Handle both shapes.
      setBusinesses(bizRes.data?.businesses || bizRes.data || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    // ✅ FIX 2: Validate businessId before sending
    if (!formData.businessId) {
      return toast.error('Please select a business for this user');
    }

    try {
      await api.post('/api/users', {
        ...formData,
        businessId: Number(formData.businessId),
      });
      toast.success('User created successfully!');
      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.post(`/api/users/${userId}/${currentStatus ? 'suspend' : 'reactivate'}`);
      toast.success(`User ${currentStatus ? 'suspended' : 'reactivated'}`);
      fetchData();
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/api/users/${userId}`);
      toast.success('User deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', role: 'staff', businessId: '', password: '' });
  };

  const generatePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pw = '';
    for (let i = 0; i < 12; i++) pw += charset[Math.floor(Math.random() * charset.length)];
    setFormData(prev => ({ ...prev, password: pw }));
    toast.success('Password generated');
  };

  const field = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  const filteredUsers = users.filter(u => {
    const s = searchTerm.toLowerCase();
    const matchSearch =
      u.firstName?.toLowerCase().includes(s) ||
      u.lastName?.toLowerCase().includes(s)  ||
      u.email?.toLowerCase().includes(s);
    const matchRole     = filterRole     === 'all' || u.role === filterRole;
    const matchBusiness = filterBusiness === 'all' || u.businessId === Number(filterBusiness);
    return matchSearch && matchRole && matchBusiness;
  });

  const getRoleBadge = (role) => ({
    'super-admin': { variant: 'danger',  label: 'Super Admin' },
    'admin':       { variant: 'primary', label: 'Admin' },
    'staff':       { variant: 'info',    label: 'Staff' },
  }[role] || { variant: 'gray', label: role });

  const stats = {
    total:       users.length,
    superAdmins: users.filter(u => u.role === 'super-admin').length,
    admins:      users.filter(u => u.role === 'admin').length,
    staff:       users.filter(u => u.role === 'staff').length,
    active:      users.filter(u => u.active).length,
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Platform Users</h1>
          <p className="text-gray-600">Manage all users across the platform</p>
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>Create User</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total',       value: stats.total,       color: 'blue'   },
          { label: 'Super Admins',value: stats.superAdmins, color: 'red'    },
          { label: 'Admins',      value: stats.admins,      color: 'purple' },
          { label: 'Staff',       value: stats.staff,       color: 'green'  },
          { label: 'Active',      value: stats.active,      color: 'indigo' },
        ].map((s, i) => (
          <Card key={i} className={`bg-${s.color}-50 border-${s.color}-200`}>
            <p className="text-sm text-gray-600">{s.label}</p>
            <p className={`text-3xl font-bold text-${s.color}-600`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
          <Select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            options={[
              { value: 'all',         label: 'All Roles'   },
              { value: 'super-admin', label: 'Super Admin' },
              { value: 'admin',       label: 'Admin'       },
              { value: 'staff',       label: 'Staff'       },
            ]}
          />
          <Select
            value={filterBusiness}
            onChange={(e) => setFilterBusiness(e.target.value)}
            options={[
              { value: 'all', label: 'All Businesses' },
              ...businesses.map(b => ({ value: b.id.toString(), label: b.businessName })),
            ]}
          />
        </div>
      </Card>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <Card>
          <EmptyState icon={UsersIcon} title="No users found" description="Try adjusting your filters" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user, index) => {
            const rb       = getRoleBadge(user.role);
            const business = businesses.find(b => b.id === user.businessId);

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {getInitials(`${user.firstName} ${user.lastName}` || user.email)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {user.firstName} {user.lastName || ''}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={rb.variant}>{rb.label}</Badge>
                      <Badge variant={user.active ? 'success' : 'danger'}>
                        {user.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {business && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{business.businessName}</span>
                      </div>
                    )}

                    {user.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{user.phone}</span>
                      </div>
                    )}

                    {user.createdAt && (
                      <p className="text-xs text-gray-400">Joined {formatDate(user.createdAt, 'short')}</p>
                    )}
                  </div>

                  {user.role !== 'super-admin' && (
                    <div className="flex items-center gap-2 pt-3 border-t">
                      <Button
                        size="sm" variant="ghost"
                        icon={user.active ? UserX : UserCheck}
                        onClick={() => handleToggleStatus(user.id, user.active)}
                      >
                        {user.active ? 'Suspend' : 'Activate'}
                      </Button>
                      <Button
                        size="sm" variant="ghost" icon={Trash2}
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title="Create New User"
        size="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="First Name *" value={formData.firstName} onChange={field('firstName')} required />
            <Input label="Last Name *"  value={formData.lastName}  onChange={field('lastName')}  required />
            <Input label="Email *" type="email" icon={Mail} value={formData.email} onChange={field('email')} required />
            <Input label="Phone"   type="tel"   icon={Phone} value={formData.phone} onChange={field('phone')} />

            <Select
              label="Role *"
              value={formData.role}
              onChange={field('role')}
              options={[
                { value: 'staff', label: 'Staff' },
                { value: 'admin', label: 'Admin' },
              ]}
              required
            />

            {/* ✅ FIX 2: Business dropdown with placeholder + populated from correct data */}
            <div>
              <label className="label">Business *</label>
              <select
                className="input w-full"
                value={formData.businessId}
                onChange={field('businessId')}
                required
              >
                <option value="" disabled>
                  {businesses.length === 0 ? 'No businesses found' : '— Select a business —'}
                </option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id.toString()}>
                    {b.businessName} ({b.slug})
                  </option>
                ))}
              </select>
              {businesses.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  No businesses available. Create a business first.
                </p>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="label">Password *</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={formData.password}
                onChange={field('password')}
                placeholder="Enter or generate password"
                required
                containerClassName="flex-1"
              />
              <Button type="button" variant="outline" onClick={generatePassword}>Generate</Button>
            </div>
            <p className="text-xs text-amber-600 mt-1 font-medium">
              ⚠️ Save this password — it won't be shown again after creation!
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" fullWidth>Create User</Button>
            <Button type="button" variant="outline" fullWidth onClick={() => { setModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SuperAdminUsers;