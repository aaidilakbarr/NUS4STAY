import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Breadcrumbs from '../components/Breadcrumbs';
import ManagerNavigation from '../components/ManagerNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { getManagerDashboardStats, formatCurrency } from '../services/manager';
import { formatStayDate } from '../utils/formatters';

const EMPTY_MONTHLY_STATS = [];

const STATUS_CONFIG = {
  confirmed: { label: 'Terkonfirmasi', icon: 'check_circle', variant: 'success' },
  completed: { label: 'Selesai', icon: 'task_alt', variant: 'success' },
  pending_payment: { label: 'Menunggu pembayaran', icon: 'schedule', variant: 'warning' },
  payment_review: { label: 'Perlu diverifikasi', icon: 'hourglass_top', variant: 'warning' },
  cancelled: { label: 'Dibatalkan', icon: 'cancel', variant: 'error' },
  expired: { label: 'Kedaluwarsa', icon: 'event_busy', variant: 'error' },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status || 'Tidak diketahui', icon: 'info', variant: 'outline' };

  return (
    <Badge variant={config.variant} className="gap-1.5 whitespace-nowrap">
      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{config.icon}</span>
      {config.label}
    </Badge>
  );
}

function MetricCard({ label, value, description, icon, tone = 'primary', children }) {
  const toneClasses = {
    primary: 'bg-primary/10 text-primary',
    warm: 'bg-tertiary-container text-tertiary',
    leaf: 'bg-primary-fixed/60 text-primary',
    quiet: 'bg-surface-container text-on-surface-variant',
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-primary/15" />
      <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
        <div>
          <p className="font-label-md text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">{label}</p>
          <p className="mt-3 font-headline-lg text-2xl font-bold text-on-surface">{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
          <span className="material-symbols-outlined text-[21px]" aria-hidden="true">{icon}</span>
        </span>
      </CardHeader>
      <CardContent>
        {children || <p className="text-xs leading-5 text-on-surface-variant">{description}</p>}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Memuat ringkasan manager">
      {[1, 2, 3, 4].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl border border-outline-variant/30 bg-surface" />)}
    </div>
  );
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setStats(await getManagerDashboardStats());
    } catch (loadError) {
      setError(loadError.message || 'Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const monthlyStats = stats?.monthlyStats ?? EMPTY_MONTHLY_STATS;
  const recentBookings = stats?.recentBookings ?? EMPTY_MONTHLY_STATS;
  const chartData = useMemo(() => {
    const maxRevenue = Math.max(...monthlyStats.map((item) => item.revenue), 1);
    const maxVolume = Math.max(...monthlyStats.map((item) => item.totalBookings), 1);
    const chartLeft = 48;
    const chartWidth = 652;
    const chartBottom = 190;
    const chartHeight = 170;
    const step = monthlyStats.length > 1 ? chartWidth / (monthlyStats.length - 1) : 0;

    return {
      maxRevenue,
      points: monthlyStats.map((item, index) => {
        const x = monthlyStats.length === 1 ? chartLeft + chartWidth / 2 : chartLeft + step * index;
        const barHeight = Math.max(12, (item.totalBookings / maxVolume) * chartHeight);
        const lineY = chartBottom - (item.revenue / maxRevenue) * chartHeight;

        return { ...item, x, barHeight, lineY };
      }),
    };
  }, [monthlyStats]);
  const confirmationRate = stats?.totalBookings
    ? Math.round((stats.confirmedCount / stats.totalBookings) * 100)
    : 0;

  return (
    <main className="page-shell py-8 text-left md:py-12">
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[
          { label: 'Beranda', href: '#/' },
          { label: 'Manager', href: '#/manager/dashboard' },
          { label: 'Dashboard' },
        ]} />

        <ManagerNavigation current="dashboard" />

        <header className="relative overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-level-1 md:p-8">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary-fixed/35 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="font-label-md text-xs uppercase tracking-[0.18em] text-tertiary">Manager Console</p>
              <h1 className="mt-2 font-headline-xl-mobile text-primary md:text-[42px] md:leading-[50px]">Ritme bisnis hari ini</h1>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                Pantau aliran booking, pendapatan terkonfirmasi, dan performa properti dari satu ruang monitoring.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="min-h-10">
                <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`} aria-hidden="true">refresh</span>
                {loading ? 'Memuat...' : 'Refresh data'}
              </Button>
              <Button asChild size="sm" className="min-h-10">
                <a href="#/manager/reports">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">description</span>
                  Buka laporan
                </a>
              </Button>
            </div>
          </div>
        </header>

        {error ? (
          <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-error/20 bg-error-container/60 p-4 text-sm text-on-error-container sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">error</span>
              <p>{error}</p>
            </div>
            <Button variant="destructive" size="sm" onClick={loadData} disabled={loading} className="min-h-10 shrink-0">Coba lagi</Button>
          </div>
        ) : null}

        {loading && !stats ? <DashboardSkeleton /> : (
          <section aria-label="KPI performa bisnis" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total bookings"
              value={stats?.totalBookings ?? 0}
              description="Seluruh booking yang tercatat"
              icon="book_online"
            >
              <div className="grid grid-cols-3 gap-2 border-t border-outline-variant/30 pt-3 text-xs">
                <span className="text-primary"><strong>{stats?.confirmedCount ?? 0}</strong> sukses</span>
                <span className="text-tertiary"><strong>{stats?.pendingCount ?? 0}</strong> menunggu</span>
                <span className="text-error"><strong>{stats?.cancelledCount ?? 0}</strong> batal</span>
              </div>
            </MetricCard>
            <MetricCard
              label="Revenue terkonfirmasi"
              value={formatCurrency(stats?.totalRevenue ?? 0)}
              description="Transaksi lunas atau terkonfirmasi"
              icon="payments"
              tone="leaf"
            />
            <MetricCard
              label="Occupancy rate"
              value={`${stats?.occupancyRate ?? 0}%`}
              description="Rasio booking sukses dari total booking"
              icon="hotel"
              tone="warm"
            >
              <div className="space-y-2">
                <div className="h-2 overflow-hidden rounded-full bg-surface-container" role="progressbar" aria-valuenow={stats?.occupancyRate ?? 0} aria-valuemin="0" aria-valuemax="100" aria-label="Occupancy rate">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, stats?.occupancyRate || 0)}%` }} />
                </div>
                <p className="text-xs text-on-surface-variant">{confirmationRate}% booking berakhir sukses</p>
              </div>
            </MetricCard>
            <MetricCard
              label="Properti aktif"
              value={stats?.totalProperties ?? 0}
              description={`${stats?.totalRooms ?? 0} kamar dan ${stats?.totalUsers ?? 0} profil terdaftar`}
              icon="apartment"
              tone="quiet"
            />
          </section>
        )}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-outline-variant/30 pb-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-label-md text-[11px] uppercase tracking-[0.14em] text-tertiary">Booking pulse</p>
                  <CardTitle className="mt-1">Statistik enam bulan</CardTitle>
                  <CardDescription className="mt-1">Volume booking dan omset terkonfirmasi per bulan.</CardDescription>
                </div>
                <Button asChild variant="link" size="sm" className="min-h-10 shrink-0 self-start">
                  <a href="#/manager/analytics">
                    Lihat analitik
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="py-12 text-center text-sm text-on-surface-variant">Memuat statistik...</div>
              ) : monthlyStats.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-low p-10 text-center">
                  <span className="material-symbols-outlined text-[36px] text-outline" aria-hidden="true">monitoring</span>
                  <p className="mt-3 text-sm font-semibold text-on-surface">Belum ada tren bulanan</p>
                  <p className="mt-1 text-xs text-on-surface-variant">Data akan muncul setelah booking tercatat.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative overflow-x-auto">
                    <svg viewBox="0 0 740 240" className="w-full min-w-[550px] overflow-visible">
                      <g className="text-[10px] fill-current text-outline font-sans">
                        <text x="0" y="24">{formatCurrency(chartData.maxRevenue)}</text>
                        <line x1="48" y1="20" x2="700" y2="20" className="stroke-outline-variant/40" strokeDasharray="3,3" />

                        <text x="0" y="110">{formatCurrency(Math.round(chartData.maxRevenue / 2))}</text>
                        <line x1="48" y1="105" x2="700" y2="105" className="stroke-outline-variant/40" strokeDasharray="3,3" />

                        <text x="0" y="195">Rp 0</text>
                        <line x1="48" y1="190" x2="700" y2="190" className="stroke-outline-variant/60" />
                      </g>

                      {chartData.points.map((p, idx) => {
                        const isLatest = idx === chartData.points.length - 1;
                        return (
                          <g key={p.key} className="group">
                            <rect
                              x={p.x - 16}
                              y={190 - p.barHeight}
                              width="32"
                              height={p.barHeight}
                              rx="4"
                              className={`transition-all duration-300 ${isLatest ? 'fill-primary/70 hover:fill-primary' : 'fill-primary/35 hover:fill-primary/55'}`}
                            >
                              <title>{`${p.totalBookings} booking`}</title>
                            </rect>
                            <text
                              x={p.x}
                              y="212"
                              textAnchor="middle"
                              className={`text-[11px] font-semibold font-sans fill-current ${isLatest ? 'text-primary' : 'text-on-surface-variant'}`}
                            >
                              {p.label}
                            </text>
                            <text
                              x={p.x}
                              y="226"
                              textAnchor="middle"
                              className="text-[9px] font-sans fill-current text-outline"
                            >
                              {p.totalBookings} booking
                            </text>
                          </g>
                        );
                      })}

                      {chartData.points.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="var(--color-tertiary)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={chartData.points.map((p) => `${p.x},${p.lineY}`).join(' ')}
                        />
                      )}

                      {chartData.points.map((p, idx) => {
                        const isLatest = idx === chartData.points.length - 1;
                        return (
                          <circle
                            key={`dot-${p.key}`}
                            cx={p.x}
                            cy={p.lineY}
                            r={isLatest ? 5 : 4}
                            className={`${isLatest ? 'fill-tertiary stroke-surface' : 'fill-tertiary stroke-surface'}`}
                            strokeWidth="2"
                          >
                            <title>{`Omset: ${formatCurrency(p.revenue)}`}</title>
                          </circle>
                        );
                      })}
                    </svg>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 pt-3 text-[11px] text-on-surface-variant">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-primary/60 border border-primary" /> Volume booking (Bar)</span>
                      <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-tertiary" /> Omset terkonfirmasi (Line)</span>
                    </div>
                    <span className="text-[10px] text-outline">Skala kiri: Omset (Rp)</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between bg-primary text-on-primary">
            <CardHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-on-primary/10">
                <span className="material-symbols-outlined text-[23px]" aria-hidden="true">visibility</span>
              </div>
              <CardTitle className="mt-5 text-on-primary">Ruang monitoring</CardTitle>
              <CardDescription className="text-on-primary/75">Manager hanya membaca data. Gunakan laporan dan analitik untuk membandingkan performa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href="#/manager/reports" className="flex min-h-12 items-center justify-between rounded-xl border border-on-primary/20 bg-on-primary/10 px-4 text-sm font-semibold transition hover:bg-on-primary/15">
                <span className="flex items-center gap-3"><span className="material-symbols-outlined text-[19px]" aria-hidden="true">description</span>Laporan booking</span>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
              </a>
              <a href="#/manager/analytics" className="flex min-h-12 items-center justify-between rounded-xl border border-on-primary/20 bg-on-primary/10 px-4 text-sm font-semibold transition hover:bg-on-primary/15">
                <span className="flex items-center gap-3"><span className="material-symbols-outlined text-[19px]" aria-hidden="true">analytics</span>Analitik properti</span>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
              </a>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="border-b border-outline-variant/30 pb-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-label-md text-[11px] uppercase tracking-[0.14em] text-tertiary">Activity ledger</p>
                <CardTitle className="mt-1">Booking terbaru</CardTitle>
                <CardDescription className="mt-1">Lima transaksi paling baru dalam sistem.</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="min-h-10 shrink-0 self-start">
                <a href="#/manager/reports">Buka semua laporan</a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs text-on-surface">
                <caption className="sr-only">Lima booking terbaru</caption>
                <thead className="border-b border-outline-variant/40 bg-surface-container-low text-[10px] uppercase tracking-[0.12em] text-on-surface-variant">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Kode booking</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Tamu</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Properti & kamar</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Check-in</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Total</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant">Memuat data pemesanan...</td></tr>
                  ) : recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center">
                        <span className="material-symbols-outlined block text-[34px] text-outline" aria-hidden="true">event_busy</span>
                        <p className="mt-2 font-semibold text-on-surface">Belum ada transaksi pemesanan.</p>
                        <p className="mt-1 text-on-surface-variant">Data booking akan tampil di sini.</p>
                      </td>
                    </tr>
                  ) : recentBookings.map((item) => (
                    <tr key={item.id} className="transition hover:bg-surface-container-low/60">
                      <th scope="row" className="px-4 py-4 font-mono font-bold text-primary">{item.code}</th>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-on-surface">{item.guestName}</p>
                        <p className="mt-1 max-w-[180px] truncate text-[11px] text-on-surface-variant">{item.guestEmail}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-on-surface">{item.propertyName}</p>
                        <p className="mt-1 text-[11px] text-on-surface-variant">{item.roomName}</p>
                      </td>
                      <td className="px-4 py-4 font-medium text-on-surface-variant">{formatStayDate(item.checkIn)}</td>
                      <td className="px-4 py-4 font-bold text-on-surface">{formatCurrency(item.totalPrice)}</td>
                      <td className="px-4 py-4 text-right"><StatusBadge status={item.bookingStatus} /></td>
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
