import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { notificationDb } from '../services/notificationDb';
import { useAuth } from './useAuth';

const NotificationContext = createContext(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    const data = await notificationDb.getNotifications();
    setNotifications(data);
    setUnreadCount(data.filter((n) => !n.is_read).length);
    setLoading(false);
  }, [isAuthenticated]);

  const loadPreferences = useCallback(async () => {
    if (!isAuthenticated) {
      setPreferences(null);
      return;
    }
    const data = await notificationDb.getPreferences();
    setPreferences(data);
  }, [isAuthenticated]);

  useEffect(() => {
    loadNotifications();
    loadPreferences();
  }, [loadNotifications, loadPreferences]);

  const markAsRead = useCallback(async (id) => {
    await notificationDb.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationDb.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  const updatePreferences = useCallback(async (prefs) => {
    const updated = await notificationDb.upsertPreferences(prefs);
    setPreferences(updated);
  }, []);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    preferences,
    loading,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    refresh: loadNotifications,
  }), [notifications, unreadCount, preferences, loading, markAsRead, markAllAsRead, updatePreferences, loadNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
