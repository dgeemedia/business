// frontend/src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import {
  Save, Building2, DollarSign, Globe, Bell, Image as ImageIcon,
  Clock, MapPin, Phone, MessageCircle, Facebook, Instagram,
  Twitter, Youtube, FileText, Eye, Upload, X, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, LoadingSpinner } from '../components/shared';
import useBusinessStore from '../stores/businessStore';
import api from '../services/api';
import { buildSubdomainUrl } from '../services/api';

const CURRENCIES = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'ar', name: 'Arabic' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'ig', name: 'Igbo' },
  { code: 'ha', name: 'Hausa' },
];

const TABS = [
  { id: 'business',  label: 'Business Info',  icon: Building2 },
  { id: 'storefront',label: 'Storefront',     icon: Eye },
  { id: 'regional',  label: 'Regional',       icon: Globe },
  { id: 'social',    label: 'Social & Footer',icon: Facebook },
  { id: 'notify',    label: 'Notifications',  icon: Bell },
];

// ── Labelled Input ──────────────────────────────────────────────────────
function Field({ label, helper, required, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {helper && <p className="mt-1 text-xs text-gray-400">{helper}</p>}
    </div>
  );
}

function TextInput({ label, helper, required, ...props }) {
  return (
    <Field label={label} helper={helper} required={required}>
      <input
        {...props}
        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors"
      />
    </Field>
  );
}

