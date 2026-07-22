import React, { useEffect, useRef, useState } from 'react';
import { getAmenityIcon } from '../utils/amenities';

const FALLBACK_ROOM_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBsc5jf1_kaXY_cBC2FjtybWt36Y6otnwwFTG-mVetccMP0id9p14q2aOSPH_evhzlsgrsjALLRzEhv_vlZqAcNs7hh19BAf0Lzw1FPa-Oi7rJ35k0OjobgUkhS81SyxzNK8P1k7Pur0G5H2NUtE9L5sXXc1tXXJxivrhrdGOBYWn7jOBKY4uIncKxJFxEv67qiN6qMXWUIpW8RZdLv9I5Px51DnqLEXkOytpwyMuG22wTSfbvxBY0D',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAqAAEkV9HUXIDbdwIEPmJqnpANFv-r6bw7XX1RMJgZby53nw7als7yY5Nlb8uL1wt5Whq1xAEelgVoSO3BGJBWi2FhDEdqoPrhzFQqM3IuJJ4BEA_-nkP4Ac_y9DzmmpbV8uQeQ7na7de4rzVXS_S54WttB-33wfzDuY-WWN_bJ7hSnHKL8cL-ZXwP2Du--ABkorNPK00_uTTfJyrW_bUSgCcsgnM7_4PnX2F4weRAgT_8GyPlNiRi',
];

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

const getRoomImages = (room) => {
  const storedImages = Array.isArray(room.images) ? room.images : [];
  const images = [...storedImages, room.image, ...FALLBACK_ROOM_IMAGES].filter(Boolean);
  return Array.from(new Set(images));
};

const formatPrice = (price) => (
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price).replace('IDR', 'Rp')
);

