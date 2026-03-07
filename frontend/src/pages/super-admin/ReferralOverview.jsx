// frontend/src/pages/super-admin/ReferralOverview.jsx
// Super-admin: full referral management
//   • Platform stats: auto vs manual breakdown
//   • Top referrers leaderboard
//   • Pending balances list with quick-redeem
//   • Recent transactions table
//   • Per-business override: disable/enable auto-apply, manual apply amount

import React, { useState, useEffect } from 'react';
import {
  Trophy, Users, DollarSign, Gift, CheckCircle, Clock,
  Coins, Search, Zap, AlertCircle, ToggleLeft, ToggleRight,
  ChevronDown, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';

function fmtN(n)  { return `₦${Number(n || 0).toLocaleString('en-NG')}`; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function TxnBadge({ status, autoApplied }) {
  if (status === 'redeemed' && autoApplied)
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">Auto-applied</span>;
  if (status === 'redeemed')
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">Admin applied</span>;
  if (status === 'approved')
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">Credited</span>;
  return   <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">Pending</span>;
}

// ── Override modal ────────────────────────────────────────────────────────────
function OverrideModal({ biz, onClose, onDone }) {
  const [tab,       setTab]       = useState('apply');   // apply | toggle
  const [amount,    setAmount]    = useState(biz.referralBonus || '');
  const [note,      setNote]      = useState('');
  const [loading,   setLoading]   = useState(false);

  const handleApply = async () => {
    if (!amount || Number(amount) <= 0) return toast.error('Enter a valid amount');
    try {
      setLoading(true);
      const res = await api.post('/api/referral/redeem', {
        businessId: biz.id, amount: Number(amount), note,
      });
      toast.success(res.data.message);
      onDone();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleToggle = async (skip) => {
    try {
      setLoading(true);
      const res = await api.post('/api/referral/redeem', {
        businessId: biz.id, skipNextAutoApply: skip,
      });
      toast.success(res.data.message);
      onDone();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl z-10 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">Manage Referral Balance</h3>
            <p className="text-sm text-gray-500 mt-0.5">{biz.businessName} · {fmtN(biz.referralBonus)} available</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4"/>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 border-b border-gray-100 bg-gray-50">
          {[
            { key: 'apply',  label: 'Apply Balance', icon: DollarSign },
            { key: 'toggle', label: 'Auto-Apply',     icon: Zap        },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-3.5 h-3.5"/> {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'apply' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount to Apply (₦)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  max={biz.referralBonus} min={1}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-xl font-bold focus:outline-none focus:border-blue-500"/>
                <p className="text-xs text-gray-400 mt-1.5">Max available: {fmtN(biz.referralBonus)}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Note (optional)</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Applied toward January subscription"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"/>
              </div>
              <button onClick={handleApply} disabled={loading || !amount}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                {loading ? 'Applying…' : `Apply ${fmtN(amount || 0)}`}
              </button>
            </div>
          )}

          {tab === 'toggle' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Auto-apply</strong> means the referral balance is automatically deducted from the business's next subscription payment.
                </p>
                <p className="text-sm text-gray-600">
                  Disable it once if you want to manually process their next payment without touching the referral balance.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => handleToggle(false)} disabled={loading}
                  className="flex items-center gap-3 w-full p-4 bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-400 rounded-xl text-left transition-all disabled:opacity-50">
                  <ToggleRight className="w-6 h-6 text-emerald-600 flex-shrink-0"/>
                  <div>
                    <p className="font-semibold text-emerald-900 text-sm">Enable auto-apply</p>
                    <p className="text-emerald-700 text-xs">Balance will deduct automatically on next payment</p>
                  </div>
                </button>
                <button onClick={() => handleToggle(true)} disabled={loading}
                  className="flex items-center gap-3 w-full p-4 bg-amber-50 border-2 border-amber-200 hover:border-amber-400 rounded-xl text-left transition-all disabled:opacity-50">
                  <ToggleLeft className="w-6 h-6 text-amber-600 flex-shrink-0"/>
                  <div>
                    <p className="font-semibold text-amber-900 text-sm">Pause for next payment only</p>
                    <p className="text-amber-700 text-xs">Balance is preserved; auto-apply resumes after</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReferralOverview() {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/referral/admin/overview');
      setData(res.data);
    } catch { toast.error('Failed to load referral data'); }
    finally  { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );
  if (!data) return null;

  const {
    summary = {}, autoApplied, manualRedeemed,
    topReferrers = [], pendingBalances = [],
    recentTransactions = [], constants,
  } = data;

  const totalApproved = summary.approved?.count  || 0;
  const totalPending  = summary.pending?.count   || 0;
  const totalRedeemed = summary.redeemed?.count  || 0;
  const totalIssued   = (summary.approved?.amount || 0) + (summary.redeemed?.amount || 0);

  const filtered = recentTransactions.filter(t =>
    [t.referrer?.businessName, t.referred?.businessName].join(' ').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Referral Program</h1>
        <p className="text-gray-500">Platform-wide activity · auto-apply controls · manual overrides</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: CheckCircle, label: 'Approved',        value: totalApproved,              color: 'emerald' },
          { icon: Clock,       label: 'Pending',         value: totalPending,               color: 'amber'   },
          { icon: Zap,         label: 'Auto-Applied',    value: autoApplied?.count || 0,    color: 'blue'    },
          { icon: Gift,        label: 'Total Issued',    value: fmtN(totalIssued), raw: true, color: 'orange' },
        ].map(({ icon: Icon, label, value, color, raw }) => (
          <div key={label} className={`bg-${color}-50 border border-${color}-200 rounded-2xl p-5`}>
            <div className={`inline-flex p-2 rounded-xl bg-${color}-100 mb-3`}>
              <Icon className={`w-5 h-5 text-${color}-600`}/>
            </div>
            <p className={`text-2xl font-black text-${color}-700`}>{raw ? value : Number(value).toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Auto vs Manual breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-blue-600"/>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">{fmtN(autoApplied?.total || 0)}</p>
            <p className="text-sm text-gray-500">Auto-applied across {autoApplied?.count || 0} transaction{autoApplied?.count !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6 text-purple-600"/>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">{fmtN(manualRedeemed?.total || 0)}</p>
            <p className="text-sm text-gray-500">Manually applied across {manualRedeemed?.count || 0} transaction{manualRedeemed?.count !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Leaderboard */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500"/>
            <h2 className="font-bold text-gray-900">Top Referrers</h2>
          </div>
          {topReferrers.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30"/>
              <p className="text-sm">No referrals yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topReferrers.map((b, i) => (
                <div key={b.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{b.businessName}</p>
                    <p className="text-xs text-gray-400">{b.totalReferrals} referral{b.totalReferrals !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-emerald-600">{fmtN(b.referralBonus)}</p>
                    {b.skipNextReferralAutoApply && (
                      <span className="text-[10px] text-amber-600 font-semibold">Auto-apply paused</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending balances + override */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Pending Balances</h2>
            <span className="text-xs text-gray-400">{pendingBalances.length} business{pendingBalances.length !== 1 ? 'es' : ''} with balance</span>
          </div>
          {pendingBalances.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Coins className="w-10 h-10 mx-auto mb-2 opacity-30"/>
              <p className="text-sm">No outstanding balances</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingBalances.map(b => (
                <div key={b.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{b.businessName}</p>
                    <p className="text-xs text-gray-400 capitalize">{b.subscriptionPlan?.replace('_', ' ')} plan</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-600">{fmtN(b.referralBonus)}</span>
                    <button onClick={() => setSelected(b)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors">
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 gap-3">
          <h2 className="font-bold text-gray-900">Recent Transactions</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 w-48"/>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Referrer', 'New Business', 'Amount', 'Applied', 'Type', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((t, i) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.referrer?.businessName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.referred?.businessName}</td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-600">{fmtN(t.amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{t.appliedAmount > 0 ? fmtN(t.appliedAmount) : '—'}</td>
                    <td className="px-4 py-3"><TxnBadge status={t.status} autoApplied={t.autoApplied}/></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{fmtDate(t.approvedAt || t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Override modal */}
      <AnimatePresence>
        {selected && (
          <OverrideModal
            biz={selected}
            onClose={() => setSelected(null)}
            onDone={() => { setSelected(null); fetchData(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}