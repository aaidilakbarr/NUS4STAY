import React, { useEffect, useMemo, useState } from 'react';
import AdminNavigation from '../components/AdminNavigation';
import Breadcrumbs from '../components/Breadcrumbs';
import ConfirmModal from '../components/ConfirmModal';
import NotificationModal from '../components/NotificationModal';
import { adminProperties } from '../services/admin';
import { formatPrice, formatRupiahDisplay, parseRupiahValue } from '../utils/formatters';

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

const ITEMS_PER_PAGE = 10;

const createEmptyRoom = () => ({
  id: null,
  name: '',
  price: '',
  imageFiles: [null, null, null],
  imageUrls: ['', '', ''],
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
      ? property.rooms.map((room) => {
        const roomImages = Array.isArray(room.images) ? room.images : [room.image].filter(Boolean);
        const imageUrls = [roomImages[0] ?? '', roomImages[1] ?? '', roomImages[2] ?? ''];
        return {
          id: room.id ?? null,
          name: room.name ?? '',
          price: room.price ?? '',
          imageFiles: [null, null, null],
          imageUrls,
          description: room.description ?? '',
          amenities: Array.isArray(room.amenities) ? room.amenities : [],
          is_active: room.is_active ?? true,
        };
      })
      : [createEmptyRoom()],
  };
}

