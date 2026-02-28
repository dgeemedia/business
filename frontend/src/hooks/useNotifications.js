// frontend/src/hooks/useNotifications.js
// Shared notification hook — used by both DashboardLayout and SuperAdminLayout
// Polls every 30s, exposes unreadCount, notifications, and actions

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const POLL_INTERVAL = 30_000; // 30 seconds

export function useNotifications() {
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [loading, setLoading]               = useState(true);
  const [panelOpen, setPanelOpen]           = useState(false);
  const intervalRef                         = useRef(null);

  const fetchNotifications = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/api/notifications', { params: { limit: 30 } });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount ?? 0);
    } catch {
      // silently fail — don't disrupt the UI
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(() => fetchNotifications(true), POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  const openPanel = useCallback(() => {
    setPanelOpen(true);
    // Refresh when opening
    fetchNotifications(true);
  }, [fetchNotifications]);

  const closePanel = useCallback(() => setPanelOpen(false), []);

  return {
    notifications,
    unreadCount,
    loading,
    panelOpen,
    openPanel,
    closePanel,
    markAsRead,
    markAllAsRead,
    refresh: () => fetchNotifications(true),
  };
}