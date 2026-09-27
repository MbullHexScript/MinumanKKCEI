# Cei — Buku Racikan

Aplikasi resep pribadi Kedai Kopi Cei. React + TypeScript + Vite, Supabase untuk akun dan database, serta PWA untuk layar utama dan membaca resep offline.

## Jalankan di komputer

Memerlukan Node.js 22.12+.

```sh
npm install
npm run dev
```

Buka alamat yang dicetak Vite (biasanya http://localhost:5173). Untuk melihat dari HP, gunakan alamat IP komputer pada port yang sama, sambungkan keduanya ke Wi-Fi yang sama, dan izinkan akses jaringan pada firewall bila diperlukan. PWA/offline memerlukan HTTPS atau localhost; gunakan hasil deployment HTTPS untuk pemakaian harian di HP.

**Tanpa `.env`, aplikasi memakai mode lokal dengan penanda yang jelas.** Mode ini langsung dapat digunakan untuk mencoba fitur, tetapi data browser bukan pengganti database/cadangan. Ekspor resep lokal sebelum membersihkan data browser atau pindah perangkat.

## Aktifkan database online (sekali saja)

1. Buat proyek di [Supabase](https://supabase.com).
2. Buka **SQL Editor**, tempel isi [`supabase/schema.sql`](supabase/schema.sql), lalu jalankan. Tabel memiliki Row Level Security: akun hanya dapat mengakses resep miliknya.
3. Buka **Authentication → Sign In / Providers**, nonaktifkan **Allow new users to sign up**, lalu simpan perubahan. Akun yang sudah dibuat tetap dapat login.
4. Pada **Authentication → Users → Add user → Create new user**, buat akun email/kata sandi pribadi dan pilih auto-confirm jika tersedia. Aplikasi tidak menyediakan pendaftaran publik. Jika lupa kata sandi, pulihkan/atur ulang akun lewat dashboard Supabase.
5. Salin `.env.example` menjadi `.env`. Buka tombol **Connect** pada proyek untuk menyalin Project URL dan **publishable key**. Key juga tersedia di **Settings → API Keys**. Isi keduanya seperti berikut (nama variabel `ANON_KEY` di aplikasi juga menerima publishable key):

   ```env
   VITE_SUPABASE_URL=https://PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
   ```

   **Jangan gunakan service_role atau secret key.** Key publik aman untuk frontend hanya dengan kebijakan RLS yang telah dipasang. File `.env` diabaikan Git.

6. Jalankan ulang `npm run dev`, lalu masuk menggunakan akun yang dibuat pada langkah 4.
7. Klik **Isi 42 menu awal** untuk akun baru. Jika sudah mengedit dalam mode lokal, ekspor cadangan lokal dan impor dari **Pengaturan → Impor cadangan** setelah login. Data lokal tidak diam-diam dikirim ke akun cloud.

Konfigurasi Supabase dan akun cloud harus dibuat oleh pemilik proyek; source code ini tidak menyertakan kredensial atau database aktif.

## Deploy agar bisa diakses dari HP

Gunakan Vercel, Netlify, atau hosting situs statis yang mendukung HTTPS:

- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Masukkan kedua environment variable `VITE_SUPABASE_*` di pengaturan hosting **sebelum build**.
- Tambahkan URL deployment ke **Authentication → URL Configuration → Site URL** di Supabase.

Routing detail memakai hash, sehingga tidak memerlukan rewrite halaman khusus. Buka URL HTTPS dari HP lalu gunakan **Tambahkan ke layar utama / Instal aplikasi**. Perubahan environment variable memerlukan build/deploy ulang.

## Isi dan perilaku aplikasi

- 42 entri: 39 minuman + Sea Salt, Matchiato, Cheese Cream di kategori Additional.
- Tiga resep asli sudah diisi. Semua takaran awal ditulis **g**, sesuai konfirmasi penggunaan timbangan:
  - Cei Aren: Aren 15 g, Latte 120 g.
  - Cei Latte: Latte 125 g untuk **Iced dan Hot**.
  - Strawberry Matcha: Pure strawberry 20 g, Matcha powder 20 g, Air 20 g, Fresh milk 90 g; foam per gelas: Creamer larut 20 g, Rich Gold 10 g.
- Angka tersebut dicatat sesuai keterangan pemilik, bukan konversi fisik otomatis ml ke gram. Satuan masing-masing bahan tetap bisa diedit.
- Americano punya Hot/Iced, tetapi takaran belum diisi. Menu lain yang belum diberikan resepnya ditandai **Belum diisi**.
- Nama “Strawberry Matcha” mengikuti foto menu. Ilustrasi gelas bukan foto produk dan diberi label **Ilustrasi**; unggah foto asli melalui form tambah/edit.
- Cari berdasarkan nama, kategori, dan bahan; filter kategori/foam; tampilan grid/list; favorit; mode terang/gelap.
- Bahan utama per varian; foam khusus per minuman atau referensi resep Additional; langkah pembuatan dan catatan opsional.
- Additional yang digunakan sebagai foam tidak bisa dihapus sebelum referensinya dilepas. Mengedit Additional memperbarui racikan yang merujuknya.
- Tambah/edit/duplikat/hapus langsung dari web. Perubahan cloud dianggap tersimpan setelah server mengonfirmasi, bukan sebelum request selesai.
- Foto JPEG/PNG/WebP dikompres di perangkat (maks. sisi 960 px), lalu disimpan bersama resep sebagai data URL di kolom JSONB. Untuk skala 42 menu ini menyederhanakan backup lengkap dan akses offline; tidak perlu membuat bucket Storage.

## Offline dan cadangan

- PWA menyimpan aset aplikasi lokal; cache resep terpisah menurut akun.
- Cloud tetap sumber data utama. **Membaca** resep yang sudah dimuat dapat dilakukan offline; **mengedit** mode cloud memerlukan internet dan sinkronisasi awal yang berhasil.
- Cache offline memakai localStorage. Jika penuh, aplikasi tetap menyimpan ke database dan memberi tahu bahwa cache tidak diperbarui. Pada mode lokal, kegagalan penyimpanan menahan perubahan dan menampilkan error.
- Keluar akun menghapus cache resep akun tersebut dari perangkat.
- Ekspor mencakup semua resep, varian, foto, foam, dan favorit dalam JSON versi 1. Impor memvalidasi isi, menolak ID ganda/referensi foam rusak, lalu **menggabungkan berdasarkan ID**. Resep lain tidak dihapus.
- Unduh cadangan secara berkala dan simpan di lokasi terpisah seperti Google Drive. Periksa aturan retensi dan backup paket Supabase yang digunakan; keberadaan database online saja tidak menjamin cadangan permanen.
- Saat dua perangkat mengedit resep yang sama, penyimpanan terakhir berlaku. Gunakan Muat ulang di pengaturan sebelum melanjutkan edit dari perangkat lain.
- Pembaruan PWA dipasang pada kunjungan berikutnya setelah seluruh tab aplikasi ditutup; halaman edit tidak dipaksa reload.

## Pemeriksaan

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Tes unit mencakup data asli, validasi cadangan, dan penggabungan. Tes browser mencakup pencarian, varian/foam, perubahan persisten, favorit, foto/cadangan, tema, viewport HP, dan baca offline. Tes kontrak cloud memakai API tiruan untuk login, penolakan/percobaan ulang penyimpanan, serta pemisahan cache antar akun. Tidak ada request ke Supabase sungguhan dalam tes tersebut; koneksi dan RLS pada proyek nyata perlu diuji setelah konfigurasi.

## Struktur

```text
src/
  components/       Detail, editor, pengaturan, login, ilustrasi
  hooks/useRecipes  Sesi, cache per akun, baca/tulis cloud/lokal
  lib/recipes       Model, validasi, katalog 42 menu
  lib/storage       Cadangan dan kompresi foto
  lib/supabase      Klien database
supabase/schema.sql Tabel, hak akses dan RLS
scripts/            Generator ikon PNG untuk PWA
tests/              Pengujian browser
```
