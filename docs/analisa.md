# Rencana: Dokumen Analisa NUS4STAY (`docs/analisa.md`)

## Context

NUS4STAY adalah marketplace akomodasi (React 19 + Vite + Tailwind 4 + Supabase, tanpa server sendiri) yang sedang dikembangkan. User meminta analisa menyeluruh terhadap **alur**, **desain UI/UX**, dan **security** dengan `docs/` sebagai acuan, lalu dituangkan ke markdown untuk dianalisa lebih lanjut.

Hasil eksplorasi: fondasi backend-nya **jauh lebih matang dari yang dikira dokumen sendiri** — `implementation.md` §13 masih menandai 34 tugas booking sebagai belum selesai, padahal migrasi `202607130000`–`202607130013` sudah mengimplementasikan hampir seluruh Phase A–E (RPC transaksional, inventory ledger, RLS, pg_cron). Sebaliknya, ada **satu bug fungsional tingkat blocker yang belum tercatat di dokumen manapun**: tabel `profiles` tidak pernah terisi untuk user baru.

Deliverable: mengisi file `docs/analisa.md` (sudah ada di repo, saat ini kosong), **Bahasa Indonesia**, format **audit + roadmap perbaikan** (temuan bernomor dengan severity + bukti `file:line` + dampak, lalu rencana perbaikan berjenjang bergaya ID tugas seperti `implementation.md`).

Semua temuan di bawah sudah diverifikasi langsung terhadap kode/migrasi, bukan asumsi.

---

## Temuan yang akan ditulis

### Dulu yang benar (ditulis lebih dulu supaya audit ini jujur)
Harga 100% server-side (`create_booking` memakai `v_room.price`, klien tidak pernah mengirim harga) · penguncian `room_availability` `for update` berurutan tanggal + `AVAILABILITY_NOT_INITIALIZED` fail-closed (tidak pernah dianggap stok tak terbatas) · idempotency ganda (advisory lock + unique index) · higiene grant yang rapi (revoke dari `public`/`anon`, `search_path` dipatok, `security definer` terkendali) · tidak ada `service_role` key di frontend · bucket bukti transfer privat + signed URL 10 menit + path di-regex `^<uid>/<bookingId>/[^/]+$` · `supabase/tests/booking_contract.sql` sebagai uji privilege.

### A. Alur (10 temuan)
| # | Sev | Temuan | Bukti |
|---|---|---|---|
| A1 | **Blocker** | Baris `profiles` tidak pernah dibuat untuk user baru. Tidak ada trigger `handle_new_user` di `auth.users`, dan `profiles` **hanya** punya policy SELECT. Upsert dari klien pasti ditolak RLS — dan hasilnya tidak dicek sama sekali. Akibat: semua user jatuh ke fallback `role: 'guest'`; admin hanya bisa dibuat manual di dashboard Supabase. Klien juga mengirim kolom `role` — mati sekarang, tapi jadi jalur privilege escalation begitu policy write ditambah tanpa proteksi kolom. | `202607130003:51-56`, `202607130000:122-124` (tidak ada policy INSERT/UPDATE), `LoginPage.jsx:101-105`, `AuthContext.jsx:33-46` |
| A2 | **Blocker** | Update profil "sukses palsu". RLS memblokir → PostgREST balas 0 baris **tanpa error** → UI menampilkan "Profil berhasil diperbarui" padahal tabel tidak berubah. Hanya metadata `auth.updateUser` yang tersimpan. | `db.js:414-419`, `ProfilePage.jsx:127` |
| A3 | Tinggi | Admin terkunci dari alurnya sendiri: `#/checkout` mengizinkan `admin`, tetapi `#/pending`, `#/history`, `#/history-detail` hanya `guest`. Admin bisa checkout lalu langsung ditendang dari halaman pembayaran tujuannya. Bertentangan pula dengan matriks `RBAC.md` (Admin tidak boleh Create Booking). Perlu satu keputusan, lalu konsisten di 3 tempat. | `getRouteInfo.js:5-8`, `Checkout.jsx:125` |
| A4 | Sedang | Notifikasi mati total: tabel ada, tanpa policy INSERT, dan **tidak ada satu pun kode atau trigger yang menulis notifikasi**. Lonceng Navbar permanen kosong. Padahal semua event penting sudah melewati RPC — tempat ideal menuliskannya. | `202607130012`, `notificationDb.js` |
| A5 | Sedang | Horizon `room_availability` menyusut 1 hari setiap hari. Di-seed 540 hari saat migrasi dan saat room baru, tanpa job re-seed. | `202607130001:309-354`, `202607130004` |
| A6 | Sedang | Verifikasi pembayaran tidak memeriksa nominal — `approve_payment` tidak menerima argumen jumlah dan tidak membandingkannya ke `total_price`; UI juga tidak punya field jumlah transfer. | `202607130002:578`, `AdminVerification.jsx` |
| A7 | Sedang | Kebijakan reject belum diputuskan (`implementation.md` §3.5 menyodorkan dua opsi: deadline baru 30 menit vs cancel+release). Tanpa keputusan tertulis, RPC / copy UI / alur admin berisiko saling bertentangan. | `implementation.md` §3.5, §9.4 |
| A8 | Sedang | Role `manager` didokumentasikan penuh tapi nol UI. Tidak ada dashboard/reports/analytics, sementara haknya di DB sudah aktif. | `RBAC.md`, `getRouteInfo.js` |
| A9 | Rendah | Jumlah tamu adalah teks bebas (`"2 Dewasa"`) yang di-parse `match(/\d+/)`; input tak terduga diam-diam menjadi 1. | `RoomBookingModal.jsx:302-309`, `Checkout.jsx:29` |
| A10 | Rendah | Tidak ada return-to-intended-route: guard melempar ke `#/login`, setelah login selalu mendarat di `#/`, konteks booking hilang. | `RoleGuard.jsx:14-19`, `LoginPage.jsx:117` |

