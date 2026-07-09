import React, { useState, useEffect } from 'react';
import { db } from '../services/db';

export default function SearchResults() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({ search: '', region: '' });
  
  // Local Filter States
  const [priceFilter, setPriceFilter] = useState(3000000);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [tempSearchInput, setTempSearchInput] = useState('');
  const [debouncedSearchInput, setDebouncedSearchInput] = useState('');

  // Extract query from Hash URL
  useEffect(() => {
    function parseHash() {
      const hash = window.location.hash;
      const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
      const params = new URLSearchParams(queryStr);
      
      const search = params.get('search') || '';
      const region = params.get('region') || '';
      
      setSearchParams({ search, region });
      setTempSearchInput(search || region);
      loadProperties({ search, region });
    }

    async function loadProperties(params) {
      setLoading(true);
      const filters = {
        search: params.search,
        region: params.region,
        maxPrice: priceFilter,
        minRating: ratingFilter,
        amenities: selectedAmenities
      };
      const results = await db.getProperties(filters);
      setProperties(results);
      setLoading(false);
    }

    // Run initially
    parseHash();

    // Listen to hash changes
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, [priceFilter, ratingFilter, selectedAmenities]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchInput(tempSearchInput.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [tempSearchInput]);

  useEffect(() => {
    const query = new URLSearchParams();

    if (debouncedSearchInput) {
      query.set('search', debouncedSearchInput);
    }

    const nextHash = query.toString() ? `#/search?${query.toString()}` : '#/search';

    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
  }, [debouncedSearchInput]);

  const handleApplyFilters = () => {
    // When filters are clicked, the dependencies trigger reload automatically,
    // but we can also display a notification or toast
    console.log("Filters applied:", { priceFilter, ratingFilter, selectedAmenities });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const toggleAmenity = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const clearAmenity = (amenity) => {
    setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price).replace("IDR", "Rp");
  };

  const titleLocation = searchParams.search || searchParams.region || "All Destinations";

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 flex flex-col md:flex-row gap-gutter text-left">
      
      <aside className="w-full md:w-[280px] flex-shrink-0 flex flex-col gap-6">
        <div className="bg-surface-container-low border border-outline-variant/30 shadow-sm rounded-xl p-6 flex flex-col gap-6 sticky top-28">
          <div>
            <h2 className="font-headline-md text-headline-md text-primary">Refine Search</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Narrow down your results</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Change Destination</label>
            <div className="flex items-center bg-surface rounded-lg px-3 py-2 border border-outline-variant focus-within:border-primary">
              <span className="material-symbols-outlined icon-pro text-lg text-outline">search</span>
              <input 
                className="bg-transparent border-none text-sm w-full outline-none ml-2 focus:ring-0" 
                placeholder="Where to?" 
                type="text"
                value={tempSearchInput}
                onChange={(e) => setTempSearchInput(e.target.value)}
              />
            </div>
          </form>

          {/* Price Range */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="font-label-md text-label-md text-on-surface font-semibold">Max Price per Night</label>
              <span className="font-label-md text-xs text-primary font-bold">{formatPrice(priceFilter)}</span>
            </div>
            <input 
              type="range" 
              min="500000" 
              max="3000000" 
              step="100000"
              value={priceFilter}
              onChange={(e) => setPriceFilter(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Rating */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Minimum Rating</label>
            <div className="flex gap-2">
              {[0, 4.5, 4.8, 4.9].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setRatingFilter(rating)}
                  className={`flex-1 inline-flex h-9 cursor-pointer items-center justify-center gap-1 rounded-lg border text-xs font-semibold transition-all ${
                    ratingFilter === rating
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface border-outline-variant hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  {rating === 0 ? 'Any' : (
                    <>
                      {rating}
                      <span className="material-symbols-outlined icon-pro fill-1 text-[14px] text-tertiary-fixed-dim">star</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities checklist */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Popular Amenities</label>
            <div className="flex flex-col gap-2.5">
              {["Private Pool", "Oceanfront", "Ski-in/out", "Hot Tub", "Wi-Fi", "Chef Pribadi"].map((amenity) => (
                <label key={amenity} className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedAmenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="rounded text-primary focus:ring-primary border-outline-variant"
                  />
                  {amenity}
                </label>
              ))}
            </div>
          </div>

          <button 
            type="button"
            className="w-full font-label-md text-label-md bg-primary text-on-primary py-3 rounded-lg hover:bg-primary-container transition-colors active:scale-95 shadow-sm font-semibold mt-2" 
            onClick={handleApplyFilters}
          >
            Apply Filters
          </button>
        </div>
      </aside>

      {/* Results Main Section */}
      <section className="flex-grow flex flex-col gap-6">
        
        {/* Results Header Bar */}
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-level-1 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/10 bg-primary-fixed/35 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
              <span className="material-symbols-outlined icon-pro text-[21px]">search</span>
            </div>
            <div>
              <h1 className="font-headline-md text-headline-md text-on-surface capitalize">Stays in {titleLocation}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                {properties.length} properties available
              </p>
            </div>
          </div>
        </div>

        {/* Active Filters Chips */}
        {selectedAmenities.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-label-md text-xs text-on-surface-variant mr-2">Active:</span>
            {selectedAmenities.map((amenity) => (
              <span 
                key={amenity}
                onClick={() => clearAmenity(amenity)}
                className="bg-primary/10 text-primary px-3 py-1 rounded-full font-label-md text-xs flex items-center gap-1 cursor-pointer hover:bg-primary/20 transition-all font-semibold"
              >
                {amenity} <span className="material-symbols-outlined icon-pro text-[14px]">close</span>
              </span>
            ))}
            <button 
              className="text-xs text-primary underline font-semibold ml-2 hover:opacity-80"
              onClick={() => setSelectedAmenities([])}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Properties List */}
        {loading ? (
          <div className="py-20 text-center font-body-md text-on-surface-variant">Loading properties...</div>
        ) : properties.length === 0 ? (
          <div className="bg-surface-container-low rounded-xl p-12 text-center border border-dashed border-outline-variant">
            <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-outline shadow-sm">
              <span className="material-symbols-outlined icon-pro text-[32px]">hotel</span>
            </span>
            <h3 className="font-headline-md text-lg text-on-surface mb-1 font-bold">No stays found</h3>
            <p className="font-body-md text-sm text-on-surface-variant max-w-sm mx-auto">
              Try adjusting your price filters, selecting fewer amenities, or searching for a different destination.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {properties.map((prop) => (
              <div 
                key={prop.id}
                className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-level-1 hover:shadow-level-2 transition-all duration-300 border border-outline-variant/30 flex flex-col md:flex-row group"
              >
                {/* Image Section */}
                <div className="relative w-full md:w-1/3 aspect-[4/3] md:aspect-auto md:min-h-[220px] overflow-hidden cursor-pointer" onClick={() => window.location.hash = `#/detail/${prop.id}`}>
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

                {/* Content Section */}
                <div className="p-6 flex-grow flex flex-col justify-between md:w-2/3">
                  <div>
                    <h3 
                      className="font-headline-md text-headline-md text-on-surface hover:text-primary transition-colors cursor-pointer"
                      onClick={() => window.location.hash = `#/detail/${prop.id}`}
                    >
                      {prop.name}
                    </h3>
                    <div className="flex items-center gap-1 text-on-surface-variant mb-4 mt-2">
                      <span className="material-symbols-outlined icon-pro text-[16px] text-primary">location_on</span>
                      <span className="font-body-md text-body-md text-sm">{prop.location}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {prop.amenities.map((amenity, index) => (
                        <span 
                          key={index}
                          className="bg-surface-container-low text-primary px-3 py-1 rounded-full font-label-md text-xs flex items-center gap-1"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-t border-outline-variant/30 pt-4 mt-4">
                    <div>
                      <span className="font-price-display text-price-display text-on-surface font-bold">
                        {formatPrice(prop.price)}
                      </span>
                      <span className="font-body-md text-body-md text-on-surface-variant text-sm"> / malam</span>
                    </div>
                    <a 
                      className="font-label-md text-label-md bg-primary text-on-primary px-6 py-2.5 rounded-lg hover:bg-primary-container transition-all flex items-center justify-center font-bold active:scale-95 transition-transform" 
                      href={`#/detail/${prop.id}`}
                    >
                      View Details
                      <span className="material-symbols-outlined icon-pro ml-1 text-[16px]">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
