# API Documentation

## Overview

NUS4STAY menggunakan Supabase sebagai backend-as-a-service. Seluruh data diakses langsung dari frontend React melalui Supabase JavaScript client (`@supabase/supabase-js`). Tidak ada REST API server terpisah.

### Stack API
- **Database**: Supabase PostgreSQL (RLS-enabled)
- **Auth**: Supabase Auth (email/password)
- **Storage**: Supabase Storage (payment proofs, property images)
- **RPC**: PostgreSQL functions via `supabase.rpc()`
- **Client**: `src/lib/supabase.js` — initialized dengan anon key

---

## Front-end Routing

Routing menggunakan hash-based (`#/`) tanpa React Router. Definisi route di `src/routes/getRouteInfo.js`.

| Route | Page Component | Auth | Roles |
|-------|---------------|------|-------|
| `#/` | LandingPage | — | — |
| `#/search` | SearchResults | — | — |
| `#/detail/:id` | PropertyDetail | — | — |
| `#/room/:id` | RoomDetail | — | — |
| `#/login` | LoginPage | — | — |
| `#/history` | BookingHistory | Required | guest |
| `#/history-detail/:id` | BookingDetail | Required | guest |
| `#/checkout/:id` | Checkout | Required | guest, admin |
| `#/pending/:id` | PendingPayment | Required | guest |
| `#/profile` | ProfilePage | Required | guest, admin |
| `#/admin/properties` | AdminProperties | Required | admin |
| `#/admin/payments` | AdminVerification | Required | admin |

Routing di-render oleh `App.jsx` — `Navbar` dan `Footer` dikontrol per-route via properti `showNav` / `showFooter`.

---

## Authentication

### Flow
1. `supabase.auth.signUp()` — registrasi (email, password, full_name)
2. `supabase.auth.signInWithPassword()` — login
3. `supabase.auth.signOut()` — logout
4. Session otomatis di-load via `supabase.auth.getSession()` + `onAuthStateChange`

### Auth Context (`src/contexts/AuthContext.jsx`)
State yang diexpose via `useAuth()`:

| Property | Type | Description |
|----------|------|-------------|
| `session` | Session | Supabase session object |
| `user` | User | `session?.user` |
| `profile` | Object | `{ id, full_name, phone, role, created_at }` dari tabel `profiles` |
| `role` | String | `guest` / `admin` / `manager` |
| `isAuthenticated` | Boolean | Ada session aktif |
| `hasRole(roles)` | Function | Cek apakah user punya salah satu role |
| `refreshProfile()` | Function | Reload profile dari database |
| `profileError` | Object | Error profile loading |
| `authLoading` | Boolean | Loading state gabungan |

### Role Guard
Komponen `RoleGuard` membungkus halaman yang butuh otentikasi:

```jsx
<RoleGuard roles={['guest', 'admin']}>
  <ProfilePage />
</RoleGuard>
```

---

## Database Service (`src/services/db.js`)

Service untuk end-user (guest). Semua fungsi mengembalikan data yang sudah dinormalisasi.

### Properties

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `getDestinations()` | — | `Destination[]` | Daftar lokasi unik dari properti aktif |
| `getProperties(filters)` | `filters.search`, `filters.region`, `filters.maxPrice`, `filters.minRating`, `filters.amenities` | `Property[]` | Semua properti aktif, bisa difilter |
| `getPropertyById(id)` | `id: string` | `Property \| null` | Detail properti + rooms + reviews |

### Bookings

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `getBookingHistory()` | — | `Booking[]` | Semua booking milik user terautentikasi |
| `getBookingById(id)` | `id: string` | `Booking \| null` | Cari booking by ID atau booking_code |
| `createBooking(payload)` | `{ roomId, checkIn, checkOut, guestCount, idempotencyKey }` | `Booking` | Buat booking baru (RPC) |
| `cancelBooking(bookingId)` | `bookingId: string` | `Booking` | Batalkan booking (RPC) |
| `uploadPaymentProof(bookingId, file)` | `bookingId: string`, `file: File` | `Booking` | Upload bukti bayar + update booking |
| `submitPropertyReview(payload)` | `{ bookingId, rating, comment }` | `Review` | Submit rating properti (RPC) |

### Profile

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `updateProfile(payload)` | `{ full_name, phone }` | `void` | Update auth user metadata + tabel profiles |

---

## Admin Service (`src/services/admin.js`)

Service terpisah untuk operasi admin. Error dimapping dengan pesan Bahasa Indonesia.

### Properties

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `adminProperties.list()` | — | `Property[]` | Semua properti (termasuk non-aktif) |
| `adminProperties.create(payload)` | Property payload + image files | `Property` | Buat properti + sync rooms |
| `adminProperties.update(id, payload)` | `id`, property payload | `Property` | Update properti + sync rooms |
| `adminProperties.remove(id)` | `id: string` | `boolean` | Hapus properti |

### Payments

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `adminPayments.list()` | — | `Payment[]` | Booking dengan bukti bayar |
| `adminPayments.createProofUrl(proofPath)` | `proofPath: string` | `string` | Signed URL (10 menit) untuk preview bukti bayar |
| `adminPayments.approve(bookingId)` | `bookingId: string` | `Booking` | Setujui pembayaran (RPC) |
| `adminPayments.reject(bookingId)` | `bookingId: string` | `Booking` | Tolak pembayaran (RPC) |

---

