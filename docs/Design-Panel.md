# Panduan Desain Panel Admin & Manager — NUS4STAY

Dokumen pendamping [`Design.md`](Design.md) yang memandu desain permukaan **Admin Console** dan **Manager Console**. Seluruh token visual tetap bersumber dari [`src/index.css`](../src/index.css) (blok `@theme`) dan komponen dasar dari `src/components/ui/` — dokumen ini hanya menjelaskan bagaimana token itu dipakai di dalam panel, plus pola yang sudah diterapkan di halaman panel yang live.

> Prinsip utama `Design.md` tetap berlaku: **calm, curated stay desk**. Panel boleh lebih padat (denser), tetapi tetap memakai warna, tipografi, bentuk, dan token interaksi yang sama — tidak ada bahasa visual kedua.

## Bahasa dan identitas

- UI panel memakai **Bahasa Indonesia**: *Properti*, *Verifikasi*, *Dashboard*, *Laporan*, *Analitik*.
- Header halaman memakai eyebrow uppercase kecil: **"Admin Console"** (halaman admin) atau **"Manager Console"** (halaman manager), ditulis dengan `text-tertiary` dan `tracking-[0.18em]`.
- Ikon memakai **Material Symbols Outlined** (`material-symbols-outlined icon-pro`) — misalnya `apartment`, `fact_check`, `monitoring`, `description`, `analytics`, `refresh`.

## Layout panel

Setiap halaman panel mengikuti kerangka yang sama:

```
page-shell (max 1280px, padding responsif)
└─ kolom gap-6
   ├─ Breadcrumbs            → Beranda / Admin atau Manager / Halaman
   ├─ Navigasi segmented     → AdminNavigation atau ManagerNavigation
   ├─ Header halaman         → eyebrow + judul + deskripsi + aksi (kanan)
   └─ Konten                 → grid KPI, tabel, kartu, atau modal
```

| Elemen | Pola |
| --- | --- |
| Shell | `page-shell py-8 md:py-12` |
| Header | Kotak `rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-level-1`; judul `font-headline-* text-primary`; deskripsi `text-sm text-on-surface-variant`; aksi utama di kanan (tombol `size="sm"`) |
| Navigasi | Segmented pills — lihat pola di bawah |
| Breadcrumbs | `src/components/Breadcrumbs.jsx`: *Beranda → Admin → Properti*, dst. |

### Navigasi segmented

Komponen: `src/components/AdminNavigation.jsx` dan `src/components/ManagerNavigation.jsx`.

- Container: `rounded-2xl border border-outline-variant/40 bg-surface-container-low p-1.5`, lebar penuh di mobile (`overflow-x-auto`), `sm:w-fit` di desktop.
- Item: `min-h-10` (touch target ≥ 40px), `rounded-xl px-4 text-sm font-semibold`, ikon `text-[19px]`.
- **Item aktif**: `bg-surface text-primary shadow-sm ring-1 ring-outline-variant/45` + `aria-current="page"`.
- **Item non-aktif**: `text-on-surface-variant hover:bg-surface/70 hover:text-primary`.
- Badge jumlah (mis. antrean verifikasi): pill kecil `rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold`, menampilkan `99+` bila melebihi 99.

## Tipografi

> **Catatan sinkronisasi:** `docs/Design.md` menulis "Playfair Display" untuk heading, tetapi implementasi saat ini di `src/index.css` memakai **Plus Jakarta Sans** untuk keluarga tampilan. Panduan panel ini mengikuti implementasi aktual.

| Peran | Kelas | Keterangan |
| --- | --- | --- |
| Judul halaman | `font-headline-xl` (mobile) / `font-headline-lg` | Warna `text-primary` |
| Judul kartu / subsection | `font-headline-md` | `CardTitle` |
| Label, eyebrow, tombol, tab | `font-label-md` | `14/20px`, weight 600, tracking |
| Body / metadata | `text-sm`–`text-base` Inter | `text-on-surface-variant` untuk teks sekunder |
| Harga / angka besar | `font-price-display` atau `font-headline-xl font-extrabold` | KPI manager |
| ID booking / kode | `font-mono` | Hanya untuk nilai machine-readable |

Aturan: judul panel tidak boleh dipakai untuk paragraf atau data padat; bold dipakai untuk hierarki sebelum memperbesar ukuran.

## Warna

Gunakan token semantik dari `@theme` (`bg-primary`, `text-on-surface-variant`, `border-outline-variant`, dst.). Status selalu berupa **badge** kompak berlabel — warna saja tidak cukup.

| Status | Background | Text | Pemakaian di panel |
| --- | --- | --- | --- |
| Sukses / disetujui | `#EAF2E8` | `#34662B` | Booking confirmed, pembayaran disetujui |
| Menunggu / review | `#FDF6E2` | `#B2700D` | Booking pending, bukti bayar perlu diperiksa |
| Error / ditolak / batal | `#FDF0EE` | `#C53F3F` | Pembayaran ditolak, booking dibatalkan |
| Error container | `#FFDAD6` | `#93000A` | Error form, umpan balik destruktif |
| Netral / status berubah | `bg-surface-container` | `text-on-surface-variant` | Status tak dikenal (mis. `unknown` di verifikasi) |

