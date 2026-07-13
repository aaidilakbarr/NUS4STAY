import { supabase } from '../lib/supabase';
import { getLowestRoomPrice } from '../utils/pricing';

const normalizeDestination = (property) => ({
  id: property.id,
  name: property.location || property.name,
  propertiesCount: 1,
  image: property.image || property.images?.[0] || '',
});

const normalizeRooms = (rooms) => (Array.isArray(rooms)
  ? rooms.map((room) => ({
    ...room,
    amenities: Array.isArray(room.amenities) ? room.amenities : [],
  }))
  : []);

const mapPropertyRecord = (property, rooms = property.rooms) => {
  const { rooms: _propertyRooms, ...propertyWithoutRooms } = property;
  const normalizedRooms = Array.isArray(rooms) ? normalizeRooms(rooms) : null;

  return {
    ...propertyWithoutRooms,
    price: getLowestRoomPrice(normalizedRooms, property.price),
    amenities: Array.isArray(property.amenities) ? property.amenities : [],
    images: Array.isArray(property.images) && property.images.length > 0
      ? property.images
      : [property.image].filter(Boolean),
    ...(normalizedRooms ? { rooms: normalizedRooms } : {}),
  };
};

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

const BOOKING_SELECT = `
  booking_id,
  booking_code,
  property_id,
  room_id,
  guest_name,
  guest_email,
  guest_phone,
  check_in,
  check_out,
  guests,
  guest_count,
  unit_price,
  night_count,
  total_price,
  booking_status,
  payment_status,
  expires_at,
  expired_at,
  inventory_released_at,
  payment_method,
  created_at,
  updated_at,
  properties(name, location, image, images),
  rooms(name, image)
`;

const BOOKING_STATUS_LABELS = {
  pending_payment: 'Menunggu pembayaran',
  payment_review: 'Sedang ditinjau',
  confirmed: 'Dikonfirmasi',
  expired: 'Kedaluwarsa',
  cancelled: 'Dibatalkan',
};

const normalizeBookingRecord = (record) => {
  if (!record) return null;

  const property = record.properties || {};
  const room = record.rooms || {};
  const bookingStatus = record.booking_status || 'pending_payment';
  const guestCount = Number(record.guest_count || 1);

  return {
    ...record,
    id: record.booking_id || record.id,
    bookingId: record.booking_id || record.id,
    bookingCode: record.booking_code || record.id,
    bookingStatus,
    paymentStatus: record.payment_status || 'unpaid',
    status: BOOKING_STATUS_LABELS[bookingStatus] || bookingStatus,
    expiresAt: record.expires_at || null,
    serverNow: record.server_now || null,
    expiredAt: record.expired_at || null,
    inventoryReleasedAt: record.inventory_released_at || null,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    checkIn: record.check_in,
    checkOut: record.check_out,
    guestName: record.guest_name,
    guestEmail: record.guest_email,
    guestPhone: record.guest_phone,
    guests: record.guests || `${guestCount} Tamu`,
    guestCount,
    unitPrice: Number(record.unit_price || 0),
    nightCount: Number(record.night_count || 0),
    totalPrice: Number(record.total_price || 0),
    propertyName: property.name,
    propertyLocation: property.location,
    propertyImage: property.image || property.images?.[0] || '',
    roomName: room.name,
    roomImage: room.image,
  };
};

const getBookingErrorCode = (error) => {
  const raw = [error?.details, error?.hint, error?.message].filter(Boolean).join(' ');
  const match = raw.match(/\b[A-Z][A-Z0-9_]{2,}\b/g);
  return match?.find((code) => [
    'AUTH_REQUIRED',
    'BOOKING_NOT_FOUND',
    'INVALID_IDEMPOTENCY_KEY',
    'INVALID_PAYMENT_PROOF_PATH',
    'ROOM_NOT_FOUND',
    'ROOM_INACTIVE',
    'INVALID_DATE_RANGE',
    'GUEST_LIMIT_EXCEEDED',
    'AVAILABILITY_NOT_INITIALIZED',
    'ROOM_UNAVAILABLE',
    'BOOKING_EXPIRED',
    'INVALID_STATUS_TRANSITION',
    'PAYMENT_ALREADY_PROCESSED',
    'FORBIDDEN',
  ].includes(code)) || null;
};

