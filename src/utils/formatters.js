export function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price).replace('IDR', 'Rp');
}

export const formatRupiahDisplay = (value) => {
  if (!value || value === '0') return '';
  const num = String(value).replace(/\D/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('id-ID').format(Number(num));
};

export const parseRupiahValue = (displayValue) => {
  return displayValue.replace(/\./g, '');
};

export function formatDateTime(value) {
  if (!value) return 'Belum tersedia';

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
}

export function formatStayDate(value) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

export const getProofFileName = (path) => decodeURIComponent(path?.split('/').pop() || 'bukti-pembayaran');

export const getProofType = (path) => {
  const extension = path?.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) return 'image';
  return 'other';
};
