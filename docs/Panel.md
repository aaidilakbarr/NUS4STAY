# Panel Admin & Manager — NUS4STAY

Dokumentasi panel internal NUS4STAY: apa yang sudah live, bagaimana cara kerjanya, arsitektur datanya, dan roadmap halaman yang belum dibangun. Panduan visualnya ada di [`Design-Panel.md`](Design-Panel.md).

## Ringkasan

NUS4STAY punya dua panel internal dengan peran berbeda:

- **Admin** — operasional & bisa menulis: kelola properti/kamar, verifikasi pembayaran.
- **Manager** — monitoring read-only: dashboard performa, laporan, analitik.

Panel diakses lewat rute hash `#/admin/*` dan `#/manager/*`, di-guard oleh `RoleGuard`, dan seluruh data sensitif di-enforce ulang oleh Supabase RLS + RPC (keamanan tidak pernah bergantung pada frontend saja).

## RBAC singkat

| Aspek | Detail |
| --- | --- |
| Sumber role | Kolom `role` di tabel `profiles` (`guest` / `admin` / `manager`), dibuat otomatis oleh trigger `handle_new_user()` |
| Frontend guard | `src/components/RoleGuard.jsx` — belum login → `#/login`; role tidak cocok → `#/` |
| Backend enforce | RLS per tabel + helper RPC `is_booking_admin()` (admin) dan `is_booking_staff()` (admin + manager) |
| Proteksi role | Trigger `prevent_profile_role_change()` — hanya admin atau `service_role` yang bisa mengubah role siapa pun |

Referensi lengkap: [`RBAC.md`](RBAC.md) dan [`security.md`](security.md).

## Route map

Daftar route diambil dari tabel route `src/routes/getRouteInfo.js` (hash router, `protected: true` + `roles`).

| Rute | Halaman | File komponen | Akses |
| --- | --- | --- | --- |
| `#/admin/properties` | Admin — Properti | `src/pages/AdminProperties.jsx` | `admin` |
| `#/admin/payments` | Admin — Verifikasi | `src/pages/AdminVerification.jsx` | `admin` |
| `#/manager/dashboard` | Manager — Dashboard | `src/pages/ManagerDashboard.jsx` | `manager` |
| `#/manager/reports` | Manager — Laporan | `src/pages/ManagerReports.jsx` | `manager` |
| `#/manager/analytics` | Manager — Analitik | `src/pages/ManagerAnalytics.jsx` | `manager` |

Navigasi: `src/components/AdminNavigation.jsx` (Properti, Verifikasi) dan `src/components/ManagerNavigation.jsx` (Dashboard, Laporan, Analitik). Link masuk panel ada di `src/components/Navbar.jsx` — ikon `admin_panel_settings` untuk admin, `monitoring` untuk manager.

## Halaman Admin

### 1. Properti — `#/admin/properties`

CRUD properti beserta kamar-kamarnya.

- Daftar properti (termasuk yang non-aktif) dengan **search** (nama/lokasi, client-side) dan **pagination** 10 item/halaman (`ITEMS_PER_PAGE = 10`).
- **Wizard modal 3 langkah** untuk create/edit: **Properti** (nama, lokasi, harga, deskripsi, 3 gambar) → **Kamar** (tambah/hapus kamar: nama, harga, 3 gambar, deskripsi, amenitas, toggle aktif) → **Verifikasi** (ringkasan + simpan).
- **Amenitas preset**: 12 untuk properti (Wi-Fi, Kolam Renang, Private Pool, Ocean View, Gym, Spa, Breakfast, Parking, AC, Bathtub, Balcony, Restaurant) dan 12 untuk kamar (King Bed, Queen Bed, Twin Bed, Smart TV, Bathtub, Balcony, Ocean View, Jacuzzi, Workspace, Mini Bar, AC, Breakfast).
- Upload gambar ke bucket storage `property-images` (subfolder `properties/` dan `rooms/`), maksimal 3 per properti/kamar.
- Visibilitas via toggle `is_active` (Publik / Pribadi).
- Hapus properti lewat `ConfirmModal`; umpan balik sukses/gagal lewat `NotificationModal`.

Service: `src/services/admin.js` → `adminProperties.list({ page, limit })` (dan mutasi lain di objek yang sama).

### 2. Verifikasi — `#/admin/payments`

Antrean verifikasi bukti pembayaran transfer.

- **Filter tab**: Perlu diperiksa / Disetujui / Ditolak / Semua — status diturunkan dari `getVerificationState()` (review / approved / rejected / unknown).
- **Search** client-side: kode booking, nama/email tamu, nama properti.
- **Master–detail layout**: daftar kiri, detail kanan; preview bukti bayar via **signed URL 10 menit** (gambar atau PDF) dari bucket privat `payment-proofs`.
- **Approve** → RPC `approve_payment` — booking jadi `confirmed`/lunas, menulis `reviewed_by`, dan membuat notifikasi `payment_approved` untuk tamu.
- **Reject** → RPC `reject_payment` — booking kembali ke `pending_payment` dengan jendela bayar baru (30 menit), mencatat penolakan, dan membuat notifikasi `payment_rejected`.
- Badge jumlah antrean (pill amber) di item nav "Verifikasi" dari `pendingCount`.

