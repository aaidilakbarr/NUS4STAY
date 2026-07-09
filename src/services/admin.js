import { supabase } from '../lib/supabase';

const PROPERTY_BUCKET = 'property-images';

const mapAdminError = (error, context = 'property') => {
  const message = error?.message ?? 'Terjadi kesalahan saat memproses data.';

  if (/row-level security|permission denied|not allowed/i.test(message)) {
    return new Error(`Akses ditolak saat mengelola ${context}. Pastikan akun kamu punya role admin di tabel profiles Supabase.`);
  }

  if (/bucket|storage|object/i.test(message)) {
    return new Error('Upload gambar gagal. Cek bucket `property-images` dan policy Storage Supabase untuk akun admin.');
  }

  if (/relation .*profiles.* does not exist|relation .*properties.* does not exist|relation .*rooms.* does not exist/i.test(message)) {
    return new Error('Tabel Supabase belum lengkap. Pastikan schema `profiles`, `properties`, dan `rooms` sudah dibuat di database.');
  }

  return new Error(message);
};

const normalizeAmenities = (amenities) => {
  if (!Array.isArray(amenities)) {
    return [];
  }

  return amenities.map((item) => item.trim()).filter(Boolean);
};

const getPublicUrl = (filePath) => {
  const { data } = supabase.storage.from(PROPERTY_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};

const uploadImageFile = async (file, folder) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from(PROPERTY_BUCKET)
    .upload(filePath, file, { upsert: false });

  if (error) {
    throw mapAdminError(error, 'gambar');
  }

  return getPublicUrl(filePath);
};

const uploadPropertyImages = async (imageFiles = [], imageUrls = []) => {
  const uploaded = await Promise.all(imageFiles.map(async (file, index) => {
    if (file instanceof File) {
      return uploadImageFile(file, 'properties');
    }

    if (typeof imageUrls[index] === 'string' && imageUrls[index].trim()) {
      return imageUrls[index].trim();
    }

    return null;
  }));

  return uploaded.filter(Boolean);
};

const uploadRoomImage = async (imageFile, imageUrl) => {
  if (imageFile instanceof File) {
    return uploadImageFile(imageFile, 'rooms');
  }

  return imageUrl?.trim() || null;
};

const normalizePropertyPayload = async (payload) => {
  const images = await uploadPropertyImages(payload.imageFiles, payload.imageUrls);

  if (images.length < 3) {
    throw new Error('Property harus memiliki minimal 3 gambar: 1 thumbnail dan 2 gambar pendukung.');
  }

  return {
    name: payload.name.trim(),
    location: payload.location.trim(),
    region: payload.location.trim(),
    price: Number(payload.price) || 0,
    image: images[0],
    images,
    description: payload.description?.trim() || null,
    amenities: normalizeAmenities(payload.amenities),
    is_active: Boolean(payload.is_active),
  };
};

const normalizeRoomPayload = async (room) => ({
  name: room.name.trim(),
  price: Number(room.price) || 0,
  image: await uploadRoomImage(room.imageFile, room.imageUrl),
  description: room.description?.trim() || null,
  amenities: normalizeAmenities(room.amenities),
  is_active: Boolean(room.is_active),
});

const syncRooms = async (propertyId, rooms = []) => {
  const normalizedRooms = await Promise.all(
    rooms.map(async (room) => ({
      id: room.id || null,
      ...(await normalizeRoomPayload(room)),
      property_id: propertyId,
    })),
  );

  const roomIdsToKeep = normalizedRooms.map((room) => room.id).filter(Boolean);

  const { data: existingRooms, error: existingRoomsError } = await supabase
    .from('rooms')
    .select('id')
    .eq('property_id', propertyId);

  if (existingRoomsError) {
    throw mapAdminError(existingRoomsError, 'tipe kamar');
  }

  const existingRoomIds = (existingRooms ?? []).map((room) => room.id);
  const roomIdsToDelete = existingRoomIds.filter((id) => !roomIdsToKeep.includes(id));

  if (roomIdsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('rooms')
      .delete()
      .in('id', roomIdsToDelete);

    if (deleteError) {
      throw mapAdminError(deleteError, 'tipe kamar');
    }
  }

  for (const room of normalizedRooms) {
    const payload = {
      property_id: room.property_id,
      name: room.name,
      price: room.price,
      image: room.image,
      description: room.description,
      amenities: room.amenities,
      is_active: room.is_active,
    };

    if (room.id) {
      const { error } = await supabase
        .from('rooms')
        .update(payload)
        .eq('id', room.id);

      if (error) {
        throw mapAdminError(error, 'tipe kamar');
      }
    } else {
      const { error } = await supabase
        .from('rooms')
        .insert(payload);

      if (error) {
        throw mapAdminError(error, 'tipe kamar');
      }
    }
  }
};

const mapPropertyRecord = (property) => ({
  ...property,
  amenities: Array.isArray(property.amenities) ? property.amenities : [],
  images: Array.isArray(property.images) && property.images.length > 0
    ? property.images
    : [property.image].filter(Boolean),
  rooms: Array.isArray(property.rooms)
    ? property.rooms.map((room) => ({
      ...room,
      amenities: Array.isArray(room.amenities) ? room.amenities : [],
    }))
    : [],
});

export const adminProperties = {
  list: async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('*, rooms(*)')
      .order('created_at', { ascending: false });

    if (error) throw mapAdminError(error);
    return (data ?? []).map(mapPropertyRecord);
  },

  create: async (payload) => {
    const propertyPayload = await normalizePropertyPayload(payload);
    const { data, error } = await supabase
      .from('properties')
      .insert(propertyPayload)
      .select('*, rooms(*)')
      .single();

    if (error) throw mapAdminError(error);

    await syncRooms(data.id, payload.rooms);

    const { data: refreshedProperty, error: refreshedError } = await supabase
      .from('properties')
      .select('*, rooms(*)')
      .eq('id', data.id)
      .single();

    if (refreshedError) throw mapAdminError(refreshedError);
    return mapPropertyRecord(refreshedProperty);
  },

  update: async (id, payload) => {
    const propertyPayload = await normalizePropertyPayload(payload);
    const { error } = await supabase
      .from('properties')
      .update(propertyPayload)
      .eq('id', id);

    if (error) throw mapAdminError(error);

    await syncRooms(id, payload.rooms);

    const { data, error: refreshedError } = await supabase
      .from('properties')
      .select('*, rooms(*)')
      .eq('id', id)
      .single();

    if (refreshedError) throw mapAdminError(refreshedError);
    return mapPropertyRecord(data);
  },

  remove: async (id) => {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw mapAdminError(error);
    return true;
  },
};