export default function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [totalProperties, setTotalProperties] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [currentStep, setCurrentStep] = useState(1);
  const [notification, setNotification] = useState({ show: false, type: 'success', title: '', message: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [touched, setTouched] = useState({});

  const loadProperties = async ({ preserveMessage = false } = {}) => {
    setLoading(true);
    if (!preserveMessage) {
      setMessage('');
    }

    try {
      const result = await adminProperties.list({ page, limit: ITEMS_PER_PAGE });
      setProperties(result.data);
      setTotalProperties(result.total);
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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

  const totalPages = Math.ceil(totalProperties / ITEMS_PER_PAGE);

  const openCreateModal = () => {
    setEditingProperty(null);
    setForm(emptyForm);
    setCurrentStep(1);
    setMessage('');
    setTouched({});
    setIsModalOpen(true);
  };

  const openEditModal = (property) => {
    setEditingProperty(property);
    setForm(createFormFromProperty(property));
    setCurrentStep(1);
    setMessage('');
    setTouched({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingProperty(null);
    setForm(emptyForm);
    setTouched({});
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field) => {
    if (!touched[field]) return '';
    const value = form[field];

    switch (field) {
      case 'name':
        return !value?.trim() ? 'Nama properti wajib diisi.' : '';
      case 'location':
        return !value?.trim() ? 'Lokasi wajib diisi.' : '';
      case 'price':
        return !value?.trim() ? 'Harga wajib diisi.' : '';
      default:
        return '';
    }
  };

  const getRoomError = (roomIndex, field) => {
    const room = form.rooms[roomIndex];
    if (!room || !touched[`room_${roomIndex}_${field}`]) return '';

    switch (field) {
      case 'name':
        return !room.name?.trim() ? 'Nama kamar wajib diisi.' : '';
      case 'price':
        return !String(room.price)?.trim() ? 'Harga kamar wajib diisi.' : '';
      default:
        return '';
    }
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

  const handleRoomImageChange = (roomIndex, imageIndex, file) => {
    if (!file) return;

    setForm((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room, index) => {
        if (index !== roomIndex) {
          return room;
        }

        const nextFiles = [...room.imageFiles];
        const nextUrls = [...room.imageUrls];
        nextFiles[imageIndex] = file;
        nextUrls[imageIndex] = URL.createObjectURL(file);

        return { ...room, imageFiles: nextFiles, imageUrls: nextUrls };
      }),
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
        || room.imageUrls.some((url) => url.trim())
        || room.imageFiles.some((file) => file)
      ));

      if (validRooms.length === 0) {
        throw new Error('Minimal tambahkan 1 tipe kamar untuk properti ini.');
      }

      if (validRooms.some((room) => (
        !room.name.trim()
        || !String(room.price).trim()
        || (!room.imageUrls.some((url) => url.trim()) && !room.imageFiles.some((file) => file))
      ))) {
        throw new Error('Setiap tipe kamar wajib memiliki nama, harga, dan minimal 1 gambar.');
      }

      const payload = {
        ...form,
        rooms: validRooms,
      };

      const isCreate = !editingProperty;

      if (isCreate) {
        await adminProperties.create(payload);
      } else {
        await adminProperties.update(editingProperty.id, payload);
      }

      setIsModalOpen(false);
      setEditingProperty(null);
      setForm(emptyForm);
      setPage(1);
      await loadProperties();

      setNotification({
        show: true,
        type: 'success',
        title: isCreate ? 'Properti Berhasil Ditambahkan' : 'Perubahan Berhasil',
        message: isCreate
          ? 'Properti baru beserta tipe kamar telah berhasil disimpan dan siap dikelola.'
          : 'Perubahan pada properti telah berhasil disimpan.',
      });
    } catch (error) {
      const wasEditing = editingProperty;

      setIsModalOpen(false);
      setEditingProperty(null);
      setForm(emptyForm);
      setPage(1);
      await loadProperties();

      setNotification({
        show: true,
        type: 'error',
        title: wasEditing ? 'Perubahan Gagal' : 'Properti Gagal Ditambahkan',
        message: error.message || 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (property) => {
    setMessage('');

    try {
      await adminProperties.remove(property.id);
      setConfirmDelete(null);
      await loadProperties();
      setMessage('Properti berhasil dihapus.');
      setMessageType('success');
    } catch (error) {
      setConfirmDelete(null);
      setMessage(error.message);
      setMessageType('error');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const from = (page - 1) * ITEMS_PER_PAGE + 1;
    const to = Math.min(page * ITEMS_PER_PAGE, totalProperties);

    return (
      <div className="flex items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
        <span className="text-xs text-on-surface-variant">
          Menampilkan {from}-{to} dari {totalProperties} properti
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm text-on-surface-variant transition hover:bg-surface hover:text-primary disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => handlePageChange(pageNum)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                pageNum === page
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface hover:text-primary'
              }`}
            >
              {pageNum}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm text-on-surface-variant transition hover:bg-surface hover:text-primary disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className="page-shell py-8 text-left md:py-12">
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[
          { label: 'Beranda', href: '#/' },
          { label: 'Admin', href: '#/admin/properties' },
          { label: 'Properti' },
        ]} />

        <AdminNavigation current="properties" />

        <div className="flex flex-col gap-4 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-level-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-label-md text-xs uppercase tracking-[0.18em] text-tertiary">Admin Console</p>
            <h1 className="mt-2 font-headline-xl text-3xl font-bold text-primary">Kelola Properti</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Kelola detail properti, tipe kamar beserta galeri gambar, dan atur status publikasi (publik atau pribadi) langsung dari dashboard admin.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary shadow-[0_16px_34px_rgba(52,78,43,0.22)] transition hover:-translate-y-0.5 hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-[20px]">add_business</span>
            Tambah Properti
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
          <div className="py-20 text-center font-body-md text-on-surface-variant">Memuat data properti...</div>
        ) : filteredProperties.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container-low p-12 text-center">
            <span className="material-symbols-outlined text-[44px] text-outline">inventory_2</span>
            <h2 className="mt-3 text-lg font-bold text-on-surface">Belum ada properti</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Tambahkan properti baru atau ubah kata kunci pencarian.</p>
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
                          {property.is_active ? 'Aktif' : 'Nonaktif'}
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
                        onClick={() => setConfirmDelete(property)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-error/25 bg-error-container/60 px-4 text-xs font-semibold text-on-error-container transition hover:bg-error-container"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Hapus
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-on-surface-variant md:grid-cols-4">
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-outline">Mulai dari</p>
                      <p className="mt-2 font-bold text-on-surface">{formatPrice(property.price)}</p>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-outline">Fasilitas</p>
                      <p className="mt-2 font-bold text-on-surface">{property.amenities?.length ?? 0} item</p>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-outline">Galeri</p>
                      <p className="mt-2 font-bold text-on-surface">{property.images?.length ?? 0} gambar</p>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-outline">Kamar</p>
                      <p className="mt-2 font-bold text-on-surface">{property.rooms?.length ?? 0} tipe kamar</p>
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-on-surface-variant">{property.description || 'Belum ada deskripsi properti.'}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        {renderPagination()}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101F0D]/50 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-white/70 bg-surface shadow-[0_28px_90px_rgba(23,28,21,0.25)]">
            <div className="flex items-center justify-between border-b border-outline-variant/30 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-tertiary">Form Properti</p>
                <h2 className="mt-1 text-xl font-bold text-on-surface">{editingProperty ? 'Edit Properti' : 'Tambah Properti'}</h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid max-h-[calc(90vh-73px)] overflow-y-auto px-5 py-5">
              <div className="mb-6 flex items-center justify-center gap-0">
                {[1, 2, 3].map((s) => (
                  <React.Fragment key={`step-indicator-${s}`}>
                    {s > 1 ? (
                      <div className={`mx-2 mb-6 h-px w-16 self-end transition-colors duration-300 ${currentStep >= s ? 'bg-primary' : 'bg-outline-variant'}`} />
                    ) : null}
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(s)}
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                          currentStep === s
                            ? 'bg-primary text-on-primary shadow-[0_4px_14px_rgba(52,78,43,0.35)] scale-110'
                            : currentStep > s
                            ? 'bg-primary text-on-primary'
                            : 'border-2 border-outline-variant bg-surface-container-low text-on-surface-variant'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">{s === 1 ? 'home' : s === 2 ? 'bed' : 'verified'}</span>
                      </button>
                      <span className={`text-[11px] font-semibold leading-tight transition-colors duration-300 ${currentStep === s ? 'text-primary' : 'text-outline'}`}>
                        {s === 1 ? 'Properti' : s === 2 ? 'Kamar' : 'Verifikasi'}
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {currentStep === 1 ? (
                <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-level-1">
                  <section className="grid gap-6">
                    <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">1</span>
                      <div>
                        <h3 className="text-lg font-bold text-on-surface">Properti</h3>
                        <p className="text-sm text-on-surface-variant">Lengkapi informasi utama properti.</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="flex flex-col gap-1.5 text-sm text-on-surface">
                        <span className="font-semibold">Nama Properti <span className="text-error">*</span></span>
                        <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface px-3 transition focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(52,78,43,0.10)]">
                          <span className="material-symbols-outlined text-[18px] text-outline">store</span>
                          <input value={form.name} onChange={(event) => handleChange('name', event.target.value)} onBlur={() => handleBlur('name')} required placeholder="cth. Villa Bukit Indah" className="h-11 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-outline" />
                        </div>
                        {getFieldError('name') ? (
                          <p className="text-xs text-error">{getFieldError('name')}</p>
                        ) : null}
                      </label>

                      <label className="flex flex-col gap-1.5 text-sm text-on-surface">
                        <span className="font-semibold">Lokasi <span className="text-error">*</span></span>
                        <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface px-3 transition focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(52,78,43,0.10)]">
                          <span className="material-symbols-outlined text-[18px] text-outline">location_on</span>
                          <input value={form.location} onChange={(event) => handleChange('location', event.target.value)} onBlur={() => handleBlur('location')} required placeholder="cth. Ubud, Bali" className="h-11 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-outline" />
                        </div>
                        {getFieldError('location') ? (
                          <p className="text-xs text-error">{getFieldError('location')}</p>
                        ) : null}
                      </label>

                      <label className="flex flex-col gap-1.5 text-sm text-on-surface">
                        <span className="font-semibold">Harga per Malam <span className="text-error">*</span></span>
                        <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface px-3 transition focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(52,78,43,0.10)]">
                          <span className="material-symbols-outlined text-[18px] text-outline">payments</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatRupiahDisplay(form.price)}
                            onChange={(event) => handleChange('price', parseRupiahValue(event.target.value))}
                            onBlur={() => handleBlur('price')}
                            required
                            placeholder="0"
                            className="h-11 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-outline"
                          />
                        </div>
                        {getFieldError('price') ? (
                          <p className="text-xs text-error">{getFieldError('price')}</p>
                        ) : null}
                      </label>

                      <label className="md:col-span-2 flex flex-col gap-1.5 text-sm text-on-surface">
                        <span className="font-semibold">Deskripsi</span>
                        <textarea value={form.description} onChange={(event) => handleChange('description', event.target.value)} placeholder="Deskripsikan properti secara detail..." rows="3" className="h-24 rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:shadow-[0_0_0_3px_rgba(52,78,43,0.10)] resize-none" />
                        <span className="text-xs text-outline text-right">{form.description.length}/500</span>
                      </label>
                    </div>

                    <div className="border-t border-outline-variant/20 pt-5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-primary">photo_library</span>
                        <h4 className="text-base font-bold text-on-surface">Galeri Properti</h4>
                      </div>
                      <p className="mt-1 text-sm text-on-surface-variant">Upload minimal 3 gambar. Gambar pertama akan dipakai sebagai thumbnail utama.</p>
                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        {form.imageUrls.map((imageUrl, index) => (
                          <div key={`property-image-${index}`} className="group rounded-2xl border-2 border-dashed border-outline-variant/40 bg-surface p-4 transition hover:border-primary/40">
                            <label className="flex cursor-pointer flex-col gap-2 text-sm text-on-surface">
                              <span className="font-semibold">{index === 0 ? 'Thumbnail' : `Gambar ${index + 1}`}</span>
                              <input type="file" accept="image/*" onChange={(event) => handlePropertyImageChange(index, event.target.files?.[0])} className="h-11 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm outline-none file:mr-3 file:border-0 file:bg-transparent file:text-primary file:text-sm file:font-semibold" />
                            </label>
                            <div className="mt-3 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low aspect-[4/3]">
                              {imageUrl ? (
                                <img src={imageUrl} alt={`Preview properti ${index + 1}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                              ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-2 text-outline">
                                  <span className="material-symbols-outlined text-[32px]">add_photo_alternate</span>
                                  <span className="text-xs">Belum ada gambar</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-outline-variant/20 pt-5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-primary">checklist</span>
                        <h4 className="text-base font-bold text-on-surface">Fasilitas</h4>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {AMENITY_OPTIONS.map((amenity) => (
                          <label key={amenity} className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition ${
                            form.amenities.includes(amenity)
                              ? 'border-primary bg-primary-fixed/20 text-primary'
                              : 'border-outline-variant/50 bg-surface-container-low text-on-surface-variant hover:border-outline-variant'
                          }`}>
                            <input type="checkbox" checked={form.amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} className="sr-only" />
                            <span className={`material-symbols-outlined text-[16px] ${form.amenities.includes(amenity) ? 'text-primary' : 'text-outline'}`}>
                              {form.amenities.includes(amenity) ? 'check_circle' : 'add_circle_outline'}
                            </span>
                            {amenity}
                          </label>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              ) : currentStep === 2 ? (
                <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-level-1">
                  <section className="grid gap-4">
                    <div className="flex flex-col gap-3 border-b border-outline-variant/20 pb-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">2</span>
                        <div>
                          <h3 className="text-lg font-bold text-on-surface">Kamar</h3>
                          <p className="text-sm text-on-surface-variant">Tambahkan tipe kamar yang nantinya akan dipakai saat booking.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={addRoom}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary-fixed/20 px-4 text-sm font-semibold text-primary transition hover:bg-primary/10"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Tambah Tipe Kamar
                      </button>
                    </div>

                    <div className="grid gap-4">
                      {form.rooms.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-outline-variant/30 bg-surface-container-low p-12 text-center">
                          <span className="material-symbols-outlined text-[48px] text-outline">meeting_room</span>
                          <div>
                            <p className="font-semibold text-on-surface">Belum ada tipe kamar</p>
                            <p className="mt-1 text-sm text-on-surface-variant">Klik "Tambah Tipe Kamar" untuk menambahkan kamar.</p>
                          </div>
                        </div>
                      ) : (
                        form.rooms.map((room, roomIndex) => (
                          <article key={`${room.id ?? 'new'}-${roomIndex}`} className="grid gap-5 rounded-2xl border border-outline-variant/30 bg-surface p-5 transition hover:border-outline-variant/60">
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="flex items-center gap-2 text-base font-bold text-on-surface">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-fixed/20 text-xs font-bold text-primary">{roomIndex + 1}</span>
                                Tipe Kamar {roomIndex + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeRoom(roomIndex)}
                                className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-error/20 px-3 text-xs font-semibold text-error transition hover:bg-error-container/50"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                Hapus
                              </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <label className="flex flex-col gap-1.5 text-sm text-on-surface">
                                <span className="font-semibold">Nama Kamar</span>
                                <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface px-3 transition focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(52,78,43,0.10)]">
                                  <span className="material-symbols-outlined text-[18px] text-outline">door_front</span>
                                  <input value={room.name} onChange={(event) => updateRoom(roomIndex, 'name', event.target.value)} onBlur={() => setTouched((prev) => ({ ...prev, [`room_${roomIndex}_name`]: true }))} placeholder="cth. Deluxe Room" className="h-11 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-outline" />
                                </div>
                                {getRoomError(roomIndex, 'name') ? (
                                  <p className="text-xs text-error">{getRoomError(roomIndex, 'name')}</p>
                                ) : null}
                              </label>

                              <label className="flex flex-col gap-1.5 text-sm text-on-surface">
                                <span className="font-semibold">Harga per Malam</span>
                                <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface px-3 transition focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(52,78,43,0.10)]">
                                  <span className="material-symbols-outlined text-[18px] text-outline">payments</span>
                                  <input type="text" inputMode="numeric" value={formatRupiahDisplay(room.price)} onChange={(event) => updateRoom(roomIndex, 'price', parseRupiahValue(event.target.value))} onBlur={() => setTouched((prev) => ({ ...prev, [`room_${roomIndex}_price`]: true }))} placeholder="0" className="h-11 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-outline" />
                                </div>
                                {getRoomError(roomIndex, 'price') ? (
                                  <p className="text-xs text-error">{getRoomError(roomIndex, 'price')}</p>
                                ) : null}
                              </label>

                              <label className="inline-flex items-center gap-3 rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-3 text-sm text-on-surface md:col-span-2">
                                <div className="relative">
                                  <input type="checkbox" checked={room.is_active} onChange={(event) => updateRoom(roomIndex, 'is_active', event.target.checked)} className="peer sr-only" />
                                  <div className="h-5 w-9 rounded-full bg-outline-variant transition peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4" />
                                </div>
                                <span>Tipe kamar aktif dan bisa dipesan</span>
                              </label>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-primary">photo_camera</span>
                                <span className="text-sm font-semibold text-on-surface">Gambar Kamar</span>
                              </div>
                              <p className="mt-0.5 text-xs text-on-surface-variant">Upload 3 gambar kamar. Gambar pertama menjadi thumbnail kamar.</p>
                              <div className="mt-3 grid gap-4 md:grid-cols-3">
                                {room.imageUrls.map((imageUrl, imageIndex) => (
                                  <div key={`room-${roomIndex}-image-${imageIndex}`} className="group rounded-2xl border-2 border-dashed border-outline-variant/40 bg-surface-container-low p-3 transition hover:border-primary/40">
                                    <label className="flex cursor-pointer flex-col gap-2 text-sm text-on-surface">
                                      <span className="font-semibold">{imageIndex === 0 ? 'Thumbnail' : `Gambar ${imageIndex + 1}`}</span>
                                      <input type="file" accept="image/*" onChange={(event) => handleRoomImageChange(roomIndex, imageIndex, event.target.files?.[0])} className="h-10 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm outline-none file:mr-2 file:border-0 file:bg-transparent file:text-primary file:text-xs file:font-semibold" />
                                    </label>
                                    <div className="mt-2 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low aspect-[4/3]">
                                      {imageUrl ? (
                                        <img src={imageUrl} alt={`Preview kamar ${roomIndex + 1} gambar ${imageIndex + 1}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                      ) : (
                                        <div className="flex h-full flex-col items-center justify-center gap-1 text-outline">
                                          <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
                                          <span className="text-[11px]">Belum ada gambar</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <label className="flex flex-col gap-1.5 text-sm text-on-surface">
                              <span className="font-semibold">Deskripsi Kamar</span>
                              <textarea value={room.description} onChange={(event) => updateRoom(roomIndex, 'description', event.target.value)} placeholder="Deskripsikan tipe kamar ini..." rows="2" className="h-20 rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:shadow-[0_0_0_3px_rgba(52,78,43,0.10)] resize-none" />
                            </label>

                            <div className="flex flex-col gap-2 text-sm text-on-surface">
                              <span className="font-semibold">Fasilitas Kamar</span>
                              <div className="flex flex-wrap gap-2">
                                {ROOM_AMENITY_OPTIONS.map((amenity) => (
                                  <label key={`${roomIndex}-${amenity}`} className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition ${
                                    room.amenities.includes(amenity)
                                      ? 'border-primary bg-primary-fixed/20 text-primary'
                                      : 'border-outline-variant/50 bg-surface-container-low text-on-surface-variant hover:border-outline-variant'
                                  }`}>
                                    <input type="checkbox" checked={room.amenities.includes(amenity)} onChange={() => toggleRoomAmenity(roomIndex, amenity)} className="sr-only" />
                                    <span className={`material-symbols-outlined text-[16px] ${room.amenities.includes(amenity) ? 'text-primary' : 'text-outline'}`}>
                                      {room.amenities.includes(amenity) ? 'check_circle' : 'add_circle_outline'}
                                    </span>
                                    {amenity}
                                  </label>
                                ))}
                              </div>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-level-1">
                  <section className="grid gap-6">
                    <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">3</span>
                      <div>
                        <h3 className="text-lg font-bold text-on-surface">Verifikasi</h3>
                        <p className="text-sm text-on-surface-variant">Atur visibilitas properti di halaman publik.</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 transition-all ${
                        form.is_active
                          ? 'border-primary bg-primary-fixed/10 shadow-[0_0_0_3px_rgba(52,78,43,0.12)]'
                          : 'border-outline-variant/30 bg-surface hover:border-outline-variant/60'
                      }`}>
                        <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                          form.is_active ? 'border-primary bg-primary' : 'border-outline-variant'
                        }`}>
                          {form.is_active ? <div className="h-2 w-2 rounded-full bg-white" /> : null}
                        </div>
                        <input type="radio" name="property-visibility" checked={form.is_active} onChange={() => handleChange('is_active', true)} className="sr-only" />
                        <div className="grid gap-2">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[22px] text-primary">public</span>
                            <span className="font-semibold text-on-surface">Publik</span>
                          </div>
                          <p className="text-sm leading-5 text-on-surface-variant">Properti langsung tampil di halaman publik dan bisa dilihat semua pengguna.</p>
                        </div>
                      </label>

                      <label className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 transition-all ${
                        !form.is_active
                          ? 'border-tertiary bg-surface-container-low shadow-[0_0_0_3px_rgba(96,96,96,0.12)]'
                          : 'border-outline-variant/30 bg-surface hover:border-outline-variant/60'
                      }`}>
                        <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                          !form.is_active ? 'border-tertiary bg-tertiary' : 'border-outline-variant'
                        }`}>
                          {!form.is_active ? <div className="h-2 w-2 rounded-full bg-white" /> : null}
                        </div>
                        <input type="radio" name="property-visibility" checked={!form.is_active} onChange={() => handleChange('is_active', false)} className="sr-only" />
                        <div className="grid gap-2">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[22px] text-on-surface-variant">lock</span>
                            <span className="font-semibold text-on-surface">Pribadi</span>
                          </div>
                          <p className="text-sm leading-5 text-on-surface-variant">Properti disembunyikan dari halaman publik dan hanya dapat diakses dari dashboard admin.</p>
                        </div>
                      </label>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px] text-outline">info</span>
                      <p>Rating properti dihitung otomatis dari ulasan pengguna, bukan diinput admin.</p>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-outline-variant/20 pt-5">
                      <button type="button" onClick={() => setCurrentStep(2)} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-outline-variant px-5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Kembali
                      </button>
                      <button type="submit" disabled={saving} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-semibold text-on-primary shadow-[0_8px_24px_rgba(52,78,43,0.25)] transition hover:-translate-y-0.5 hover:bg-primary-container disabled:opacity-60 disabled:hover:translate-y-0">
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                        {saving ? 'Menyimpan...' : editingProperty ? 'Simpan Perubahan' : 'Buat Properti'}
                      </button>
                    </div>
                  </section>
                </div>
              )}

              {currentStep < 3 ? (
                <div className="flex items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low px-5 py-4">
                  <button type="button" onClick={closeModal} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface px-4 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-low">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    Batal
                  </button>
                  <div className="flex gap-3">
                    {currentStep > 1 ? (
                      <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface px-4 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Kembali
                      </button>
                    ) : null}
                    <button type="button" onClick={() => setCurrentStep(currentStep + 1)} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-on-primary shadow-[0_8px_20px_rgba(52,78,43,0.22)] transition hover:-translate-y-0.5 hover:bg-primary-container">
                      Lanjut
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={confirmDelete !== null}
        title="Hapus Properti?"
        message={confirmDelete ? `Hapus ${confirmDelete.name} beserta semua tipe kamarnya? Tindakan ini tidak dapat dibatalkan.` : ''}
        confirmLabel="Ya, hapus"
        cancelLabel="Batal"
        confirmVariant="danger"
        icon="delete"
        processing={false}
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      <NotificationModal
        open={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, show: false })}
      />
    </main>
  );
}
