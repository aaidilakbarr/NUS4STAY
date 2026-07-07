import React, { useState, useEffect } from 'react';
import { db } from '../services/db';

export default function RoomDetail() {
  const [property, setProperty] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states for booking summary widget
  const [checkInDate, setCheckInDate] = useState('2024-10-15');
  const [checkOutDate, setCheckOutDate] = useState('2024-10-18');
  const [guests, setGuests] = useState('2 Dewasa');

  useEffect(() => {
    async function loadRoomDetails() {
      const hash = window.location.hash;
      const parts = hash.split('/');
      // Expected format: #/room/:propertyId/:roomId
      const propertyId = parts[parts.length - 2] || '';
      const roomId = parts[parts.length - 1]?.split('?')[0] || '';

      setLoading(true);
      const propData = await db.getPropertyById(propertyId);
      if (propData) {
        setProperty(propData);
        const roomData = propData.rooms?.find(r => r.id === roomId);
        setRoom(roomData || null);
      }
      setLoading(false);
    }

    loadRoomDetails();
    window.addEventListener('hashchange', loadRoomDetails);
    return () => window.removeEventListener('hashchange', loadRoomDetails);
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price).replace("IDR", "Rp");
  };

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 1;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diff = end.getTime() - start.getTime();
    const nights = Math.ceil(diff / (1000 * 3600 * 24));
    return nights > 0 ? nights : 1;
  };

  const handleBookNow = () => {
    const query = new URLSearchParams();
    query.set('checkIn', checkInDate);
    query.set('checkOut', checkOutDate);
    query.set('guests', guests);
    window.location.hash = `#/checkout/${property.id}/${room.id}?${query.toString()}`;
  };

  if (loading) {
    return <div className="py-20 text-center font-body-md text-on-surface-variant">Loading room details...</div>;
  }

  if (!property || !room) {
    return (
      <div className="py-20 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-[48px] text-error mb-2">warning</span>
        <h3 className="font-headline-md text-lg font-bold mb-1">Room Not Found</h3>
        <a href="#/" className="text-primary underline">Return Home</a>
      </div>
    );
  }

  const nights = calculateNights();
  const totalPrice = room.price * nights;

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 text-left">
      
      {/* Breadcrumb & Title */}
      <div className="mb-8">
        <div className="flex items-center text-on-surface-variant font-label-md text-xs mb-3">
          <a className="hover:text-primary transition-colors" href="#/">Discover</a>
          <span className="material-symbols-outlined mx-2 text-sm">chevron_right</span>
          <a className="hover:text-primary transition-colors" href={`#/detail/${property.id}`}>{property.name}</a>
          <span className="material-symbols-outlined mx-2 text-sm">chevron_right</span>
          <span className="text-on-background font-medium">{room.name}</span>
        </div>
        <h1 className="font-headline-xl text-headline-xl-mobile md:text-3xl text-primary font-bold mb-2">
          {room.name}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">location_on</span>
          {property.location}
        </p>
      </div>

      {/* Hero Gallery Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 h-[350px] md:h-[500px]">
        <div className="md:col-span-2 md:row-span-2 relative rounded-xl overflow-hidden shadow-sm">
          <img 
            className="w-full h-full object-cover" 
            alt={room.name} 
            src={room.image} 
          />
        </div>
        <div className="relative rounded-xl overflow-hidden shadow-sm hidden md:block">
          <img 
            className="w-full h-full object-cover" 
            alt="Room detail view" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBsc5jf1_kaXY_cBC2FjtybWt36Y6otnwwFTG-mVetccMP0id9p14q2aOSPH_evhzlsgrsjALLRzEhv_vlZqAcNs7hh19BAf0Lzw1FPa-Oi7rJ35k0OjobgUkhS81SyxzNK8P1k7Pur0G5H2NUtE9L5sXXc1tXXJxivrhrdGOBYWn7jOBKY4uIncKxJFxEv67qiN6qMXWUIpW8RZdLv9I5Px51DnqLEXkOytpwyMuG22wTSfbvxBY0D" 
          />
        </div>
        <div className="relative rounded-xl overflow-hidden shadow-sm hidden md:block">
          <img 
            className="w-full h-full object-cover" 
            alt="Room bathroom view" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqAAEkV9HUXIDbdwIEPmJqnpANFv-r6bw7XX1RMJgZby53nw7als7yY5Nlb8uL1wt5Whq1xAEelgVoSO3BGJBWi2FhDEdqoPrhzFQqM3IuJJ4BEA_-nkP4Ac_y9DzmmpbV8uQeQ7na7de4rzVXS_S54WttB-33wfzDuY-WWN_bJ7hSnHKL8cL-ZXwP2Du--ABkorNPK00_uTTfJyrW_bUSgCcsgnM7_4PnX2F4weRAgT_8GyPlNiRi" 
          />
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start relative">
        {/* Left Column: Details & Amenities */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Room Description */}
          <section>
            <h2 className="font-headline-lg text-2xl text-primary mb-4 border-b border-surface-container-highest pb-2 font-bold">
              Tentang Kamar Ini
            </h2>
            <p className="font-body-lg text-body-md text-on-surface-variant leading-relaxed">
              {room.description} Desain kamar ini memadukan kemewahan tropis dengan kenyamanan modern, ideal untuk istirahat optimal Anda. Nikmati pencahayaan alami yang cerah, seprai berkualitas tinggi, dan fasilitas premium lengkap yang disiapkan secara detail untuk menjamin kepuasan menginap.
            </p>
          </section>

          {/* Room Specific Amenities */}
          <section>
            <h2 className="font-headline-lg text-2xl text-primary mb-6 border-b border-surface-container-highest pb-2 font-bold">
              Fasilitas Utama
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {room.amenities.map((amen, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="bg-surface-container-highest p-2.5 rounded-lg text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">
                      {amen.toLowerCase().includes('bed') ? 'bed' : 
                       amen.toLowerCase().includes('ac') ? 'ac_unit' : 
                       amen.toLowerCase().includes('tv') ? 'tv' : 
                       amen.toLowerCase().includes('kerja') ? 'desk' : 
                       amen.toLowerCase().includes('balkon') ? 'balcony' : 
                       amen.toLowerCase().includes('bathtub') || amen.toLowerCase().includes('jacuzzi') ? 'hot_tub' : 'check_circle'}
                    </span>
                  </div>
                  <span className="font-body-md text-sm text-on-surface font-semibold">{amen}</span>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column: Reservation Widget */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-sm sticky top-28 space-y-6">
          <div className="flex justify-between items-end border-b border-outline-variant/30 pb-4">
            <div>
              <span className="font-price-display text-2xl text-primary font-bold">
                {formatPrice(room.price)}
              </span>
              <span className="font-body-md text-xs text-on-surface-variant"> / malam</span>
            </div>
          </div>

          {/* Reservation Inputs */}
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-xs text-on-surface font-semibold">Check-in</label>
              <input 
                type="date" 
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-xs text-on-surface font-semibold">Check-out</label>
              <input 
                type="date" 
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-xs text-on-surface font-semibold">Tamu</label>
              <input 
                type="text" 
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                placeholder="Jumlah Tamu"
                className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="border-t border-outline-variant/20 pt-4 space-y-2 text-sm text-on-surface-variant">
            <div className="flex justify-between">
              <span>{formatPrice(room.price)} x {nights} malam</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Layanan (0%)</span>
              <span>Rp 0</span>
            </div>
            <div className="flex justify-between font-bold text-on-surface text-base pt-2 border-t border-outline-variant/10">
              <span>Total Estimasi</span>
              <span className="text-primary">{formatPrice(totalPrice)}</span>
            </div>
          </div>

          <button 
            onClick={handleBookNow}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-label-md text-label-md hover:bg-surface-tint transition-colors shadow-md text-base font-bold active:scale-95 transition-transform"
          >
            Pesan Sekarang
          </button>
        </div>
      </div>
    </main>
  );
}
