import { supabase } from '../lib/supabase';

const normalizeAmenities = (amenities) => {
  if (Array.isArray(amenities)) {
    return amenities.map((item) => item.trim()).filter(Boolean);
  }

  return String(amenities ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizePropertyPayload = (payload) => ({
  name: payload.name.trim(),
  location: payload.location.trim(),
  region: payload.region.trim(),
  price: Number(payload.price) || 0,
  rating: Number(payload.rating) || 0,
  image: payload.image?.trim() || null,
  description: payload.description?.trim() || null,
  amenities: normalizeAmenities(payload.amenities),
  is_active: Boolean(payload.is_active),
});

export const adminProperties = {
  list: async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  create: async (payload) => {
    const { data, error } = await supabase
      .from('properties')
      .insert(normalizePropertyPayload(payload))
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id, payload) => {
    const { data, error } = await supabase
      .from('properties')
      .update(normalizePropertyPayload(payload))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  remove: async (id) => {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};
