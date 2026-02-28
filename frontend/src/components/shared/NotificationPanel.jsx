// frontend/src/components/shared/NotificationPanel.jsx
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, X, CheckCheck, Package, ShoppingCart, CreditCard,
  AlertCircle, Info, Users, Star, RefreshCw
} from 'lucide-react';

// ── Icon per notification type ─────────────────────────────────────────────
function typeIcon(type) {
  const map = {
    order:        { Icon: ShoppingCart, bg: 'bg-blue-100',   color: 'text-blue-600'   },
    subscription: { Icon: CreditCard,  bg: 'bg-green-100',  color: 'text-green-600'  },
    product:      { Icon: Package,     bg: 'bg-purple-100', color: 'text-purple-600' },
    alert:        { Icon: AlertCircle, bg: 'bg-red-100',    color: 'text-red-600'    },
    user:         { Icon: Users,       bg: 'bg-orange-100', color: 'text-orange-600' },
    review:       { Icon: Star,        bg: 'bg-yellow-100', color: 'text-yellow-600' },
    system:       { Icon: Info,        bg: 'bg-gray-100',   color: 'text-gray-600'   },
  };
  return map[type?.toLowerCase()] || map.system;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Bell button ────────────────────────────────────────────────────────────
export function NotificationBell({ unreadCount, onClick, dark = false }) {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-lg transition-colors ${
        dark
          ? 'text-white hover:bg-white/10'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

// ── Slide-out panel ────────────────────────────────────────────────────────
export function NotificationPanel({
  open,
  onClose,
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onRefresh,
}) {
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handler(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, x: 20, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-4 right-4 w-[360px] max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-700" />
                <h2 className="font-bold text-gray-900">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={onRefresh}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mark all text button */}
            {unreadCount > 0 && (
              <div className="px-5 py-2 bg-blue-50 border-b border-blue-100 flex-shrink-0">
                <button
                  onClick={onMarkAllAsRead}
                  className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                >
                  ✓ Mark all {unreadCount} as read
                </button>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Bell className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="font-semibold text-gray-500">All caught up!</p>
                  <p className="text-sm text-gray-400 mt-1">No notifications yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {notifications.map((n) => {
                    const { Icon, bg, color } = typeIcon(n.type);
                    return (
                      <li
                        key={n.id}
                        onClick={() => !n.read && onMarkAsRead(n.id)}
                        className={`flex gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
                          n.read
                            ? 'hover:bg-gray-50'
                            : 'bg-blue-50/60 hover:bg-blue-50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Icon className={`w-4.5 h-4.5 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-semibold leading-tight ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0 bg-gray-50">
                <p className="text-xs text-gray-400 text-center">
                  Showing last 30 notifications • Archived after 30 days
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}