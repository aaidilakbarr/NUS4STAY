import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';
import { useNotifications } from '../contexts/NotificationContext';

const navItems = [
  { href: '#/', page: 'landing', label: 'Discover' },
  { href: '#/search', page: 'search', label: 'Property' },
  { href: '#/history', page: 'history', label: 'My Bookings' },
];

export default function Navbar({ currentPage }) {
  const { isAuthenticated, user, role, profile } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.hash = '#/';
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}j lalu`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const handleBellClick = (e) => {
    e.stopPropagation();
    setNotifOpen((prev) => !prev);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-outline-variant/50 bg-surface/90 text-on-surface shadow-[0_10px_30px_rgba(23,28,21,0.045)] backdrop-blur-xl">
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4 md:gap-6">
          <a
            aria-label="NUS4STAY home"
            title="NUS4STAY"
            className="flex shrink-0 cursor-pointer items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            href="#/"
          >
            <img
              src="/logo_nus4stay.svg"
              alt="NUS4STAY"
              className="h-20 w-auto object-contain"
            />
            <span className="sr-only">NUS4STAY</span>
          </a>
          <nav
            aria-label="Primary navigation"
            className="hidden items-center rounded-full border border-outline-variant/60 bg-surface-container-low/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] md:flex lg:ml-3"
          >
            {navItems.map((item) => {
              const isActive = currentPage === item.page;

              return (
                <a
                  key={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`font-label-md rounded-full px-4 py-2 text-xs transition-all duration-300 ${isActive
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
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <div ref={notifRef} className="relative">
                <button
                  type="button"
                  onClick={handleBellClick}
                  className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-outline-variant/40 text-on-surface-variant transition-all duration-200 hover:bg-surface-container hover:text-on-surface active:scale-95"
                  aria-label="Notifikasi"
                >
                  <span className="material-symbols-outlined icon-pro text-[18px]">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-tight text-on-error shadow-[0_2px_6px_rgba(186,26,26,0.4)]">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right animate-scale-in rounded-2xl border border-outline-variant/40 bg-surface shadow-level-2">
                    <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-3">
                      <h3 className="font-label-md text-sm text-on-surface">Notifikasi</h3>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-xs font-semibold text-primary hover:text-primary-container transition-colors"
                        >
                          Tandai dibaca
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                          <span className="material-symbols-outlined icon-pro text-[32px] text-outline/50">notifications_off</span>
                          <p className="text-sm text-on-surface-variant">Belum ada notifikasi</p>
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.data?.href) window.location.hash = n.data.href;
                            }}
                            className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container-low active:bg-surface-container ${!n.is_read ? 'bg-primary-fixed/15' : ''}`}
                          >
                            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${!n.is_read
                              ? n.type === 'promotion' || n.type === 'promo'
                                ? 'bg-error/10 text-error'
                                : n.type === 'rating_reminder'
                                  ? 'bg-tertiary/10 text-tertiary'
                                  : n.type === 'payment_rejected'
                                    ? 'bg-error/10 text-error'
                                    : 'bg-primary/10 text-primary'
                              : 'bg-surface-container text-on-surface-variant'}`}>
                              <span className="material-symbols-outlined icon-pro text-[16px]">
                                {n.type === 'booking_confirmed' || n.type === 'payment_approved' ? 'check_circle'
                                  : n.type === 'payment_rejected' ? 'cancel'
                                  : n.type === 'rating_reminder' ? 'rate_review'
                                  : n.type === 'promotion' || n.type === 'promo' ? 'campaign'
                                  : n.type === 'booking_pending' ? 'schedule'
                                  : n.type === 'payment_received' ? 'payments'
                                  : 'notifications'}
                              </span>
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>{n.title}</p>
                              <p className="mt-0.5 text-xs text-on-surface-variant/70 line-clamp-2">{n.message}</p>
                              <p className="mt-1 text-[10px] text-outline">{formatTime(n.created_at)}</p>
                            </div>
                            {!n.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                          </button>
                        ))
                      )}
                    </div>
                    <a
                      href="#/profile"
                      onClick={() => setNotifOpen(false)}
                      className="flex items-center justify-center gap-1.5 border-t border-outline-variant/30 px-4 py-3 text-xs font-semibold text-primary transition-colors hover:bg-surface-container-low rounded-b-2xl"
                    >
                      <span className="material-symbols-outlined icon-pro text-[14px]">settings</span>
                      Kelola preferensi notifikasi
                    </a>
                  </div>
                )}
              </div>

              <a
                href="#/profile"
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-3 text-on-primary shadow-[0_10px_24px_rgba(52,78,43,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-[0_14px_30px_rgba(52,78,43,0.24)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95 md:px-4"
              >
                <span className="material-symbols-outlined icon-pro text-[19px]">person</span>
                <span className="font-label-md hidden max-w-40 truncate text-xs sm:inline">{profile?.full_name || user?.email || 'Akun'}</span>
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-outline-variant/40 text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all duration-200 active:scale-95"
                aria-label="Logout"
              >
                <span className="material-symbols-outlined icon-pro text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <a href="#/login" className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-3 text-on-primary shadow-[0_10px_24px_rgba(52,78,43,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-[0_14px_30px_rgba(52,78,43,0.24)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95 md:px-4">
              <span className="material-symbols-outlined icon-pro text-[19px]">login</span>
              <span className="font-label-md hidden text-xs sm:inline">Login</span>
            </a>
          )}
        </div>
      </div>
      <nav aria-label="Mobile navigation" className="border-t border-outline-variant/40 bg-surface/75 md:hidden">
        <div className="page-shell grid grid-cols-3 gap-1 py-1.5">
          {navItems.map((item) => {
            const isActive = currentPage === item.page;

            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex min-h-10 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${isActive ? 'bg-primary-fixed/35 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                  }`}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
