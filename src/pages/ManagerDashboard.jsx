import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../components/Breadcrumbs';
import ManagerNavigation from '../components/ManagerNavigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { getManagerDashboardStats, formatCurrency } from '../services/manager';

export default function ManagerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getManagerDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading manager dashboard:', err);
      setError(err.message || 'Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <Badge variant="success">Terkonfirmasi</Badge>;
      case 'pending_payment':
      case 'payment_review':
        return <Badge variant="warning">Menunggu</Badge>;
      case 'cancelled':
      case 'expired':
        return <Badge variant="error">Dibatalkan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <main className="page-shell py-8 text-left md:py-12">
      <div className="flex flex-col gap-6">
        <Breadcrumbs
          items={[
            { label: 'Beranda', href: '#/' },
            { label: 'Manager', href: '#/manager/dashboard' },
            { label: 'Dashboard' },
          ]}
        />

        <ManagerNavigation current="dashboard" />

        <div className="flex flex-col gap-4 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-level-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-label-md text-xs uppercase tracking-[0.18em] text-tertiary">Manager Console</p>
            <h1 className="mt-2 font-headline-xl text-3xl font-bold text-primary">Dashboard Performa Bisnis</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Ringkasan pemesanan, total pendapatan bersih, dan tingkat okupansi properti NUS4STAY.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              Refresh
            </Button>
            <Button asChild size="sm">
              <a href="#/manager/reports">
                <span className="material-symbols-outlined text-[18px]">description</span>
                Laporan
              </a>
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-error/20 bg-error-container/40 p-4 text-sm text-on-error-container">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Total Bookings
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[22px]">book_online</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-headline-xl text-3xl font-extrabold text-on-surface">
                {loading ? '...' : stats?.totalBookings ?? 0}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-outline-variant/30 pt-3 text-xs text-on-surface-variant">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">{stats?.confirmedCount ?? 0} Sukses</span>
                <span className="text-amber-700 dark:text-amber-400 font-medium">{stats?.pendingCount ?? 0} Menunggu</span>
                <span className="text-rose-700 dark:text-rose-400 font-medium">{stats?.cancelledCount ?? 0} Batal</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Total Revenue
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <span className="material-symbols-outlined text-[22px]">payments</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-bold text-lg sm:text-xl text-on-surface truncate" title={loading ? '' : formatCurrency(stats?.totalRevenue)}>
                {loading ? '...' : formatCurrency(stats?.totalRevenue)}
              </p>
              <p className="mt-2 text-xs text-on-surface-variant">
                Pendapatan dari transaksi lunas/terkonfirmasi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Occupancy Rate
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
                <span className="material-symbols-outlined text-[22px]">hotel</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-headline-xl text-3xl font-extrabold text-on-surface">
                {loading ? '...' : `${stats?.occupancyRate ?? 0}%`}
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-container">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, stats?.occupancyRate || 0)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Analitik Bisnis
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-tertiary/10 text-tertiary">
                <span className="material-symbols-outlined text-[22px]">analytics</span>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Lihat tren pemesanan bulanan & ranking properti terfavorit.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4 w-full justify-between">
                <a href="#/manager/analytics">
                  <span>Buka Analitik</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Statistics & Export Card */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between border-b border-outline-variant/30 pb-4">
              <div>
                <CardTitle>Statistik Pemesanan Bulanan</CardTitle>
                <CardDescription>
                  Perbandingan volume pemesanan dan akumulasi omset 6 bulan terakhir
                </CardDescription>
              </div>
              <Button asChild variant="link" size="sm">
                <a href="#/manager/analytics">Detail Analitik</a>
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="py-12 text-center text-xs text-on-surface-variant">Memuat statistik...</div>
              ) : !stats?.monthlyStats || stats.monthlyStats.length === 0 ? (
                <div className="py-12 text-center text-xs text-on-surface-variant">Belum ada data bulanan.</div>
              ) : (
                <div className="space-y-4">
                  {stats.monthlyStats.map((item) => (
                    <div key={item.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-on-surface">{item.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-on-surface-variant">{item.totalBookings} booking ({item.confirmedBookings} lunas)</span>
                          <span className="font-bold text-primary">{formatCurrency(item.revenue)}</span>
                        </div>
                      </div>
                      <div className="flex h-3.5 w-full overflow-hidden rounded-lg bg-surface-container">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (item.confirmedBookings / (stats.totalBookings || 1)) * 100 * 2)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between">
            <CardHeader>
              <p className="font-label-md text-xs uppercase tracking-[0.18em] text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">download</span>
                Laporan & Ekspor
              </p>
              <CardTitle className="mt-1">Ekspor Laporan Bisnis</CardTitle>
              <CardDescription>
                Unduh berkas laporan pemesanan dan pendapatan dalam format spreadsheet CSV.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href="#/manager/reports"
                className="flex items-center justify-between rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4 transition hover:bg-surface-container"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[24px]">receipt_long</span>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Laporan Pemesanan</p>
                    <p className="text-[11px] text-on-surface-variant">Daftar booking lengkap & status</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
              </a>

              <a
                href="#/manager/reports"
                className="flex items-center justify-between rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4 transition hover:bg-surface-container"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-600 text-[24px]">savings</span>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Laporan Pendapatan</p>
                    <p className="text-[11px] text-on-surface-variant">Total omset & transaksi lunas</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
              </a>
            </CardContent>
            <CardFooter>
              <div className="w-full rounded-2xl bg-primary-fixed/10 p-3 border border-primary/20">
                <p className="text-[11px] text-primary font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Akses Manager bersifat Read-Only untuk pemantauan bisnis.
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Recent Bookings Table */}
        <Card>
          <CardHeader className="flex-row items-center justify-between border-b border-outline-variant/30 pb-4">
            <div>
              <CardTitle>Pemesanan Terbaru</CardTitle>
              <CardDescription>
                5 transaksi pemesanan terbaru dalam sistem
              </CardDescription>
            </div>
            <Button asChild variant="link" size="sm">
              <a href="#/manager/reports" className="flex items-center gap-1">
                Semua Laporan
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </a>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-on-surface">
                <thead className="border-b border-outline-variant/40 bg-surface-container-low text-on-surface-variant font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Kode Booking</th>
                    <th className="px-4 py-3">Tamu</th>
                    <th className="px-4 py-3">Properti & Kamar</th>
                    <th className="px-4 py-3">Check-In</th>
                    <th className="px-4 py-3">Total Harga</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">
                        Memuat data pemesanan...
                      </td>
                    </tr>
                  ) : !stats?.recentBookings || stats.recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">
                        Belum ada transaksi pemesanan.
                      </td>
                    </tr>
                  ) : (
                    stats.recentBookings.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-container-low/50 transition">
                        <td className="px-4 py-3.5 font-mono font-bold text-primary">{item.code}</td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold">{item.guestName}</p>
                          <p className="text-[11px] text-on-surface-variant">{item.guestEmail}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium">{item.propertyName}</p>
                          <p className="text-[11px] text-on-surface-variant">{item.roomName}</p>
                        </td>
                        <td className="px-4 py-3.5 font-medium">{item.checkIn || '-'}</td>
                        <td className="px-4 py-3.5 font-bold">{formatCurrency(item.totalPrice)}</td>
                        <td className="px-4 py-3.5 text-right">{renderStatusBadge(item.bookingStatus)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
