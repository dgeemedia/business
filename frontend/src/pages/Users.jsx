// frontend/src/pages/Users.jsx
// ✅ MERGED: Replaces both Users.jsx and Staff.jsx — one page for all team management
// ✅ ADDED:  Password change in edit modal
// ✅ FIXED:  Shows users scoped to current business

import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon, Plus, Edit, Trash2, UserCheck, UserX,
  Search, Key, Eye, EyeOff, Shield, UserCog
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Modal, LoadingSpinner, EmptyState, Input } from '../components/shared';
import api from '../services/api';
import { formatDate, getInitials } from '../utils/helpers';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'STAFF',
    password: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch all users for the business (admins + staff + customers)
      const response = await api.get('/api/users');
      // Normalize shape — backend returns array or { users: [] }
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : (raw.users || []);
      // Map backend fields → UI fields
      setUsers(list.map(u => ({
        ...u,
        name: u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || '',
        isActive: u.isActive ?? u.active ?? true,
      })));
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password on create
    if (!editingUser && formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      const payload = { ...formData };
      // Don't send empty password on edit
      if (editingUser && !payload.password) {
        delete payload.password;
      }

      if (editingUser) {
        await api.put(`/api/users/${editingUser.id}`, payload);
        toast.success('User updated successfully');
      } else {
        await api.post('/api/users', payload);
        toast.success('User created successfully');
      }

      setModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save user');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await api.put(`/api/users/${editingUser.id}`, {
        password: passwordForm.newPassword,
      });
      toast.success('Password updated successfully');
      setPasswordModalOpen(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update password');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/api/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const endpoint = user.isActive
        ? `/api/users/${user.id}/suspend`
        : `/api/users/${user.id}/reactivate`;
      await api.post(endpoint);
      toast.success(`User ${user.isActive ? 'disabled' : 'enabled'}`);
      fetchUsers();
    } catch (error) {
      // Fallback to old toggle endpoint
      try {
        await api.patch(`/api/users/${user.id}/toggle`);
        toast.success('User status updated');
        fetchUsers();
      } catch {
        toast.error('Failed to update status');
      }
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '',
    });
    setModalOpen(true);
  };

  const openPasswordModal = (user) => {
    setEditingUser(user);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setPasswordModalOpen(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', phone: '', role: 'STAFF', password: '' });
    setShowPassword(false);
  };

  // ── Filter ────────────────────────────────────────────────────────────
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    const configs = {
      SUPER_ADMIN: { variant: 'danger',  label: 'Super Admin' },
      super_admin: { variant: 'danger',  label: 'Super Admin' },
      ADMIN:       { variant: 'primary', label: 'Admin' },
      admin:       { variant: 'primary', label: 'Admin' },
      STAFF:       { variant: 'info',    label: 'Staff' },
      staff:       { variant: 'info',    label: 'Staff' },
      CUSTOMER:    { variant: 'gray',    label: 'Customer' },
      customer:    { variant: 'gray',    label: 'Customer' },
    };
    return configs[role] || { variant: 'gray', label: role };
  };

  const isSuperAdmin = (role) =>
    role === 'SUPER_ADMIN' || role === 'super_admin' || role === 'super-admin';

  // Stats
  const adminCount  = users.filter(u => u.role === 'ADMIN'  || u.role === 'admin').length;
  const staffCount  = users.filter(u => u.role === 'STAFF'  || u.role === 'staff').length;
  const activeCount = users.filter(u => u.isActive).length;

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users & Team</h1>
          <p className="text-gray-600">Manage all team members and their access</p>
        </div>
        <Button icon={Plus} onClick={() => { resetForm(); setModalOpen(true); }}>
          Add User
        </Button>
      </div>

      {/* ── Quick Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Users',    value: users.length,  color: 'blue'  },
          { label: 'Admins & Staff', value: adminCount + staffCount, color: 'purple' },
          { label: 'Active',         value: activeCount,   color: 'green' },
        ].map((s) => (
          <Card key={s.label} className={`bg-${s.color}-50 border-${s.color}-200`}>
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* ── Search + Filter ─────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              className="input"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="STAFF">Staff</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── Grid ─────────────────────────────────────────────────────── */}
      {filteredUsers.length === 0 ? (
        <Card>
          <EmptyState
            icon={UsersIcon}
            title="No users found"
            description={searchTerm ? 'Try adjusting your search' : 'Add team members to get started'}
            actionLabel="Add User"
            onAction={() => { resetForm(); setModalOpen(true); }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user, index) => {
            const roleBadge = getRoleBadge(user.role);
            const superAdmin = isSuperAdmin(user.role);
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-lg flex-shrink-0">
                      {getInitials(user.name || user.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {user.name || 'No name'}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {user.phone && (
                      <p className="text-sm text-gray-600">📱 {user.phone}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
                      <Badge variant={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {user.createdAt && (
                      <p className="text-xs text-gray-500">
                        Joined {formatDate(user.createdAt, 'short')}
                      </p>
                    )}
                  </div>

                  {/* Actions — hidden for super-admins */}
                  {!superAdmin && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Edit}
                        onClick={() => openEditModal(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Key}
                        onClick={() => openPasswordModal(user)}
                        title="Change password"
                      >
                        Password
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={user.isActive ? UserX : UserCheck}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Trash2}
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

      {/* ── Add / Edit Modal ────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingUser ? 'Edit User' : 'Add New User'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={!!editingUser}
          />

          <Input
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </div>

          {/* Password field */}
          <div>
            <label className="label">
              {editingUser ? 'New Password (optional)' : 'Password *'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
                required={!editingUser}
                minLength={formData.password ? 8 : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {!editingUser && (
              <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" fullWidth>
              {editingUser ? 'Update User' : 'Add User'}
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => { setModalOpen(false); resetForm(); }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Change Password Modal ─────────────────────────────────── */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => { setPasswordModalOpen(false); setPasswordForm({ newPassword: '', confirmPassword: '' }); }}
        title={`Change Password — ${editingUser?.name || editingUser?.email || ''}`}
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            ⚠️ This will immediately update the user's password. Make sure to share the new password with them.
          </div>

          <div>
            <label className="label">New Password *</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="input pr-10"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Minimum 8 characters"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Input
            label="Confirm New Password *"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            placeholder="Re-enter new password"
            required
            error={
              passwordForm.confirmPassword &&
              passwordForm.newPassword !== passwordForm.confirmPassword
                ? "Passwords don't match"
                : undefined
            }
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              fullWidth
              icon={Key}
              disabled={
                !passwordForm.newPassword ||
                !passwordForm.confirmPassword ||
                passwordForm.newPassword !== passwordForm.confirmPassword
              }
            >
              Update Password
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => { setPasswordModalOpen(false); setPasswordForm({ newPassword: '', confirmPassword: '' }); }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;