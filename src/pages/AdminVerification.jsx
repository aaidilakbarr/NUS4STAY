import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminNavigation from '../components/AdminNavigation';
import Breadcrumbs from '../components/Breadcrumbs';
import { adminPayments } from '../services/admin';
import { formatPrice, formatDateTime, formatStayDate, getProofFileName, getProofType } from '../utils/formatters';

const ITEMS_PER_PAGE = 10;

const FILTERS = [
  { key: 'review', label: 'Perlu diperiksa' },
  { key: 'approved', label: 'Disetujui' },
  { key: 'rejected', label: 'Ditolak' },
  { key: 'all', label: 'Semua' },
];

const VERIFICATION_STATES = {
  review: {
    label: 'Perlu diperiksa',
    icon: 'hourglass_top',
    badgeClass: 'border-tertiary/20 bg-tertiary-container text-on-tertiary-container',
  },
  approved: {
    label: 'Disetujui',
    icon: 'verified',
    badgeClass: 'border-primary/20 bg-primary-fixed/45 text-primary',
  },
  rejected: {
    label: 'Ditolak',
    icon: 'cancel',
    badgeClass: 'border-error/20 bg-error-container/65 text-on-error-container',
  },
  unknown: {
    label: 'Status berubah',
    icon: 'info',
    badgeClass: 'border-outline-variant bg-surface-container text-on-surface-variant',
  },
};

const getVerificationState = (record) => {
  if (record.bookingStatus === 'confirmed' && record.paymentStatus === 'paid') return 'approved';
  if (record.paymentStatus === 'rejected' || record.proofStatus === 'rejected') return 'rejected';
  if (record.bookingStatus === 'payment_review' && record.paymentStatus === 'submitted') return 'review';
  return 'unknown';
};

