/**
 * Centralized error handler & sanitizer for Nus4Stay.
 * Menjamin error database/Postgres/Supabase tidak membocorkan detail skema/infrastruktur (CWE-209),
 * serta menyajikan pesan dalam format Plain Language (Nielsen Norman Heuristic #9).
 */

const DEFAULT_FALLBACK = 'Terjadi kendala saat memproses permintaan. Silakan coba beberapa saat lagi.';

/**
 * Regex untuk mendeteksi istilah teknis database/skema yang tidak boleh bocor ke antarmuka pengguna.
 */
const SENSITIVE_DB_TERMS = /\b(supabase|postgres|postgrest|relation|table|profiles|properties|rooms|bookings|payments|notifications|column|foreign key|primary key|constraint|schema|violates|duplicate key|syntax error|pg_)\b/i;

/**
 * Sanitasi pesan error teknis menjadi pesan ramah pengguna.
 *
 * @param {Error|Object|string} error - Error object atau string pesan
 * @param {string} [contextFallback] - Pesan fallback khusus konteks (opsional)
 * @returns {string} Pesan yang aman ditampilkan di UI
 */
export function sanitizeAppError(error, contextFallback = DEFAULT_FALLBACK) {
  if (!error) return contextFallback;

  // Catat detail teknis lengkap hanya di console developer untuk investigasi / debugging
  if (typeof window !== 'undefined' && import.meta.env?.DEV) {
    console.error('[AppError Technical Log]:', {
      raw: error,
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
    });
  }

  const rawString = typeof error === 'string' ? error : '';
  const message = error?.message || rawString;
  const details = error?.details || '';
  const hint = error?.hint || '';
  const code = String(error?.code || '');

  const combinedErrorText = [message, details, hint, code].filter(Boolean).join(' ');

  // 1. Hak Akses / RLS / Permission Denied / 42501
  if (/row-level security|permission denied|not allowed|unauthorized|forbidden|42501/i.test(combinedErrorText)) {
    return 'Anda tidak memiliki hak akses untuk melakukan tindakan ini. Hubungi administrator jika membutuhkan izin.';
  }

  // 2. Storage / Upload / Bucket
  if (/bucket|storage|object|mime_type|file_size/i.test(combinedErrorText)) {
    return 'Gagal mengunggah file. Pastikan format file sesuai (JPG/PNG) dan ukuran file tidak melebihi batas (maksimal 10 MB).';
  }

  // 3. Skema / Tabel tidak ditemukan / Database Maintenance
  if (/relation .* does not exist|column .* does not exist|schema|42P01/i.test(combinedErrorText)) {
    return 'Layanan sedang mengalami kendala teknis atau pemeliharaan sistem. Silakan coba kembali nanti.';
  }

  // 4. Jaringan / Timeout / Offline
  if (/network|failed to fetch|timeout|fetch error|abort/i.test(combinedErrorText)) {
    return 'Koneksi internet terputus atau server tidak merespons. Periksa jaringan internet Anda dan coba lagi.';
  }

  // 5. Autentikasi / JWT expired
  if (/jwt expired|invalid claim|invalid token|session expired/i.test(combinedErrorText)) {
    return 'Sesi login Anda telah berakhir. Silakan masuk kembali untuk melanjutkan.';
  }

  // 6. Transisi status atau konflik data
  if (/INVALID_STATUS_TRANSITION/i.test(combinedErrorText)) {
    return 'Status transaksi telah diperbarui. Silakan muat ulang halaman sebelum mengambil keputusan.';
  }

  if (/BOOKING_NOT_FOUND/i.test(combinedErrorText)) {
    return 'Data booking tidak ditemukan atau sudah tidak tersedia.';
  }

  if (/PAYMENT_ALREADY_PROCESSED/i.test(combinedErrorText)) {
    return 'Pembayaran untuk booking ini sudah pernah diproses sebelumnya.';
  }

  // 7. Jika pesan error aman dan tidak membocorkan istilah teknis database
  if (message && !SENSITIVE_DB_TERMS.test(message)) {
    return message;
  }

  return contextFallback;
}

/**
 * Membuat Error instance baru dengan pesan yang sudah disanitasi,
 * namun tetap menyimpan referensi error asli pada properti `cause`.
 *
 * @param {Error|Object|string} error
 * @param {string} [contextFallback]
 * @returns {Error}
 */
export function createSafeError(error, contextFallback = DEFAULT_FALLBACK) {
  const safeMessage = sanitizeAppError(error, contextFallback);
  const safeErr = new Error(safeMessage);
  safeErr.cause = error;
  if (error?.code) {
    safeErr.code = error.code;
  }
  return safeErr;
}
