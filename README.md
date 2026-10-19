# Riset TernaQin

Website riset lapangan "Perjalanan Seekor Sapi" (riset-ternaqin.vercel.app) dan dashboard hasilnya.

- `index.html`, `js/app.js`: kuesioner bercerita (peternak, RPH, pedagang, konsumen), ID/EN, mode wawancara (`?mode=wawancara&pewawancara=NAMA`).
- `dashboard/`: dashboard founder, tim riset, dan mitra (login).
- `js/config.js`: alamat Apps Script (`ENDPOINT`) dan target responden.
- `apps-script/Code.gs`: backend di Google Apps Script yang terpasang pada Google Sheet riset. Tidak ikut di-deploy ke Vercel (lihat `.vercelignore`).
- `PANDUAN.md`: panduan pemasangan dan operasional.

Alur data: kuesioner → Apps Script → Google Sheet → dashboard (dibaca langsung saat login atau tombol muat ulang).

Situs statis tanpa build. Vercel: Framework Preset "Other", tanpa build command.

Jangan simpan password, kunci, atau data responden di repository ini. Semua rahasia ada di Script Properties Apps Script.
