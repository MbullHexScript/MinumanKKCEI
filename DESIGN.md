# Arah desain

## Dasar

Buku saku barista untuk dipakai satu tangan di counter, bukan situs promosi coffee shop. Palet sesuai arahan terbaru: biru #093FB4 dan putih #FFFCFB. Motif kotak-kotak dan nama Cei mempertahankan identitas kedai.

## Token

- Blue: `#093FB4`, tindakan utama dan identitas.
- White: `#FFFCFB`, latar mode terang dan teks di atas biru.
- Ink: `#182b4d`, teks mode terang.
- Mist: `#e8efff`, latar kontrol aktif dan foam.
- Midnight: `#10182b`, latar mode gelap.
- Glass: permukaan navigasi mengikuti tema, dengan blur dan opacity tinggi agar teks tetap terbaca.

Inter variable, di-host lokal: teks UI dan heading; angka takaran memakai tabular numerals supaya rapi saat membandingkan bahan. Georgia hanya untuk logotype ilustratif Cei dan catatan kecil pada artwork. Heading padat, isi ringkas, takaran jauh lebih besar dari label bahan.

## Layout

Desktop: navigasi samping tetap, area koleksi rata kiri, grid empat kolom. HP: header ringkas, grid dua kolom, navigasi kapsul mengambang dalam jangkauan ibu jari, di atas safe area. Indikator biru bergerak memakai spring critically damped yang mempertahankan kecepatan saat target berubah. Sentuhan memberikan feedback langsung; reduced motion memindahkan indikator tanpa animasi. Detail/form memakai dialog layar penuh di HP, dengan tindakan tersimpan di bagian bawah.

```text
Desktop                         HP
┌──────┬────────────────────┐    ┌───────────────────┐
│ Cei  │ Buku racikan       │    │ Cei     ☀  status │
│      ├────────────────────┤    │ Racikan pas.      │
│ Menu │ Hero amber + cups │    │ [Cari minuman]    │
│      │ Cari / kategori   │    │ [Kategori →]      │
│      │ □   □   □   □     │    │ □       □         │
│      │ □   □   □   □     │    │ □       □         │
└──────┴────────────────────┘    ├───────────────────┤
                                │ Buku  ♡  +  Atur  │
                                └───────────────────┘
```

## Review sebelum implementasi

Hero marketing besar akan memperlambat pencarian saat shift; diperkecil menjadi pembuka pendek, lalu pencarian dan kategori langsung terlihat. Checker berasal dari menu asli; biru–putih mengikuti palet pilihan pemilik. Ilustrasi minuman dibuat lokal agar konsisten dan offline; label Ilustrasi membedakannya dari foto asli. Tidak menebak resep atau foam untuk menu yang belum diberikan.

Gerak dibatasi pada feedback kontrol, menghormati reduced motion. Tidak ada animasi masuk kartu berulang. Warna foam tidak menjadi satu-satunya pembeda: badge dan judul eksplisit tetap ada.

## Review setelah implementasi

Screenshot desktop 1440 px dan HP 393 px diperiksa. Hero HP dipadatkan lagi agar nama menu pertama sudah terbaca sebelum menggulir. Ilustrasi pada detail dipusatkan dengan flex agar tidak terpotong ke satu sisi. Umpan balik pada dialog ditempatkan di dalam dialog itu sendiri, sehingga tidak tertutup backdrop native. Font Latin di-bundle lokal untuk memperkecil unduhan dan mendukung offline.
