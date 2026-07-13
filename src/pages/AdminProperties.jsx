import React, { useEffect, useMemo, useState } from 'react';
import { adminProperties } from '../services/admin';

const AMENITY_OPTIONS = [
  'Wi-Fi',
  'Kolam Renang',
  'Private Pool',
  'Ocean View',
  'Gym',
  'Spa',
  'Breakfast',
  'Parking',
  'AC',
  'Bathtub',
  'Balcony',
  'Restaurant',
];

const ROOM_AMENITY_OPTIONS = [
  'King Bed',
  'Queen Bed',
  'Twin Bed',
  'Smart TV',
  'Bathtub',
  'Balcony',
  'Ocean View',
  'Jacuzzi',
  'Workspace',
  'Mini Bar',
  'AC',
  'Breakfast',
];

const createEmptyRoom = () => ({
  id: null,
  name: '',
  price: '',
  imageFile: null,
  imageUrl: '',
  description: '',
  amenities: [],
  is_active: true,
});

const emptyForm = {
  name: '',
  location: '',
  price: '',
  imageFiles: [null, null, null],
  imageUrls: ['', '', ''],
  description: '',
  amenities: [],
  is_active: true,
  rooms: [createEmptyRoom()],
};

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price).replace('IDR', 'Rp');
}

function createFormFromProperty(property) {
  const propertyImages = Array.isArray(property.images) ? property.images : [property.image].filter(Boolean);
  const imageUrls = [propertyImages[0] ?? '', propertyImages[1] ?? '', propertyImages[2] ?? ''];

  return {
    name: property.name ?? '',
    location: property.location ?? '',
    price: property.price ?? '',
    imageFiles: [null, null, null],
    imageUrls,
    description: property.description ?? '',
    amenities: Array.isArray(property.amenities) ? property.amenities : [],
    is_active: property.is_active ?? true,
    rooms: Array.isArray(property.rooms) && property.rooms.length > 0
      ? property.rooms.map((room) => ({
        id: room.id ?? null,
        name: room.name ?? '',
        price: room.price ?? '',
        imageFile: null,
        imageUrl: room.image ?? '',
        description: room.description ?? '',
        amenities: Array.isArray(room.amenities) ? room.amenities : [],
        is_active: room.is_active ?? true,
      }))
      : [createEmptyRoom()],
  };
}

