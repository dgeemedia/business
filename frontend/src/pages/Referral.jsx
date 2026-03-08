// frontend/src/pages/Referral.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Copy, Check, Share2, Gift, TrendingUp, Users, CheckCircle,
  Clock, Coins, ChevronRight, Zap, RotateCw, Star, Target,
  XCircle, AlertCircle, Sparkles, BadgeCheck, ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import useBusinessStore from '../stores/businessStore';

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtN(n) { return `₦${Number(n || 0).toLocaleString('en-NG')}`; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
// ✅ Build the store URL from a slug
function storeUrl(slug) {
  return `https://www.${ROOT_DOMAIN}/store/${slug}`;
}

// ─── Animated number ─────────────────────────────────────────────────────────
function Ticker({ to, prefix = '', suffix = '', duration = 1100 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const target = Number(to) || 0;
    if (!target) { setVal(0); return; }
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to, duration]);
  return <>{prefix}{val.toLocaleString()}{suffix}</>;
}

// ─── SVG circular progress ───────────────────────────────────────────────────
function Ring({ pct, size = 160, stroke = 13, trackColor = 'rgba(255,255,255,.1)', fillColor = '#f97316' }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke}/>
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={fillColor} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyBtn({ text, label = 'Copy', variant = 'ghost' }) {
  const [copied, setCopied] = useState(false);
  const go = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true); toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };
  const base = 'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0';
  const styles = {
    ghost:   copied ? `${base} bg-emerald-500 text-white` : `${base} bg-white/10 hover:bg-white/20 text-white`,
    outline: copied ? `${base} bg-emerald-500 text-white border-emerald-500` : `${base} bg-white text-gray-700 border border-gray-200 hover:bg-gray-50`,
  };
  return (
    <button onClick={go} className={styles[variant]}>
      {copied ? <Check className="w-3.5 h-3.5"/> : <Copy className="w-3.5 h-3.5"/>}
      {copied ? 'Copied!' : label}
    </button>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function TxnBadge({ status, autoApplied }) {
  if (status === 'redeemed' && autoApplied)
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200"><Zap className="w-3 h-3"/>Auto-applied</span>;
  if (status === 'redeemed')
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200"><BadgeCheck className="w-3 h-3"/>Admin applied</span>;
  if (status === 'approved')
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle className="w-3 h-3"/>Credited</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200"><Clock className="w-3 h-3"/>Pending</span>;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ReferralDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('overview');

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/referral/dashboard');
      setData(res.data);
    } catch { toast.error('Failed to load referral data'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-9 h-9 border-2 border-orange-500 border-t-transparent rounded-full"/>
    </div>
  );
  if (!data) return null;

  const { referralCode, balance, stats, progress, transactions,
          bonusPerReferral, subscriptionCost, autoApplyEnabled } = data;

  // ✅ shareUrl defined AFTER data is confirmed non-null
  const shareUrl = `${window.location.origin}?ref=${referralCode}`;

  const share = () => {
    const msg = [
      `Join MyPadiBusiness — Nigeria's #1 business platform! 🚀`,
      ``,
      `I use it to run my business online. Register here:`,
      shareUrl,
      ``,
      `(My referral code *${referralCode}* is already in the link)`,
    ].join('\n');
    if (navigator.share) navigator.share({ title: 'Join MyPadiBusiness', text: msg, url: shareUrl }).catch(() => {});
    else { navigator.clipboard.writeText(shareUrl); toast.success('Share link copied!'); }
  };

  const tabs = [
    { key: 'overview', label: 'Overview',     icon: TrendingUp },
    { key: 'history',  label: 'History',      icon: Clock      },
    { key: 'howto',    label: 'How It Works', icon: Star       },
  ];

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Referral Program</h1>
          <p className="text-gray-500 text-sm">
            Earn <span className="text-orange-600 font-semibold">₦{bonusPerReferral.toLocaleString()}</span> cashback per approved referral.
            Collect 30 → get a <span className="text-orange-600 font-semibold">free month</span>.
          </p>
        </div>
        <button onClick={fetch} title="Refresh"
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0">
          <RotateCw className="w-4 h-4"/>
        </button>
      </div>

      {/* ── Hero card ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl"
        style={{ background: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 42%, #1e3a5f 100%)' }}>

        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #f97316, transparent)' }}/>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }}/>
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
            <defs><pattern id="rg" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0L0 0 0 20" fill="none" stroke="white" strokeWidth="0.4"/>
            </pattern></defs>
            <rect width="100%" height="100%" fill="url(#rg)"/>
          </svg>
        </div>

        <div className="relative p-5 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

            {/* Left — code + share */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Gift className="w-4 h-4 text-white"/>
                </div>
                <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">Your Referral Code</span>
              </div>

              {/* ✅ MOBILE FIX — code + copy button in one pill, code truncates, button never clips */}
              <div className="mb-5">
                <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 backdrop-blur-sm w-full">
                  <span
                    className="font-black text-2xl sm:text-3xl md:text-4xl tracking-[0.2em] text-white flex-1 min-w-0 truncate"
                    style={{ fontFamily: 'monospace' }}
                  >
                    {referralCode}
                  </span>
                  <CopyBtn text={referralCode} label="Copy"/>
                </div>
              </div>

              <p className="text-white/50 text-sm leading-relaxed mb-5">
                Share this code with other business owners. When they register and get approved, you instantly earn{' '}
                <span className="text-orange-400 font-semibold">₦{bonusPerReferral.toLocaleString()}</span>.
                Your balance is <span className="text-emerald-400 font-semibold">automatically applied</span> to your next subscription payment.
              </p>

              {/* Auto-apply status pill */}
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold mb-5 ${
                autoApplyEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {autoApplyEnabled
                  ? <><Zap className="w-3.5 h-3.5 flex-shrink-0"/> Auto-apply ON — balance deducted automatically at checkout</>
                  : <><AlertCircle className="w-3.5 h-3.5 flex-shrink-0"/> Auto-apply paused for next payment (admin override)</>}
              </div>

              {/* ✅ MOBILE FIX — share buttons stretch on small screens */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={share}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-semibold text-sm transition-colors min-w-0"
                >
                  <Share2 className="w-4 h-4 flex-shrink-0"/> Share Link
                </button>
                <CopyBtn text={shareUrl} label="Copy Link" variant="ghost"/>
              </div>
            </div>

            {/* Right — ring + balance */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <Ring pct={progress.percent}/>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">
                    <Ticker to={balance} prefix="₦"/>
                  </span>
                  <span className="text-white/50 text-xs mt-0.5">Balance</span>
                </div>
              </div>

              <div className="mt-4 w-full bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                <div className="text-lg font-black text-orange-400 mb-0.5">{progress.percent}%</div>
                <div className="text-white/50 text-xs mb-2">toward free month</div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${progress.percent}%` }}
                    transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}/>
                </div>
                <p className="text-white/30 text-[11px] mt-2">
                  {progress.referralsLeft > 0
                    ? `${progress.referralsLeft} more referral${progress.referralsLeft !== 1 ? 's' : ''} needed`
                    : '🎉 Enough balance for a free month!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon className="w-3.5 h-3.5"/> {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Users,       color: 'blue',    label: 'Total Referrals', value: stats.approved + stats.pending + stats.redeemed },
                { icon: CheckCircle, color: 'emerald', label: 'Approved',        value: stats.approved   },
                { icon: Zap,         color: 'orange',  label: 'Auto-Applied',    value: stats.autoApplied },
                { icon: Coins,       color: 'purple',  label: 'Total Earned',    value: null, naira: stats.totalEarned },
              ].map(({ icon: Icon, color, label, value, naira }) => (
                <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className={`inline-flex p-2.5 rounded-xl bg-${color}-50 mb-3`}>
                    <Icon className={`w-5 h-5 text-${color}-600`}/>
                  </div>
                  <p className="text-2xl font-black text-gray-900">
                    {naira !== undefined ? fmtN(naira) : <Ticker to={value}/>}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Auto-apply explainer */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white"/>
              </div>
              <div>
                <p className="font-bold text-blue-900 text-sm mb-1">Auto-Apply is {autoApplyEnabled ? 'Active' : 'Paused'}</p>
                <p className="text-blue-700 text-sm leading-relaxed">
                  {autoApplyEnabled
                    ? `When you pay for your next subscription, up to ${fmtN(balance)} from your referral balance will be automatically deducted from the payment total. You only pay the remainder.`
                    : 'Your admin has temporarily paused auto-apply for your next payment. Your balance is safe and will carry forward.'}
                </p>
              </div>
            </div>

            {/* Earnings calculator */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white"/>
                </div>
                <h3 className="font-bold text-gray-900">Earnings Calculator</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { refs: 5,  label: '5 referrals' },
                  { refs: 15, label: '15 referrals' },
                  { refs: 30, label: '30 = FREE month 🎉' },
                ].map(({ refs, label }) => (
                  <div key={refs} className="bg-white rounded-xl p-4 text-center border border-orange-100">
                    <p className="text-2xl font-black text-orange-600">{fmtN(refs * bonusPerReferral)}</p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-center text-orange-700 mt-3 font-medium">
                Each ₦{bonusPerReferral.toLocaleString()} auto-applies at checkout → 30 referrals = full ₦{subscriptionCost.toLocaleString()} covered
              </p>
            </div>

            {/* Recent */}
            {transactions.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Recent Referrals</h3>
                  <button onClick={() => setTab('history')}
                    className="text-sm text-orange-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
                    View all <ChevronRight className="w-3.5 h-3.5"/>
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {transactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {t.referredName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{t.referredName}</p>
                          <p className="text-xs text-gray-400">{fmtDate(t.approvedAt || t.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-bold text-emerald-600 text-sm">{fmtN(t.amount)}</span>
                        <TxnBadge status={t.status} autoApplied={t.autoApplied}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-orange-300"/>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">No referrals yet</h3>
                <p className="text-gray-500 text-sm mb-5">Share your code to start earning</p>
                <button onClick={share}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-semibold text-sm transition-colors">
                  <Share2 className="w-4 h-4"/> Share Your Code
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <motion.div key="hi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {transactions.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-40"/>
                  <p>No referral history yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {/* ✅ Added Store column */}
                        {['Business', 'Store', 'Bonus', 'Applied', 'Type', 'Date'].map(h => (
                          <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {transactions.map((t, i) => (
                        <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }} className="hover:bg-gray-50 transition-colors">

                          {/* Business name + slug */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {t.referredName[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{t.referredName}</p>
                                <p className="text-xs text-gray-400 font-mono">{t.referredSlug}</p>
                              </div>
                            </div>
                          </td>

                          {/* ✅ Store URL — clickable link */}
                          <td className="px-5 py-4">
                            {t.referredSlug ? (
                              <a
                                href={storeUrl(t.referredSlug)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                              >
                                <ExternalLink className="w-3 h-3 flex-shrink-0"/>
                                View Store
                              </a>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>

                          <td className="px-5 py-4 font-bold text-emerald-600 text-sm whitespace-nowrap">{fmtN(t.amount)}</td>
                          <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                            {t.appliedAmount > 0 ? fmtN(t.appliedAmount) : '—'}
                          </td>
                          <td className="px-5 py-4"><TxnBadge status={t.status} autoApplied={t.autoApplied}/></td>
                          <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{fmtDate(t.redeemedAt || t.approvedAt || t.createdAt)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* HOW IT WORKS */}
        {tab === 'howto' && (
          <motion.div key="hw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: '01', icon: Share2, grad: 'from-orange-500 to-amber-500', title: 'Share Your Code',
                  desc: `Share your code (${referralCode}) with business owners who want to sell online. Send it on WhatsApp, Instagram, or anywhere.` },
                { step: '02', icon: Users, grad: 'from-purple-500 to-indigo-500', title: 'They Register',
                  desc: 'They fill in the registration form on MyPadiBusiness and enter your referral code. Our team reviews their application.' },
                { step: '03', icon: Zap, grad: 'from-emerald-500 to-teal-500', title: 'Instant ₦500 Credit',
                  desc: 'The moment super-admin approves their account, ₦500 lands in your referral balance — and auto-applies at your next payment.' },
              ].map(({ step, icon: Icon, grad, title, desc }) => (
                <div key={step} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className={`inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white"/>
                  </div>
                  <p className="text-xs font-black text-gray-200 mb-2">STEP {step}</p>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* The numbers */}
            <div className="bg-gray-900 text-white rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white"/>
                </div>
                <h3 className="font-bold text-lg">The Maths</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-orange-400">₦500</p>
                  <p className="text-white/40 text-xs mt-1">per referral</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-orange-400">×30</p>
                  <p className="text-white/40 text-xs mt-1">referrals</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-emerald-400">₦15,000</p>
                  <p className="text-white/40 text-xs mt-1">= 1 free month 🎉</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-white/60">
                {[
                  'Bonus is credited immediately when super-admin approves the referred business',
                  'Your balance auto-applies at checkout — you only pay what remains after deduction',
                  'Super-admin can also manually apply your balance at any time',
                  'No limit on referrals — there is no cap on how much you can earn',
                  'Your referral code is permanent and unique — it never changes',
                ].map((line, i) => (
                  <li key={i} className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5"/>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}