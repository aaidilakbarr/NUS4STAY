import { supabase } from '../lib/supabase';

const STORAGE_KEYS = {
  bookings: 'nus4stay_bookings',
};

const normalizeDestination = (property) => ({
  id: property.id,
  name: property.location || property.name,
  propertiesCount: 1,
  image: property.image || property.images?.[0] || '',
});

const mapPropertyRecord = (property) => ({
  ...property,
  amenities: Array.isArray(property.amenities) ? property.amenities : [],
  images: Array.isArray(property.images) && property.images.length > 0
    ? property.images
    : [property.image].filter(Boolean),
});

const applyPropertyFilters = (properties, filters = {}) => {
  let filtered = [...properties];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter((property) => (
      property.name.toLowerCase().includes(q)
      || property.location.toLowerCase().includes(q)
      || property.region.toLowerCase().includes(q)
    ));
  }

  if (filters.region) {
    filtered = filtered.filter((property) => (
      property.region.toLowerCase() === filters.region.toLowerCase()
    ));
  }

  if (filters.maxPrice) {
    filtered = filtered.filter((property) => property.price <= filters.maxPrice);
  }

  if (filters.minRating) {
    filtered = filtered.filter((property) => property.rating >= filters.minRating);
  }

  if (filters.amenities && filters.amenities.length > 0) {
    filtered = filtered.filter((property) => (
      filters.amenities.every((amenity) => property.amenities.includes(amenity))
    ));
  }

  return filtered;
};

export const db = {
  getDestinations: async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, location, image, images')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    return (data ?? []).map(normalizeDestination);
  },

  getProperties: async (filters = {}) => {
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, location, region, price, rating, image, images, description, amenities, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    return applyPropertyFilters((data ?? []).map(mapPropertyRecord), filters);
  },

  getPropertyById: async (id) => {
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, name, location, region, price, rating, image, images, description, amenities, is_active')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (propertyError) {
      return null;
    }

    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name, price, image, description, amenities, is_active')
      .eq('property_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (roomsError) {
      return {
        ...mapPropertyRecord(property),
        rooms: [],
      };
    }

    return {
      ...mapPropertyRecord(property),
      rooms: (rooms ?? []).map((room) => ({
        ...room,
        amenities: Array.isArray(room.amenities) ? room.amenities : [],
      })),
    };
  },

  getBookingHistory: async () => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user ?? null;
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings)) || [];

    if (!user) {
      return [];
    }

    return bookings.filter((booking) => booking.userId === user.id);
  },

  getBookingById: async (id) => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user ?? null;
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings)) || [];
    return bookings.find((booking) => booking.id === id && (!user || booking.userId === user.id)) || null;
  },

  createBooking: async (bookingData) => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user ?? null;
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings)) || [];
    const prefix = `N4-${Math.floor(1000 + Math.random() * 9000)}`;
    const suffix = ['ST', 'AZ', 'AV', 'TE'][Math.floor(Math.random() * 4)];
    const id = `${prefix}-${suffix}`;

    const newBooking = {
      id,
      ...bookingData,
      userId: user?.id ?? null,
      userEmail: user?.email ?? bookingData.guestEmail ?? null,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    bookings.push(newBooking);
    localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
    return newBooking;
  },

  updateBookingStatus: async (id, status) => {
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings)) || [];
    const idx = bookings.findIndex((booking) => booking.id === id);

    if (idx !== -1) {
      bookings[idx].status = status;
      localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
      return bookings[idx];
    }

    return null;
  },
};
