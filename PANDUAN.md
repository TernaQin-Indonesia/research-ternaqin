# Riset Lapangan TernaQin — Panduan Pemasangan

## A. Siapkan Google Sheet (10 menit, sekali saja)
1. Login dengan akun ternaqinindonesia@gmail.com, buat Google Sheet baru bernama "Riset TernaQin 2026".
2. Menu Extensions → Apps Script. Hapus semua isi editor, tempel seluruh isi apps-script/Code.gs, klik Save.
3. Di toolbar, pilih fungsi `setup` → Run. Saat diminta izin: Review permissions → pilih akun → Advanced → Go to (unsafe) → Allow. Tab Respons_Peternak, Respons_RPH, Respons_Pedagang, Respons_Konsumen, Kontak, dan Log akan muncul.
4. Deploy → New deployment → ikon gerigi → Web app.
   - Execute as: Me
   - Who has access: Anyone
   Klik Deploy, salin "Web app URL" (berakhiran /exec).
5. Tempel URL itu ke js/config.js pada baris ENDPOINT: '...'. Deploy ulang website.
6. Uji: buka URL /exec di browser, harus muncul {"ok":true,...}. Lalu isi website sekali sampai selesai; satu baris baru harus muncul di Sheet.
7. Unduh Excel kapan saja: File → Download → Microsoft Excel (.xlsx).
   Jika Code.gs diubah, gunakan Deploy → Manage deployments → Edit → Version: New version (URL tetap sama).

## A2. Akun dashboard — tanpa mengubah kode
Kategori akun:
- Tim internal · Founder: semua data, kontak responden, unduh Excel, kelola akun.
- Tim internal · Tim riset: semua data dan unduh Excel, tanpa kontak dan tanpa kelola akun.
- Mitra / investor: temuan dan grafik saja. Tanpa kontak, ID responden, kabupaten, catatan pewawancara, dan unduh Excel. Wajib punya tanggal akhir akses. Penyaringan dilakukan di server.

Akun founder pertama (sekali saja):
1. Buka Google Sheet riset, muat ulang halaman (F5). Muncul menu "TernaQin" di sebelah menu Help/Bantuan.
2. Klik TernaQin → Buat akun founder. Pertama kali, Google meminta izin lagi: Continue → pilih akun → Advanced → Go to … (unsafe) → Allow, lalu klik menunya sekali lagi.
3. Isi username (mis. daffa) → OK, lalu nama tampilan (mis. Daffa Naufal) → OK.
4. Muncul kotak berisi password sementara. Catat. Tidak bisa dilihat lagi.
5. Buka /dashboard, masuk dengan username + password sementara, lalu buat password sendiri (minimal 10 karakter).

Akun berikutnya (dari dashboard, khusus founder):
1. Sidebar → Akses tim → Tambah akun.
2. Pilih kategori: Tim internal (lalu pilih Tim riset atau Founder) atau Mitra / investor (isi organisasi dan tanggal akhir akses).
3. Isi nama; username terisi otomatis (boleh diubah) → Buat akun.
4. Klik "Salin pesan siap kirim", tempel di chat pribadi orang itu. Ia wajib membuat password sendiri saat login pertama.
5. Di tabel akun: Reset password, Perpanjang 30 hari (mitra), Nonaktifkan/Aktifkan, atau Hapus. Perubahan langsung berlaku; sesi orang itu otomatis keluar.

Menu TernaQin di Google Sheet juga punya: Reset password akun (bila founder lupa password), Lihat daftar akun, Keluarkan semua sesi login.
Setiap login, pembukaan data, dan perubahan akun tercatat di tab Log.

## B. Deploy ke riset-ternaqin.vercel.app
Cara termudah (CLI): pasang Node.js, lalu di folder ini jalankan
    npx vercel login
    npx vercel --prod
Jawab: scope = akun/tim Anda, link to existing project = No, project name = riset-ternaqin, directory = ./ , override settings = No.
Domain riset-ternaqin.vercel.app otomatis terpasang bila nama project tersebut tersedia.

