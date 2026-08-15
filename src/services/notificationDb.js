import { supabase } from '../lib/supabase';
import { createSafeError } from '../utils/errorHandler';

const NOTIF_HREF_FALLBACK = {
  payment_approved: '#/history',
  payment_rejected: '#/history',
  rating_reminder: '#/history',
  promotion: '#/search',
};

async function resolveRedirectHref(type) {
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('booking_id')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !bookings?.length) return NOTIF_HREF_FALLBACK[type] ?? '#/';
  return `#/history-detail/${bookings[0].booking_id}`;
}

export const notificationDb = {
  getNotifications: async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return [];
    return data ?? [];
  },

  getUnreadCount: async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('is_read', false);

    if (error) return 0;
    return data?.length ?? 0;
  },

  markAsRead: async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw createSafeError(error, 'Gagal memperbarui status notifikasi.');
  },

  markAllAsRead: async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) throw createSafeError(error, 'Gagal menandai semua notifikasi sudah dibaca.');
  },

  getPreferences: async () => {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .maybeSingle();

    if (error) return null;
    return data;
  },

  upsertPreferences: async (prefs) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Silakan login terlebih dahulu.');

    const payload = {
      user_id: userData.user.id,
      booking_updates: prefs.booking_updates ?? true,
      promotions: prefs.promotions ?? false,
    };

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw createSafeError(error, 'Gagal menyimpan preferensi notifikasi.');
    return data;
  },

  createMockNotification: async (type, title, message) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Silakan login terlebih dahulu.');

    const href = await resolveRedirectHref(type);
    const payload = {
      user_id: userData.user.id,
      type,
      title,
      message,
      data: { href },
      is_read: false,
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert(payload)
      .select()
      .single();

    if (error) throw createSafeError(error, 'Gagal membuat notifikasi.');
    return data;
  },
};
