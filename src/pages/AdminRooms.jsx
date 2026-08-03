import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminNavigation from '../components/AdminNavigation';
import Breadcrumbs from '../components/Breadcrumbs';
import ConfirmModal from '../components/ConfirmModal';
import NotificationModal from '../components/NotificationModal';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { adminRooms } from '../services/admin';
import { formatPrice, formatRupiahDisplay, parseRupiahValue } from '../utils/formatters';

const ITEMS_PER_PAGE = 10;

const EMPTY_FORM = {
  propertyId: '',
  name: '',
  price: '',
  inventoryCount: '1',
  maxGuests: '2',
  description: '',
  isActive: true,
};

function validate(form) {
  const errors = {};
  const price = Number(form.price);
  const inventoryCount = Number(form.inventoryCount);
  const maxGuests = Number(form.maxGuests);

  if (!form.propertyId) errors.propertyId = 'Properti wajib dipilih.';
  if (!form.name.trim()) errors.name = 'Nama kamar wajib diisi.';
  if (!String(form.price).trim() || !Number.isFinite(price) || price <= 0) errors.price = 'Harga harus lebih besar dari 0.';
  if (!Number.isInteger(inventoryCount) || inventoryCount < 1) errors.inventoryCount = 'Jumlah inventaris minimal 1.';
  if (!Number.isInteger(maxGuests) || maxGuests < 1) errors.maxGuests = 'Maksimal tamu minimal 1.';

  return errors;
}

