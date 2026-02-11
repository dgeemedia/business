import React, { useState, useEffect } from 'react';
import { Save, Building2, DollarSign, Globe, Bell, Shield, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Input from '../components/shared/Input';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import useBusinessStore from '../stores/businessStore';
import api from '../services/api';

const Settings = () => {
  const { currentBusiness, fetchCurrentBusiness } = useBusinessStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('business');
  const [formData, setFormData] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    whatsappNumber: '',
    businessAddress: '',
    currency: 'NGN',
    language: 'en',
    description: '',
    taxRate: '0',
    deliveryFee: '0',
  });

  const currencies = [
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'ar', name: 'Arabic' },
    { code: 'yo', name: 'Yoruba' },
    { code: 'ig', name: 'Igbo' },
    { code: 'ha', name: 'Hausa' },
  ];

  useEffect(() => {
    loadSettings();
  }, [currentBusiness]);

  const loadSettings = async () => {
    if (currentBusiness) {
      setFormData({
        businessName: currentBusiness.name || '',
        businessEmail: currentBusiness.email || '',
        businessPhone: currentBusiness.phone || '',
        whatsappNumber: currentBusiness.whatsappNumber || '',
        businessAddress: currentBusiness.address || '',
        currency: currentBusiness.currency || 'NGN',
        language: currentBusiness.language || 'en',
        description: currentBusiness.description || '',
        taxRate: currentBusiness.taxRate?.toString() || '0',
        deliveryFee: currentBusiness.deliveryFee?.toString() || '0',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/settings', {
        ...formData,
        taxRate: parseFloat(formData.taxRate) || 0,
        deliveryFee: parseFloat(formData.deliveryFee) || 0,
      });
      toast.success('Settings updated successfully');
      await fetchCurrentBusiness();
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'business', name: 'Business Info', icon: Building2 },
    { id: 'regional', name: 'Regional', icon: Globe },
    { id: 'notifications', name: 'Notifications', icon: Bell },
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your business settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Information Tab */}
        {activeTab === 'business' && (
          <Card title="Business Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Business Name"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
              />

              <Input
                label="Business Email"
                type="email"
                value={formData.businessEmail}
                onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                value={formData.businessPhone}
                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
              />

              <Input
                label="WhatsApp Number *"
                type="tel"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="+234 800 000 0000"
                helperText="Customer orders will be sent to this WhatsApp number"
                required
              />

              <Input
                label="Address"
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
              />

              <div className="md:col-span-2">
                <label className="label">Business Description</label>
                <textarea
                  className="input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell customers about your business..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  This will be displayed on your public storefront
                </p>
              </div>

              <Input
                label="Tax Rate (%)"
                type="number"
                step="0.01"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                helperText="Percentage tax to add to orders"
              />

              <Input
                label="Delivery Fee"
                type="number"
                step="0.01"
                value={formData.deliveryFee}
                onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                helperText="Default delivery charge"
              />
            </div>
          </Card>
        )}

        {/* Regional Settings Tab */}
        {activeTab === 'regional' && (
          <div className="space-y-6">
            <Card title="Currency & Language Settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Currency *</label>
                  <select
                    className="input"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    required
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name} ({currency.code})
                      </option>
                    ))}
                  </select>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900 flex items-start gap-2">
                      <DollarSign className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        This currency will be used for all prices on your public storefront. 
                        Customers will see prices in {currencies.find(c => c.code === formData.currency)?.name}.
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="label">Language *</label>
                  <select
                    className="input"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    required
                  >
                    {languages.map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.name}
                      </option>
                    ))}
                  </select>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900 flex items-start gap-2">
                      <Globe className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        Default language for your storefront interface. This affects how 
                        buttons, labels, and messages appear to your customers.
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Preview</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Currency Symbol:</span>{' '}
                    {currencies.find(c => c.code === formData.currency)?.symbol}
                  </p>
                  <p>
                    <span className="font-medium">Example Price:</span>{' '}
                    {currencies.find(c => c.code === formData.currency)?.symbol}5,000.00
                  </p>
                  <p>
                    <span className="font-medium">Language:</span>{' '}
                    {languages.find(l => l.code === formData.language)?.name}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <Shield className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-900">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Currency changes affect all product prices on your storefront</li>
                    <li>Language setting updates UI text for customers browsing your store</li>
                    <li>These changes take effect immediately after saving</li>
                    <li>Existing orders maintain their original currency</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <Card title="Notification Preferences">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <input type="checkbox" className="mt-1" defaultChecked />
                <div>
                  <p className="font-medium text-gray-900">New Orders</p>
                  <p className="text-sm text-gray-600">Get notified when you receive new orders</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <input type="checkbox" className="mt-1" defaultChecked />
                <div>
                  <p className="font-medium text-gray-900">Low Stock Alerts</p>
                  <p className="text-sm text-gray-600">Alert when product stock is running low</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <input type="checkbox" className="mt-1" defaultChecked />
                <div>
                  <p className="font-medium text-gray-900">Customer Reviews</p>
                  <p className="text-sm text-gray-600">Get notified of new customer ratings and reviews</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <input type="checkbox" className="mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Daily Reports</p>
                  <p className="text-sm text-gray-600">Receive daily sales and performance reports</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            loading={saving}
            icon={Save}
            size="lg"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;