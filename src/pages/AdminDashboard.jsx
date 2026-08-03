import React, { useCallback, useEffect, useState } from 'react';
import AdminNavigation from '../components/AdminNavigation';
import Breadcrumbs from '../components/Breadcrumbs';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { adminDashboard } from '../services/admin';
import { formatDateTime, formatPrice } from '../utils/formatters';

const BOOKING_STATUS = {
  confirmed: { label: 'Terkonfirmasi', variant: 'success' },
  completed: { label: 'Selesai', variant: 'success' },
  pending_payment: { label: 'Menunggu pembayaran', variant: 'warning' },
  payment_review: { label: 'Perlu diverifikasi', variant: 'warning' },
  cancelled: { label: 'Dibatalkan', variant: 'error' },
  expired: { label: 'Kedaluwarsa', variant: 'error' },
};

function StatusBadge({ status }) {
  const config = BOOKING_STATUS[status] || {
    label: status || 'Tidak diketahui',
    variant: 'outline',
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function MetricCard({ label, value, icon, tone = 'primary', children }) {
  const toneClasses = {
    primary: 'bg-primary/10 text-primary',
    amber: 'bg-tertiary-container text-tertiary',
    neutral: 'bg-surface-container text-on-surface-variant',
    success: 'bg-primary-fixed/60 text-primary',
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
        <p className="font-label-md text-xs uppercase tracking-[0.14em] text-on-surface-variant">{label}</p>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
          <span className="material-symbols-outlined text-[21px]" aria-hidden="true">{icon}</span>
        </span>
      </CardHeader>
      <CardContent>
        <p className="font-headline-lg text-2xl font-bold text-on-surface">{value}</p>
        {children}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setStats(await adminDashboard.getStats());
    } catch (loadError) {
      setError(loadError.message || 'Gagal memuat ringkasan operasional.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const recentBookings = stats?.recentBookings ?? [];

  return (
    <main className="page-shell py-8 text-left md:py-12">
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[
          { label: 'Beranda', href: '#/' },
          { label: 'Admin', href: '#/admin/dashboard' },
          { label: 'Dashboard' },
        ]} />

        <AdminNavigation current="dashboard" />

        <header className="flex flex-col gap-5 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-level-1 md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <p className="font-label-md text-xs uppercase tracking-[0.18em] text-tertiary">Admin Console</p>
            <h1 className="mt-2 font-headline-xl-mobile text-primary md:text-[38px] md:leading-[46px]">Dashboard Operasional</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Pantau booking, pendapatan, inventaris, dan pengguna NUS4STAY dari satu tempat.
            </p>
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading} className="min-h-11 shrink-0">
            <span className={`material-symbols-outlined text-[19px] ${loading ? 'animate-spin' : ''}`} aria-hidden="true">refresh</span>
            Refresh data
          </Button>
        </header>

        {error ? (
          <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-error/20 bg-error-container/60 p-4 text-sm text-on-error-container sm:flex-row sm:items-center sm:justify-between">
            <p>{error}</p>
            <Button variant="destructive" size="sm" onClick={loadData} disabled={loading} className="min-h-10 shrink-0">Coba lagi</Button>
          </div>
        ) : null}

        <section aria-label="Ringkasan operasional" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total booking" value={loading ? '…' : stats?.totalBookings ?? 0} icon="book_online">
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-outline-variant/30 pt-3 text-xs">
              <span className="text-primary"><strong>{stats?.confirmedCount ?? 0}</strong> sukses</span>
              <span className="text-tertiary"><strong>{stats?.pendingCount ?? 0}</strong> menunggu</span>
              <span className="text-error"><strong>{stats?.cancelledCount ?? 0}</strong> batal</span>
            </div>
          </MetricCard>
          <MetricCard label="Total revenue" value={loading ? '…' : formatPrice(stats?.totalRevenue ?? 0)} icon="payments" tone="success">
            <p className="mt-3 text-xs text-on-surface-variant">Transaksi lunas dan terkonfirmasi</p>
          </MetricCard>
          <MetricCard label="Total properti" value={loading ? '…' : stats?.totalProperties ?? 0} icon="apartment" tone="amber">
            <p className="mt-3 text-xs text-on-surface-variant">{loading ? 'Memuat inventaris…' : `${stats?.totalRooms ?? 0} kamar terdaftar`}</p>
          </MetricCard>
          <MetricCard label="Total pengguna" value={loading ? '…' : stats?.totalUsers ?? 0} icon="group" tone="neutral">
            <p className="mt-3 text-xs text-on-surface-variant">Profil pengguna dalam sistem</p>
          </MetricCard>
        </section>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 border-b border-outline-variant/30 pb-5">
            <div>
              <h2 className="font-headline-md font-bold text-on-surface">Booking terbaru</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Lima aktivitas booking paling baru dalam sistem.</p>
            </div>
            <Button asChild variant="link" size="sm" className="min-h-10 shrink-0">
              <a href="#/admin/bookings">
                Semua booking
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
              </a>
            </Button>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <caption className="sr-only">Lima booking terbaru</caption>
                <thead className="border-b border-outline-variant/40 bg-surface-container-low text-xs uppercase tracking-[0.12em] text-on-surface-variant">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Booking</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Properti</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Dibuat</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Total</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant">Memuat booking terbaru…</td>
                    </tr>
                  ) : recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined mb-2 block text-[32px] text-outline" aria-hidden="true">event_busy</span>
                        Belum ada booking terbaru.
                      </td>
                    </tr>
                  ) : recentBookings.map((booking) => (
                    <tr key={booking.bookingId} className="transition hover:bg-surface-container-low/60">
                      <th scope="row" className="px-4 py-4">
                        <a
                          href={`#/admin/bookings?booking=${encodeURIComponent(booking.bookingId)}`}
                          className="font-mono font-semibold text-primary hover:underline"
                        >
                          {booking.bookingId}
                        </a>
                      </th>
                      <td className="px-4 py-4 font-medium text-on-surface">{booking.propertyName}</td>
                      <td className="px-4 py-4 text-on-surface-variant">{formatDateTime(booking.createdAt)}</td>
                      <td className="px-4 py-4 font-semibold text-on-surface">{formatPrice(booking.totalPrice)}</td>
                      <td className="px-4 py-4 text-right"><StatusBadge status={booking.bookingStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