// ─────────────────────────────────────────────────────────────────────────
const Settings = () => {
  const { currentBusiness, fetchCurrentBusiness } = useBusinessStore();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState('business');

  const [form, setForm] = useState({
    // Business Info
    businessName:   '',
    email:          '',
    phone:          '',
    whatsappNumber: '',
    address:        '',
    description:    '',
    businessHours:  '',
    logo:           '',
    primaryColor:   '#10B981',
    secondaryColor: '#F59E0B',
    // Regional
    currency: 'NGN',
    language: 'en',
    // Storefront
    taxRate:     '0',
    deliveryFee: '0',
    // Social
    facebookUrl:  '',
    instagramUrl: '',
    twitterUrl:   '',
    youtubeUrl:   '',
    // Footer
    footerText:      '',
    footerCopyright: '',
    footerAddress:   '',
    footerEmail:     '',
    footerPhone:     '',
  });

  useEffect(() => {
    if (!currentBusiness) { fetchCurrentBusiness(); return; }
    const b = currentBusiness;
    setForm({
      businessName:    b.businessName  || b.name    || '',
      email:           b.email         || '',
      phone:           b.phone         || '',
      whatsappNumber:  b.whatsappNumber|| '',
      address:         b.address       || '',
      description:     b.description   || '',
      businessHours:   b.businessHours || '',
      logo:            b.logo          || '',
      primaryColor:    b.primaryColor  || '#10B981',
      secondaryColor:  b.secondaryColor|| '#F59E0B',
      currency:        b.currency      || 'NGN',
      language:        b.language      || 'en',
      taxRate:         String(b.taxRate       ?? 0),
      deliveryFee:     String(b.deliveryFee   ?? 0),
      facebookUrl:     b.facebookUrl   || '',
      instagramUrl:    b.instagramUrl  || '',
      twitterUrl:      b.twitterUrl    || '',
      youtubeUrl:      b.youtubeUrl    || '',
      footerText:      b.footerText    || '',
      footerCopyright: b.footerCopyright|| '',
      footerAddress:   b.footerAddress || '',
      footerEmail:     b.footerEmail   || '',
      footerPhone:     b.footerPhone   || '',
    });
  }, [currentBusiness]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  // ── Logo upload ──────────────────────────────────────────────────────
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5 MB'); return; }
    try {
      setUploadingLogo(true);
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/api/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(f => ({ ...f, logo: res.data.imageUrl || res.data.url }));
      toast.success('Logo uploaded');
    } catch {
      toast.error('Logo upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/settings', {
        ...form,
        taxRate:     parseFloat(form.taxRate)     || 0,
        deliveryFee: parseFloat(form.deliveryFee) || 0,
      });
      toast.success('Settings saved ✓');
      await fetchCurrentBusiness();
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const storefrontUrl = currentBusiness?.slug ? buildSubdomainUrl(currentBusiness.slug) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Settings</h1>
          <p className="text-gray-500 text-sm">Manage your business profile and storefront</p>
        </div>
        {storefrontUrl && (
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 text-sm text-primary-600 font-semibold hover:underline"
          >
            <Eye className="w-4 h-4" />
            Preview Storefront
          </a>
        )}
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── BUSINESS INFO ──────────────────────────────────────────── */}
        {activeTab === 'business' && (
          <div className="space-y-6">
            {/* Logo upload card */}
            <Card title="Business Logo">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0">
                  {form.logo ? (
                    <div className="relative">
                      <img src={form.logo} alt="Logo" className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-100" />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, logo: '' }))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="w-7 h-7 mb-1" />
                      <span className="text-xs">No logo</span>
                    </div>
                  )}
                </div>
                <div>
                  <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <label htmlFor="logo-upload">
                    <Button
                      type="button"
                      variant="outline"
                      icon={Upload}
                      loading={uploadingLogo}
                      onClick={() => document.getElementById('logo-upload').click()}
                    >
                      {uploadingLogo ? 'Uploading…' : 'Upload Logo'}
                    </Button>
                  </label>
                  <p className="text-xs text-gray-400 mt-2">JPG, PNG or WebP · Max 5 MB</p>
                  <p className="text-xs text-gray-400">Recommended: 256 × 256 px square</p>
                </div>
              </div>
            </Card>

            {/* Color theme */}
            <Card title="Brand Colours">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Primary Colour" helper="Used for buttons, prices, and accents">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={set('primaryColor')}
                      className="w-10 h-10 rounded-xl border-2 border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.primaryColor}
                      onChange={set('primaryColor')}
                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-mono"
                    />
                  </div>
                </Field>
                <Field label="Secondary Colour" helper="Used for gradients and highlights">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.secondaryColor}
                      onChange={set('secondaryColor')}
                      className="w-10 h-10 rounded-xl border-2 border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.secondaryColor}
                      onChange={set('secondaryColor')}
                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-mono"
                    />
                  </div>
                </Field>
              </div>
              {/* Mini preview */}
              <div
                className="mt-4 h-10 rounded-xl"
                style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }}
              />
            </Card>

            <Card title="Contact & Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput label="Business Name" value={form.businessName} onChange={set('businessName')} required />
                <TextInput label="Email" type="email" value={form.email} onChange={set('email')} />
                <TextInput label="Phone" type="tel" value={form.phone} onChange={set('phone')} />
                <TextInput
                  label="WhatsApp Number"
                  type="tel"
                  value={form.whatsappNumber}
                  onChange={set('whatsappNumber')}
                  placeholder="+234 803 000 0000"
                  helper="Orders are sent here"
                  required
                />
                <div className="md:col-span-2">
                  <TextInput label="Address" value={form.address} onChange={set('address')} />
                </div>
                <div className="md:col-span-2">
                  <Field label="Business Hours" helper='e.g. "Mon–Fri: 9am–6pm, Sat: 10am–4pm"'>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        value={form.businessHours}
                        onChange={set('businessHours')}
                        placeholder="Mon–Fri: 9am–6pm"
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="About Your Business" helper="Shown in the storefront hero section">
                    <textarea
                      value={form.description}
                      onChange={set('description')}
                      rows={3}
                      placeholder="Tell customers what makes your business special…"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 resize-none"
                    />
                  </Field>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── STOREFRONT ─────────────────────────────────────────────── */}
        {activeTab === 'storefront' && (
          <div className="space-y-6">
            {storefrontUrl && (
              <div className="flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-2xl">
                <div>
                  <p className="text-sm font-semibold text-primary-800">Your Live Storefront</p>
                  <p className="text-xs text-primary-600 font-mono mt-0.5">{storefrontUrl}</p>
                </div>
                <a
                  href={storefrontUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary text-sm"
                >
                  <Eye className="w-4 h-4" /> Open
                </a>
              </div>
            )}

            <Card title="Pricing & Checkout">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="Tax Rate (%)"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.taxRate}
                  onChange={set('taxRate')}
                  helper="Applied to subtotal at checkout (0 = no tax)"
                />
                <TextInput
                  label="Delivery Fee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.deliveryFee}
                  onChange={set('deliveryFee')}
                  helper="Flat delivery fee added to every order (0 = free)"
                />
              </div>
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <strong>Preview:</strong>{' '}
                An order of {CURRENCIES.find(c => c.code === form.currency)?.symbol}10,000 →
                {parseFloat(form.taxRate) > 0 ? ` + ${parseFloat(form.taxRate)}% tax` : ' no tax'} →
                {parseFloat(form.deliveryFee) > 0 ? ` + ${CURRENCIES.find(c => c.code === form.currency)?.symbol}${parseFloat(form.deliveryFee).toLocaleString()} delivery` : ' free delivery'} →
                <strong>
                  {' '}{CURRENCIES.find(c => c.code === form.currency)?.symbol}
                  {(10000 * (1 + parseFloat(form.taxRate || 0) / 100) + parseFloat(form.deliveryFee || 0)).toLocaleString()}
                </strong>
              </div>
            </Card>
          </div>
        )}

        {/* ── REGIONAL ───────────────────────────────────────────────── */}
        {activeTab === 'regional' && (
          <Card title="Currency & Language">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Currency" helper="All product prices display in this currency">
                <select
                  value={form.currency}
                  onChange={set('currency')}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>
                  ))}
                </select>
              </Field>
              <Field label="Language" helper="UI language for your storefront">
                <select
                  value={form.language}
                  onChange={set('language')}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Card>
        )}

        {/* ── SOCIAL & FOOTER ────────────────────────────────────────── */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <Card title="Social Media Links">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'facebookUrl',  label: 'Facebook',  icon: Facebook,    placeholder: 'https://facebook.com/yourpage' },
                  { key: 'instagramUrl', label: 'Instagram', icon: Instagram,   placeholder: 'https://instagram.com/yourhandle' },
                  { key: 'twitterUrl',   label: 'Twitter/X', icon: Twitter,     placeholder: 'https://twitter.com/yourhandle' },
                  { key: 'youtubeUrl',   label: 'YouTube',   icon: Youtube,     placeholder: 'https://youtube.com/@yourchannel' },
                ].map(({ key, label, icon: Icon, placeholder }) => (
                  <Field key={key} label={label}>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        value={form[key]}
                        onChange={set(key)}
                        placeholder={placeholder}
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </Field>
                ))}
              </div>
            </Card>

            <Card title="Footer Content">
              <div className="space-y-4">
                <Field label="Footer Tagline" helper="Short text shown under your logo in the footer">
                  <textarea
                    value={form.footerText}
                    onChange={set('footerText')}
                    rows={2}
                    placeholder="Quality products delivered to your door."
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 resize-none"
                  />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextInput
                    label="Footer Address"
                    value={form.footerAddress}
                    onChange={set('footerAddress')}
                    placeholder="22 Broad St, Lagos"
                  />
                  <TextInput
                    label="Footer Email"
                    type="email"
                    value={form.footerEmail}
                    onChange={set('footerEmail')}
                    placeholder="hello@yourbusiness.com"
                  />
                  <TextInput
                    label="Footer Phone"
                    value={form.footerPhone}
                    onChange={set('footerPhone')}
                    placeholder="+234 803 000 0000"
                  />
                  <TextInput
                    label="Copyright Text"
                    value={form.footerCopyright}
                    onChange={set('footerCopyright')}
                    placeholder="© {year} My Business. All rights reserved."
                    helper="Use {year} for current year"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── NOTIFICATIONS ──────────────────────────────────────────── */}
        {activeTab === 'notify' && (
          <Card title="Notification Preferences">
            <div className="space-y-3">
              {[
                { label: 'New Orders', desc: 'Get notified when you receive new orders', defaultChecked: true },
                { label: 'Low Stock Alerts', desc: 'Alert when product stock is running low', defaultChecked: true },
                { label: 'Customer Reviews', desc: 'Get notified of new ratings and reviews', defaultChecked: true },
                { label: 'Daily Reports', desc: 'Receive daily sales and performance reports', defaultChecked: false },
                { label: 'Subscription Reminders', desc: 'Get reminded before your subscription expires', defaultChecked: true },
              ].map(({ label, desc, defaultChecked }) => (
                <label key={label} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input type="checkbox" className="mt-0.5 rounded" defaultChecked={defaultChecked} />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </Card>
        )}

        {/* Save button */}
        <div className="flex items-center justify-between pt-2">
          {storefrontUrl && (
            <a href={storefrontUrl} target="_blank" rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              <Eye className="w-4 h-4" /> Preview storefront
            </a>
          )}
          <Button type="submit" loading={saving} icon={Save} size="lg" className="ml-auto">
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;