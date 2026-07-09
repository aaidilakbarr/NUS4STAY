import React, { useState, useEffect } from 'react';
import { db } from '../services/db';

export default function PropertyDetail() {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 text-left">
      {/* Breadcrumbs */}
      <div className="flex items-center text-on-surface-variant font-label-md text-xs mb-4">
        <a className="hover:text-primary transition-colors" href="#/">Discover</a>
        <span className="material-symbols-outlined mx-2 text-sm">chevron_right</span>
        <a className="hover:text-primary transition-colors" href="#/search">Stays</a>
        <span className="material-symbols-outlined mx-2 text-sm">chevron_right</span>
        <span className="text-on-background font-medium">{property.name}</span>
      </div>

      {/* Title Header */}
      <div className="mb-6">
        <h1 className="font-headline-xl text-headline-xl-mobile md:text-3xl text-primary font-bold mb-2">
          {property.name}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">location_on</span>
          {property.location}
        </p>
      </div>

      {/* Image Gallery Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 h-[350px] md:h-[500px]">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
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
                    <div className="flex justify-between items-end border-t border-outline-variant/20 pt-4">
                      <div>
                        <span className="font-price-display text-price-display text-on-surface font-bold">
                          {formatPrice(room.price)}
                        </span>
                        <span className="font-body-md text-xs text-on-surface-variant"> / malam</span>
                      </div>
                      <div className="flex gap-2">
                        <a 
                          className="font-label-md text-xs border border-primary text-primary px-4 py-2.5 rounded-lg hover:bg-primary/5 transition-all font-bold active:scale-95"
                          href={`#/room/${property.id}/${room.id}`}
                        >
                          View Details
                        </a>
                        <a 
                          className="font-label-md text-xs bg-primary text-on-primary px-4 py-2.5 rounded-lg hover:bg-primary-container transition-all font-bold active:scale-95 shadow-sm"
                          href={`#/checkout/${property.id}/${room.id}`}
                        >
                          Reserve
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column: Dynamic Price Summary Widget */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-sm sticky top-28 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-body-md text-xs text-on-surface-variant uppercase tracking-wider">Prices From</p>
              <h3 className="font-price-display text-2xl text-primary font-bold mt-1">
                {formatPrice(property.price)}
              </h3>
              <p className="font-body-md text-xs text-on-surface-variant">/ malam (all inclusive)</p>
            </div>
            <div className="bg-surface px-3 py-1.5 rounded-lg border border-outline-variant/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-sm fill-1">star</span>
              <span className="font-label-md text-sm text-on-surface font-bold">{property.rating}</span>
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
    </main>
  );
}
