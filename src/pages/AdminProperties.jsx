import React, { useEffect, useMemo, useState } from 'react';
import { adminProperties } from '../services/admin';

const emptyForm = {
  name: '',
  location: '',
  region: '',
  price: '',
  rating: '0',
  image: '',
  description: '',
  amenities: '',
  is_active: true,
};

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price).replace('IDR', 'Rp');
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

  const loadProperties = async () => {
    setLoading(true);
    setMessage('');

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
      || property.region.toLowerCase().includes(query)
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
    setForm({
      name: property.name ?? '',
      location: property.location ?? '',
      region: property.region ?? '',
      price: property.price ?? '',
      rating: property.rating ?? '0',
      image: property.image ?? '',
      description: property.description ?? '',
      amenities: Array.isArray(property.amenities) ? property.amenities.join(', ') : '',
      is_active: property.is_active ?? true,
    });
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      if (editingProperty) {
        await adminProperties.update(editingProperty.id, form);
        setMessage('Property berhasil diperbarui.');
      } else {
        await adminProperties.create(form);
        setMessage('Property berhasil ditambahkan.');
      }

      setMessageType('success');
      closeModal();
      await loadProperties();
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (property) => {
    const confirmed = window.confirm(`Hapus property ${property.name}?`);
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
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12 text-left">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-level-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-label-md text-xs uppercase tracking-[0.18em] text-tertiary">Admin Console</p>
            <h1 className="mt-2 font-headline-xl text-3xl font-bold text-primary">Manage Properties</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">Tambah, edit, dan hapus properti langsung dari database Supabase.</p>
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
              placeholder="Cari nama, lokasi, atau region"
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
                      <p className="mt-1 text-sm text-on-surface-variant">{property.location} · {property.region}</p>
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

                  <div className="grid gap-3 text-sm text-on-surface-variant md:grid-cols-3">
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-outline">Price</p>
                      <p className="mt-2 font-bold text-on-surface">{formatPrice(property.price)}</p>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-outline">Rating</p>
                      <p className="mt-2 font-bold text-on-surface">{property.rating}</p>
                    </div>
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-outline">Amenities</p>
                      <p className="mt-2 font-bold text-on-surface">{property.amenities?.length ?? 0} items</p>
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
          <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/70 bg-surface shadow-[0_28px_90px_rgba(23,28,21,0.25)]">
            <div className="flex items-center justify-between border-b border-outline-variant/30 px-6 py-5">
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

            <form onSubmit={handleSubmit} className="grid gap-5 px-6 py-6 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-on-surface">
                <span className="font-semibold">Property Name</span>
                <input value={form.name} onChange={(event) => handleChange('name', event.target.value)} required className="h-12 rounded-2xl border border-outline-variant bg-surface px-4 outline-none focus:border-primary" />
              </label>

              <label className="flex flex-col gap-2 text-sm text-on-surface">
                <span className="font-semibold">Location</span>
                <input value={form.location} onChange={(event) => handleChange('location', event.target.value)} required className="h-12 rounded-2xl border border-outline-variant bg-surface px-4 outline-none focus:border-primary" />
              </label>

              <label className="flex flex-col gap-2 text-sm text-on-surface">
                <span className="font-semibold">Region</span>
                <input value={form.region} onChange={(event) => handleChange('region', event.target.value)} required className="h-12 rounded-2xl border border-outline-variant bg-surface px-4 outline-none focus:border-primary" />
              </label>

              <label className="flex flex-col gap-2 text-sm text-on-surface">
                <span className="font-semibold">Price per Night</span>
                <input type="number" min="0" value={form.price} onChange={(event) => handleChange('price', event.target.value)} required className="h-12 rounded-2xl border border-outline-variant bg-surface px-4 outline-none focus:border-primary" />
              </label>

              <label className="flex flex-col gap-2 text-sm text-on-surface">
                <span className="font-semibold">Rating</span>
                <input type="number" min="0" max="5" step="0.01" value={form.rating} onChange={(event) => handleChange('rating', event.target.value)} required className="h-12 rounded-2xl border border-outline-variant bg-surface px-4 outline-none focus:border-primary" />
              </label>

              <label className="flex flex-col gap-2 text-sm text-on-surface">
                <span className="font-semibold">Image URL</span>
                <input value={form.image} onChange={(event) => handleChange('image', event.target.value)} className="h-12 rounded-2xl border border-outline-variant bg-surface px-4 outline-none focus:border-primary" />
              </label>

              <label className="md:col-span-2 flex flex-col gap-2 text-sm text-on-surface">
                <span className="font-semibold">Amenities</span>
                <input value={form.amenities} onChange={(event) => handleChange('amenities', event.target.value)} placeholder="Pisahkan dengan koma" className="h-12 rounded-2xl border border-outline-variant bg-surface px-4 outline-none focus:border-primary" />
              </label>

              <label className="md:col-span-2 flex flex-col gap-2 text-sm text-on-surface">
                <span className="font-semibold">Description</span>
                <textarea value={form.description} onChange={(event) => handleChange('description', event.target.value)} rows="5" className="rounded-2xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary" />
              </label>

              <label className="md:col-span-2 inline-flex items-center gap-3 rounded-2xl border border-outline-variant/50 bg-surface-container-low px-4 py-3 text-sm text-on-surface">
                <input type="checkbox" checked={form.is_active} onChange={(event) => handleChange('is_active', event.target.checked)} className="rounded border-outline-variant text-primary focus:ring-primary" />
                Property aktif dan tampil di halaman publik
              </label>

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
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
