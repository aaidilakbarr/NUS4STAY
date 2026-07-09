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
      <section className="relative h-[600px] w-full flex items-center justify-center px-margin-mobile md:px-margin-desktop">
        <div className="absolute inset-0 z-0">
          <img 
            className="w-full h-full object-cover" 
            alt="Luxury villa overlooking ocean" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPT4HlUUlLAOrzPIQi4-OdseGuctgVM12F8QGufaOVwZQm3xHcAGTovyHaC5XEArjwVLCw7-TIhR_jelTmgc8q3W2Bv-WBi0XHzHtFpbp-lX1d2c05hKfyiUqPOF3ODQG8cSzlpnF-WmDRPx8j4Q13wVb_yooWEbNLfznR0-XST2XhQz82jfoYnjcYhSp_LAgJmknWQh67rFAPm9Kv8vV9rbCFeiidsETeHyh4UF1TWXUrzdnlvbKs" 
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        <div className="relative z-10 w-full max-w-container-max mx-auto flex flex-col items-center text-center mt-[-40px] px-4">
          <h1 className="font-headline-xl text-headline-xl-mobile md:text-headline-xl text-white mb-6 drop-shadow-lg leading-tight">
            Find Your Perfect Escape
          </h1>
          <p className="font-body-lg text-body-lg text-white/90 mb-10 max-w-2xl drop-shadow-md">
            Discover exclusive villas and premium hotels in the world's most breathtaking destinations.
          </p>

          {/* Search Bar Form */}
          <form 
            onSubmit={handleSearchSubmit}
            className="w-full max-w-4xl bg-surface-container-lowest rounded-2xl md:rounded-full shadow-level-2 border border-outline-variant/30 p-2 flex flex-col md:flex-row items-center gap-2"
          >
            <div className="flex-1 w-full px-6 py-2.5 flex flex-col items-start border-b md:border-b-0 md:border-r border-outline-variant/30">
              <label className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase text-[10px]">Location</label>
              <input 
                className="w-full bg-transparent border-none p-0 focus:ring-0 font-body-md text-body-md text-on-surface placeholder:text-outline outline-none" 
                placeholder="Where are you going?" 
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              />
            </div>
            <div className="flex-1 w-full px-6 py-2.5 flex flex-col items-start border-b md:border-b-0 md:border-r border-outline-variant/30">
              <label className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase text-[10px]">Check in - Check out</label>
              <input 
                className="w-full bg-transparent border-none p-0 focus:ring-0 font-body-md text-body-md text-on-surface placeholder:text-outline outline-none" 
                placeholder="Add dates" 
                type="text"
                value={searchDates}
                onChange={(e) => setSearchDates(e.target.value)}
              />
            </div>
            <div className="flex-1 w-full px-6 py-2.5 flex flex-col items-start">
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
              className="w-full md:w-auto bg-primary hover:bg-surface-tint text-on-primary rounded-full px-8 py-4 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 shadow-md"
            >
              <span className="material-symbols-outlined icon-pro fill-1 text-[20px]">search</span>
              <span className="font-label-md text-label-md">Search</span>
            </button>
          </form>
        </div>
      </section>

      {/* Top-Rated Villas (Bento Grid) */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-8 text-left">Top Picked Villas</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-card-gap md:h-[600px] h-[1200px]">
          {destinations.map((dest, idx) => {
            // Determine bento layout classes based on index
            let bentoClass = "rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm hover:shadow-level-2 transition-all duration-300";
            if (idx === 0) bentoClass += " md:col-span-2 md:row-span-2";
            else if (idx === 1) bentoClass += " md:col-span-2 md:row-span-1";
            else bentoClass += " md:col-span-1 md:row-span-1";

            return (
              <div 
                key={dest.id}
                className={`${bentoClass} animate-fade-in-up transition-smooth ${idx === 0 ? 'stagger-1' : idx === 1 ? 'stagger-2' : idx === 2 ? 'stagger-3' : 'stagger-4'}`}
                onClick={() => handleDestinationClick(dest)}
              >
                <img 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  alt={dest.name}
                  src={dest.image} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 text-left">
                  <h3 className="font-headline-md text-headline-md text-white mb-1">{dest.name}</h3>
                  <p className="font-body-md text-body-md text-white/80">
                    {dest.propertiesCount} properties
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top-Rated Villas Section */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto bg-surface-container-low rounded-[2rem] my-10">
        <div className="flex justify-between items-end mb-8 text-left">
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
              className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-level-1 hover:shadow-level-2 transition-smooth group flex flex-col text-left animate-scale-in"
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
                <div className="flex justify-between items-end border-t border-outline-variant/30 pt-4 mt-auto">
                  <div>
                    <span className="font-price-display text-price-display text-on-surface font-bold">
                      {formatPrice(prop.price)}
                    </span>
                    <span className="font-body-md text-body-md text-on-surface-variant text-sm"> / malam</span>
                  </div>
                  <a 
                    className="font-label-md text-label-md bg-transparent border border-primary text-primary px-5 py-2.5 rounded-full hover:bg-primary-fixed/10 hover:-translate-y-0.5 transition-bounce flex items-center justify-center font-bold active:scale-95" 
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
