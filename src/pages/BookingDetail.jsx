import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { useAuth } from '../contexts/useAuth';

export default function BookingDetail() {
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookingDetails() {
      const hash = window.location.hash;
      const parts = hash.split('/');
      // Expected format: #/history-detail/:bookingId
      const id = parts[parts.length - 1]?.split('?')[0] || '';

      setLoading(true);
      const data = await db.getBookingById(id);
      setBooking(data);
      setLoading(false);
    }

    loadBookingDetails();
    window.addEventListener('hashchange', loadBookingDetails);
    return () => window.removeEventListener('hashchange', loadBookingDetails);
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price).replace("IDR", "Rp");
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-[#EAF2E8] text-[#34662B]';
      case 'Pending':
        return 'bg-[#FDF6E2] text-[#B2700D]';
      case 'Cancelled':
        return 'bg-[#FDF0EE] text-[#C53F3F]';
      default:
        return 'bg-surface-container text-on-surface-variant';
    }
  };

  const calculateNights = (startStr, endStr) => {
    if (!startStr || !endStr) return 1;
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diff = end.getTime() - start.getTime();
    const nights = Math.ceil(diff / (1000 * 3600 * 24));
    return nights > 0 ? nights : 1;
  };

  const getPaymentMethodLabel = (method) => {
    if (method === 'transfer') return 'Transfer Bank';
    if (method === 'card') return 'Kartu Kredit';
    return 'E-Wallet';
  };

  const escapeHtml = (value) => {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const handlePrintInvoice = () => {
    if (!booking) return;

    const invoiceNights = calculateNights(booking.checkIn, booking.checkOut);
    const paymentMethod = getPaymentMethodLabel(booking.paymentMethod);
    const issuedAt = new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date());

    const invoiceWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!invoiceWindow) {
      alert('Pop-up diblokir. Izinkan pop-up untuk mencetak invoice.');
      return;
    }

    invoiceWindow.document.write(`
      <!doctype html>
      <html lang="id">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Invoice ${escapeHtml(booking.id)} - NUS4STAY</title>
          <style>
            @page { size: A4; margin: 18mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              color: #171c15;
              background: #ffffff;
              font-family: Inter, Arial, sans-serif;
              font-size: 13px;
              line-height: 1.5;
            }
            .invoice { max-width: 760px; margin: 0 auto; }
            .header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 24px;
              padding-bottom: 24px;
              border-bottom: 1px solid #dfe5dc;
            }
            .brand { display: flex; align-items: center; gap: 12px; }
            .brand img { width: 46px; height: 46px; object-fit: contain; }
            .brand-title { font-size: 22px; font-weight: 800; letter-spacing: 0.08em; color: #344E2B; }
            .muted { color: #657060; }
            .invoice-title { text-align: right; }
            .invoice-title h1 { margin: 0 0 4px; font-size: 28px; color: #344E2B; }
            .invoice-title p { margin: 0; }
            .section { padding: 22px 0; border-bottom: 1px solid #edf0eb; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
            .label { margin: 0 0 4px; color: #657060; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
            .value { margin: 0; font-weight: 700; }
            .property { display: grid; grid-template-columns: 128px 1fr; gap: 18px; align-items: center; }
            .property img { width: 128px; height: 96px; border-radius: 10px; object-fit: cover; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th {
              padding: 10px 0;
              border-bottom: 1px solid #dfe5dc;
              color: #657060;
              font-size: 11px;
              letter-spacing: 0.08em;
              text-align: left;
              text-transform: uppercase;
            }
            td { padding: 14px 0; border-bottom: 1px solid #edf0eb; vertical-align: top; }
            .amount { text-align: right; font-weight: 700; }
            .total-row td {
              border-bottom: 0;
              color: #344E2B;
              font-size: 18px;
              font-weight: 800;
            }
            .note {
              margin-top: 24px;
              padding: 14px 16px;
              border: 1px solid #dfe5dc;
              border-radius: 10px;
              background: #fafbf9;
              color: #4f554c;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <main class="invoice">
            <header class="header">
              <div class="brand">
                <img src="/logo_nus4stay.svg" alt="NUS4STAY" />
                <div>
                  <div class="brand-title">NUS4STAY</div>
                  <p class="muted" style="margin: 2px 0 0;">Premium Hotel & Villa Booking</p>
                </div>
              </div>
              <div class="invoice-title">
                <h1>Invoice</h1>
                <p class="muted">Tanggal terbit: ${escapeHtml(issuedAt)}</p>
                <p class="value">#${escapeHtml(booking.id)}</p>
              </div>
            </header>

            <section class="section grid">
              <div>
                <p class="label">Ditagihkan kepada</p>
                <p class="value">${escapeHtml(booking.guestName)}</p>
                <p class="muted">${escapeHtml(booking.guestEmail)}</p>
                <p class="muted">${escapeHtml(booking.guestPhone)}</p>
              </div>
              <div>
                <p class="label">Status pembayaran</p>
                <p class="value">${escapeHtml(booking.status)}</p>
                <p class="muted">${escapeHtml(paymentMethod)}</p>
              </div>
            </section>

            <section class="section property">
              <img src="${escapeHtml(booking.propertyImage)}" alt="${escapeHtml(booking.propertyName)}" />
              <div>
                <p class="label">Properti</p>
                <p class="value">${escapeHtml(booking.propertyName)}</p>
                <p class="muted">${escapeHtml(booking.propertyLocation)}</p>
                <p class="muted">${escapeHtml(booking.roomName)} · ${escapeHtml(booking.guests)}</p>
              </div>
            </section>

            <section class="section grid">
              <div>
                <p class="label">Check-in</p>
                <p class="value">${escapeHtml(booking.checkIn)}</p>
                <p class="muted">Dari 14:00</p>
              </div>
              <div>
                <p class="label">Check-out</p>
                <p class="value">${escapeHtml(booking.checkOut)}</p>
                <p class="muted">Sebelum 12:00</p>
              </div>
            </section>

            <section class="section">
              <p class="label">Rincian pembayaran</p>
              <table>
                <thead>
                  <tr>
                    <th>Deskripsi</th>
                    <th class="amount">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Harga kamar</strong><br />
                      <span class="muted">${escapeHtml(invoiceNights)} malam · ${escapeHtml(booking.roomName)}</span>
                    </td>
                    <td class="amount">${escapeHtml(formatPrice(booking.totalPrice))}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Pajak & Biaya Layanan</strong><br />
                      <span class="muted">Termasuk dalam total pembayaran</span>
                    </td>
                    <td class="amount">Rp 0</td>
                  </tr>
                  <tr class="total-row">
                    <td>Total terbayar</td>
                    <td class="amount">${escapeHtml(formatPrice(booking.totalPrice))}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <p class="note">
              Invoice ini diterbitkan otomatis oleh NUS4STAY untuk bukti pemesanan dan pembayaran.
            </p>
          </main>
          <script>
            window.addEventListener('load', () => {
              window.print();
              setTimeout(() => window.close(), 500);
            });
          </script>
        </body>
      </html>
    `);
    invoiceWindow.document.close();
  };

  if (loading) {
    return <div className="py-20 text-center font-body-md text-on-surface-variant">Loading booking details...</div>;
  }

  if (!booking) {
    return (
      <div className="py-20 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-[48px] text-error mb-2">warning</span>
        <h3 className="font-headline-md text-lg font-bold mb-1">Booking Not Found</h3>
        <p className="mb-4 text-sm">Data booking tidak ditemukan untuk akun ini.</p>
        <a href="#/history" className="text-primary underline">Return to Booking History</a>
      </div>
    );
  }

  const nights = calculateNights(booking.checkIn, booking.checkOut);

  return (
    <main className="page-shell py-8 text-left md:py-12">
      
      {/* Header & Back Action */}
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => window.location.hash = '#/history'}
          aria-label="Kembali ke Daftar Riwayat" 
          className="p-2 rounded-full hover:bg-surface-variant transition-colors flex items-center justify-center text-on-surface"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
        </button>
        <h1 className="font-headline-lg text-headline-lg md:font-headline-xl md:text-3xl text-on-surface font-bold">
          Detail Pemesanan
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-card-gap">
        {/* Left Column: Primary Details */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Status & Booking ID Card */}
          <section className="bg-surface rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-outline-variant/30 shadow-sm">
            <div>
              <p className="font-label-md text-xs text-on-surface-variant mb-1 font-semibold">ID Pemesanan</p>
              <p className="font-headline-md text-xl text-on-surface font-bold font-mono">{booking.id}</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-label-md text-sm font-bold ${getStatusBadgeClass(booking.status)}`}>
              <span className="material-symbols-outlined text-[18px] fill-1">
                {booking.status === 'Confirmed' ? 'check_circle' : booking.status === 'Pending' ? 'pending' : 'cancel'}
              </span>
              {booking.status}
            </div>
          </section>

          {/* Property Details Bento Card */}
          <section className="bg-surface rounded-xl shadow-sm overflow-hidden border border-outline-variant/30 group">
            <div className="flex flex-col sm:flex-row">
              <div className="w-full sm:w-1/3 h-48 sm:h-auto relative overflow-hidden">
                <img 
                  alt={booking.propertyName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  src={booking.propertyImage} 
                />
              </div>
              
              <div className="p-6 flex-grow flex flex-col justify-between sm:w-2/3">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-headline-md text-lg text-on-surface font-bold">{booking.propertyName}</h3>
                    <p className="font-body-md text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {booking.propertyLocation}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-outline-variant/10 pt-4 text-xs">
                    <div>
                      <p className="text-on-surface-variant font-medium">Check-in</p>
                      <p className="font-bold text-on-surface mt-0.5">{booking.checkIn}</p>
                      <p className="text-[10px] text-on-surface-variant">Dari 14:00</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant font-medium">Check-out</p>
                      <p className="font-bold text-on-surface mt-0.5">{booking.checkOut}</p>
                      <p className="text-[10px] text-on-surface-variant">Sebelum 12:00</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant font-medium">Durasi</p>
                      <p className="font-bold text-on-surface mt-0.5">{nights} Malam</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant font-medium">Kamar</p>
                      <p className="font-bold text-on-surface mt-0.5">{booking.roomName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Guest and Billing details */}
          <section className="bg-surface rounded-xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <h3 className="font-headline-md text-base text-primary font-bold border-b border-outline-variant/10 pb-2">
              Detail Pengunjung
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-on-surface-variant font-medium">Nama Tamu Utama</p>
                <p className="font-bold text-on-surface mt-0.5">{booking.guestName}</p>
              </div>
              <div>
                <p className="text-on-surface-variant font-medium">Jumlah Tamu</p>
                <p className="font-bold text-on-surface mt-0.5">{booking.guests}</p>
              </div>
              <div>
                <p className="text-on-surface-variant font-medium">Alamat Email</p>
                <p className="font-bold text-on-surface mt-0.5">{booking.guestEmail}</p>
              </div>
              <div>
                <p className="text-on-surface-variant font-medium">Nomor Telepon</p>
                <p className="font-bold text-on-surface mt-0.5">{booking.guestPhone}</p>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column: Invoice Actions & Summary */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-primary text-on-primary rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[28px]">receipt_long</span>
              <div>
                <h3 className="font-headline-md text-base font-bold">Invoice Pemesanan</h3>
                <p className="text-xs opacity-80 mt-1">#{booking.id}</p>
              </div>
            </div>

            <button
              onClick={handlePrintInvoice}
              className="w-full bg-on-primary text-primary py-3 rounded-xl font-label-md text-xs font-bold hover:bg-primary-fixed transition-colors active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
              Cetak Invoice PDF
            </button>
          </div>

          {/* Pricing Invoice Summary */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-headline-md text-sm text-on-surface font-bold border-b border-outline-variant/10 pb-2">
              Rincian Pembayaran
            </h3>
            
            <div className="space-y-2 text-xs text-on-surface-variant">
              <div className="flex justify-between">
                <span>Harga Kamar ({nights} malam)</span>
                <span>{formatPrice(booking.totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak &amp; Biaya Layanan</span>
                <span>Rp 0</span>
              </div>
              <div className="flex justify-between font-bold text-on-surface text-sm pt-2 border-t border-outline-variant/10">
                <span>Total Terbayar</span>
                <span className="text-primary">{formatPrice(booking.totalPrice)}</span>
              </div>
            </div>

            <div className="bg-surface rounded-lg p-3 border border-outline-variant/20 flex items-center gap-2 text-xs text-on-surface-variant mt-4">
              <span className="material-symbols-outlined text-primary text-base">verified</span>
              <span>Lunas via {getPaymentMethodLabel(booking.paymentMethod)}</span>
            </div>
          </div>

        </aside>
      </div>

    </main>
  );
}
