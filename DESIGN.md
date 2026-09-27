# Arah desain

## Dasar

Buku saku barista untuk dipakai satu tangan di counter, bukan situs promosi coffee shop. Identitas diambil dari foto menu: charcoal, amber, motif kotak-kotak, dan nama Cei.

## Token

- Counter: `#191a18`, latar gelap utama.
- Paper: `#f2f0e9`, teks utama.
- Amber: `#edb75a`, tindakan utama dan identitas.
- Tray: `#22231f`, permukaan kontrol/kartu.
- Sage: `#a9bb8d`, status positif.
- Cream: `#f6f4ee`, latar mode terang.

Manrope variable, di-host lokal: teks UI dan heading; angka takaran memakai tabular numerals. Georgia hanya untuk logotype ilustratif Cei dan catatan kecil pada artwork. Heading padat, isi ringkas, takaran jauh lebih besar dari label bahan.

## Layout

Desktop: navigasi samping tetap, area koleksi rata kiri, grid empat kolom. HP: header ringkas, grid dua kolom, navigasi bawah dalam jangkauan ibu jari. Detail/form memakai dialog layar penuh di HP, dengan tindakan tersimpan di bagian bawah.

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

Hero marketing besar akan memperlambat pencarian saat shift; diperkecil menjadi pembuka pendek, lalu pencarian dan kategori langsung terlihat. Aksen amber dan checker berasal dari menu asli, bukan dekorasi acak. Ilustrasi minuman dibuat lokal agar konsisten dan offline; label Ilustrasi membedakannya dari foto asli. Tidak menebak resep atau foam untuk menu yang belum diberikan.

Gerak dibatasi pada feedback kontrol, menghormati reduced motion. Tidak ada animasi masuk kartu berulang. Warna foam tidak menjadi satu-satunya pembeda: badge dan judul eksplisit tetap ada.

## Review setelah implementasi

Screenshot desktop 1440 px dan HP 393 px diperiksa. Hero HP dipadatkan lagi agar nama menu pertama sudah terbaca sebelum menggulir. Ilustrasi pada detail dipusatkan dengan flex agar tidak terpotong ke satu sisi. Umpan balik pada dialog ditempatkan di dalam dialog itu sendiri, sehingga tidak tertutup backdrop native. Font Latin di-bundle lokal untuk memperkecil unduhan dan mendukung offline.