### B. Desain UI/UX (13 temuan, diukur terhadap `Design.md`)
| # | Sev | Temuan | Bukti |
|---|---|---|---|
| B1 | Tinggi | **State error praktis tidak pernah muncul.** Error ditelan menjadi `[]`/`null` di 8 titik — RLS ditolak, JWT kedaluwarsa, dan jaringan mati semuanya tampil identik dengan "katalog kosong". `Design.md` mewajibkan loading/empty/error/success. Tidak ada logging sama sekali (`console.*` nol hasil), jadi penyebabnya juga hilang bagi developer. | `db.js:251,267,278,289,308,322,324,338` |
| B2 | Tinggi | Kebalikannya di sisi admin: **error mentah Postgres bocor ke UI**, bahkan menyuruh user "Pastikan akun kamu punya role admin di tabel profiles Supabase" — membocorkan skema, melanggar prinsip "plain language". | `admin.js:34,45,67`, `db.js:234`, `notificationDb.js:31,40,69` |
| B3 | Sedang | **Tidak ada focus trap di seluruh modal** (ConfirmModal, NotificationModal, RoomBookingModal, dan modal inline di LoginPage/AdminVerification), padahal `Design.md` mewajibkan akses keyboard penuh. Backdrop `onClick` tanpa padanan keyboard. | semua `components/*Modal.jsx` |
| B4 | Sedang | Dropdown notifikasi tidak tertutup dengan Escape; pemicunya tanpa `aria-expanded`/`aria-haspopup`. | `Navbar.jsx` |
| B5 | Sedang | Pagination admin payments rusak: `.range()` di server lalu baris tanpa bukti dibuang **di klien** → `count` dan isi halaman tidak sinkron, halaman bisa tampil kosong. | `admin.js:362-373` |
| B6 | Sedang | Pencarian/filter dikerjakan di browser atas **seluruh tabel tanpa limit**; selain tidak scalable, `name.toLowerCase()` akan crash jika `name`/`location`/`region` null. SearchResults juga tanpa pagination/jumlah hasil. | `db.js:35-68,283-297` |
| B7 | Sedang | `RoleGuard` menulis `window.location.hash` **di dalam badan render** — anti-pattern React, dan user tidak melihat state "mengalihkan". | `RoleGuard.jsx:14-19` |
| B8 | Sedang | Duplikasi yang melanggar "avoid a second visual language": `formatPrice` ditulis ulang 2×, `getDateOffset`/`addDay` disalin 3×, komponen `Icon` lokal 2×, modal inline padahal `ConfirmModal`/`NotificationModal` sudah ada, `ProtectedRoute.jsx` dead code. | `PendingPayment.jsx:19`, `RoomBookingModal.jsx:33`, `LoginPage.jsx:22`, `ProfilePage.jsx:7` |
| B9 | Sedang | Halaman raksasa menyulitkan konsistensi: `AdminProperties.jsx` 55 KB, `AdminVerification.jsx` 35 KB, `BookingDetail.jsx` 29 KB. | — |
| B10 | Rendah | Teks di bawah 12px (`text-[10px]`, `text-[11px]`) berada di luar skala tipografi `Design.md` (terkecil `font-label-md` 14px). | `LoginPage.jsx`, `Navbar.jsx` |
| B11 | Rendah | Token bergaya Material 3 menyiratkan dark mode, tapi tidak ada set token gelap. Perlu keputusan eksplisit: didukung atau dinyatakan tidak didukung. | `index.css:3-73` |
| B12 | Rendah | Google Fonts render-blocking tanpa `preconnect`; tidak ada `<meta description>` maupun Open Graph — buruk untuk LCP dan preview share sebuah marketplace. | `index.html` |
| B13 | Rendah | Polling booking tiap 15 detik tanpa backoff dan tetap berjalan saat tab tidak aktif. | `PendingPayment.jsx:59` |

