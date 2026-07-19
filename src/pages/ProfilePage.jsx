import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';
import { useNotifications } from '../contexts/NotificationContext';
import { db } from '../services/db';

function Icon({ name, className = '' }) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined icon-pro ${className}`}>
      {name}
    </span>
  );
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function StatCard({ icon, label, value, tone }) {
  const toneClass = tone === 'confirmed'
    ? 'bg-[#EAF2E8] text-[#34662B]'
    : tone === 'pending'
      ? 'bg-[#FDF6E2] text-[#B2700D]'
      : tone === 'completed'
        ? 'bg-[#DBEAFE] text-[#1E40AF]'
        : 'bg-primary-fixed/40 text-on-primary-fixed-variant';

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 shadow-level-1 transition-all duration-300 hover:shadow-level-2 hover:-translate-y-0.5">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
        <Icon name={icon} className="text-[20px]" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">{label}</p>
        <p className="font-headline-md text-lg text-on-surface font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function AccountRow({ icon, label, hint, href, onClick, danger }) {
  const content = (
    <>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${danger ? 'bg-error-container/60 text-on-error-container' : 'bg-surface-container text-on-surface-variant'}`}>
        <Icon name={icon} className="text-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${danger ? 'text-error' : 'text-on-surface'}`}>{label}</p>
        {hint && <p className="text-xs text-on-surface-variant mt-0.5 truncate">{hint}</p>}
      </div>
      <Icon name="chevron_right" className="text-outline text-[20px] shrink-0" />
    </>
  );

  const baseClass = `flex w-full items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface px-4 py-3 text-left transition-all duration-200 hover:bg-surface-container-low hover:border-outline-variant/40 active:scale-[0.99] ${danger ? 'hover:bg-error-container/30' : ''}`;

  if (href) {
    return <a href={href} className={baseClass}>{content}</a>;
  }
  return (
    <button type="button" onClick={onClick} className={baseClass}>
      {content}
    </button>
  );
}

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { preferences, updatePreferences } = useNotifications();
  const [showNotifPrefs, setShowNotifPrefs] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({ booking_updates: true, promotions: false });
  const [notifPrefsLoading, setNotifPrefsLoading] = useState(false);
  const [notifPrefsMsg, setNotifPrefsMsg] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [stats, setStats] = useState({ total: 0, confirmed: 0, pending: 0, completed: 0 });
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    if (preferences) {
      setNotifPrefs({
        booking_updates: preferences.booking_updates ?? true,
        promotions: preferences.promotions ?? false,
      });
    }
  }, [preferences]);

  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      if (!user?.id) return;
      const data = await db.getBookingHistory();
      if (!mounted) return;
      const confirmed = data.filter((b) => b.bookingStatus === 'confirmed').length;
      const pending = data.filter(
        (b) => b.bookingStatus === 'pending_payment' || b.bookingStatus === 'payment_review',
      ).length;
      const completed = data.filter((b) => b.bookingStatus === 'completed').length;
      setStats({ total: data.length, confirmed, pending, completed });
    }
    loadStats();
    return () => { mounted = false; };
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('info');

    try {
      await db.updateProfile({ full_name: name.trim(), phone: phone.trim() });
      await refreshProfile();
      setMessage('Profil berhasil diperbarui.');
      setMessageType('success');
    } catch (err) {
      setMessage(err?.message || 'Gagal memperbarui profil.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    window.location.hash = '#/';
  };

  const handleNotifPrefsSave = async () => {
    setNotifPrefsLoading(true);
    setNotifPrefsMsg('');
    try {
      await updatePreferences(notifPrefs);
      setNotifPrefsMsg('Preferensi notifikasi berhasil diperbarui.');
    } catch {
      setNotifPrefsMsg('Gagal memperbarui preferensi.');
    } finally {
      setNotifPrefsLoading(false);
    }
  };

  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(profile.created_at))
    : null;

  return (
    <main className="page-shell py-8 text-left md:py-12">
      {/* Header dengan greeting */}
      <div className="mb-8 flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white font-headline-md text-lg font-bold shadow-[0_8px_20px_-4px_rgba(52,78,43,0.35)]">
          {getInitials(profile?.full_name || user?.email)}
        </span>
        <div className="min-w-0">
          <h1 className="font-headline-xl font-headline-xl-mobile md:text-3xl text-primary font-bold leading-tight">
            Halo, {profile?.full_name?.split(' ')[0] || 'Tamu'}
          </h1>
          <p className="font-body-md text-on-surface-variant mt-1 truncate">Kelola informasi data diri dan akun Anda.</p>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Kolom kiri: kartu ringkasan profil (sticky di desktop) */}
        <aside className="lg:w-80 lg:shrink-0">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-6 shadow-level-1 text-center">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary font-headline-md text-2xl font-bold ring-4 ring-primary/5">
                {getInitials(profile?.full_name || user?.email)}
              </span>
              <h2 className="font-headline-md text-lg text-on-surface font-bold mt-4 break-words">
                {profile?.full_name || 'Tanpa Nama'}
              </h2>
              <p className="font-body-md text-sm text-on-surface-variant mt-1 break-all">{user?.email}</p>
              {memberSince && (
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary-fixed/30 px-3 py-1 text-xs font-semibold text-on-primary-fixed-variant">
                  <Icon name="calendar_month" className="text-[14px]" />
                  Member sejak {memberSince}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full h-11 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-error/20 bg-error-container/40 text-error font-semibold text-sm transition-all duration-300 hover:bg-error-container/70 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Icon name="logout" className="text-[18px]" />
              <span>{loggingOut ? 'Keluar...' : 'Keluar'}</span>
            </button>
          </div>
        </aside>

        {/* Kolom kanan: statistik, form, dan pengaturan akun */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* Statistik booking */}
          {stats.total > 0 && (
            <section>
              <h3 className="font-headline-md text-base text-on-surface font-bold mb-4">Ringkasan Booking</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard icon="book" label="Total Booking" value={stats.total} />
                <StatCard icon="check_circle" label="Dikonfirmasi" value={stats.confirmed} tone="confirmed" />
                <StatCard icon="schedule" label="Menunggu" value={stats.pending} tone="pending" />
                <StatCard icon="task_alt" label="Selesai" value={stats.completed} tone="completed" />
              </div>
            </section>
          )}

          {/* Form edit profil */}
          <section>
            <h3 className="font-headline-md text-base text-on-surface font-bold mb-4">Informasi Pribadi</h3>
            <form onSubmit={handleSubmit} className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-6 md:p-8 shadow-level-1 space-y-6">
              {/* Nama */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="profile-name" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80 ml-1">Nama</label>
                <div className="group relative">
                  <Icon name="person" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline/70 transition-colors duration-200 group-focus-within:text-primary text-[15px]" />
                  <input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    autoComplete="name"
                    placeholder="Nama lengkap"
                    className="h-12 w-full rounded-xl border border-outline-variant/40 bg-surface px-11 text-sm text-on-surface shadow-[inset_0_1px_1px_rgba(0,0,0,0.04)] placeholder-on-surface-variant/40 placeholder:text-[11px] outline-none transition-all duration-200 focus:border-primary/50 focus:bg-surface-bright focus:ring-4 focus:ring-primary/5"
                    required
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="profile-email" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80 ml-1">Alamat Email</label>
                <div className="group relative">
                  <Icon name="alternate_email" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline/70 text-[15px]" />
                  <input
                    id="profile-email"
                    value={user?.email || ''}
                    type="email"
                    readOnly
                    className="h-12 w-full rounded-xl border border-outline-variant/40 bg-surface-container px-11 text-sm text-on-surface-variant shadow-[inset_0_1px_1px_rgba(0,0,0,0.04)] outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* No Telp */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="profile-phone" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80 ml-1">Nomor Telepon</label>
                <div className="group relative">
                  <Icon name="phone" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline/70 transition-colors duration-200 group-focus-within:text-primary text-[15px]" />
                  <input
                    id="profile-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    autoComplete="tel"
                    placeholder="08xxxxxxxxxx"
                    className="h-12 w-full rounded-xl border border-outline-variant/40 bg-surface px-11 text-sm text-on-surface shadow-[inset_0_1px_1px_rgba(0,0,0,0.04)] placeholder-on-surface-variant/40 placeholder:text-[11px] outline-none transition-all duration-200 focus:border-primary/50 focus:bg-surface-bright focus:ring-4 focus:ring-primary/5"
                  />
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs transition-all duration-200 ${messageType === 'error'
                  ? 'border-error/20 bg-error-container/60 text-on-error-container backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'border-primary/15 bg-primary-fixed/30 text-on-primary-fixed-variant backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                  }`}>
                  <Icon name={messageType === 'error' ? 'error' : 'check_circle'} className="mt-0.5 text-[16px] shrink-0" />
                  <p className="leading-relaxed">{message}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-semibold text-sm shadow-[0_12px_24px_-4px_rgba(52,78,43,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-[0_16px_32px_-4px_rgba(52,78,43,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Icon name="save" className="text-[18px]" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Pengaturan akun */}
          <section>
            <h3 className="font-headline-md text-base text-on-surface font-bold mb-4">Pengaturan Akun</h3>
            <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-3 shadow-level-1 space-y-2">
              <AccountRow
                icon="history"
                label="Riwayat Booking"
                hint={stats.total > 0 ? `${stats.total} booking tersimpan` : 'Belum ada booking'}
                href="#/history"
              />
              <AccountRow
                icon="lock"
                label="Keamanan Akun"
                hint="Kelola kata sandi dan verifikasi"
                href="#/login"
              />
              <AccountRow
                icon="notifications"
                label="Notifikasi"
                hint="Preferensi pemberitahuan"
                onClick={() => setShowNotifPrefs(!showNotifPrefs)}
              />
              <AccountRow
                icon="delete"
                label="Hapus Akun"
                hint="Permintaan penghapusan data"
                danger
                onClick={() => setMessage('Hubungi dukungan untuk menghapus akun.')}
              />
            </div>
          </section>
          {/* Preferensi notifikasi */}
          {showNotifPrefs && (
            <section className="animate-scale-in">
              <h3 className="font-headline-md text-base text-on-surface font-bold mb-4">Preferensi Notifikasi</h3>
              <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-6 md:p-8 shadow-level-1 space-y-5">
                <p className="text-sm text-on-surface-variant">Pilih jenis notifikasi yang ingin kamu terima.</p>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={notifPrefs.booking_updates}
                      onChange={(e) => setNotifPrefs((p) => ({ ...p, booking_updates: e.target.checked }))}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-10 rounded-full bg-surface-variant transition-colors duration-200 peer-checked:bg-primary group-hover:bg-surface-container-high peer-checked:group-hover:bg-primary-container" />
                    <div className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-level-1 transition-all duration-200 ${notifPrefs.booking_updates ? 'translate-x-4' : ''}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-on-surface">Pembaruan Booking</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Notifikasi saat status booking berubah</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={notifPrefs.promotions}
                      onChange={(e) => setNotifPrefs((p) => ({ ...p, promotions: e.target.checked }))}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-10 rounded-full bg-surface-variant transition-colors duration-200 peer-checked:bg-primary group-hover:bg-surface-container-high peer-checked:group-hover:bg-primary-container" />
                    <div className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-level-1 transition-all duration-200 ${notifPrefs.promotions ? 'translate-x-4' : ''}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-on-surface">Promosi & Penawaran</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Info diskon dan promosi menarik</p>
                  </div>
                </label>

                {notifPrefsMsg && (
                  <p className={`text-xs font-semibold ${notifPrefsMsg.includes('berhasil') ? 'text-primary' : 'text-error'}`}>
                    {notifPrefsMsg}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleNotifPrefsSave}
                  disabled={notifPrefsLoading}
                  className="w-full h-11 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-semibold text-sm shadow-[0_12px_24px_-4px_rgba(52,78,43,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-[0_16px_32px_-4px_rgba(52,78,43,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {notifPrefsLoading ? 'Menyimpan...' : 'Simpan Preferensi'}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
