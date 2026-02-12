// frontend/src/pages/staff.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import Input from '../components/shared/Input';
import Select from '../components/shared/Select';
import Badge from '../components/shared/Badge';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import EmptyState from '../components/shared/EmptyState';
import staffService from '../services/staffService';
import { formatDate, getInitials } from '../utils/helpers';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'STAFF',
    password: '',
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await staffService.getAllStaff();
      setStaff(data.staff || []);
    } catch (error) {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await staffService.updateStaff(editingStaff.id, formData);
        toast.success('Staff updated successfully');
      } else {
        await staffService.createStaff(formData);
        toast.success('Staff created successfully');
      }
      setModalOpen(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save staff');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await staffService.deleteStaff(id);
      toast.success('Staff deleted successfully');
      fetchStaff();
    } catch (error) {
      toast.error('Failed to delete staff');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await staffService.toggleStaffStatus(id);
      toast.success('Staff status updated');
      fetchStaff();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const openEditModal = (member) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      password: '',
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'STAFF',
      password: '',
    });
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Management</h1>
          <p className="text-gray-600">Manage your team members and their permissions</p>
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>
          Add Staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <Card>
          <EmptyState
            icon={UserCheck}
            title="No staff members yet"
            description="Add team members to help manage your business"
            actionLabel="Add Staff"
            onAction={() => setModalOpen(true)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-lg">
                      {getInitials(member.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {member.phone && (
                    <p className="text-sm text-gray-600">📱 {member.phone}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant={member.role === 'ADMIN' ? 'primary' : 'info'}>
                      {member.role}
                    </Badge>
                    <Badge variant={member.isActive ? 'success' : 'danger'}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    Joined {formatDate(member.createdAt, 'short')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Edit}
                    onClick={() => openEditModal(member)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={member.isActive ? UserX : UserCheck}
                    onClick={() => handleToggleStatus(member.id)}
                  >
                    {member.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Trash2}
                    onClick={() => handleDelete(member.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
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

          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: 'STAFF', label: 'Staff' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
            required
          />

          {!editingStaff && (
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText="Minimum 8 characters"
              required
            />
          )}

          <div className="flex gap-3">
            <Button type="submit" fullWidth>
              {editingStaff ? 'Update Staff' : 'Add Staff'}
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

export default Staff;