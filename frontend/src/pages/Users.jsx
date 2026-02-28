// frontend/src/pages/Users.jsx
import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Edit, Trash2, UserCheck, UserX, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Modal, LoadingSpinner, EmptyState, Input } from '../components/shared';
import api from '../services/api';
import { formatDate, getInitials } from '../utils/helpers';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    password: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users');
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/api/users/${editingUser.id}`, formData);
        toast.success('User updated successfully');
      } else {
        await api.post('/api/users', formData);
        toast.success('User created successfully');
      }
      
      setModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save user');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/api/users/${id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/api/users/${id}/toggle`);
      toast.success('User status updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '',
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'staff',
      password: '',
    });
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    const configs = {
      SUPER_ADMIN: { variant: 'danger', label: 'Super Admin' },
      ADMIN: { variant: 'primary', label: 'Admin' },
      STAFF: { variant: 'info', label: 'Staff' },
      CUSTOMER: { variant: 'gray', label: 'Customer' },
    };
    return configs[role] || configs.CUSTOMER;
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users & Team</h1>
          <p className="text-gray-600">Manage team members and customer accounts</p>
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>
          Add User
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email..."
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

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <Card>
          <EmptyState
            icon={UsersIcon}
            title="No users found"
            description={searchTerm ? "Try adjusting your search" : "Add team members to help manage your business"}
            actionLabel="Add User"
            onAction={() => setModalOpen(true)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user, index) => {
            const roleBadge = getRoleBadge(user.role);
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-lg">
                        {getInitials(user.name || user.email)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {user.name || 'No name'}
                        </h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {user.phone && (
                      <p className="text-sm text-gray-600">📱 {user.phone}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant={roleBadge.variant}>
                        {roleBadge.label}
                      </Badge>
                      {user.isActive !== undefined && (
                        <Badge variant={user.isActive ? 'success' : 'danger'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                    </div>
                    {user.createdAt && (
                      <p className="text-xs text-gray-500">
                        Joined {formatDate(user.createdAt, 'short')}
                      </p>
                    )}
                  </div>

                  {/* Actions - Only for non-super-admin users */}
                  {user.role !== 'SUPER_ADMIN' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Edit}
                        onClick={() => openEditModal(user)}
                      >
                        Edit
                      </Button>
                      {user.isActive !== undefined && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={user.isActive ? UserX : UserCheck}
                          onClick={() => handleToggleStatus(user.id)}
                        >
                          {user.isActive ? 'Disable' : 'Enable'}
                        </Button>
                      )}
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
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

          {!editingUser && (
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText="Minimum 8 characters"
              required
            />
          )}

          {editingUser && (
            <p className="text-sm text-gray-500">
              Leave password empty to keep current password
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" fullWidth>
              {editingUser ? 'Update User' : 'Add User'}
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
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