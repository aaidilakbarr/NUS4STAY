import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { useAuth } from '../contexts/useAuth';

const getDateOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const addDay = (dateString) => {
  if (!dateString) return getDateOffset(1);

  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + 1);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const createIdempotencyKey = () => (
  globalThis.crypto?.randomUUID?.()
  || `${Date.now()}-${Math.random().toString(16).slice(2)}`
);

const parseGuestCount = (value) => {
  const parsed = Number.parseInt(String(value).match(/\d+/)?.[0] || '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

export default function Checkout() {
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date/guest parameters
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2 Dewasa');
  const [hasPresetDates, setHasPresetDates] = useState(false);
  const [dateError, setDateError] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey] = useState(createIdempotencyKey);

  useEffect(() => {
    async function loadData() {
      const hash = window.location.hash;
      const parts = hash.split('?')[0].split('/');
      // Expected format: #/checkout/:propertyId/:roomId
      const propertyId = parts[parts.length - 2] || '';
      const roomId = parts[parts.length - 1] || '';

      const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
      const params = new URLSearchParams(queryStr);
      const queryCheckIn = params.get('checkIn') || '';
      const queryCheckOut = params.get('checkOut') || '';
      setCheckIn(queryCheckIn);
      setCheckOut(queryCheckOut);
      setHasPresetDates(Boolean(queryCheckIn && queryCheckOut));
      setDateError('');
      if (params.get('guests')) setGuests(params.get('guests'));

      setLoading(true);
      const propData = await db.getPropertyById(propertyId);
      if (propData) {
        setProperty(propData);
        const roomData = propData.rooms?.find(r => r.id === roomId);
        setRoom(roomData || null);
      }
      setLoading(false);
    }

    loadData();
    window.addEventListener('hashchange', loadData);
    return () => window.removeEventListener('hashchange', loadData);
  }, []);

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    const nights = Math.ceil(diff / (1000 * 3600 * 24));
    return nights > 0 ? nights : 1;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price).replace("IDR", "Rp");
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!checkIn || !checkOut) {
      setDateError('Pilih tanggal check-in dan check-out terlebih dahulu.');
      return;
    }

    if (checkOut <= checkIn) {
      setDateError('Tanggal check-out harus setelah tanggal check-in.');
      return;
    }

    setDateError('');
    setCheckoutError('');

    if (!user) {
      setCheckoutError('Sesi login tidak ditemukan. Silakan masuk kembali.');
      return;
    }

    setSubmitting(true);
    try {
      const newBooking = await db.createBooking({
        roomId: room.id,
        checkIn,
        checkOut,
        guestCount: parseGuestCount(guests),
        idempotencyKey,
      });

      window.location.hash = `#/pending/${newBooking.id}`;
    } catch (error) {
      setCheckoutError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center font-body-md text-on-surface-variant">Loading checkout details...</div>;
  }

  if (!property || !room) {
    return (
      <div className="py-20 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-[48px] text-error mb-2">warning</span>
        <h3 className="font-headline-md text-lg font-bold mb-1">Booking Info Invalid</h3>
        <a href="#/" className="text-primary underline">Return Home</a>
      </div>
    );
  }

  const nights = calculateNights();
  const roomCost = room.price * nights;
  const serviceFee = 0;
  const totalCost = roomCost + serviceFee;

  return (
    <main className="page-shell py-8 text-left md:py-12">
      
      {/* Back Button */}
      <button 
        onClick={() => window.history.back()}
        className="flex items-center text-primary font-label-md text-sm hover:underline mb-6 transition-colors"
      >
        <span className="material-symbols-outlined text-base mr-1">arrow_back</span>
        Kembali ke detail kamar
      </button>

      <h1 className="font-headline-xl text-headline-xl-mobile md:text-3xl text-primary font-bold mb-8">
        Booking &amp; Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-card-gap items-start">
        {/* Left Column: Input Forms */}
        <form onSubmit={handleCheckoutSubmit} className="lg:col-span-8 space-y-8">

          {/* Stay Dates */}
          <section className="bg-surface rounded-xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <div className="flex flex-col gap-1 border-b border-outline-variant/10 pb-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <div>
                <h2 className="font-headline-md text-lg text-primary font-bold">Tanggal Menginap</h2>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {hasPresetDates ? 'Tanggal dari detail kamar sudah dipilih.' : 'Pilih tanggal sebelum melanjutkan pembayaran.'}
                </p>
              </div>
              {hasPresetDates ? (
                <button
                  type="button"
                  onClick={() => setHasPresetDates(false)}
                  className="self-start text-xs font-semibold text-primary underline hover:text-primary-container sm:self-auto"
                >
                  Ubah tanggal
                </button>
              ) : null}
            </div>

            {hasPresetDates ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-primary/20 bg-primary-fixed/15 p-3">
                  <p className="text-xs text-on-surface-variant">Check-in</p>
                  <p className="mt-1 font-semibold text-on-surface">{checkIn}</p>
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary-fixed/15 p-3">
                  <p className="text-xs text-on-surface-variant">Check-out</p>
                  <p className="mt-1 font-semibold text-on-surface">{checkOut}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="checkout-check-in" className="font-label-md text-xs text-on-surface font-semibold">Check-in</label>
                  <input
                    id="checkout-check-in"
                    type="date"
                    min={getDateOffset(0)}
                    value={checkIn}
                    onChange={(event) => {
                      setCheckIn(event.target.value);
                      setDateError('');
                      if (checkOut && checkOut <= event.target.value) setCheckOut('');
                    }}
                    className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="checkout-check-out" className="font-label-md text-xs text-on-surface font-semibold">Check-out</label>
                  <input
                    id="checkout-check-out"
                    type="date"
                    min={addDay(checkIn)}
                    value={checkOut}
                    onChange={(event) => {
                      setCheckOut(event.target.value);
                      setDateError('');
                    }}
                    className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    required
                  />
                </div>
              </div>
            )}

            {dateError ? (
              <div className="flex items-start gap-2 rounded-xl border border-error/20 bg-error-container/65 px-3 py-2.5 text-sm text-on-error-container" role="alert">
                <span className="material-symbols-outlined mt-0.5 text-[18px]">error</span>
                <p>{dateError}</p>
              </div>
            ) : null}
          </section>

          {/* Account snapshot */}
          <section className="bg-surface rounded-xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <div className="border-b border-outline-variant/10 pb-2">
              <h2 className="font-headline-md text-lg text-primary font-bold">Informasi Tamu</h2>
              <p className="mt-1 text-xs text-on-surface-variant">Data booking akan menggunakan akun yang sedang login.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-xs text-on-surface-variant">Nama</p>
                <p className="mt-1 font-semibold text-on-surface">{user?.user_metadata?.full_name || 'Tamu NUS4STAY'}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Email</p>
                <p className="mt-1 font-semibold text-on-surface break-all">{user?.email || '-'}</p>
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-surface rounded-xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <h2 className="font-headline-md text-lg text-primary font-bold border-b border-outline-variant/10 pb-2">
              Metode Pembayaran
            </h2>
            <div className="flex items-center gap-3 rounded-xl border border-primary bg-primary-fixed/10 p-4">
              <span className="material-symbols-outlined text-primary text-xl">account_balance</span>
              <div>
                <p className="font-label-md text-sm text-on-surface font-bold">Transfer Bank (Verifikasi Manual)</p>
                <p className="font-body-md text-xs text-on-surface-variant">Bukti pembayaran dapat dikirim setelah booking dibuat.</p>
              </div>
            </div>
          </section>

          {/* Action Trigger */}
          {checkoutError ? (
            <div className="flex items-start gap-2 rounded-xl border border-error/20 bg-error-container/65 px-3 py-2.5 text-sm text-on-error-container" role="alert">
              <span className="material-symbols-outlined mt-0.5 text-[18px]">error</span>
              <p>{checkoutError}</p>
            </div>
          ) : null}

          <div className="flex justify-end pt-4">
            <button 
              type="submit"
              disabled={submitting}
              className="bg-primary text-on-primary font-label-md text-base py-4 px-8 rounded-lg hover:bg-surface-tint transition-all active:scale-[0.98] w-full md:w-auto shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Menyiapkan booking...' : 'Buat booking'}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>

        </form>

        {/* Right Column: Reservation Summary Card */}
        <aside className="space-y-6 lg:sticky lg:top-28 lg:col-span-4">
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
            <div className="aspect-[16/10] overflow-hidden">
              <img 
                src={property.image} 
                alt={property.name} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-primary tracking-wider">{property.region}</p>
                <h3 className="font-headline-md text-base text-on-surface font-bold mt-0.5">{property.name}</h3>
                <p className="font-body-md text-xs text-on-surface-variant mt-1">{room.name}</p>
              </div>

              <div className="border-t border-outline-variant/30 pt-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-on-surface-variant">Check-in</p>
                  <p className="font-bold text-on-surface mt-0.5">{checkIn}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant">Check-out</p>
                  <p className="font-bold text-on-surface mt-0.5">{checkOut}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-on-surface-variant">Tamu</p>
                  <p className="font-bold text-on-surface mt-0.5">{guests}</p>
                </div>
              </div>

              {/* Price calculations */}
              <div className="border-t border-outline-variant/30 pt-4 space-y-2 text-xs text-on-surface-variant">
                <div className="flex justify-between">
                  <span>{nights > 0 ? `${formatPrice(room.price)} x ${nights} malam` : 'Tanggal belum dipilih'}</span>
                  <span className="font-semibold text-on-surface">{nights > 0 ? formatPrice(roomCost) : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Layanan</span>
                  <span className="font-semibold text-on-surface">{formatPrice(serviceFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-on-surface pt-2 border-t border-outline-variant/10">
                  <span>Total Harga</span>
                  <span className="text-primary text-base">{nights > 0 ? formatPrice(totalCost) : '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}