export default function RoomBookingModal({ property, room, intent = 'details', onClose }) {
  const closeButtonRef = useRef(null);
  const checkInRef = useRef(null);
  const touchStartX = useRef(null);
  const [activeImage, setActiveImage] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2 Dewasa');
  const [dateError, setDateError] = useState('');

  const roomImages = getRoomImages(room);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') setActiveImage((current) => (current - 1 + roomImages.length) % roomImages.length);
      if (event.key === 'ArrowRight') setActiveImage((current) => (current + 1) % roomImages.length);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, roomImages.length]);

  if (!property || !room) return null;

  const moveImage = (direction) => {
    setActiveImage((current) => (current + direction + roomImages.length) % roomImages.length);
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.changedTouches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;

    const distance = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(distance) > 40) moveImage(distance > 0 ? -1 : 1);
    touchStartX.current = null;
  };

  const handleCheckInChange = (event) => {
    const nextCheckIn = event.target.value;
    setCheckIn(nextCheckIn);
    setDateError('');

    if (checkOut && checkOut <= nextCheckIn) setCheckOut('');
  };

  const handleBookNow = (event) => {
    event.preventDefault();

    if (!checkIn || !checkOut) {
      setDateError('Pilih tanggal check-in dan check-out terlebih dahulu.');
      checkInRef.current?.focus();
      return;
    }

    if (checkOut <= checkIn) {
      setDateError('Tanggal check-out harus setelah tanggal check-in.');
      return;
    }

    const query = new URLSearchParams({ checkIn, checkOut, guests });
    onClose();
    window.location.hash = `#/checkout/${property.id}/${room.id}?${query.toString()}`;
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[#101F0D]/55 px-0 py-0 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-booking-modal-title"
        className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-t-[1.75rem] border border-white/70 bg-surface shadow-[0_28px_90px_rgba(23,28,21,0.25)] sm:rounded-[1.75rem]"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-outline-variant/30 px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <p className="font-label-md text-xs uppercase tracking-[0.16em] text-tertiary">
              {intent === 'reserve' ? 'Atur masa menginap' : 'Detail kamar'}
            </p>
            <h2 id="room-booking-modal-title" className="mt-1 font-headline-md text-xl font-bold text-on-surface sm:text-2xl">
              {room.name}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
              {property.location}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup detail kamar"
            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </header>

        <div className="grid min-h-0 overflow-y-auto lg:grid-cols-[1fr_1.05fr]">
          <div className="p-5 sm:p-7">
            <div
              className="group relative aspect-[16/10] touch-pan-y overflow-hidden rounded-2xl bg-surface-container-low"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <img
                key={roomImages[activeImage]}
                src={roomImages[activeImage]}
                alt={`${room.name} - gambar ${activeImage + 1}`}
                className="h-full w-full select-none object-cover transition-opacity duration-300"
                draggable="false"
              />
              {roomImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => moveImage(-1)}
                    aria-label="Gambar sebelumnya"
                    className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#101F0D]/65 text-white opacity-100 shadow-lg transition hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(1)}
                    aria-label="Gambar berikutnya"
                    className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#101F0D]/65 text-white opacity-100 shadow-lg transition hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#101F0D]/60 px-3 py-1.5 backdrop-blur-sm">
                    {roomImages.map((image, index) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        aria-label={`Tampilkan gambar ${index + 1}`}
                        aria-current={activeImage === index ? 'true' : undefined}
                        className={`h-1.5 rounded-full transition-all ${activeImage === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60 hover:bg-white'}`}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {roomImages.length > 1 ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {roomImages.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Pilih gambar ${index + 1}`}
                    className={`aspect-[4/3] overflow-hidden rounded-xl border-2 transition ${activeImage === index ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}

            <section className="mt-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-on-surface-variant">Harga kamar</p>
                  <p className="mt-1 font-price-display text-2xl font-bold text-primary">
                    {formatPrice(room.price)}
                    <span className="ml-1 font-body-md text-xs font-normal text-on-surface-variant">/ malam</span>
                  </p>
                </div>
                <span className="material-symbols-outlined text-[30px] text-primary-fixed-dim">hotel</span>
              </div>

              <h3 className="mt-6 font-headline-md text-lg font-bold text-on-surface">Deskripsi kamar</h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                {room.description || 'Nikmati kamar yang nyaman dengan fasilitas yang disiapkan untuk perjalananmu.'}
              </p>

              <h3 className="mt-6 font-headline-md text-lg font-bold text-on-surface">Fasilitas utama</h3>
              {room.amenities?.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {room.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 rounded-xl bg-primary-fixed/20 border border-primary/20 px-3 py-2 text-xs font-semibold text-primary">
                      <span className="material-symbols-outlined text-[17px]">{getAmenityIcon(amenity)}</span>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-on-surface-variant">Fasilitas kamar belum tersedia.</p>
              )}
            </section>
          </div>

          <form onSubmit={handleBookNow} className="border-t border-outline-variant/30 bg-surface-container-low/55 p-5 sm:p-7 lg:border-l lg:border-t-0">
            <div>
              <p className="font-label-md text-xs uppercase tracking-[0.16em] text-tertiary">Pilih tanggal</p>
              <h3 className="mt-1 font-headline-md text-xl font-bold text-on-surface">Kapan kamu menginap?</h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                {intent === 'reserve'
                  ? 'Tentukan tanggal menginap sebelum melanjutkan ke checkout.'
                  : 'Tanggal yang kamu pilih akan langsung dibawa ke checkout.'}
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="room-modal-check-in" className="font-label-md text-xs font-semibold text-on-surface">Check-in</label>
                <input
                  ref={checkInRef}
                  id="room-modal-check-in"
                  type="text"
                  min={getDateOffset(0)}
                  value={checkIn}
                  onChange={handleCheckInChange}
                  placeholder="Pilih Tanggal Check-in"
                  onFocus={(e) => e.target.type = 'date'}
                  onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                  className="h-12 w-full rounded-xl border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="room-modal-check-out" className="font-label-md text-xs font-semibold text-on-surface">Check-out</label>
                <input
                  id="room-modal-check-out"
                  type="text"
                  min={addDay(checkIn)}
                  value={checkOut}
                  onChange={(event) => {
                    setCheckOut(event.target.value);
                    setDateError('');
                  }}
                  placeholder="Pilih Tanggal Checkout"
                  onFocus={(e) => e.target.type = 'date'}
                  onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                  className="h-12 w-full rounded-xl border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  required
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor="room-modal-guests" className="font-label-md text-xs font-semibold text-on-surface">Tamu</label>
              <input
                id="room-modal-guests"
                type="text"
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                placeholder="Jumlah tamu"
                className="h-12 w-full rounded-xl border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>

            {dateError ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-error/20 bg-error-container/65 px-3 py-2.5 text-sm text-on-error-container" role="alert">
                <span className="material-symbols-outlined mt-0.5 text-[18px]">error</span>
                <p>{dateError}</p>
              </div>
            ) : null}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-outline-variant bg-surface px-5 text-sm font-semibold text-on-surface transition hover:border-primary/30 hover:bg-primary-fixed/15 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary shadow-[0_12px_28px_rgba(52,78,43,0.2)] transition hover:-translate-y-0.5 hover:bg-primary-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-0"
              >
                Pesan sekarang
                <span className="material-symbols-outlined text-[19px]">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
