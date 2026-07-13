import React, { useState, useEffect } from 'react';
import { db } from '../services/db';

export default function Checkout() {
  const [property, setProperty] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [phone, setPhone] = useState('+62 812 3456 7890');
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  
  // Date/guest parameters
  const [checkIn, setCheckIn] = useState('2024-10-15');
  const [checkOut, setCheckOut] = useState('2024-10-18');
  const [guests, setGuests] = useState('2 Dewasa');

  useEffect(() => {
    async function loadData() {
      const hash = window.location.hash;
      const parts = hash.split('?')[0].split('/');
      // Expected format: #/checkout/:propertyId/:roomId
      const propertyId = parts[parts.length - 2] || '';
      const roomId = parts[parts.length - 1] || '';

      const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
      const params = new URLSearchParams(queryStr);
      if (params.get('checkIn')) setCheckIn(params.get('checkIn'));
      if (params.get('checkOut')) setCheckOut(params.get('checkOut'));
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
    if (!checkIn || !checkOut) return 1;
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
    if (!name || !email || !phone) {
      alert("Harap isi semua kolom informasi tamu!");
      return;
    }

    const nights = calculateNights();
    const totalRaw = room.price * nights;
    const serviceFee = 0; // matching mockup
    const finalTotal = totalRaw + serviceFee;

    const bookingData = {
      propertyId: property.id,
      propertyName: property.name,
      propertyLocation: property.location,
      propertyImage: property.image,
      roomId: room.id,
      roomName: room.name,
      checkIn,
      checkOut,
      guests,
      guestName: name,
      guestEmail: email,
      guestPhone: phone,
      paymentMethod,
      totalPrice: finalTotal
    };

    const newBooking = await db.createBooking(bookingData);
    // Redirect to the pending page with the generated booking ID!
    window.location.hash = `#/pending/${newBooking.id}`;
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
          
          {/* Guest Information */}
          <section className="bg-surface rounded-xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <h2 className="font-headline-md text-lg text-primary font-bold border-b border-outline-variant/10 pb-2">
              Informasi Tamu
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                <label className="font-label-md text-xs text-on-surface font-semibold">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-xs text-on-surface font-semibold">Alamat Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-xs text-on-surface font-semibold">Nomor Telepon</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
                  required
                />
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-surface rounded-xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <h2 className="font-headline-md text-lg text-primary font-bold border-b border-outline-variant/10 pb-2">
              Metode Pembayaran
            </h2>
            <div className="flex flex-col gap-3">
              
              <label className={`flex items-center gap-3 p-4 rounded-xl border-1.5 cursor-pointer transition-all ${
                paymentMethod === 'transfer' ? 'border-primary bg-primary-fixed/10' : 'border-outline-variant'
              }`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="transfer" 
                  checked={paymentMethod === 'transfer'} 
                  onChange={() => setPaymentMethod('transfer')}
                  className="text-primary focus:ring-primary"
                />
                <div className="flex-grow flex items-center justify-between">
                  <div>
                    <p className="font-label-md text-sm text-on-surface font-bold">Transfer Bank (Verifikasi Manual)</p>
                    <p className="font-body-md text-xs text-on-surface-variant">Transfer ke Rekening BCA / Mandiri NUS4STAY</p>
                  </div>
                  <span className="material-symbols-outlined text-primary text-xl">payments</span>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 rounded-xl border-1.5 cursor-pointer transition-all ${
                paymentMethod === 'card' ? 'border-primary bg-primary-fixed/10' : 'border-outline-variant'
              }`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="card" 
                  checked={paymentMethod === 'card'} 
                  onChange={() => setPaymentMethod('card')}
                  className="text-primary focus:ring-primary"
                />
                <div className="flex-grow flex items-center justify-between">
                  <div>
                    <p className="font-label-md text-sm text-on-surface font-bold">Kartu Kredit / Debit</p>
                    <p className="font-body-md text-xs text-on-surface-variant">Visa, Mastercard, JCB, American Express</p>
                  </div>
                  <span className="material-symbols-outlined text-primary text-xl">credit_card</span>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 rounded-xl border-1.5 cursor-pointer transition-all ${
                paymentMethod === 'ewallet' ? 'border-primary bg-primary-fixed/10' : 'border-outline-variant'
              }`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="ewallet" 
                  checked={paymentMethod === 'ewallet'} 
                  onChange={() => setPaymentMethod('ewallet')}
                  className="text-primary focus:ring-primary"
                />
                <div className="flex-grow flex items-center justify-between">
                  <div>
                    <p className="font-label-md text-sm text-on-surface font-bold">E-Wallet (OVO, GoPay, Dana)</p>
                    <p className="font-body-md text-xs text-on-surface-variant">Pembayaran instant via kode QR</p>
                  </div>
                  <span className="material-symbols-outlined text-primary text-xl">qr_code_scanner</span>
                </div>
              </label>

            </div>
          </section>

          {/* Action Trigger */}
          <div className="flex justify-end pt-4">
            <button 
              type="submit"
              className="bg-primary text-on-primary font-label-md text-base py-4 px-8 rounded-lg hover:bg-surface-tint transition-all active:scale-[0.98] w-full md:w-auto shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-bold"
            >
              Proses Pembayaran <span className="material-symbols-outlined text-lg">arrow_forward</span>
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
                  <span>{formatPrice(room.price)} x {nights} malam</span>
                  <span className="font-semibold text-on-surface">{formatPrice(roomCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Layanan</span>
                  <span className="font-semibold text-on-surface">{formatPrice(serviceFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-on-surface pt-2 border-t border-outline-variant/10">
                  <span>Total Harga</span>
                  <span className="text-primary text-base">{formatPrice(totalCost)}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}
