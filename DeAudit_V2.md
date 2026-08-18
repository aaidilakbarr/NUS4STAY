# NUS4STAY — Frontend to Backend Connectivity & Data Audit (DeAudit V2)
**Tanggal:** 18 Agustus 2026  
**Scope:** Seluruh 19 Halaman (`src/pages/*`), Layanan (`src/services/*`), Context (`src/contexts/*`), dan Database Migrations (`supabase/migrations/*`).

---

## 1. Ringkasan Eksekutif

Audit ini memeriksa secara menyeluruh apakah setiap interaksi pengguna, form submission, tombol aksi, filter, dan modal pada aplikasi frontend **benar-benar terhubung ke backend Supabase** (Database PostgreSQL, Auth, RPC, Storage Bucket) atau hanya berjalan secara lokal / semu di state React.

### Skor Konektivitas:
- **Total Halaman Diaudit:** 19 Halaman
- **Aksi Mutasi Nyata (Write ke Supabase):** 16 aksi (100% menggunakan API / RPC / Storage resmi)
- **Aksi "Fake" (Non-Backend / Hanya Pesan Lokal):** 1 aksi (`ProfilePage.jsx` - Hapus Akun)
- **Aksi Lokal By Design (Ekspor / Navigasi / Print):** 3 aksi (Ekspor CSV Manager, Cetak Invoice, Filter Pencarian)
- **Bug Kritis Ditemukan:** 3 bug (ReferenceError runtime, Label Payment Method salah, Potensi unmount RoleGuard)
- **Discrepancy Data Binding:** 5 temuan (Admin Properties Step 3 bypass, Room image omission, filter sync)

---

## 2. Matriks Konektivitas per Halaman (19 Halaman)

