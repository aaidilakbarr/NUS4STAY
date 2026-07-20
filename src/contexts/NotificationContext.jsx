import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { notificationDb } from '../services/notificationDb';
import { useAuth } from './useAuth';

const NotificationContext = createContext(null);

const NOTIF_BOOKING_TYPES = ['booking_confirmed', 'booking_pending', 'rating_reminder', 'payment_approved', 'payment_rejected'];
const NOTIF_PROMO_TYPES = ['promotion', 'promo'];

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);

  const filteredNotifications = useMemo(() => {
    if (!preferences) return notifications;
    return notifications.filter((n) => {
      if (NOTIF_BOOKING_TYPES.includes(n.type) && !preferences.booking_updates) return false;
      if (NOTIF_PROMO_TYPES.includes(n.type) && !preferences.promotions) return false;
      return true;
    });
  }, [notifications, preferences]);

  const filteredUnreadCount = useMemo(
    () => filteredNotifications.filter((n) => !n.is_read).length,
    [filteredNotifications],
  );

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

  const createMockNotification = useCallback(async (type, title, message) => {
    const created = await notificationDb.createMockNotification(type, title, message);
    setNotifications((prev) => [created, ...prev]);
    setUnreadCount((prev) => prev + 1);
    return created;
  }, []);

  const value = useMemo(() => ({
    notifications: filteredNotifications,
    unreadCount: filteredUnreadCount,
    preferences,
    loading,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    createMockNotification,
    refresh: loadNotifications,
  }), [filteredNotifications, filteredUnreadCount, preferences, loading, markAsRead, markAllAsRead, updatePreferences, createMockNotification, loadNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
