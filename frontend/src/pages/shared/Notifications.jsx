// frontend/src/pages/shared/Notifications.jsx
//
// Full notifications page — used at BOTH:
//   /dashboard/notifications           (business admin/staff)
//   /super-admin/notifications         (super-admin)
//
// Usage in your router:
//   <Route path="/dashboard/notifications"       element={<Notifications />} />
//   <Route path="/super-admin/notifications"     element={<Notifications isSuperAdmin />} />
//
// The page fetches its own data independently so it works even if the user
// navigates directly to the URL (not just from the bell panel).

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCheck, RefreshCw, Trash2,
  Filter, Search, ChevronLeft, Inbox,
  ArrowRight, Clock
} from 'lucide-react';
import api from '../../services/api';
import { NotificationRow, typeIcon, timeAgo } from '../../components/shared/NotificationPanel';

const PAGE_SIZE = 20;

const TYPE_FILTERS = [
  { value: 'all',          label: 'All' },
  { value: 'order',        label: '🛒 Orders' },
  { value: 'payment',      label: '💳 Payments' },
  { value: 'subscription', label: '📋 Subscriptions' },
  { value: 'product',      label: '📦 Products' },
  { value: 'user',         label: '👤 Users' },
  { value: 'review',       label: '⭐ Reviews' },
  { value: 'alert',        label: '🚨 Alerts' },
  { value: 'system',       label: 'ℹ️ System' },
];

export default function Notifications({ isSuperAdmin = false }) {
  const navigate   = useNavigate();
  const backPath   = isSuperAdmin ? '/super-admin' : '/dashboard';

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [totalCount, setTotalCount]       = useState(0);
  const [page, setPage]                   = useState(1);
  const [hasMore, setHasMore]             = useState(false);
  const [typeFilter, setTypeFilter]       = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [deleting, setDeleting]           = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPage = useCallback(async (pageNum = 1, replace = true) => {
    try {
      setLoading(true);
      const params = { limit: PAGE_SIZE, offset: (pageNum - 1) * PAGE_SIZE };
      const res = await api.get('/api/notifications', { params });
      const all = res.data.notifications || [];

      // Client-side filter (avoids extra endpoints)
      let filtered = all;
      if (typeFilter !== 'all')  filtered = filtered.filter(n => n.type?.toLowerCase() === typeFilter);
      if (showUnreadOnly)         filtered = filtered.filter(n => !n.read);
      if (searchQuery.trim())     filtered = filtered.filter(n =>
        n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setNotifications(prev => replace ? filtered : [...prev, ...filtered]);
      setUnreadCount(res.data.unreadCount ?? 0);
      setTotalCount(all.length);
      setHasMore(all.length === PAGE_SIZE);
      setPage(pageNum);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, showUnreadOnly, searchQuery]);

  useEffect(() => { fetchPage(1, true); }, [fetchPage]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    await api.patch(`/api/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await api.post('/api/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const deleteOld = async () => {
    if (!confirm('Delete all notifications older than 90 days?')) return;
    setDeleting(true);
    try {
      await api.delete('/api/notifications/cleanup');
      fetchPage(1, true);
    } catch {}
    setDeleting(false);
  };

  function handleNavigate(link) {
    navigate(link);
  }

  function handleLoadMore() {
    fetchPage(page + 1, false);
  }

  // ── Computed ───────────────────────────────────────────────────────────────
  const grouped = groupByDate(notifications);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(backPath)}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6" /> Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPage(1, true)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-semibold rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
          <button
            onClick={deleteOld}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            title="Clean up old notifications"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notifications…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
          />
        </div>

        {/* Type filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                typeFilter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Unread toggle */}
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <div
            onClick={() => setShowUnreadOnly(p => !p)}
            className={`w-9 h-5 rounded-full transition-colors relative ${showUnreadOnly ? 'bg-blue-500' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${showUnreadOnly ? 'left-[18px]' : 'left-0.5'}`} />
          </div>
          <span className="text-sm text-gray-600 font-medium">Unread only</span>
        </label>
      </div>

      {/* Notifications list */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-400">Loading notifications…</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-bold text-gray-500 text-lg">No notifications</p>
            <p className="text-sm text-gray-400 mt-1">
              {typeFilter !== 'all' || showUnreadOnly || searchQuery
                ? 'Try clearing your filters'
                : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {Object.entries(grouped).map(([label, items]) => (
              <motion.div
                key={label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Date group header */}
                <div className="flex items-center gap-3 px-6 py-2 bg-gray-50/80 border-b border-gray-100">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
                </div>
                <ul className="divide-y divide-gray-50">
                  {items.map(n => (
                    <NotificationRow
                      key={n.id}
                      n={n}
                      onMarkAsRead={markAsRead}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </ul>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className="p-4 border-t border-gray-100 text-center">
            <button
              onClick={handleLoadMore}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5 mx-auto"
            >
              Load more <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {loading && notifications.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex justify-center">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <p className="text-xs text-center text-gray-400">
        Notifications are archived after 30 days · Showing {notifications.length} of {totalCount}
      </p>
    </div>
  );
}

// ── Group notifications by relative date label ────────────────────────────────
function groupByDate(notifications) {
  const now   = new Date();
  const today = startOfDay(now);
  const yesterday = startOfDay(new Date(now - 86400_000));
  const thisWeek  = startOfDay(new Date(now - 7 * 86400_000));

  const groups = {};
  for (const n of notifications) {
    const d = startOfDay(new Date(n.createdAt));
    let label;
    if (d >= today)         label = 'Today';
    else if (d >= yesterday) label = 'Yesterday';
    else if (d >= thisWeek)  label = 'This week';
    else {
      label = new Date(n.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }
  return groups;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}