## Notification Service (`src/services/notificationDb.js`)

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `getNotifications()` | — | `Notification[]` | 50 notifikasi terbaru milik user |
| `getUnreadCount()` | — | `number` | Jumlah notifikasi belum dibaca |
| `markAsRead(id)` | `id: string` | `void` | Tandai satu notifikasi sebagai dibaca |
| `markAllAsRead()` | — | `void` | Tandai semua notifikasi sebagai dibaca |
| `getPreferences()` | — | `Preferences \| null` | Preferensi notifikasi user |
| `upsertPreferences(prefs)` | `{ booking_updates, promotions }` | `Preferences` | Simpan preferensi notifikasi |

### Notification Structure

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "type": "booking_confirmed | booking_pending | payment_received | ...",
  "title": "Booking Dikonfirmasi",
  "message": "Booking #INV-XXX telah dikonfirmasi.",
  "data": { "href": "#/history-detail/..." },
  "is_read": false,
  "created_at": "2026-07-16T..."
}
```

### Preferences Structure

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "booking_updates": true,
  "promotions": false,
  "created_at": "...",
  "updated_at": "..."
}
```

### Notification Context (`src/contexts/NotificationContext.jsx`)

State yang diexpose via `useNotifications()`:

| Property | Type | Description |
|----------|------|-------------|
| `notifications` | `Notification[]` | Daftar notifikasi user |
| `unreadCount` | `number` | Jumlah notifikasi belum dibaca |
| `preferences` | `Preferences \| null` | Preferensi notifikasi user |
| `loading` | `boolean` | Loading state |
| `markAsRead(id)` | Function | Tandai satu notifikasi dibaca |
| `markAllAsRead()` | Function | Tandai semua dibaca |
| `updatePreferences(prefs)` | Function | Update preferensi |
| `refresh()` | Function | Reload notifikasi dari database |

Provider dipasang di `App.jsx` level atas:

```jsx
<NotificationProvider>
  <Navbar />
  <PageContent />
</NotificationProvider>
```

---

## PostgreSQL RPC Functions

Fungsi yang dipanggil via `supabase.rpc()`.

| RPC | Parameters | Description |
|-----|-----------|-------------|
| `create_booking` | `p_room_id`, `p_check_in`, `p_check_out`, `p_guest_count`, `p_idempotency_key` | Validasi ketersediaan + buat booking |
| `cancel_booking` | `p_booking_id` | Batalkan booking |
| `upload_payment_proof` | `p_booking_id`, `p_proof_path` | Simpan path bukti bayar |
| `approve_payment` | `p_booking_id`, `p_provider_event_id` | Setujui pembayaran → confirmed |
| `reject_payment` | `p_booking_id` | Tolak pembayaran → pending_payment |
| `expire_booking` | — | Cron: expiredkan booking lewat batas |
| `get_server_time` | — | Return timestamp server |
| `get_property_reviews` | `p_property_id`, `p_limit` | Reviews suatu properti |
| `submit_property_review` | `p_booking_id`, `p_rating`, `p_comment` | Submit review |

Detail implementasi SQL ada di `docs/rpc-function.md`.

---

## Database Tables

### `profiles`
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid | PK → auth.users | User ID |
| full_name | text | — | Nama lengkap |
| phone | text | — | Nomor telepon |
| role | text | `'guest'` | `guest` / `admin` / `manager` |
| created_at | timestamptz | `now()` | — |
| updated_at | timestamptz | `now()` | — |

### `notifications`
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | PK |
| user_id | uuid | — | FK → auth.users |
| type | text | — | Kategori notifikasi |
| title | text | — | Judul |
| message | text | — | Isi pesan |
| data | jsonb | `{}` | Data tambahan (href, dll) |
| is_read | boolean | `false` | Status baca |
| created_at | timestamptz | `now()` | — |

### `notification_preferences`
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | PK |
| user_id | uuid | — | FK → auth.users (unique) |
| booking_updates | boolean | `true` | Notifikasi perubahan booking |
| promotions | boolean | `false` | Notifikasi promosi |
| created_at | timestamptz | `now()` | — |
| updated_at | timestamptz | `now()` | — |

### `properties`, `rooms`, `bookings`, `payments`, `property_reviews`
Lihat `supabase/properties_schema.sql` dan file migrasi di `supabase/migrations/`.

---

## Storage Buckets

| Bucket | Visibility | Used For |
|--------|-----------|----------|
| `property-images` | Public | Gambar properti & kamar |
| `payment-proofs` | Private | Bukti transfer user |

---

## Error Handling

### Booking Errors (db.js)
Error dari RPC booking di-map ke kode error + pesan Bahasa Indonesia via `mapBookingError()`.

Kode error: `AUTH_REQUIRED`, `BOOKING_NOT_FOUND`, `ROOM_UNAVAILABLE`, `BOOKING_EXPIRED`, `PAYMENT_ALREADY_PROCESSED`, dll.

### Admin Errors (admin.js)
Error di-map via `mapAdminError()` dan `mapPaymentVerificationError()` dengan deteksi otomatis jenis error (RLS, storage, schema, dll).

---

## Notification Insert (via Supabase)

Notifikasi bisa dimasukkan langsung ke database oleh trigger atau admin:

```sql
INSERT INTO public.notifications (user_id, type, title, message, data)
VALUES (
  'user-uuid',
  'booking_confirmed',
  'Booking Dikonfirmasi',
  'Booking #INV-XXX telah dikonfirmasi.',
  '{"href": "#/history-detail/booking-id"}'
);
```

Atau via aplikasi nanti menggunakan Supabase Edge Function / database trigger pada tabel `bookings`.
