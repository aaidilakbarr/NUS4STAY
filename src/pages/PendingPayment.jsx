import React, { useState, useEffect } from 'react';
import { db } from '../services/db';

export default function PendingPayment() {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(86399); // 24 hours in seconds

  useEffect(() => {
    async function loadBooking() {
      const hash = window.location.hash;
      const parts = hash.split('/');
      // Expected format: #/pending/:bookingId
      const id = parts[parts.length - 1]?.split('?')[0] || '';
      
      setLoading(true);
      const data = await db.getBookingById(id);
      setBooking(data);
      setLoading(false);
    }

    loadBooking();
    window.addEventListener('hashchange', loadBooking);
    return () => window.removeEventListener('hashchange', loadBooking);
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price).replace("IDR", "Rp");
  };

  const handleCheckStatus = async () => {
    if (!booking) return;
    // Update booking to Confirmed
    await db.updateBookingStatus(booking.id, 'Confirmed');
    // Redirect to Booking Details (history detail)
    window.location.hash = `#/history-detail/${booking.id}`;
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    await db.updateBookingStatus(booking.id, 'Cancelled');
    window.location.hash = '#/';
  };

  if (loading) {
    return <div className="py-20 text-center font-body-md text-on-surface-variant">Loading payment details...</div>;
  }

  if (!booking) {
    return (
      <div className="py-20 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-[48px] text-error mb-2">warning</span>
        <h3 className="font-headline-md text-lg font-bold mb-1">Booking Not Found</h3>
        <a href="#/" className="text-primary underline">Return Home</a>
      </div>
    );
  }

  return (
    <main className="flex-grow flex items-center justify-center py-12 px-margin-mobile md:px-margin-desktop relative text-left">
      <div className="absolute top-8 left-margin-mobile md:left-margin-desktop">
        <a
          href="#/"
          aria-label="NUS4STAY home"
          title="NUS4STAY"
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-outline-variant/60 bg-surface shadow-[0_8px_24px_rgba(23,28,21,0.06)] transition hover:-translate-y-0.5 hover:border-primary/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95"
        >
          <img
            src="/logo_nus4stay.svg"
            alt=""
            className="h-9 w-9 object-contain"
          />
          <span className="sr-only">NUS4STAY</span>
        </a>
      </div>
      
      <div className="w-full max-w-xl bg-surface border border-outline-variant/30 rounded-2xl shadow-level-2 p-8 mt-10">
        
        {/* Timer Header */}
        <div className="text-center pb-6 border-b border-outline-variant/30">
          <span className="material-symbols-outlined text-tertiary text-[48px] mb-2">pending_actions</span>
          <h1 className="font-headline-md text-xl text-on-surface font-bold">Selesaikan Pembayaran Dalam</h1>
          <div className="font-price-display text-3xl text-tertiary font-bold mt-2 font-mono">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Payment details */}
        <div className="py-6 space-y-6">
          <div className="bg-surface-container-low/50 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant">Metode Pembayaran</span>
              <span className="font-bold text-on-surface uppercase">Transfer Bank</span>
            </div>
            
            <div className="border-t border-outline-variant/10 pt-4 flex justify-between items-start text-sm">
              <div>
                <p className="text-on-surface-variant">Nomor Rekening</p>
                <p className="font-bold text-on-surface text-lg mt-1">8492 301 209</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Bank Central Asia (BCA)</p>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText("8492301209");
                  alert("Nomor rekening berhasil disalin!");
                }}
                className="text-xs text-primary underline hover:opacity-85 font-semibold"
              >
                Salin
              </button>
            </div>

            <div className="border-t border-outline-variant/10 pt-4 flex justify-between items-center text-sm">
              <span className="text-on-surface-variant">Nama Penerima</span>
              <span className="font-bold text-on-surface">PT NUS4STAY Global Indonesia</span>
            </div>

            <div className="border-t border-outline-variant/10 pt-4 flex justify-between items-start text-sm">
              <div>
                <p className="text-on-surface-variant">Jumlah Transfer</p>
                <p className="font-price-display text-xl text-primary font-bold mt-1">
                  {formatPrice(booking.totalPrice)}
                </p>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(booking.totalPrice.toString());
                  alert("Jumlah transfer berhasil disalin!");
                }}
                className="text-xs text-primary underline hover:opacity-85 font-semibold mt-2"
              >
                Salin
              </button>
            </div>
          </div>

          {/* Booking Summary Checklist */}
          <div className="border border-outline-variant/30 rounded-xl p-5 text-sm space-y-3">
            <h3 className="font-headline-md text-sm text-on-surface font-bold">Ringkasan Pemesanan</h3>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Properti</span>
              <span className="font-medium text-on-surface">{booking.propertyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Kamar</span>
              <span className="font-medium text-on-surface">{booking.roomName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Check-in</span>
              <span className="font-medium text-on-surface">{booking.checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Check-out</span>
              <span className="font-medium text-on-surface">{booking.checkOut}</span>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4">
          <button 
            onClick={handleCheckStatus}
            className="w-full bg-primary text-on-primary font-label-md text-sm py-4 rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-bold cursor-pointer active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
            Cek Status Pembayaran
          </button>
          
          <button 
            onClick={() => alert("Silakan transfer ke nomor rekening di atas untuk menyelesaikan pesanan Anda.")}
            className="w-full border-2 border-primary text-primary font-label-md text-sm py-3.5 rounded-full hover:bg-primary-fixed/10 transition-colors font-bold active:scale-95 transition-transform"
          >
            Ubah Metode Pembayaran
          </button>
        </div>

        <div className="text-center mt-6">
          <button 
            onClick={handleCancelBooking}
            className="font-label-md text-xs text-on-surface-variant underline hover:text-primary transition-colors cursor-pointer"
          >
            Batal &amp; Kembali ke Beranda
          </button>
        </div>

      </div>
    </main>
  );
}
