import { supabase } from '../lib/supabase';

const MANAGER_BOOKING_SELECT = `
  booking_id,
  booking_code,
  guest_name,
  guest_email,
  guest_phone,
  check_in,
  check_out,
  guest_count,
  total_price,
  booking_status,
  payment_status,
  payment_method,
  created_at,
  updated_at,
  paid_at,
  properties(id, name, location, image),
  rooms(id, name, price)
`;

/**
 * Utility helper to handle relation objects returned by Supabase
 */
const getSingleRelation = (rel) => (Array.isArray(rel) ? rel[0] : rel) || {};

/**
 * Utility to format currency to IDR
 */
export const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Fetch all bookings data for Manager view
 */
export async function fetchAllManagerBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select(MANAGER_BOOKING_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching manager bookings:', error);
    throw new Error(error.message || 'Gagal mengambil data booking manager.');
  }

  return (data || []).map((item) => {
    const prop = getSingleRelation(item.properties);
    const room = getSingleRelation(item.rooms);

    return {
      id: item.booking_id,
      code: item.booking_code || item.booking_id,
      guestName: item.guest_name || 'Tamu',
      guestEmail: item.guest_email || '-',
      guestPhone: item.guest_phone || '-',
      checkIn: item.check_in,
      checkOut: item.check_out,
      guestCount: Number(item.guest_count || 1),
      totalPrice: Number(item.total_price || 0),
      bookingStatus: item.booking_status,
      paymentStatus: item.payment_status,
      paymentMethod: item.payment_method || 'Transfer Manual',
      createdAt: item.created_at,
      paidAt: item.paid_at,
      propertyName: prop.name || 'Properti',
      propertyLocation: prop.location || '-',
      roomName: room.name || 'Kamar',
    };
  });
}

/**
 * Get aggregated Dashboard statistics for Manager
 */
export async function getManagerDashboardStats() {
  const bookings = await fetchAllManagerBookings();

  const totalBookings = bookings.length;

  // Paid or confirmed bookings generate revenue
  const confirmedBookings = bookings.filter(
    (b) => b.paymentStatus === 'paid' || b.bookingStatus === 'confirmed' || b.bookingStatus === 'completed'
  );

  const pendingBookings = bookings.filter(
    (b) => b.bookingStatus === 'pending_payment' || b.bookingStatus === 'payment_review'
  );

  const cancelledBookings = bookings.filter(
    (b) => b.bookingStatus === 'cancelled' || b.bookingStatus === 'expired'
  );

  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0);

  // Estimate Occupancy Rate (% ratio of confirmed bookings over total bookings)
  const occupancyRate = totalBookings > 0
    ? Math.round((confirmedBookings.length / totalBookings) * 100)
    : 0;

  // Group by Month (Last 6 Months)
  const monthlyMap = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  bookings.forEach((b) => {
    if (!b.createdAt) return;
    const date = new Date(b.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

    if (!monthlyMap[key]) {
      monthlyMap[key] = { key, label, totalBookings: 0, confirmedBookings: 0, revenue: 0 };
    }

    monthlyMap[key].totalBookings += 1;
    if (b.paymentStatus === 'paid' || b.bookingStatus === 'confirmed' || b.bookingStatus === 'completed') {
      monthlyMap[key].confirmedBookings += 1;
      monthlyMap[key].revenue += b.totalPrice;
    }
  });

  const monthlyStats = Object.values(monthlyMap)
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-6);

  return {
    totalBookings,
    totalRevenue,
    occupancyRate,
    confirmedCount: confirmedBookings.length,
    pendingCount: pendingBookings.length,
    cancelledCount: cancelledBookings.length,
    monthlyStats,
    recentBookings: bookings.slice(0, 5),
  };
}

/**
 * Get Analytics breakdown data (Most booked properties & trends)
 */
export async function getManagerAnalyticsData() {
  const bookings = await fetchAllManagerBookings();

  // Aggregate by Property
  const propertyMap = {};

  bookings.forEach((b) => {
    const pName = b.propertyName;
    if (!propertyMap[pName]) {
      propertyMap[pName] = {
        name: pName,
        location: b.propertyLocation,
        totalBookings: 0,
        confirmedBookings: 0,
        totalRevenue: 0,
      };
    }

    propertyMap[pName].totalBookings += 1;
    if (b.paymentStatus === 'paid' || b.bookingStatus === 'confirmed' || b.bookingStatus === 'completed') {
      propertyMap[pName].confirmedBookings += 1;
      propertyMap[pName].totalRevenue += b.totalPrice;
    }
  });

  const propertyStats = Object.values(propertyMap).sort(
    (a, b) => b.totalBookings - a.totalBookings
  );

  // Monthly trends for chart view
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyTrendMap = {};

  bookings.forEach((b) => {
    if (!b.createdAt) return;
    const date = new Date(b.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

    if (!monthlyTrendMap[key]) {
      monthlyTrendMap[key] = { key, label, total: 0, revenue: 0 };
    }

    monthlyTrendMap[key].total += 1;
    if (b.paymentStatus === 'paid' || b.bookingStatus === 'confirmed' || b.bookingStatus === 'completed') {
      monthlyTrendMap[key].revenue += b.totalPrice;
    }
  });

  const monthlyTrends = Object.values(monthlyTrendMap)
    .sort((a, b) => a.key.localeCompare(b.key));

  return {
    propertyStats,
    mostBookedProperties: propertyStats.slice(0, 5),
    monthlyTrends,
  };
}

/**
 * Filter bookings dataset for Report view
 */
export async function getFilteredManagerBookings({ status = 'all', search = '', startDate = '', endDate = '' }) {
  let bookings = await fetchAllManagerBookings();

  if (status && status !== 'all') {
    bookings = bookings.filter((b) => b.bookingStatus === status || b.paymentStatus === status);
  }

  if (search) {
    const q = search.toLowerCase();
    bookings = bookings.filter(
      (b) =>
        b.code.toLowerCase().includes(q) ||
        b.guestName.toLowerCase().includes(q) ||
        b.guestEmail.toLowerCase().includes(q) ||
        b.propertyName.toLowerCase().includes(q)
    );
  }

  if (startDate) {
    bookings = bookings.filter((b) => b.checkIn >= startDate);
  }

  if (endDate) {
    bookings = bookings.filter((b) => b.checkIn <= endDate);
  }

  return bookings;
}

/**
 * Utility function to trigger CSV Download in Browser
 */
export function exportToCSV(filename, headers, rows) {
  if (!rows || !rows.length) {
    alert('Tidak ada data yang dapat diekspor.');
    return;
  }

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCSV).join(',');
  const rowLines = rows.map((row) => row.map(escapeCSV).join(','));

  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