`Badge` dari `src/components/ui/badge.jsx` menyediakan variant `default`, `success`, `warning`, `error`, `outline`, `secondary`, `amenity` — pakai variant itu, jangan hex langsung.

> **Gap visual yang diketahui:** KPI card di `ManagerDashboard.jsx` memakai warna ekor langsung (`emerald`, `amber`, `rose`, `indigo`) di luar token semantik. Sebaiknya dimigrasikan ke token status/palette panel saat ada kesempatan.

## Pola komponen panel

### Toolbar aksi

- Tombol utama (Create, Laporan): `Button` default, `size="sm"`.
- Aksi sekunder (Refresh): `Button variant="outline" size="sm"`, ikon `refresh` berputar (`animate-spin`) saat loading.
- Tombol berikon selalu menyertakan label teks, bukan ikon saja.

### Kartu (Card)

- `Card` + `CardHeader` + `CardTitle`/`CardDescription` + `CardContent`/`CardFooter` dari `src/components/ui/card.jsx`.
- KPI: header berisi label uppercase kecil + ikon dalam kotak `h-10 w-10 rounded-2xl` dengan tint lembut (`bg-primary/10 text-primary`, dst.); angka `font-headline-xl font-extrabold`; pemisah `border-t border-outline-variant/30`; breakdown kecil di bawah.
- Progress bar (mis. okupansi): track `h-2 rounded-full bg-surface-container`, isi `bg-indigo-600` (sebaiknya token panel) dengan `transition-all`.

### Tabel & daftar padat

- Baris kompak, `text-sm`/`text-xs` untuk metadata, pagination 10 item/halaman.
- Search **client-side** dengan debounce alami (useMemo) di atas data halaman aktif.
- Kolom aksi (Edit/Hapus) memakai tombol icon/ghost; aksi destruktif selalu lewat konfirmasi.

### Badge status verifikasi

`AdminVerification.jsx` memetakan status ke badge: `review` (warning, ikon `hourglass_top`), `approved` (default, ikon `verified`), `rejected` (error, ikon `cancel`), `unknown` (outline, ikon `info`) — ikon + label, ukuran `text-[11px]`.

### Modal & wizard

- **Wizard 3 langkah** (Admin Properti): Properti → Kamar → Verifikasi, dengan stepper, validasi per langkah, dan tombol kembali/lanjut; modal tidak boleh ditutup saat proses simpan (`saving`).
- **Modal keputusan** (Admin Verifikasi): approve/reject dengan body scroll lock (`body.style.overflow = 'hidden'`), tombol Escape untuk menutup, state `processing` untuk mencegah aksi ganda.
- Konfirmasi hapus memakai `ConfirmModal`; umpan balik memakai `NotificationModal`.

### State kosong & error

- Loading: teks/indikator tenang `text-on-surface-variant` — bukan spinner besar.
- Empty state: jelaskan apa yang kosong + aksi lanjut ("Belum ada transaksi properti.", "Mulai jelajahi properti").
- Error: container `border-error/20 bg-error-container/40 text-on-error-container`, kalimat jelas dalam Bahasa Indonesia, tidak ada `Something went wrong` tanpa konteks.

## Interaksi dan aksesibilitas

- `:focus-visible` outline 2px `primary` + offset 3px; pertahankan akses keyboard di semua kontrol, tab, modal, dan date picker.
- Touch target ≥ 40px; tombol aksi utama ≥ 44px (`min-h-10`/`min-h-11`).
- `aria-current="page"` pada item navigasi aktif; `aria-label` pada nav ("Menu admin", "Menu manager").
- Hormati `prefers-reduced-motion` (stylesheet global sudah menangani).
- Status tidak pernah dikomunikasikan hanya lewat warna — selalu ada label atau ikon.
- Alt text bermakna untuk gambar (foto properti, preview bukti bayar); ikon dekoratif `aria-hidden`.

## Checklist untuk halaman panel baru

- [ ] Satu tugas utama yang jelas per halaman?
- [ ] Navigasi segmented dan breadcrumbs terpasang?
- [ ] Header panel: eyebrow + judul `font-headline-*` + deskripsi + aksi utama?
- [ ] Hanya token semantik (tidak ada hex baru tanpa alasan)?
- [ ] Badge status berlabel + berikon, tidak warna-saja?
- [ ] Tabel kompak, search + pagination, kolom aksi jelas?
- [ ] State loading, empty, error, sukses lengkap?
- [ ] Modal: validasi, konfirmasi destruktif, lock saat proses?
- [ ] Mobile: stacked flow, navigasi scroll horizontal, bukan desktop yang dimampatkan?
- [ ] Fokus, reduced motion, kontras, dan isyarat non-warna terpenuhi?