export default function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadProperties = async ({ preserveMessage = false } = {}) => {
    setLoading(true);
    if (!preserveMessage) {
      setMessage('');
    }

    try {
      const data = await adminProperties.list();
      setProperties(data);
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return properties;
    }

    return properties.filter((property) => (
      property.name.toLowerCase().includes(query)
      || property.location.toLowerCase().includes(query)
    ));
  }, [properties, search]);

  const openCreateModal = () => {
    setEditingProperty(null);
    setForm(emptyForm);
    setMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (property) => {
    setEditingProperty(property);
    setForm(createFormFromProperty(property));
    setMessage('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingProperty(null);
    setForm(emptyForm);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePropertyImageChange = (index, file) => {
    if (!file) return;

    setForm((prev) => {
      const nextFiles = [...prev.imageFiles];
      const nextUrls = [...prev.imageUrls];
      nextFiles[index] = file;
      nextUrls[index] = URL.createObjectURL(file);

      return { ...prev, imageFiles: nextFiles, imageUrls: nextUrls };
    });
  };

  const toggleAmenity = (amenity) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const updateRoom = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room, roomIndex) => (
        roomIndex === index ? { ...room, [field]: value } : room
      )),
    }));
  };

  const toggleRoomAmenity = (roomIndex, amenity) => {
    setForm((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room, index) => {
        if (index !== roomIndex) {
          return room;
        }

        return {
          ...room,
          amenities: room.amenities.includes(amenity)
            ? room.amenities.filter((item) => item !== amenity)
            : [...room.amenities, amenity],
        };
      }),
    }));
  };

  const handleRoomImageChange = (roomIndex, file) => {
    if (!file) return;

    setForm((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room, index) => (
        index === roomIndex
          ? { ...room, imageFile: file, imageUrl: URL.createObjectURL(file) }
          : room
      )),
    }));
  };

  const addRoom = () => {
    setForm((prev) => ({ ...prev, rooms: [...prev.rooms, createEmptyRoom()] }));
  };

  const removeRoom = (roomIndex) => {
    setForm((prev) => ({
      ...prev,
      rooms: prev.rooms.length === 1
        ? [createEmptyRoom()]
        : prev.rooms.filter((_, index) => index !== roomIndex),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const validRooms = form.rooms.filter((room) => (
        room.name.trim()
        || String(room.price).trim()
        || room.description.trim()
        || room.imageUrl.trim()
        || room.imageFile
      ));

      if (validRooms.length === 0) {
        throw new Error('Minimal tambahkan 1 tipe kamar untuk property ini.');
      }

      if (validRooms.some((room) => !room.name.trim() || !String(room.price).trim() || !room.imageUrl.trim() && !room.imageFile)) {
        throw new Error('Setiap tipe kamar wajib memiliki nama, harga, dan gambar.');
      }

      const payload = {
        ...form,
        rooms: validRooms,
      };

      if (editingProperty) {
        await adminProperties.update(editingProperty.id, payload);
        setMessage('Property berhasil diperbarui.');
      } else {
        await adminProperties.create(payload);
        setMessage('Property berhasil ditambahkan.');
      }

      setMessageType('success');
      setIsModalOpen(false);
      setEditingProperty(null);
      setForm(emptyForm);
      await loadProperties({ preserveMessage: true });
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (property) => {
    const confirmed = window.confirm(`Hapus property ${property.name} beserta semua tipe kamarnya?`);
    if (!confirmed) return;

    setMessage('');

    try {
      await adminProperties.remove(property.id);
      setProperties((prev) => prev.filter((item) => item.id !== property.id));
      setMessage('Property berhasil dihapus.');
      setMessageType('success');
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    }
  };

  return (
    <main className="page-shell py-8 text-left md:py-12">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-level-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-label-md text-xs uppercase tracking-[0.18em] text-tertiary">Admin Console</p>
            <h1 className="mt-2 font-headline-xl text-3xl font-bold text-primary">Manage Properties</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Kelola property, galeri 3 gambar, dan tipe kamar langsung dari dashboard admin.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary shadow-[0_16px_34px_rgba(52,78,43,0.22)] transition hover:-translate-y-0.5 hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-[20px]">add_business</span>
            Add Property
          </button>
        </div>

        <div className="rounded-3xl border border-outline-variant/30 bg-surface p-5 shadow-level-1">
          <div className="flex items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3">
            <span className="material-symbols-outlined text-primary">search</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau lokasi"
              className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-outline"
            />
          </div>
        </div>

        {message ? (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${
            messageType === 'error'
              ? 'border-error/20 bg-error-container/65 text-on-error-container'
              : 'border-primary/20 bg-primary-fixed/35 text-on-primary-fixed-variant'
          }`}>
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="py-20 text-center font-body-md text-on-surface-variant">Loading properties...</div>
        ) : filteredProperties.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container-low p-12 text-center">
            <span className="material-symbols-outlined text-[44px] text-outline">inventory_2</span>
            <h2 className="mt-3 text-lg font-bold text-on-surface">Belum ada property</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Tambahkan property baru atau ubah kata kunci pencarian.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredProperties.map((property) => (
              <article
                key={property.id}
                className="grid gap-5 overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-level-1 md:grid-cols-[240px_1fr]"
              >
                <div className="overflow-hidden rounded-2xl bg-surface-container-low aspect-[4/3]">
                  {property.image ? (
                    <img src={property.image} alt={property.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-outline">
                      <span className="material-symbols-outlined text-[40px]">image</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-on-surface">{property.name}</h2>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${property.is_active ? 'bg-primary-fixed/30 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                          {property.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-on-surface-variant">{property.location}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(property)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface px-4 text-xs font-semibold text-on-surface transition hover:border-primary/30 hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(property)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-error/25 bg-error-container/60 px-4 text-xs font-semibold text-on-error-container transition hover:bg-error-container"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-on-surface-variant md:grid-cols-4">
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-outline">Mulai dari</p>
                      <p className="mt-2 font-bold text-on-surface">{formatPrice(property.price)}</p>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-outline">Amenities</p>
                      <p className="mt-2 font-bold text-on-surface">{property.amenities?.length ?? 0} items</p>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-outline">Gallery</p>
                      <p className="mt-2 font-bold text-on-surface">{property.images?.length ?? 0} gambar</p>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-outline">Rooms</p>
                      <p className="mt-2 font-bold text-on-surface">{property.rooms?.length ?? 0} tipe kamar</p>
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-on-surface-variant">{property.description || 'Belum ada deskripsi property.'}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101F0D]/50 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-white/70 bg-surface shadow-[0_28px_90px_rgba(23,28,21,0.25)]">
            <div className="flex items-center justify-between border-b border-outline-variant/30 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-tertiary">Property Form</p>
                <h2 className="mt-1 text-xl font-bold text-on-surface">{editingProperty ? 'Edit Property' : 'Add Property'}</h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid max-h-[calc(90vh-73px)] gap-6 overflow-y-auto px-5 py-5">
              <section className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm text-on-surface">
                  <span className="font-semibold">Property Name</span>
                  <input value={form.name} onChange={(event) => handleChange('name', event.target.value)} required className="h-11 rounded-xl border border-outline-variant bg-surface px-3 text-sm outline-none focus:border-primary" />
                </label>

                <label className="flex flex-col gap-2 text-sm text-on-surface">
                  <span className="font-semibold">Location</span>
                  <input value={form.location} onChange={(event) => handleChange('location', event.target.value)} required className="h-11 rounded-xl border border-outline-variant bg-surface px-3 text-sm outline-none focus:border-primary" />
                </label>

                <label className="flex flex-col gap-2 text-sm text-on-surface">
                  <span className="font-semibold">Price per Night</span>
                  <input type="number" min="0" value={form.price} onChange={(event) => handleChange('price', event.target.value)} required className="h-11 rounded-xl border border-outline-variant bg-surface px-3 text-sm outline-none focus:border-primary" />
                </label>

                <label className="inline-flex items-center gap-3 rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-2 text-sm text-on-surface">
                  <input type="checkbox" checked={form.is_active} onChange={(event) => handleChange('is_active', event.target.checked)} className="rounded border-outline-variant text-primary focus:ring-primary" />
                  Property aktif dan tampil di halaman publik
                </label>

                <label className="md:col-span-2 flex flex-col gap-2 text-sm text-on-surface">
                  <span className="font-semibold">Description</span>
                  <textarea value={form.description} onChange={(event) => handleChange('description', event.target.value)} rows="4" className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </label>
              </section>

              <section className="grid gap-4 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-5">
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Galeri Property</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">Upload minimal 3 gambar. Gambar pertama akan dipakai sebagai thumbnail utama.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {form.imageUrls.map((imageUrl, index) => (
                    <div key={`property-image-${index}`} className="rounded-2xl border border-outline-variant/40 bg-surface p-4">
                      <label className="flex flex-col gap-2 text-sm text-on-surface">
                        <span className="font-semibold">{index === 0 ? 'Thumbnail' : `Gambar ${index + 1}`}</span>
                        <input type="file" accept="image/*" onChange={(event) => handlePropertyImageChange(index, event.target.files?.[0])} className="h-11 rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm outline-none file:mr-3 file:border-0 file:bg-transparent file:text-primary file:text-sm file:font-semibold" />
                      </label>
                      <div className="mt-3 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low aspect-[4/3]">
                        {imageUrl ? (
                          <img src={imageUrl} alt={`Preview property ${index + 1}`} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-outline">Belum ada gambar</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-4 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-5">
                <div className="flex flex-col gap-2 text-sm text-on-surface">
                  <span className="font-semibold">Amenities</span>
                  <div className="flex flex-wrap gap-2">
                    {AMENITY_OPTIONS.map((amenity) => (
                      <label key={amenity} className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 bg-surface-container-low px-3 py-2">
                        <input type="checkbox" checked={form.amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} className="rounded border-outline-variant text-primary focus:ring-primary" />
                        {amenity}
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-4 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">Tipe Kamar</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">Tambahkan tipe kamar yang nantinya akan dipakai saat booking.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addRoom}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary-fixed/20 px-4 text-sm font-semibold text-primary"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add Room Type
                  </button>
                </div>

                <div className="grid gap-4">
                  {form.rooms.map((room, roomIndex) => (
                    <article key={`${room.id ?? 'new'}-${roomIndex}`} className="grid gap-4 rounded-2xl border border-outline-variant/30 bg-surface p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-base font-bold text-on-surface">Room Type {roomIndex + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeRoom(roomIndex)}
                          className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-error/20 px-3 text-xs font-semibold text-error"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          Remove
                        </button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm text-on-surface">
                          <span className="font-semibold">Room Name</span>
                          <input value={room.name} onChange={(event) => updateRoom(roomIndex, 'name', event.target.value)} className="h-11 rounded-xl border border-outline-variant bg-surface px-3 text-sm outline-none focus:border-primary" />
                        </label>

                        <label className="flex flex-col gap-2 text-sm text-on-surface">
                          <span className="font-semibold">Price per Night</span>
                          <input type="number" min="0" value={room.price} onChange={(event) => updateRoom(roomIndex, 'price', event.target.value)} className="h-11 rounded-xl border border-outline-variant bg-surface px-3 text-sm outline-none focus:border-primary" />
                        </label>

                        <label className="flex flex-col gap-2 text-sm text-on-surface">
                          <span className="font-semibold">Room Image</span>
                          <input type="file" accept="image/*" onChange={(event) => handleRoomImageChange(roomIndex, event.target.files?.[0])} className="h-11 rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm outline-none file:mr-3 file:border-0 file:bg-transparent file:text-primary file:text-sm file:font-semibold" />
                        </label>

                        <label className="inline-flex items-center gap-3 rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-2 text-sm text-on-surface">
                          <input type="checkbox" checked={room.is_active} onChange={(event) => updateRoom(roomIndex, 'is_active', event.target.checked)} className="rounded border-outline-variant text-primary focus:ring-primary" />
                          Room type aktif
                        </label>

                        {room.imageUrl ? (
                          <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low aspect-[4/3] md:col-span-2">
                            <img src={room.imageUrl} alt={`Preview room ${roomIndex + 1}`} className="h-full w-full object-cover" />
                          </div>
                        ) : null}

                        <label className="md:col-span-2 flex flex-col gap-2 text-sm text-on-surface">
                          <span className="font-semibold">Room Description</span>
                          <textarea value={room.description} onChange={(event) => updateRoom(roomIndex, 'description', event.target.value)} rows="3" className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary" />
                        </label>
                      </div>

                      <div className="flex flex-col gap-2 text-sm text-on-surface">
                        <span className="font-semibold">Room Amenities</span>
                        <div className="flex flex-wrap gap-2">
                          {ROOM_AMENITY_OPTIONS.map((amenity) => (
                            <label key={`${roomIndex}-${amenity}`} className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 bg-surface-container-low px-3 py-2">
                              <input type="checkbox" checked={room.amenities.includes(amenity)} onChange={() => toggleRoomAmenity(roomIndex, amenity)} className="rounded border-outline-variant text-primary focus:ring-primary" />
                              {amenity}
                            </label>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
                Rating property dihitung otomatis dari ulasan pengguna, bukan diinput admin.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="inline-flex h-12 items-center justify-center rounded-2xl border border-outline-variant px-5 text-sm font-semibold text-on-surface">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-70">
                  {saving ? 'Saving...' : editingProperty ? 'Save Changes' : 'Create Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