## C. Tautan yang dibagikan
- Responden isi sendiri: https://riset-ternaqin.vercel.app/
- Versi Inggris:        https://riset-ternaqin.vercel.app/?lang=en
- Mode wawancara:       https://riset-ternaqin.vercel.app/?mode=wawancara&pewawancara=NAMA
  (menampilkan kode pertanyaan dan kotak catatan per bab; tombol "Responden berikutnya" di akhir)
- Pelacakan sumber:     tambahkan &src=grup-wa-peternak (atau nama kanal lain) ke tautan mana pun.

## C2. Dashboard
- Alamat: https://riset-ternaqin.vercel.app/dashboard (tidak terindeks mesin pencari, data hanya keluar setelah login).
- Ringkasan: total respons, progres terhadap target (atur TARGETS di js/config.js), respons per hari, sinyal kunci, sebaran provinsi.
- Tab per segmen: setiap pertanyaan otomatis jadi grafik; tombol tabel di pojok kartu; "Saring" untuk membandingkan kelompok (mis. peternak 20–99 ekor saja).
- Cerita: semua jawaban teks bebas + catatan pewawancara, bisa dicari kata kuncinya.
- Kontak dan Akses tim: hanya untuk founder. Akun mitra melihat versi data yang sudah disaring dan pita "Akses mitra" di atas layar.
- Unduh Excel: data mentah sesuai filter aktif.
- Mode demo (tombol di halaman login) memakai angka acak berlabel DEMO — hanya untuk mencoba tampilan, jangan dipakai untuk keputusan atau materi investor.

## C3. Impor wawancara lama (founder)
Untuk wawancara yang dilakukan sebelum website riset ada.
1. Dashboard → Admin → Impor data lama → unduh Template Excel.
2. Isi satu baris per responden di tab segmen yang sesuai. Wajib: tanggal wawancara asli, pewawancara, provinsi. Isi hanya pertanyaan yang memang ditanyakan saat itu; sisanya kosong.
3. Unggah file. Sistem memeriksa setiap sel; tidak ada data yang masuk sebelum semua kesalahan beres. Data ganda (pernah diimpor) ditolak.
4. Isi keterangan sumber, centang pernyataan keaslian, klik Impor.
Hasil: baris masuk ke tab Respons_* dengan asal_data = impor, tanggal_wawancara asli, id_impor, keterangan_impor, diimpor_oleh. Ringkasan batch di tab Riwayat_Impor, jejak di Log. Di dashboard ditandai "Wawancara awal" dan bisa dipisah lewat filter Asal data. Batch keliru: tombol "Tarik batch" (penarikan juga tercatat).

## C4. Sidik integritas
Setiap baris (website maupun impor) diberi sidik saat masuk (kolom sidik). Dashboard menghitung ulang saat memuat; baris yang isinya diubah langsung di Sheet ditandai "diubah" di panel Kualitas data dan Tindak lanjut. Untuk tahu siapa yang mengubah: Google Sheet → File → Version history. Catatan: ini mendeteksi perubahan, bukan mencegah; editor Apps Script tetap bisa mengakali. Jangan ubah kunci INTEGRITY_SECRET di Script Properties.

## D. Catatan data
- Jawaban yang gagal terkirim tersimpan di perangkat responden dan dikirim ulang otomatis; duplikat ditolak oleh id_respons.
- Data kontak tersimpan terpisah di tab Kontak. Batasi siapa yang punya akses ke tab/Sheet ini.
- Permintaan hapus datang dengan kode TQ-XXXXXX: cari kode di tab Respons_* dan Kontak, hapus barisnya.
- Arti setiap kolom ada di Kamus_Data_Riset_TernaQin.xlsx.
- Tema terang/gelap: tombol bulan/matahari di kanan atas (survei & dashboard), tersimpan per perangkat.
