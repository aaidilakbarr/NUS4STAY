import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';
import heroImage from '../assets/hero.png';

const modeContent = {
  login: {
    eyebrow: 'Welcome back',
    title: 'Masuk ke akun kamu',
    description: 'Lanjutkan reservasi, cek status booking, dan simpan preferensi menginapmu.',
    submit: 'Masuk sekarang',
    loading: 'Memproses login',
  },
  register: {
    eyebrow: 'Start your stay',
    title: 'Buat akun NUS4STAY',
    description: 'Simpan detail perjalanan dan percepat proses booking berikutnya.',
    submit: 'Buat akun',
    loading: 'Mendaftarkan akun',
  },
};

const authHighlights = [
  { icon: 'travel_explore', title: 'Curated stays', text: 'Akses pilihan hotel dan villa premium.' },
  { icon: 'receipt_long', title: 'Booking rapi', text: 'Riwayat dan detail pesanan tersimpan.' },
  { icon: 'verified_user', title: 'Akun aman', text: 'Autentikasi langsung melalui Supabase.' },
];

function Icon({ name, className = '' }) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined icon-pro ${className}`}>
      {name}
    </span>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [session, setSession] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [messageType, setMessageType] = useState('info');
  const [registerModal, setRegisterModal] = useState({ open: false, success: false, text: '' });
  const modalCloseRef = useRef(null);
  useAuth();

  const currentContent = modeContent[mode];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (registerModal.open) {
      modalCloseRef.current?.focus();
    }
  }, [registerModal.open]);

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setMessage('');
    setMessageType('info');
    setRegisterModal({ open: false, success: false, text: '' });

    if (nextMode === 'login') {
      setConfirmPassword('');
      setShowConfirmPassword(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('info');

    if (mode === 'register') {
      setRegisterModal({ open: false, success: false, text: '' });
    }

    if (mode === 'register' && password !== confirmPassword) {
      setMessage('Password tidak sama.');
      setMessageType('error');
      setRegisterModal({ open: true, success: false, text: 'Registrasi gagal. Password dan konfirmasi password harus sama.' });
      setLoading(false);
      return;
    }

    const action = mode === 'register'
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });

    const { error } = await action;

    if (error) {
      setMessage(error.message);
      setMessageType('error');
      if (mode === 'register') {
        setRegisterModal({ open: true, success: false, text: `Registrasi gagal. ${error.message}` });
      }
      setLoading(false);
      return;
    }

    setMessage(mode === 'register' ? 'Registrasi berhasil. Cek email jika verifikasi aktif.' : 'Login berhasil.');
    setMessageType('success');
    if (mode === 'register') {
      setRegisterModal({ open: true, success: true, text: 'Registrasi berhasil. Cek email jika verifikasi akun aktif.' });
    }
    setLoading(false);

    if (mode === 'login') {
      window.location.hash = '#/';
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
      setMessageType('error');
      setLoading(false);
      return;
    }

    setMessage('Berhasil logout.');
    setMessageType('success');
    setLoading(false);
  };

  return (
    <main className="page-shell relative overflow-hidden py-8 md:py-12">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#FAFBF9_0%,#EEF4EA_46%,#F8F2E5_100%)]" />
      <div className="mx-auto grid min-h-[calc(100vh-11rem)] w-full max-w-container-max overflow-hidden rounded-[1.75rem] border border-white/70 bg-surface/90 shadow-[0_28px_90px_rgba(23,28,21,0.14)] backdrop-blur lg:grid-cols-[0.96fr_1.04fr]">
        <section className="relative hidden min-h-[640px] overflow-hidden bg-primary text-on-primary lg:flex">
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(16,31,13,0.92)_0%,rgba(16,31,13,0.68)_46%,rgba(217,119,6,0.32)_100%)]" />
          <div className="relative z-10 flex h-full w-full flex-col justify-between p-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md">
                <Icon name="villa" className="text-[18px]" />
                NUS4STAY Guest Desk
              </div>
              <h1 className="mt-6 max-w-lg font-headline-xl text-[44px] font-bold leading-[1.05] tracking-normal text-white">
                Satu akun untuk perjalanan yang lebih tenang.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-white/78">
                Masuk untuk mengatur booking, lanjutkan pembayaran, dan kembali ke villa incaranmu tanpa mulai dari awal.
              </p>
            </div>

            <div className="space-y-5">
              <div className="grid gap-3">
                {authHighlights.map((item) => (
                  <div key={item.title} className="grid grid-cols-[44px_1fr] items-center gap-3 border-t border-white/14 pt-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/18 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
                      <Icon name={item.icon} className="text-[21px]" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">{item.title}</span>
                      <span className="block text-xs leading-5 text-white/68">{item.text}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-white/16 pt-5 text-xs text-white/68">
                <span>Secure access</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                  <Icon name="lock" className="text-[16px]" />
                  Supabase Auth
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-8 md:p-12">
          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[520px] space-y-7">
            <div className="flex flex-col gap-5">
              <div>
                <p className="font-label-md text-xs uppercase text-tertiary">{currentContent.eyebrow}</p>
                <h2 className="mt-2 font-headline-xl text-[34px] font-bold leading-[1.12] tracking-normal text-on-surface md:text-[42px]">
                  {currentContent.title}
                </h2>
                <p className="mt-3 max-w-[31rem] text-sm leading-6 text-on-surface-variant">
                  {currentContent.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1 rounded-2xl border border-outline-variant/70 bg-surface-container-low p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]" role="tablist" aria-label="Pilih mode akun">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                aria-pressed={mode === 'login'}
                className={`inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  mode === 'login'
                    ? 'bg-surface text-primary shadow-[0_8px_22px_rgba(23,28,21,0.08)]'
                    : 'text-on-surface-variant hover:bg-surface/60 hover:text-on-surface'
                }`}
              >
                <Icon name="login" className="text-[19px]" />
                Masuk
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('register')}
                aria-pressed={mode === 'register'}
                className={`inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  mode === 'register'
                    ? 'bg-surface text-primary shadow-[0_8px_22px_rgba(23,28,21,0.08)]'
                    : 'text-on-surface-variant hover:bg-surface/60 hover:text-on-surface'
                }`}
              >
                <Icon name="person_add" className="text-[19px]" />
                Daftar
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-email" className="font-label-md text-xs font-semibold text-on-surface">Alamat email</label>
              <div className="group relative">
                <Icon name="alternate_email" className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[20px] text-outline transition-colors group-focus-within:text-primary" />
                <input
                  id="auth-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  className="h-13 w-full rounded-2xl border border-outline-variant bg-surface px-12 text-sm text-on-surface shadow-[0_1px_0_rgba(255,255,255,0.75)] outline-none transition placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-password" className="font-label-md text-xs font-semibold text-on-surface">Password</label>
              <div className="group relative">
                <Icon name="lock" className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[20px] text-outline transition-colors group-focus-within:text-primary" />
                <input
                  id="auth-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  placeholder="Minimal 6 karakter"
                  className="h-13 w-full rounded-2xl border border-outline-variant bg-surface px-12 pr-14 text-sm text-on-surface shadow-[0_1px_0_rgba(255,255,255,0.75)] outline-none transition placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-1.5 right-1.5 inline-flex w-10 cursor-pointer items-center justify-center rounded-xl text-on-surface-variant transition hover:bg-primary-fixed/25 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-[20px]" />
                </button>
              </div>
            </div>

            {mode === 'register' ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-confirm-password" className="font-label-md text-xs font-semibold text-on-surface">Konfirmasi password</label>
                <div className="group relative">
                  <Icon name="shield_lock" className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[20px] text-outline transition-colors group-focus-within:text-primary" />
                  <input
                    id="auth-confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Ulangi password"
                    className="h-13 w-full rounded-2xl border border-outline-variant bg-surface px-12 pr-14 text-sm text-on-surface shadow-[0_1px_0_rgba(255,255,255,0.75)] outline-none transition placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-1.5 right-1.5 inline-flex w-10 cursor-pointer items-center justify-center rounded-xl text-on-surface-variant transition hover:bg-primary-fixed/25 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Lihat konfirmasi password'}
                  >
                    <Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} className="text-[20px]" />
                  </button>
                </div>
              </div>
            ) : null}

            {message ? (
              <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
                messageType === 'error'
                  ? 'border-error/20 bg-error-container/65 text-on-error-container'
                  : 'border-primary/20 bg-primary-fixed/35 text-on-primary-fixed-variant'
              }`}>
                <Icon name={messageType === 'error' ? 'error' : 'check_circle'} className="mt-0.5 text-[20px]" />
                <p className="leading-5">{message}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-5 font-label-md text-sm text-on-primary shadow-[0_16px_34px_rgba(52,78,43,0.22)] transition hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-[0_20px_42px_rgba(52,78,43,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Icon name={mode === 'login' ? 'login' : 'person_add'} className="text-[20px]" />
              {loading ? currentContent.loading : currentContent.submit}
            </button>

            {session ? (
              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface px-5 font-label-md text-sm text-on-surface transition hover:border-primary/30 hover:bg-primary-fixed/15 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Icon name="logout" className="text-[19px]" />
                Logout
              </button>
            ) : null}
          </form>
        </section>
      </div>

      {registerModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101F0D]/55 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-dialog-title"
            className="w-full max-w-md rounded-[1.5rem] border border-white/70 bg-surface p-6 shadow-[0_28px_90px_rgba(23,28,21,0.25)]"
          >
            <div className="flex items-start gap-4">
              <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                registerModal.success ? 'bg-primary-fixed/60 text-primary' : 'bg-error-container text-on-error-container'
              }`}>
                <Icon name={registerModal.success ? 'mark_email_read' : 'error'} className="text-[24px]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="register-dialog-title" className="font-headline-md text-xl font-bold text-on-surface">{registerModal.success ? 'Register berhasil' : 'Register gagal'}</h3>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{registerModal.text}</p>
              </div>
              <button
                ref={modalCloseRef}
                type="button"
                onClick={() => setRegisterModal({ open: false, success: false, text: '' })}
                className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="Tutup modal"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setRegisterModal({ open: false, success: false, text: '' })}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 font-label-md text-sm text-on-primary transition hover:bg-primary-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
