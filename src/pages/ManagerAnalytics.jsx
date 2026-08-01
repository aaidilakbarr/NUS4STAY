import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../components/Breadcrumbs';
import ManagerNavigation from '../components/ManagerNavigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { getManagerAnalyticsData, formatCurrency } from '../services/manager';

export default function ManagerAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await getManagerAnalyticsData();
      setData(result);
    } catch (err) {
      console.error('Error loading manager analytics:', err);
      setError(err.message || 'Gagal memuat data analitik.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const maxPropertyBookings = data?.propertyStats?.[0]?.totalBookings || 1;
  const maxMonthlyRevenue = Math.max(
    ...(data?.monthlyTrends?.map((m) => m.revenue) || [1]),
    1
  );

  return (
    <main className="page-shell py-8 text-left md:py-12">
      <div className="flex flex-col gap-6">
        <Breadcrumbs
          items={[
            { label: 'Beranda', href: '#/' },
            { label: 'Manager', href: '#/manager/dashboard' },
            { label: 'Analitik' },
          ]}
        />

        <ManagerNavigation current="analytics" />

        <div className="flex flex-col gap-4 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-level-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-label-md text-xs uppercase tracking-[0.18em] text-tertiary">Manager Console</p>
            <h1 className="mt-2 font-headline-xl text-3xl font-bold text-primary">Analitik & Tren Bisnis</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Analisis properti terpopuler, tren transaksi bulanan, dan distribusi pendapatan NUS4STAY.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={loadAnalytics} disabled={loading}>
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            Refresh Analitik
          </Button>
        </div>

        {error && (
          <div className="rounded-2xl border border-error/20 bg-error-container/40 p-4 text-sm text-on-error-container">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Analytics Top Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Most Booked Properties */}
          <Card>
            <CardHeader>
              <p className="font-label-md text-xs uppercase tracking-[0.18em] text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                Ranking Properti
              </p>
              <CardTitle className="mt-1">Properti Terpopuler (Most Booked)</CardTitle>
              <CardDescription>
                Urutan properti berdasarkan total volume pemesanan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-12 text-center text-xs text-on-surface-variant">Memuat data properti...</div>
              ) : !data?.mostBookedProperties || data.mostBookedProperties.length === 0 ? (
                <div className="py-12 text-center text-xs text-on-surface-variant">Belum ada transaksi properti.</div>
              ) : (
                <div className="space-y-4">
                  {data.mostBookedProperties.map((prop, idx) => {
                    const percentage = Math.round((prop.totalBookings / maxPropertyBookings) * 100);
                    return (
                      <div key={prop.name} className="space-y-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-xl font-bold text-xs ${
                                idx === 0
                                  ? 'bg-amber-400 text-amber-950 font-extrabold shadow-sm'
                                  : idx === 1
                                  ? 'bg-slate-300 text-slate-900 font-bold'
                                  : idx === 2
                                  ? 'bg-amber-700/20 text-amber-800 dark:text-amber-300 font-bold'
                                  : 'bg-surface-container text-on-surface-variant'
                              }`}
                            >
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-xs text-on-surface">{prop.name}</p>
                              <p className="text-[11px] text-on-surface-variant">{prop.location}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-extrabold text-xs text-primary">{prop.totalBookings} Booking</p>
                            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                              {formatCurrency(prop.totalRevenue)}
                            </p>
                          </div>
                        </div>

                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Revenue Trends */}
          <Card>
            <CardHeader>
              <p className="font-label-md text-xs uppercase tracking-[0.18em] text-emerald-600 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
                Tren Pendapatan
              </p>
              <CardTitle className="mt-1">Tren Pendapatan Bulanan</CardTitle>
              <CardDescription>
                Grafik omset terkonfirmasi yang berhasil dikumpulkan per bulan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-12 text-center text-xs text-on-surface-variant">Memuat tren pendapatan...</div>
              ) : !data?.monthlyTrends || data.monthlyTrends.length === 0 ? (
                <div className="py-12 text-center text-xs text-on-surface-variant">Belum ada tren bulanan.</div>
              ) : (
                <div className="space-y-4">
                  {data.monthlyTrends.map((m) => {
                    const fillPct = Math.round((m.revenue / maxMonthlyRevenue) * 100);
                    return (
                      <div key={m.key} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-on-surface">{m.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-on-surface-variant">{m.total} Transaksi</span>
                            <span className="font-bold text-emerald-600">{formatCurrency(m.revenue)}</span>
                          </div>
                        </div>

                        <div className="flex h-4 w-full overflow-hidden rounded-lg bg-surface-container">
                          <div
                            className="h-full rounded-lg bg-emerald-600 transition-all duration-500"
                            style={{ width: `${Math.max(5, fillPct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Property Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Performa Keseluruhan Properti</CardTitle>
            <CardDescription>
              Rincian total pemesanan terkonfirmasi dan kontribusi omset tiap properti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <table className="w-full text-left text-xs text-on-surface">
                <thead className="border-b border-outline-variant/40 bg-surface-container-low text-on-surface-variant font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Properti</th>
                    <th className="px-4 py-3">Lokasi</th>
                    <th className="px-4 py-3">Total Pemesanan</th>
                    <th className="px-4 py-3">Pemesanan Lunas</th>
                    <th className="px-4 py-3 text-right">Total Pendapatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">
                        Memuat data...
                      </td>
                    </tr>
                  ) : !data?.propertyStats || data.propertyStats.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">
                        Belum ada data properti.
                      </td>
                    </tr>
                  ) : (
                    data.propertyStats.map((item) => (
                      <tr key={item.name} className="hover:bg-surface-container-low/50 transition">
                        <td className="px-4 py-3.5 font-bold text-on-surface">{item.name}</td>
                        <td className="px-4 py-3.5 text-on-surface-variant">{item.location}</td>
                        <td className="px-4 py-3.5 font-semibold">{item.totalBookings} Booking</td>
                        <td className="px-4 py-3.5 font-semibold text-emerald-700 dark:text-emerald-400">
                          {item.confirmedBookings} Terkonfirmasi
                        </td>
                        <td className="px-4 py-3.5 font-extrabold text-right text-primary">
                          {formatCurrency(item.totalRevenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