function VerificationBadge({ state }) {
  const config = VERIFICATION_STATES[state] || VERIFICATION_STATES.unknown;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${config.badgeClass}`}>
      <span className="material-symbols-outlined text-[15px]" aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}

export default function AdminVerification() {
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('review');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [proofUrl, setProofUrl] = useState('');
  const [proofLoading, setProofLoading] = useState(false);
  const [proofError, setProofError] = useState('');
  const [decision, setDecision] = useState(null);
  const [processing, setProcessing] = useState(false);

  const loadPayments = useCallback(async ({ silent = false, preserveMessage = false, currentPage } = {}) => {
    const targetPage = currentPage ?? page;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    if (!preserveMessage) setMessage('');

    try {
      const result = await adminPayments.list({ page: targetPage, limit: ITEMS_PER_PAGE });
      setRecords(result.data);
      setTotalRecords(result.total);
      setSelectedId((currentId) => {
        if (result.data.some((record) => record.bookingId === currentId)) return currentId;
        return result.data.find((record) => getVerificationState(record) === 'review')?.bookingId
          || result.data[0]?.bookingId
          || null;
      });
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  useEffect(() => {
    loadPayments({ currentPage: page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (!decision) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !processing) setDecision(null);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [decision, processing]);

  const reviewCount = useMemo(
    () => records.filter((record) => getVerificationState(record) === 'review').length,
    [records],
  );

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const state = getVerificationState(record);
      const matchesFilter = filter === 'all' || state === filter;
      const matchesSearch = !query || [
        record.bookingCode,
        record.guestName,
        record.guestEmail,
        record.propertyName,
      ].some((value) => value?.toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });
  }, [filter, records, search]);

  useEffect(() => {
    if (filteredRecords.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!filteredRecords.some((record) => record.bookingId === selectedId)) {
      setSelectedId(filteredRecords[0].bookingId);
    }
  }, [filteredRecords, selectedId]);

  const selectedRecord = useMemo(
    () => filteredRecords.find((record) => record.bookingId === selectedId) || null,
    [filteredRecords, selectedId],
  );

  useEffect(() => {
    let active = true;
    setProofUrl('');
    setProofError('');

    if (!selectedRecord?.proofPath) {
      setProofLoading(false);
      return () => {
        active = false;
      };
    }

    setProofLoading(true);
    adminPayments.createProofUrl(selectedRecord.proofPath)
      .then((signedUrl) => {
        if (active) setProofUrl(signedUrl);
      })
      .catch((error) => {
        if (active) setProofError(error.message);
      })
      .finally(() => {
        if (active) setProofLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedRecord?.bookingId, selectedRecord?.proofPath]);

  const openDecision = (type) => {
    if (!selectedRecord || getVerificationState(selectedRecord) !== 'review') return;
    setDecision({ type, record: selectedRecord });
  };

  const handleDecision = async () => {
    if (!decision?.record) return;

    setProcessing(true);
    setMessage('');

    try {
      if (decision.type === 'approve') {
        await adminPayments.approve(decision.record.bookingId);
        setMessage(`Pembayaran ${decision.record.bookingCode} disetujui. Booking dikonfirmasi dan invoice tersedia di akun user.`);
      } else {
        await adminPayments.reject(decision.record.bookingId);
        setMessage(`Pembayaran ${decision.record.bookingCode} ditolak. User mendapat waktu 30 menit untuk mengirim bukti baru.`);
      }

      setMessageType('success');
      setDecision(null);
      await loadPayments({ silent: true, preserveMessage: true, currentPage: page });
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
      setDecision(null);
      await loadPayments({ silent: true, preserveMessage: true, currentPage: page });
    } finally {
      setProcessing(false);
    }
  };

  const selectedState = selectedRecord ? getVerificationState(selectedRecord) : 'unknown';
  const selectedProofType = getProofType(selectedRecord?.proofPath);
  const canReview = selectedState === 'review';
  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
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
    );
  };

  return (
    <main className="page-shell py-8 text-left md:py-12">
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[
          { label: 'Beranda', href: '#/' },
          { label: 'Admin', href: '#/admin/properties' },
          { label: 'Verifikasi Pembayaran' },
        ]} />

        <AdminNavigation current="payments" pendingCount={reviewCount} />

        <header className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest shadow-level-1">
          <div className="flex flex-col gap-5 p-6 md:flex-row md:items-end md:justify-between md:p-8">
            <div>
              <p className="font-label-md text-xs uppercase tracking-[0.18em] text-tertiary">Admin Console</p>
              <h1 className="mt-2 font-headline-xl-mobile text-primary md:text-[38px] md:leading-[46px]">
                Verifikasi Pembayaran
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
                Cocokkan nominal dan bukti transfer sebelum mengonfirmasi booking. Satu keputusan akan langsung memperbarui status user.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadPayments({ silent: true, currentPage: page })}
              disabled={refreshing}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary-fixed/25 px-4 text-sm font-bold text-primary transition-colors hover:bg-primary-fixed/45 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-[19px] ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true">refresh</span>
              {refreshing ? 'Memuat ulang...' : 'Muat ulang antrean'}
            </button>
          </div>

          <div className="flex items-center gap-4 border-t border-outline-variant/35 bg-primary px-6 py-4 text-on-primary md:px-8">
            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">assignment_turned_in</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-primary/70">Antrean aktif</p>
              <p className="mt-0.5 font-headline-md text-lg font-bold">
                {reviewCount === 0 ? 'Semua bukti sudah diputuskan' : `${reviewCount} bukti menunggu keputusan`}
              </p>
            </div>
          </div>
        </header>

        {message ? (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-2xl border px-4 py-3 text-sm ${
              messageType === 'error'
                ? 'border-error/20 bg-error-container/65 text-on-error-container'
                : 'border-primary/20 bg-primary-fixed/35 text-on-primary-fixed-variant'
            }`}
          >
            {message}
          </div>
        ) : null}

        <section className="grid min-h-[680px] overflow-hidden rounded-3xl border border-outline-variant/35 bg-surface shadow-level-1 lg:grid-cols-[minmax(310px,0.72fr)_minmax(0,1.55fr)]">
          <aside className="border-b border-outline-variant/35 bg-surface-container-low/70 lg:border-b-0 lg:border-r">
            <div className="border-b border-outline-variant/35 p-4 md:p-5">
              <label className="flex min-h-11 items-center gap-3 rounded-xl border border-outline-variant bg-surface px-3.5 shadow-sm">
                <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">search</span>
                <span className="sr-only">Cari booking atau user</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari ID, nama, atau email"
                  className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-outline"
                />
              </label>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter verifikasi">
                {FILTERS.map((item) => {
                  const isActive = filter === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
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

            <div className="max-h-[720px] overflow-y-auto p-3 md:p-4">
              {loading ? (
                <div className="space-y-3" aria-label="Memuat antrean pembayaran">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="h-32 animate-pulse rounded-2xl border border-outline-variant/35 bg-surface" />
                  ))}
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-outline-variant bg-surface px-5 py-12 text-center">
                  <span className="material-symbols-outlined text-[40px] text-outline" aria-hidden="true">task_alt</span>
                  <h2 className="mt-3 text-base font-bold text-on-surface">Tidak ada bukti di filter ini</h2>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                    Ubah filter atau muat ulang untuk melihat kiriman terbaru.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredRecords.map((record) => {
                    const state = getVerificationState(record);
                    const isSelected = selectedId === record.bookingId;

                    return (
                      <button
                        key={record.bookingId}
                        type="button"
                        onClick={() => setSelectedId(record.bookingId)}
                        aria-pressed={isSelected}
                        className={`w-full rounded-2xl border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-primary/35 bg-primary-fixed/25 shadow-[0_10px_30px_rgba(52,78,43,0.09)]'
                            : 'border-outline-variant/50 bg-surface hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-mono text-[11px] font-bold tracking-[0.04em] text-primary">
                              {record.bookingCode}
                            </p>
                            <h3 className="mt-1 truncate font-body-md text-sm font-bold text-on-surface">
                              {record.guestName}
                            </h3>
                          </div>
                          <VerificationBadge state={state} />
                        </div>

                        <div className="mt-3 flex items-end justify-between gap-3 border-t border-outline-variant/35 pt-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs text-on-surface-variant">{record.propertyName} · {record.roomName}</p>
                            <p className="mt-1 text-[11px] text-outline">Dikirim {formatDateTime(record.submittedAt)}</p>
                          </div>
                          <p className="shrink-0 text-sm font-bold text-primary">{formatPrice(record.totalPrice)}</p>
                        </div>
                      </button>
                    );
                  })}
                  {renderPagination()}
                </div>
              )}
            </div>
          </aside>

          <article className="min-w-0 bg-surface-container-lowest">
            {!selectedRecord ? (
              <div className="flex min-h-[560px] flex-col items-center justify-center px-6 text-center">
                <span className="material-symbols-outlined text-[52px] text-outline" aria-hidden="true">fact_check</span>
                <h2 className="mt-4 text-xl font-bold text-on-surface">Pilih bukti pembayaran</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-on-surface-variant">
                  Detail booking, dokumen transfer, dan tombol keputusan akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="flex min-h-full flex-col">
                <div className="border-b border-outline-variant/35 p-5 md:p-7">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-xs font-bold tracking-[0.06em] text-primary">{selectedRecord.bookingCode}</p>
                        <VerificationBadge state={selectedState} />
                      </div>
                      <h2 className="mt-2 font-headline-md text-2xl font-bold text-on-surface">{selectedRecord.guestName}</h2>
                      <p className="mt-1 break-all text-sm text-on-surface-variant">{selectedRecord.guestEmail}</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-3 sm:text-right">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Nominal transfer</p>
                      <p className="mt-1 font-price-display text-xl text-primary">{formatPrice(selectedRecord.totalPrice)}</p>
                    </div>
                  </div>

                  <ol className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Progres verifikasi">
                    {[
                      { label: 'Bukti diterima', done: true },
                      { label: 'Sedang diperiksa', done: selectedState !== 'unknown' },
                      { label: selectedState === 'review' ? 'Menunggu keputusan' : 'Keputusan tercatat', done: selectedState !== 'review' },
                      { label: selectedState === 'approved' ? 'Invoice tersedia' : 'Invoice menunggu', done: selectedState === 'approved' },
                    ].map((step, index) => (
                      <li
                        key={step.label}
                        className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold ${
                          step.done
                            ? 'border-primary/20 bg-primary-fixed/30 text-primary'
                            : 'border-outline-variant bg-surface-container-low text-on-surface-variant'
                        }`}
                      >
                        <span className="font-mono text-[10px] opacity-65">0{index + 1}</span>
                        <span>{step.label}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="grid flex-1 gap-5 p-5 md:p-7 xl:grid-cols-[minmax(0,1.25fr)_minmax(270px,0.75fr)]">
                  <section>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-body-md text-sm font-bold text-on-surface">Bukti pembayaran</h3>
                        <p className="mt-0.5 break-all text-[11px] text-on-surface-variant">{getProofFileName(selectedRecord.proofPath)}</p>
                      </div>
                      {proofUrl ? (
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-outline-variant bg-surface px-3 text-xs font-bold text-primary transition-colors hover:border-primary/30 hover:bg-primary-fixed/20"
                        >
                          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">open_in_new</span>
                          Buka ukuran asli
                        </a>
                      ) : null}
                    </div>

                    <div className="flex min-h-[390px] items-center justify-center overflow-hidden rounded-2xl border border-[#2c3528] bg-[#1d241b] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                      {proofLoading ? (
                        <div className="flex flex-col items-center gap-3 text-white/70">
                          <span className="material-symbols-outlined animate-pulse text-[38px]" aria-hidden="true">image_search</span>
                          <p className="text-xs">Membuka bukti privat...</p>
                        </div>
                      ) : proofError ? (
                        <div className="max-w-sm px-6 text-center text-white/80">
                          <span className="material-symbols-outlined text-[40px] text-[#ffd5cf]" aria-hidden="true">broken_image</span>
                          <p className="mt-3 text-sm font-bold">Bukti tidak dapat ditampilkan</p>
                          <p className="mt-1 text-xs leading-5 text-white/60">{proofError}</p>
                        </div>
                      ) : selectedProofType === 'image' && proofUrl ? (
                        <img
                          src={proofUrl}
                          alt={`Bukti pembayaran ${selectedRecord.bookingCode}`}
                          className="max-h-[620px] w-full object-contain"
                        />
                      ) : selectedProofType === 'pdf' && proofUrl ? (
                        <iframe
                          src={`${proofUrl}#toolbar=0`}
                          title={`Bukti pembayaran ${selectedRecord.bookingCode}`}
                          className="h-[620px] w-full bg-white"
                        />
                      ) : proofUrl ? (
                        <div className="px-6 text-center text-white/80">
                          <span className="material-symbols-outlined text-[40px]" aria-hidden="true">draft</span>
                          <p className="mt-3 text-sm font-bold">Format belum dapat dipreview</p>
                          <p className="mt-1 text-xs text-white/60">Buka file asli untuk memeriksanya.</p>
                        </div>
                      ) : null}
                    </div>
                  </section>

                  <aside className="space-y-4">
                    <section className="rounded-2xl border border-outline-variant/45 bg-surface-container-low p-4">
                      <h3 className="font-body-md text-sm font-bold text-on-surface">Cocokkan dengan booking</h3>
                      <dl className="mt-4 space-y-3 text-xs">
                        <div>
                          <dt className="text-on-surface-variant">Properti & kamar</dt>
                          <dd className="mt-1 font-bold text-on-surface">{selectedRecord.propertyName}</dd>
                          <dd className="text-on-surface-variant">{selectedRecord.roomName}</dd>
                        </div>
                        <div className="grid grid-cols-2 gap-3 border-t border-outline-variant/40 pt-3">
                          <div>
                            <dt className="text-on-surface-variant">Check-in</dt>
                            <dd className="mt-1 font-bold text-on-surface">{formatStayDate(selectedRecord.checkIn)}</dd>
                          </div>
                          <div>
                            <dt className="text-on-surface-variant">Check-out</dt>
                            <dd className="mt-1 font-bold text-on-surface">{formatStayDate(selectedRecord.checkOut)}</dd>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 border-t border-outline-variant/40 pt-3">
                          <div>
                            <dt className="text-on-surface-variant">Jumlah tamu</dt>
                            <dd className="mt-1 font-bold text-on-surface">{selectedRecord.guestCount} tamu</dd>
                          </div>
                          <div>
                            <dt className="text-on-surface-variant">Metode pembayaran</dt>
                            <dd className="mt-1 font-bold text-on-surface">Transfer bank</dd>
                          </div>
                        </div>
                        <div className="border-t border-outline-variant/40 pt-3">
                          <dt className="text-on-surface-variant">Bukti dikirim</dt>
                          <dd className="mt-1 font-bold text-on-surface">{formatDateTime(selectedRecord.submittedAt)}</dd>
                        </div>
                      </dl>
                    </section>

                    {selectedState === 'approved' ? (
                      <div className="rounded-2xl border border-primary/20 bg-primary-fixed/35 p-4 text-sm text-on-primary-fixed-variant">
                        <div className="flex gap-3">
                          <span className="material-symbols-outlined text-primary" aria-hidden="true">receipt_long</span>
                          <div>
                            <p className="font-bold">Invoice sudah tersedia</p>
                            <p className="mt-1 text-xs leading-5">User dapat membukanya dari menu My Bookings sejak {formatDateTime(selectedRecord.paidAt)}.</p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {selectedState === 'rejected' ? (
                      <div className="rounded-2xl border border-error/20 bg-error-container/50 p-4 text-sm text-on-error-container">
                        <div className="flex gap-3">
                          <span className="material-symbols-outlined" aria-hidden="true">assignment_late</span>
                          <div>
                            <p className="font-bold">Bukti telah ditolak</p>
                            <p className="mt-1 text-xs leading-5">Booking kembali menunggu pembayaran sampai user mengirim bukti baru.</p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </aside>
                </div>

                <div className="border-t border-outline-variant/35 bg-surface-container-low/70 p-5 md:px-7">
                  {canReview ? (
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="max-w-md text-xs leading-5 text-on-surface-variant">
                        Pastikan nama, nominal, dan tujuan transfer sesuai. Keputusan dicatat menggunakan akun admin yang sedang login.
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => openDecision('reject')}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-error/25 bg-error-container/55 px-4 text-sm font-bold text-on-error-container transition-colors hover:bg-error-container"
                        >
                          <span className="material-symbols-outlined text-[19px]" aria-hidden="true">close</span>
                          Tolak bukti
                        </button>
                        <button
                          type="button"
                          onClick={() => openDecision('approve')}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary shadow-[0_12px_28px_rgba(52,78,43,0.2)] transition hover:-translate-y-0.5 hover:bg-primary-container"
                        >
                          <span className="material-symbols-outlined text-[19px]" aria-hidden="true">check</span>
                          Setujui pembayaran
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-primary" aria-hidden="true">lock</span>
                      <p>Keputusan sudah tercatat. Aksi verifikasi tidak dapat diulang dari layar ini.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </article>
        </section>
      </div>

      {decision ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-inverse-surface/55 p-5 backdrop-blur-sm" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="decision-title"
            className="w-full max-w-md rounded-3xl border border-white/30 bg-surface p-6 shadow-[0_28px_80px_rgba(23,28,21,0.28)] md:p-7"
          >
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
              decision.type === 'approve'
                ? 'bg-primary-fixed/55 text-primary'
                : 'bg-error-container text-on-error-container'
            }`}>
              <span className="material-symbols-outlined text-[26px]" aria-hidden="true">
                {decision.type === 'approve' ? 'verified' : 'assignment_late'}
              </span>
            </div>

            <h2 id="decision-title" className="mt-5 font-headline-md text-2xl font-bold text-on-surface">
              {decision.type === 'approve' ? 'Setujui pembayaran ini?' : 'Tolak bukti pembayaran ini?'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              {decision.type === 'approve'
                ? `Booking ${decision.record.bookingCode} akan dikonfirmasi dan invoice langsung tersedia di akun ${decision.record.guestEmail}.`
                : `Booking ${decision.record.bookingCode} kembali ke status menunggu pembayaran dengan batas waktu baru 30 menit.`}
            </p>

            <div className="mt-5 rounded-xl border border-outline-variant/45 bg-surface-container-low p-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-on-surface-variant">Nominal</span>
                <span className="font-bold text-primary">{formatPrice(decision.record.totalPrice)}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDecision(null)}
                disabled={processing}
                autoFocus
                className="min-h-11 rounded-xl border border-outline-variant px-4 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
              >
                Kembali periksa
              </button>
              <button
                type="button"
                onClick={handleDecision}
                disabled={processing}
                className={`min-h-11 rounded-xl px-5 text-sm font-bold shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                  decision.type === 'approve'
                    ? 'bg-primary text-on-primary hover:bg-primary-container'
                    : 'bg-error text-on-error hover:opacity-90'
                }`}
              >
                {processing
                  ? 'Menyimpan keputusan...'
                  : decision.type === 'approve' ? 'Ya, setujui' : 'Ya, tolak bukti'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
