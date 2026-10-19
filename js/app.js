/* TernaQin — Riset Lapangan · mesin cerita & kuesioner */
(function () {
  'use strict';
  const C = window.TQ_CONTENT;
  const CFG = window.TQ_CONFIG || {};
  const KEY = 'tq_riset_state_v1';
  const QKEY = 'tq_riset_queue_v1';
  const CHS = ['profile', 'b1', 'b2', 'b3', 'b4'];
  const T = (id, en) => ({ id, en });

  const X = {
    almost: T('HAMPIR SELESAI', 'ALMOST DONE'),
    contactTitle: T('Satu hal terakhir', 'One last thing'),
    newResp: T('Responden berikutnya', 'Next respondent'),
    startOver: T('Mulai baru', 'Start new'),
    copy: T('Salin', 'Copy'),
    copiedId: T('Kode disalin', 'Code copied'),
    waInvalid: T('Nomor WhatsApp belum valid. Contoh: 0812 3456 7890', 'WhatsApp number is not valid. Example: 0812 3456 7890'),
    mxIncomplete: T('Mohon nilai semua baris — {n} baris belum diisi.', 'Please rate every row — {n} left.'),
    fillText: T('Mohon isi kolom ini.', 'Please fill in this field.'),
    consentReq: T('Centang persetujuan untuk melanjutkan.', 'Tick the agreement to continue.'),
    roleReq: T('Pilih salah satu peran.', 'Choose one role.'),
    priceHelp: T('Sebagai gambaran, dengan harga Rp{p}/kg: tambahan 3% ≈ Rp{a}, 5% ≈ Rp{b}, 10% ≈ Rp{c}, 15% ≈ Rp{d} per kg.',
      'For reference, at Rp{p}/kg: 3% extra ≈ Rp{a}, 5% ≈ Rp{b}, 10% ≈ Rp{c}, 15% ≈ Rp{d} per kg.'),
    sample: T('Contoh tampilan', 'Sample screen'),
    verified: T('Terverifikasi', 'Verified'),
    product: T('Daging sapi · Batch', 'Beef · Batch'),
    rows: [
      [T('Ternak', 'Animal'), 'TQ-0217 · Si Belang'],
      [T('Asal kandang', 'Origin barn'), T('Kandang Sumber Rejeki, Boyolali', 'Sumber Rejeki barn, Boyolali')],
      [T('Tanggal potong', 'Slaughtered'), T('14 Okt 2026', '14 Oct 2026')],
      [T('RPH', 'Slaughterhouse'), T('RPH Contoh · Halal', 'Sample RPH · Halal')],
      [T('Penjual resmi', 'Official sellers'), T('3 lapak', '3 stalls')],
      [T('Masa jual', 'Sell by'), T('s.d. 16 Okt', 'until 16 Oct')],
    ],
    review: T('Beri ulasan', 'Review'),
    report: T('Laporkan', 'Report'),
    sentOk: T('Jawaban Anda sudah kami terima.', 'We have received your answers.'),
    meetHero: T('Kenalkan, Si Belang — ia akan menemani cerita ini.', 'Meet Si Belang — your companion through this story.'),
    flowTitle: T('Yang akan Anda lalui', 'What to expect'),
    about: T('TernaQin adalah tim rintisan Indonesia yang sedang merancang sistem pencatatan ternak dan ketelusuran daging. Riset ini tidak menjual apa pun.',
      'TernaQin is an Indonesian startup team designing a livestock record and meat traceability system. This research sells nothing.'),
    qOf: T('Pertanyaan {i} dari {n}', 'Question {i} of {n}'),
    left: T('± {m} menit lagi', '± {m} min left'),
    chMeta: T('{n} pertanyaan · ± {m} menit', '{n} questions · ± {m} min'),
    chOf: T('Bab {i} dari 4', 'Chapter {i} of 4'),
    picked: T('{k} dipilih', '{k} selected'),
    pickedMax: T('{k} dari maks. {n} dipilih', '{k} of max {n} selected'),
    reviewOver: T('PERIKSA JAWABAN', 'REVIEW ANSWERS'),
    reviewTitle: T('Sebelum dikirim, periksa sekali lagi', 'Check once more before sending'),
    reviewBody: T('Ketuk "Ubah" untuk memperbaiki jawaban. Setelah itu Anda akan kembali ke halaman ini.', 'Tap "Edit" to change an answer. You will come back to this page afterwards.'),
    edit: T('Ubah', 'Edit'),
    skipped: T('Dilewati', 'Skipped'),
    missing: T('Belum dijawab', 'Not answered'),
    missingErr: T('Masih ada {n} pertanyaan wajib yang belum dijawab.', '{n} required questions are still unanswered.'),
    answered: T('{a}/{n} dijawab', '{a}/{n} answered'),
    railTitle: T('Perjalanan Anda', 'Your journey'),
    railReview: T('Periksa & kirim', 'Review & send'),
    railStart: T('Persetujuan & peran', 'Consent & role'),
    backToReview: T('Simpan & kembali', 'Save & go back'),
    roleQs: T('{n} pertanyaan', '{n} questions'),
  };
  const FLOW = {
    profile: { icon: 'ph-identification-card', t: T('Profil singkat', 'Quick profile'), d: T('Usaha atau kebiasaan dan lokasi Anda', 'Your business or habits and location') },
    b1: { icon: 'ph-sun-horizon', t: T('Hari ini', 'Today'), d: T('Cara kerja dan masalah yang Anda hadapi sekarang', 'How things work and the problems you face now') },
    b2: { icon: 'ph-compass', t: T('Ke depan', 'Looking ahead'), d: T('Rencana, harapan, dan kekhawatiran', 'Plans, hopes, and worries') },
    b3: { icon: 'ph-qr-code', t: T('Bagaimana jika', 'What if'), d: T('Gambaran cara kerja TernaQin lewat cerita Si Belang', 'How TernaQin would work, told through Si Belang') },
    b4: { icon: 'ph-scales', t: T('Menurut Anda', 'Your view'), d: T('Penilaian, keraguan, dan kesediaan Anda — bagian terpenting', 'Your judgement, doubts, and willingness — the most important part') },
  };

  const MARK = '<svg viewBox="10 14 130 120" aria-hidden="true"><path fill="currentColor" d="M54.4222 21.2592C58.3187 20.7777 57.6397 24.6245 57.6993 27.1822C57.8213 32.4185 59.7989 38.2318 64.9606 40.469C65.7393 40.8109 66.5656 41.0318 67.4111 41.124C69.7461 41.3807 73.022 41.1333 75.4581 41.1818C77.7054 41.0478 80.3931 41.4185 82.6078 41.1607C89.2458 40.3883 92.3429 33.6374 92.5459 27.6319C92.606 25.8541 92.4048 24.0568 92.9782 22.4605C93.5071 20.9879 95.2338 21.0228 96.3901 21.6333C99.9551 23.6071 102.842 27.4072 104.15 31.214C106.935 39.3209 104.064 46.0571 100.594 53.3157C112.652 47.3262 117.381 55.4095 127.89 59.3387C130.042 60.1435 132.553 59.6535 134.261 60.7171C135.663 61.5897 134.81 63.8678 133.834 64.9288C128.921 70.2661 122.968 75.4844 115.715 77.1288C112.893 77.7651 109.786 77.934 106.89 78.1767C105.45 82.8418 103.55 87.6263 102.054 92.3977C101.567 93.9677 101.093 95.5416 100.631 97.1191C95.9378 92.7478 88.6441 90.2028 82.3705 89.3078C73.4275 88.0321 63.3815 89.0681 55.292 93.2613C53.1229 94.3857 51.477 95.622 49.544 97.0576C48.0352 91.2002 45.5297 84.1718 43.4064 78.4073C39.2766 77.8747 35.2726 77.9951 31.2239 76.3969C26.1249 74.358 21.7264 70.8281 17.8923 66.9487C16.8372 65.881 14.4027 63.6918 15.0598 61.9706C15.9431 59.6563 17.9505 60.4619 19.6994 60.1359C25.3099 59.09 29.9602 55.2918 34.9515 52.7976C36.5058 52.0192 38.3965 51.6493 40.1178 51.4617C43.7366 51.0672 46.685 52.3495 50.0035 53.6094C46.1164 47.3563 43.6711 39.0678 45.9242 31.8366C47.3099 27.3894 50.2956 23.4729 54.4222 21.2592Z"/><path fill="currentColor" d="M72.4299 93.8108C81.167 93.3797 90.3245 95.0036 97.2703 100.673C103.461 105.726 104.639 113.916 99.1588 119.982C93.9582 125.74 85.702 128.148 78.1865 128.665C69.4953 129.274 59.7475 127.438 52.904 121.74C46.8218 116.676 45.6602 108.575 51.0869 102.533C56.3931 96.6251 64.7353 94.3239 72.4299 93.8108ZM59.3774 113.659C60.9962 113.693 64.448 113.819 66.0092 113.609C67.3367 112.652 68.254 111.415 67.1158 109.875C66.0744 108.465 63.8396 108.729 62.2917 108.768C61.366 108.791 60.3825 108.808 59.47 108.872C57.0054 109.898 57.1975 112.231 59.3266 113.626L59.3774 113.659ZM90.743 113.666C93.1273 112.35 93.2306 110.378 90.9488 108.878C88.7862 108.73 86.7015 108.775 84.5372 108.859C83.8894 109.115 83.2037 109.44 82.9737 110.123C81.5978 114.206 86.1694 113.783 88.7325 113.728C89.4504 113.713 90.0936 113.746 90.743 113.666Z"/></svg>';

  /* ---------- util ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const params = new URLSearchParams(location.search);
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage tidak tersedia */ } },
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const L = (t) => (t == null ? '' : typeof t === 'string' ? t : (t[S.lang] || t.id || ''));
  const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => (o[k] != null ? o[k] : ''));
  const rp = (n) => Math.round(n).toLocaleString('id-ID');
  const has = (x) => (Array.isArray(x) ? x.length > 0 : x != null && String(x).trim() !== '');

  /* perkiraan detik per pertanyaan (untuk estimasi waktu) */
  const SECS = { tx: 60, mx: 45, cb: 20, select: 12, text: 15, rc: 14, sk: 10 };
  const secOf = (q) => SECS[q.type] || 14;
  const INTRO_SECS = 20, JOURNEY_SECS = 75;

  function makeRid() {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const a = new Uint8Array(6);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return 'TQ-' + Array.from(a, (b) => abc[b % abc.length]).join('');
  }
  function initialLang() {
    const p = params.get('lang');
    return p === 'en' || p === 'id' ? p : 'id';
  }
  function newState(keep) {
    keep = keep || {};
    return {
      v: C.VERSION, rid: makeRid(), related: keep.related || '',
      lang: keep.lang || initialLang(),
      mode: keep.mode || (params.get('mode') === 'wawancara' ? 'wawancara' : 'mandiri'),
      interviewer: keep.interviewer != null ? keep.interviewer : (params.get('pewawancara') || '').slice(0, 60),
      src: keep.src != null ? keep.src : (params.get('src') || params.get('utm_source') || '').slice(0, 40),
      started: null, consent: !!keep.consent, role: null, answers: keep.answers || {}, notes: {}, order: {},
      step: keep.step || 0, contact: { ok: null, name: '', wa: '' }, submitted: false, sendStatus: '', fromReview: false,
    };
  }

  let S = newState();
  let steps = [];
  function save() { store.set(KEY, S); }

  /* ---------- langkah ---------- */
  function questionsFor(role) { return C.COMMON.concat(C.SEGMENTS[role] || []); }
  function buildSteps() {
    const s = [{ k: 'intro' }, { k: 'consent' }, { k: 'role' }];
    if (S.role) {
      const qs = questionsFor(S.role);
      CHS.forEach((ch) => {
        s.push({ k: 'chapter', ch });
        qs.filter((q) => q.ch === ch).forEach((q) => s.push({ k: 'q', q, ch }));
      });
      s.push({ k: 'review' }, { k: 'contact' }, { k: 'done' });
    }
    steps = s;
  }
  const visible = (st) => !(st.k === 'q' && st.q.showIf && !st.q.showIf(S.answers));
  const cur = () => steps[S.step];
  const idxOf = (k) => steps.findIndex((x) => x.k === k);

  function go(dir) {
    buildSteps();
    let i = S.step + dir;
    while (i > 0 && i < steps.length - 1 && !visible(steps[i])) i += dir;
    S.step = Math.max(0, Math.min(steps.length - 1, i));
    save(); render(true);
  }
  function jump(i) { buildSteps(); S.step = Math.max(0, Math.min(steps.length - 1, i)); save(); render(true); }

  /* ---------- statistik bab & waktu ---------- */
  function chQs(ch) { return steps.filter((x) => x.k === 'q' && x.ch === ch && visible(x)); }
  function chMins(ch) {
    const s = chQs(ch).reduce((a, x) => a + secOf(x.q), INTRO_SECS + (ch === 'b3' ? JOURNEY_SECS : 0));
    return Math.max(1, Math.round(s / 60));
  }
  function roleMins(role) {
    const qs = questionsFor(role).filter((q) => !q.showIf);
    const s = qs.reduce((a, q) => a + secOf(q), CHS.length * INTRO_SECS + JOURNEY_SECS + 60);
    return Math.round(s / 60);
  }
  function remainingMins() {
    let s = 0;
    for (let i = S.step; i < steps.length; i++) {
      const x = steps[i];
      if (x.k === 'q' && visible(x)) s += secOf(x.q);
      else if (x.k === 'chapter') s += INTRO_SECS + (x.ch === 'b3' ? JOURNEY_SECS : 0);
      else if (x.k === 'review' || x.k === 'contact') s += 30;
    }
    return Math.max(1, Math.round(s / 60));
  }
  const answeredQ = (q) => {
    const a = S.answers[q.id];
    if (q.type === 'mx') return !!a && q.rows.every((r) => a[r.v]);
    return has(a);
  };
  const required = (q) => !(q.optional || q.type === 'tx');

  /* ---------- urutan opsi (acak per responden, opsi "fixed" tetap di bawah) ---------- */
  function orderedOpts(q) {
    if (!q.shuffle) return q.opts;
    const free = q.opts.filter((x) => !x.fixed);
    const fixed = q.opts.filter((x) => x.fixed);
    let ord = S.order[q.id];
    if (!ord || ord.length !== free.length) {
      ord = free.map((x) => x.v);
      for (let i = ord.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ord[i], ord[j]] = [ord[j], ord[i]]; }
      S.order[q.id] = ord; save();
    }
    return ord.map((v) => free.find((x) => x.v === v)).filter(Boolean).concat(fixed);
  }

  /* ---------- progres (atas) ---------- */
  function renderProgress() {
    const el = $('#progress');
    const st = cur();
    if (!st || !(st.k === 'chapter' || st.k === 'q')) { el.classList.remove('show'); el.innerHTML = ''; return; }
    const ch = st.ch;
    const fills = CHS.map((c) => {
      if (CHS.indexOf(c) < CHS.indexOf(ch)) return 1;
      if (c !== ch) return 0;
      const idx = steps.map((x, i) => ({ x, i })).filter((o) => (o.x.k === 'q' || o.x.k === 'chapter') && o.x.ch === c && visible(o.x));
      return idx.length ? idx.filter((o) => o.i < S.step).length / idx.length : 0;
    });
    const qs = chQs(ch);
    const pos = st.k === 'q' ? qs.indexOf(st) + 1 : 0;
    const chTitle = ch === 'profile' ? L(C.UI.profile) : L(C.UI.chapter) + ' ' + CHS.indexOf(ch) + ' · ' + L(C.CHAPTERS[ch].title);
    el.innerHTML = '<div class="progress-meta"><b>' + esc(chTitle) + (pos ? ' <span class="pm-sep">—</span> <span class="pm-q">' + esc(fmt(L(X.qOf), { i: pos, n: qs.length })) + '</span>' : '') + '</b>' +
      '<span class="pm-left"><i class="ph ph-timer"></i>' + esc(fmt(L(X.left), { m: remainingMins() })) + '</span></div>' +
      '<div class="progress-steps" aria-hidden="true">' + fills.map((f) => '<span><i style="width:' + Math.round(f * 100) + '%"></i></span>').join('') + '</div>';
    el.classList.add('show');
  }

  /* ---------- rail bab (desktop) ---------- */
  function renderRail() {
    const rail = $('#rail');
    if (!rail) return;
    const st = cur();
    if (!S.role || !st || ['intro', 'consent', 'done'].includes(st.k)) { rail.hidden = true; document.body.classList.remove('has-rail'); return; }
    rail.hidden = false; document.body.classList.add('has-rail');
    const curCh = st.ch || (st.k === 'review' || st.k === 'contact' ? 'review' : 'start');
    const order = ['start'].concat(CHS, ['review']);
    const ci = order.indexOf(curCh);
    const item = (key, icon, title, sub, i) => {
      const state = i < ci ? 'done' : i === ci ? 'now' : 'next';
      return '<li class="rail-item ' + state + '"' + (state === 'now' ? ' aria-current="step"' : '') + '><span class="rail-dot">' +
        (state === 'done' ? '<i class="ph ph-check"></i>' : '<i class="ph ' + icon + '"></i>') + '</span><span><b>' + esc(title) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span></li>';
    };
    let html = '<p class="overline">' + esc(L(X.railTitle)) + '</p><ol class="rail-list">';
    html += item('start', 'ph-hand', L(X.railStart), L(C.ROLE.options.find((r) => r.v === S.role).t), 0);
    CHS.forEach((ch, i) => {
      const qs = chQs(ch);
      const a = qs.filter((x) => answeredQ(x.q)).length;
      html += item(ch, FLOW[ch].icon, (ch === 'profile' ? '' : L(C.UI.chapter) + ' ' + i + ' · ') + L(FLOW[ch].t), fmt(L(X.answered), { a, n: qs.length }), i + 1);
    });
    html += item('review', 'ph-list-checks', L(X.railReview), '', 6) + '</ol>';
    rail.innerHTML = html;
  }

  /* ---------- tombol bawah ---------- */
  function setActions(html) {
    const a = $('#actions');
    if (!html) { a.hidden = true; $('#actionsInner').innerHTML = ''; return; }
    a.hidden = false; $('#actionsInner').innerHTML = html;
  }
  const backBtn = () => '<button type="button" class="btn btn-secondary" data-act="back" aria-label="' + esc(L(C.UI.back)) + '" title="' + esc(L(C.UI.back)) + '"><i class="ph ph-arrow-left"></i></button>';
  const nextBtn = (label, icon) => '<button type="button" class="btn btn-primary" data-act="next">' + esc(label || L(C.UI.next)) + ' <i class="ph ' + (icon || 'ph-arrow-right') + '"></i></button>';

  /* ---------- render utama ---------- */
  function render(scroll) {
    buildSteps();
    if (S.step >= steps.length) S.step = steps.length - 1;
    document.documentElement.lang = S.lang;
    $('#brandTag').textContent = L(C.UI.brandTag);
    $$('.seg [data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === S.lang)));
    const iv = $('#ivbar');
    if (S.mode === 'wawancara') { iv.hidden = false; iv.innerHTML = '<i class="ph ph-microphone"></i> ' + esc(L(C.UI.interviewerBadge) + (S.interviewer ? ' · ' + S.interviewer : '')); } else iv.hidden = true;

    const st = cur();
    let html = '';
    if (st.k === 'intro') html = vIntro();
    else if (st.k === 'consent') html = vConsent();
    else if (st.k === 'role') html = vRole();
    else if (st.k === 'chapter') html = vChapter(st.ch);
    else if (st.k === 'q') html = vQuestion(st.q);
    else if (st.k === 'review') html = vReview();
    else if (st.k === 'contact') html = vContact();
    else if (st.k === 'done') html = vDone();
    $('#app').innerHTML = '<div class="screen">' + html + '</div><div class="footer">© TernaQin · <a href="mailto:' + C.CONTACT.email + '">' + C.CONTACT.email + '</a> · <a href="https://wa.me/' + C.CONTACT.wa + '" target="_blank" rel="noopener">' + C.CONTACT.phone + '</a></div>';
    renderProgress();
    renderRail();
    if (st.k === 'q') refreshQ(st.q);
    if (window.TQ_THEME) window.TQ_THEME.sync();
    if (scroll) {
      window.scrollTo(0, 0);
      const h = $('#app h1, #app h2');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }
  }

  /* ---------- layar: pembuka ---------- */
  function vIntro() {
    const I = C.INTRO;
    const all = C.ROLE.options.map((r) => roleMins(r.v));
    const mins = Math.min.apply(null, all) + '–' + Math.max.apply(null, all);
    const nodes = ['<span class="jn jn-cow">' + MARK + '</span>', '<span class="jn"><i class="ph ph-buildings"></i></span>', '<span class="jn"><i class="ph ph-storefront"></i></span>', '<span class="jn"><i class="ph ph-fork-knife"></i></span>'];
    setActions(nextBtn(L(C.UI.start)));
    const flow = CHS.map((ch, i) => '<li><span class="flow-ic"><i class="ph ' + FLOW[ch].icon + '"></i></span><span><b>' + esc((i ? L(C.UI.chapter) + ' ' + i + ' · ' : '') + L(FLOW[ch].t)) + '</b><small>' + esc(L(FLOW[ch].d)) + '</small></span></li>').join('') +
      '<li><span class="flow-ic"><i class="ph ph-list-checks"></i></span><span><b>' + esc(L(X.railReview)) + '</b><small>' + esc(S.lang === 'id' ? 'Lihat ringkasan jawaban, ubah bila perlu, lalu kirim' : 'See a summary, edit if needed, then send') + '</small></span></li>';
    return '<section class="hero">' +
      '<div class="hero-journey" aria-hidden="true">' + nodes.join('<span class="jl"></span>') + '</div>' +
      '<p class="overline">' + esc(L(I.overline)) + '</p>' +
      '<h1 class="h-display">' + esc(L(I.title)) + '<em>' + esc(L(I.title2)) + '</em></h1>' +
      '<p>' + esc(L(I.body)) + '</p>' +
      '<div class="hero-meta"><span class="chip-dark"><i class="ph ph-clock"></i>' + esc(fmt(S.lang === 'id' ? 'Sekitar {m} menit' : 'About {m} minutes', { m: mins })) + '</span>' +
      '<span class="chip-dark"><i class="ph ph-lock-key"></i>' + esc(S.lang === 'id' ? 'Tanpa login' : 'No login') + '</span>' +
      '<span class="chip-dark"><i class="ph ph-arrows-clockwise"></i>' + esc(S.lang === 'id' ? 'Bisa dilanjutkan' : 'Resume anytime') + '</span></div>' +
      '<div class="hero-hero"><span class="eartag"><i class="ph ph-tag"></i>' + C.HERO.tag + '</span><span>' + esc(L(X.meetHero)) + '</span></div>' +
      '</section>' +
      '<section class="card flow-card"><h2 class="h-sub">' + esc(L(X.flowTitle)) + '</h2><ol class="flow">' + flow + '</ol>' +
      '<p class="about"><i class="ph ph-info"></i><span>' + esc(L(X.about)) + '</span></p></section>';
  }

  /* ---------- layar: persetujuan ---------- */
  function vConsent() {
    const I = C.INTRO;
    setActions(backBtn() + nextBtn());
    return '<p class="overline">' + esc(L(I.consentOverline)) + '</p><h1 class="h-title">' + esc(L(I.consentTitle)) + '</h1>' +
      '<ul class="consent-list">' + I.consentPoints.map((p, i) => '<li><i class="ph ' + ['ph-chart-bar', 'ph-user-circle-dashed', 'ph-map-pin', 'ph-hand'][i] + '"></i><span>' + esc(L(p)) + '</span></li>').join('') + '</ul>' +
      '<div class="options" style="margin-top:12px"><label class="opt check' + (S.consent ? ' on' : '') + '" data-consent><input type="checkbox" ' + (S.consent ? 'checked' : '') + '><span class="mark"></span><span class="opt-label"><b>' + esc(L(I.consentCheck)) + '</b></span></label></div>' +
      '<div class="q-error" id="err" role="alert"></div>';
  }

  /* ---------- layar: peran ---------- */
  function vRole() {
    const R = C.ROLE;
    setActions(backBtn() + nextBtn());
    return '<p class="overline">' + esc(L(R.overline)) + '</p><h1 class="h-title">' + esc(L(R.title)) + '</h1>' +
      '<p class="lead" style="font-size:15px">' + esc(L(R.note)) + '</p>' +
      '<div class="role-grid" role="radiogroup" style="margin-top:20px">' + R.options.map((r) => {
        const n = questionsFor(r.v).filter((q) => !q.showIf).length;
        return '<button type="button" role="radio" aria-checked="' + (S.role === r.v) + '" class="role' + (S.role === r.v ? ' on' : '') + '" data-role="' + r.v + '">' +
          '<span class="role-icon"><i class="ph ' + r.icon + '"></i></span><span class="role-text"><b>' + esc(L(r.t)) + '</b><span>' + esc(L(r.d)) + '</span>' +
          '<span class="mins"><i class="ph ph-timer"></i> ± ' + roleMins(r.v) + ' ' + esc(L(C.UI.minutes)) + ' · ' + esc(fmt(L(X.roleQs), { n })) + '</span></span>' +
          '<span class="role-check" aria-hidden="true"><i class="ph-fill ph-check-circle"></i></span></button>';
      }).join('') + '</div>' +
      '<div class="q-error" id="err" role="alert"></div>';
  }

  /* ---------- layar: pembuka bab ---------- */
  const ART = { profile: ['ph-identification-card', 'ph-map-pin'], b1: ['ph-sun-horizon', 'ph-notebook'], b2: ['ph-trend-up', 'ph-compass'], b4: ['ph-chat-circle-text', 'ph-scales'] };
  function art(ch) {
    const ic = ART[ch] || [];
    return '<div class="art" aria-hidden="true"><span class="art-cow">' + MARK + '</span><span class="eartag art-tag">' + C.HERO.tag + '</span>' +
      ic.map((i, n) => '<span class="art-ic art-ic' + n + '"><i class="ph ' + i + '"></i></span>').join('') + '</div>';
  }
  function chMetaRow(ch) {
    const i = CHS.indexOf(ch);
    return '<div class="chips">' + (i ? '<span class="chip"><i class="ph ph-book-open"></i>' + esc(fmt(L(X.chOf), { i })) + '</span>' : '') +
      '<span class="chip"><i class="ph ph-timer"></i>' + esc(fmt(L(X.chMeta), { n: chQs(ch).length, m: chMins(ch) })) + '</span>' +
      (ch === 'b4' ? '<span class="chip chip-accent"><i class="ph ph-star"></i>' + esc(S.lang === 'id' ? 'Bagian terpenting' : 'Most important part') + '</span>' : '') + '</div>';
  }
  function vChapter(ch) {
    const c = C.CHAPTERS[ch];
    setActions(backBtn() + nextBtn());
    if (ch === 'b3') return vJourney(c);
    const body = ch === 'b1' ? C.B1_INTRO[S.role] : c.body;
    return art(ch) + '<p class="overline">' + esc(L(c.overline)) + '</p><h1 class="h-title">' + esc(L(c.title)) + '</h1>' + chMetaRow(ch) +
      '<p class="story">' + esc(L(body)) + '</p>' + ivBox(ch);
  }
  function vJourney(c) {
    const stops = C.JOURNEY.map((s) => {
      const mine = s.roles.includes(S.role);
      return '<div class="stop' + (mine ? ' mine' : '') + '"><span class="stop-dot"><i class="ph ' + s.icon + '"></i></span><div class="stop-card">' +
        '<h3>' + esc(L(s.title)) + (mine ? ' <span class="badge badge-primary"><i class="ph-fill ph-star"></i>' + esc(L(C.YOUR_PART)) + '</span>' : '') + '</h3>' +
        '<p>' + esc(L(s.body)) + '</p>' + (s.key === 'konsumen' ? phone() : '') + '</div></div>';
    }).join('');
    return '<p class="overline">' + esc(L(c.overline)) + '</p><h1 class="h-title">' + esc(L(c.title)) + '</h1>' + chMetaRow('b3') +
      '<p class="story">' + esc(L(c.body)) + '</p>' +
      '<div class="journey" style="margin-top:20px">' + stops + '</div>' +
      '<div class="note"><i class="ph ph-info"></i><span>' + esc(L(C.JOURNEY_NOTE)) + '</span></div>' + ivBox('b3');
  }
  function phone() {
    return '<div class="phone" role="img" aria-label="' + esc(L(X.sample)) + '"><div class="phone-screen"><div class="phone-top">' +
      '<span class="ok"><i class="ph-fill ph-seal-check"></i>' + esc(L(X.verified)) + '</span>' +
      '<b>' + esc(L(X.product)) + ' <span>B-0412</span></b><span>' + esc(L(X.sample)) + '</span></div><div class="phone-rows">' +
      X.rows.map((r) => '<div class="phone-row"><span>' + esc(L(r[0])) + '</span><b>' + esc(L(r[1])) + '</b></div>').join('') +
      '</div><div class="phone-cta"><div>' + esc(L(X.review)) + '</div><div>' + esc(L(X.report)) + '</div></div></div></div>';
  }

  /* ---------- catatan pewawancara ---------- */
  function ivBox(ch) {
    if (S.mode !== 'wawancara') return '';
    return '<div class="iv-box"><label for="iv-' + ch + '"><i class="ph ph-microphone"></i>' + esc(L(C.UI.interviewerNote)) + '</label>' +
      '<textarea class="textarea" id="iv-' + ch + '" data-note="' + ch + '" maxlength="2000" placeholder="' + esc(L(C.UI.interviewerNotePh)) + '">' + esc(S.notes[ch] || '') + '</textarea></div>';
  }

  /* ---------- layar: pertanyaan ---------- */
  function vQuestion(q) {
    const a = S.answers[q.id];
    const optional = !required(q);
    const qs = chQs(q.ch);
    const pos = qs.findIndex((x) => x.q === q) + 1;
    let help = q.help ? L(q.help) : '';
    if (q.type === 'cb') help = (help ? help + ' ' : '') + (q.max ? fmt(L(C.UI.pickMax), { n: q.max }) : L(C.UI.pickAny));
    let body = '';
    if (q.type === 'rc' || q.type === 'cb') {
      const opts = orderedOpts(q);
      const radio = q.type === 'rc';
      body = '<div class="options" role="' + (radio ? 'radiogroup' : 'group') + '" aria-labelledby="qt">' + opts.map((x, i) => {
        const sep = (x.exclusive || (x.fixed && radio)) && i > 0 ? '<div class="opt-sep" aria-hidden="true"></div>' : '';
        return sep + '<label class="opt ' + (radio ? 'radio' : 'check') + '" data-v="' + esc(x.v) + '"><input type="' + (radio ? 'radio' : 'checkbox') + '" name="' + q.id + '" value="' + esc(x.v) + '"><span class="mark"></span><span class="opt-label">' + esc(L(x.t)) + '</span></label>';
      }).join('') + '</div>';
    } else if (q.type === 'sk') {
      body = scale('', a) + '<div class="scale-anchors"><span>1 · ' + esc(L(q.scale.lo)) + '</span><span>5 · ' + esc(L(q.scale.hi)) + '</span></div>';
    } else if (q.type === 'mx') {
      body = '<div class="mx-legend"><span>1 · ' + esc(L(q.scale.lo)) + '</span><span>5 · ' + esc(L(q.scale.hi)) + '</span></div>' +
        q.rows.map((r, i) => '<div class="mx-row" data-row="' + r.v + '"><div class="mx-label"><span class="n">' + String.fromCharCode(65 + i) + '</span><span>' + esc(L(r.t)) + '</span><i class="ph-fill ph-check-circle mx-ok" aria-hidden="true"></i></div>' + scale(r.v, a && a[r.v]) + '</div>').join('');
    } else if (q.type === 'select') {
      body = '<div class="field"><select class="select" id="fld" aria-labelledby="qt"><option value="">— ' + esc(S.lang === 'id' ? 'Pilih' : 'Choose') + ' —</option>' +
        q.opts.map((x) => '<option value="' + esc(x.v) + '"' + (a === x.v ? ' selected' : '') + '>' + esc(L(x.t)) + '</option>').join('') + '</select></div>';
    } else if (q.type === 'text') {
      body = '<div class="field"><input class="input" id="fld" type="text" maxlength="80" autocomplete="address-level2" aria-labelledby="qt" placeholder="' + esc(L(q.ph)) + '" value="' + esc(a || '') + '"></div>';
    } else if (q.type === 'tx') {
      body = '<div class="field"><textarea class="textarea" id="fld" maxlength="1000" aria-labelledby="qt" placeholder="' + esc(L(C.UI.typeHere)) + '">' + esc(a || '') + '</textarea><div class="counter"><span id="cnt">' + (a || '').length + '</span>/1000</div></div>';
    }
    if (q.dyn === 'priceHelp') {
      const mid = { lt120: 110000, '120_140': 130000, '140_160': 150000, gt160: 170000 }[S.answers.K4] || 140000;
      body = '<div class="note note-info" style="margin:0 0 14px"><i class="ph ph-calculator"></i><span>' + esc(fmt(L(X.priceHelp), { p: rp(mid), a: rp(mid * 0.03), b: rp(mid * 0.05), c: rp(mid * 0.10), d: rp(mid * 0.15) })) + '</span></div>' + body;
    }
    const tts = 'speechSynthesis' in window ? '<button type="button" class="icon-btn" data-act="tts" aria-label="' + esc(L(C.UI.readAloud)) + '" title="' + esc(L(C.UI.readAloud)) + '"><i class="ph ph-speaker-high"></i></button>' : '';
    const nextLbl = S.fromReview ? L(X.backToReview) : optional && !has(a) ? L(C.UI.skip) : L(C.UI.next);
    setActions(backBtn() + nextBtn(nextLbl, S.fromReview ? 'ph-list-checks' : optional && !has(a) ? 'ph-arrow-bend-up-right' : 'ph-arrow-right'));
    return '<div class="q-head"><div class="q-code"><span class="chip chip-sm">' + esc(fmt(L(X.qOf), { i: pos, n: qs.length })) + '</span>' +
      (S.mode === 'wawancara' ? '<span class="mono">' + q.id + '</span>' : '') +
      (optional ? '<span class="badge">' + esc(L(C.UI.optional)) + '</span>' : '') + '<span style="flex:1"></span>' + tts + '</div>' +
      '<h1 class="h-q" id="qt">' + esc(L(q.q)) + '</h1>' + (help ? '<p class="q-help" id="qhelp">' + esc(help) + '</p>' : '') +
      (q.type === 'cb' ? '<p class="pick-count" id="pickc" aria-live="polite"></p>' : '') + '</div>' +
      body + '<div class="q-error" id="err" role="alert"></div>' + ivBox(q.ch);
  }
  function scale(row, val) {
    return '<div class="scale" role="radiogroup">' + [1, 2, 3, 4, 5].map((n) => '<button type="button" role="radio" data-scale="' + n + '" data-row="' + row + '" aria-pressed="' + (val === n) + '" aria-checked="' + (val === n) + '">' + n + '</button>').join('') + '</div>';
  }

  /* status visual opsi tanpa render ulang */
  function refreshQ(q) {
    const a = S.answers[q.id];
    if (q.type === 'rc' || q.type === 'cb') {
      const sel = q.type === 'rc' ? (a ? [a] : []) : (a || []);
      const full = !!(q.type === 'cb' && q.max && sel.length >= q.max);
      $$('.opt[data-v]').forEach((el) => {
        const on = sel.includes(el.dataset.v);
        el.classList.toggle('on', on);
        el.querySelector('input').checked = on;
        const dis = full && !on;
        el.classList.toggle('disabled', dis);
        el.querySelector('input').disabled = dis;
      });
      const pc = $('#pickc');
      if (pc) {
        pc.textContent = sel.length ? (q.max ? fmt(L(X.pickedMax), { k: sel.length, n: q.max }) : fmt(L(X.picked), { k: sel.length })) : '';
        pc.classList.toggle('full', full);
      }
    }
    if (q.type === 'mx') $$('.mx-row').forEach((r) => r.classList.toggle('done', !!(a && a[r.dataset.row])));
    const nb = $('#actionsInner [data-act="next"]');
    if (nb && !required(q) && !S.fromReview) nb.innerHTML = esc(has(a) ? L(C.UI.next) : L(C.UI.skip)) + ' <i class="ph ' + (has(a) ? 'ph-arrow-right' : 'ph-arrow-bend-up-right') + '"></i>';
  }

  function validate(q) {
    const a = S.answers[q.id];
    if (!required(q)) return '';
    if (q.type === 'mx') {
      const left = q.rows.filter((r) => !(a && a[r.v])).length;
      return left ? fmt(L(X.mxIncomplete), { n: left }) : '';
    }
    if (q.type === 'text') return has(a) ? '' : L(X.fillText);
    return has(a) ? '' : L(C.UI.required);
  }
  function showErr(msg) {
    const e = $('#err');
    if (e) { e.innerHTML = msg ? '<i class="ph ph-warning-circle"></i>' + esc(msg) : ''; if (msg) e.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  }

  /* ---------- layar: periksa jawaban ---------- */
  function answerText(q) {
    const a = S.answers[q.id];
    if (!has(a) && q.type !== 'mx') return '';
    const lab = (v) => { const x = (q.opts || []).find((o) => o.v === v); return x ? L(x.t) : v; };
    if (q.type === 'rc' || q.type === 'select') return lab(a);
    if (q.type === 'cb') return a.map(lab).join(', ');
    if (q.type === 'sk') return a + ' / 5';
    if (q.type === 'mx') return a ? q.rows.filter((r) => a[r.v]).map((r, i) => String.fromCharCode(65 + q.rows.indexOf(r)) + ': ' + a[r.v]).join(' · ') : '';
    const s = String(a).trim();
    return s.length > 140 ? s.slice(0, 140) + '…' : s;
  }
  function missingRequired() {
    return steps.map((x, i) => ({ x, i })).filter((o) => o.x.k === 'q' && visible(o.x) && required(o.x.q) && !answeredQ(o.x.q));
  }
  function vReview() {
    setActions(backBtn() + nextBtn());
    const blocks = CHS.map((ch) => {
      const qs = steps.map((x, i) => ({ x, i })).filter((o) => o.x.k === 'q' && o.x.ch === ch && visible(o.x));
      if (!qs.length) return '';
      const a = qs.filter((o) => answeredQ(o.x.q)).length;
      const title = (ch === 'profile' ? '' : L(C.UI.chapter) + ' ' + CHS.indexOf(ch) + ' · ') + L(FLOW[ch].t);
      const anyMiss = qs.some((o) => required(o.x.q) && !answeredQ(o.x.q));
      return '<details class="rv"' + (anyMiss ? ' open' : '') + '><summary><span class="rv-ic"><i class="ph ' + FLOW[ch].icon + '"></i></span><span class="rv-t"><b>' + esc(title) + '</b><small>' + esc(fmt(L(X.answered), { a, n: qs.length })) + '</small></span><i class="ph ph-caret-down rv-caret"></i></summary><ul>' +
        qs.map((o) => {
          const t = answerText(o.x.q);
          const miss = !t && required(o.x.q);
          return '<li class="' + (miss ? 'miss' : '') + '"><div><p class="rv-q">' + esc(L(o.x.q.q)) + '</p><p class="rv-a">' + (t ? esc(t) : '<em>' + esc(miss ? L(X.missing) : L(X.skipped)) + '</em>') + '</p></div>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-jump="' + o.i + '"><i class="ph ph-pencil-simple"></i>' + esc(L(X.edit)) + '</button></li>';
        }).join('') + '</ul></details>';
    }).join('');
    return '<p class="overline">' + esc(L(X.reviewOver)) + '</p><h1 class="h-title">' + esc(L(X.reviewTitle)) + '</h1><p class="lead" style="font-size:15px">' + esc(L(X.reviewBody)) + '</p>' +
      '<div class="rv-wrap">' + blocks + '</div><div class="q-error" id="err" role="alert"></div>';
  }

  /* ---------- layar: kontak ---------- */
  function vContact() {
    const O = C.OUTRO, k = S.contact;
    setActions(backBtn() + nextBtn(L(C.UI.submit), 'ph-paper-plane-tilt'));
    return '<p class="overline">' + esc(L(X.almost)) + '</p><h1 class="h-title">' + esc(L(X.contactTitle)) + '</h1>' +
      '<p class="lead" style="font-size:16px">' + esc(L(O.contactQ)) + '</p>' +
      '<div class="options" role="radiogroup" style="margin-top:16px">' +
      [['ya', O.contactYes], ['tidak', O.contactNo]].map((x) => '<label class="opt radio' + (k.ok === x[0] ? ' on' : '') + '" data-contact="' + x[0] + '"><input type="radio" name="kontak" ' + (k.ok === x[0] ? 'checked' : '') + '><span class="mark"></span><span class="opt-label">' + esc(L(x[1])) + '</span></label>').join('') + '</div>' +
      '<div id="cfields" class="stack" style="margin-top:16px"' + (k.ok === 'ya' ? '' : ' hidden') + '>' +
      '<div class="field"><label for="cname">' + esc(L(O.nameLabel)) + ' <span class="small">(' + esc(L(C.UI.optional)) + ')</span></label><input class="input" id="cname" maxlength="60" autocomplete="nickname" value="' + esc(k.name) + '"></div>' +
      '<div class="field"><label for="cwa">' + esc(L(O.waLabel)) + '</label><input class="input mono" id="cwa" type="tel" inputmode="tel" maxlength="20" autocomplete="tel" placeholder="0812 3456 7890" value="' + esc(k.wa) + '"><p class="helper">' + esc(L(O.waHelp)) + '</p></div></div>' +
      '<div class="hp" aria-hidden="true"><label>Website<input id="hpf" tabindex="-1" autocomplete="off"></label></div>' +
      '<div class="q-error" id="err" role="alert"></div>';
  }
  function normWa(s) {
    let d = String(s || '').replace(/[^\d+]/g, '');
    if (d.startsWith('+')) d = d.slice(1);
    if (d.startsWith('0')) d = '62' + d.slice(1);
    if (d.startsWith('8')) d = '62' + d;
    return /^62\d{8,13}$/.test(d) ? d : '';
  }

  /* ---------- layar: selesai ---------- */
  function vDone() {
    const O = C.OUTRO;
    const st = S.sendStatus;
    const status = st === 'ok' ? '<div class="status-line status-ok"><i class="ph-fill ph-check-circle"></i><span>' + esc(L(X.sentOk)) + '</span></div>'
      : st === 'test' ? '<div class="status-line status-warn"><i class="ph ph-flask"></i><span>' + esc(L(C.UI.testMode)) + '</span></div>'
      : st === 'sending' ? '<div class="status-line status-warn"><i class="ph ph-spinner-gap"></i><span>' + esc(L(C.UI.sending)) + '</span></div>'
      : '<div class="status-line status-warn"><i class="ph ph-wifi-slash"></i><span>' + esc(L(C.UI.sentFail)) + ' <button type="button" class="btn btn-ghost btn-sm" data-act="retry">' + esc(L(C.UI.retry)) + '</button></span></div>';
    const btns = [];
    if (S.mode === 'wawancara') btns.push('<button type="button" class="btn btn-primary btn-block" data-act="newresp"><i class="ph ph-user-plus"></i>' + esc(L(X.newResp)) + '</button>');
    btns.push('<button type="button" class="btn btn-secondary btn-block" data-act="another"><i class="ph ph-swap"></i>' + esc(L(O.another)) + '</button>');
    if (S.mode !== 'wawancara') btns.push('<button type="button" class="btn btn-secondary btn-block" data-act="share"><i class="ph ph-share-network"></i>' + esc(L(O.share)) + '</button>');
    setActions('');
    return '<div class="done-icon"><i class="ph-fill ph-heart"></i></div><p class="overline">' + esc(L(O.overline)) + '</p><h1 class="h-title">' + esc(L(O.title)) + '</h1>' +
      '<p class="lead">' + esc(L(O.body)) + '</p>' + status +
      '<div class="card" style="margin-top:16px"><div class="small">' + esc(L(C.UI.yourResponseId)) + '</div><div class="rid"><b>' + esc(S.rid) + '</b><button type="button" class="btn btn-ghost btn-sm" data-act="copyid"><i class="ph ph-copy"></i>' + esc(L(X.copy)) + '</button></div>' +
      '<h2 style="font-size:16px;font-weight:600;margin-top:18px">' + esc(L(O.deleteTitle)) + '</h2><p class="small" style="margin:4px 0 6px">' + esc(L(O.deleteBody)) + '</p>' +
      '<div class="contact-list"><a href="mailto:' + C.CONTACT.email + '?subject=' + encodeURIComponent('Hapus jawaban ' + S.rid) + '"><i class="ph ph-envelope-simple"></i>' + C.CONTACT.email + '</a>' +
      '<a href="https://wa.me/' + C.CONTACT.wa + '?text=' + encodeURIComponent('Halo TernaQin, mohon hapus jawaban riset saya dengan kode ' + S.rid) + '" target="_blank" rel="noopener"><i class="ph ph-whatsapp-logo"></i>' + C.CONTACT.phone + '</a></div></div>' +
      '<div class="stack" style="margin-top:16px">' + btns.join('') + '<button type="button" class="btn btn-ghost btn-block" data-act="restart">' + esc(L(X.startOver)) + '</button></div>';
  }

  /* ---------- pengiriman ---------- */
  function device() {
    const ua = navigator.userAgent || '';
    const type = /iPad|Tablet/i.test(ua) ? 'tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop';
    const os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iOS/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'lain';
    return type + ' · ' + os;
  }
  const labelOf = (q, v) => { const x = (q.opts || []).find((o) => o.v === v); return x ? x.t.id : v; };

  function buildPayload() {
    const now = new Date();
    const dur = Math.round((now - new Date(S.started || now)) / 1000);
    const fields = [
      ['id_respons', S.rid], ['id_terkait', S.related], ['waktu_mulai', S.started], ['waktu_kirim', now.toISOString()],
      ['durasi_detik', dur], ['flag_durasi', dur < roleMins(S.role) * 60 * 0.3 ? 'terlalu_cepat' : ''],
      ['bahasa', S.lang], ['mode', S.mode], ['pewawancara', S.interviewer], ['perangkat', device()], ['sumber', S.src], ['versi', C.VERSION],
      ['bersedia_dihubungi', S.contact.ok || ''],
    ];
    questionsFor(S.role).forEach((q) => {
      const vis = !q.showIf || q.showIf(S.answers);
      const a = vis ? S.answers[q.id] : undefined;
      if (q.type === 'mx') { q.rows.forEach((r) => fields.push([q.id + '_' + r.v, a && a[r.v] ? a[r.v] : ''])); return; }
      if (q.type === 'rc' || q.type === 'cb' || q.type === 'select') {
        const arr = a == null || a === '' ? [] : Array.isArray(a) ? a : [a];
        fields.push([q.id, arr.join('; ')]);
        fields.push([q.id + '_teks', arr.map((v) => labelOf(q, v)).join('; ')]);
        return;
      }
      fields.push([q.id, a == null ? '' : String(a).trim()]);
    });
    CHS.forEach((ch) => { if (S.mode === 'wawancara') fields.push(['catatan_' + ch, S.notes[ch] || '']); });
    const p = { token: CFG.TOKEN, hp: S.hp || '', role: S.role, rid: S.rid, fields };
    if (S.contact.ok === 'ya') p.contact = { id_respons: S.rid, peran: S.role, nama: S.contact.name.trim(), whatsapp: normWa(S.contact.wa), provinsi: S.answers.U1 || '', kab_kota: (S.answers.U2 || '').trim(), uji_coba: S.answers.P34 || S.answers.R26 || S.answers.D18 || '', waktu: now.toISOString() };
    return p;
  }

  async function sendOne(p) {
    const body = JSON.stringify(p);
    try {
      const r = await fetch(CFG.ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, redirect: 'follow' });
      const j = await r.json();
      if (!j.ok) throw new Error('server:' + (j.error || 'gagal'));
    } catch (e) {
      if (String(e.message).startsWith('server:') || !navigator.onLine) throw e;
      // Respons tidak terbaca (CORS) — kirim ulang tanpa membaca respons; server menolak duplikat id_respons.
      await fetch(CFG.ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body });
    }
  }
  let flushing = false;
  async function flush() {
    const q = store.get(QKEY) || [];
    if (!q.length) return 'ok';
    if (!CFG.ENDPOINT) return 'test';
    if (flushing) return 'sending';
    flushing = true;
    const rest = [];
    for (const p of q) { try { await sendOne(p); } catch (e) { rest.push(p); } }
    store.set(QKEY, rest);
    flushing = false;
    return rest.length ? 'queued' : 'ok';
  }
  async function submit() {
    const p = buildPayload();
    const q = (store.get(QKEY) || []).filter((x) => x.rid !== p.rid);
    q.push(p); store.set(QKEY, q);
    S.submitted = true; S.sendStatus = CFG.ENDPOINT ? 'sending' : 'test'; S.step = steps.length - 1; save(); render(true);
    const res = await flush();
    const mine = (store.get(QKEY) || []).some((x) => x.rid === p.rid);
    S.sendStatus = !CFG.ENDPOINT ? 'test' : mine || res === 'sending' ? 'queued' : 'ok';
    save(); if (cur().k === 'done') render(false);
  }

  /* ---------- aksi ---------- */
  function next() {
    const st = cur();
    if (st.k === 'intro' && !S.started) S.started = new Date().toISOString();
    if (st.k === 'consent' && !S.consent) return showErr(L(X.consentReq));
    if (st.k === 'role' && !S.role) return showErr(L(X.roleReq));
    if (st.k === 'q') {
      const m = validate(st.q); if (m) return showErr(m);
      if (S.fromReview) {
        buildSteps();
        // pertanyaan bersyarat yang baru muncul (mis. rentang harga) harus dijawab dulu
        const after = steps.findIndex((x, i) => i > S.step && x.k === 'q' && visible(x) && required(x.q) && !answeredQ(x.q) && x.q.showIf);
        if (after > -1 && after < idxOf('review')) return jump(after);
        S.fromReview = false; return jump(idxOf('review'));
      }
    }
    if (st.k === 'review') {
      const miss = missingRequired();
      if (miss.length) { showErr(fmt(L(X.missingErr), { n: miss.length })); return; }
    }
    if (st.k === 'contact') {
      if (!S.contact.ok) return showErr(L(C.UI.required));
      if (S.contact.ok === 'ya' && !normWa(S.contact.wa)) return showErr(L(X.waInvalid));
      S.hp = ($('#hpf') || {}).value || '';
      return submit();
    }
    go(1);
  }

  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }
  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); toast(msg); }
    catch (e) { const i = document.createElement('textarea'); i.value = text; document.body.appendChild(i); i.select(); try { document.execCommand('copy'); toast(msg); } catch (er) { /* abaikan */ } i.remove(); }
  }
  function speak() {
    const st = cur(); if (!st || st.k !== 'q') return;
    const q = st.q;
    let text = L(q.q);
    if (q.opts && q.type !== 'select') text += '. ' + orderedOpts(q).map((x) => L(x.t)).join('. ');
    if (q.rows) text += '. ' + q.rows.map((r) => L(r.t)).join('. ');
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = S.lang === 'id' ? 'id-ID' : 'en-US'; u.rate = 0.95; speechSynthesis.speak(u); } catch (e) { /* abaikan */ }
  }
  const keepCommon = () => { const a = {}; C.COMMON.forEach((q) => { if (S.answers[q.id] != null) a[q.id] = S.answers[q.id]; }); return a; };
  const fresh = (extra) => newState(Object.assign({ lang: S.lang, mode: S.mode, interviewer: S.interviewer, src: S.src }, extra || {}));

  document.addEventListener('click', (e) => {
    const lb = e.target.closest('[data-lang]');
    if (lb) { S.lang = lb.dataset.lang; save(); render(false); return; }

    const jp = e.target.closest('[data-jump]');
    if (jp) { S.fromReview = true; jump(+jp.dataset.jump); return; }

    const act = e.target.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      if (a === 'next') next();
      else if (a === 'back') { if (S.fromReview && cur().k === 'q') { S.fromReview = false; jump(idxOf('review')); } else go(-1); }
      else if (a === 'tts') speak();
      else if (a === 'copyid') copy(S.rid, L(X.copiedId));
      else if (a === 'retry') { S.sendStatus = 'sending'; render(false); flush().then(() => { S.sendStatus = (store.get(QKEY) || []).some((x) => x.rid === S.rid) ? 'queued' : 'ok'; save(); render(false); }); }
      else if (a === 'share') {
        const url = (CFG.SITE_URL || location.origin) + '/?src=bagikan';
        const text = L(C.OUTRO.shareText);
        if (navigator.share) navigator.share({ title: 'Riset TernaQin', text, url }).catch(() => {});
        else copy(text + ' ' + url, L(C.OUTRO.copied));
      } else if (a === 'another') {
        S = fresh({ consent: true, answers: keepCommon(), related: S.related || S.rid, step: 2 });
        S.started = new Date().toISOString(); save(); render(true);
      } else if (a === 'newresp' || a === 'restart') { S = fresh(); save(); render(true); }
      else if (a === 'resume-yes') { closeModal(); render(true); }
      else if (a === 'resume-no') { closeModal(); S = fresh(); save(); render(true); }
      return;
    }

    const role = e.target.closest('[data-role]');
    if (role) {
      if (S.role !== role.dataset.role) { S.role = role.dataset.role; save(); }
      $$('[data-role]').forEach((b) => { const on = b.dataset.role === S.role; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
      showErr(''); return;
    }

    const sc = e.target.closest('[data-scale]');
    if (sc) {
      const q = cur().q, n = +sc.dataset.scale;
      if (q.type === 'mx') S.answers[q.id] = Object.assign({}, S.answers[q.id], { [sc.dataset.row]: n });
      else S.answers[q.id] = n;
      $$('[data-scale]', sc.parentNode).forEach((b) => { const on = +b.dataset.scale === n; b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-checked', String(on)); });
      save(); refreshQ(q); renderRail(); showErr(''); return;
    }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.closest('[data-consent]')) { S.consent = t.checked; t.closest('.opt').classList.toggle('on', S.consent); save(); showErr(''); return; }
    const ck = t.closest('[data-contact]');
    if (ck) {
      S.contact.ok = ck.dataset.contact;
      $$('[data-contact]').forEach((el) => el.classList.toggle('on', el.dataset.contact === S.contact.ok));
      $('#cfields').hidden = S.contact.ok !== 'ya'; save(); showErr(''); return;
    }
    const opt = t.closest('.opt[data-v]');
    if (opt) {
      const q = cur().q, v = opt.dataset.v;
      if (q.type === 'rc') S.answers[q.id] = v;
      else {
        let arr = (S.answers[q.id] || []).slice();
        const def = q.opts.find((x) => x.v === v);
        if (t.checked) {
          if (def.exclusive) arr = [v];
          else { arr = arr.filter((x) => !(q.opts.find((o) => o.v === x) || {}).exclusive); if (!q.max || arr.length < q.max) arr.push(v); }
        } else arr = arr.filter((x) => x !== v);
        S.answers[q.id] = arr;
      }
      save(); refreshQ(q); renderRail(); showErr(''); return;
    }
    if (t.id === 'fld' && t.tagName === 'SELECT') { S.answers[cur().q.id] = t.value; save(); renderRail(); showErr(''); }
  });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.note) { S.notes[t.dataset.note] = t.value; save(); return; }
    if (t.id === 'fld' && t.tagName !== 'SELECT') {
      const q = cur().q; S.answers[q.id] = t.value;
      const c = $('#cnt'); if (c) c.textContent = t.value.length;
      save(); refreshQ(q); return;
    }
    if (t.id === 'cname') { S.contact.name = t.value; save(); }
    if (t.id === 'cwa') { S.contact.wa = t.value; save(); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input.input')) { e.preventDefault(); next(); }
  });

  window.addEventListener('online', () => { flush().then((r) => { if (S.submitted && cur().k === 'done' && r === 'ok') { S.sendStatus = 'ok'; save(); render(false); } }); });

  /* ---------- modal lanjutkan ---------- */
  function modal(html) { const m = document.createElement('div'); m.className = 'modal-bg'; m.id = 'modal'; m.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + '</div>'; document.body.appendChild(m); const b = m.querySelector('button'); if (b) b.focus(); }
  function closeModal() { const m = $('#modal'); if (m) m.remove(); }

  /* ---------- mulai ---------- */
  function boot() {
    const saved = store.get(KEY);
    if (saved && saved.v === C.VERSION) {
      S = Object.assign(newState(), saved);
      if (params.get('mode') === 'wawancara') { S.mode = 'wawancara'; if (params.get('pewawancara')) S.interviewer = params.get('pewawancara').slice(0, 60); }
      if (params.get('lang') === 'en' || params.get('lang') === 'id') S.lang = params.get('lang');
      buildSteps();
      if (!S.submitted && S.step > 2) {
        render(false);
        modal('<p class="overline">TERNAQIN</p><h2 class="h-title" style="font-size:22px">' + esc(L(C.UI.resumeTitle)) + '</h2><p class="small" style="font-size:15px;margin:8px 0 0">' + esc(L(C.UI.resumeBody)) + '</p>' +
          '<div class="btns"><button type="button" class="btn btn-primary" data-act="resume-yes">' + esc(L(C.UI.resumeYes)) + '</button><button type="button" class="btn btn-secondary" data-act="resume-no">' + esc(L(C.UI.resumeNo)) + '</button></div>');
        return;
      }
      if (S.submitted && S.sendStatus !== 'ok') flush().then((r) => { if (r === 'ok') { S.sendStatus = 'ok'; save(); render(false); } });
    } else {
      S = newState(); save();
      flush();
    }
    render(false);
  }
  boot();
  // Kirim ulang antrean (mis. wawancara yang tersimpan saat tanpa sinyal) setiap kali halaman dibuka,
  // kembali aktif, atau tiap menit selama masih ada antrean — tidak hanya saat event "online".
  function retryQueue() {
    if (!(store.get(QKEY) || []).length) return;
    flush().then((r) => { if (r === 'ok' && S.submitted && S.sendStatus !== 'ok' && cur().k === 'done') { S.sendStatus = 'ok'; save(); render(false); } });
  }
  retryQueue();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') retryQueue(); });
  setInterval(retryQueue, 60000);
})();
