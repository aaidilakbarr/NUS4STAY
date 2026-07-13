import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import RoomBookingModal from '../components/RoomBookingModal';
import StarRating from '../components/StarRating';

export default function PropertyDetail() {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomModal, setRoomModal] = useState(null);

  useEffect(() => {
    async function loadProperty() {
      const hash = window.location.hash;
      const parts = hash.split('/');
      // Expected: #/detail/:id
      const id = parts[parts.length - 1]?.split('?')[0] || '';
      
      setLoading(true);
      const data = await db.getPropertyById(id);
      setProperty(data);
      setLoading(false);
    }

    loadProperty();
    window.addEventListener('hashchange', loadProperty);
    return () => window.removeEventListener('hashchange', loadProperty);
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price).replace("IDR", "Rp");
  };

  const formatReviewDate = (value) => {
    if (!value) return '';
    return new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${value}T00:00:00Z`));
  };

  const galleryImages = property?.images?.length
    ? property.images
    : [property?.image].filter(Boolean);

  if (loading) {
    return <div className="py-20 text-center font-body-md text-on-surface-variant">Loading property details...</div>;
  }

  if (!property) {
    return (
      <div className="py-20 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-[48px] text-error mb-2">warning</span>
        <h3 className="font-headline-md text-lg font-bold mb-1">Property Not Found</h3>
        <a href="#/" className="text-primary underline">Return Home</a>
      </div>
    );
  }

  return (
    <main className="page-shell py-6 text-left md:py-10">
      {/* Breadcrumbs */}
      <div className="mb-4 flex items-center overflow-x-auto whitespace-nowrap pb-1 font-label-md text-xs text-on-surface-variant">
        <a className="hover:text-primary transition-colors" href="#/">Discover</a>
        <span className="material-symbols-outlined mx-2 text-sm">chevron_right</span>
        <a className="hover:text-primary transition-colors" href="#/search">Stays</a>
        <span className="material-symbols-outlined mx-2 text-sm">chevron_right</span>
        <span className="text-on-background font-medium">{property.name}</span>
      </div>

      {/* Title Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline-xl text-headline-xl-mobile md:text-3xl text-primary font-bold mb-2">
            {property.name}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">location_on</span>
            {property.location}
          </p>
        </div>
        <button
          type="button"
          onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-tertiary/20 bg-tertiary-container/60 px-3.5 py-2 text-sm text-on-tertiary-container transition-colors hover:bg-tertiary-container"
        >
          <span className="material-symbols-outlined fill-1 text-[19px] text-tertiary" aria-hidden="true">star</span>
          <span className="font-bold">{property.reviewCount > 0 ? property.rating.toFixed(1) : 'Baru'}</span>
          <span className="text-xs opacity-75">
            {property.reviewCount > 0 ? `${property.reviewCount} ulasan` : 'Belum ada ulasan'}
          </span>
        </button>
      </div>

      {/* Image Gallery Bento Grid */}
      <div className="mb-10 grid h-[320px] grid-cols-1 gap-3 md:h-[500px] md:grid-cols-3 md:gap-4">
        {/* Main large image */}
        <div className="md:col-span-2 md:row-span-2 relative rounded-xl overflow-hidden shadow-sm">
          <img 
            className="w-full h-full object-cover" 
            alt={property.name} 
            src={galleryImages[0] || property.image} 
          />
        </div>
        {/* Secondary images */}
        <div className="relative rounded-xl overflow-hidden shadow-sm hidden md:block">
          {galleryImages[1] ? (
            <img 
              className="w-full h-full object-cover" 
              alt={`${property.name} secondary view`} 
              src={galleryImages[1]} 
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-surface-container-low text-sm text-outline">Belum ada gambar pendukung</div>
          )}
        </div>
        <div className="relative rounded-xl overflow-hidden shadow-sm hidden md:block">
          {galleryImages[2] ? (
            <img 
              className="w-full h-full object-cover" 
              alt={`${property.name} tertiary view`} 
              src={galleryImages[2]} 
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-surface-container-low text-sm text-outline">Belum ada gambar pendukung</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-9 lg:grid-cols-3 lg:gap-12">
        {/* Left Column: Details & Rooms */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* About description */}
          <section>
            <h2 className="font-headline-lg text-2xl text-primary mb-4 border-b border-surface-container-highest pb-2 font-bold">
              About This Property
            </h2>
            <p className="font-body-lg text-body-md text-on-surface-variant leading-relaxed">
              {property.description}
            </p>
          </section>

          {/* Amenities */}
          <section>
            <h2 className="font-headline-lg text-2xl text-primary mb-6 border-b border-surface-container-highest pb-2 font-bold">
              Amenities
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {property.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-surface-container-low/50 p-3 rounded-lg">
                  <span className="material-symbols-outlined text-primary text-xl">
                    {amenity.toLowerCase().includes('pool') ? 'pool' : 
                     amenity.toLowerCase().includes('ocean') || amenity.toLowerCase().includes('view') ? 'waves' : 
                     amenity.toLowerCase().includes('wi-fi') ? 'wifi' : 
                     amenity.toLowerCase().includes('chef') ? 'restaurant' : 'check_circle'}
                  </span>
                  <span className="font-body-md text-sm text-on-surface font-medium">{amenity}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Public verified reviews */}
          <section id="reviews" className="scroll-mt-28">
            <div className="mb-6 flex flex-col gap-2 border-b border-surface-container-highest pb-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-tertiary">Guestbook terverifikasi</p>
                <h2 className="mt-1 font-headline-lg text-2xl font-bold text-primary">Cerita setelah menginap</h2>
              </div>
              <p className="text-xs text-on-surface-variant">Hanya dari booking yang sudah lunas dan selesai.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
              <aside className="relative overflow-hidden rounded-2xl bg-primary p-5 text-on-primary shadow-level-1">
                <div className="absolute inset-y-0 left-0 w-1.5 bg-tertiary" aria-hidden="true" />
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-on-primary/65">Nilai tamu</p>
                <p className="mt-3 font-headline-xl text-5xl font-bold leading-none">
                  {property.reviewCount > 0 ? property.rating.toFixed(1) : '—'}
                </p>
                <div className="mt-3">
                  <StarRating value={property.rating} readOnly size="sm" />
                </div>
                <p className="mt-3 text-xs leading-5 text-on-primary/75">
                  {property.reviewCount > 0
                    ? `Dirangkum dari ${property.reviewCount} pengalaman menginap.`
                    : 'Jadilah tamu pertama yang meninggalkan jejak setelah check-out.'}
                </p>
              </aside>

              {property.reviews?.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {property.reviews.map((review) => (
                    <article
                      key={review.reviewId}
                      className="flex min-h-48 flex-col rounded-2xl border border-outline-variant/40 bg-surface p-5 shadow-[0_8px_24px_rgba(23,28,21,0.045)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <StarRating value={review.rating} readOnly size="sm" />
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed/35 px-2.5 py-1 text-[10px] font-bold text-primary">
                          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">verified</span>
                          Tamu terverifikasi
                        </span>
                      </div>
                      <blockquote className="mt-4 flex-1 font-headline-md text-base leading-7 text-on-surface">
                        “{review.comment || `Memberikan ${review.rating} bintang untuk pengalaman menginap ini.`}”
                      </blockquote>
                      <p className="mt-4 border-t border-outline-variant/35 pt-3 text-[11px] text-on-surface-variant">
                        Menginap hingga {formatReviewDate(review.stayedAt)}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-6 text-center">
                  <span className="material-symbols-outlined text-[38px] text-outline" aria-hidden="true">auto_stories</span>
                  <h3 className="mt-3 text-base font-bold text-on-surface">Guestbook masih kosong</h3>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-on-surface-variant">
                    Ulasan pertama akan muncul setelah tamu menyelesaikan masa inapnya.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Available Rooms Section */}
          <section>
            <h2 className="font-headline-lg text-2xl text-primary mb-6 border-b border-surface-container-highest pb-2 font-bold">
              Available Room Types
            </h2>
            <div className="space-y-6">
              {property.rooms?.map((room) => (
                <div 
                  key={room.id}
                  className="bg-surface rounded-xl overflow-hidden border border-outline-variant/30 shadow-level-1 hover:shadow-level-2 transition-all flex flex-col md:flex-row"
                >
                  <div className="md:w-1/3 aspect-[4/3] md:aspect-auto md:min-h-[180px] overflow-hidden">
                    <img 
                      className="w-full h-full object-cover" 
                      alt={room.name} 
                      src={room.image} 
                    />
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between md:w-2/3">
                    <div>
                      <h3 className="font-headline-md text-lg text-on-surface font-bold">{room.name}</h3>
                      <p className="font-body-md text-sm text-on-surface-variant mt-2 mb-4 line-clamp-2">
                        {room.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {room.amenities.map((amen, index) => (
                          <span 
                            key={index}
                            className="bg-primary-fixed/20 text-primary px-3 py-1 rounded-full font-label-md text-xs"
                          >
                            {amen}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-stretch justify-between gap-4 border-t border-outline-variant/20 pt-4 sm:flex-row sm:items-end">
                      <div>
                        <span className="font-price-display text-price-display text-on-surface font-bold">
                          {formatPrice(room.price)}
                        </span>
                        <span className="font-body-md text-xs text-on-surface-variant"> / malam</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:flex">
                        <button
                          type="button"
                          onClick={() => setRoomModal({ room, intent: 'details' })}
                          className="font-label-md text-xs border border-primary text-primary px-4 py-2.5 rounded-lg hover:bg-primary/5 transition-all font-bold active:scale-95"
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          onClick={() => setRoomModal({ room, intent: 'reserve' })}
                          className="font-label-md text-xs bg-primary text-on-primary px-4 py-2.5 rounded-lg hover:bg-primary-container transition-all font-bold active:scale-95 shadow-sm"
                        >
                          Reserve
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column: Dynamic Price Summary Widget */}
        <div className="sticky top-32 space-y-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-body-md text-xs text-on-surface-variant uppercase tracking-wider">Mulai dari</p>
              <h3 className="font-price-display text-2xl text-primary font-bold mt-1">
                {formatPrice(property.price)}
              </h3>
              <p className="font-body-md text-xs text-on-surface-variant">/ malam (all inclusive)</p>
            </div>
            <div className="bg-surface px-3 py-1.5 rounded-lg border border-outline-variant/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-sm fill-1">star</span>
              <span className="font-label-md text-sm text-on-surface font-bold">
                {property.reviewCount > 0 ? property.rating.toFixed(1) : 'Baru'}
              </span>
            </div>
          </div>

          <div className="border-t border-outline-variant/30 pt-4 space-y-3 text-sm text-on-surface-variant">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
              <span>Free Cancellation (up to 48h before)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
              <span>No pre-payment required</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
              <span>Exclusive NUS4STAY Concierge access</span>
            </div>
          </div>

          <button 
            onClick={() => {
              // Direct scroll to room list
              const el = document.querySelector('section:last-of-type');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-label-md text-label-md hover:bg-surface-tint transition-colors shadow-md text-base font-bold active:scale-95 transition-transform"
          >
            Select Room Type
          </button>
        </div>
      </div>

      {roomModal ? (
        <RoomBookingModal
          property={property}
          room={roomModal.room}
          intent={roomModal.intent}
          onClose={() => setRoomModal(null)}
        />
      ) : null}
    </main>
  );
}
