import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { useAuth } from '../contexts/useAuth';
import StarRating from '../components/StarRating';

export default function BookingDetail() {
  const { user, profile } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewMessageType, setReviewMessageType] = useState('info');

  useEffect(() => {
    async function loadBookingDetails() {
      const hash = window.location.hash;
      const parts = hash.split('/');
      // Expected format: #/history-detail/:bookingId
      const id = parts[parts.length - 1]?.split('?')[0] || '';

      setLoading(true);
      const data = await db.getBookingById(id);
      setBooking(data);
      setReviewRating(data?.review?.rating || 0);
      setReviewComment(data?.review?.comment || '');
      setReviewMessage('');
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
      case 'confirmed':
        return 'bg-[#EAF2E8] text-[#34662B]';
      case 'completed':
        return 'bg-[#DBEAFE] text-[#1E40AF]';
      case 'pending_payment':
      case 'payment_review':
        return 'bg-[#FDF6E2] text-[#B2700D]';
      case 'expired':
      case 'cancelled':
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

  const getJakartaDate = (value) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(value || Date.now()));
    const getPart = (type) => parts.find((part) => part.type === type)?.value;
    return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!booking || reviewRating < 1) {
      setReviewMessage('Pilih jumlah bintang sebelum mengirim ulasan.');
      setReviewMessageType('error');
      return;
    }

    setReviewSaving(true);
    setReviewMessage('');

    try {
      const review = await db.submitPropertyReview({
        bookingId: booking.id,
        rating: reviewRating,
        comment: reviewComment,
      });

      setBooking((current) => ({ ...current, review, hasReview: true }));
      setReviewMessage('Rating berhasil diterbitkan dan langsung dihitung pada nilai property.');
      setReviewMessageType('success');
    } catch (error) {
      setReviewMessage(error.message);
      setReviewMessageType('error');
    } finally {
      setReviewSaving(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!booking || (booking.bookingStatus !== 'confirmed' && booking.bookingStatus !== 'completed') || booking.paymentStatus !== 'paid') return;

    const invoiceNights = calculateNights(booking.checkIn, booking.checkOut);
    const paymentMethod = getPaymentMethodLabel(booking.paymentMethod);
    const issuedAt = new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(booking.paidAt || booking.updatedAt || Date.now()));

    const invoiceName = profile?.full_name || user?.user_metadata?.full_name || booking.guestName || 'Tamu NUS4STAY';
    const invoicePhone = profile?.phone || user?.user_metadata?.phone || booking.guestPhone || '-';

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
          <title>Invoice ${escapeHtml(booking.bookingCode)} - NUS4STAY</title>
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
                <p class="value">#${escapeHtml(booking.bookingCode)}</p>
              </div>
            </header>

            <section class="section grid">
              <div>
                <p class="label">Ditagihkan kepada</p>
                <p class="value">${escapeHtml(invoiceName)}</p>
                <p class="label">Nomor Telepon</p>
                <p class="value">${escapeHtml(invoicePhone)}</p>
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
  const isInvoiceAvailable = (booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'completed') && booking.paymentStatus === 'paid';
  const isStayCompleted = Boolean(
    isInvoiceAvailable
    && booking.checkOut
    && getJakartaDate(booking.serverNow || Date.now()) >= booking.checkOut
  );

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
              <p className="font-headline-md text-xl text-on-surface font-bold font-mono">{booking.bookingCode}</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-label-md text-sm font-bold ${getStatusBadgeClass(booking.bookingStatus)}`}>
              <span className="material-symbols-outlined text-[18px] fill-1">
                {booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'completed' ? 'check_circle' : booking.bookingStatus === 'pending_payment' || booking.bookingStatus === 'payment_review' ? 'pending' : booking.bookingStatus === 'expired' ? 'event_busy' : 'cancel'}
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
                <p className="font-bold text-on-surface mt-0.5">{profile?.full_name || user?.user_metadata?.full_name || booking.guestName || 'Tamu NUS4STAY'}</p>
              </div>
              <div>
                <p className="text-on-surface-variant font-medium">Jumlah Tamu</p>
                <p className="font-bold text-on-surface mt-0.5">{booking.guests}</p>
              </div>
              <div>
                <p className="text-on-surface-variant font-medium">Alamat Email</p>
                <p className="font-bold text-on-surface mt-0.5">{user?.email || booking.guestEmail || '-'}</p>
              </div>
              <div>
                <p className="text-on-surface-variant font-medium">Nomor Telepon</p>
                <p className="font-bold text-on-surface mt-0.5">{profile?.phone || user?.user_metadata?.phone || booking.guestPhone || '-'}</p>
              </div>
            </div>
          </section>

          {isInvoiceAvailable ? (
            <section className="overflow-hidden rounded-2xl border border-tertiary/25 bg-surface shadow-sm">
              <div className="flex items-start gap-3 border-b border-tertiary/15 bg-tertiary-container/45 px-5 py-4">
                <span className="material-symbols-outlined text-[25px] text-tertiary" aria-hidden="true">auto_stories</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-tertiary-container/70">Guestbook NUS4STAY</p>
                  <h3 className="mt-1 font-headline-md text-lg font-bold text-on-surface">Bagikan pengalaman menginap</h3>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                    Satu rating terverifikasi untuk setiap booking yang sudah selesai.
                  </p>
                </div>
              </div>

              {booking.review ? (
                <div className="p-5 md:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <StarRating value={booking.review.rating} readOnly />
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-fixed/35 px-3 py-1.5 text-[11px] font-bold text-primary">
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">public</span>
                      Tayang publik
                    </span>
                  </div>
                  <blockquote className="mt-4 rounded-xl border-l-4 border-tertiary bg-surface-container-low px-4 py-3 font-headline-md text-base leading-7 text-on-surface">
                    “{booking.review.comment || `Memberikan ${booking.review.rating} bintang untuk pengalaman menginap ini.`}”
                  </blockquote>
                  <p className="mt-3 text-xs text-on-surface-variant">
                    Ulasan ini berasal dari booking {booking.bookingCode} dan tidak dapat dikirim ulang.
                  </p>
                </div>
              ) : isStayCompleted ? (
                <form onSubmit={handleReviewSubmit} className="space-y-5 p-5 md:p-6">
                  <fieldset>
                    <legend className="text-sm font-bold text-on-surface">Bagaimana pengalamanmu?</legend>
                    <p className="mt-1 text-xs text-on-surface-variant">Pilih 1 sampai 5 bintang.</p>
                    <div className="mt-3">
                      <StarRating value={reviewRating} onChange={setReviewRating} />
                    </div>
                  </fieldset>

                  <label className="block">
                    <span className="text-sm font-bold text-on-surface">Catatan untuk tamu berikutnya <span className="font-normal text-on-surface-variant">(opsional)</span></span>
                    <textarea
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value.slice(0, 1000))}
                      rows={4}
                      maxLength={1000}
                      placeholder="Ceritakan kenyamanan kamar, pelayanan, atau hal yang paling berkesan."
                      className="mt-2 w-full resize-y rounded-xl border border-outline-variant bg-surface px-4 py-3 text-sm leading-6 text-on-surface outline-none transition focus:border-primary"
                    />
                    <span className="mt-1 block text-right text-[11px] text-on-surface-variant">{reviewComment.length}/1000</span>
                  </label>

                  {reviewMessage ? (
                    <div
                      role="status"
                      className={`rounded-xl border px-3 py-2.5 text-xs ${
                        reviewMessageType === 'error'
                          ? 'border-error/20 bg-error-container/60 text-on-error-container'
                          : 'border-primary/20 bg-primary-fixed/35 text-on-primary-fixed-variant'
                      }`}
                    >
                      {reviewMessage}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={reviewSaving || reviewRating < 1}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary shadow-sm transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
                  >
                    <span className="material-symbols-outlined text-[19px]" aria-hidden="true">rate_review</span>
                    {reviewSaving ? 'Menerbitkan rating...' : 'Terbitkan rating'}
                  </button>
                </form>
              ) : (
                <div className="flex gap-3 p-5 text-sm text-on-surface-variant md:p-6">
                  <span className="material-symbols-outlined text-primary" aria-hidden="true">event_available</span>
                  <div>
                    <p className="font-bold text-on-surface">Rating terbuka setelah check-out</p>
                    <p className="mt-1 text-xs leading-5">
                      Kamu dapat menulis ulasan mulai tanggal {booking.checkOut}. Dengan begitu, rating benar-benar berasal dari pengalaman menginap.
                    </p>
                  </div>
                </div>
              )}

              {booking.review && reviewMessage ? (
                <div className="border-t border-outline-variant/35 px-5 py-3 text-xs text-on-primary-fixed-variant" role="status">
                  {reviewMessage}
                </div>
              ) : null}
            </section>
          ) : null}

        </div>

        {/* Right Column: Invoice Actions & Summary */}
        <aside className="lg:col-span-4 space-y-6">
          <div className={`${isInvoiceAvailable ? 'bg-primary text-on-primary' : 'border border-outline-variant/40 bg-surface-container text-on-surface'} rounded-2xl p-6 shadow-sm space-y-5`}>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[28px]">receipt_long</span>
              <div>
                <h3 className="font-headline-md text-base font-bold">Invoice Pemesanan</h3>
                <p className="text-xs opacity-80 mt-1">
                  {isInvoiceAvailable ? `Tersedia di akunmu · #${booking.bookingCode}` : 'Tersedia setelah pembayaran disetujui admin'}
                </p>
              </div>
            </div>

            {isInvoiceAvailable ? (
              <button
                onClick={handlePrintInvoice}
                className="w-full bg-on-primary text-primary py-3 rounded-xl font-label-md text-xs font-bold hover:bg-primary-fixed transition-colors active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                Cetak Invoice PDF
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-outline-variant/45 bg-surface px-3 py-3 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                Menunggu verifikasi pembayaran
              </div>
            )}
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
                <span>{isInvoiceAvailable ? 'Total Terbayar' : 'Total Booking'}</span>
                <span className="text-primary">{formatPrice(booking.totalPrice)}</span>
              </div>
            </div>

            <div className="bg-surface rounded-lg p-3 border border-outline-variant/20 flex items-center gap-2 text-xs text-on-surface-variant mt-4">
              <span className="material-symbols-outlined text-primary text-base">verified</span>
              <span>{isInvoiceAvailable ? `Lunas via ${getPaymentMethodLabel(booking.paymentMethod)}` : 'Invoice belum diterbitkan karena pembayaran belum disetujui.'}</span>
            </div>
          </div>

        </aside>
      </div>

    </main>
  );
}
