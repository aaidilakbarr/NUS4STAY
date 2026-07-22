import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';
const LogoNUS4Stay = '/logo_nus4stay.svg';
const villaImage = "./Hero_LandPge.svg";

const modeContent = {
  login: {
    title: 'Selamat Datang',
    subtitle: 'Silakan masuk untuk mengelola pesanan Anda',
    submit: 'Masuk ke Akun',
    loading: 'Menghubungkan',
  },
  register: {
    title: 'Mulai Perjalanan',
    subtitle: 'Daftar akun untuk kemudahan reservasi',
    submit: 'Daftar Akun',
    loading: 'Mendaftarkan',
  },
};

function Icon({ name, className = '' }) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined icon-pro ${className}`}>
      {name}
    </span>
  );
}

export default function LoginPage() {
  const { session, isAuthenticated } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [messageType, setMessageType] = useState('info');
  const [registerModal, setRegisterModal] = useState({ open: false, success: false, text: '', subtext: '' });
  const modalCloseRef = useRef(null);

  const currentContent = modeContent[mode];

  useEffect(() => {
    if (registerModal.open) {
      modalCloseRef.current?.focus();
    }
  }, [registerModal.open]);

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setMessage('');
    setMessageType('info');
    setRegisterModal({ open: false, success: false, text: '', subtext: '' });

    if (nextMode === 'login') {
      setName('');
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
      ? supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      : supabase.auth.signInWithPassword({ email, password });

    const { data: authData, error } = await action;

    if (error) {
      setMessage(error.message);
      setMessageType('error');
      if (mode === 'register') {
        setRegisterModal({ open: true, success: false, text: `Registrasi gagal. ${error.message}` });
      }
      setLoading(false);
      return;
    }

    if (mode === 'register' && authData?.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        full_name: name,
        role: 'guest',
      }, { onConflict: 'id' });
    }

    setLoading(false);

    const redirectToLanding = () => {
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setShowConfirmPassword(false);
      setShowPassword(false);
      window.location.hash = '#/';
    };

    if (mode === 'register') {
      setRegisterModal({ open: true, success: true, text: 'Registrasi Berhasil', subtext: 'Anda akan diarahkan kembali ke landing page' });
      setTimeout(() => {
        setRegisterModal({ open: false, success: false, text: '', subtext: '' });
        redirectToLanding();
      }, 2500);
    } else {
      redirectToLanding();
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

    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setMessage('Berhasil logout.');
    setMessageType('success');
    setLoading(false);
  };

  return (
    <main className="relative isolate min-h-screen w-full flex items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      {/* Background Villa Image */}
      <div className="absolute inset-0 -z-30">
        <img
          src={villaImage}
          alt="Luxury Villa"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay to ensure card readability and high contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#101F0D]/75 via-[#101F0D]/55 to-[#101F0D]/85" />
      </div>

      {/* Ambient Glowing Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/15 blur-[90px] animate-pulse pointer-events-none -z-20" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-tertiary/10 blur-[110px] animate-pulse pointer-events-none -z-20" />

      {/* Glassmorphic Login/Register Card */}
      <div className="relative z-10 w-full max-w-[450px] rounded-[2.5rem] border border-white/40 bg-white/75 p-8 md:p-10 shadow-[0_32px_80px_-16px_rgba(16,31,13,0.22),inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-2xl animate-fade-in-up">
        {/* Brand & Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4 transition-bounce hover:scale-105">
            <img src={LogoNUS4Stay} alt="NUS4STAY Logo" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="mt-2 font-headline-md text-2xl font-bold tracking-tight text-on-surface">
            {currentContent.title}
          </h1>
          <p className="mt-1.5 text-xs text-on-surface-variant/80 font-normal max-w-[280px]">
            {currentContent.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/50 bg-white/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-xl mb-6" role="tablist" aria-label="Pilih mode akun">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              aria-pressed={mode === 'login'}
              className={`py-2.5 rounded-xl font-label-md text-xs uppercase transition-all duration-200 cursor-pointer ${mode === 'login'
                ? 'bg-white/90 text-primary shadow-[0_4px_12px_rgba(16,31,13,0.08)]'
                : 'text-on-surface-variant/70 hover:text-on-surface hover:bg-white/20'
                }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              aria-pressed={mode === 'register'}
              className={`py-2.5 rounded-xl font-label-md text-xs uppercase transition-all duration-200 cursor-pointer ${mode === 'register'
                ? 'bg-white/90 text-primary shadow-[0_4px_12px_rgba(16,31,13,0.08)]'
                : 'text-on-surface-variant/70 hover:text-on-surface hover:bg-white/20'
                }`}
            >
              Daftar
            </button>
          </div>

          {/* Input Groups */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Nama — register only */}
            {mode === 'register' && (
              <div className="flex flex-col gap-1.5 animate-scale-in">
                <label htmlFor="auth-name" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80 ml-1">Nama</label>
                <div className="group relative">
                  <Icon name="person" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline/70 transition-colors duration-200 group-focus-within:text-primary text-[15px]" />
                  <input
                    id="auth-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    autoComplete="name"
                    placeholder="Nama lengkap"
                    className="h-12 w-full rounded-xl border border-white/50 bg-white/40 px-11 text-sm text-on-surface shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] placeholder-on-surface-variant/40 placeholder:text-[11px] outline-none backdrop-blur-md transition-all duration-200 focus:border-primary/50 focus:bg-white/60 focus:ring-4 focus:ring-primary/5"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-email" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80 ml-1">Alamat Email</label>
              <div className="group relative">
                <Icon name="alternate_email" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline/70 transition-colors duration-200 group-focus-within:text-primary text-[15px]" />
                <input
                  id="auth-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  className="h-12 w-full rounded-xl border border-white/50 bg-white/40 px-11 text-sm text-on-surface shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] placeholder-on-surface-variant/40 placeholder:text-[11px] outline-none backdrop-blur-md transition-all duration-200 focus:border-primary/50 focus:bg-white/60 focus:ring-4 focus:ring-primary/5"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-password" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80 ml-1">Password</label>
              <div className="group relative">
                <Icon name="lock" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline/70 transition-colors duration-200 group-focus-within:text-primary text-[15px]" />
                <input
                  id="auth-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  placeholder="Minimal 6 karakter"
                  className="h-12 w-full rounded-xl border border-white/50 bg-white/40 pl-11 pr-12 text-sm text-on-surface shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] placeholder-on-surface-variant/40 placeholder:text-[11px] outline-none backdrop-blur-md transition-all duration-200 focus:border-primary/50 focus:bg-white/60 focus:ring-4 focus:ring-primary/5"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex cursor-pointer items-center justify-center rounded-lg text-on-surface-variant/60 hover:text-primary hover:bg-white/30 transition-all duration-200"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-[15px]" />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            {mode === 'register' && (
              <div className="flex flex-col gap-1.5 animate-scale-in">
                <label htmlFor="auth-confirm-password" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80 ml-1">Konfirmasi Password</label>
                <div className="group relative">
                  <Icon name="shield_lock" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline/70 transition-colors duration-200 group-focus-within:text-primary text-[15px]" />
                  <input
                    id="auth-confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Ulangi password"
                    className="h-12 w-full rounded-xl border border-white/50 bg-white/40 pl-11 pr-12 text-sm text-on-surface shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] placeholder-on-surface-variant/40 placeholder:text-[11px] outline-none backdrop-blur-md transition-all duration-200 focus:border-primary/50 focus:bg-white/60 focus:ring-4 focus:ring-primary/5"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex cursor-pointer items-center justify-center rounded-lg text-on-surface-variant/60 hover:text-primary hover:bg-white/30 transition-all duration-200"
                    aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Lihat konfirmasi password'}
                  >
                    <Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} className="text-[15px]" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error / Success Messages */}
          {message && (
            <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs mb-5 transition-all duration-200 ${messageType === 'error'
              ? 'border-error/20 bg-error-container/60 text-on-error-container backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
              : 'border-primary/15 bg-primary-fixed/30 text-on-primary-fixed-variant backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
              }`}>
              <Icon name={messageType === 'error' ? 'error' : 'check_circle'} className="mt-0.5 text-[16px] shrink-0" />
              <p className="leading-relaxed">{message}</p>
            </div>
          )}

          {/* Submit Button */}
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
                <span>{currentContent.loading}...</span>
              </>
            ) : (
              <>
                <Icon name={mode === 'login' ? 'login' : 'person_add'} className="text-[18px]" />
                <span>{currentContent.submit}</span>
              </>
            )}
          </button>

          {/* Logout (if logged in) */}
          {session && (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="w-full h-11 mt-3 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-white/50 bg-white/20 text-on-surface hover:bg-white/40 hover:border-primary/20 transition-all duration-200 text-xs font-semibold backdrop-blur-md"
            >
              <Icon name="logout" className="text-[16px]" />
              <span>Keluar dari Akun</span>
            </button>
          )}
        </form>
      </div>

      {/* Register Dialog Modal */}
      {registerModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101F0D]/20 px-4 backdrop-blur-md animate-fade-in-up">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-dialog-title"
            className="w-full max-w-sm rounded-[2rem] border border-white/60 bg-white/40 p-6 shadow-2xl backdrop-blur-2xl text-center"
          >
            <div className="flex flex-col items-center">
              <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4 ${registerModal.success ? 'bg-primary/10 text-primary border border-primary/15' : 'bg-error-container/60 text-on-error-container border border-error/15'
                }`}>
                <Icon name={registerModal.success ? 'mark_email_read' : 'error'} className="text-[28px]" />
              </div>

              <h3 id="register-dialog-title" className="text-lg font-bold text-on-surface">
                {registerModal.success ? 'Pendaftaran Berhasil' : 'Pendaftaran Gagal'}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-on-surface-variant/80">
                {registerModal.text}
              </p>
              {registerModal.success && (
                <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant/60">
                  {registerModal.subtext}
                </p>
              )}

              {registerModal.success ? (
                <div className="mt-6 w-full">
                  <div className="w-full h-11 inline-flex items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-semibold">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mengarahkan...
                  </div>
                </div>
              ) : (
                <div className="mt-6 w-full">
                  <button
                    ref={modalCloseRef}
                    type="button"
                    onClick={() => setRegisterModal({ open: false, success: false, text: '', subtext: '' })}
                    className="w-full h-11 cursor-pointer inline-flex items-center justify-center rounded-xl bg-primary text-white text-xs font-semibold shadow-md hover:bg-primary-container transition-all duration-200"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
