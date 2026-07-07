import React, { useState, useEffect } from 'react';
import { db } from '../services/db';

export default function BookingDetail() {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookingDetails() {
      const hash = window.location.hash;
      const parts = hash.split('/');
      // Expected format: #/history-detail/:bookingId
      const id = parts[parts.length - 1]?.split('?')[0] || '';

      setLoading(true);
      const data = await db.getBookingById(id);
      setBooking(data);
      setLoading(false);
    }

    loadBookingDetails();
    window.addEventListener('hashchange', loadBookingDetails);
    return () => window.removeEventListener('hashchange', loadBookingDetails);
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price).replace("IDR", "Rp");
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-[#EAF2E8] text-[#34662B]';
      case 'Pending':
        return 'bg-[#FDF6E2] text-[#B2700D]';
      case 'Cancelled':
        return 'bg-[#FDF0EE] text-[#C53F3F]';
      default:
        return 'bg-surface-container text-on-surface-variant';
    }
  };

  const calculateNights = (startStr, endStr) => {
    if (!startStr || !endStr) return 1;
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diff = end.getTime() - start.getTime();
    const nights = Math.ceil(diff / (1000 * 3600 * 24));
    return nights > 0 ? nights : 1;
  };

  if (loading) {
    return <div className="py-20 text-center font-body-md text-on-surface-variant">Loading booking details...</div>;
  }

  if (!booking) {
    return (
      <div className="py-20 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-[48px] text-error mb-2">warning</span>
        <h3 className="font-headline-md text-lg font-bold mb-1">Booking Not Found</h3>
        <a href="#/history" className="text-primary underline">Return to Booking History</a>
      </div>
    );
  }

  const nights = calculateNights(booking.checkIn, booking.checkOut);

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12 text-left">
      
      {/* Header & Back Action */}
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => window.location.hash = '#/history'}
          aria-label="Kembali ke Daftar Riwayat" 
          className="p-2 rounded-full hover:bg-surface-variant transition-colors flex items-center justify-center text-on-surface"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
        </button>
        <h1 className="font-headline-lg text-headline-lg md:font-headline-xl md:text-3xl text-on-surface font-bold">
          Detail Pemesanan
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-card-gap">
        {/* Left Column: Primary Details */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Status & Booking ID Card */}
          <section className="bg-surface rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-outline-variant/30 shadow-sm">
            <div>
              <p className="font-label-md text-xs text-on-surface-variant mb-1 font-semibold">ID Pemesanan</p>
              <p className="font-headline-md text-xl text-on-surface font-bold font-mono">{booking.id}</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-label-md text-sm font-bold ${getStatusBadgeClass(booking.status)}`}>
              <span className="material-symbols-outlined text-[18px] fill-1">
                {booking.status === 'Confirmed' ? 'check_circle' : booking.status === 'Pending' ? 'pending' : 'cancel'}
              </span>
              {booking.status}
            </div>
          </section>

          {/* Property Details Bento Card */}
          <section className="bg-surface rounded-xl shadow-sm overflow-hidden border border-outline-variant/30 group">
            <div className="flex flex-col sm:flex-row">
              <div className="w-full sm:w-1/3 h-48 sm:h-auto relative overflow-hidden">
                <img 
                  alt={booking.propertyName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  src={booking.propertyImage} 
                />
              </div>
              
              <div className="p-6 flex-grow flex flex-col justify-between sm:w-2/3">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-headline-md text-lg text-on-surface font-bold">{booking.propertyName}</h3>
                    <p className="font-body-md text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {booking.propertyLocation}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-outline-variant/10 pt-4 text-xs">
                    <div>
                      <p className="text-on-surface-variant font-medium">Check-in</p>
                      <p className="font-bold text-on-surface mt-0.5">{booking.checkIn}</p>
                      <p className="text-[10px] text-on-surface-variant">Dari 14:00</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant font-medium">Check-out</p>
                      <p className="font-bold text-on-surface mt-0.5">{booking.checkOut}</p>
                      <p className="text-[10px] text-on-surface-variant">Sebelum 12:00</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant font-medium">Durasi</p>
                      <p className="font-bold text-on-surface mt-0.5">{nights} Malam</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant font-medium">Kamar</p>
                      <p className="font-bold text-on-surface mt-0.5">{booking.roomName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Guest and Billing details */}
          <section className="bg-surface rounded-xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <h3 className="font-headline-md text-base text-primary font-bold border-b border-outline-variant/10 pb-2">
              Detail Pengunjung
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-on-surface-variant font-medium">Nama Tamu Utama</p>
                <p className="font-bold text-on-surface mt-0.5">{booking.guestName}</p>
              </div>
              <div>
                <p className="text-on-surface-variant font-medium">Jumlah Tamu</p>
                <p className="font-bold text-on-surface mt-0.5">{booking.guests}</p>
              </div>
              <div>
                <p className="text-on-surface-variant font-medium">Alamat Email</p>
                <p className="font-bold text-on-surface mt-0.5">{booking.guestEmail}</p>
              </div>
              <div>
                <p className="text-on-surface-variant font-medium">Nomor Telepon</p>
                <p className="font-bold text-on-surface mt-0.5">{booking.guestPhone}</p>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column: QR Boarding Pass & Invoice Summary */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Ticket Pass QR Mock */}
          {booking.status === 'Confirmed' && (
            <div className="bg-primary text-on-primary rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-6">
              <div>
                <h3 className="font-headline-md text-base font-bold">NUS4STAY Boarding Pass</h3>
                <p className="text-xs opacity-80 mt-1">Scan kode QR ini saat check-in di properti</p>
              </div>

              {/* QR Mockup Box */}
              <div className="bg-white p-4 rounded-xl shadow-inner flex items-center justify-center aspect-square w-40">
                {/* SVG mock QR code for high premium detail */}
                <svg className="w-full h-full text-primary" viewBox="0 0 100 100">
                  <path fill="currentColor" d="M0 0h30v30H0zm40 0h20v20H40zm30 0h30v30H70zM10 10v10h10V10zm70 0v10h10V10zM0 40h20v25H0zm30 40h10v20H30zm50 0h20v20H80zM0 70h30v30H0zm10 10v10h10V100zm60-30h10v10H70zm20 0h10v20H90zm-40-5h20v10H50zm10 20h20v10H60zM40 30h10v20H40zm25 15h10v10H65zm15-15h20v10H80zm-15 45h10v10H65z" />
                </svg>
              </div>

              <div className="border-t border-white/20 w-full pt-4 text-xs font-mono">
                <p>N4-TICKET-SERIAL</p>
                <p className="mt-1 font-bold">{booking.id}</p>
              </div>
            </div>
          )}

          {/* Pricing Invoice Summary */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-headline-md text-sm text-on-surface font-bold border-b border-outline-variant/10 pb-2">
              Rincian Pembayaran
            </h3>
            
            <div className="space-y-2 text-xs text-on-surface-variant">
              <div className="flex justify-between">
                <span>Harga Kamar ({nights} malam)</span>
                <span>{formatPrice(booking.totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak &amp; Biaya Layanan</span>
                <span>Rp 0</span>
              </div>
              <div className="flex justify-between font-bold text-on-surface text-sm pt-2 border-t border-outline-variant/10">
                <span>Total Terbayar</span>
                <span className="text-primary">{formatPrice(booking.totalPrice)}</span>
              </div>
            </div>

            <div className="bg-surface rounded-lg p-3 border border-outline-variant/20 flex items-center gap-2 text-xs text-on-surface-variant mt-4">
              <span className="material-symbols-outlined text-primary text-base">verified</span>
              <span>Lunas via {booking.paymentMethod === 'transfer' ? 'Transfer Bank' : booking.paymentMethod === 'card' ? 'Kartu Kredit' : 'E-Wallet'}</span>
            </div>
          </div>

        </aside>
      </div>

    </main>
  );
}
