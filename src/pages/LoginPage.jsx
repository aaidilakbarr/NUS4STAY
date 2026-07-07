import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
  const [registerModal, setRegisterModal] = useState({ open: false, success: false, text: '' });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (mode === 'register') {
      setRegisterModal({ open: false, success: false, text: '' });
    }

    if (mode === 'register' && password !== confirmPassword) {
      setMessage('Password tidak sama.');
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
      if (mode === 'register') {
        setRegisterModal({ open: true, success: false, text: `Registrasi gagal. ${error.message}` });
      }
      setLoading(false);
      return;
    }

    setMessage(mode === 'register' ? 'Registrasi berhasil. Cek email jika verifikasi aktif.' : 'Login berhasil.');
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
      setLoading(false);
      return;
    }

    setMessage('Berhasil logout.');
    setLoading(false);
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-container-max items-center px-margin-mobile py-10 md:px-margin-desktop">
      <div className="grid w-full overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface shadow-[0_20px_60px_rgba(23,28,21,0.08)] lg:grid-cols-2">
        <section className="flex flex-col justify-between bg-primary px-8 py-10 text-on-primary md:px-12">
          <div>
            <p className="font-label-md text-xs uppercase tracking-[0.3em] text-on-primary/70">NUS4STAY</p>
            <h1 className="mt-4 font-headline-xl text-3xl font-bold leading-tight">{mode === 'login' ? 'Masuk ke akun kamu' : 'Buat akun baru'}</h1>
            <p className="mt-4 max-w-md text-sm text-on-primary/80">Kelola booking, simpan profil, dan lanjutkan perjalananmu dengan Supabase.</p>
          </div>
          <div className="mt-10 rounded-2xl border border-on-primary/15 bg-on-primary/10 p-5">
            <p className="font-label-md text-sm font-semibold">Status akun</p>
            <p className="mt-2 text-sm text-on-primary/80">{session ? 'Sudah login' : 'Belum login'}</p>
          </div>
        </section>

        <section className="p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex gap-2 rounded-full bg-surface-container-low p-1">
              <button type="button" onClick={() => setMode('login')} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-surface text-primary' : 'text-on-surface-variant'}`}>Login</button>
              <button type="button" onClick={() => setMode('register')} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === 'register' ? 'bg-surface text-primary' : 'text-on-surface-variant'}`}>Register</button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-xs font-semibold text-on-surface">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm outline-none focus:border-primary" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-xs font-semibold text-on-surface">Password</label>
              <div className="relative">
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2.5 pr-11 text-sm outline-none focus:border-primary" required />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-on-surface-variant transition hover:text-primary" aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}>
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {mode === 'register' ? (
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-xs font-semibold text-on-surface">Konfirmasi Password</label>
                <div className="relative">
                  <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type={showConfirmPassword ? 'text' : 'password'} className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2.5 pr-11 text-sm outline-none focus:border-primary" required />
                  <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-on-surface-variant transition hover:text-primary" aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Lihat konfirmasi password'}>
                    <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            ) : null}

            {message ? <p className="text-sm text-primary">{message}</p> : null}

            <button type="submit" disabled={loading} className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 font-label-md text-sm text-on-primary transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
            </button>

            {session ? (
              <button type="button" onClick={handleLogout} disabled={loading} className="ml-3 inline-flex h-11 items-center justify-center rounded-lg border border-outline-variant px-5 font-label-md text-sm text-on-surface transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-70">
                Logout
              </button>
            ) : null}
          </form>
        </section>
      </div>

      {registerModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-[0_20px_60px_rgba(23,28,21,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-headline-md text-xl font-bold text-on-surface">{registerModal.success ? 'Register Berhasil' : 'Register Gagal'}</h3>
                <p className="mt-2 text-sm text-on-surface-variant">{registerModal.text}</p>
              </div>
              <button type="button" onClick={() => setRegisterModal({ open: false, success: false, text: '' })} className="text-on-surface-variant transition hover:text-primary" aria-label="Tutup modal">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => setRegisterModal({ open: false, success: false, text: '' })} className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 font-label-md text-sm text-on-primary transition hover:bg-primary-container">
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
