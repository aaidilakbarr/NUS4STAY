import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import Breadcrumbs from '../components/Breadcrumbs';
import ManagerNavigation from '../components/ManagerNavigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { DatePicker } from '../components/ui/date-picker';
import { ScrollArea } from '../components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { getFilteredManagerBookings, exportToCSV, formatCurrency } from '../services/manager';

export default function ManagerReports() {
  const [activeTab, setActiveTab] = useState('booking'); // 'booking' | 'revenue'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [startDateObj, setStartDateObj] = useState(null);
  const [endDateObj, setEndDateObj] = useState(null);

  const startDateStr = startDateObj ? format(startDateObj, 'yyyy-MM-dd') : '';
  const endDateStr = endDateObj ? format(endDateObj, 'yyyy-MM-dd') : '';

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getFilteredManagerBookings({
        status: activeTab === 'revenue' ? 'confirmed' : status,
        search,
        startDate: startDateStr,
        endDate: endDateStr,
      });
      setBookings(data);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError(err.message || 'Gagal memuat laporan.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, endDateStr, search, startDateStr, status]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadReportData();
  };

  const handleResetFilter = () => {
    setSearch('');
    setStatus('all');
    setStartDateObj(null);
    setEndDateObj(null);
  };

  const handleExportCSV = () => {
    if (activeTab === 'booking') {
      const headers = [
        'Kode Booking',
        'Nama Tamu',
        'Email Tamu',
        'Telepon Tamu',
        'Properti',
        'Lokasi',
        'Kamar',
        'Check-In',
        'Check-Out',
        'Jumlah Tamu',
        'Total Harga (IDR)',
        'Status Booking',
        'Status Pembayaran',
        'Metode Pembayaran',
        'Tanggal Transaksi',
      ];

      const rows = bookings.map((b) => [
        b.code,
        b.guestName,
        b.guestEmail,
        b.guestPhone,
        b.propertyName,
        b.propertyLocation,
        b.roomName,
        b.checkIn,
        b.checkOut,
        b.guestCount,
        b.totalPrice,
        b.bookingStatus,
        b.paymentStatus,
        b.paymentMethod,
        b.createdAt ? new Date(b.createdAt).toLocaleString('id-ID') : '-',
      ]);

      exportToCSV(`Laporan_Pemesanan_NUS4STAY_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    } else {
      const headers = [
        'Kode Booking',
        'Nama Tamu',
        'Properti',
        'Kamar',
        'Check-In',
        'Check-Out',
        'Pendapatan (IDR)',
        'Metode Pembayaran',
        'Tanggal Pelunasan',
      ];

      const confirmedOnly = bookings.filter(
        (b) => b.paymentStatus === 'paid' || b.bookingStatus === 'confirmed' || b.bookingStatus === 'completed'
      );

      const rows = confirmedOnly.map((b) => [
        b.code,
        b.guestName,
        b.propertyName,
        b.roomName,
        b.checkIn,
        b.checkOut,
        b.totalPrice,
        b.paymentMethod,
        b.paidAt ? new Date(b.paidAt).toLocaleString('id-ID') : (b.createdAt ? new Date(b.createdAt).toLocaleString('id-ID') : '-'),
      ]);

      exportToCSV(`Laporan_Pendapatan_NUS4STAY_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    }
  };

  const totalCalculatedRevenue = bookings
    .filter((b) => b.paymentStatus === 'paid' || b.bookingStatus === 'confirmed' || b.bookingStatus === 'completed')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const renderStatusBadge = (bStatus) => {
    switch (bStatus) {
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
        return <Badge variant="secondary">{bStatus}</Badge>;
    }
  };

  return (
    <main className="page-shell py-8 text-left md:py-12">
      <div className="flex flex-col gap-6">
        <Breadcrumbs
          items={[
            { label: 'Beranda', href: '#/' },
            { label: 'Manager', href: '#/manager/dashboard' },
            { label: 'Laporan' },
          ]}
        />

        <ManagerNavigation current="reports" />

        <div className="flex flex-col gap-4 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-level-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-label-md text-xs uppercase tracking-[0.18em] text-tertiary">Manager Console</p>
            <h1 className="mt-2 font-headline-xl text-3xl font-bold text-primary">Laporan Pemesanan & Pendapatan</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Filter data transaksi dan ekspor berkas CSV untuk keperluan pencatatan dan audit keuangan.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleExportCSV}
            disabled={loading || bookings.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV ({activeTab === 'booking' ? 'Pemesanan' : 'Pendapatan'})
          </Button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-outline-variant/40">
          <button
            type="button"
            onClick={() => setActiveTab('booking')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition ${
              activeTab === 'booking'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            Laporan Pemesanan (Bookings)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('revenue')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition ${
              activeTab === 'revenue'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">savings</span>
            Laporan Pendapatan (Revenue)
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-error/20 bg-error-container/40 p-4 text-sm text-on-error-container">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Toolbar Filter Card */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Laporan</CardTitle>
            <CardDescription>Sesuaikan pencarian dan rentang tanggal transaksi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Pencarian
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Cari kode, nama tamu, properti..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low pl-9 pr-3 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {activeTab === 'booking' && (
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none h-11">
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="confirmed">Terkonfirmasi (Confirmed)</SelectItem>
                      <SelectItem value="pending_payment">Menunggu Pembayaran</SelectItem>
                      <SelectItem value="payment_review">Verifikasi Pembayaran</SelectItem>
                      <SelectItem value="cancelled">Dibatalkan</SelectItem>
                      <SelectItem value="expired">Kedaluwarsa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Dari Tanggal Check-In
                </label>
                <DatePicker
                  selected={startDateObj}
                  onSelect={setStartDateObj}
                  allowPastDates={true}
                  placeholder="Pilih tanggal awal"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Sampai Tanggal Check-In
                </label>
                <DatePicker
                  selected={endDateObj}
                  onSelect={setEndDateObj}
                  allowPastDates={true}
                  placeholder="Pilih tanggal akhir"
                />
              </div>
            </form>

            <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3 text-xs">
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" onClick={loadReportData}>
                  <span className="material-symbols-outlined text-[16px]">filter_alt</span>
                  Terapkan Filter
                </Button>
                {(search || status !== 'all' || startDateObj || endDateObj) && (
                  <Button type="button" variant="ghost" size="sm" onClick={handleResetFilter}>
                    <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                    Reset Filter
                  </Button>
                )}
              </div>

              <div className="font-medium text-on-surface-variant">
                Ditemukan: <span className="font-bold text-on-surface">{bookings.length}</span> transaksi
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table Card */}
        <Card>
          <CardContent className="pt-6">
            <ScrollArea className="w-full">
              <table className="w-full text-left text-xs text-on-surface">
                <thead className="border-b border-outline-variant/40 bg-surface-container-low text-on-surface-variant font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Kode</th>
                    <th className="px-4 py-3">Tamu</th>
                    <th className="px-4 py-3">Properti & Kamar</th>
                    <th className="px-4 py-3">Check-In / Out</th>
                    <th className="px-4 py-3">Metode Bayar</th>
                    <th className="px-4 py-3">Total Harga</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-on-surface-variant">
                        Memuat data laporan...
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-on-surface-variant">
                        Tidak ada transaksi pemesanan yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-container-low/50 transition">
                        <td className="px-4 py-3.5 font-mono font-bold text-primary">{item.code}</td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold">{item.guestName}</p>
                          <p className="text-[11px] text-on-surface-variant">{item.guestEmail}</p>
                          <p className="text-[11px] text-on-surface-variant">{item.guestPhone}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium">{item.propertyName}</p>
                          <p className="text-[11px] text-on-surface-variant">{item.roomName}</p>
                        </td>
                        <td className="px-4 py-3.5 font-medium">
                          <p>{item.checkIn || '-'}</p>
                          <p className="text-[11px] text-on-surface-variant">s/d {item.checkOut || '-'}</p>
                        </td>
                        <td className="px-4 py-3.5">{item.paymentMethod}</td>
                        <td className="px-4 py-3.5 font-bold text-on-surface">
                          {formatCurrency(item.totalPrice)}
                        </td>
                        <td className="px-4 py-3.5 text-right">{renderStatusBadge(item.bookingStatus)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {!loading && bookings.length > 0 && (
                  <tfoot className="border-t-2 border-outline-variant/60 bg-surface-container-low font-bold">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-right uppercase text-xs text-on-surface-variant">
                        Total Omset Terkonfirmasi:
                      </td>
                      <td colSpan={2} className="px-4 py-3 text-left text-sm text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(totalCalculatedRevenue)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
