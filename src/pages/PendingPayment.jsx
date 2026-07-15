import React, { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../services/db';

const getBookingIdFromHash = () => {
  const parts = window.location.hash.split('/');
  return parts[parts.length - 1]?.split('?')[0] || '';
};

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':');
};

const formatPrice = (price) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(price).replace('IDR', 'Rp');

export default function PendingPayment() {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [proofFile, setProofFile] = useState(null);
  const [proofUploading, setProofUploading] = useState(false);
  const [error, setError] = useState('');
  const [proofModal, setProofModal] = useState({ open: false, success: false, text: '' });
  const fileInputRef = useRef(null);

  const loadBooking = useCallback(async () => {
    const id = getBookingIdFromHash();
    if (!id) {
      setBooking(null);
      setLoading(false);
      return null;
    }

    const data = await db.getBookingById(id);
    setBooking(data);
    setLoading(false);
    return data;
  }, []);

  useEffect(() => {
    loadBooking();
    window.addEventListener('hashchange', loadBooking);
    return () => window.removeEventListener('hashchange', loadBooking);
  }, [loadBooking]);

  useEffect(() => {
    if (!booking || !['pending_payment', 'payment_review'].includes(booking.bookingStatus)) return undefined;

    const interval = setInterval(loadBooking, 15000);
    return () => clearInterval(interval);
  }, [booking, loadBooking]);

  useEffect(() => {
    if (!booking?.expiresAt || booking.bookingStatus !== 'pending_payment') {
      setTimeLeft(0);
      return undefined;
    }

    const updateCountdown = () => {
      const serverOffset = booking.serverNow
        ? new Date(booking.serverNow).getTime() - Date.now()
        : 0;
      setTimeLeft(Math.max(0, Math.floor((new Date(booking.expiresAt).getTime() - (Date.now() + serverOffset)) / 1000)));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  useEffect(() => {
    if (timeLeft === 0 && booking?.bookingStatus === 'pending_payment') {
      loadBooking();
    }
  }, [booking?.bookingStatus, loadBooking, timeLeft]);

  const handleCheckStatus = async () => {
    setRefreshing(true);
    setError('');
    try {
      const refreshed = await loadBooking();
      if (refreshed?.bookingStatus === 'confirmed') {
        window.location.hash = `#/history-detail/${refreshed.id}`;
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleProofSubmit = async (event) => {
    event.preventDefault();
    if (!booking || !proofFile) {
      setError('Pilih file bukti transfer terlebih dahulu.');
      return;
    }

    if (proofFile.size > 10 * 1024 * 1024) {
      setError('Ukuran file maksimal 10 MB.');
      return;
    }

    setProofUploading(true);
    setError('');
    try {
      await db.uploadPaymentProof(booking.id, proofFile);
      setProofModal({ open: true, success: true, text: 'Bukti pembayaran berhasil dikirim! Mohon tunggu verifikasi dari admin.' });
      setProofFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setProofModal({ open: true, success: false, text: 'Maaf bukti pembayaran gagal.' });
    } finally {
      setProofUploading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking || !window.confirm('Batalkan booking ini? Ketersediaan kamar akan dikembalikan.')) return;

    setRefreshing(true);
    setError('');
    try {
      await db.cancelBooking(booking.id);
      window.location.hash = '#/history';
    } catch (cancelError) {
      setError(cancelError.message);
      setRefreshing(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center font-body-md text-on-surface-variant">Memuat detail pembayaran...</div>;
  }

  if (!booking) {
    return (
      <div className="py-20 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-[48px] text-error mb-2">warning</span>
        <h3 className="font-headline-md text-lg font-bold mb-1">Booking tidak ditemukan</h3>
        <a href="#/history" className="text-primary underline">Kembali ke riwayat</a>
      </div>
    );
  }

  const isPending = booking.bookingStatus === 'pending_payment';
  const isReview = booking.bookingStatus === 'payment_review';
  const isExpired = booking.bookingStatus === 'expired';

  return (
    <main className="flex-grow flex items-center justify-center py-12 px-margin-mobile md:px-margin-desktop relative text-left">
      <div className="absolute top-8 left-margin-mobile md:left-margin-desktop">
        <a
          href="#/"
          aria-label="NUS4STAY home"
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-outline-variant/60 bg-surface shadow-[0_8px_24px_rgba(23,28,21,0.06)] transition hover:-translate-y-0.5 hover:border-primary/30"
        >
          <img src="/logo_nus4stay.svg" alt="" className="h-9 w-9 object-contain" />
        </a>
      </div>

      <div className="w-full max-w-xl bg-surface border border-outline-variant/30 rounded-2xl shadow-level-2 p-8 mt-10">
        <div className="text-center pb-6 border-b border-outline-variant/30">
          <span className={`material-symbols-outlined text-[48px] mb-2 ${isExpired ? 'text-error' : 'text-tertiary'}`}>
            {isExpired ? 'event_busy' : isReview ? 'fact_check' : 'pending_actions'}
          </span>
          <h1 className="font-headline-md text-xl text-on-surface font-bold">
            {isExpired ? 'Booking sudah kedaluwarsa' : isReview ? 'Bukti pembayaran sedang ditinjau' : 'Selesaikan pembayaran'}
          </h1>
          {isPending ? (
            <>
              <p className="mt-2 text-sm text-on-surface-variant">Batas waktu pembayaran tersisa</p>
              <div className="font-price-display text-3xl text-tertiary font-bold mt-2 font-mono" aria-live="polite">
                {formatTime(timeLeft)}
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-on-surface-variant">
              {isExpired ? 'Kode booking tetap tersimpan, tetapi tidak dapat dikonfirmasi lagi.' : 'Kami akan memberi tahu setelah admin selesai memeriksa transfer kamu.'}
            </p>
          )}
        </div>

        <div className="py-6 space-y-6">
          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-error/20 bg-error-container/65 px-3 py-2.5 text-sm text-on-error-container" role="alert">
              <span className="material-symbols-outlined mt-0.5 text-[18px]">error</span>
              <p>{error}</p>
            </div>
          ) : null}

          <div className="bg-surface-container-low/50 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center text-sm gap-4">
              <span className="text-on-surface-variant">Kode booking</span>
              <span className="font-mono font-bold text-on-surface text-right">{booking.bookingCode}</span>
            </div>
            <div className="border-t border-outline-variant/10 pt-4 flex justify-between items-start text-sm">
              <div>
                <p className="text-on-surface-variant">Nomor rekening</p>
                <p className="font-bold text-on-surface text-lg mt-1">8492 301 209</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Bank Central Asia (BCA)</p>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText('8492301209')}
                className="text-xs text-primary underline hover:opacity-85 font-semibold"
              >
                Salin
              </button>
            </div>
            <div className="border-t border-outline-variant/10 pt-4 flex justify-between items-start text-sm">
              <div>
                <p className="text-on-surface-variant">Jumlah transfer</p>
                <p className="font-price-display text-xl text-primary font-bold mt-1">{formatPrice(booking.totalPrice)}</p>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(String(booking.totalPrice))}
                className="text-xs text-primary underline hover:opacity-85 font-semibold mt-2"
              >
                Salin
              </button>
            </div>
          </div>

          <div className="border border-outline-variant/30 rounded-xl p-5 text-sm space-y-3">
            <h2 className="font-headline-md text-sm text-on-surface font-bold">Ringkasan pemesanan</h2>
            <div className="flex justify-between gap-4"><span className="text-on-surface-variant">Properti</span><span className="font-medium text-on-surface text-right">{booking.propertyName}</span></div>
            <div className="flex justify-between gap-4"><span className="text-on-surface-variant">Kamar</span><span className="font-medium text-on-surface text-right">{booking.roomName}</span></div>
            <div className="flex justify-between gap-4"><span className="text-on-surface-variant">Menginap</span><span className="font-medium text-on-surface text-right">{booking.checkIn} s/d {booking.checkOut}</span></div>
          </div>

          {isPending ? (
            <form onSubmit={handleProofSubmit} className="rounded-xl border border-primary/20 bg-primary-fixed/10 p-5 space-y-3">
              <div>
                <h2 className="font-headline-md text-sm text-on-surface font-bold">Kirim bukti transfer</h2>
                <p className="mt-1 text-xs text-on-surface-variant">Upload JPG, PNG, atau PDF sebelum waktu habis.</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,.pdf"
                onChange={(event) => setProofFile(event.target.files?.[0] || null)}
                className="block w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs"
              />
              <button type="submit" disabled={proofUploading || timeLeft <= 0} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-60">
                {proofUploading ? 'Mengunggah bukti...' : 'Kirim bukti pembayaran'}
              </button>
            </form>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          {isPending || isReview ? (
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={refreshing}
              className="w-full bg-primary text-on-primary font-label-md text-sm py-4 rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              {refreshing ? 'Memeriksa...' : 'Cek status pembayaran'}
            </button>
          ) : null}

          {isExpired ? (
            <a href="#/" className="w-full bg-primary text-on-primary font-label-md text-sm py-4 rounded-full text-center font-bold">Cari kamar baru</a>
          ) : null}

          {booking.bookingStatus === 'confirmed' ? (
            <a href={`#/history-detail/${booking.id}`} className="w-full bg-primary text-on-primary font-label-md text-sm py-4 rounded-full text-center font-bold">Lihat detail booking</a>
          ) : null}

          {isPending || isReview ? (
            <button type="button" onClick={handleCancelBooking} disabled={refreshing} className="font-label-md text-xs text-on-surface-variant underline hover:text-primary transition-colors disabled:opacity-50">
              Batalkan booking
            </button>
          ) : null}
        </div>
      </div>

      {proofModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101F0D]/20 px-4 backdrop-blur-md animate-fade-in-up">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="proof-dialog-title"
            className="w-full max-w-sm rounded-[2rem] border border-white/60 bg-white/40 p-6 shadow-2xl backdrop-blur-2xl text-center"
          >
            <div className="flex flex-col items-center">
              <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4 ${proofModal.success ? 'bg-primary/10 text-primary border border-primary/15' : 'bg-error-container/60 text-on-error-container border border-error/15'
                }`}>
                <span className="material-symbols-outlined icon-pro text-[28px]">
                  {proofModal.success ? 'check_circle' : 'error'}
                </span>
              </div>

              <h3 id="proof-dialog-title" className="text-lg font-bold text-on-surface">
                {proofModal.success ? 'Bukti Terkirim' : 'Pengiriman Gagal'}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-on-surface-variant/80">
                {proofModal.text}
              </p>

              <div className="mt-6 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setProofModal({ open: false, success: false, text: '' });
                    if (proofModal.success) {
                      window.location.hash = '#/history';
                    }
                  }}
                  className="w-full h-11 cursor-pointer inline-flex items-center justify-center rounded-xl bg-primary text-white text-xs font-semibold shadow-md hover:bg-primary-container transition-all duration-200"
                >
                  {proofModal.success ? 'Lihat Riwayat Booking' : 'Tutup'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