### C. Security (15 temuan)
| # | Sev | Temuan | Bukti |
|---|---|---|---|
| C1 | **Tinggi** | Permukaan privilege escalation `profiles`: klien mengirim kolom `role`. Inert sekarang, aktif begitu policy write ditambah tanpa proteksi kolom. Terikat A1/A2 — perbaikannya satu paket. | `LoginPage.jsx:101-105` |
| C2 | **Tinggi** | Kedua bucket dibuat **tanpa `file_size_limit` dan tanpa `allowed_mime_types`**. Validasi hanya di klien (10 MB, `accept=` sekadar hint). Setiap user terautentikasi bisa mengunggah file apa pun, ukuran apa pun, ke foldernya sendiri, tanpa keterkaitan booking. Tidak ada policy DELETE → sampah tidak bisa dibersihkan. | `202607130003:58-60`, `202607130000:170-172`, `PendingPayment.jsx:107` |
| C3 | **Tinggi** | Kontrol finansial bertumpu penuh pada ketelitian admin (lihat A6): tidak ada pembandingan nominal transfer terhadap `total_price`. | `202607130002:578` |
| C4 | Sedang | `.env` masih bisa diambil dari riwayat git di commit `7612867`; commit `69801e0` ("remove .env") hanya menghapus file, tidak memurnikan riwayat — menyesatkan. Dampak rendah (hanya URL proyek + publishable key anon-tier), tapi wajib `filter-repo`/BFG bila kunci pernah dirotasi ke sesuatu yang sensitif. | riwayat git |
| C5 | Sedang | Information disclosure lewat error mentah Postgres (nama constraint/kolom/relasi) — sama dengan B2. | `admin.js:45,67` |
| C6 | Sedang | Harga negatif diterima: `properties.price`/`rooms.price` bigint tanpa CHECK ≥ 0, normalisasi hanya `Number(payload.price) \|\| 0`. Harga negatif mengalir ke `create_booking` → `total_price` negatif. | `admin.js:169-201`, `202607130000:20-51` |
| C7 | Sedang | Admin bisa menyuntikkan URL gambar pihak ketiga mentah ke `properties.images`, lalu dirender sebagai `<img src>`. Tanpa validasi skema/host, dan tanpa CSP. | `admin.js:143-146,159-162` |
| C8 | Sedang | `manager` overprivileged terhadap data pribadi: `is_booking_staff()` memberinya akses baca **semua** booking, payment, dan file bukti transfer via API — padahal `RBAC.md` memposisikannya sebagai monitoring agregat. | `202607130002:43-49`, `202607130003:18,34` |
| C9 | Sedang | `getBookingHistory` melakukan select `bookings` **tanpa filter `user_id` dan tanpa limit**; untuk admin/manager ini menarik seluruh booking semua orang ke `#/history` dan statistik ProfilePage. Butuh filter eksplisit sebagai defense-in-depth. | `db.js:333-336` |
| C10 | Sedang | Validasi masukan tanpa skema di jalur tulis admin — tanpa batas panjang, tanpa validasi URL; tidak ada zod/yup di dependensi. | `admin.js:169-201` |
| C11 | Rendah | Tidak ada validasi env var di inisialisasi Supabase; salah konfigurasi = layar putih tanpa pesan. Tidak ada `.env.example`. | `lib/supabase.js`, root |
| C12 | Rendah | Nomor rekening bank hardcoded di komponen — data bisnis yang seharusnya dari konfigurasi/DB agar bisa diubah tanpa deploy. | `PendingPayment.jsx:208,213` |
| C13 | Rendah | Tidak ada CSP maupun security header, tidak ada `<meta name="referrer">`. | `index.html` |
| C14 | Rendah | Kebijakan password lemah (hanya cek kesamaan konfirmasi); tidak ada penanganan verifikasi email, reset password, atau rate-limit di sisi aplikasi. | `LoginPage.jsx:76-106` |
| C15 | Rendah | `markAllAsRead` tidak di-scope ke `user_id` — aman hanya selama policy UPDATE bertahan. Rapuh. | `notificationDb.js:36-39` |

