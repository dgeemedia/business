// frontend/src/pages/super-admin/Settings.jsx
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Key, User, Mail, Phone, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Input, LoadingSpinner } from '../../components/shared';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';

const SuperAdminSettings = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      toast.success('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your super-admin account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card title="Profile Information" subtitle="Your account details">
            <div className="space-y-6">
              {/* User Info Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Email Address</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user?.email}</span>
                  </div>
                </div>

                <div>
                  <label className="label">Role</label>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Super Admin</span>
                  </div>
                </div>

                <div>
                  <label className="label">First Name</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user?.firstName || 'Not set'}</span>
                  </div>
                </div>

                <div>
                  <label className="label">Last Name</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user?.lastName || 'Not set'}</span>
                  </div>
                </div>

                {user?.phone && (
                  <div className="md:col-span-2">
                    <label className="label">Phone Number</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{user.phone}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Note:</span> To update your profile information, please contact the system administrator.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Account Stats */}
        <div className="space-y-6">
          <Card title="Account Statistics">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-700">Account Type</span>
                <span className="font-semibold text-blue-600">Super Admin</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Access Level</span>
                <span className="font-semibold text-gray-900">Full Access</span>
              </div>

              {user?.createdAt && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Member Since</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              {user?.lastLogin && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Last Login</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Change Password */}
      <Card 
        title="Change Password" 
        subtitle="Update your password to keep your account secure"
      >
        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Current Password"
              type="password"
              icon={Key}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
              placeholder="Enter current password"
            />

            <Input
              label="New Password"
              type="password"
              icon={Key}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
              placeholder="Enter new password"
              helperText="Minimum 8 characters"
            />

            <Input
              label="Confirm New Password"
              type="password"
              icon={Key}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              required
              placeholder="Confirm new password"
              error={
                passwordForm.confirmPassword && 
                passwordForm.newPassword !== passwordForm.confirmPassword 
                  ? "Passwords don't match" 
                  : undefined
              }
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              icon={Save}
              loading={loading}
              disabled={
                !passwordForm.currentPassword ||
                !passwordForm.newPassword ||
                !passwordForm.confirmPassword ||
                passwordForm.newPassword !== passwordForm.confirmPassword
              }
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Security Notice */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Security Best Practices</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Use a strong password with at least 8 characters</li>
              <li>• Include uppercase, lowercase, numbers, and special characters</li>
              <li>• Don't reuse passwords from other accounts</li>
              <li>• Change your password regularly</li>
              <li>• Never share your password with anyone</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SuperAdminSettings;