| No | Halaman (`src/pages/`) | Aksi Pengguna (Form / Tombol) | Terhubung ke Backend? | Target Backend (Tabel / RPC / Storage) | Status |
|:---|:---|:---|:---:|:---|:---:|
| 1 | `LoginPage.jsx` | Form Registrasi (Sign Up) | ✅ Ya | `auth.users` via `supabase.auth.signUp` | **Konek** |
| 2 | `LoginPage.jsx` | Form Masuk (Sign In) | ✅ Ya | `auth.users` via `supabase.auth.signInWithPassword` | **Konek** |
| 3 | `LoginPage.jsx` | Tombol Keluar (Logout) | ✅ Ya | `supabase.auth.signOut` | **Konek** |
| 4 | `ProfilePage.jsx` | Simpan Perubahan (Nama & Telepon) | ✅ Ya | `public.profiles` (update/insert) + `auth.users` metadata | **Konek** |
| 5 | `ProfilePage.jsx` | Simpan Preferensi Notifikasi | ✅ Ya | `public.notification_preferences` (upsert) | **Konek** |
| 6 | `ProfilePage.jsx` | Simulasi Notifikasi (4 Tombol) | ✅ Ya | `public.notifications` (insert via `createMockNotification`) | **Konek** |
| 7 | `ProfilePage.jsx` | Tombol Hapus Akun | ❌ **TIDAK** | **Hanya `setMessage` lokal (Fake Action)** | ⚠️ **Lokal** |
| 8 | `ProfilePage.jsx` | Tombol Keluar (Logout) | ✅ Ya | `supabase.auth.signOut` | **Konek** |
| 9 | `Checkout.jsx` | Form Buat Booking (Bayar Sekarang) | ✅ Ya | RPC `public.create_booking` | **Konek** |
| 10 | `PendingPayment.jsx`| Upload Bukti Pembayaran | ✅ Ya | Bucket `payment-proofs` + RPC `public.upload_payment_proof` | **Konek** |
| 11 | `PendingPayment.jsx`| Batalkan Pesanan | ✅ Ya | RPC `public.cancel_booking` | **Konek** |
| 12 | `BookingDetail.jsx` | Submit Rating & Ulasan | ✅ Ya | RPC `public.submit_property_review` | **Konek** |
| 13 | `BookingDetail.jsx` | Cetak Bukti / Unduh PDF | ℹ️ Lokal | `window.open` + `document.write` (Lokal print) | **By Design** |
| 14 | `BookingHistory.jsx`| Read Booking History | ✅ Ya | Query `public.bookings` | **Konek** |
| 15 | `AdminProperties.jsx`| Tambah Properti Baru | ✅ Ya | `public.properties` + `public.rooms` + Bucket `property-images` | **Konek** |
| 16 | `AdminProperties.jsx`| Edit Properti | ✅ Ya | `public.properties` + `public.rooms` + Bucket `property-images` | **Konek** |
| 17 | `AdminProperties.jsx`| Hapus Properti | ✅ Ya | `public.properties` (delete) | **Konek** |
| 18 | `AdminRooms.jsx` | Tambah Tipe Kamar | ✅ Ya | `public.rooms` (insert) | **Konek** |
| 19 | `AdminRooms.jsx` | Edit Tipe Kamar | ✅ Ya | `public.rooms` (update) | **Konek** |
| 20 | `AdminRooms.jsx` | Hapus Tipe Kamar | ✅ Ya | `public.rooms` (delete) | **Konek** |
| 21 | `AdminVerification.jsx`| Setujui Pembayaran | ✅ Ya | RPC `public.approve_payment` | **Konek** |
| 22 | `AdminVerification.jsx`| Tolak Pembayaran | ✅ Ya | RPC `public.reject_payment` | **Konek** |
| 23 | `AdminVerification.jsx`| Buka Bukti Pembayaran | ✅ Ya | Signed URL Bucket `payment-proofs` | **Konek** |
| 24 | `AdminBookings.jsx`| Approve / Reject / Cancel Booking | ✅ Ya | RPC `approve_payment`, `reject_payment`, `cancel_booking` | **Konek** |
| 25 | `AdminUsers.jsx` | Ubah Role Pengguna | ✅ Ya | RPC `public.admin_update_user_role` | **Konek** |
| 26 | `AdminDashboard.jsx`| Refresh / Ambil Statistik | ✅ Ya | Agregasi `bookings`, `properties`, `rooms`, `profiles` | **Konek** |
| 27 | `ManagerDashboard.jsx`| Ambil Statistik Manager | ✅ Ya | Query agregasi `public.bookings` | **Konek** |
| 28 | `ManagerAnalytics.jsx`| Ambil Tren & Properti Populer | ✅ Ya | Query agregasi `public.bookings` | **Konek** |
| 29 | `ManagerReports.jsx`| Ambil Laporan & Filter | ✅ Ya | Query terfilter `public.bookings` | **Konek** |
| 30 | `ManagerReports.jsx`| Ekspor Laporan ke CSV | ℹ️ Lokal | Generate Blob CSV client-side (`exportToCSV`) | **By Design** |
| 31 | `LandingPage.jsx` | Form Cari & Klik Destinasi | ℹ️ Navigasi | Mengubah URL Hash ke `#/search?...` lalu query DB | **Konek** |
| 32 | `SearchResults.jsx`| Filter Harga, Rating, Amenitas | ✅ Ya | Query reaktif `public.properties` | **Konek** |
| 33 | `PropertyDetail.jsx`| Reservasi Kamar (Buka Modal) | ℹ️ Navigasi | Mengarahkan ke `#/checkout/...` | **Konek** |
| 34 | `RoomDetail.jsx` | Form Pilih Tanggal & Pesan Sekarang | ℹ️ Navigasi | Mengarahkan ke `#/checkout/...` | **Konek** |

---

## 3. Investigasi Khusus: Kasus Update Profil (Nama vs Nomor Telepon)

### Masalah:
Saat melakukan simpan perubahan data profil di `ProfilePage.jsx`, nama berhasil tersimpan di database, tetapi nomor telepon dilaporkan belum masuk.

### Hasil Penelusuran Kode:
1. **Frontend (`ProfilePage.jsx:136`):**
   ```javascript
   await db.updateProfile({ full_name: name.trim(), phone: phone.trim() });
   ```
   Kedua field dikirim dalam satu objek payload.

