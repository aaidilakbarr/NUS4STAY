import React, { useEffect, useMemo, useState, useCallback } from 'react';
import AdminNavigation from '../components/AdminNavigation';
import Breadcrumbs from '../components/Breadcrumbs';
import ConfirmModal from '../components/ConfirmModal';
import NotificationModal from '../components/NotificationModal';
import { adminBookings, adminPayments } from '../services/admin';
import { formatPrice, formatStayDate } from '../utils/formatters';
import { Badge } from '../components/ui/badge';

const BOOKING_STATUSES = {
  confirmed: { label: 'Terkonfirmasi', icon: 'check_circle', variant: 'default' },
  completed: { label: 'Selesai', icon: 'done_all', variant: 'secondary' },
  pending_payment: { label: 'Menunggu Pembayaran', icon: 'warning', variant: 'warning' },
  payment_review: { label: 'Menunggu Verifikasi', icon: 'hourglass_top', variant: 'warning' },
  expired: { label: 'Kedaluwarsa', icon: 'history_toggle_off', variant: 'error' },
  cancelled: { label: 'Dibatalkan', icon: 'cancel', variant: 'error' },
};

function BookingStatusBadge({ status }) {
  const config = BOOKING_STATUSES[status] || { label: status, icon: 'info', variant: 'outline' };
  return (
    <Badge variant={config.variant} className="gap-1.5 px-2.5 py-1 text-[11px]">
      <span className="material-symbols-outlined text-[15px]" aria-hidden="true">{config.icon}</span>
      {config.label}
    </Badge>
  );
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionProcessing, setActionProcessing] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: 'success', title: '', message: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const loadBookings = useCallback(async ({ preserveMessage = false } = {}) => {
    setLoading(true);
    if (!preserveMessage) {
      setErrorMsg('');
    }
    try {
      const result = await adminBookings.list({ page, limit: 10 });
      setBookings(result.data);
      setTotalBookings(result.total);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat data booking.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchesFilter = filter === 'all' || b.bookingStatus === filter;
      const matchesSearch = !query || [
        b.bookingCode,
        b.guestName,
        b.guestEmail,
        b.propertyName,
        b.roomName,
      ].some((val) => val?.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [bookings, search, filter]);

  useEffect(() => {
    if (filteredBookings.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!filteredBookings.some((b) => b.bookingId === selectedId)) {
      setSelectedId(filteredBookings[0].bookingId);
    }
  }, [filteredBookings, selectedId]);

  const selectedBooking = useMemo(() => {
    return filteredBookings.find((b) => b.bookingId === selectedId) || null;
  }, [filteredBookings, selectedId]);

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setActionProcessing(true);
    try {
      if (confirmAction.type === 'approve') {
        await adminPayments.approve(confirmAction.bookingId);
        setNotification({
          show: true,
          type: 'success',
          title: 'Pembayaran Disetujui',
          message: `Pembayaran untuk booking ${confirmAction.code} telah disetujui.`,
        });
      } else if (confirmAction.type === 'reject') {
        await adminPayments.reject(confirmAction.bookingId);
        setNotification({
          show: true,
          type: 'success',
          title: 'Pembayaran Ditolak',
          message: `Pembayaran untuk booking ${confirmAction.code} telah ditolak.`,
        });
      } else if (confirmAction.type === 'cancel') {
        await adminBookings.cancel(confirmAction.bookingId);
        setNotification({
          show: true,
          type: 'success',
          title: 'Booking Dibatalkan',
          message: `Booking ${confirmAction.code} telah berhasil dibatalkan.`,
        });
      }
      setConfirmAction(null);
      await loadBookings({ preserveMessage: true });
    } catch (err) {
      setConfirmAction(null);
      setNotification({
        show: true,
        type: 'error',
        title: 'Aksi Gagal',
        message: err.message || 'Gagal memproses aksi.',
      });
    } finally {
      setActionProcessing(false);
    }
  };

  const totalPages = Math.ceil(totalBookings / 10);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const canApproveReject = selectedBooking?.bookingStatus === 'payment_review';
  const canCancel = selectedBooking && ['pending_payment', 'payment_review', 'confirmed'].includes(selectedBooking.bookingStatus);

  return (
    <main className="page-shell py-8 text-left md:py-12">
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[
          { label: 'Beranda', href: '#/' },
          { label: 'Admin', href: '#/admin/properties' },
          { label: 'Pemesanan' },
        ]} />

        <AdminNavigation current="bookings" />

        <header className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest shadow-level-1">
          <div className="flex flex-col gap-5 p-6 md:flex-row md:items-end md:justify-between md:p-8">
            <div>
              <p className="font-label-md text-xs uppercase tracking-[0.18em] text-tertiary">Admin Console</p>
              <h1 className="mt-2 font-headline-xl-mobile text-primary md:text-[38px] md:leading-[46px] font-bold">
                Daftar Pemesanan
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
                Kelola status pembayaran dan status pemesanan tamu di satu tempat.
              </p>
            </div>
          </div>
        </header>

        {errorMsg ? (
          <div className="rounded-2xl border border-error/20 bg-error-container/65 text-on-error-container px-4 py-3 text-sm">
            {errorMsg}
          </div>
        ) : null}

        <section className="grid min-h-[600px] overflow-hidden rounded-3xl border border-outline-variant/35 bg-surface shadow-level-1 lg:grid-cols-[minmax(310px,0.72fr)_minmax(0,1.55fr)]">
          <aside className="border-b border-outline-variant/35 bg-surface-container-low/70 lg:border-b-0 lg:border-r">
            <div className="border-b border-outline-variant/35 p-4 md:p-5">
              <label className="flex min-h-11 items-center gap-3 rounded-xl border border-outline-variant bg-surface px-3.5 shadow-sm">
                <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">search</span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari kode, nama tamu, properti..."
                  className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-outline"
                />
              </label>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {[
                  { key: 'all', label: 'Semua' },
                  { key: 'pending_payment', label: 'Menunggu Bayar' },
                  { key: 'payment_review', label: 'Verifikasi' },
                  { key: 'confirmed', label: 'Terkonfirmasi' },
                  { key: 'completed', label: 'Selesai' },
                  { key: 'cancelled', label: 'Batal' },
                ].map((item) => {
                  const isActive = filter === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFilter(item.key)}
                      className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-primary text-on-primary'
                          : 'border border-outline-variant bg-surface text-on-surface-variant hover:border-primary/30 hover:text-primary'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto p-3 md:p-4">
              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="h-28 animate-pulse rounded-2xl border border-outline-variant/35 bg-surface" />
                  ))}
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-outline-variant bg-surface px-5 py-12 text-center">
                  <span className="material-symbols-outlined text-[40px] text-outline" aria-hidden="true">inbox</span>
                  <h2 className="mt-3 text-base font-bold text-on-surface">Tidak ada pemesanan</h2>
                  <p className="mt-1 text-xs text-on-surface-variant">Ubah filter atau pencarian Anda.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredBookings.map((b) => {
                    const isSelected = selectedId === b.bookingId;
                    return (
                      <button
                        key={b.bookingId}
                        type="button"
                        onClick={() => setSelectedId(b.bookingId)}
                        className={`w-full rounded-2xl border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-primary/35 bg-primary-fixed/25 shadow-[0_10px_30px_rgba(52,78,43,0.09)]'
                            : 'border-outline-variant/50 bg-surface hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-mono text-[11px] font-bold tracking-[0.04em] text-primary">
                              {b.bookingCode}
                            </p>
                            <h3 className="mt-1 truncate font-body-md text-sm font-bold text-on-surface">
                              {b.guestName}
                            </h3>
                          </div>
                          <BookingStatusBadge status={b.bookingStatus} />
                        </div>
                        <div className="mt-3 flex items-end justify-between gap-3 border-t border-outline-variant/35 pt-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs text-on-surface-variant">{b.propertyName} · {b.roomName}</p>
                            <p className="mt-1 text-[11px] text-outline">{formatStayDate(b.checkIn)} - {formatStayDate(b.checkOut)}</p>
                          </div>
                          <p className="shrink-0 text-sm font-bold text-primary">{formatPrice(b.totalPrice)}</p>
                        </div>
                      </button>
                    );
                  })}
                  {totalPages > 1 ? (
                    <div className="mt-3 flex items-center justify-between px-1">
                      <span className="text-[11px] text-on-surface-variant">
                        Halaman {page} dari {totalPages}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs text-on-surface-variant transition hover:bg-surface hover:text-primary disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => handlePageChange(pageNum)}
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold transition ${
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
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs text-on-surface-variant transition hover:bg-surface hover:text-primary disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </aside>

          <article className="min-w-0 bg-surface-container-lowest">
            {!selectedBooking ? (
              <div className="flex min-h-[500px] flex-col items-center justify-center px-6 text-center">
                <span className="material-symbols-outlined text-[52px] text-outline" aria-hidden="true">receipt_long</span>
                <h2 className="mt-4 text-xl font-bold text-on-surface">Pilih Pemesanan</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-on-surface-variant">
                  Detail booking, informasi tamu, dan aksi persetujuan atau pembatalan akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="flex min-h-full flex-col">
                <div className="border-b border-outline-variant/35 p-5 md:p-7">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-xs font-bold tracking-[0.06em] text-primary">{selectedBooking.bookingCode}</p>
                        <BookingStatusBadge status={selectedBooking.bookingStatus} />
                      </div>
                      <h2 className="mt-2 font-headline-md text-2xl font-bold text-on-surface">{selectedBooking.guestName}</h2>
                      <p className="mt-1 break-all text-sm text-on-surface-variant">{selectedBooking.guestEmail}</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-3 sm:text-right">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Total Harga</p>
                      <p className="mt-1 font-price-display text-xl text-primary">{formatPrice(selectedBooking.totalPrice)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-5 md:p-7 space-y-6">
                  <section className="rounded-2xl border border-outline-variant/45 bg-surface-container-low p-5">
                    <h3 className="font-body-md text-sm font-bold text-on-surface">Detail Booking</h3>
                    <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 text-xs">
                      <div>
                        <dt className="text-on-surface-variant">Properti & Kamar</dt>
                        <dd className="mt-1 font-bold text-on-surface">{selectedBooking.propertyName} - {selectedBooking.roomName}</dd>
                      </div>
                      <div>
                        <dt className="text-on-surface-variant">Metode Pembayaran</dt>
                        <dd className="mt-1 font-bold text-on-surface">{selectedBooking.paymentMethod === 'bank_transfer' ? 'Transfer Bank' : selectedBooking.paymentMethod || '-'}</dd>
                      </div>
                      <div className="border-t border-outline-variant/40 pt-3 sm:border-t-0 sm:pt-0">
                        <dt className="text-on-surface-variant">Check-In</dt>
                        <dd className="mt-1 font-bold text-on-surface">{formatStayDate(selectedBooking.checkIn)}</dd>
                      </div>
                      <div className="border-t border-outline-variant/40 pt-3 sm:border-t-0 sm:pt-0">
                        <dt className="text-on-surface-variant">Check-Out</dt>
                        <dd className="mt-1 font-bold text-on-surface">{formatStayDate(selectedBooking.checkOut)}</dd>
                      </div>
                      <div className="border-t border-outline-variant/40 pt-3">
                        <dt className="text-on-surface-variant">Jumlah Tamu</dt>
                        <dd className="mt-1 font-bold text-on-surface">{selectedBooking.guestCount} Tamu</dd>
                      </div>
                      <div className="border-t border-outline-variant/40 pt-3">
                        <dt className="text-on-surface-variant">Status Pembayaran</dt>
                        <dd className="mt-1 font-bold text-on-surface">
                          {selectedBooking.paymentStatus === 'paid' ? 'Lunas' : selectedBooking.paymentStatus === 'unpaid' ? 'Belum Dibayar' : selectedBooking.paymentStatus === 'submitted' ? 'Menunggu Verifikasi' : selectedBooking.paymentStatus === 'rejected' ? 'Ditolak' : selectedBooking.paymentStatus}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section className="rounded-2xl border border-outline-variant/45 bg-surface-container-low p-5">
                    <h3 className="font-body-md text-sm font-bold text-on-surface">Informasi Tamu</h3>
                    <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 text-xs">
                      <div>
                        <dt className="text-on-surface-variant">Nama Lengkap</dt>
                        <dd className="mt-1 font-bold text-on-surface">{selectedBooking.guestName}</dd>
                      </div>
                      <div>
                        <dt className="text-on-surface-variant">Nomor Telepon</dt>
                        <dd className="mt-1 font-bold text-on-surface">{selectedBooking.guestPhone || '-'}</dd>
                      </div>
                      <div className="border-t border-outline-variant/40 pt-3 sm:border-t-0 sm:pt-0 md:col-span-2">
                        <dt className="text-on-surface-variant">Email</dt>
                        <dd className="mt-1 font-bold text-on-surface">{selectedBooking.guestEmail}</dd>
                      </div>
                    </dl>
                  </section>
                </div>

                <div className="border-t border-outline-variant/35 bg-surface-container-low/70 p-5 md:px-7">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-on-surface-variant max-w-md">
                      Aksi di bawah ini akan langsung mengubah status pemesanan tamu dan memicu notifikasi sistem.
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => setConfirmAction({ type: 'cancel', bookingId: selectedBooking.bookingId, code: selectedBooking.bookingCode })}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-error/25 bg-error-container/55 px-4 text-sm font-bold text-on-error-container transition-colors hover:bg-error-container"
                        >
                          <span className="material-symbols-outlined text-[19px]">cancel</span>
                          Batalkan Booking
                        </button>
                      )}
                      {canApproveReject && (
                        <>
                          <button
                            type="button"
                            onClick={() => setConfirmAction({ type: 'reject', bookingId: selectedBooking.bookingId, code: selectedBooking.bookingCode })}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface px-4 text-sm font-bold text-on-surface hover:bg-surface-container-low"
                          >
                            <span className="material-symbols-outlined text-[19px]">close</span>
                            Tolak Pembayaran
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmAction({ type: 'approve', bookingId: selectedBooking.bookingId, code: selectedBooking.bookingCode })}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary shadow-sm hover:bg-primary-container"
                          >
                            <span className="material-symbols-outlined text-[19px]">check</span>
                            Setujui Pembayaran
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </article>
        </section>
      </div>

      <ConfirmModal
        open={confirmAction !== null}
        title={
          confirmAction?.type === 'approve'
            ? 'Setujui Pembayaran'
            : confirmAction?.type === 'reject'
            ? 'Tolak Pembayaran'
            : 'Batalkan Pemesanan'
        }
        message={
          confirmAction?.type === 'approve'
            ? `Apakah Anda yakin ingin menyetujui pembayaran untuk booking ${confirmAction?.code}?`
            : confirmAction?.type === 'reject'
            ? `Apakah Anda yakin ingin menolak pembayaran untuk booking ${confirmAction?.code}?`
            : `Apakah Anda yakin ingin membatalkan pemesanan ${confirmAction?.code}? Tindakan ini tidak dapat dibatalkan.`
        }
        confirmLabel={
          confirmAction?.type === 'approve'
            ? 'Ya, Setujui'
            : confirmAction?.type === 'reject'
            ? 'Ya, Tolak'
            : 'Ya, Batalkan'
        }
        cancelLabel="Batal"
        confirmVariant={confirmAction?.type === 'approve' ? 'default' : 'danger'}
        icon={confirmAction?.type === 'approve' ? 'verified' : confirmAction?.type === 'reject' ? 'assignment_late' : 'cancel'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
        processing={actionProcessing}
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