const BOOKING_ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Silakan masuk terlebih dahulu untuk membuat booking.',
  BOOKING_NOT_FOUND: 'Booking tidak ditemukan untuk akun ini.',
  INVALID_IDEMPOTENCY_KEY: 'Sesi checkout tidak valid. Muat ulang halaman dan coba lagi.',
  INVALID_PAYMENT_PROOF_PATH: 'Lokasi file bukti pembayaran tidak valid.',
  ROOM_NOT_FOUND: 'Kamar yang dipilih tidak ditemukan.',
  ROOM_INACTIVE: 'Kamar ini sedang tidak tersedia untuk dipesan.',
  INVALID_DATE_RANGE: 'Periksa kembali tanggal menginap yang dipilih.',
  GUEST_LIMIT_EXCEEDED: 'Jumlah tamu melebihi kapasitas kamar.',
  AVAILABILITY_NOT_INITIALIZED: 'Ketersediaan kamar untuk tanggal ini belum siap. Coba tanggal lain.',
  ROOM_UNAVAILABLE: 'Kamar baru saja dipesan tamu lain. Pilih kamar atau tanggal lain.',
  BOOKING_EXPIRED: 'Batas waktu booking sudah berakhir. Silakan buat booking baru.',
  INVALID_STATUS_TRANSITION: 'Aksi ini tidak tersedia untuk status booking saat ini.',
  PAYMENT_ALREADY_PROCESSED: 'Pembayaran ini sudah pernah diproses.',
  FORBIDDEN: 'Kamu tidak memiliki akses untuk melakukan aksi ini.',
};

export const mapBookingError = (error) => {
  const code = getBookingErrorCode(error);
  const mappedError = new Error(BOOKING_ERROR_MESSAGES[code] || error?.message || 'Booking gagal diproses.');
  mappedError.code = code;
  mappedError.cause = error;
  return mappedError;
};

const readRpcRow = (data) => (Array.isArray(data) ? data[0] : data);

const fetchBooking = async (id) => {
  if (!id) return null;

  const byId = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('booking_id', id)
    .maybeSingle();

  if (byId.error) return null;

  const attachServerTime = async (record) => {
    if (!record) return null;
    const { data: serverNow } = await supabase.rpc('get_server_time');
    return normalizeBookingRecord({ ...record, server_now: serverNow });
  };

  if (byId.data) return attachServerTime(byId.data);

  const byCode = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('booking_code', id)
    .maybeSingle();

  return byCode.error ? null : attachServerTime(byCode.data);
};

export const db = {
  getDestinations: async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, location, image, images')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data ?? []).map(normalizeDestination);
  },

  getProperties: async (filters = {}) => {
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, location, region, price, rating, image, images, description, amenities, is_active, rooms(price, is_active)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) return [];

    const properties = (data ?? []).map((property) => {
      const mappedProperty = mapPropertyRecord(property);
      const { rooms: _rooms, ...propertyWithoutRooms } = mappedProperty;
      return propertyWithoutRooms;
    });

    return applyPropertyFilters(properties, filters);
  },

  getPropertyById: async (id) => {
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, name, location, region, price, rating, image, images, description, amenities, is_active')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (propertyError) return null;

    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name, price, image, description, amenities, is_active, max_guests')
      .eq('property_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (roomsError) {
      return { ...mapPropertyRecord(property, []), rooms: [] };
    }

    const normalizedRooms = normalizeRooms(rooms);
    return { ...mapPropertyRecord(property, normalizedRooms), rooms: normalizedRooms };
  },

  getBookingHistory: async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(BOOKING_SELECT)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data ?? []).map(normalizeBookingRecord);
  },

  getBookingById: fetchBooking,

  createBooking: async ({ roomId, checkIn, checkOut, guestCount, idempotencyKey }) => {
    const { data, error } = await supabase.rpc('create_booking', {
      p_room_id: roomId,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_guest_count: guestCount,
      p_idempotency_key: idempotencyKey,
    });

    if (error) throw mapBookingError(error);
    return normalizeBookingRecord(readRpcRow(data));
  },

  cancelBooking: async (bookingId) => {
    const { data, error } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
    });

    if (error) throw mapBookingError(error);
    return normalizeBookingRecord(readRpcRow(data));
  },

  uploadPaymentProof: async (bookingId, file) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw mapBookingError({ message: 'AUTH_REQUIRED' });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const fileId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const path = `${userData.user.id}/${bookingId}/${fileId}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(path, file, { upsert: false });

    if (uploadError) {
      throw new Error('Upload bukti pembayaran gagal. Periksa format dan ukuran file.');
    }

    const { data, error } = await supabase.rpc('upload_payment_proof', {
      p_booking_id: bookingId,
      p_proof_path: path,
    });

    if (error) throw mapBookingError(error);
    return normalizeBookingRecord(readRpcRow(data));
  },
};