2. **Backend Service (`src/services/db.js:405-451`):**
   ```javascript
   // Auth user metadata
   await supabase.auth.updateUser({ data: { full_name, phone } });

   // Database table update
   const { data: updatedRows, error } = await supabase
     .from('profiles')
     .update({ full_name, phone })
     .eq('id', user.id)
     .select('id');
   ```
   Perhatikan bahwa query `UPDATE public.profiles` mengupdate kolom `full_name` dan `phone` dalam **satu perintah SQL yang sama**.

3. **Penyebab Mengapa Nomor Telepon Tampak Belum Berubah:**
   - **Lokasi Pengecekan di Supabase Dashboard:** Jika mengecek di menu **Authentication -> Users**, kolom "Phone" hanya menampilkan `auth.users.phone` (nomor khusus SMS OTP internasional format E.164). Nilai yang diupdate lewat `user_metadata` tersimpan di JSON `raw_user_meta_data`, bukan di kolom `phone` auth.
   - **Tabel Sebenarnya:** Kolom `phone` yang benar berada pada **Table Editor -> `public.profiles` -> kolom `phone`**.
   - **Placeholder vs Value:** Pada form input `ProfilePage.jsx:324`, placeholder bertuliskan `08xxxxxxxxxx`. Jika pengguna tidak sengaja menganggap field tersebut sudah terisi padahal belum diketik, nilai yang terkirim adalah string kosong `""`.
   - **Fallback Row Creation:** Jika baris user di `public.profiles` belum dibuat sebelumnya (misalnya register sebelum trigger dipasang), perbaikan yang baru saja kita pasang di `db.js` + migration `202607130018_profile_insert_policy.sql` sudah menangani pembuatan baris baru dengan fallback `INSERT`.

---

## 4. Temuan Aksi "Fake" & Local-Only

### A. Aksi "Fake" (Tampak seperti aksi DB tetapi tidak mengeksekusi apa pun ke backend)
1. **`ProfilePage.jsx:388-392` — Tombol "Hapus Akun":**
   - **Kode:**
     ```jsx
     <AccountRow
       icon="delete"
       label="Hapus Akun"
       hint="Permintaan penghapusan data"
       danger
       onClick={() => setMessage('Hubungi dukungan untuk menghapus akun.')}
     />
     ```
   - **Dampak:** Tidak ada request penghapusan akun yang dikirim ke Supabase Auth maupun tabel database. Hanya memunculkan string pesan lokal.

### B. Aksi Local-Only By Design (Fitur yang memang seharusnya diolah di sisi browser)
1. **`ManagerReports.jsx:63-133` — Ekspor Laporan CSV:**
   - Menghasilkan file `.csv` langsung dari memory browser menggunakan `Blob` dan `URL.createObjectURL`. Data yang diekspor adalah data yang sebelumnya sudah di-fetch dari tabel `bookings`.
2. **`BookingDetail.jsx:123-314` — Cetak / Unduh Invoice PDF:**
   - Merender template HTML invoice dan membuka dialog cetak browser (`window.print()`).
3. **`SearchResults.jsx:77-252` — Filter Chip & Slider:**
   - Filter diolah di state React lokal lalu memicu query baru ke `public.properties`.

---

## 5. Daftar Bug & Discrepancy Terverifikasi di Frontend

### 🔴 Kritis (Menyebabkan Runtime Crash atau Kegagalan Fitur)

1. **`src/pages/RoomDetail.jsx:164` — `ReferenceError: getAmenityIcon is not defined`**
   - **Lokasi:** `RoomDetail.jsx` baris 164 memanggil `{getAmenityIcon(amen)}`, tetapi baris import (1-4) tidak mengimpor `getAmenityIcon` dari `../utils/formatters`.
   - **Dampak:** Halaman RoomDetail akan crash dengan layar putih saat mencoba merender icon amenitas.

