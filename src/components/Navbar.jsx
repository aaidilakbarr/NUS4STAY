import React from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';

const navItems = [
  { href: '#/', page: 'landing', label: 'Discover' },
  { href: '#/search', page: 'search', label: 'Search' },
  { href: '#/history', page: 'history', label: 'My Bookings' },
];

export default function Navbar({ currentPage }) {
  const { isAuthenticated, user, role } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.hash = '#/';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-outline-variant/40 bg-surface/85 text-on-surface shadow-[0_12px_40px_rgba(23,28,21,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-container-max items-center justify-between gap-4 px-margin-mobile md:px-margin-desktop">
        <div className="flex min-w-0 items-center gap-4 md:gap-6">
          <a
            aria-label="NUS4STAY home"
            title="NUS4STAY"
            className="group inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-outline-variant/60 bg-surface shadow-[0_8px_24px_rgba(23,28,21,0.06)] transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_32px_rgba(23,28,21,0.1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95"
            href="#/"
          >
            <img
              src="/logo_nus4stay.svg"
              alt=""
              className="h-9 w-9 object-contain transition-transform duration-500 group-hover:rotate-[6deg]"
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
                  className={`font-label-md rounded-full px-4 py-2 text-xs transition-all duration-300 ${
                    isActive
                      ? 'bg-surface text-primary shadow-sm ring-1 ring-outline-variant/50'
                      : 'text-on-surface-variant hover:-translate-y-0.5 hover:bg-surface/75 hover:text-on-surface'
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
          {role === 'admin' && (
            <a
              href="#/admin/properties"
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary-fixed/20 px-3 text-primary transition hover:border-primary hover:bg-primary-fixed/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95 sm:px-3"
              aria-label="Admin Panel"
            >
              <span className="material-symbols-outlined icon-pro text-[18px]">admin_panel_settings</span>
              <span className="font-label-md hidden text-xs sm:inline">Admin</span>
            </a>
          )}
          <a
            href="#/history"
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent px-2 text-on-surface-variant transition hover:border-outline-variant/60 hover:bg-surface-container-low hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95 sm:px-3"
            aria-label="My Bookings"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-fixed/25 text-primary">
              <span className="material-symbols-outlined icon-pro text-[18px]">receipt_long</span>
            </span>
            <span className="font-label-md hidden text-xs sm:inline">My Bookings</span>
          </a>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-3 text-on-primary shadow-[0_10px_24px_rgba(52,78,43,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-[0_14px_30px_rgba(52,78,43,0.24)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95 md:px-4"
            >
              <span className="material-symbols-outlined icon-pro text-[19px]">logout</span>
              <span className="font-label-md hidden text-xs sm:inline">{user?.email ?? 'Logout'}</span>
            </button>
          ) : (
            <a href="#/login" className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-3 text-on-primary shadow-[0_10px_24px_rgba(52,78,43,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-[0_14px_30px_rgba(52,78,43,0.24)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95 md:px-4">
              <span className="material-symbols-outlined icon-pro text-[19px]">login</span>
              <span className="font-label-md hidden text-xs sm:inline">Login</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