### D. Kualitas & proses (4 temuan)
- **D1** — Nol test frontend, tidak ada CI, oxlint hanya 2 rule (tanpa `exhaustive-deps`, tanpa plugin a11y). Satu-satunya test adalah `booking_contract.sql`; Phase F `implementation.md` (BK-501…507) seluruhnya kosong.
- **D2** — **Dokumentasi saling bertentangan**: 3 skema routing berbeda (`API.md` vs `Design.md` vs `RBAC.md`), 2 model role (`customer/owner` di `Develop.md` vs `guest/admin/manager` di sisanya), 2 arsitektur pembayaran (Edge Function + gateway vs RPC + transfer manual), dan `rpc-function.md` yang sudah usang (tidak mengenal `payment_review`). Perlu penetapan dokumen mana yang authoritative.
- **D3** — Checklist `implementation.md` §13 menyesatkan: 34 tugas ditandai belum selesai padahal migrasi menunjukkan Phase A–E sebagian besar sudah jalan. Perlu rekonsiliasi.
- **D4** — `dist/` ter-commit meski tercantum di `.gitignore`; `.vite-error.log`/`.vite-output.log` tertinggal di root.

---

## Struktur `docs/analisa.md`

1. **Ringkasan Eksekutif** — kondisi saat ini, 5 hal paling mendesak, penilaian kesiapan rilis
2. **Metodologi & Cakupan** — apa yang dibaca, apa yang diverifikasi langsung ke kode/migrasi, apa yang di luar cakupan (tidak ada uji penetrasi runtime, tidak ada akses ke instance Supabase live)
3. **Yang Sudah Kuat** — daftar di atas; penting agar audit ini proporsional
4. **Temuan A — Alur** (A1–A10)
5. **Temuan B — Desain UI/UX** (B1–B13), tiap temuan dirujuk ke aturan `Design.md` yang dilanggar
6. **Temuan C — Security** (C1–C15)
7. **Temuan D — Kualitas & Proses** (D1–D4)
8. **Roadmap Perbaikan** — berjenjang P0→P3 dengan ID tugas bergaya `implementation.md`
9. **Keputusan yang Menunggu Pemilik Produk** — 5 pertanyaan terbuka (kebijakan reject, admin boleh booking atau tidak, nasib role `manager`, dark mode, gateway pembayaran vs transfer manual)
10. **Lampiran** — indeks temuan → file, dan matriks kontradiksi antar dokumen

Format tiap temuan: **ID · Severity · Judul** → *Bukti* (`file:line`) → *Dampak* → *Rekomendasi*. Severity: Blocker / Tinggi / Sedang / Rendah, dengan definisi eksplisit di awal dokumen.

## Roadmap yang akan ditulis

- **P0 — Blocker rilis (A1, A2, C1, C2, C3):** trigger `handle_new_user` `security definer`; policy UPDATE `profiles` yang hanya mengizinkan `full_name`/`phone` plus trigger `prevent_role_change`; hapus `role` dari payload klien dan cek hasil upsert; pasang `file_size_limit` + `allowed_mime_types` pada kedua bucket; tambahkan verifikasi nominal pada `approve_payment`.
- **P1 — Integritas & kepercayaan (A3, A5, A6, B1, B2, C6, C8, C9):** satukan kebijakan role admin di rute; job re-seed availability; lapisan error yang benar (state error terlihat di guest, pesan mentah tidak bocor di admin); CHECK harga ≥ 0; RPC agregat untuk manager menggantikan akses baris mentah; filter `user_id` eksplisit.
- **P2 — Pengalaman & aksesibilitas (A4, A9, A10, B3–B9, C7, C10–C15):** aktifkan notifikasi dari dalam RPC; focus trap; perbaikan pagination; pencarian sisi server; pecah halaman raksasa; hapus duplikasi util/komponen; validasi masukan berskema.
- **P3 — Kematangan proses (B10–B13, D1–D4):** test + CI, aturan lint diperketat, rekonsiliasi dokumen, `.env.example`, pembersihan repo.

Setiap item dapat ID (`FIX-P0-01`, dst.) agar bisa dilacak seperti checklist `implementation.md`.

## Verifikasi

Ini murni dokumen — tidak ada perubahan kode, jadi verifikasinya berupa pemeriksaan akurasi:

1. Setiap rujukan `file:line` dalam dokumen final ditelusuri ulang ke berkas sumber.
2. Klaim P0 (A1/A2/C1) sudah dibuktikan: `grep` atas seluruh `supabase/` mengonfirmasi tidak ada trigger `auth.users` dan tidak ada policy INSERT/UPDATE pada `profiles`.
3. `npm run lint` dijalankan untuk memastikan repo tidak tersentuh setelah dokumen ditulis.
4. Dokumen dibaca ulang untuk memastikan tidak ada nilai rahasia yang ikut tertulis — hanya nama variabel dan hash commit.

## Catatan

Perubahan hanya mengisi berkas `docs/analisa.md` yang sudah ada dan masih kosong — tidak ada isi yang tertimpa. Tidak ada kode, migrasi, atau dokumen lain yang disentuh. Enam berkas yang saat ini sudah `modified` di working tree tidak diikutsertakan.
