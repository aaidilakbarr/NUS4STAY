import React from 'react';

const navItems = [
  { href: '#/', page: 'landing', label: 'Discover' },
  { href: '#/search', page: 'search', label: 'Search' },
  { href: '#/history', page: 'history', label: 'My Bookings' },
];

export default function Navbar({ currentPage }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-outline-variant/40 bg-surface/85 text-on-surface shadow-[0_12px_40px_rgba(23,28,21,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-container-max items-center justify-between gap-4 px-margin-mobile md:px-margin-desktop">
        <div className="flex min-w-0 items-center gap-4 md:gap-6">
          <a
            aria-label="NUS4STAY home"
            title="NUS4STAY"
            className="group inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-outline-variant/60 bg-surface shadow-[0_8px_24px_rgba(23,28,21,0.06)] transition hover:-translate-y-0.5 hover:border-primary/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95"
            href="#/"
          >
            <img
              src="/logo_nus4stay.svg"
              alt=""
              className="h-8 w-8 object-contain"
            />
            <span className="sr-only">NUS4STAY</span>
          </a>
          <nav
            aria-label="Primary navigation"
            className="hidden items-center rounded-full border border-outline-variant/60 bg-surface-container-low/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] md:flex"
          >
            {navItems.map((item) => {
              const isActive = currentPage === item.page;

              return (
                <a
                  key={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`font-label-md rounded-full px-4 py-2 text-xs transition ${
                    isActive
                      ? 'bg-surface text-primary shadow-sm ring-1 ring-outline-variant/50'
                      : 'text-on-surface-variant hover:bg-surface/75 hover:text-on-surface'
                  }`}
                  href={item.href}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <a
            href="#/history"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-transparent px-2 text-on-surface-variant transition hover:border-outline-variant/60 hover:bg-surface-container-low hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95 sm:px-3"
            aria-label="My Bookings"
          >
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            <span className="font-label-md hidden text-xs sm:inline">My Bookings</span>
          </a>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-on-primary shadow-[0_10px_24px_rgba(52,78,43,0.18)] transition hover:bg-primary-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95 md:px-4">
            <span className="material-symbols-outlined text-[19px]">add_home</span>
            <span className="font-label-md hidden text-xs sm:inline">List Property</span>
          </button>
        </div>
      </div>
    </header>
  );
}
