/* =========================================================
   TernaQin — Riset Lapangan Tahap 1 · Isi & pertanyaan
   Setiap teks punya versi id (Indonesia) dan en (English).
   Kode pertanyaan (P1, R1, ...) dan kode pilihan dipakai
   sebagai nama kolom di Google Sheet — jangan diubah setelah
   riset berjalan.
   ========================================================= */
(function () {
  const o = (v, id, en, extra) => Object.assign({ v, t: { id, en } }, extra || {});
  const T = (id, en) => ({ id, en });

  /* ---------- Teks antarmuka ---------- */
  const UI = {
    brandTag: T('Riset Lapangan', 'Field Research'),
    langLabel: T('Bahasa', 'Language'),
    next: T('Lanjut', 'Continue'),
    back: T('Kembali', 'Back'),
    start: T('Mulai cerita', 'Start the story'),
    skip: T('Lewati', 'Skip'),
    submit: T('Kirim jawaban', 'Submit answers'),
    optional: T('Opsional', 'Optional'),
    required: T('Mohon pilih jawaban terlebih dahulu.', 'Please choose an answer first.'),
    pickMax: T('Pilih maksimal {n}.', 'Choose up to {n}.'),
    pickMaxReached: T('Sudah {n} pilihan. Lepas salah satu untuk mengganti.', '{n} chosen. Unselect one to change.'),
    pickAny: T('Boleh pilih lebih dari satu.', 'You may choose more than one.'),
    typeHere: T('Tulis dengan kata-kata Anda sendiri…', 'Write in your own words…'),
    minutes: T('menit', 'minutes'),
    chapter: T('Bab', 'Chapter'),
    profile: T('Profil', 'Profile'),
    resumeTitle: T('Lanjutkan pengisian sebelumnya?', 'Continue where you left off?'),
    resumeBody: T('Kami menemukan jawaban yang belum terkirim di perangkat ini.', 'We found unsent answers on this device.'),
    resumeYes: T('Lanjutkan', 'Continue'),
    resumeNo: T('Mulai dari awal', 'Start over'),
    interviewerBadge: T('Mode wawancara', 'Interview mode'),
    interviewerNote: T('Catatan pewawancara (tidak tampil ke responden lain)', 'Interviewer notes (not shown to other respondents)'),
    interviewerNotePh: T('Tulis jawaban lisan, ekspresi, atau konteks penting…', 'Record verbal answers, reactions, or important context…'),
    readAloud: T('Bacakan', 'Read aloud'),
    sending: T('Mengirim…', 'Sending…'),
    sentFail: T('Belum terkirim karena koneksi. Jawaban Anda aman tersimpan di perangkat ini dan akan dikirim ulang otomatis.', 'Not sent yet due to the connection. Your answers are saved on this device and will be retried automatically.'),
    retry: T('Coba kirim lagi', 'Try sending again'),
    testMode: T('Mode uji: website belum terhubung ke Google Sheet. Jawaban disimpan di perangkat ini.', 'Test mode: the website is not yet connected to Google Sheets. Answers are kept on this device.'),
    yourResponseId: T('Kode jawaban Anda', 'Your response code'),
    scaleLow: T('Rendah', 'Low'),
    scaleHigh: T('Tinggi', 'High'),
    selected: T('dipilih', 'selected'),
    of: T('dari', 'of'),
  };

  /* ---------- Layar pembuka & persetujuan ---------- */
  const INTRO = {
    overline: T('RISET LAPANGAN · TERNAQIN', 'FIELD RESEARCH · TERNAQIN'),
    title: T('Setiap hari, ribuan sapi berpindah dari kandang ke piring kita.', 'Every day, thousands of cattle travel from the barn to our plates.'),
    title2: T('Tapi berapa banyak dari perjalanan itu yang benar-benar kita ketahui?', 'But how much of that journey do we really know?'),
    body: T('Kami sedang merancang cara baru untuk mencatat dan membuktikan perjalanan itu. Sebelum membangunnya, kami ingin mendengar pengalaman Anda lebih dulu — apa adanya, termasuk keraguan dan kritik Anda.',
      'We are designing a new way to record and prove that journey. Before we build it, we want to hear your experience first — honestly, including your doubts and criticism.'),
    meta: T('Sekitar {m} menit · Tanpa login · Bisa dilanjutkan bila terputus', 'About {m} minutes · No login · Resume anytime'),
    consentOverline: T('SEBELUM MULAI', 'BEFORE WE START'),
    consentTitle: T('Bagaimana jawaban Anda dipakai', 'How your answers are used'),
    consentPoints: [
      T('Jawaban hanya dipakai untuk riset pengembangan TernaQin dan dianalisis secara gabungan, bukan per orang.', 'Answers are used only for TernaQin product research and analysed in aggregate, not individually.'),
      T('Kami tidak meminta nama atau nomor telepon, kecuali Anda bersedia dihubungi kembali di akhir.', 'We do not ask for your name or phone number unless you choose to be contacted at the end.'),
      T('Lokasi hanya sampai kabupaten/kota. Kami tidak memakai cookie pelacak.', 'Location is recorded only to district level. We use no tracking cookies.'),
      T('Anda boleh berhenti kapan saja. Tidak ada jawaban benar atau salah — jawaban jujur, termasuk "tidak", justru paling membantu.', 'You may stop at any time. There are no right or wrong answers — honest answers, including "no", help us most.'),
    ],
    consentCheck: T('Saya mengerti dan bersedia ikut', 'I understand and agree to take part'),
  };

  /* ---------- Pilih peran ---------- */
  const ROLE = {
    overline: T('PERAN ANDA', 'YOUR ROLE'),
    title: T('Dalam perjalanan seekor sapi, di mana posisi Anda?', 'In the journey of a cow, where do you stand?'),
    note: T('Jika Anda punya lebih dari satu peran — misalnya peternak sekaligus pemilik RPH — pilih peran utama dulu. Setelah selesai, Anda bisa mengisi peran lain.',
      'If you have more than one role — for example a farmer who also owns a slaughterhouse — pick your main role first. You can answer for another role afterwards.'),
    options: [
      { v: 'peternak', icon: 'ph-cow', t: T('Peternak', 'Farmer'), d: T('Saya memelihara atau menjual ternak.', 'I raise or trade livestock.'), mins: 14 },
      { v: 'rph', icon: 'ph-buildings', t: T('Rumah Potong Hewan', 'Slaughterhouse (RPH)'), d: T('Saya mengelola atau bekerja di RPH.', 'I manage or work at a slaughterhouse.'), mins: 13 },
      { v: 'pedagang', icon: 'ph-storefront', t: T('Pedagang daging', 'Meat seller'), d: T('Saya menjual daging di pasar, toko, atau online.', 'I sell meat at a market, shop, or online.'), mins: 10 },
      { v: 'konsumen', icon: 'ph-shopping-bag', t: T('Konsumen', 'Consumer'), d: T('Saya membeli daging untuk keluarga atau usaha.', 'I buy meat for my family or business.'), mins: 9 },
    ],
  };

  /* ---------- Tokoh cerita ---------- */
  const HERO = { name: 'Si Belang', tag: 'TQ-0217' };

  /* ---------- Pembuka tiap bab ---------- */
  const CHAPTERS = {
    profile: { n: 0, overline: T('PROFIL SINGKAT', 'QUICK PROFILE'), title: T('Kenalan dulu', 'Let’s get acquainted'),
      body: T('Beberapa pertanyaan singkat tentang usaha atau kebiasaan Anda, supaya jawaban berikutnya bisa kami pahami dalam konteks yang tepat.', 'A few short questions about your business or habits, so we can understand your later answers in the right context.') },
    b1: { n: 1, overline: T('BAB 1 · HARI INI', 'CHAPTER 1 · TODAY'), title: T('Hari ini', 'Today'), art: 'barn' },
    b2: { n: 2, overline: T('BAB 2 · KE DEPAN', 'CHAPTER 2 · AHEAD'), title: T('Ke depan', 'Looking ahead'), art: 'road',
      body: T('Harga naik, pesaing bertambah, pembeli makin kritis. Beberapa tahun ke depan, apa yang Anda harapkan — dan apa yang Anda khawatirkan?', 'Prices rise, competition grows, buyers get pickier. In the next few years, what do you hope for — and what worries you?') },
    b3: { n: 3, overline: T('BAB 3 · BAGAIMANA JIKA', 'CHAPTER 3 · WHAT IF'), title: T('Bagaimana jika…', 'What if…'), art: 'journey',
      body: T('Ikuti perjalanan Si Belang, sapi dengan ear tag TQ-0217, dalam lima langkah. Ini gambaran rancangan TernaQin — belum produk jadi.', 'Follow Si Belang, a cow with ear tag TQ-0217, in five steps. This is a design concept of TernaQin — not a finished product.') },
    b4: { n: 4, overline: T('BAB 4 · MENURUT ANDA', 'CHAPTER 4 · YOUR VIEW'), title: T('Menurut Anda', 'Your view'), art: 'chat',
      body: T('Sekarang giliran Anda menilai — bagian mana yang berguna, mana yang tidak, dan apa yang membuat Anda ragu. Kritik Anda paling berharga di sini.', 'Now it’s your turn to judge — what is useful, what isn’t, and what makes you doubtful. Your criticism matters most here.') },
  };

  const B1_INTRO = {
    peternak: T('Pukul enam pagi. Si Belang dan kawan-kawannya sudah menunggu pakan. Di kepala Anda ada banyak hal: berapa berat mereka sekarang, mana yang kurang makan, kapan waktu jual yang tepat. Mari mulai dari bagaimana semua itu berjalan hari ini.',
      'Six in the morning. Si Belang and the herd are waiting for feed. Many things are on your mind: how heavy they are now, which one isn’t eating, when is the right time to sell. Let’s start with how all of that works today.'),
    rph: T('Sebuah truk tiba membawa beberapa ekor sapi, salah satunya Si Belang. Dari mana ia berasal? Sehat atau tidak? Sebelum pisau diangkat, banyak pertanyaan yang perlu dijawab. Mari mulai dari bagaimana RPH Anda menjawabnya hari ini.',
      'A truck arrives with several cattle, Si Belang among them. Where did it come from? Is it healthy? Before the knife is raised, many questions need answers. Let’s start with how your slaughterhouse answers them today.'),
    pedagang: T('Pagi-pagi, daging segar tiba di lapak atau toko Anda. Sebentar lagi pembeli datang dan bertanya: ini daging dari mana, kapan dipotong? Mari mulai dari apa yang terjadi di tempat Anda hari ini.',
      'Early morning, fresh meat arrives at your stall or shop. Soon buyers come and ask: where is this from, when was it slaughtered? Let’s start with what happens at your place today.'),
    konsumen: T('Anda berdiri di depan penjual daging. Warnanya tampak segar, harganya cocok. Tapi daging ini dari mana — dan halalkah prosesnya? Mari mulai dari cara Anda memilih daging selama ini.',
      'You stand in front of a meat seller. It looks fresh, the price is right. But where is this meat from — and was it handled halal? Let’s start with how you have been choosing meat.'),
  };

  /* ---------- Bab 3: perjalanan Si Belang ---------- */
  const JOURNEY = [
    { key: 'kandang', icon: 'ph-barn', roles: ['peternak'],
      title: T('1 · Di kandang', '1 · In the barn'),
      body: T('Setiap ternak punya satu QR Code di ear tag-nya, dari lahir sampai dipotong — QR itu tidak pernah diganti. Pekerja kandang cukup memindainya dengan HP lalu mengetuk beberapa pilihan: kondisi, pakan, berat, obat. Untuk kandang besar, pencatatan harian bisa per kelompok kandang; hanya ternak yang bermasalah yang dicatat satu per satu.',
        'Every animal has one QR code on its ear tag, from birth until slaughter — it is never replaced. Barn workers scan it with a phone and tap a few options: condition, feed, weight, medicine. For large barns, daily records can be made per pen; only animals with problems are recorded individually.') },
    { key: 'peringatan', icon: 'ph-bell-ringing', roles: ['peternak'],
      title: T('2 · Peringatan dini', '2 · Early warning'),
      body: T('Kalau pola makan atau berat Si Belang tiba-tiba tidak wajar, sistem memberi peringatan lebih awal — sebelum gejalanya terlihat jelas — beserta saran langkah pertama. Keputusan tetap di tangan peternak dan dokter hewan.',
        'If Si Belang’s eating pattern or weight suddenly looks unusual, the system warns early — before symptoms are obvious — with a suggested first step. Decisions stay with the farmer and the vet.') },
    { key: 'jual', icon: 'ph-handshake', roles: ['peternak'],
      title: T('3 · Saat dijual', '3 · At the sale'),
      body: T('Peternak bisa menunjukkan riwayat berat dan kesehatan Si Belang kepada pembeli — sebagai bukti, bukan sekadar taksiran. Kalau dijual ke pembeli yang tidak memakai TernaQin, pembeli tetap bisa melihat riwayat lewat QR, tetapi tidak bisa mengubahnya.',
        'The farmer can show buyers Si Belang’s weight and health history — as evidence, not just an estimate. If sold to a buyer who doesn’t use TernaQin, the buyer can still view the history via QR, but cannot change it.') },
    { key: 'rph', icon: 'ph-clipboard-text', roles: ['rph'],
      title: T('4 · Di rumah potong', '4 · At the slaughterhouse'),
      body: T('Petugas RPH memindai QR, mencocokkan data dengan kondisi fisik, lalu mencatat pemeriksaan dan pemotongan. Setiap batch daging yang keluar — utuh, potongan besar, atau per kilo — mendapat QR berisi nama penerima resmi dan beratnya.',
        'Slaughterhouse staff scan the QR, match the data to the animal’s condition, then record inspection and slaughter. Every batch of meat that leaves — whole, large cuts, or per kilo — gets a QR listing the official recipient and weight.') },
    { key: 'konsumen', icon: 'ph-qr-code', roles: ['pedagang', 'konsumen'],
      title: T('5 · Di tangan pembeli', '5 · In the buyer’s hands'),
      body: T('Pembeli memindai QR di label kemasan atau kartu di lapak. Yang terlihat: asal kandang, riwayat singkat, tanggal potong, RPH, daftar penjual resmi, dan batas masa jual. Pembeli juga bisa memberi ulasan atau melaporkan kejanggalan. Catatan ini tidak bisa diubah diam-diam setelah dibuat.',
        'Buyers scan the QR on a package label or a card at the stall. They see: origin barn, a short history, slaughter date, slaughterhouse, the official sellers, and the sell-by date. Buyers can also review or report anything odd. Records cannot be silently changed once made.') },
  ];
  const JOURNEY_NOTE = T('Ini masih gambaran rancangan, belum produk jadi. TernaQin membantu mendeteksi dan membuktikan, tetapi tidak bisa menjamin seratus persen — misalnya bila label dipindah ke daging lain di luar pengawasan.',
    'This is still a design concept, not a finished product. TernaQin helps detect and prove, but cannot guarantee one hundred percent — for example if a label is moved to other meat outside anyone’s control.');
  const YOUR_PART = T('Bagian Anda', 'Your part');

  /* ---------- Opsi bersama ---------- */
  const SCALE5 = (lo, hi) => ({ lo, hi });
  const PILOT = [o('ya', 'Ya', 'Yes'), o('mungkin', 'Mungkin', 'Maybe'), o('tidak', 'Tidak', 'No')];

  /* ---------- Pertanyaan profil umum ---------- */
  const PROVINCES = ['Aceh','Sumatera Utara','Sumatera Barat','Riau','Kepulauan Riau','Jambi','Bengkulu','Sumatera Selatan','Kepulauan Bangka Belitung','Lampung','Banten','DKI Jakarta','Jawa Barat','Jawa Tengah','DI Yogyakarta','Jawa Timur','Bali','Nusa Tenggara Barat','Nusa Tenggara Timur','Kalimantan Barat','Kalimantan Tengah','Kalimantan Selatan','Kalimantan Timur','Kalimantan Utara','Sulawesi Utara','Gorontalo','Sulawesi Tengah','Sulawesi Barat','Sulawesi Selatan','Sulawesi Tenggara','Maluku','Maluku Utara','Papua','Papua Barat','Papua Barat Daya','Papua Tengah','Papua Pegunungan','Papua Selatan'];

  const COMMON = [
    { id: 'U1', ch: 'profile', type: 'select', q: T('Di provinsi mana Anda tinggal atau berusaha?', 'Which province do you live or work in?'),
      opts: PROVINCES.map((p) => o(p.toLowerCase().replace(/[^a-z]+/g, '_'), p, p)).concat([o('luar_negeri', 'Di luar Indonesia', 'Outside Indonesia')]) },
    { id: 'U2', ch: 'profile', type: 'text', q: T('Kabupaten atau kota', 'District or city'), ph: T('Contoh: Kab. Boyolali', 'e.g. Boyolali Regency') },
    { id: 'U3', ch: 'profile', type: 'rc', optional: true, q: T('Usia Anda', 'Your age'),
      opts: [o('u25', 'Di bawah 25', 'Under 25'), o('25_34', '25–34'), o('35_44', '35–44'), o('45_54', '45–54'), o('55p', '55 ke atas', '55 and over')].map(fixEn) },
  ];
  function fixEn(x) { if (!x.t.en) x.t.en = x.t.id; return x; }

  /* ---------- PETERNAK ---------- */
  const PETERNAK = [
    // Profil
    { id: 'P1', ch: 'profile', type: 'cb', q: T('Jenis usaha ternak Anda', 'Your type of livestock business'),
      opts: [o('pembiakan', 'Pembiakan (punya indukan)', 'Breeding (own cows)'), o('penggemukan', 'Penggemukan', 'Fattening'), o('jual_beli', 'Jual beli ternak', 'Livestock trading'), o('lainnya', 'Lainnya', 'Other')] },
    { id: 'P2', ch: 'profile', type: 'rc', q: T('Berapa sapi yang Anda pelihara saat ini?', 'How many cattle do you keep right now?'),
      opts: [o('1_4', '1–4 ekor', '1–4 head'), o('5_19', '5–19 ekor', '5–19 head'), o('20_99', '20–99 ekor', '20–99 head'), o('100_499', '100–499 ekor', '100–499 head'), o('500p', '500 ekor atau lebih', '500 head or more')] },
    { id: 'P3', ch: 'profile', type: 'rc', q: T('Berapa lokasi kandang yang Anda kelola?', 'How many barn locations do you manage?'),
      opts: [o('1', '1 lokasi', '1 location'), o('2_3', '2–3 lokasi', '2–3 locations'), o('4p', '4 lokasi atau lebih', '4 or more')] },
    { id: 'P4', ch: 'profile', type: 'rc', q: T('Berapa pekerja kandang selain Anda?', 'How many barn workers besides yourself?'),
      opts: [o('0', 'Tidak ada, saya sendiri', 'None, just me'), o('1_2', '1–2 orang', '1–2 people'), o('3_9', '3–9 orang', '3–9 people'), o('10p', '10 orang atau lebih', '10 or more')] },
    { id: 'P5', ch: 'profile', type: 'rc', q: T('Apakah Anda tergabung dalam kelompok ternak atau koperasi?', 'Are you part of a farmer group or cooperative?'),
      opts: [o('ya', 'Ya', 'Yes'), o('tidak', 'Tidak', 'No')] },
    { id: 'P6', ch: 'profile', type: 'rc', q: T('Apakah Anda juga memiliki atau mengelola rumah potong hewan?', 'Do you also own or run a slaughterhouse?'),
      opts: [o('ya', 'Ya', 'Yes'), o('tidak', 'Tidak', 'No')] },

    // Bab 1
    { id: 'P7', ch: 'b1', type: 'cb', shuffle: true, q: T('Bagaimana Anda mencatat kondisi ternak saat ini?', 'How do you record your animals’ condition today?'),
      opts: [o('tidak_mencatat', 'Tidak mencatat, cukup diingat', 'I don’t record, I remember', { exclusive: true, fixed: true }), o('buku', 'Buku tulis', 'Notebook'), o('excel', 'Excel / spreadsheet', 'Excel / spreadsheet'), o('whatsapp', 'Pesan atau foto di WhatsApp', 'WhatsApp messages or photos'), o('aplikasi', 'Aplikasi', 'An app'), o('petugas', 'Dicatat petugas dinas', 'Recorded by government officers')] },
    { id: 'P8', ch: 'b1', type: 'cb', showIf: (a) => has(a.P7) && !inc(a.P7, 'tidak_mencatat'), q: T('Apa saja yang benar-benar Anda catat?', 'What do you actually record?'),
      opts: [o('berat', 'Berat badan', 'Body weight'), o('pakan', 'Pakan', 'Feed'), o('kesehatan', 'Kesehatan dan obat', 'Health and medicine'), o('vaksin', 'Vaksin', 'Vaccines'), o('silsilah', 'Kelahiran dan silsilah', 'Births and lineage'), o('keuangan', 'Keuangan', 'Finances')] },
    { id: 'P9', ch: 'b1', type: 'rc', q: T('Kapan terakhir kali sapi Anda ditimbang dengan timbangan?', 'When were your cattle last weighed on a scale?'),
      opts: [o('minggu_ini', 'Minggu ini', 'This week'), o('bulan_ini', 'Bulan ini', 'This month'), o('1_3_bulan', '1–3 bulan lalu', '1–3 months ago'), o('lebih_3_bulan', 'Lebih dari 3 bulan lalu', 'More than 3 months ago'), o('tidak_pernah', 'Tidak pernah ditimbang', 'Never weighed')] },
    { id: 'P10', ch: 'b1', type: 'rc', q: T('Bagaimana harga jual sapi Anda biasanya ditentukan?', 'How is the selling price of your cattle usually set?'),
      opts: [o('ditimbang', 'Ditimbang, lalu dihitung per kg', 'Weighed, then priced per kg'), o('taksir_sendiri', 'Ditaksir sendiri', 'I estimate it myself'), o('taksir_pembeli', 'Ditaksir pembeli atau blantik', 'Estimated by the buyer or broker'), o('borongan', 'Harga borongan per ekor', 'Flat price per head'), o('lainnya', 'Lainnya', 'Other')] },
    { id: 'P11', ch: 'b1', type: 'cb', q: T('Kepada siapa Anda biasanya menjual?', 'Who do you usually sell to?'),
      opts: [o('blantik', 'Blantik / makelar', 'Broker (blantik)'), o('jagal', 'Pedagang atau jagal', 'Traders or butchers'), o('rph', 'Langsung ke RPH', 'Directly to a slaughterhouse'), o('peternak', 'Peternak lain', 'Other farmers'), o('konsumen', 'Konsumen langsung', 'Consumers directly'), o('kurban', 'Pembeli hewan kurban', 'Qurban buyers')] },
    { id: 'P12', ch: 'b1', type: 'rc', q: T('Pada penjualan terakhir Anda, dibanding harga yang Anda harapkan, harga yang Anda terima…', 'At your last sale, compared with the price you expected, the price you received was…'),
      opts: [o('sama_lebih', 'Sama atau lebih tinggi', 'The same or higher'), o('turun_5', 'Lebih rendah, kurang dari 5%', 'Lower, by less than 5%'), o('turun_5_10', 'Lebih rendah 5–10%', 'Lower by 5–10%'), o('turun_10p', 'Lebih rendah lebih dari 10%', 'Lower by more than 10%'), o('tidak_ingat', 'Tidak ingat / belum pernah menjual', 'Don’t remember / never sold')] },
    { id: 'P13', ch: 'b1', type: 'sk', q: T('Seberapa sering Anda merasa harga jual sapi Anda kurang adil?', 'How often do you feel the price for your cattle is unfair?'),
      scale: SCALE5(T('Tidak pernah', 'Never'), T('Sangat sering', 'Very often')) },
    { id: 'P14', ch: 'b1', type: 'cb', max: 3, shuffle: true, q: T('Masalah terbesar usaha Anda dalam 6 bulan terakhir', 'The biggest problems in your business over the last 6 months'),
      opts: [o('harga_pakan', 'Harga pakan naik', 'Rising feed prices'), o('harga_jual', 'Harga jual tidak menentu', 'Unstable selling prices'), o('penyakit', 'Penyakit ternak', 'Animal disease'), o('hilang', 'Ternak hilang atau dicuri', 'Animals lost or stolen'), o('pekerja', 'Pekerja sering berganti', 'Workers keep changing'), o('pembeli', 'Sulit mencari pembeli', 'Hard to find buyers'), o('impor', 'Kalah bersaing dengan daging impor/kerbau', 'Competing with imported/buffalo meat'), o('pencatatan', 'Pencatatan berantakan', 'Messy record-keeping'), o('modal', 'Modal terbatas', 'Limited capital')] },
    { id: 'P15', ch: 'b1', type: 'rc', q: T('Dalam 12 bulan terakhir, adakah ternak Anda yang sakit?', 'In the last 12 months, did any of your animals get sick?'),
      opts: [o('tidak', 'Tidak ada', 'None'), o('cepat', 'Ada, dan cepat ketahuan', 'Yes, and it was noticed quickly'), o('terlambat', 'Ada, tapi terlambat ketahuan', 'Yes, but it was noticed late')] },
    { id: 'P16', ch: 'b1', type: 'rc', showIf: (a) => a.P15 && a.P15 !== 'tidak', q: T('Kira-kira berapa kerugian akibat ternak sakit atau mati dalam 12 bulan itu?', 'Roughly how much did sick or dead animals cost you in those 12 months?'),
      opts: [o('lt1jt', 'Kurang dari Rp1 juta', 'Under Rp1 million'), o('1_5jt', 'Rp1–5 juta', 'Rp1–5 million'), o('5_20jt', 'Rp5–20 juta', 'Rp5–20 million'), o('gt20jt', 'Lebih dari Rp20 juta', 'Over Rp20 million'), o('tidak_tahu', 'Tidak tahu', 'Don’t know')] },
    { id: 'P17', ch: 'b1', type: 'tx', q: T('Ceritakan satu kejadian yang paling merugikan usaha Anda.', 'Tell us about one event that hurt your business the most.') },

    // Bab 2
    { id: 'P18', ch: 'b2', type: 'rc', q: T('Rencana usaha Anda 2–3 tahun ke depan', 'Your business plan for the next 2–3 years'),
      opts: [o('menambah', 'Menambah jumlah ternak', 'Grow the herd'), o('tetap', 'Tetap seperti sekarang', 'Stay as is'), o('mengurangi', 'Mengurangi', 'Scale down'), o('berhenti', 'Berhenti', 'Stop'), o('belum_tahu', 'Belum tahu', 'Not sure yet')] },
    { id: 'P19', ch: 'b2', type: 'cb', max: 2, shuffle: true, q: T('Apa yang paling Anda khawatirkan ke depan?', 'What worries you most going forward?'),
      opts: [o('harga_pakan', 'Harga pakan', 'Feed prices'), o('harga_jual', 'Harga jual', 'Selling prices'), o('penyakit', 'Penyakit', 'Disease'), o('impor', 'Daging impor', 'Imported meat'), o('aturan', 'Aturan pemerintah', 'Government rules'), o('tenaga', 'Tenaga kerja', 'Labour'), o('kepercayaan', 'Pembeli tidak percaya kualitas', 'Buyers not trusting quality')] },
    { id: 'P20', ch: 'b2', type: 'rc', q: T('Apakah pembeli pernah meminta bukti tentang ternak Anda — misalnya surat kesehatan, riwayat vaksin, atau berat?', 'Have buyers ever asked for proof about your animals — e.g. a health certificate, vaccine record, or weight?'),
      opts: [o('sering', 'Sering', 'Often'), o('kadang', 'Kadang', 'Sometimes'), o('tidak_pernah', 'Tidak pernah', 'Never')] },
    { id: 'P21', ch: 'b2', type: 'tx', q: T('Kalau ada satu hal di usaha Anda yang ingin dibantu teknologi, apa itu?', 'If technology could help with one thing in your business, what would it be?') },

    // Bab 3
    { id: 'C1', ch: 'b3', type: 'rc', q: T('Seberapa jelas penjelasan tadi bagi Anda?', 'How clear was that explanation for you?'),
      opts: [o('jelas', 'Jelas', 'Clear'), o('cukup', 'Cukup jelas', 'Fairly clear'), o('kurang', 'Kurang jelas', 'Not clear')] },

    // Bab 4
    { id: 'P22', ch: 'b4', type: 'mx', q: T('Seberapa berguna fitur berikut bagi usaha Anda?', 'How useful would these features be for your business?'),
      scale: SCALE5(T('Tidak berguna', 'Not useful'), T('Sangat berguna', 'Very useful')),
      rows: [o('a', 'Catat kondisi harian dengan scan QR', 'Record daily condition by scanning a QR'), o('b', 'Peringatan dini ternak sakit', 'Early warning for sick animals'), o('c', 'Riwayat berat dan kesehatan untuk ditunjukkan saat menjual', 'Weight and health history to show when selling'), o('d', 'Stok pakan dan obat', 'Feed and medicine stock'), o('e', 'Pembagian tugas dan absensi pekerja', 'Worker tasks and attendance'), o('f', 'Label terverifikasi sampai ke pembeli daging', 'Verified label all the way to meat buyers')] },
    { id: 'P23', ch: 'b4', type: 'rc', q: T('Dari fitur tadi, mana yang paling Anda butuhkan sekarang?', 'Of those features, which do you need most right now?'),
      opts: [o('a', 'Catat kondisi harian dengan scan QR', 'Daily records by QR scan'), o('b', 'Peringatan dini ternak sakit', 'Early warning for sick animals'), o('c', 'Riwayat untuk ditunjukkan saat menjual', 'History to show when selling'), o('d', 'Stok pakan dan obat', 'Feed and medicine stock'), o('e', 'Tugas dan absensi pekerja', 'Worker tasks and attendance'), o('f', 'Label terverifikasi', 'Verified label'), o('tidak_ada', 'Tidak ada yang saya butuhkan', 'None of them', { fixed: true })] },
    { id: 'P24', ch: 'b4', type: 'rc', q: T('Kalau harus memilih satu, mana yang lebih Anda sukai?', 'If you had to choose one, which would you prefer?'),
      opts: [o('sederhana', 'Aplikasi sederhana, cukup 3 menit sehari, fitur dasar', 'A simple app, 3 minutes a day, basic features'), o('lengkap', 'Aplikasi lengkap, sekitar 10 menit sehari, fitur banyak', 'A complete app, about 10 minutes a day, many features')] },
    { id: 'P25', ch: 'b4', type: 'rc', q: T('Siapa yang kemungkinan mengisi data harian?', 'Who would most likely enter the daily data?'),
      opts: [o('sendiri', 'Saya sendiri', 'Myself'), o('keluarga', 'Anak atau keluarga', 'A child or family member'), o('pekerja', 'Pekerja kandang', 'Barn workers'), o('belum_tahu', 'Belum tahu', 'Not sure')] },
    { id: 'P26', ch: 'b4', type: 'rc', q: T('Perangkat yang dipakai di kandang', 'Devices used at the barn'),
      opts: [o('android', 'HP Android', 'Android phone'), o('iphone', 'iPhone'), o('hp_biasa', 'HP biasa (bukan smartphone)', 'Basic phone (not a smartphone)'), o('tidak_ada', 'Tidak ada', 'None')].map(fixEn) },
    { id: 'P27', ch: 'b4', type: 'rc', q: T('Kondisi sinyal internet di kandang', 'Internet signal at the barn'),
      opts: [o('bagus', 'Bagus', 'Good'), o('kadang', 'Kadang hilang', 'Sometimes drops'), o('hampir_tidak', 'Hampir tidak ada', 'Almost none')] },
    { id: 'P28', ch: 'b4', type: 'rc', q: T('Saat ini, apakah usaha Anda membayar aplikasi atau layanan digital apa pun (misalnya pembukuan atau kasir)?', 'Does your business currently pay for any app or digital service (e.g. bookkeeping or point of sale)?'),
      opts: [o('ya', 'Ya', 'Yes'), o('tidak', 'Tidak', 'No')] },
    { id: 'P29', ch: 'b4', type: 'rc', q: T('Cara bayar yang paling cocok bagi Anda', 'The payment model that suits you best'),
      opts: [o('bulanan', 'Langganan bulanan tetap', 'Fixed monthly subscription'), o('per_ekor', 'Bayar per ekor yang dijual dengan label terverifikasi', 'Pay per animal sold with a verified label'), o('gratis_terbatas', 'Gratis dengan fitur terbatas', 'Free with limited features'), o('kelompok', 'Dibayar bersama lewat kelompok/koperasi', 'Paid together via a group/cooperative'), o('tidak_mau', 'Saya tidak mau membayar', 'I would not pay', { fixed: true })] },
    { id: 'P30', ch: 'b4', type: 'rc', showIf: (a) => ['bulanan', 'kelompok'].includes(a.P29), q: T('Berapa biaya per bulan yang masih wajar bagi Anda?', 'What monthly cost would still feel fair to you?'),
      opts: [o('lt50', 'Kurang dari Rp50 ribu', 'Under Rp50k'), o('50_100', 'Rp50–100 ribu', 'Rp50–100k'), o('100_250', 'Rp100–250 ribu', 'Rp100–250k'), o('250_500', 'Rp250–500 ribu', 'Rp250–500k'), o('gt500', 'Lebih dari Rp500 ribu', 'Over Rp500k')] },
    { id: 'P31', ch: 'b4', type: 'rc', showIf: (a) => a.P29 === 'per_ekor', q: T('Berapa biaya per ekor yang masih wajar bagi Anda?', 'What cost per animal would still feel fair to you?'),
      opts: [o('lt10', 'Kurang dari Rp10 ribu', 'Under Rp10k'), o('10_25', 'Rp10–25 ribu', 'Rp10–25k'), o('25_50', 'Rp25–50 ribu', 'Rp25–50k'), o('gt50', 'Lebih dari Rp50 ribu', 'Over Rp50k')] },
    { id: 'P32', ch: 'b4', type: 'cb', max: 3, shuffle: true, q: T('Apa yang membuat Anda ragu memakai aplikasi seperti ini?', 'What would make you hesitate to use an app like this?'),
      opts: [o('biaya', 'Biaya', 'Cost'), o('repot', 'Repot atau makan waktu', 'Hassle or time'), o('data_bocor', 'Takut data bocor ke pesaing atau dipakai untuk pajak', 'Fear data leaks to competitors or is used for tax'), o('pekerja', 'Pekerja tidak bisa memakai', 'Workers can’t use it'), o('sinyal', 'Sinyal', 'Signal'), o('manfaat', 'Belum yakin manfaatnya', 'Not sure of the benefit'), o('absensi_foto', 'Tidak nyaman dengan absensi foto', 'Uncomfortable with photo attendance'), o('tidak_ragu', 'Tidak ada keraguan', 'No hesitation', { exclusive: true, fixed: true })] },
    { id: 'P33', ch: 'b4', type: 'tx', q: T('Setelah mencoba, apa yang akan membuat Anda berhenti memakai aplikasi ini?', 'After trying it, what would make you stop using this app?') },
    { id: 'P34', ch: 'b4', type: 'rc', q: T('Bersediakah usaha Anda ikut uji coba gratis selama 2–3 bulan?', 'Would your business join a free 2–3 month trial?'), opts: PILOT },
  ];

  /* ---------- RPH ---------- */
  const RANGE_MONTH = [o('lt250', 'Kurang dari Rp250 ribu', 'Under Rp250k'), o('250_500', 'Rp250–500 ribu', 'Rp250–500k'), o('500_1jt', 'Rp500 ribu–1 juta', 'Rp500k–1m'), o('1_3jt', 'Rp1–3 juta', 'Rp1–3m'), o('gt3jt', 'Lebih dari Rp3 juta', 'Over Rp3m')];
  const RANGE_HEAD = [o('lt5', 'Kurang dari Rp5 ribu', 'Under Rp5k'), o('5_10', 'Rp5–10 ribu', 'Rp5–10k'), o('10_25', 'Rp10–25 ribu', 'Rp10–25k'), o('gt25', 'Lebih dari Rp25 ribu', 'Over Rp25k')];
  const RPH = [
    { id: 'R1', ch: 'profile', type: 'rc', q: T('Status kepemilikan RPH', 'Slaughterhouse ownership'),
      opts: [o('pemda', 'Milik pemerintah daerah', 'Local government'), o('swasta', 'Swasta', 'Private'), o('peternakan', 'Milik peternakan sendiri', 'Owned by a farm'), o('lainnya', 'Lainnya', 'Other')] },
    { id: 'R2', ch: 'profile', type: 'rc', q: T('Jabatan Anda', 'Your position'),
      opts: [o('pemilik', 'Pemilik', 'Owner'), o('kepala', 'Kepala / pengelola', 'Head / manager'), o('petugas', 'Petugas', 'Staff'), o('juleha', 'Juru sembelih', 'Slaughterer'), o('lainnya', 'Lainnya', 'Other')] },
    { id: 'R3', ch: 'profile', type: 'rc', q: T('Rata-rata sapi yang dipotong per hari', 'Average cattle slaughtered per day'),
      opts: [o('lt5', 'Kurang dari 5', 'Under 5'), o('5_20', '5–20'), o('21_50', '21–50'), o('gt50', 'Lebih dari 50', 'Over 50')].map(fixEn) },
    { id: 'R4', ch: 'profile', type: 'rc', q: T('Status Nomor Kontrol Veteriner (NKV)', 'Veterinary Control Number (NKV) status'),
      opts: [o('punya', 'Sudah punya', 'Have it'), o('proses', 'Sedang proses', 'In progress'), o('belum', 'Belum', 'Not yet'), o('tidak_tahu', 'Tidak tahu', 'Don’t know')] },
    { id: 'R5', ch: 'profile', type: 'rc', q: T('Status sertifikat halal', 'Halal certificate status'),
      opts: [o('punya', 'Sudah punya', 'Have it'), o('proses', 'Sedang proses', 'In progress'), o('belum', 'Belum', 'Not yet'), o('tidak_tahu', 'Tidak tahu', 'Don’t know')] },
    { id: 'R6', ch: 'profile', type: 'cb', q: T('Milik siapa sapi yang dipotong di RPH Anda?', 'Who owns the cattle slaughtered at your facility?'),
      opts: [o('jagal', 'Jagal atau pedagang', 'Butchers or traders'), o('peternakan', 'Peternakan yang mengirim langsung', 'Farms delivering directly'), o('rph', 'Milik RPH sendiri', 'The slaughterhouse itself'), o('kurban', 'Hewan kurban dari masyarakat', 'Qurban animals from the public')] },

    { id: 'R7', ch: 'b1', type: 'cb', q: T('Bagaimana asal ternak dicatat saat sapi tiba?', 'How is the animal’s origin recorded on arrival?'),
      opts: [o('tidak', 'Tidak dicatat', 'Not recorded', { exclusive: true, fixed: true }), o('buku', 'Buku', 'Logbook'), o('formulir_dinas', 'Formulir dari dinas', 'Government form'), o('excel', 'Excel'), o('aplikasi', 'Aplikasi', 'An app')].map(fixEn) },
    { id: 'R8', ch: 'b1', type: 'sk', q: T('Seberapa sering Anda menerima sapi tanpa keterangan asal yang jelas?', 'How often do you receive cattle without clear origin information?'),
      scale: SCALE5(T('Tidak pernah', 'Never'), T('Hampir selalu', 'Almost always')) },
    { id: 'R9', ch: 'b1', type: 'rc', q: T('Dalam sebulan terakhir, berapa ekor yang ditolak atau ditunda pemotongannya karena sakit atau tidak layak?', 'In the last month, how many animals were rejected or delayed because they were sick or unfit?'),
      opts: [o('0', 'Tidak ada', 'None'), o('1_2', '1–2 ekor', '1–2'), o('3_10', '3–10 ekor', '3–10'), o('gt10', 'Lebih dari 10', 'More than 10'), o('tidak_dicatat', 'Tidak dicatat', 'Not recorded')] },
    { id: 'R10', ch: 'b1', type: 'cb', q: T('Dalam bentuk apa hasil potong keluar dari RPH?', 'In what form does meat leave the slaughterhouse?'),
      opts: [o('karkas', 'Karkas utuh', 'Whole carcass'), o('potongan_besar', 'Potongan besar', 'Large cuts'), o('per_kg', 'Per kilogram', 'Per kilogram'), o('dikemas', 'Sudah dikemas', 'Already packaged'), o('tergantung', 'Tergantung permintaan pembeli', 'Depends on the buyer')] },
    { id: 'R11', ch: 'b1', type: 'rc', q: T('Apakah RPH mencatat kepada siapa hasil potong diserahkan dan berapa kilonya?', 'Does the slaughterhouse record who receives the meat and how many kilos?'),
      opts: [o('selalu', 'Selalu', 'Always'), o('kadang', 'Kadang', 'Sometimes'), o('tidak', 'Tidak', 'No')] },
    { id: 'R12', ch: 'b1', type: 'cb', max: 3, shuffle: true, q: T('Masalah utama RPH Anda', 'Main problems at your slaughterhouse'),
      opts: [o('dokumen', 'Dokumen untuk NKV atau halal', 'Paperwork for NKV or halal'), o('juleha', 'Juru sembelih bersertifikat', 'Certified slaughterers'), o('asal', 'Asal ternak tidak jelas', 'Unclear animal origin'), o('ternak_sakit', 'Menerima ternak sakit atau cacat', 'Receiving sick or injured animals'), o('keluhan', 'Keluhan pembeli', 'Buyer complaints'), o('pencatatan', 'Pencatatan berantakan', 'Messy records'), o('persaingan', 'Persaingan', 'Competition')] },
    { id: 'R13', ch: 'b1', type: 'tx', q: T('Pada audit atau pemeriksaan terakhir, dokumen apa yang paling sulit disiapkan?', 'At your last audit or inspection, which document was hardest to prepare?') },

    { id: 'R14', ch: 'b2', type: 'sk', q: T('Seberapa berat tekanan aturan (halal, NKV, pemeriksaan) bagi RPH Anda ke depan?', 'How heavy will regulatory pressure (halal, NKV, inspections) be for you ahead?'),
      scale: SCALE5(T('Ringan', 'Light'), T('Sangat berat', 'Very heavy')) },
    { id: 'R15', ch: 'b2', type: 'tx', q: T('Apa yang Anda harapkan berubah dalam 2–3 tahun ke depan?', 'What do you hope will change in the next 2–3 years?') },

    { id: 'C1', ch: 'b3', type: 'rc', q: T('Seberapa jelas penjelasan tadi bagi Anda?', 'How clear was that explanation for you?'),
      opts: [o('jelas', 'Jelas', 'Clear'), o('cukup', 'Cukup jelas', 'Fairly clear'), o('kurang', 'Kurang jelas', 'Not clear')] },

    { id: 'R16', ch: 'b4', type: 'mx', q: T('Seberapa berguna fitur berikut bagi RPH Anda?', 'How useful would these features be for your slaughterhouse?'),
      scale: SCALE5(T('Tidak berguna', 'Not useful'), T('Sangat berguna', 'Very useful')),
      rows: [o('a', 'Scan QR untuk melihat riwayat ternak', 'Scan QR to view the animal’s history'), o('b', 'Daftar periksa verifikasi sebelum potong', 'Pre-slaughter verification checklist'), o('c', 'Dokumentasi foto pemotongan untuk audit', 'Slaughter photo records for audits'), o('d', 'Label QR per batch berisi daftar penerima resmi', 'Batch QR label listing official recipients'), o('e', 'Laporan otomatis untuk dinas atau auditor', 'Automatic reports for authorities or auditors')] },
    { id: 'R17', ch: 'b4', type: 'rc', q: T('Bersediakah petugas mencatat penerima dan berat setiap batch yang keluar?', 'Would your staff record the recipient and weight of every batch that leaves?'),
      opts: [o('ya_mudah', 'Ya, itu mudah', 'Yes, that’s easy'), o('ya_cepat', 'Ya, kalau selesai kurang dari 1 menit', 'Yes, if it takes under 1 minute'), o('tidak', 'Tidak', 'No')] },
    { id: 'R18', ch: 'b4', type: 'rc', q: T('Berapa waktu yang wajar untuk verifikasi satu ekor di aplikasi?', 'How long is reasonable to verify one animal in the app?'),
      opts: [o('lt1', 'Kurang dari 1 menit', 'Under 1 minute'), o('1_3', '1–3 menit', '1–3 minutes'), o('3_5', '3–5 menit', '3–5 minutes'), o('gt5', 'Lebih dari 5 menit tidak masalah', 'Over 5 minutes is fine')] },
    { id: 'R19', ch: 'b4', type: 'rc', q: T('Kemampuan mencetak label saat ini', 'Your current label-printing ability'),
      opts: [o('printer_label', 'Punya printer label', 'Have a label printer'), o('printer_biasa', 'Printer biasa', 'Regular printer'), o('stiker_jadi', 'Bisa beli stiker jadi', 'Can buy pre-printed stickers'), o('belum', 'Belum bisa', 'Not able yet')] },
    { id: 'R20', ch: 'b4', type: 'rc', q: T('Pernahkah RPH mengeluarkan biaya untuk sistem, aplikasi, atau konsultan sertifikasi?', 'Has the slaughterhouse ever paid for a system, app, or certification consultant?'),
      opts: [o('ya', 'Ya', 'Yes'), o('tidak', 'Tidak', 'No'), o('tidak_tahu', 'Tidak tahu', 'Don’t know')] },
    { id: 'R21', ch: 'b4', type: 'rc', q: T('Siapa yang memutuskan jika RPH ingin memakai sistem baru?', 'Who decides if the slaughterhouse adopts a new system?'),
      opts: [o('saya', 'Saya sendiri', 'Me'), o('pemilik', 'Pemilik atau direksi', 'Owner or management'), o('pemda', 'Pemerintah daerah / dinas', 'Local government / agency'), o('lainnya', 'Lainnya', 'Other')] },
    { id: 'R22', ch: 'b4', type: 'rc', q: T('Cara bayar yang paling cocok', 'The payment model that suits you best'),
      opts: [o('bulanan', 'Langganan bulanan', 'Monthly subscription'), o('per_ekor', 'Per ekor yang dipotong dan dicatat', 'Per animal slaughtered and recorded'), o('gratis_terbatas', 'Gratis dengan fitur terbatas', 'Free with limited features'), o('pemda', 'Dibiayai pemerintah daerah', 'Funded by local government'), o('tidak_mau', 'Tidak mau membayar', 'Would not pay', { fixed: true })] },
    { id: 'R23', ch: 'b4', type: 'rc', showIf: (a) => a.R22 === 'bulanan', q: T('Berapa biaya per bulan yang masih wajar?', 'What monthly cost would still feel fair?'), opts: RANGE_MONTH },
    { id: 'R24', ch: 'b4', type: 'rc', showIf: (a) => a.R22 === 'per_ekor', q: T('Berapa biaya per ekor yang masih wajar?', 'What cost per animal would still feel fair?'), opts: RANGE_HEAD },
    { id: 'R25', ch: 'b4', type: 'cb', max: 3, shuffle: true, q: T('Apa yang membuat Anda ragu?', 'What makes you hesitate?'),
      opts: [o('biaya', 'Biaya', 'Cost'), o('waktu', 'Menambah waktu kerja', 'Adds work time'), o('petugas', 'Petugas tidak terbiasa', 'Staff not used to it'), o('sinyal', 'Sinyal', 'Signal'), o('izin', 'Harus izin atasan atau pemda', 'Needs approval from management or government'), o('manfaat', 'Belum yakin manfaatnya', 'Not sure of the benefit'), o('tidak_ragu', 'Tidak ada keraguan', 'No hesitation', { exclusive: true, fixed: true })] },
    { id: 'R26', ch: 'b4', type: 'rc', q: T('Bersediakah RPH Anda ikut uji coba?', 'Would your slaughterhouse join a trial?'), opts: PILOT },
  ];

  /* ---------- PEDAGANG ---------- */
  const PEDAGANG = [
    { id: 'D1', ch: 'profile', type: 'rc', q: T('Jenis usaha Anda', 'Your type of business'),
      opts: [o('lapak_pasar', 'Lapak pasar tradisional', 'Traditional market stall'), o('toko_daging', 'Toko daging', 'Butcher shop'), o('ritel_modern', 'Ritel modern / supermarket', 'Modern retail / supermarket'), o('online', 'Online'), o('pemasok', 'Pemasok restoran / katering', 'Supplier to restaurants / caterers')].map(fixEn) },
    { id: 'D2', ch: 'profile', type: 'rc', q: T('Rata-rata daging sapi yang terjual per hari', 'Average beef sold per day'),
      opts: [o('lt20', 'Kurang dari 20 kg', 'Under 20 kg'), o('20_50', '20–50 kg'), o('51_200', '51–200 kg'), o('gt200', 'Lebih dari 200 kg', 'Over 200 kg')].map(fixEn) },
    { id: 'D3', ch: 'profile', type: 'cb', q: T('Dari mana Anda mendapat daging?', 'Where do you get your meat?'),
      opts: [o('rph', 'Langsung dari RPH', 'Directly from a slaughterhouse'), o('jagal', 'Dari jagal atau pemasok', 'From butchers or suppliers'), o('impor_beku', 'Daging beku impor', 'Imported frozen meat'), o('potong_sendiri', 'Memotong sendiri', 'I slaughter myself')] },
    { id: 'D4', ch: 'profile', type: 'rc', q: T('Apakah Anda memotong ulang atau membungkus daging sebelum dijual?', 'Do you re-cut or pack meat before selling?'),
      opts: [o('dibungkus', 'Ya, dibungkus per plastik/kemasan', 'Yes, packed in bags/packages'), o('dipotong_saat_beli', 'Dipotong saat dibeli, tanpa kemasan', 'Cut on request, no packaging'), o('seperti_diterima', 'Dijual seperti saat diterima', 'Sold as received')] },

    { id: 'D5', ch: 'b1', type: 'cb', q: T('Apa yang paling sering ditanyakan pembeli?', 'What do buyers ask about most?'),
      opts: [o('asal', 'Asal daging', 'Where the meat is from'), o('halal', 'Halal atau tidak', 'Whether it’s halal'), o('tanggal_potong', 'Kapan dipotong', 'When it was slaughtered'), o('harga', 'Harga', 'Price'), o('bagian', 'Bagian daging', 'Which cut'), o('jarang', 'Jarang bertanya', 'They rarely ask', { exclusive: true, fixed: true })] },
    { id: 'D6', ch: 'b1', type: 'rc', q: T('Dalam seminggu terakhir, berapa pembeli yang bertanya asal daging?', 'In the past week, how many buyers asked where the meat came from?'),
      opts: [o('0', 'Tidak ada', 'None'), o('1_5', '1–5 orang', '1–5'), o('6_20', '6–20 orang', '6–20'), o('gt20', 'Lebih dari 20', 'More than 20')] },
    { id: 'D7', ch: 'b1', type: 'cb', q: T('Masalah yang pernah Anda alami atau dengar di tempat Anda berjualan', 'Problems you have faced or heard of where you sell'),
      opts: [o('oplosan', 'Daging oplosan', 'Adulterated meat'), o('gelonggongan', 'Daging gelonggongan', 'Water-injected meat'), o('kualitas_pemasok', 'Kualitas dari pemasok tidak sesuai', 'Supplier quality not as promised'), o('keluhan', 'Keluhan pembeli', 'Buyer complaints'), o('tidak_pernah', 'Tidak pernah', 'Never', { exclusive: true, fixed: true })] },
    { id: 'D8', ch: 'b1', type: 'sk', q: T('Seberapa berat persaingan dengan daging impor atau kerbau yang lebih murah?', 'How tough is competition from cheaper imported or buffalo meat?'),
      scale: SCALE5(T('Ringan', 'Light'), T('Sangat berat', 'Very tough')) },
    { id: 'D9', ch: 'b1', type: 'rc', q: T('Pernahkah Anda menjual lebih mahal karena ada keterangan khusus — misalnya halal tersertifikasi, sapi lokal, atau potong hari ini?', 'Have you ever charged more because of a special claim — e.g. certified halal, local cattle, or slaughtered today?'),
      opts: [o('rutin', 'Ya, rutin', 'Yes, regularly'), o('pernah', 'Pernah sesekali', 'Occasionally'), o('tidak', 'Tidak pernah', 'Never')] },
    { id: 'D10', ch: 'b1', type: 'tx', q: T('Ceritakan pengalaman paling berkesan dengan pembeli atau pemasok.', 'Tell us your most memorable experience with a buyer or supplier.') },

    { id: 'D11', ch: 'b2', type: 'rc', q: T('Menurut Anda, apakah pembeli makin peduli asal-usul daging?', 'Do you think buyers care more and more about where meat comes from?'),
      opts: [o('makin_peduli', 'Makin peduli', 'They care more'), o('sama', 'Sama saja', 'About the same'), o('makin_tidak', 'Makin tidak peduli', 'They care less')] },
    { id: 'D12', ch: 'b2', type: 'tx', q: T('Apa harapan Anda untuk usaha ini ke depan?', 'What are your hopes for this business ahead?') },

    { id: 'C1', ch: 'b3', type: 'rc', q: T('Seberapa jelas penjelasan tadi bagi Anda?', 'How clear was that explanation for you?'),
      opts: [o('jelas', 'Jelas', 'Clear'), o('cukup', 'Cukup jelas', 'Fairly clear'), o('kurang', 'Kurang jelas', 'Not clear')] },

    { id: 'D13', ch: 'b4', type: 'rc', q: T('Bersediakah Anda memajang kartu QR di lapak atau menempel label QR di kemasan?', 'Would you display a QR card at your stall or put QR labels on packages?'),
      opts: [o('ya', 'Ya', 'Yes'), o('ya_gratis', 'Ya, kalau gratis', 'Yes, if it’s free'), o('tidak', 'Tidak', 'No')] },
    { id: 'D14', ch: 'b4', type: 'rc', q: T('Menurut Anda, bisakah daging berlabel terverifikasi dijual lebih mahal?', 'Could verified-label meat be sold at a higher price?'),
      opts: [o('tidak', 'Tidak', 'No'), o('1_4', 'Bisa, 1–4% lebih mahal', 'Yes, 1–4% more'), o('5_10', 'Bisa, 5–10% lebih mahal', 'Yes, 5–10% more'), o('gt10', 'Bisa, lebih dari 10%', 'Yes, more than 10%')] },
    { id: 'D15', ch: 'b4', type: 'rc', q: T('Akankah Anda memilih pemasok yang dagingnya berlabel, meskipun sedikit lebih mahal?', 'Would you choose a supplier with labelled meat, even if slightly pricier?'),
      opts: [o('ya', 'Ya', 'Yes'), o('tergantung', 'Tergantung selisih harga', 'Depends on the price difference'), o('tidak', 'Tidak', 'No')] },
    { id: 'D16', ch: 'b4', type: 'rc', q: T('Menurut Anda, siapa yang sebaiknya menanggung biaya label?', 'Who should carry the cost of the label?'),
      opts: [o('pemasok', 'Pemasok atau RPH', 'Supplier or slaughterhouse'), o('saya', 'Saya sebagai pedagang', 'Me as the seller'), o('dibagi', 'Dibagi bersama', 'Shared'), o('pembeli', 'Ditambahkan ke harga jual', 'Added to the selling price')] },
    { id: 'D17', ch: 'b4', type: 'cb', max: 3, shuffle: true, q: T('Apa yang membuat Anda ragu?', 'What makes you hesitate?'),
      opts: [o('tidak_peduli', 'Pembeli tidak peduli', 'Buyers don’t care'), o('repot', 'Repot', 'Hassle'), o('harga_naik', 'Harga jadi naik', 'Prices go up'), o('dibandingkan', 'Takut dibandingkan dengan pedagang lain', 'Fear of being compared to other sellers'), o('dipalsukan', 'Label bisa dipalsukan', 'Labels can be faked'), o('tidak_ragu', 'Tidak ada keraguan', 'No hesitation', { exclusive: true, fixed: true })] },
    { id: 'D18', ch: 'b4', type: 'rc', q: T('Bersediakah Anda ikut uji coba?', 'Would you join a trial?'), opts: PILOT },
  ];

  /* ---------- KONSUMEN ---------- */
  const KONSUMEN = [
    { id: 'K1', ch: 'profile', type: 'rc', q: T('Seberapa sering Anda membeli daging sapi?', 'How often do you buy beef?'),
      opts: [o('mingguan', 'Setiap minggu', 'Every week'), o('2_3_bulan', '2–3 kali sebulan', '2–3 times a month'), o('bulanan', 'Sebulan sekali', 'Once a month'), o('hari_raya', 'Hanya saat hari raya', 'Only on holidays')] },
    { id: 'K2', ch: 'profile', type: 'cb', q: T('Di mana Anda biasanya membeli?', 'Where do you usually buy?'),
      opts: [o('pasar', 'Pasar tradisional', 'Traditional market'), o('toko_daging', 'Toko daging', 'Butcher shop'), o('supermarket', 'Supermarket'), o('online', 'Aplikasi atau online', 'App or online'), o('langsung', 'Langsung dari peternak/RPH', 'Directly from a farm/slaughterhouse')].map(fixEn) },
    { id: 'K3', ch: 'profile', type: 'rc', q: T('Untuk keperluan apa?', 'What for?'),
      opts: [o('rumah_tangga', 'Rumah tangga', 'Household'), o('usaha_kuliner', 'Usaha kuliner', 'Food business')] },
    { id: 'K4', ch: 'profile', type: 'rc', q: T('Berapa harga per kg daging sapi yang biasa Anda beli?', 'What price per kg of beef do you usually pay?'),
      opts: [o('lt120', 'Di bawah Rp120 ribu', 'Under Rp120k'), o('120_140', 'Rp120–140 ribu', 'Rp120–140k'), o('140_160', 'Rp140–160 ribu', 'Rp140–160k'), o('gt160', 'Di atas Rp160 ribu', 'Over Rp160k'), o('tidak_tahu', 'Tidak tahu', 'Don’t know')] },

    { id: 'K5', ch: 'b1', type: 'cb', q: T('Menurut Anda, bagaimana cara memastikan daging berkualitas dan halal?', 'In your view, how do you make sure meat is good quality and halal?'),
      opts: [o('warna', 'Melihat warna dan serat', 'Look at colour and texture'), o('langganan', 'Percaya penjual langganan', 'Trust a regular seller'), o('label_halal', 'Melihat label halal', 'Check a halal label'), o('harga', 'Dari harganya', 'From the price'), o('tidak', 'Tidak memeriksa', 'I don’t check', { exclusive: true, fixed: true })] },
    { id: 'K6', ch: 'b1', type: 'cb', q: T('Terakhir kali Anda membeli daging, apa yang benar-benar Anda lakukan?', 'The last time you bought meat, what did you actually do?'),
      help: T('Jawab sesuai yang terjadi, bukan yang seharusnya.', 'Answer what really happened, not what should happen.'),
      opts: [o('lihat_warna', 'Melihat warna atau mencium baunya', 'Looked at the colour or smelled it'), o('tanya_asal', 'Bertanya asal daging', 'Asked where it came from'), o('cek_label', 'Memeriksa label atau sertifikat', 'Checked a label or certificate'), o('bandingkan_harga', 'Membandingkan harga', 'Compared prices'), o('tidak_apa_apa', 'Tidak memeriksa apa pun', 'Didn’t check anything', { exclusive: true, fixed: true })] },
    { id: 'K7', ch: 'b1', type: 'rc', q: T('Pernahkah Anda merasa tertipu atau ragu saat membeli daging?', 'Have you ever felt cheated or doubtful when buying meat?'),
      opts: [o('tertipu', 'Pernah tertipu', 'I’ve been cheated'), o('ragu', 'Pernah ragu', 'I’ve had doubts'), o('tidak', 'Tidak pernah', 'Never')] },
    { id: 'K8', ch: 'b1', type: 'cb', q: T('Informasi apa yang ingin Anda ketahui tentang daging yang dibeli?', 'What would you like to know about the meat you buy?'),
      opts: [o('asal', 'Asal peternakan', 'The farm of origin'), o('tanggal_potong', 'Tanggal potong', 'Slaughter date'), o('rph_halal', 'RPH dan status halal', 'Slaughterhouse and halal status'), o('kesehatan', 'Pakan dan kesehatan ternak', 'Feed and animal health'), o('obat', 'Penggunaan obat atau hormon', 'Use of medicine or hormones'), o('tidak_perlu', 'Tidak perlu', 'Not needed', { exclusive: true, fixed: true })] },
    { id: 'K9', ch: 'b1', type: 'sk', q: T('Seberapa yakin Anda dengan kualitas daging yang Anda beli selama ini?', 'How confident are you in the quality of the meat you have been buying?'),
      scale: SCALE5(T('Tidak yakin', 'Not confident'), T('Sangat yakin', 'Very confident')) },
    { id: 'K10', ch: 'b1', type: 'rc', q: T('Pernahkah Anda membayar lebih mahal untuk produk berlabel — halal resmi, organik, atau premium?', 'Have you ever paid more for a labelled product — official halal, organic, or premium?'),
      opts: [o('rutin', 'Ya, rutin', 'Yes, regularly'), o('kadang', 'Kadang-kadang', 'Sometimes'), o('tidak', 'Tidak pernah', 'Never')] },
    { id: 'K11', ch: 'b1', type: 'tx', q: T('Ceritakan pengalaman yang membuat Anda ragu, kalau ada.', 'Tell us about an experience that made you doubtful, if any.') },

    { id: 'K12', ch: 'b2', type: 'rc', q: T('Dalam 2–3 tahun ke depan, apakah Anda akan lebih selektif memilih daging?', 'In the next 2–3 years, will you become more selective about meat?'),
      opts: [o('lebih', 'Ya, lebih selektif', 'Yes, more selective'), o('sama', 'Sama saja', 'About the same'), o('kurang', 'Kurang selektif, yang penting murah', 'Less selective, price matters most')] },
    { id: 'K13', ch: 'b2', type: 'tx', q: T('Apa yang Anda harapkan dari penjual daging di masa depan?', 'What do you hope for from meat sellers in the future?') },

    { id: 'C1', ch: 'b3', type: 'rc', q: T('Seberapa jelas penjelasan tadi bagi Anda?', 'How clear was that explanation for you?'),
      opts: [o('jelas', 'Jelas', 'Clear'), o('cukup', 'Cukup jelas', 'Fairly clear'), o('kurang', 'Kurang jelas', 'Not clear')] },

    { id: 'K14', ch: 'b4', type: 'sk', q: T('Seberapa mungkin Anda memindai QR pada daging sebelum membeli?', 'How likely are you to scan a QR on meat before buying?'),
      scale: SCALE5(T('Tidak mungkin', 'Not likely'), T('Pasti', 'Definitely')) },
    { id: 'K15', ch: 'b4', type: 'cb', max: 3, shuffle: true, q: T('Tiga informasi terpenting di halaman QR bagi Anda', 'The three most important things on the QR page for you'),
      opts: [o('asal', 'Asal kandang', 'Origin barn'), o('tanggal_potong', 'Tanggal potong', 'Slaughter date'), o('rph_halal', 'RPH dan halal', 'Slaughterhouse and halal'), o('kesehatan', 'Riwayat kesehatan', 'Health history'), o('penjual_resmi', 'Daftar penjual resmi', 'Official sellers'), o('masa_jual', 'Batas masa jual', 'Sell-by date'), o('ulasan', 'Ulasan pembeli lain', 'Other buyers’ reviews')] },
    { id: 'K16', ch: 'b4', type: 'rc', dyn: 'priceHelp', q: T('Berapa tambahan harga yang masih wajar untuk daging terverifikasi?', 'How much extra would still be fair for verified meat?'),
      opts: [o('0', 'Tidak mau membayar lebih', 'Wouldn’t pay more'), o('le3', 'Sampai 3%', 'Up to 3%'), o('3_5', '3–5%'), o('5_10', '5–10%'), o('10_15', '10–15%'), o('gt15', 'Lebih dari 15%', 'More than 15%')].map(fixEn) },
    { id: 'K17', ch: 'b4', type: 'rc', q: T('Jika daging berlabel 10% lebih mahal, tetapi penjual langganan Anda tidak punya label, apa yang akan Anda lakukan?', 'If labelled meat cost 10% more but your regular seller had no label, what would you do?'),
      opts: [o('tetap_langganan', 'Tetap membeli di langganan', 'Keep buying from my regular seller'), o('pindah', 'Pindah ke penjual berlabel', 'Switch to the labelled seller'), o('tergantung', 'Tergantung kebutuhan saat itu', 'Depends on the occasion')] },
    { id: 'K18', ch: 'b4', type: 'rc', q: T('Apakah Anda akan membeli ulang dari penjual yang memakai label ini?', 'Would you buy again from a seller who uses this label?'),
      opts: [o('ya', 'Ya', 'Yes'), o('mungkin', 'Mungkin', 'Maybe'), o('tidak', 'Tidak', 'No')] },
    { id: 'K19', ch: 'b4', type: 'cb', max: 3, shuffle: true, q: T('Apa yang membuat Anda ragu?', 'What makes you hesitate?'),
      opts: [o('palsu', 'Labelnya bisa dipalsukan', 'Labels can be faked'), o('mahal', 'Harga lebih mahal', 'Higher price'), o('repot_scan', 'Repot memindai', 'Scanning is a hassle'), o('tidak_percaya', 'Tidak percaya datanya', 'I don’t trust the data'), o('tidak_ragu', 'Tidak ada keraguan', 'No hesitation', { exclusive: true, fixed: true })] },
    { id: 'K20', ch: 'b4', type: 'rc', q: T('Maukah Anda menulis ulasan setelah membeli?', 'Would you write a review after buying?'),
      opts: [o('ya', 'Ya', 'Yes'), o('mungkin', 'Mungkin', 'Maybe'), o('tidak', 'Tidak', 'No')] },
  ];

  /* ---------- Penutup ---------- */
  const OUTRO = {
    overline: T('SELESAI', 'DONE'),
    title: T('Terima kasih. Cerita Anda sangat berarti.', 'Thank you. Your story truly matters.'),
    body: T('Jawaban Anda membantu kami memastikan TernaQin dibangun untuk masalah yang benar-benar terjadi — bukan yang hanya kami bayangkan.', 'Your answers help us make sure TernaQin is built for problems that really exist — not just the ones we imagine.'),
    contactQ: T('Bersediakah Anda dihubungi lagi untuk uji coba atau wawancara lanjutan?', 'May we contact you again for a trial or a follow-up interview?'),
    contactYes: T('Ya, boleh', 'Yes, you may'),
    contactNo: T('Tidak, terima kasih', 'No, thank you'),
    nameLabel: T('Nama panggilan', 'What should we call you?'),
    waLabel: T('Nomor WhatsApp', 'WhatsApp number'),
    waHelp: T('Hanya dipakai untuk menghubungi Anda terkait riset ini. Disimpan terpisah dari jawaban.', 'Only used to contact you about this research. Stored separately from your answers.'),
    sentTitle: T('Jawaban terkirim', 'Answers sent'),
    another: T('Isi sebagai peran lain', 'Answer for another role'),
    share: T('Bagikan ke kenalan', 'Share with a friend'),
    shareText: T('Bantu riset TernaQin tentang perjalanan daging dari kandang ke piring. Sekitar 10 menit:', 'Help TernaQin’s research on the journey of meat from barn to plate. About 10 minutes:'),
    deleteTitle: T('Ingin jawaban Anda dihapus?', 'Want your answers deleted?'),
    deleteBody: T('Kirim kode jawaban di atas ke kontak berikut, dan kami akan menghapusnya.', 'Send the response code above to the contact below and we will delete it.'),
    copied: T('Tautan disalin', 'Link copied'),
  };

  const CONTACT = { email: 'ternaqinindonesia@gmail.com', phone: '+62 851-1730-0763', wa: '6285117300763' };

  function has(x) { return Array.isArray(x) ? x.length > 0 : x != null && x !== ''; }
  function inc(x, v) { return Array.isArray(x) && x.includes(v); }

  window.TQ_CONTENT = {
    UI, INTRO, ROLE, HERO, CHAPTERS, B1_INTRO, JOURNEY, JOURNEY_NOTE, YOUR_PART, OUTRO, CONTACT,
    COMMON, SEGMENTS: { peternak: PETERNAK, rph: RPH, pedagang: PEDAGANG, konsumen: KONSUMEN },
    VERSION: 'v1.0',
  };
})();