const inputClass = 'min-h-11 rounded-xl border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:shadow-[0_0_0_3px_rgba(52,78,43,0.10)]';

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [totalRooms, setTotalRooms] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [propertyError, setPropertyError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: 'success', title: '', message: '' });

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await adminRooms.list({ page, limit: ITEMS_PER_PAGE });
      setRooms(result.data);
      setTotalRooms(result.total);
    } catch (loadError) {
      setError(loadError.message || 'Gagal memuat data kamar.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadProperties = useCallback(async () => {
    setPropertiesLoading(true);
    setPropertyError('');

    try {
      setProperties(await adminRooms.properties());
    } catch (loadError) {
      setPropertyError(loadError.message || 'Gagal memuat daftar properti.');
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return rooms;

    return rooms.filter((room) => [room.name, room.propertyName, room.propertyLocation]
      .some((value) => value?.toLowerCase().includes(query)));
  }, [rooms, search]);

  const errors = useMemo(() => validate(form), [form]);
  const totalPages = Math.ceil(totalRooms / ITEMS_PER_PAGE);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
    setForm(EMPTY_FORM);
    setTouched({});
  };

  const openCreate = () => {
    setEditingRoom(null);
    setForm(EMPTY_FORM);
    setTouched({});
    setIsModalOpen(true);
  };

  const openEdit = (room) => {
    setEditingRoom(room);
    setForm({
      propertyId: room.property_id ?? '',
      name: room.name ?? '',
      price: room.price ?? '',
      inventoryCount: String(room.inventoryCount ?? 1),
      maxGuests: String(room.maxGuests ?? 2),
      description: room.description ?? '',
      isActive: room.is_active ?? true,
    });
    setTouched({});
    setIsModalOpen(true);
  };

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleBlur = (field) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const fieldError = (field) => (touched[field] ? errors[field] : '');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isCreate = !editingRoom;
    const roomId = editingRoom?.id;
    const allTouched = Object.fromEntries(Object.keys(EMPTY_FORM).map((key) => [key, true]));

    setTouched(allTouched);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);

    try {
      if (isCreate) {
        await adminRooms.create(form);
      } else {
        await adminRooms.update(roomId, form);
      }

      closeModal();
      if (page === 1) {
        await loadRooms();
      } else {
        setPage(1);
      }
      setNotification({
        show: true,
        type: 'success',
        title: isCreate ? 'Kamar berhasil ditambahkan' : 'Kamar berhasil diperbarui',
        message: isCreate ? 'Data kamar baru sudah tersimpan.' : 'Perubahan data kamar sudah tersimpan.',
      });
    } catch (saveError) {
      setNotification({
        show: true,
        type: 'error',
        title: isCreate ? 'Gagal menambahkan kamar' : 'Gagal memperbarui kamar',
        message: saveError.message || 'Data kamar gagal disimpan.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    const room = confirmDelete;
    setDeleting(true);

    try {
      await adminRooms.remove(room.id);
      setConfirmDelete(null);
      if (rooms.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadRooms();
      }
      setNotification({
        show: true,
        type: 'success',
        title: 'Kamar dihapus',
        message: `Kamar “${room.name}” berhasil dihapus dari sistem.`,
      });
    } catch (deleteError) {
      setConfirmDelete(null);
      setNotification({
        show: true,
        type: 'error',
        title: 'Gagal menghapus kamar',
        message: deleteError.message || 'Kamar gagal dihapus.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const from = (page - 1) * ITEMS_PER_PAGE + 1;
    const to = Math.min(page * ITEMS_PER_PAGE, totalRooms);

    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-on-surface-variant">Menampilkan {from}-{to} dari {totalRooms} kamar</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            aria-label="Halaman sebelumnya"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_left</span>
          </Button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <Button
              key={pageNumber}
              type="button"
              variant={pageNumber === page ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setPage(pageNumber)}
              aria-label={`Halaman ${pageNumber}`}
              aria-current={pageNumber === page ? 'page' : undefined}
            >
              {pageNumber}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page === totalPages}
            aria-label="Halaman berikutnya"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <main className="page-shell py-8 text-left md:py-12">
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[
          { label: 'Beranda', href: '#/' },
          { label: 'Admin', href: '#/admin/rooms' },
          { label: 'Kamar' },
        ]} />

        <AdminNavigation current="rooms" />

        <header className="flex flex-col gap-4 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-level-1 md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <p className="font-label-md text-xs uppercase tracking-[0.18em] text-tertiary">Admin Console</p>
            <h1 className="mt-2 font-headline-xl-mobile text-primary md:text-[38px] md:leading-[46px]">Kelola Kamar</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Kelola data kamar, inventaris, harga, dan status dari seluruh properti yang terdaftar.
            </p>
          </div>
          <Button type="button" onClick={openCreate} className="min-h-12 shrink-0">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
            Tambah kamar
          </Button>
        </header>

        <Card className="p-5">
          <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-low px-4">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">search</span>
            <span className="sr-only">Cari kamar</span>
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Cari nama kamar, properti, atau lokasi"
              className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-outline"
            />
          </label>
        </Card>

        {error ? (
          <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-error/20 bg-error-container/60 p-4 text-sm text-on-error-container sm:flex-row sm:items-center sm:justify-between">
            <p>{error}</p>
            <Button variant="destructive" size="sm" onClick={loadRooms} disabled={loading} className="min-h-10 shrink-0">Coba lagi</Button>
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3" aria-label="Memuat data kamar">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-surface-container" />)}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container-low p-12 text-center">
            <span className="material-symbols-outlined text-[44px] text-outline" aria-hidden="true">bed</span>
            <h2 className="mt-3 text-lg font-bold text-on-surface">{search ? 'Kamar tidak ditemukan' : 'Belum ada kamar'}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{search ? 'Ubah kata kunci pencarian.' : 'Tambahkan kamar baru untuk mulai mengelola inventaris.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-outline-variant/30 bg-surface shadow-level-1">
            <table className="w-full min-w-[860px] text-left text-sm">
              <caption className="sr-only">Daftar kamar</caption>
              <thead className="border-b border-outline-variant/40 bg-surface-container-low text-xs uppercase tracking-[0.12em] text-on-surface-variant">
                <tr>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Nama kamar</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Properti</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Harga / malam</th>
                  <th scope="col" className="px-5 py-3.5 text-center font-semibold">Inventaris</th>
                  <th scope="col" className="px-5 py-3.5 text-center font-semibold">Maks. tamu</th>
                  <th scope="col" className="px-5 py-3.5 text-center font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filteredRooms.map((room) => (
                  <tr key={room.id} className="transition hover:bg-surface-container-low/60">
                    <th scope="row" className="px-5 py-4 font-semibold text-on-surface">{room.name}</th>
                    <td className="px-5 py-4">
                      <p className="font-medium text-on-surface">{room.propertyName}</p>
                      <p className="text-xs text-on-surface-variant">{room.propertyLocation || 'Lokasi belum tersedia'}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-on-surface">{formatPrice(room.price)}</td>
                    <td className="px-5 py-4 text-center text-on-surface">{room.inventoryCount}</td>
                    <td className="px-5 py-4 text-center text-on-surface">{room.maxGuests}</td>
                    <td className="px-5 py-4 text-center">
                      <Badge variant={room.is_active ? 'success' : 'secondary'}>{room.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(room)} className="min-h-10">
                          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">edit</span>
                          Edit
                        </Button>
                        <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDelete(room)} className="min-h-10">
                          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">delete</span>
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {renderPagination()}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101F0D]/50 px-4 py-8 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="room-form-title" className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-[1.5rem] border border-white/70 bg-surface shadow-[0_28px_90px_rgba(23,28,21,0.25)]">
            <div className="flex items-center justify-between border-b border-outline-variant/30 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-tertiary">Form kamar</p>
                <h2 id="room-form-title" className="mt-1 text-xl font-bold text-on-surface">{editingRoom ? 'Edit kamar' : 'Tambah kamar'}</h2>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={closeModal} disabled={saving} aria-label="Tutup form">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="grid max-h-[calc(90vh-73px)] gap-5 overflow-y-auto px-5 py-5">
              <label className="flex flex-col gap-1.5 text-sm text-on-surface">
                <span className="font-semibold">Properti <span className="text-error">*</span></span>
                <Select
                  value={form.propertyId}
                  onValueChange={(value) => handleChange('propertyId', value)}
                  disabled={propertiesLoading}
                >
                  <SelectTrigger className={inputClass} onBlur={() => handleBlur('propertyId')}>
                    <SelectValue placeholder={propertiesLoading ? 'Memuat properti...' : 'Pilih properti'} />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>{property.name} — {property.location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError('propertyId') ? <p className="text-xs text-error">{fieldError('propertyId')}</p> : null}
                {propertyError ? <p className="text-xs text-error">{propertyError}</p> : null}
                {!propertiesLoading && !propertyError && properties.length === 0 ? <p className="text-xs text-on-surface-variant">Belum ada properti yang bisa dipilih.</p> : null}
              </label>

              <label className="flex flex-col gap-1.5 text-sm text-on-surface">
                <span className="font-semibold">Nama kamar <span className="text-error">*</span></span>
                <input value={form.name} onChange={(event) => handleChange('name', event.target.value)} onBlur={() => handleBlur('name')} placeholder="Contoh: Deluxe Room" className={inputClass} />
                {fieldError('name') ? <p className="text-xs text-error">{fieldError('name')}</p> : null}
              </label>

              <div className="grid gap-5 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5 text-sm text-on-surface">
                  <span className="font-semibold">Harga / malam <span className="text-error">*</span></span>
                  <input type="text" inputMode="numeric" value={formatRupiahDisplay(form.price)} onChange={(event) => handleChange('price', parseRupiahValue(event.target.value))} onBlur={() => handleBlur('price')} placeholder="0" className={inputClass} />
                  {fieldError('price') ? <p className="text-xs text-error">{fieldError('price')}</p> : null}
                </label>
                <label className="flex flex-col gap-1.5 text-sm text-on-surface">
                  <span className="font-semibold">Inventaris <span className="text-error">*</span></span>
                  <input type="number" min="1" step="1" value={form.inventoryCount} onChange={(event) => handleChange('inventoryCount', event.target.value)} onBlur={() => handleBlur('inventoryCount')} className={inputClass} />
                  {fieldError('inventoryCount') ? <p className="text-xs text-error">{fieldError('inventoryCount')}</p> : null}
                </label>
                <label className="flex flex-col gap-1.5 text-sm text-on-surface">
                  <span className="font-semibold">Maks. tamu <span className="text-error">*</span></span>
                  <input type="number" min="1" step="1" value={form.maxGuests} onChange={(event) => handleChange('maxGuests', event.target.value)} onBlur={() => handleBlur('maxGuests')} className={inputClass} />
                  {fieldError('maxGuests') ? <p className="text-xs text-error">{fieldError('maxGuests')}</p> : null}
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-sm text-on-surface">
                <span className="font-semibold">Deskripsi</span>
                <textarea value={form.description} onChange={(event) => handleChange('description', event.target.value)} placeholder="Deskripsi singkat kamar (opsional)" rows="3" className={`${inputClass} resize-none py-2.5`} />
              </label>

              <div className="flex items-center justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-on-surface">Status kamar</p>
                  <p className="text-xs text-on-surface-variant">{form.isActive ? 'Kamar aktif dan dapat dipesan' : 'Kamar nonaktif, tidak tampil di pencarian'}</p>
                </div>
                <button type="button" role="switch" aria-checked={form.isActive} onClick={() => handleChange('isActive', !form.isActive)} className={`relative inline-flex h-11 w-16 shrink-0 items-center rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-surface-container-high'}`}>
                  <span className={`inline-block h-7 w-7 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex flex-col gap-2 border-t border-outline-variant/20 pt-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={closeModal} disabled={saving} className="min-h-11">Batal</Button>
                <Button type="submit" disabled={saving} className="min-h-11">{saving ? 'Menyimpan...' : editingRoom ? 'Simpan perubahan' : 'Tambah kamar'}</Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(confirmDelete)}
        title="Hapus kamar"
        message={`Yakin ingin menghapus kamar “${confirmDelete?.name}”? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, hapus"
        processing={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setConfirmDelete(null)}
      />

      <NotificationModal
        open={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ show: false, type: 'success', title: '', message: '' })}
      />
    </main>
  );
}