Service: `src/services/admin.js` → `adminPayments.list({ page, limit })`; RPC di `supabase/migrations/202607130015_notification_admin_rpc.sql` (final) dan `202607130002_booking_rpc.sql`.

## Halaman Manager

Seluruh halaman manager **read-only** — tidak ada aksi tulis. Data diagregasi **client-side** dari semua booking (lihat [Arsitektur data](#arsitektur-data)).

### 3. Dashboard — `#/manager/dashboard`

- **KPI cards**: Total Bookings (breakdown Sukses/Menunggu/Batal), Total Revenue (hanya lunas/terkonfirmasi), Occupancy Rate (dengan progress bar), dan shortcut ke halaman Analitik.
- Statistik 6 bulan (volume booking & omset, bar sederhana).
- 5 booking terbaru dengan badge status (`Terkonfirmasi` / `Menunggu` / `Dibatalkan`).
- Tombol **Refresh** dan shortcut **Laporan**.

Service: `src/services/manager.js` → `getManagerDashboardStats()`.

> Catatan: KPI cards memakai warna ekor langsung (emerald/amber/rose/indigo) di luar token semantik — gap visual yang sudah dicatat di `Design-Panel.md`.

### 4. Laporan — `#/manager/reports`

- **Tab**: Laporan Pemesanan / Laporan Pendapatan.
- **Filter**: search, status booking, rentang tanggal check-in (`DatePicker` dengan locale `id-ID`).
- **Export CSV** (`exportToCSV`, UTF-8 BOM, format Indonesia): kolom berbahasa Indonesia (Kode Booking, Nama Tamu, Email Tamu, Telepon Tamu, Properti, Lokasi, Kamar, Check-In, Check-Out, Jumlah Tamu, Total Harga (IDR), Status Booking, Status Pembayaran, Metode Pembayaran, Tanggal Transaksi).
- Tab pendapatan hanya menghitung transaksi `paid` / `confirmed` / `completed`, dengan footer **"Total Omset Terkonfirmasi"**.

Service: `src/services/manager.js` → `getFilteredManagerBookings({ status, search, startDate, endDate })` + `exportToCSV`.

### 5. Analitik — `#/manager/analytics`

- **Ranking Properti Terpopuler** (top 5, dengan medali #1 emas / #2 perak / #3 perunggu).
- **Tren pendapatan bulanan** (bar chart sederhana).
- **Tabel performa per properti** (volume booking & pendapatan).

Service: `src/services/manager.js` → `getManagerAnalyticsData()`.

## Arsitektur data

- **Service layer**: `src/services/db.js` (guest), `admin.js` (admin), `manager.js` (manager), `notificationDb.js` (notifikasi). Halaman panel tidak query Supabase langsung.
- **Agregasi manager masih client-side**: `getManagerDashboardStats()` / `getManagerAnalyticsData()` menarik semua booking lalu menghitung di browser. RPC agregat `booking_operations_snapshot()` sudah ada di `202607130005_booking_operations.sql` tapi **belum dikonsumsi** — peluang optimasi ke depan.
- **Formatter**: `src/utils/formatters.js` (Rupiah, tanggal, nama file bukti) dan `src/utils/pricing.js` (`getLowestRoomPrice`).
- **Notifikasi**: `NotificationContext` + tabel notifikasi; admin memicu notifikasi ke tamu lewat RPC (`payment_approved` / `payment_rejected`); ada policy sim untuk demo (`202607130014*`).

## Roadmap (belum diimplementasikan)

Halaman berikut tercantum di `docs/RBAC.md` sebagai route admin yang direncanakan, tapi **belum ada komponen/navnya**:

| Rute | Fungsi |
| --- | --- |
| `#/admin/dashboard` | Dashboard admin (ringkasan operasional) |
| `#/admin/rooms` | Manajemen kamar terpisah (saat ini digabung di wizard Properti) |
| `#/admin/bookings` | Manajemen booking (lihat semua, update status) |
| `#/admin/users` | Manajemen user (lihat semua user, ubah role) |

### Gap terdokumentasi dari `docs/analisa.md`

- Admin & manager **tidak bisa membuka** `#/pending` dan `#/history` karena route-nya `roles: ['guest']` — perlu keputusan produk apakah staff boleh melihat alur tamu.
- `RoleGuard` menulis `window.location.hash` **saat render** (temuan B7) — rawan re-render/loop; sebaiknya dipindah ke effect.
- Manager saat ini **overprivileged**: bisa membaca semua booking/payment (C8) — kalau butuh pembatasan data, pisahkan via RLS atau RPC agregat yang lebih ketat.

## Referensi silang

- [`Design.md`](Design.md) — design system global (token, tipografi, warna).
- [`Design-Panel.md`](Design-Panel.md) — panduan desain khusus panel ini.
- [`RBAC.md`](RBAC.md) — model role & permission matrix.
- [`API.md`](API.md) — route, service, RPC, tabel.
- [`security.md`](security.md) — aturan RLS & keamanan.
- [`analisa.md`](analisa.md) — audit aplikasi (temuan & roadmap perbaikan).
