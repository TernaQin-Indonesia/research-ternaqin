/* =========================================================
   KONFIGURASI — satu-satunya file yang perlu diubah.
   ENDPOINT : URL Web App Google Apps Script (berakhiran /exec).
              Selama masih kosong, website berjalan dalam "mode uji":
              jawaban disimpan di perangkat dan dikirim otomatis
              begitu ENDPOINT diisi dan website dibuka lagi.
   TOKEN    : harus sama persis dengan TOKEN di Code.gs.
   ========================================================= */
window.TQ_CONFIG = {
  ENDPOINT: 'https://script.google.com/macros/s/AKfycbytGYHyQKTb1vJcUhHMgSlftSpM3TmixcsX2PZ8i1viUx2QXiivOxHXwmxKd6XMYGEx/exec',
  TOKEN: 'tq-riset-2026-9f4c2a',
  SITE_URL: 'https://riset-ternaqin.vercel.app',
  // Target jumlah responden per segmen — tampil sebagai progres di dashboard. Ubah sesuai rencana riset.
  TARGETS: { peternak: 30, rph: 8, pedagang: 20, konsumen: 100 },
};
