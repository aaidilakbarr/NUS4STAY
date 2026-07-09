import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { useAuth } from '../contexts/useAuth';

export default function BookingHistory() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      setLoading(true);
      const data = await db.getBookingHistory();
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setBookings(data);
      setLoading(false);
    }

    loadBookings();
    window.addEventListener('hashchange', loadBookings);
    return () => window.removeEventListener('hashchange', loadBookings);
  }, [user?.id]);

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

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12 text-left">
      <div className="mb-8">
        <h1 className="font-headline-xl font-headline-xl-mobile md:text-3xl text-primary font-bold">Booking History</h1>
        <p className="font-body-md text-on-surface-variant mt-2">Manage and review your accommodation bookings.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center font-body-md text-on-surface-variant">Loading your bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="bg-surface-container-low rounded-xl p-12 text-center border border-dashed border-outline-variant/30">
          <span className="material-symbols-outlined text-[48px] text-outline mb-2">hotel</span>
          <h3 className="font-headline-md text-lg text-on-surface mb-1 font-bold">No bookings found</h3>
          <p className="font-body-md text-sm text-on-surface-variant mb-6 max-w-sm mx-auto">
            You haven't made any bookings yet. Start exploring properties to plan your next retreat.
          </p>
          <a href="#/" className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label-md text-sm hover:opacity-90 inline-block font-bold active:scale-95 shadow-sm">
            Explore Properties
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div 
              key={booking.id}
              className="bg-surface text-on-surface rounded-2xl overflow-hidden shadow-level-1 hover:shadow-level-2 border border-outline-variant/30 transition-all flex flex-col md:flex-row group"
            >
              {/* Thumbnail */}
              <div className="md:w-[220px] aspect-[16/10] md:aspect-auto overflow-hidden">
                <img 
                  src={booking.propertyImage} 
                  alt={booking.propertyName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Booking Info */}
              <div className="p-6 flex-grow flex flex-col justify-between md:flex-row md:items-center gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs text-on-surface-variant font-bold bg-surface-container-low px-2.5 py-1 rounded">
                      ID: {booking.id}
                    </span>
                    <span className={`px-3 py-1 rounded-full font-label-md text-xs font-bold ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline-md text-lg text-on-surface font-bold">{booking.propertyName}</h3>
                    <p className="font-body-md text-xs text-on-surface-variant mt-1">{booking.roomName}</p>
                  </div>
                  <div className="flex gap-x-6 gap-y-1.5 flex-wrap text-xs text-on-surface-variant">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
                      <span>{booking.checkIn} s/d {booking.checkOut}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">group</span>
                      <span>{booking.guests}</span>
                    </div>
                  </div>
                </div>

                {/* Right side: Price & details link */}
                <div className="flex md:flex-col justify-between items-end border-t md:border-t-0 border-outline-variant/10 pt-4 md:pt-0 gap-3">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Total Pembayaran</p>
                    <p className="font-price-display text-lg text-primary font-bold mt-0.5">
                      {formatPrice(booking.totalPrice)}
                    </p>
                  </div>
                  
                  {booking.status === 'Pending' ? (
                    <a 
                      href={`#/pending/${booking.id}`} 
                      className="font-label-md text-xs text-white bg-tertiary px-5 py-2.5 rounded-lg hover:opacity-90 transition-all active:scale-95 text-center font-bold shadow-sm"
                    >
                      Bayar Sekarang
                    </a>
                  ) : (
                    <a 
                      href={`#/history-detail/${booking.id}`} 
                      className="font-label-md text-xs text-on-primary bg-primary px-5 py-2.5 rounded-lg hover:opacity-90 transition-all active:scale-95 text-center flex items-center justify-center gap-1 font-bold shadow-sm"
                    >
                      View Details 
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
