import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import { db } from '../services/db';

function Icon({ name, className = '' }) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined icon-pro ${className}`}>
      {name}
    </span>
  );
}

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

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

  return (
    <main className="page-shell py-8 text-left md:py-12">
      <div className="mb-8">
        <h1 className="font-headline-xl font-headline-xl-mobile md:text-3xl text-primary font-bold">Profil Saya</h1>
        <p className="font-body-md text-on-surface-variant mt-2">Kelola informasi data diri Anda.</p>
      </div>

      <div className="max-w-xl">
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
      </div>
    </main>
  );
}
