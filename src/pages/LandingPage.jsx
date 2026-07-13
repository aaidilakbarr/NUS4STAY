import React, { useState, useEffect } from 'react';
import { db } from '../services/db';

export default function LandingPage() {
  const [destinations, setDestinations] = useState([]);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDates, setSearchDates] = useState('');
  const [searchGuests, setSearchGuests] = useState('');

  useEffect(() => {
    async function loadData() {
      const props = await db.getProperties();
      const topRated = props.sort((a, b) => b.rating - a.rating).slice(0, 4);
      setDestinations(topRated);
      const featured = props.sort((a, b) => b.rating - a.rating).slice(0, 3);
      setFeaturedProperties(featured);
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (searchLocation) query.set('search', searchLocation);
    if (searchDates) query.set('dates', searchDates);
    if (searchGuests) query.set('guests', searchGuests);
    window.location.hash = `#/search?${query.toString()}`;
  };

  const handleDestinationClick = (property) => {
    const region = property.region?.trim();
    const search = property.location?.trim() || property.name?.trim() || '';
    const query = new URLSearchParams();

    if (region) {
      query.set('region', region);
    } else if (search) {
      query.set('search', search);
    }

    window.location.hash = `#/search?${query.toString()}`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price).replace("IDR", "Rp");
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative flex min-h-[690px] w-full items-center justify-center overflow-hidden px-margin-mobile py-14 md:min-h-[610px] md:px-margin-desktop md:py-20">
        <div className="absolute inset-0 z-0">
          <img 
            className="w-full h-full object-cover" 
            alt="Luxury villa overlooking ocean" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPT4HlUUlLAOrzPIQi4-OdseGuctgVM12F8QGufaOVwZQm3xHcAGTovyHaC5XEArjwVLCw7-TIhR_jelTmgc8q3W2Bv-WBi0XHzHtFpbp-lX1d2c05hKfyiUqPOF3ODQG8cSzlpnF-WmDRPx8j4Q13wVb_yooWEbNLfznR0-XST2XhQz82jfoYnjcYhSp_LAgJmknWQh67rFAPm9Kv8vV9rbCFeiidsETeHyh4UF1TWXUrzdnlvbKs" 
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-container-max flex-col items-center px-0 text-center md:px-4">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white/80">Handpicked stays · Seamless booking</p>
          <h1 className="font-headline-xl text-headline-xl-mobile md:text-headline-xl mb-5 max-w-3xl text-white drop-shadow-lg leading-tight">
            Find Your Perfect Escape
          </h1>
          <p className="font-body-lg mb-8 max-w-2xl text-base text-white/90 drop-shadow-md md:text-lg">
            Discover exclusive villas and premium hotels in the world's most breathtaking destinations.
          </p>

          {/* Search Bar Form */}
          <form 
            onSubmit={handleSearchSubmit}
            className="flex w-full max-w-5xl flex-col items-center gap-1 rounded-2xl border border-white/50 bg-surface-container-lowest p-2 shadow-level-2 md:flex-row md:rounded-3xl"
          >
            <div className="flex w-full flex-1 flex-col items-start border-b border-outline-variant/50 px-4 py-3 md:border-b-0 md:border-r md:px-5">
              <label className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase text-[10px]">Location</label>
              <input 
                className="w-full bg-transparent border-none p-0 focus:ring-0 font-body-md text-body-md text-on-surface placeholder:text-outline outline-none" 
                placeholder="Where are you going?" 
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              />
            </div>
            <div className="flex w-full flex-1 flex-col items-start border-b border-outline-variant/50 px-4 py-3 md:border-b-0 md:border-r md:px-5">
              <label className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase text-[10px]">Check in - Check out</label>
              <input 
                className="w-full bg-transparent border-none p-0 focus:ring-0 font-body-md text-body-md text-on-surface placeholder:text-outline outline-none" 
                placeholder="Add dates" 
                type="text"
                value={searchDates}
                onChange={(e) => setSearchDates(e.target.value)}
              />
            </div>
            <div className="flex w-full flex-1 flex-col items-start px-4 py-3 md:px-5">
              <label className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase text-[10px]">Guests</label>
              <input 
                className="w-full bg-transparent border-none p-0 focus:ring-0 font-body-md text-body-md text-on-surface placeholder:text-outline outline-none" 
                placeholder="Add guests" 
                type="text"
                value={searchGuests}
                onChange={(e) => setSearchGuests(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-on-primary shadow-md transition-all duration-200 hover:bg-surface-tint active:scale-95 md:w-auto md:rounded-2xl"
            >
              <span className="material-symbols-outlined icon-pro fill-1 text-[20px]">search</span>
              <span className="font-label-md text-label-md">Search</span>
            </button>
          </form>
        </div>
      </section>

      {/* Top-Rated Villas (Bento Grid) */}
      <section className="page-shell py-14 md:py-20">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-tertiary">Explore by destination</p>
            <h2 className="font-headline-lg text-3xl text-on-surface md:text-4xl">Top Picked Villas</h2>
          </div>
        </div>
        <div className="grid auto-rows-[280px] grid-cols-1 gap-4 md:h-[600px] md:grid-cols-4 md:grid-rows-2 md:gap-card-gap">
          {destinations.map((dest, idx) => {
            // Determine bento layout classes based on index
            let bentoClass = "interactive-card rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm hover:shadow-level-2";
            if (idx === 0) bentoClass += " md:col-span-2 md:row-span-2";
            else if (idx === 1) bentoClass += " md:col-span-2 md:row-span-1";
            else bentoClass += " md:col-span-1 md:row-span-1";

            return (
              <button
                type="button"
                key={dest.id}
                className={`${bentoClass} animate-fade-in-up text-left transition-smooth ${idx === 0 ? 'stagger-1' : idx === 1 ? 'stagger-2' : idx === 2 ? 'stagger-3' : 'stagger-4'}`}
                onClick={() => handleDestinationClick(dest)}
              >
                <img 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  alt={dest.name}
                  src={dest.image} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 text-left">
                  <span className="font-headline-md mb-1 block text-headline-md text-white">{dest.name}</span>
                  <span className="font-body-md block text-body-md text-white/80">
                    {dest.propertiesCount} properties
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Top-Rated Villas Section */}
      <section className="page-shell mb-14 rounded-3xl bg-surface-container-low px-5 py-12 md:mb-20 md:px-10 md:py-16">
        <div className="mb-8 flex items-end justify-between gap-5 text-left">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Top Rated Villas</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Handpicked luxury for your next getaway.</p>
          </div>
          <a 
            href="#/search" 
            className="hidden md:flex items-center gap-2 text-primary font-label-md text-label-md hover:opacity-80 transition-all font-semibold"
          >
            View All <span className="material-symbols-outlined icon-pro text-[18px]">arrow_forward</span>
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-card-gap">
          {featuredProperties.map((prop) => (
            <div 
              key={prop.id}
              className="interactive-card group flex flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest text-left shadow-level-1 animate-scale-in"
            >
              <div className="relative aspect-[4/3] overflow-hidden cursor-pointer" onClick={() => window.location.hash = `#/detail/${prop.id}`}>
                <img 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  alt={prop.name} 
                  src={prop.image} 
                />
                <div className="absolute top-4 right-4 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined icon-pro text-tertiary-fixed-dim text-sm fill-1">star</span>
                  <span className="font-label-md text-label-md text-on-surface">{prop.rating}</span>
                </div>
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <h3 
                    className="font-headline-md text-headline-md text-on-surface truncate pr-4 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => window.location.hash = `#/detail/${prop.id}`}
                  >
                    {prop.name}
                  </h3>
                  <div className="flex items-center gap-1 text-on-surface-variant mb-4 mt-2">
                    <span className="material-symbols-outlined icon-pro text-[16px] text-primary">location_on</span>
                    <span className="font-body-md text-body-md text-sm">{prop.location}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {prop.amenities.slice(0, 2).map((amenity, index) => (
                      <span 
                        key={index}
                        className="bg-primary-fixed/20 text-primary px-3 py-1 rounded-full font-label-md text-xs flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined icon-pro text-[14px]">
                          {amenity.toLowerCase().includes('pool') ? 'pool' : 'waves'}
                        </span> 
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-auto flex flex-col items-stretch justify-between gap-4 border-t border-outline-variant/30 pt-4 sm:flex-row sm:items-end">
                  <div>
                    <span className="font-price-display text-price-display text-on-surface font-bold">
                      {formatPrice(prop.price)}
                    </span>
                    <span className="font-body-md text-body-md text-on-surface-variant text-sm"> / malam</span>
                  </div>
                  <a 
                    className="font-label-md text-label-md flex min-h-11 items-center justify-center rounded-xl border border-primary bg-transparent px-5 py-2.5 font-bold text-primary transition-bounce hover:-translate-y-0.5 hover:bg-primary-fixed/10 active:scale-95"
                    href={`#/detail/${prop.id}`}
                  >
                    Book
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