2. **`src/components/RoleGuard.jsx:7` — Unmount Halaman saat Mutasi Auth (Sudah Diperbaiki)**
   - **Lokasi:** `RoleGuard.jsx` sebelumnya membaca `authLoading` yang mencakup `profileLoading`.
   - **Dampak:** Saat user mengklik simpan data profil, event auth memicu reload profile latar belakang, yang membuat `RoleGuard` meng-unmount `ProfilePage` dan menghancurkan modal sukses. *(Status: Sudah diperbaiki)*.

### 🟡 Sedang (Menyebabkan Data Inkonsisten atau Salah Tampil)

3. **`src/pages/BookingDetail.jsx:68-72` — Label Payment Method Mismatch**
   - **Lokasi:**
     ```javascript
     const getPaymentMethodLabel = (method) => {
       if (method === 'transfer') return 'Transfer Bank';
       if (method === 'card') return 'Kartu Kredit';
       return 'E-Wallet';
     };
     ```
   - **Masalah:** Database menyimpan nilai `payment_method = 'bank_transfer'`. Karena method tidak sama persis dengan `'transfer'`, fungsi selalu mengembalikan **"E-Wallet"** pada invoice dan halaman detail booking.
   - **Perbandingan:** `AdminBookings.jsx:349` memetakan `'bank_transfer'` secara benar.

4. **`src/services/admin.js:158-170` vs `src/pages/AdminRooms.jsx` — Inkonsistensi Kolom Kamar**
   - **Masalah 1:** Kamar yang dibuat melalui `AdminProperties` (syncRooms) tidak menyertakan kolom `max_guests` dan `inventory_count`.
   - **Masalah 2:** Kamar yang dibuat melalui `AdminRooms` tidak memiliki input gambar (`image` dan `images` null), sehingga jika kamar tersebut dibuka di halaman detail publik, tag `<img>` akan rusak/kosong.

5. **`src/pages/ManagerReports.jsx:33` vs `src/services/manager.js:213` — Booking `completed` Hilang dari Tab Pendapatan**
   - **Masalah:** Saat tab "Pendapatan" aktif, filter mengirim `status: 'confirmed'`. Di `manager.js`, filter mencocokkan `bookingStatus === 'confirmed' || paymentStatus === 'confirmed'`. Booking yang sudah selesai menginap memiliki `bookingStatus === 'completed'` dan `paymentStatus === 'paid'`, sehingga booking yang sudah selesai **tidak terhitung** di laporan pendapatan ManagerReports (padahal terhitung di ManagerDashboard).

6. **`src/pages/AdminProperties.jsx:635, 646, 663, 945` — Bypass Validasi Form Multi-Step**
   - **Masalah:** Atribut `required` HTML5 hanya ada di Step 1. Ketika user berada di Step 3 dan mengklik tombol "Simpan Properti", input Step 1 tidak ada di DOM, sehingga validasi HTML5 tidak berjalan dan properti dengan data kosong bisa lolos ke backend.

7. **`src/pages/AdminVerification.jsx` + `src/services/admin.js:326-347` — Total Halaman Paginasi Menggelembung**
   - **Masalah:** `count` diambil dari query database `bookings`, tetapi hasilnya kemudian di-filter di sisi JavaScript client (`filter(record => Boolean(record.proofPath))`). Hal ini menyebabkan angka paginasi menampilkan halaman kosong di akhir.

---

## 6. Rekomendasi Tindak Lanjut Prioritas

1. **Perbaiki Import `getAmenityIcon` di `RoomDetail.jsx`** agar tidak terjadi crash saat membuka detail kamar.
2. **Perbaiki pemetaan `'bank_transfer'` di `BookingDetail.jsx`** agar invoice tidak salah menampilkan metode pembayaran sebagai "E-Wallet".
3. **Harmonisasi filter `completed` di `ManagerReports.jsx`** agar sinkron dengan `ManagerDashboard.jsx`.
4. **Deploy / Push Migration `202607130018_profile_insert_policy.sql`** ke Supabase remote agar policy INSERT dan proteksi role profiles aktif di database produksi.
