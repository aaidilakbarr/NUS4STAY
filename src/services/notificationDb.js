import { supabase } from '../lib/supabase';

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

    if (error) throw new Error(error.message);
  },

  markAllAsRead: async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) throw new Error(error.message);
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

    if (error) throw new Error(error.message);
    return data;
  },
};
