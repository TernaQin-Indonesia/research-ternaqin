/* =========================================================================
   TernaQin — Dashboard Riset v2 (khusus founder & manajemen)
   Data diambil dari Google Apps Script dengan token sesi; tidak ada data riset di file ini.
   Struktur halaman: Ikhtisar · 4 segmen (urut rantai pasok) · Suara responden · Kontak
   ========================================================================= */
(function () {
  'use strict';
  const C = window.TQ_CONTENT;
  const CFG = window.TQ_CONFIG || {};
  const SEGS = ['peternak', 'rph', 'pedagang', 'konsumen'];
  const CHS = ['profile', 'b1', 'b2', 'b3', 'b4'];
  const SEG_NAME = { peternak: 'Peternak', rph: 'RPH', pedagang: 'Pedagang', konsumen: 'Konsumen' };
  const SEG_LONG = { peternak: 'Peternak', rph: 'Rumah potong hewan', pedagang: 'Pedagang daging', konsumen: 'Konsumen' };
  const SEG_STEP = { peternak: 'Kandang', rph: 'Pemotongan', pedagang: 'Penjualan', konsumen: 'Piring' };
  const SEG_ICON = { peternak: 'ph-cow', rph: 'ph-buildings', pedagang: 'ph-storefront', konsumen: 'ph-shopping-bag' };
  const CH_NAME = { profile: 'Profil', b1: 'Hari ini', b2: 'Ke depan', b3: 'Bagaimana jika', b4: 'Menurut responden' };
  const PILOT_Q = { peternak: 'P34', rph: 'R26', pedagang: 'D18' };
  const SKEY = 'tq_dash_session';
  const MIN_N = 5;     // di bawah ini temuan tidak ditampilkan sebagai angka
  const SMALL_N = 10;  // di bawah ini temuan diberi tanda "sampel kecil"
  const PERAN_LBL = { founder: 'Founder', riset: 'Tim riset', mitra: 'Mitra' };
  const SITE = (CFG.SITE_URL || location.origin).replace(/\/$/, '');

  /* ---------- util ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tipAttr = (html) => ' data-tip="' + esc(html) + '"';
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const fmtN = (n) => Number(n || 0).toLocaleString('id-ID');
  const dec = (x, d) => Number(x).toFixed(d == null ? 1 : d).replace('.', ',');
  const sess = {
    get() { try { return JSON.parse(sessionStorage.getItem(SKEY)); } catch (e) { return null; } },
    set(v) { try { sessionStorage.setItem(SKEY, JSON.stringify(v)); } catch (e) { /* abaikan */ } },
    del() { try { sessionStorage.removeItem(SKEY); } catch (e) { /* abaikan */ } },
  };
  const qsFor = (seg) => C.COMMON.concat(C.SEGMENTS[seg]);
  const qById = (seg, id) => qsFor(seg).find((q) => q.id === id);
  const optLabel = (q, v) => { const o = (q.opts || []).find((x) => x.v === v); return o ? o.t.id : v; };
  const dfmt = (d, o) => (d ? d.toLocaleDateString('id-ID', o || { day: 'numeric', month: 'short' }) : '–');
  const median = (a) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const provLabel = (v) => { const o = C.COMMON[0].opts.find((x) => x.v === v); return o ? o.t.id : (v || '–'); };
  const isMitra = () => !!(D.user && D.user.kategori === 'mitra');
  const isFounder = () => !!(D.user && D.user.peran === 'founder');
  const roleLabel = (u) => (u.peran === 'mitra' ? 'Mitra' + (u.org ? ' · ' + u.org : '') : PERAN_LBL[u.peran] || u.peran);
  const daysLeft = (d) => Math.ceil((new Date(d + 'T23:59:59+07:00') - Date.now()) / 864e5);
  const dateID = (d) => (d ? new Date(d + 'T12:00:00+07:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '–');
  const plusDays = (n) => { const d = new Date(Date.now() + n * 864e5); return d.toISOString().slice(0, 10); };
  const slug = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '').slice(0, 24);
  function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }
  async function copyText(text, msg) {
    try { await navigator.clipboard.writeText(text); toast(msg); }
    catch (e) { const i = document.createElement('textarea'); i.value = text; document.body.appendChild(i); i.select(); try { document.execCommand('copy'); toast(msg); } catch (er) { /* abaikan */ } i.remove(); }
  }
  const hasImports = () => !!(D.recs && SEGS.some((s) => (D.recs[s] || []).some((r) => r.origin === 'impor')));
  const allRecs = () => SEGS.flatMap((s) => D.recs[s] || []);
  const ago = (d) => {
    if (!d) return '–';
    const m = Math.round((Date.now() - d) / 60000);
    if (m < 60) return m <= 1 ? 'baru saja' : m + ' menit lalu';
    const h = Math.round(m / 60); if (h < 24) return h + ' jam lalu';
    return Math.round(h / 24) + ' hari lalu';
  };

  /* ---------- state ---------- */
  const D = {
    session: null, user: null, raw: null, recs: null, demo: false, loading: false, error: '', updated: null,
    page: 'ikhtisar', view: 'app', users: null, usersErr: '',
    f: { period: 'all', prov: 'all', mode: 'all', origin: 'all', hideFast: true },
    imp: { parsed: null, fileName: '', label: '', attest: false, busy: false, err: '', result: null, list: null, listErr: '', confirm: '' },
    cond: { q: '', v: '' },
    ui: { filterOpen: false, nav: false, ch: {}, qs: '', tables: {}, pilotOnly: false, more: 120, addOpen: false, add: null, addErr: '', cred: null, confirm: '', pwErr: '', busy: false },
    voice: { seg: 'all', q: 'all', s: '' },
  };

  /* ---------- API ---------- */
  async function api(body) {
    if (D.demo) return demoApi(body);
    const r = await fetch(CFG.ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  /* ---------- normalisasi ---------- */
  const parseDate = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d) ? null : d; };
  function normalize(raw) {
    const out = {};
    SEGS.forEach((seg) => {
      const t = (raw.segments && raw.segments[seg]) || { headers: [], rows: [] };
      const ix = {}; t.headers.forEach((h, i) => { ix[h] = i; });
      const qs = qsFor(seg);
      out[seg] = t.rows.map((r) => {
        const g = (k) => (ix[k] != null && r[ix[k]] != null ? r[ix[k]] : '');
        const rec = {
          seg, id: String(g('id_respons')), t: parseDate(String(g('tanggal_wawancara')).slice(0, 10) ? String(g('tanggal_wawancara')).slice(0, 10) + 'T12:00:00+07:00' : '') || parseDate(g('waktu_terima') || g('waktu_kirim')), dur: Number(g('durasi_detik')) || 0,
          flag: String(g('flag_durasi')), mode: String(g('mode')), lang: String(g('bahasa')), iv: String(g('pewawancara')),
          src: String(g('sumber')), contact: String(g('bersedia_dihubungi')), notes: {}, a: {},
          origin: String(g('asal_data')) === 'impor' ? 'impor' : 'web', batch: String(g('id_impor')), batchLabel: String(g('keterangan_impor')),
          received: parseDate(g('waktu_terima')), intact: String(g('_utuh')),
        };
        CHS.concat(['umum']).forEach((ch) => { const v = g('catatan_' + ch); if (String(v).trim()) rec.notes[ch] = String(v); });
        qs.forEach((q) => {
          if (q.type === 'mx') {
            const o = {};
            q.rows.forEach((rw) => { const v = Number(g(q.id + '_' + rw.v)); if (v >= 1 && v <= 5) o[rw.v] = v; });
            if (Object.keys(o).length) rec.a[q.id] = o;
            return;
          }
          const v = g(q.id);
          if (v === '' || v == null) return;
          if (q.type === 'cb') rec.a[q.id] = String(v).split(';').map((s) => s.trim()).filter(Boolean);
          else if (q.type === 'sk') { const n = Number(v); if (n >= 1 && n <= 5) rec.a[q.id] = n; }
          else rec.a[q.id] = String(v).trim();
        });
        return rec;
      });
    });
    return out;
  }

  /* ---------- filter ---------- */
  function passBase(r) {
    const f = D.f;
    if (f.hideFast && r.flag === 'terlalu_cepat') return false;
    if (f.mode !== 'all' && r.mode !== f.mode) return false;
    if (f.origin !== 'all' && r.origin !== f.origin) return false;
    if (f.prov !== 'all' && r.a.U1 !== f.prov) return false;
    if (f.period !== 'all') { if (!r.t || r.t < new Date(Date.now() - +f.period * 864e5)) return false; }
    return true;
  }
  function passCond(r) {
    const c = D.cond;
    if (!c.q || c.v === '') return true;
    const a = r.a[c.q];
    if (a == null) return false;
    return Array.isArray(a) ? a.includes(c.v) : String(a) === String(c.v);
  }
  const condActiveFor = (seg) => !!(D.cond.q && D.cond.v !== '' && D.page === seg);
  const recs = (seg) => (D.recs[seg] || []).filter((r) => passBase(r) && (!condActiveFor(seg) || passCond(r)));
  const valid = (seg) => (D.recs[seg] || []).filter((r) => r.flag !== 'terlalu_cepat');

  /* ---------- statistik ---------- */
  function countOpts(R, q) {
    const base = R.filter((r) => r.a[q.id] != null && r.a[q.id] !== '');
    const counts = {}; (q.opts || []).forEach((o) => { counts[o.v] = 0; });
    base.forEach((r) => { const a = r.a[q.id]; (Array.isArray(a) ? a : [a]).forEach((v) => { counts[v] = (counts[v] || 0) + 1; }); });
    return { n: base.length, counts };
  }
  function dist(vals) {
    const d = [0, 0, 0, 0, 0];
    vals.forEach((v) => { if (v >= 1 && v <= 5) d[v - 1]++; });
    return { d, n: vals.length, mean: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
  }
  const share = (R, qid, pred) => { const base = R.filter((r) => r.a[qid] != null && r.a[qid] !== ''); return { k: base.filter((r) => pred(r.a[qid], r)).length, n: base.length }; };
  const inc = (v, ...xs) => (Array.isArray(v) ? xs.some((x) => v.includes(x)) : xs.includes(v));

  /* ---------- temuan (urut dari yang paling menentukan arah produk) ---------- */
  const INSIGHTS = {
    peternak: [
      { q: 'P7', f: (R) => { const s = share(R, 'P7', (v) => inc(v, 'tidak_mencatat', 'buku')); return { k: s.k, n: s.n, text: 'peternak masih mencatat di buku tulis atau tidak mencatat sama sekali.' }; } },
      { q: 'P12', f: (R) => { const s = share(R, 'P12', (v) => inc(v, 'turun_5_10', 'turun_10p')); return { k: s.k, n: s.n, text: 'menerima harga minimal 5% di bawah harapan pada penjualan terakhir.' }; } },
      { q: 'P23', f: (R) => top(R, 'peternak', 'P23', 'Fitur yang paling dibutuhkan sekarang') },
      { q: 'P9', f: (R) => { const s = share(R, 'P9', (v) => inc(v, 'lebih_3_bulan', 'tidak_pernah')); return { k: s.k, n: s.n, text: 'tidak menimbang sapinya dalam 3 bulan terakhir, jadi harga jual dibentuk dari taksiran.' }; } },
      { q: 'P29', f: (R) => { const s = share(R, 'P29', (v) => v !== 'tidak_mau'); const p = share(R, 'P28', (v) => v === 'ya'); return { k: s.k, n: s.n, stated: true, text: 'bersedia membayar dalam bentuk apa pun. Pembanding: hanya ' + pct(p.k, p.n) + '% yang saat ini membayar layanan digital.' }; } },
    ],
    rph: [
      { q: 'R8', f: (R) => { const s = share(R, 'R8', (v) => v >= 4); return { k: s.k, n: s.n, text: 'RPH sering atau hampir selalu menerima sapi tanpa keterangan asal yang jelas.' }; } },
      { q: 'R17', f: (R) => { const s = share(R, 'R17', (v) => String(v).startsWith('ya')); return { k: s.k, n: s.n, stated: true, text: 'bersedia mencatat penerima dan berat untuk setiap batch yang keluar.' }; } },
      { q: 'R18', f: (R) => { const s = share(R, 'R18', (v) => inc(v, 'lt1', '1_3')); return { k: s.k, n: s.n, text: 'hanya menerima verifikasi maksimal 3 menit per ekor. Ini batas desain alur RPH.' }; } },
      { q: 'R11', f: (R) => { const s = share(R, 'R11', (v) => v !== 'selalu'); return { k: s.k, n: s.n, text: 'tidak selalu mencatat siapa penerima hasil potong dan berapa kilonya.' }; } },
      { q: 'R21', f: (R) => { const s = share(R, 'R21', (v) => v === 'pemda'); return { k: s.k, n: s.n, text: 'menyebut keputusan membeli sistem ada di pemerintah daerah atau dinas.' }; } },
    ],
    pedagang: [
      { q: 'D6', f: (R) => { const s = share(R, 'D6', (v) => v !== '0'); return { k: s.k, n: s.n, text: 'pedagang ditanya asal daging oleh pembeli minimal sekali dalam seminggu terakhir.' }; } },
      { q: 'D13', f: (R) => { const s = share(R, 'D13', (v) => String(v).startsWith('ya')); const g = share(R, 'D13', (v) => v === 'ya_gratis'); return { k: s.k, n: s.n, stated: true, text: 'bersedia memajang QR atau label. ' + pct(g.k, g.n) + '% dari semua pedagang hanya mau jika gratis.' }; } },
      { q: 'D9', f: (R) => { const s = share(R, 'D9', (v) => inc(v, 'rutin', 'pernah')); return { k: s.k, n: s.n, text: 'pernah menjual lebih mahal karena keterangan khusus seperti halal, sapi lokal, atau potong hari ini.' }; } },
      { q: 'D16', f: (R) => top(R, 'pedagang', 'D16', 'Biaya label sebaiknya ditanggung oleh') },
    ],
    konsumen: [
      { q: 'K6', f: (R) => {
        const base = R.filter((r) => r.a.K5 && r.a.K6);
        const claim = base.filter((r) => inc(r.a.K5, 'label_halal')).length;
        const act = base.filter((r) => inc(r.a.K6, 'cek_label')).length;
        return { value: pct(claim, base.length) + '% vs ' + pct(act, base.length) + '%', n: base.length, text: 'konsumen mengaku memeriksa label halal, dibanding yang benar-benar memeriksa label saat terakhir membeli.' };
      } },
      { q: 'K16', f: (R) => { const s = share(R, 'K16', (v) => inc(v, '5_10', '10_15', 'gt15')); return { k: s.k, n: s.n, stated: true, text: 'rela membayar 5% atau lebih untuk daging terverifikasi.' }; } },
      { q: 'K17', f: (R) => { const s = share(R, 'K17', (v) => v === 'pindah'); return { k: s.k, n: s.n, stated: true, text: 'akan pindah ke penjual berlabel walau 10% lebih mahal dari penjual langganan.' }; } },
      { q: 'K10', f: (R) => { const s = share(R, 'K10', (v) => inc(v, 'rutin', 'kadang')); return { k: s.k, n: s.n, text: 'pernah benar-benar membayar lebih untuk produk berlabel. Pembanding nyata untuk angka kesediaan bayar.' }; } },
      { q: 'K14', f: (R) => { const m = dist(R.map((r) => r.a.K14).filter(Boolean)); return { value: m.n ? dec(m.mean) + ' / 5' : '–', n: m.n, stated: true, text: 'rata-rata kemungkinan konsumen memindai QR sebelum membeli.' }; } },
      { q: 'K7', f: (R) => { const s = share(R, 'K7', (v) => v !== 'tidak'); return { k: s.k, n: s.n, text: 'pernah merasa tertipu atau ragu saat membeli daging.' }; } },
    ],
  };
  function top(R, seg, qid, lead) {
    const q = qById(seg, qid); const c = countOpts(R, q);
    const best = Object.keys(c.counts).sort((a, b) => c.counts[b] - c.counts[a])[0];
    if (!c.n || !best) return { n: 0, text: lead + '.' };
    return { value: pct(c.counts[best], c.n) + '%', n: c.n, text: lead + ': “' + optLabel(q, best) + '”.' };
  }
  function evalInsight(seg, ins) {
    const r = ins.f(recs(seg));
    r.ok = r.n >= MIN_N;
    r.val = r.value != null ? r.value : (r.n ? pct(r.k, r.n) + '%' : '–');
    return r;
  }
  function confPills(r) {
    return (r.n < SMALL_N ? '<span class="pill pill-warn"' + tipAttr('Kurang dari ' + SMALL_N + ' responden. Anggap sebagai petunjuk awal, belum kesimpulan.') + '><i class="ph ph-warning"></i>Sampel kecil</span>' : '') +
      (r.stated ? '<span class="pill pill-mute"' + tipAttr('Berupa niat atau pernyataan. Perilaku nyata biasanya lebih rendah, jadi anggap sebagai batas atas.') + '><i class="ph ph-chat-circle-text"></i>Pernyataan</span>' : '');
  }
  function findCell(seg, ins, opts) {
    const r = evalInsight(seg, ins);
    const segLbl = (opts && opts.hideSeg) ? '' : '<div class="find-seg"><i class="sw c-' + seg + '"></i>' + SEG_NAME[seg] + '</div>';
    if (!r.ok) {
      return '<div class="find empty-find">' + segLbl + '<div class="find-val">Belum cukup data</div><div class="find-txt">Temuan ini muncul setelah minimal ' + MIN_N + ' responden menjawab ' + ins.q + '. Saat ini ' + r.n + '.</div></div>';
    }
    return '<div class="find">' + segLbl + '<div class="find-val' + (String(r.val).length > 8 ? ' sm' : '') + '">' + esc(r.val) + '</div><div class="find-txt">' + esc(r.text) + '</div>' +
      '<div class="find-foot"><span>' + fmtN(r.n) + ' responden</span>' + confPills(r) + '<button type="button" class="linkish" data-goto="' + seg + '|' + ins.q + '">Lihat jawaban ' + ins.q + ' <i class="ph ph-arrow-right"></i></button></div></div>';
  }

  /* ---------- komponen grafik ---------- */
  function tblToggle(key) {
    const on = !!D.ui.tables[key];
    return '<button type="button" class="icon-sq" data-table="' + esc(key) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Tampilkan sebagai grafik' : 'Tampilkan sebagai tabel') + '"' + tipAttr(on ? 'Tampilkan grafik' : 'Tampilkan tabel') + '><i class="ph ' + (on ? 'ph-chart-bar-horizontal' : 'ph-table') + '"></i></button>';
  }
  /* bar horizontal dengan penekanan: jawaban terbanyak berwarna aksen, sisanya abu */
  function hbars(items, n, key, opts) {
    opts = opts || {};
    if (!n) return '<div class="empty">Belum ada jawaban.</div>';
    if (D.ui.tables[key]) {
      return '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Jawaban</th><th class="num">Responden</th><th class="num">Persen</th></tr></thead><tbody>' +
        items.map((it) => '<tr><td>' + esc(it.label) + '</td><td class="num">' + fmtN(it.k) + '</td><td class="num">' + pct(it.k, n) + '%</td></tr>').join('') + '</tbody></table></div>';
    }
    const max = Math.max(0, ...items.filter((x) => !x.fixed).map((x) => x.k));
    return '<div class="hb' + (opts.compact ? ' compact' : '') + '">' + items.map((it) => {
      const p = pct(it.k, n);
      const cls = it.fixed ? ' fixed' : (it.k === max && max > 0 ? ' top' : '');
      return '<div class="hb-row' + cls + '"' + tipAttr('<b>' + esc(it.label) + '</b><br>' + fmtN(it.k) + ' dari ' + fmtN(n) + ' responden (' + p + '%)') + '>' +
        '<div class="hb-label">' + esc(it.label) + '</div>' +
        '<div class="hb-track"><div class="hb-fill" style="width:' + (it.k ? Math.max(p, 1) : 0) + '%"></div></div>' +
        '<div class="hb-val"><b>' + p + '%</b> <span>' + fmtN(it.k) + '</span></div></div>';
    }).join('') + '</div>';
  }
  function stack(dd, scale) {
    if (!dd.n) return '<div class="empty">Belum ada jawaban.</div>';
    return '<div class="st" role="img" aria-label="Sebaran skor 1 sampai 5">' + dd.d.map((k, i) => {
      if (!k) return '';
      const p = pct(k, dd.n);
      const anchor = i === 0 ? ' · ' + scale.lo.id : i === 4 ? ' · ' + scale.hi.id : '';
      return '<div class="st-seg o' + (i + 1) + '" style="flex:' + k + '"' + tipAttr('<b>Skor ' + (i + 1) + esc(anchor) + '</b><br>' + fmtN(k) + ' responden (' + p + '%)') + '>' + (p >= 14 ? p + '%' : '') + '</div>';
    }).join('') + '</div>';
  }
  const stackLegend = (scale) => '<div class="st-legend"><span>' + esc(scale.lo.id) + '</span>' + [1, 2, 3, 4, 5].map((i) => '<span><i class="sw o' + i + '"></i>' + i + '</span>').join('') + '<span>' + esc(scale.hi.id) + '</span></div>';
  function distTable(rows) {
    return '<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th>' + [1, 2, 3, 4, 5].map((i) => '<th class="num">' + i + '</th>').join('') + '<th class="num">Rata-rata</th><th class="num">n</th></tr></thead><tbody>' +
      rows.map((r) => '<tr><td>' + esc(r.label) + '</td>' + r.dd.d.map((k) => '<td class="num">' + k + '</td>').join('') + '<td class="num">' + (r.dd.n ? dec(r.dd.mean, 2) : '–') + '</td><td class="num">' + r.dd.n + '</td></tr>').join('') + '</tbody></table></div>';
  }

  /* ---------- kartu pertanyaan ---------- */
  function qCard(seg, q, R) {
    const key = seg + ':' + q.id;
    let body = '', n = 0, take = '';
    const notes = [];
    if (q.type === 'rc' || q.type === 'select' || q.type === 'cb') {
      const c = countOpts(R, q); n = c.n;
      let items = (q.opts || []).map((o) => ({ v: o.v, label: o.t.id, k: c.counts[o.v] || 0, fixed: !!(o.fixed || o.exclusive) }));
      if (q.type !== 'rc') { items = items.filter((x) => q.type === 'cb' || x.k > 0); items.sort((a, b) => (a.fixed - b.fixed) || (b.k - a.k)); }
      if (q.type === 'select' && items.length > 8) { const rest = items.slice(8).reduce((s, x) => s + x.k, 0); items = items.slice(0, 8); if (rest) items.push({ label: 'Provinsi lain', k: rest, fixed: true }); }
      const best = items.filter((x) => !x.fixed).sort((a, b) => b.k - a.k)[0];
      if (n && best && best.k) take = 'Terbanyak: <b>' + esc(best.label) + '</b> (' + pct(best.k, n) + '%)';
      body = hbars(items, n, key);
      if (q.type === 'cb') notes.push(['ph-checks', 'Boleh pilih lebih dari satu' + (q.max ? ' (maks. ' + q.max + ')' : '') + ', total bisa melebihi 100%']);
      if (q.shuffle) notes.push(['ph-shuffle', 'Urutan opsi diacak per responden']);
    } else if (q.type === 'sk') {
      const dd = dist(R.map((r) => r.a[q.id]).filter(Boolean)); n = dd.n;
      if (n) take = 'Rata-rata <b>' + dec(dd.mean) + ' dari 5</b>. ' + pct(dd.d[3] + dd.d[4], n) + '% memberi skor 4–5 (' + esc(q.scale.hi.id.toLowerCase()) + ').';
      body = D.ui.tables[key] ? distTable([{ label: 'Semua responden', dd }]) : stack(dd, q.scale) + (n ? stackLegend(q.scale) : '');
    } else if (q.type === 'mx') {
      const rows = q.rows.map((rw, i) => ({ label: String.fromCharCode(65 + i) + '. ' + rw.t.id, dd: dist(R.map((r) => r.a[q.id] && r.a[q.id][rw.v]).filter(Boolean)) }));
      n = Math.max(0, ...rows.map((r) => r.dd.n));
      rows.sort((a, b) => b.dd.mean - a.dd.mean);
      if (n) take = 'Paling berguna: <b>' + esc(rows[0].label.slice(3)) + '</b> (rata-rata ' + dec(rows[0].dd.mean) + '). Paling rendah: ' + esc(rows[rows.length - 1].label.slice(3)) + ' (' + dec(rows[rows.length - 1].dd.mean) + ').';
      body = D.ui.tables[key] ? distTable(rows) : n ? '<div class="mx">' + rows.map((r) => '<div><div class="mx-h"><span>' + esc(r.label) + '</span><b>' + (r.dd.n ? dec(r.dd.mean) : '–') + '</b></div>' + stack(r.dd, q.scale) + '</div>').join('') + '</div>' + stackLegend(q.scale) : '<div class="empty">Belum ada jawaban.</div>';
      notes.push(['ph-sort-descending', 'Diurutkan dari rata-rata skor tertinggi']);
    } else if (q.type === 'text') {
      const c = {}; R.forEach((r) => { const v = r.a[q.id]; if (v) { const k = v.replace(/^(kab\.?|kabupaten|kota)\s+/i, '').trim().toLowerCase(); c[k] = (c[k] || 0) + 1; } });
      n = R.filter((r) => r.a[q.id]).length;
      const items = Object.keys(c).sort((a, b) => c[b] - c[a]).slice(0, 8).map((k) => ({ label: k.replace(/\b\w/g, (m) => m.toUpperCase()), k: c[k] }));
      if (items.length) take = 'Terbanyak: <b>' + esc(items[0].label) + '</b> (' + pct(items[0].k, n) + '%)';
      body = hbars(items, n, key);
    } else if (q.type === 'tx') {
      const list = R.filter((r) => r.a[q.id]).sort((a, b) => (b.t || 0) - (a.t || 0)); n = list.length;
      take = n ? '<b>' + n + ' cerita</b> dari ' + R.length + ' responden (' + pct(n, R.length) + '% mengisi)' : '';
      body = n ? '<div class="quotes">' + list.slice(0, 3).map((r) => '<div class="quote mini"><blockquote>' + esc(r.a[q.id]) + '</blockquote><div class="qm"><span>' + esc(provLabel(r.a.U1)) + '</span><span>' + dfmt(r.t) + '</span></div></div>').join('') + '</div>' +
        (n > 3 ? '<button type="button" class="btn btn-secondary btn-sm" style="margin-top:12px" data-voice="' + seg + '|' + q.id + '"><i class="ph ph-quotes"></i>Baca semua ' + n + ' cerita</button>' : '') : '<div class="empty">Belum ada cerita.</div>';
    }
    const resp = R.length;
    const foot = '<div class="qfoot"><span><i class="ph ph-users"></i>' + fmtN(n) + ' dari ' + fmtN(resp) + ' responden menjawab</span>' +
      (n > 0 && n < SMALL_N ? '<span class="pill pill-warn"><i class="ph ph-warning"></i>Sampel kecil</span>' : '') +
      notes.map((x) => '<span><i class="ph ' + x[0] + '"></i>' + esc(x[1]) + '</span>').join('') + '</div>';
    return '<article class="qcard' + (q.type === 'tx' ? ' wide' : '') + '" id="q-' + seg + '-' + q.id + '"><div class="qcard-h"><div><div class="qcode">' + q.id + ' · ' + CH_NAME[q.ch] + '</div><h3>' + esc(q.q.id) + '</h3></div>' +
      (q.type === 'tx' ? '' : tblToggle(key)) + '</div>' + (take ? '<p class="qtake">' + take + '</p>' : '<div style="height:14px"></div>') + body + foot + '</article>';
  }

  /* ---------- garis waktu ---------- */
  function timeline() {
    const all = SEGS.flatMap((s) => recs(s)).filter((r) => r.t);
    if (!all.length) return '<div class="empty-big"><i class="ph ph-hourglass"></i>Belum ada respons pada periode ini.</div>';
    const day = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
    const end = day(new Date());
    let start = D.f.period !== 'all' ? day(new Date(Date.now() - (+D.f.period - 1) * 864e5)) : day(new Date(Math.min.apply(null, all.map((r) => r.t))));
    if ((end - start) / 864e5 < 13) start = new Date(end - 13 * 864e5);
    const weekly = (end - start) / 864e5 > 70;
    const step = weekly ? 7 : 1;
    if (weekly) start = new Date(start.getTime() - ((start.getDay() + 6) % 7) * 864e5);
    const bins = [];
    for (let t = start.getTime(); t <= end.getTime(); t += step * 864e5) bins.push({ t: new Date(t), c: { peternak: 0, rph: 0, pedagang: 0, konsumen: 0 } });
    all.forEach((r) => { const i = Math.floor((day(r.t) - start) / (step * 864e5)); if (bins[i]) bins[i].c[r.seg]++; });
    const tot = (b) => SEGS.reduce((a, s) => a + b.c[s], 0);
    const max = Math.max(1, ...bins.map(tot));
    const nice = max <= 4 ? 4 : max <= 10 ? 10 : Math.ceil(max / 10) * 10;
    const key = 'ov:tl';
    if (D.ui.tables[key]) {
      return '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + (weekly ? 'Minggu mulai' : 'Tanggal') + '</th>' + SEGS.map((s) => '<th class="num">' + SEG_NAME[s] + '</th>').join('') + '<th class="num">Total</th></tr></thead><tbody>' +
        bins.filter(tot).reverse().map((b) => '<tr><td>' + dfmt(b.t, { day: 'numeric', month: 'short', year: 'numeric' }) + '</td>' + SEGS.map((s) => '<td class="num">' + b.c[s] + '</td>').join('') + '<td class="num">' + tot(b) + '</td></tr>').join('') + '</tbody></table></div>';
    }
    return '<div class="legend" style="margin-bottom:22px">' + SEGS.map((s) => '<span><i class="sw c-' + s + '"></i>' + SEG_NAME[s] + '</span>').join('') + '</div>' +
      '<div class="tl-wrap"><div class="tl">' +
      '<div class="tl-grid" style="bottom:100%"><span>' + nice + '</span></div><div class="tl-grid" style="bottom:50%"><span>' + nice / 2 + '</span></div>' +
      bins.map((b) => {
        const tt = tot(b);
        const tip = '<b>' + (weekly ? 'Minggu mulai ' : '') + dfmt(b.t, { weekday: weekly ? undefined : 'long', day: 'numeric', month: 'long' }) + '</b><br>' + tt + ' respons' + (tt ? '<br>' + SEGS.filter((s) => b.c[s]).map((s) => SEG_NAME[s] + ': ' + b.c[s]).join('<br>') : '');
        return '<div class="tl-col"' + tipAttr(tip) + '>' + SEGS.filter((s) => b.c[s]).map((s) => '<div class="tl-seg c-' + s + '" style="height:calc(' + (b.c[s] / nice * 100) + '% - 2px)"></div>').join('') + '</div>';
      }).join('') + '</div></div>' +
      '<div class="tl-axis"><span>' + dfmt(bins[0].t) + '</span><span>' + dfmt(bins[Math.floor(bins.length / 2)].t) + '</span><span>' + (weekly ? dfmt(bins[bins.length - 1].t) : 'Hari ini') + '</span></div>';
  }

  /* ---------- HALAMAN: IKHTISAR ---------- */
  function pIkhtisar() {
    const T = CFG.TARGETS || {};
    const V = {}; SEGS.forEach((s) => { V[s] = valid(s); });
    const totalV = SEGS.reduce((a, s) => a + V[s].length, 0);
    const totalT = SEGS.reduce((a, s) => a + (T[s] || 0), 0);
    const week = SEGS.reduce((a, s) => a + V[s].filter((r) => r.t && r.t > new Date(Date.now() - 7 * 864e5)).length, 0);

    // 1. status — pita perjalanan
    let html = '<section class="sec hero" aria-labelledby="h-status"><div class="hero-top"><div><h2 id="h-status">Respons valid terkumpul sepanjang riset</h2>' +
      '<div class="hero-fig"><b>' + fmtN(totalV) + '</b><span>dari target ' + fmtN(totalT) + ' responden</span></div></div>' +
      '<div class="hero-meter"><div class="bar"><i style="width:' + Math.min(100, pct(totalV, totalT)) + '%"></i></div><div class="lbl"><span><b>' + pct(totalV, totalT) + '%</b> dari target</span><span>+' + fmtN(week) + ' dalam 7 hari</span></div></div></div>' +
      '<ol class="journey">' + SEGS.map((s) => {
        const n = V[s].length, t = T[s] || 0, done = t && n >= t;
        return '<li><a href="#' + s + '" data-nav="' + s + '"><div class="j-top"><span class="j-ic"><i class="ph ' + SEG_ICON[s] + '"></i><i class="sw c-' + s + '"></i></span><span class="j-name">' + SEG_NAME[s] + '<small>' + SEG_STEP[s] + '</small></span></div>' +
          '<div class="j-num">' + fmtN(n) + '<span>/ ' + t + '</span></div><div class="j-bar"><i style="width:' + Math.min(100, pct(n, t)) + '%"></i></div>' +
          '<div class="j-state' + (done ? ' ok' : '') + '">' + (done ? '<i class="ph-fill ph-check-circle"></i>Target tercapai' : 'Kurang ' + (t - n) + ' responden') + '</div></a></li>';
      }).join('') + '</ol></section>';

    // 2. temuan + 3. tindak lanjut
    html += '<section class="sec" aria-labelledby="h-find"><div class="sec-h"><div><h2 id="h-find">Yang sudah kita pelajari</h2><p>Temuan paling menentukan dari tiap segmen, mengikuti filter yang aktif. Buka halaman segmen untuk temuan lainnya.</p></div></div>' +
      '<div class="cols cols-main"><div class="brief">' + SEGS.map((s) => findCell(s, INSIGHTS[s][0])).join('') + '</div>' + (isMitra() ? aboutData() : todo()) + '</div></section>';

    // 4. bukti pendukung: aktivitas & kualitas
    const all = SEGS.flatMap((s) => recs(s));
    const durs = all.map((r) => r.dur).filter((d) => d > 0);
    const rawAll = SEGS.flatMap((s) => D.recs[s] || []);
    const fast = rawAll.filter((r) => r.flag === 'terlalu_cepat').length;
    const last = rawAll.map((r) => r.t).filter(Boolean).sort((a, b) => b - a)[0];
    const c1 = all.filter((r) => r.a.C1);
    html += '<section class="sec" aria-labelledby="h-act"><div class="sec-h"><div><h2 id="h-act">Aktivitas dan kualitas data</h2><p>Kapan respons masuk dan seberapa bisa dipercaya.</p></div></div>' +
      '<div class="cols cols-main"><div class="panel"><div class="panel-h"><div><h3>Respons masuk' + (D.f.period === 'all' ? '' : ' dalam ' + D.f.period + ' hari terakhir') + '</h3><p>' + fmtN(all.length) + ' respons, per hari menurut segmen</p></div>' + tblToggle('ov:tl') + '</div>' + timeline() + '</div>' +
      '<div class="panel"><div class="panel-h"><div><h3>Kualitas data</h3><p>Dari respons yang sedang ditampilkan</p></div></div><div class="qlist">' +
      '<div class="qrow"><span>Respons terakhir masuk</span><b>' + ago(last) + '</b></div>' +
      '<div class="qrow"><span>Median waktu pengisian</span><b>' + (durs.length ? Math.round(median(durs) / 60) + ' menit' : '–') + '</b></div>' +
      '<div class="qrow"><span>Diisi lewat wawancara</span><b>' + pct(all.filter((r) => r.mode === 'wawancara').length, all.length) + '%</b></div>' +
      (all.some((r) => r.origin === 'impor') ? '<div class="qrow"><span>Dari wawancara awal (impor)</span><b>' + fmtN(all.filter((r) => r.origin === 'impor').length) + ' respons</b></div>' : '') +
      '<div class="qrow"><span' + tipAttr('Setiap baris diberi sidik digital saat masuk. Baris yang isinya diubah langsung di Google Sheet sesudahnya akan terdeteksi.') + '>Sidik integritas</span><b class="' + (all.some((r) => r.intact === 'diubah') ? 'warn' : '') + '">' + (all.some((r) => r.intact === 'diubah') ? fmtN(all.filter((r) => r.intact === 'diubah').length) + ' baris diubah' : all.some((r) => r.intact === 'ya') ? 'Semua utuh' : '–') + '</b></div>' +
      '<div class="qrow"><span>Paham konsep Bab 3</span><b>' + pct(c1.filter((r) => r.a.C1 === 'jelas').length, c1.length) + '%</b></div>' +
      (isMitra() ? '<div class="qrow"><span>Respons tidak valid</span><b>Sudah dikeluarkan</b></div>' : '<div class="qrow"><span>Respons terlalu cepat</span><b class="' + (fast ? 'warn' : '') + '">' + fmtN(fast) + (D.f.hideFast ? ' disembunyikan' : ' ikut dihitung') + '</b></div>') +
      '<div class="qrow"><span>Diisi dalam bahasa Inggris</span><b>' + pct(all.filter((r) => r.lang === 'en').length, all.length) + '%</b></div>' +
      '</div></div></div></section>';

    // 5. tersier: siapa yang menjawab
    const provC = {}; all.forEach((r) => { if (r.a.U1) provC[r.a.U1] = (provC[r.a.U1] || 0) + 1; });
    let pItems = Object.keys(provC).sort((a, b) => provC[b] - provC[a]).map((v) => ({ label: provLabel(v), k: provC[v] }));
    if (pItems.length > 6) { const rest = pItems.slice(6).reduce((a, x) => a + x.k, 0); pItems = pItems.slice(0, 6).concat([{ label: 'Provinsi lain', k: rest, fixed: true }]); }
    const srcC = {}; all.forEach((r) => { const k = r.src || '(langsung)'; srcC[k] = (srcC[k] || 0) + 1; });
    const sItems = Object.keys(srcC).sort((a, b) => srcC[b] - srcC[a]).slice(0, 6).map((k) => ({ label: k === '(langsung)' ? 'Tautan langsung' : k, k: srcC[k] }));
    const pn = all.filter((r) => r.a.U1).length;
    html += '<section class="sec" aria-labelledby="h-who"><div class="sec-h"><div><h2 id="h-who">Siapa yang menjawab</h2><p>Sebaran lokasi' + (isMitra() ? ' responden' : ' dan asal tautan, untuk memeriksa bias sampel') + '.</p></div></div><div class="cols ' + (isMitra() ? '' : 'cols-2') + '">' +
      '<div class="panel"><div class="panel-h"><div><h3>Provinsi responden</h3><p>' + fmtN(pn) + ' responden</p></div>' + tblToggle('ov:prov') + '</div>' + hbars(pItems, pn, 'ov:prov', { compact: true }) + '</div>' +
      (isMitra() ? '' : '<div class="panel"><div class="panel-h"><div><h3>Asal tautan</h3><p>Dari parameter ?src= pada tautan yang dibagikan</p></div>' + tblToggle('ov:src') + '</div>' + hbars(sItems, all.length, 'ov:src', { compact: true }) + '</div>') + '</div></section>';
    return html;
  }
  function provenanceRow(row) {
    const imp = allRecs().filter((r) => r.origin === 'impor');
    const changed = allRecs().filter((r) => r.intact === 'diubah').length;
    let html = '';
    if (imp.length) {
      const ts = imp.map((r) => r.t).filter(Boolean).sort((a, b) => a - b);
      const rec = imp.map((r) => r.received).filter(Boolean).sort((a, b) => a - b);
      const o = { day: 'numeric', month: 'short', year: 'numeric' };
      html += row('ph-notebook', 'Wawancara awal', fmtN(imp.length) + ' respons berasal dari wawancara lapangan sebelum survei daring dibuka (' + dfmt(ts[0], o) + (ts.length > 1 ? ' – ' + dfmt(ts[ts.length - 1], o) : '') + '), dimasukkan tim pada ' + dfmt(rec[rec.length - 1], o) + '. Bisa dipisahkan lewat filter "Asal data".');
    }
    html += row('ph-seal-check', 'Integritas', 'Setiap baris diberi sidik digital saat masuk. ' + (changed ? changed + ' baris terdeteksi berubah sesudahnya.' : 'Tidak ada baris yang berubah sesudah masuk.'));
    return html;
  }
  function aboutData() {
    const T = CFG.TARGETS || {};
    const first = SEGS.flatMap((s) => D.recs[s] || []).map((r) => r.t).filter(Boolean).sort((a, b) => a - b)[0];
    const row = (icon, title, text) => '<div class="todo-item"><span class="todo-ic"><i class="ph ' + icon + '"></i></span><div><b>' + title + '</b><p>' + text + '</p></div></div>';
    return '<aside class="todo" aria-labelledby="h-about"><h3 id="h-about">Tentang data ini</h3>' +
      row('ph-clipboard-text', 'Metode', 'Survei bercerita daring dan wawancara lapangan dengan empat kelompok di rantai pasok daging sapi' + (first ? ', berjalan sejak ' + dfmt(first, { day: 'numeric', month: 'long', year: 'numeric' }) : '') + '.') +
      row('ph-target', 'Ukuran sampel', SEGS.map((s) => SEG_NAME[s] + ' ' + valid(s).length + '/' + (T[s] || '–')).join(', ') + '. Riset masih berjalan; angka dapat berubah.') +
      row('ph-chat-circle-text', 'Cara membaca', 'Label "Pernyataan" berarti niat responden, bukan perilaku yang sudah terjadi. Label "Sampel kecil" berarti kurang dari ' + SMALL_N + ' responden.') +
      provenanceRow(row) +
      row('ph-shield-check', 'Privasi', 'Identitas, kontak, dan lokasi rinci responden tidak ditampilkan. Respons tidak valid sudah dikeluarkan.') +
      '</aside>';
  }
  function todo() {
    const T = CFG.TARGETS || {};
    const pil = {}; let pilT = 0;
    SEGS.filter((s) => PILOT_Q[s]).forEach((s) => { pil[s] = valid(s).filter((r) => r.a[PILOT_Q[s]] === 'ya').length; pilT += pil[s]; });
    const behind = SEGS.filter((s) => (T[s] || 0) > valid(s).length);
    const fast = SEGS.reduce((a, s) => a + (D.recs[s] || []).filter((r) => r.flag === 'terlalu_cepat').length, 0);
    const c1 = SEGS.flatMap((s) => valid(s)).filter((r) => r.a.C1);
    const unclear = pct(c1.filter((r) => r.a.C1 === 'kurang').length, c1.length);
    const founder = D.user && D.user.peran === 'founder';
    const item = (icon, title, text, action, warn) => '<div class="todo-item' + (warn ? ' warn' : '') + '"><span class="todo-ic"><i class="ph ' + icon + '"></i></span><div><b>' + title + '</b><p>' + text + '</p>' + (action || '') + '</div></div>';
    return '<aside class="todo" aria-labelledby="h-todo"><h3 id="h-todo">Tindak lanjut</h3>' +
      item('ph-handshake', fmtN(pilT) + ' kandidat uji coba', 'Menjawab "Ya" untuk uji coba gratis. ' + Object.keys(pil).map((s) => SEG_NAME[s] + ' ' + pil[s]).join(', ') + '.',
        founder ? '<button type="button" class="linkish" data-nav="kontak">Buka daftar kontak</button>' : '') +
      (behind.length ? item('ph-target', 'Target belum tercapai', 'Perbanyak penyebaran ke ' + behind.map((s) => SEG_NAME[s] + ' (kurang ' + ((T[s] || 0) - valid(s).length) + ')').join(', ') + '.', '') :
        item('ph-check-circle', 'Semua target tercapai', 'Saatnya fokus ke analisis dan wawancara lanjutan.', '')) +
      item('ph-warning', fmtN(fast) + ' respons perlu dicek', 'Selesai di bawah 30% waktu wajar, kemungkinan asal isi. ' + (D.f.hideFast ? 'Saat ini disembunyikan dari angka.' : 'Saat ini ikut dihitung.'),
        fast ? '<button type="button" class="linkish" data-act="toggle-fast">' + (D.f.hideFast ? 'Ikut hitung' : 'Sembunyikan lagi') + '</button>' : '', fast > 0) +
      (allRecs().some((r) => r.intact === 'diubah') ? item('ph-seal-check', fmtN(allRecs().filter((r) => r.intact === 'diubah').length) + ' baris diubah di Sheet', 'Isinya berbeda dari saat pertama masuk. Periksa siapa yang mengubah lewat Version history di Google Sheet.', '', true) : '') +
      item('ph-lightbulb', unclear + '% bilang konsep kurang jelas', unclear > 25 ? 'Cukup tinggi. Perbaiki cara menjelaskan Bab 3 sebelum riset diperluas.' : 'Masih wajar. Pantau terus, terutama di wawancara.', '', unclear > 25) +
      '</aside>';
  }

  /* ---------- HALAMAN: SEGMEN ---------- */
  function pSegment(seg) {
    const R = recs(seg);
    const d = R.map((r) => r.dur).filter((x) => x > 0);
    const pq = PILOT_Q[seg];
    const c1 = R.filter((r) => r.a.C1);
    let html = '<section class="sec"><dl class="strip">' +
      '<div><dt>Responden ditampilkan</dt><dd>' + fmtN(R.length) + '</dd><div class="sub">dari ' + fmtN((D.recs[seg] || []).length) + ' total</div></div>' +
      '<div><dt>Median waktu isi</dt><dd>' + (d.length ? Math.round(median(d) / 60) + '<small>menit</small>' : '–') + '</dd><div class="sub">' + pct(R.filter((r) => r.mode === 'wawancara').length, R.length) + '% lewat wawancara</div></div>' +
      (pq ? '<div><dt>Kandidat uji coba</dt><dd>' + fmtN(R.filter((r) => r.a[pq] === 'ya').length) + '</dd><div class="sub">+' + fmtN(R.filter((r) => r.a[pq] === 'mungkin').length) + ' menjawab mungkin</div></div>' : '') +
      '<div><dt>Paham konsep Bab 3</dt><dd>' + pct(c1.filter((r) => r.a.C1 === 'jelas').length, c1.length) + '<small>%</small></dd><div class="sub">' + pct(c1.filter((r) => r.a.C1 === 'kurang').length, c1.length) + '% kurang jelas</div></div>' +
      (isMitra() ? '' : '<div><dt>Boleh dihubungi</dt><dd>' + pct(R.filter((r) => r.contact === 'ya').length, R.length) + '<small>%</small></dd><div class="sub">' + fmtN(R.filter((r) => r.contact === 'ya').length) + ' orang</div></div>') +
      '</dl></section>';

    const ins = INSIGHTS[seg];
    html += '<section class="sec" aria-labelledby="h-sfind"><div class="sec-h"><div><h2 id="h-sfind">Temuan kunci</h2><p>Diurutkan dari yang paling menentukan arah produk.</p></div></div>' +
      '<div class="brief three">' + ins.slice(0, 3).map((x) => findCell(seg, x, { hideSeg: true })).join('') + '</div>';
    if (ins.length > 3) {
      html += '<div class="panel" style="margin-top:16px"><div class="panel-h"><div><h3>Sinyal lainnya</h3></div></div><ul class="sig">' + ins.slice(3).map((x) => {
        const r = evalInsight(seg, x);
        return '<li><span class="v">' + (r.ok ? esc(r.val) : '–') + '</span><span class="t">' + (r.ok ? esc(r.text) : 'Belum cukup data untuk ' + x.q + ' (' + r.n + ' jawaban).') + '</span><span class="m">' + (r.ok ? fmtN(r.n) + ' resp.' + confPills(r) : '') + '<button type="button" class="linkish" data-goto="' + seg + '|' + x.q + '">' + x.q + '</button></span></li>';
      }).join('') + '</ul></div>';
    }
    html += '</section>';

    // penjelajah jawaban
    const qs = qsFor(seg);
    const term = D.ui.qs.trim().toLowerCase();
    const ch = D.ui.ch[seg] || 'b1';
    const shown = term ? qs.filter((q) => (q.id + ' ' + q.q.id).toLowerCase().includes(term)) : qs.filter((q) => q.ch === ch);
    html += '<section class="sec" aria-labelledby="h-ans"><div class="sec-h"><div><h2 id="h-ans">Jawaban per bab</h2><p>Setiap kartu menyebut jawaban terbanyak lebih dulu. Ketuk ikon tabel untuk angka lengkap.</p></div></div>' +
      '<div class="chnav-wrap"><div class="chnav" role="group" aria-label="Pilih bab">' + CHS.map((c) => {
        const n = qs.filter((q) => q.ch === c).length;
        return '<button type="button" data-ch="' + c + '" aria-pressed="' + (!term && c === ch) + '">' + CH_NAME[c] + ' <span class="cnt">' + n + '</span></button>';
      }).join('') + '</div><label class="qsearch"><span class="sr-only">Cari pertanyaan</span><i class="ph ph-magnifying-glass"></i><input class="input" type="search" data-qs placeholder="Cari pertanyaan atau kode" value="' + esc(D.ui.qs) + '"></label></div>' +
      (shown.length ? '<div class="qgrid">' + shown.map((q) => qCard(seg, q, R)).join('') + '</div>' : '<div class="empty-big"><i class="ph ph-magnifying-glass"></i>Tidak ada pertanyaan yang cocok dengan “' + esc(D.ui.qs) + '”.</div>') + '</section>';
    return html;
  }

  /* ---------- HALAMAN: SUARA RESPONDEN ---------- */
  function voiceItems() {
    const items = [];
    SEGS.forEach((seg) => recs(seg).forEach((r) => {
      qsFor(seg).filter((q) => q.type === 'tx').forEach((q) => { if (r.a[q.id]) items.push({ seg, qid: q.id, qt: q.q.id, text: r.a[q.id], r }); });
      Object.keys(r.notes).forEach((ch) => items.push({ seg, qid: 'catatan_' + ch, qt: (ch === 'umum' ? 'Catatan wawancara awal' : 'Catatan pewawancara, bab ' + CH_NAME[ch].toLowerCase()) + (r.iv ? ' (' + r.iv + ')' : ''), text: r.notes[ch], r }));
    }));
    return items.sort((a, b) => (b.r.t || 0) - (a.r.t || 0));
  }
  function pVoices() {
    const v = D.voice;
    const all = voiceItems();
    const bySeg = all.filter((it) => v.seg === 'all' || it.seg === v.seg);
    const qCount = {}; const qText = {};
    bySeg.forEach((it) => { qCount[it.qid] = (qCount[it.qid] || 0) + 1; qText[it.qid] = it.qid === 'catatan_umum' ? 'Catatan wawancara awal' : it.qid.startsWith('catatan_') ? 'Catatan pewawancara · ' + CH_NAME[it.qid.slice(8)] : it.qt; });
    const term = v.s.trim().toLowerCase();
    const list = bySeg.filter((it) => (v.q === 'all' || it.qid === v.q) && (!term || it.text.toLowerCase().includes(term)));
    const hl = (t) => { const e = esc(t); if (!term) return e; const re = new RegExp(esc(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'); return e.replace(re, (m) => '<mark>' + m + '</mark>'); };
    const segBtn = (s, label, n, sw) => '<button type="button" data-vseg="' + s + '" aria-pressed="' + (v.seg === s) + '">' + (sw ? '<i class="sw c-' + s + '"></i>' : '') + '<span>' + label + '</span><span class="cnt">' + n + '</span></button>';
    return '<div class="voices"><div class="vfilter"><div><h3>Segmen</h3><div class="vlist">' + segBtn('all', 'Semua segmen', all.length) + SEGS.map((s) => segBtn(s, SEG_NAME[s], all.filter((x) => x.seg === s).length, true)).join('') + '</div></div>' +
      '<div><h3>Pertanyaan</h3><div class="vlist"><button type="button" data-vq="all" aria-pressed="' + (v.q === 'all') + '"><span>Semua pertanyaan</span><span class="cnt">' + bySeg.length + '</span></button>' +
      Object.keys(qCount).sort().map((k) => '<button type="button" data-vq="' + esc(k) + '" aria-pressed="' + (v.q === k) + '"><span>' + esc((k.startsWith('catatan_') ? '' : k + ' · ') + qText[k].slice(0, 70)) + (qText[k].length > 70 ? '…' : '') + '</span><span class="cnt">' + qCount[k] + '</span></button>').join('') + '</div></div></div>' +
      '<div><label class="qsearch" style="width:100%;margin-bottom:14px"><span class="sr-only">Cari cerita</span><i class="ph ph-magnifying-glass"></i><input class="input" type="search" data-vs placeholder="Cari kata, misalnya PMK, blantik, halal" value="' + esc(v.s) + '"></label>' +
      '<p class="small" style="margin:0 0 12px">' + fmtN(list.length) + ' cerita, ditampilkan apa adanya, terbaru di atas.</p>' +
      (list.length ? '<div class="quotes">' + list.slice(0, D.ui.more).map((it) => '<article class="quote"><p class="qq">' + esc(it.qid.startsWith('catatan_') ? it.qt : it.qid + ' · ' + it.qt) + '</p><blockquote>' + hl(it.text) + '</blockquote>' +
        '<div class="qm"><span><i class="sw c-' + it.seg + '"></i>' + SEG_NAME[it.seg] + '</span><span>' + esc(provLabel(it.r.a.U1)) + (it.r.a.U2 ? ', ' + esc(it.r.a.U2) : '') + '</span><span>' + dfmt(it.r.t, { day: 'numeric', month: 'short', year: 'numeric' }) + '</span><span>' + (it.r.origin === 'impor' ? '<span class="pill pill-mute"><i class="ph ph-notebook"></i>Wawancara awal</span>' : it.r.mode === 'wawancara' ? 'Wawancara' : 'Isi sendiri') + '</span>' + (isMitra() ? '' : '<span class="tbl"><span class="idc">' + esc(it.r.id) + '</span></span>') + '</div></article>').join('') + '</div>' +
        (list.length > D.ui.more ? '<button type="button" class="btn btn-secondary btn-block" style="margin-top:12px" data-act="more">Tampilkan lebih banyak</button>' : '')
        : '<div class="empty-big"><i class="ph ph-quotes"></i>Tidak ada cerita yang cocok. Coba hapus kata kunci atau pilih segmen lain.</div>') + '</div></div>';
  }

  /* ---------- HALAMAN: KONTAK ---------- */
  function pContacts() {
    if (!D.user || D.user.peran !== 'founder') return '<div class="empty-big"><i class="ph ph-lock-key"></i>Hanya founder yang dapat melihat kontak responden.</div>';
    const t = (D.raw && D.raw.contacts) || { headers: [], rows: [] };
    const ix = {}; t.headers.forEach((h, i) => { ix[h] = i; });
    const g = (r, k) => (ix[k] != null ? r[ix[k]] : '');
    let rows = t.rows.slice().sort((a, b) => ((g(b, 'uji_coba') === 'ya') - (g(a, 'uji_coba') === 'ya')) || String(g(b, 'waktu_terima')).localeCompare(String(g(a, 'waktu_terima'))));
    const nPilot = rows.filter((r) => g(r, 'uji_coba') === 'ya').length;
    if (D.ui.pilotOnly) rows = rows.filter((r) => g(r, 'uji_coba') === 'ya');
    const lbl = { ya: 'Ya', mungkin: 'Mungkin', tidak: 'Tidak' };
    return '<div class="alert alert-info" style="margin-bottom:20px"><i class="ph ph-shield-check"></i><span><b>Data pribadi.</b> Hanya untuk menghubungi responden terkait riset ini. Jangan dibagikan di luar tim, dan hapus bila responden meminta dengan kodenya.</span></div>' +
      '<div class="panel"><div class="panel-h"><div><h3>' + fmtN(t.rows.length) + ' responden bersedia dihubungi</h3><p>' + nPilot + ' di antaranya kandidat uji coba, ditampilkan paling atas</p></div>' +
      '<div class="period" role="group" aria-label="Tampilkan"><button type="button" data-pilot="0" aria-pressed="' + !D.ui.pilotOnly + '">Semua</button><button type="button" data-pilot="1" aria-pressed="' + D.ui.pilotOnly + '">Kandidat uji coba</button></div></div>' +
      (rows.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nama</th><th>WhatsApp</th><th>Segmen</th><th>Lokasi</th><th>Uji coba</th><th>Masuk</th><th>Kode</th></tr></thead><tbody>' +
        rows.map((r) => { const wa = String(g(r, 'whatsapp')).replace(/\D/g, ''); const uc = String(g(r, 'uji_coba')); return '<tr><td>' + esc(g(r, 'nama') || '–') + '</td><td>' + (wa ? '<a href="https://wa.me/' + wa + '" target="_blank" rel="noopener"><i class="ph ph-whatsapp-logo"></i> +' + esc(wa) + '</a>' : '–') + '</td><td><i class="sw c-' + esc(g(r, 'peran')) + '" style="margin-right:6px;width:8px;height:8px"></i>' + esc(SEG_NAME[g(r, 'peran')] || g(r, 'peran')) + '</td><td>' + esc(provLabel(g(r, 'provinsi'))) + (g(r, 'kab_kota') ? ', ' + esc(g(r, 'kab_kota')) : '') + '</td><td>' + (uc === 'ya' ? '<span class="pill pill-ok"><i class="ph-fill ph-star"></i>Ya</span>' : esc(lbl[uc] || '–')) + '</td><td>' + dfmt(parseDate(g(r, 'waktu_terima'))) + '</td><td class="idc">' + esc(g(r, 'id_respons')) + '</td></tr>'; }).join('') +
        '</tbody></table></div>' : '<div class="empty-big"><i class="ph ph-address-book"></i>Belum ada kontak yang cocok.</div>') + '</div>';
  }

  /* ---------- kerangka ---------- */
  const PAGES = () => {
    const p = [{ id: 'ikhtisar', icon: 'ph-squares-four', label: 'Ikhtisar', title: 'Ikhtisar riset', desc: 'Status pengumpulan data, temuan utama, dan hal yang perlu ditindaklanjuti.' }];
    SEGS.forEach((s) => p.push({ id: s, seg: true, icon: SEG_ICON[s], label: SEG_NAME[s], title: SEG_LONG[s], desc: qsFor(s).length + ' pertanyaan dalam 5 bab. Semua angka mengikuti filter yang aktif.' }));
    p.push({ id: 'suara', icon: 'ph-quotes', label: 'Suara responden', title: 'Suara responden', desc: 'Jawaban cerita dan catatan pewawancara, apa adanya. Sumber kutipan untuk laporan dan materi pitch.' });
    if (isFounder()) {
      p.push({ id: 'kontak', icon: 'ph-address-book', label: 'Kontak', title: 'Kontak responden', desc: 'Responden yang bersedia dihubungi untuk uji coba atau wawancara lanjutan.' });
      p.push({ id: 'impor', admin: true, icon: 'ph-notebook', label: 'Impor data lama', title: 'Impor wawancara lama', desc: 'Masukkan wawancara yang dilakukan sebelum website riset ada. Hasilnya ditandai "Wawancara awal" dan tercatat lengkap.' });
      p.push({ id: 'akses', admin: true, icon: 'ph-users-three', label: 'Akses tim', title: 'Akses tim & mitra', desc: 'Siapa saja yang bisa membuka dashboard ini, apa yang bisa mereka lihat, dan sampai kapan.' });
    }
    if (isMitra()) p.forEach((x) => { if (x.id === 'suara') x.desc = 'Kutipan cerita responden apa adanya. Identitas dan lokasi rinci tidak ditampilkan.'; });
    return p;
  };
  function vSide() {
    const P = PAGES(); const u = D.user || {};
    const initials = String(u.nama || u.u || '?').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();
    const link = (p) => '<a href="#' + p.id + '" data-nav="' + p.id + '"' + (D.page === p.id ? ' aria-current="page"' : '') + '><i class="ph ' + p.icon + '"></i>' + (p.seg ? '<i class="sw c-' + p.id + '"></i>' : '') + '<span>' + p.label + '</span>' + (p.seg && D.recs ? '<span class="cnt">' + recs(p.id).length + '</span>' : '') + '</a>';
    return '<nav class="dx-side" aria-label="Navigasi dashboard"><a class="dx-brand" href="/" aria-label="TernaQin"><img src="/assets/logo.svg" alt="TernaQin" width="95" height="22"><span>Riset</span></a>' +
      '<div class="dx-nav">' + link(P[0]) + '<div class="dx-nav-group">Segmen, urut rantai pasok</div>' + P.filter((p) => p.seg).map(link).join('') +
      '<div class="dx-nav-group">Kualitatif</div>' + P.filter((p) => !p.seg && !p.admin && p.id !== 'ikhtisar').map(link).join('') +
      (P.some((p) => p.admin) ? '<div class="dx-nav-group">Admin</div>' + P.filter((p) => p.admin).map(link).join('') : '') + '</div>' +
      '<div class="dx-side-foot"><span class="avatar" aria-hidden="true">' + esc(initials) + '</span><span class="who"><b>' + esc(u.nama || u.u) + '</b><small>' + esc(roleLabel(u)) + '</small></span>' +
      '<button type="button" class="icon-btn" data-theme-toggle></button><button type="button" class="icon-btn" data-act="pw" aria-label="Ganti password"' + tipAttr('Ganti password') + '><i class="ph ph-key"></i></button><button type="button" class="icon-btn" data-act="logout" aria-label="Keluar"' + tipAttr('Keluar') + '><i class="ph ph-sign-out"></i></button></div></nav>';
  }
  function provinces() {
    const c = {}; SEGS.forEach((s) => (D.recs[s] || []).forEach((r) => { if (r.a.U1) c[r.a.U1] = (c[r.a.U1] || 0) + 1; }));
    return Object.keys(c).sort((a, b) => c[b] - c[a]).map((p) => ({ v: p, n: c[p] }));
  }
  function activeCount() { return (D.f.prov !== 'all') + (D.f.mode !== 'all') + (D.f.origin !== 'all') + (!D.f.hideFast) + (SEGS.includes(D.page) && D.cond.q && D.cond.v !== '' ? 1 : 0); }
  function vFilterPop() {
    if (!D.ui.filterOpen) return '';
    const seg = SEGS.includes(D.page) ? D.page : null;
    let cond = '';
    if (seg) {
      const qs = qsFor(seg).filter((q) => ['rc', 'cb', 'sk', 'select'].includes(q.type));
      const cq = qs.find((q) => q.id === D.cond.q);
      cond = '<div class="field"><label for="fcq">Hanya responden yang menjawab</label><select class="select" id="fcq" data-f="condq"><option value="">Semua responden ' + SEG_NAME[seg] + '</option>' +
        qs.map((q) => '<option value="' + q.id + '"' + (D.cond.q === q.id ? ' selected' : '') + '>' + q.id + ' · ' + esc(q.q.id.length > 54 ? q.q.id.slice(0, 54) + '…' : q.q.id) + '</option>').join('') + '</select></div>' +
        (cq ? '<div class="field"><label for="fcv">dengan jawaban</label><select class="select" id="fcv" data-f="condv"><option value="">Pilih jawaban</option>' +
          (cq.type === 'sk' ? [1, 2, 3, 4, 5].map((i) => '<option value="' + i + '"' + (String(D.cond.v) === String(i) ? ' selected' : '') + '>Skor ' + i + '</option>').join('') :
            cq.opts.map((o) => '<option value="' + esc(o.v) + '"' + (D.cond.v === o.v ? ' selected' : '') + '>' + esc(o.t.id) + '</option>').join('')) + '</select></div>' : '');
    }
    return '<div class="fpop" role="dialog" aria-label="Filter data"><h2>Filter data</h2>' +
      '<div class="field"><label for="fprov">Provinsi</label><select class="select" id="fprov" data-f="prov"><option value="all">Semua provinsi</option>' + provinces().map((p) => '<option value="' + esc(p.v) + '"' + (D.f.prov === p.v ? ' selected' : '') + '>' + esc(provLabel(p.v)) + ' (' + p.n + ')</option>').join('') + '</select></div>' +
      '<div class="field"><label for="fmode">Cara pengisian</label><select class="select" id="fmode" data-f="mode"><option value="all">Semua</option><option value="mandiri"' + (D.f.mode === 'mandiri' ? ' selected' : '') + '>Isi sendiri</option><option value="wawancara"' + (D.f.mode === 'wawancara' ? ' selected' : '') + '>Wawancara</option></select></div>' +
      (hasImports() ? '<div class="field"><label for="forg">Asal data</label><select class="select" id="forg" data-f="origin"><option value="all">Semua</option><option value="web"' + (D.f.origin === 'web' ? ' selected' : '') + '>Survei website</option><option value="impor"' + (D.f.origin === 'impor' ? ' selected' : '') + '>Wawancara awal (impor)</option></select></div>' : '') +
      cond +
      (isMitra() ? '' : '<label class="check-row"><input type="checkbox" data-f="hideFast"' + (D.f.hideFast ? ' checked' : '') + '><span>Sembunyikan respons terlalu cepat<small>Selesai di bawah 30% waktu wajar, kemungkinan asal isi.</small></span></label>') +
      '<div class="fpop-foot"><button type="button" class="btn btn-ghost btn-sm" data-act="filter-reset">Atur ulang</button><button type="button" class="btn btn-primary btn-sm" data-act="filter-close">Selesai</button></div></div>';
  }
  function vChips() {
    const chips = [];
    if (D.f.prov !== 'all') chips.push(['prov', provLabel(D.f.prov)]);
    if (D.f.mode !== 'all') chips.push(['mode', D.f.mode === 'mandiri' ? 'Isi sendiri' : 'Wawancara']);
    if (D.f.origin !== 'all') chips.push(['origin', D.f.origin === 'web' ? 'Survei website' : 'Wawancara awal']);
    if (!D.f.hideFast) chips.push(['hideFast', 'Termasuk respons terlalu cepat']);
    if (SEGS.includes(D.page) && D.cond.q && D.cond.v !== '') { const q = qById(D.page, D.cond.q); chips.push(['cond', D.cond.q + ': ' + (q.type === 'sk' ? 'skor ' + D.cond.v : optLabel(q, D.cond.v))]); }
    const segs = SEGS.includes(D.page) ? [D.page] : SEGS;
    const shown = segs.reduce((a, s) => a + recs(s).length, 0);
    const total = segs.reduce((a, s) => a + (D.recs[s] || []).length, 0);
    return '<div class="chips-row"><span>Menampilkan <b style="color:var(--ink)">' + fmtN(shown) + '</b> dari ' + fmtN(total) + ' respons</span>' +
      chips.map((c) => '<span class="fchip">' + esc(c[1]) + '<button type="button" data-clear="' + c[0] + '" aria-label="Hapus filter ' + esc(c[1]) + '"><i class="ph ph-x"></i></button></span>').join('') +
      (chips.length > 1 ? '<button type="button" class="linkish" data-act="filter-reset">Hapus semua</button>' : '') + '</div>';
  }
  function vHead(p) {
    const seg = SEGS.includes(p.id) ? p.id : null;
    let right = '';
    if (seg) {
      const n = valid(seg).length, t = (CFG.TARGETS || {})[seg] || 0;
      right = '<div class="seg-progress"><div class="lbl"><span>Target responden</span><span><b>' + n + '</b> / ' + t + '</span></div><div class="bar"><i style="width:' + Math.min(100, pct(n, t)) + '%"></i></div></div>';
    }
    const ac = activeCount();
    const showFilters = p.id !== 'kontak' && p.id !== 'akses' && p.id !== 'impor';
    return '<header class="dx-head"><div class="dx-head-row"><div><h1>' + (seg ? '<i class="sw c-' + seg + '"></i>' : '') + esc(p.title) + '</h1><p class="desc">' + esc(p.desc) + '</p></div>' + right + '</div>' +
      (showFilters ? '<div class="dx-head-row" style="margin-top:20px;align-items:center"><div class="period" role="group" aria-label="Periode">' + [['all', 'Semua waktu'], ['90', '90 hari'], ['30', '30 hari'], ['7', '7 hari']].map((x) => '<button type="button" data-period="' + x[0] + '" aria-pressed="' + (D.f.period === x[0]) + '">' + x[1] + '</button>').join('') + '</div>' +
        '<div class="dx-tools"><span class="dx-updated"><i class="ph ph-clock"></i>Diperbarui ' + (D.updated ? D.updated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '–') + (D.demo ? '' : ' · otomatis tiap 3 menit') + '</span>' +
        '<button type="button" class="btn btn-secondary btn-38" data-act="refresh" aria-label="Muat ulang data"' + tipAttr('Ambil data terbaru dari Google Sheet') + '><i class="ph ph-arrows-clockwise' + (D.loading ? ' spin' : '') + '"></i></button>' +
        '<button type="button" class="btn btn-secondary btn-38" data-act="filter-toggle" aria-expanded="' + D.ui.filterOpen + '"><i class="ph ph-funnel"></i>Filter' + (ac ? ' <span class="badge-n">' + ac + '</span>' : '') + '</button>' +
        (isMitra() ? '' : '<button type="button" class="btn btn-secondary btn-38" data-act="export"><i class="ph ph-download-simple"></i>Unduh Excel</button>') + vFilterPop() + '</div></div>' + vChips() : '') +
      '</header>';
  }
  function vShell(inner) {
    const P = PAGES(); const p = P.find((x) => x.id === D.page) || P[0];
    return '<div class="dx' + (D.ui.nav ? ' nav-open' : '') + '">' + vSide() + '<div class="dx-scrim" data-act="menu"></div><div class="dx-content">' +
      '<div class="dx-mbar"><button type="button" class="icon-btn" data-act="menu" aria-label="Buka menu"><i class="ph ph-list"></i></button><img src="/assets/logo.svg" alt="TernaQin"><span class="t">' + esc(p.label) + '</span><span style="flex:1"></span><button type="button" class="icon-btn" data-theme-toggle></button></div>' +
      (D.demo ? '<div class="dx-demo" role="note"><i class="ph ph-flask"></i>Data demo: angka acak untuk mencoba tampilan, bukan hasil riset. Jangan dipakai untuk keputusan atau materi investor.</div>' : '') +
      (isMitra() ? '<div class="dx-mitra" role="note"><i class="ph ph-handshake"></i><span>Akses mitra untuk <b>' + esc(D.user.nama) + '</b>' + (D.user.org ? ' (' + esc(D.user.org) + ')' : '') + (D.user.aksesSampai ? ', berlaku sampai ' + dateID(D.user.aksesSampai) : '') + '. Data riset rahasia, mohon tidak disebarluaskan.</span></div>' : '') +
      (D.recs ? vHead(p) : '') + '<main class="dx-main" id="dmain">' + inner + '</main></div></div>';
  }

  /* ---------- GANTI PASSWORD ---------- */
  function vChangePw() {
    const forced = !!(D.user && D.user.mustChange);
    return '<div class="login-wrap"><div class="login"><div class="login-card">' +
      '<div class="login-top"><img src="/assets/logo.svg" alt="TernaQin"><button type="button" class="icon-btn icon-btn-line" data-theme-toggle></button></div>' +
      '<h1>' + (forced ? 'Buat password Anda' : 'Ganti password') + '</h1>' +
      '<p class="sub">' + (forced ? 'Halo ' + esc(D.user.nama) + '. Anda masuk dengan password sementara. Buat password sendiri sebelum melanjutkan.' : 'Setelah diganti, sesi di perangkat lain otomatis keluar.') + '</p>' +
      '<form id="pwForm" novalidate>' +
      '<div class="field"><label for="pwo">' + (forced ? 'Password sementara' : 'Password saat ini') + '</label><input class="input" id="pwo" type="password" autocomplete="current-password" required></div>' +
      '<div class="field" style="margin-top:12px"><label for="pwn">Password baru</label><input class="input" id="pwn" type="password" autocomplete="new-password" required></div>' +
      '<div class="field" style="margin-top:12px"><label for="pwr">Ulangi password baru</label><input class="input" id="pwr" type="password" autocomplete="new-password" required></div>' +
      '<ul class="pw-rules"><li>Minimal 10 karakter. Kalimat pendek mudah diingat dan kuat, misalnya <i>kandang-sapi-belang-26</i>.</li><li>Berbeda dari password sementara.</li><li>Tidak mengandung username (' + esc(D.user.u) + ').</li></ul>' +
      '<div id="pwerr">' + (D.ui.pwErr ? '<div class="alert alert-danger" role="alert" style="margin-top:12px"><i class="ph ph-warning-circle"></i><span>' + esc(D.ui.pwErr) + '</span></div>' : '') + '</div>' +
      '<button type="submit" class="btn btn-primary btn-block"' + (D.ui.busy ? ' disabled' : '') + '>' + (D.ui.busy ? '<i class="ph ph-spinner-gap spin"></i> Menyimpan' : 'Simpan password') + '</button></form>' +
      (forced ? '<button type="button" class="btn btn-ghost btn-block" style="margin-top:8px" data-act="logout">Keluar</button>' : '<button type="button" class="btn btn-ghost btn-block" style="margin-top:8px" data-act="pw-cancel">Batal</button>') +
      '</div></div></div>';
  }
  async function submitPw() {
    const o = $('#pwo').value, n = $('#pwn').value, r = $('#pwr').value;
    if (!o || !n) { D.ui.pwErr = 'Isi semua kolom.'; render(); return; }
    if (n !== r) { D.ui.pwErr = 'Ulangan password baru tidak sama.'; render(); return; }
    if (n.length < 10) { D.ui.pwErr = 'Password baru minimal 10 karakter.'; render(); return; }
    D.ui.busy = true; D.ui.pwErr = ''; render();
    try {
      const res = await api({ action: 'changePassword', session: D.session, oldPassword: o, newPassword: n });
      D.ui.busy = false;
      if (!res.ok) {
        D.ui.pwErr = res.error === 'salah' ? 'Password ' + (D.user.mustChange ? 'sementara' : 'saat ini') + ' salah.' : res.error === 'sesi' ? 'Sesi berakhir. Silakan masuk lagi.' : (res.message || 'Gagal menyimpan.');
        if (res.error === 'sesi') { logout(D.ui.pwErr); return; }
        render(); return;
      }
      D.session = res.session; D.user = res.user; sess.set({ session: res.session, user: res.user });
      D.view = 'app'; toast('Password tersimpan');
      if (!D.recs) load(); else render();
    } catch (e) { D.ui.busy = false; D.ui.pwErr = 'Server tidak bisa dihubungi. Coba lagi.'; render(); }
  }

  /* ---------- HALAMAN: AKSES TIM & MITRA (founder) ---------- */
  const addDefault = () => ({ kat: 'internal', nama: '', username: '', userEdited: false, peran: 'riset', org: '', sampai: plusDays(30), catatan: '' });
  async function loadUsers() {
    D.usersErr = '';
    try {
      const res = await api({ action: 'users', session: D.session });
      if (!res.ok) { if (res.error === 'sesi') { logout('Sesi berakhir. Silakan masuk lagi.'); return; } D.usersErr = 'Daftar akun gagal dimuat (' + res.error + ').'; }
      else D.users = res.users;
    } catch (e) { D.usersErr = 'Server tidak bisa dihubungi.'; }
    if (D.page === 'akses') render();
  }
  function statusPill(u) {
    if (u.status === 'nonaktif') return '<span class="pill pill-mute"><i class="ph ph-prohibit"></i>Nonaktif</span>';
    if (u.status === 'berakhir') return '<span class="pill pill-warn"><i class="ph ph-clock-countdown"></i>Akses berakhir</span>';
    if (u.mustChange) return '<span class="pill pill-mute"><i class="ph ph-hourglass"></i>Belum login</span>';
    if (u.kategori === 'mitra' && u.aksesSampai && daysLeft(u.aksesSampai) <= 7) return '<span class="pill pill-warn"><i class="ph ph-clock-countdown"></i>Sisa ' + daysLeft(u.aksesSampai) + ' hari</span>';
    return '<span class="pill pill-ok"><i class="ph-fill ph-check-circle"></i>Aktif</span>';
  }
  function userRow(u) {
    const self = D.user && u.u === D.user.u;
    const confirm = D.ui.confirm === u.u;
    const acts = confirm
      ? '<span class="ua-confirm">Hapus akun ini?</span><button type="button" class="btn btn-sm ua-danger" data-uact="del-yes" data-user="' + esc(u.u) + '">Ya, hapus</button><button type="button" class="btn btn-ghost btn-sm" data-uact="del-no" data-user="' + esc(u.u) + '">Batal</button>'
      : '<button type="button" class="btn btn-ghost btn-sm" data-uact="reset" data-user="' + esc(u.u) + '"' + tipAttr('Buat password sementara baru. Sesi lama orang ini otomatis keluar.') + '><i class="ph ph-key"></i>Reset password</button>' +
        (u.kategori === 'mitra' ? '<button type="button" class="btn btn-ghost btn-sm" data-uact="extend" data-user="' + esc(u.u) + '"' + tipAttr('Tambah 30 hari dari hari ini') + '><i class="ph ph-calendar-plus"></i>Perpanjang 30 hari</button>' : '') +
        (self ? '' : '<button type="button" class="btn btn-ghost btn-sm" data-uact="toggle" data-user="' + esc(u.u) + '"><i class="ph ' + (u.status === 'nonaktif' ? 'ph-play' : 'ph-pause') + '"></i>' + (u.status === 'nonaktif' ? 'Aktifkan' : 'Nonaktifkan') + '</button>' +
          '<button type="button" class="icon-sq" data-uact="del" data-user="' + esc(u.u) + '" aria-label="Hapus akun ' + esc(u.nama) + '"' + tipAttr('Hapus akun') + '><i class="ph ph-trash"></i></button>');
    return '<tr' + (u.status !== 'aktif' ? ' class="dim"' : '') + '><td><b>' + esc(u.nama) + (self ? ' <span class="pill pill-mute">Anda</span>' : '') + '</b><div class="sub">' + esc(u.u) + '</div></td>' +
      '<td>' + (u.kategori === 'mitra' ? esc(u.org || '–') + (u.catatan ? '<div class="sub">' + esc(u.catatan) + '</div>' : '') : esc(PERAN_LBL[u.peran])) + '</td>' +
      '<td>' + statusPill(u) + '</td>' +
      (u.kategori === 'mitra' ? '<td>' + dateID(u.aksesSampai) + '</td>' : '') +
      '<td>' + (u.loginTerakhir ? ago(new Date(u.loginTerakhir)) : '–') + '</td>' +
      '<td><div class="ua">' + acts + '</div></td></tr>';
  }
  function vAddForm() {
    const a = D.ui.add || (D.ui.add = addDefault());
    const mitra = a.kat === 'mitra';
    return '<div class="panel add-panel"><div class="panel-h"><div><h3>Tambah akun</h3><p>Password sementara dibuat otomatis dan wajib diganti saat orang itu login pertama kali.</p></div></div>' +
      '<form id="addForm" novalidate>' +
      '<div class="kat" role="radiogroup" aria-label="Kategori akun">' +
      '<button type="button" role="radio" class="kat-opt" data-kat="internal" aria-checked="' + !mitra + '"><i class="ph ph-users-three"></i><span><b>Tim internal TernaQin</b><small>Founder atau tim riset. Melihat seluruh data riset.</small></span></button>' +
      '<button type="button" role="radio" class="kat-opt" data-kat="mitra" aria-checked="' + mitra + '"><i class="ph ph-handshake"></i><span><b>Mitra / investor</b><small>Hanya temuan & grafik. Tanpa data pribadi, tanpa unduh. Ada batas waktu.</small></span></button></div>' +
      '<div class="form-grid">' +
      '<div class="field"><label for="an">Nama lengkap</label><input class="input" id="an" data-add="nama" value="' + esc(a.nama) + '" placeholder="' + (mitra ? 'Contoh: Budi Santoso' : 'Contoh: Raka Pratama') + '" maxlength="60"></div>' +
      '<div class="field"><label for="au">Username</label><input class="input" id="au" data-add="username" value="' + esc(a.username) + '" placeholder="otomatis dari nama" autocapitalize="none" spellcheck="false" maxlength="30"><p class="helper">Huruf kecil, angka, titik, minus, garis bawah.</p></div>' +
      (mitra
        ? '<div class="field"><label for="ao">Organisasi</label><input class="input" id="ao" data-add="org" value="' + esc(a.org) + '" placeholder="Nama perusahaan, dana ventura, atau lembaga" maxlength="60"></div>' +
          '<div class="field"><label for="as">Akses sampai</label><input class="input" id="as" type="date" data-add="sampai" value="' + esc(a.sampai) + '" min="' + plusDays(0) + '"><p class="helper">Setelah tanggal ini, akun otomatis tidak bisa masuk.</p></div>' +
          '<div class="field span-2"><label for="ac">Catatan (opsional)</label><input class="input" id="ac" data-add="catatan" value="' + esc(a.catatan) + '" placeholder="Contoh: due diligence pre-seed, pertemuan 5 Nov" maxlength="160"></div>'
        : '<div class="field span-2"><span class="lbl">Peran</span><div class="kat kat-sm" role="radiogroup" aria-label="Peran">' +
          '<button type="button" role="radio" class="kat-opt" data-peran="riset" aria-checked="' + (a.peran !== 'founder') + '"><span><b>Tim riset</b><small>Semua data & unduh Excel. Tanpa kontak responden, tanpa kelola akun.</small></span></button>' +
          '<button type="button" role="radio" class="kat-opt" data-peran="founder" aria-checked="' + (a.peran === 'founder') + '"><span><b>Founder</b><small>Akses penuh, termasuk kontak responden dan halaman ini.</small></span></button></div></div>') +
      '</div>' +
      (D.ui.addErr ? '<div class="alert alert-danger" role="alert" style="margin-top:14px"><i class="ph ph-warning-circle"></i><span>' + esc(D.ui.addErr) + '</span></div>' : '') +
      '<div class="form-foot"><button type="button" class="btn btn-ghost btn-sm" data-act="add-cancel">Batal</button><button type="submit" class="btn btn-primary btn-sm"' + (D.ui.busy ? ' disabled' : '') + '><i class="ph ph-user-plus"></i>' + (D.ui.busy ? 'Membuat' : 'Buat akun') + '</button></div></form></div>';
  }
  function credMessage(c) {
    return 'Halo ' + c.nama + ', berikut akses dashboard riset TernaQin.\n\n' +
      'Alamat: ' + SITE + '/dashboard\nUsername: ' + c.u + '\nPassword sementara: ' + c.password + '\n\n' +
      'Saat login pertama, Anda akan diminta membuat password sendiri.' +
      (c.kategori === 'mitra' && c.aksesSampai ? '\nAkses berlaku sampai ' + dateID(c.aksesSampai) + '.' : '') +
      '\nMohon tidak membagikan akses ini ke orang lain.';
  }
  function vCred() {
    const c = D.ui.cred; if (!c) return '';
    return '<div class="cred" role="status"><div class="cred-h"><i class="ph-fill ph-check-circle"></i><div><b>' + (c.reset ? 'Password direset untuk ' : 'Akun dibuat untuk ') + esc(c.nama) + '</b><p>Kirim data di bawah ini lewat chat pribadi, bukan grup. Password ini tidak bisa dilihat lagi setelah kotak ini ditutup.</p></div></div>' +
      '<div class="cred-grid"><div><span>Username</span><b class="mono">' + esc(c.u) + '</b></div><div><span>Password sementara</span><b class="mono pw">' + esc(c.password) + '</b></div></div>' +
      '<div class="cred-actions"><button type="button" class="btn btn-primary btn-sm" data-act="copy-msg"><i class="ph ph-copy"></i>Salin pesan siap kirim</button><button type="button" class="btn btn-secondary btn-sm" data-act="copy-pw"><i class="ph ph-key"></i>Salin password saja</button><button type="button" class="btn btn-ghost btn-sm" data-act="cred-close">Sudah saya kirim, tutup</button></div></div>';
  }
  function pAkses() {
    if (!isFounder()) return '<div class="empty-big"><i class="ph ph-lock-key"></i>Hanya founder yang dapat mengelola akses.</div>';
    if (D.usersErr) return '<div class="alert alert-danger"><i class="ph ph-warning-circle"></i><span>' + esc(D.usersErr) + '</span><button type="button" class="btn btn-secondary btn-sm" data-act="users-reload">Coba lagi</button></div>';
    if (!D.users) return '<div class="d-loading"><div><i class="ph ph-spinner-gap spin"></i><p>Memuat daftar akun</p></div></div>';
    const internal = D.users.filter((u) => u.kategori === 'internal');
    const mitra = D.users.filter((u) => u.kategori === 'mitra');
    const mAktif = mitra.filter((u) => u.status === 'aktif');
    const soon = mAktif.filter((u) => u.aksesSampai && daysLeft(u.aksesSampai) <= 7).length;
    const tbl = (rows, isM) => rows.length ? '<div class="tbl-wrap"><table class="tbl ua-tbl"><thead><tr><th>Nama</th><th>' + (isM ? 'Organisasi' : 'Peran') + '</th><th>Status</th>' + (isM ? '<th>Akses sampai</th>' : '') + '<th>Login terakhir</th><th><span class="sr-only">Tindakan</span></th></tr></thead><tbody>' + rows.map(userRow).join('') + '</tbody></table></div>'
      : '<div class="empty">' + (isM ? 'Belum ada akun mitra. Buat saat akan presentasi ke investor atau calon mitra, lalu atur tanggal berakhirnya.' : 'Belum ada anggota tim lain.') + '</div>';
    return vCred() +
      '<section class="sec"><dl class="strip"><div><dt>Tim internal</dt><dd>' + internal.filter((u) => u.status === 'aktif').length + '</dd><div class="sub">' + internal.filter((u) => u.peran === 'founder' && u.status === 'aktif').length + ' founder aktif</div></div>' +
      '<div><dt>Mitra aktif</dt><dd>' + mAktif.length + '</dd><div class="sub">dari ' + mitra.length + ' akun mitra</div></div>' +
      '<div><dt>Akses mitra berakhir ≤ 7 hari</dt><dd>' + soon + '</dd><div class="sub">perpanjang bila masih diperlukan</div></div></dl></section>' +
      '<section class="sec"><div class="sec-h"><div><h2>Siapa melihat apa</h2></div>' + (D.ui.addOpen ? '' : '<button type="button" class="btn btn-primary btn-38" data-act="add-open"><i class="ph ph-user-plus"></i>Tambah akun</button>') + '</div>' +
      (D.ui.addOpen ? vAddForm() : '') +
      '<div class="matrix"><table class="tbl"><thead><tr><th></th><th>Founder</th><th>Tim riset</th><th>Mitra</th></tr></thead><tbody>' +
      [['Ikhtisar, temuan & grafik', 1, 1, 1], ['Kutipan cerita responden', 1, 1, 'Tanpa ID & lokasi rinci'], ['Catatan pewawancara', 1, 1, 0], ['Unduh Excel data mentah', 1, 1, 0], ['Kontak responden', 1, 0, 0], ['Kelola akun (halaman ini)', 1, 0, 0], ['Batas waktu akses', 'Tidak', 'Tidak', 'Ya, wajib']].map((r) => '<tr><td>' + r[0] + '</td>' + r.slice(1).map((v) => '<td>' + (v === 1 ? '<i class="ph-fill ph-check-circle ok"></i>' : v === 0 ? '<i class="ph ph-minus no"></i>' : esc(v)) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div></section>' +
      '<section class="sec"><div class="sec-h"><div><h2>Tim internal TernaQin</h2><p>Founder dan tim riset.</p></div></div><div class="panel">' + tbl(internal, false) + '</div></section>' +
      '<section class="sec"><div class="sec-h"><div><h2>Mitra & investor</h2><p>Melihat versi data yang sudah disaring di server. Setiap kali mereka membuka data, tercatat di tab Log pada Google Sheet.</p></div></div><div class="panel">' + tbl(mitra, true) + '</div></section>';
  }
  async function userAction(act, username) {
    if (act === 'del') { D.ui.confirm = username; render(); return; }
    if (act === 'del-no') { D.ui.confirm = ''; render(); return; }
    const u = D.users.find((x) => x.u === username);
    let body;
    if (act === 'reset') body = { action: 'userReset', username };
    else if (act === 'toggle') body = { action: 'userUpdate', username, changes: { aktif: u.status === 'nonaktif' } };
    else if (act === 'extend') body = { action: 'userUpdate', username, changes: { aktif: true, aksesSampai: plusDays(30) } };
    else if (act === 'del-yes') body = { action: 'userDelete', username };
    body.session = D.session;
    try {
      const res = await api(body);
      if (!res.ok) { toast(res.message || (res.error === 'sesi' ? 'Sesi berakhir' : 'Gagal: ' + res.error)); if (res.error === 'sesi') logout('Sesi berakhir. Silakan masuk lagi.'); return; }
      if (act === 'reset') { D.ui.cred = { u: res.user.u, nama: res.user.nama, password: res.password, kategori: res.user.kategori, aksesSampai: res.user.aksesSampai, reset: true }; window.scrollTo(0, 0); }
      else toast(act === 'toggle' ? (u.status === 'nonaktif' ? 'Akun diaktifkan' : 'Akun dinonaktifkan') : act === 'extend' ? 'Akses diperpanjang sampai ' + dateID(plusDays(30)) : 'Akun dihapus');
      D.ui.confirm = '';
      await loadUsers();
    } catch (e) { toast('Server tidak bisa dihubungi'); }
  }
  async function submitAdd() {
    const a = D.ui.add;
    const user = { username: a.username.trim().toLowerCase(), nama: a.nama.trim(), kategori: a.kat, peran: a.kat === 'mitra' ? 'mitra' : a.peran, org: a.org.trim(), aksesSampai: a.sampai, catatan: a.catatan.trim() };
    if (!user.nama) { D.ui.addErr = 'Nama wajib diisi.'; render(); return; }
    if (!/^[a-z0-9._-]{3,30}$/.test(user.username)) { D.ui.addErr = 'Username 3–30 karakter: huruf kecil, angka, titik, minus, atau garis bawah.'; render(); return; }
    if (a.kat === 'mitra' && !user.org) { D.ui.addErr = 'Isi nama organisasi mitra, supaya jelas akses ini untuk siapa.'; render(); return; }
    D.ui.busy = true; D.ui.addErr = ''; render();
    try {
      const res = await api({ action: 'userAdd', session: D.session, user });
      D.ui.busy = false;
      if (!res.ok) { D.ui.addErr = res.message || 'Gagal membuat akun (' + res.error + ').'; render(); return; }
      D.ui.cred = { u: res.user.u, nama: res.user.nama, password: res.password, kategori: res.user.kategori, aksesSampai: res.user.aksesSampai };
      D.ui.addOpen = false; D.ui.add = null;
      window.scrollTo(0, 0);
      await loadUsers();
    } catch (e) { D.ui.busy = false; D.ui.addErr = 'Server tidak bisa dihubungi.'; render(); }
  }

  /* ---------- HALAMAN: IMPOR WAWANCARA LAMA (founder) ---------- */
  const TEMPLATE_URL = '/assets/template/data-wawancara.xlsx';
  const SHEET_SEG = { peternak: 'peternak', rph: 'rph', pedagang: 'pedagang', konsumen: 'konsumen' };
  const normTxt = (t) => String(t == null ? '' : t).toLowerCase().replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim();
  function toISODate(v) {
    const pad = (n) => String(n).padStart(2, '0');
    if (v instanceof Date && !isNaN(v)) return v.getFullYear() + '-' + pad(v.getMonth() + 1) + '-' + pad(v.getDate());
    if (typeof v === 'number' && window.XLSX) { const d = XLSX.SSF.parse_date_code(v); if (d) return d.y + '-' + pad(d.m) + '-' + pad(d.d); }
    const t = String(v || '').trim();
    let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return m[1] + '-' + pad(m[2]) + '-' + pad(m[3]);
    m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/); if (m) return m[3] + '-' + pad(m[2]) + '-' + pad(m[1]);
    return '';
  }
  function matchOpt(q, raw) {
    const t = normTxt(raw);
    return (q.opts || []).find((o) => normTxt(o.t.id) === t || normTxt(o.t.en) === t || o.v === String(raw).trim());
  }
  /** Membaca file template yang sudah diisi → baris siap kirim + daftar kesalahan & peringatan. */
  function parseImport(wb) {
    const out = { rows: [], errors: [], warnings: [], counts: { peternak: 0, rph: 0, pedagang: 0, konsumen: 0 }, sheetsFound: 0 };
    const today = toISODate(new Date());
    wb.SheetNames.forEach((name) => {
      const seg = SHEET_SEG[normTxt(name)];
      if (!seg) return;
      out.sheetsFound++;
      const grid = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: '' });
      if (!grid.length) return;
      const codes = grid[0].map((c) => String(c).trim());
      const qs = qsFor(seg);
      const colQ = codes.map((c) => {
        if (!c) return null;
        if (c === 'tanggal_wawancara' || c === 'pewawancara' || c === 'catatan_umum') return { meta: c };
        const q = qs.find((x) => x.id === c);
        if (q) return { q };
        const mx = qs.find((x) => x.type === 'mx' && c.indexOf(x.id + '_') === 0 && x.rows.some((r) => x.id + '_' + r.v === c));
        if (mx) return { q: mx, row: c.slice(mx.id.length + 1) };
        return { unknown: c };
      });
      if (codes.indexOf('tanggal_wawancara') < 0) { out.errors.push({ where: name, msg: 'Baris 1 tidak berisi kode kolom template. Pakai template terbaru dan jangan ubah baris 1–3.' }); return; }
      colQ.forEach((c) => { if (c && c.unknown) out.warnings.push({ where: name, msg: 'Kolom "' + c.unknown + '" tidak dikenal dan diabaikan.' }); });
      for (let r = 3; r < grid.length; r++) {
        const row = grid[r];
        if (!row.some((v, j) => colQ[j] && !colQ[j].unknown && String(v).trim() !== '')) continue;
        const ref = name + '!' + (r + 1);
        const err = (msg) => out.errors.push({ where: ref, msg });
        let tanggal = '', iv = '', note = '';
        const fields = []; let answered = 0;
        row.forEach((cell, j) => {
          const c = colQ[j]; if (!c || c.unknown) return;
          const raw = cell instanceof Date ? cell : String(cell).trim();
          if (c.meta === 'tanggal_wawancara') { tanggal = toISODate(cell); if (!tanggal) err('Tanggal wawancara tidak terbaca ("' + raw + '"). Pakai format 12/08/2026.'); return; }
          if (c.meta === 'pewawancara') { iv = raw; return; }
          if (c.meta === 'catatan_umum') { note = raw; return; }
          if (raw === '') return;
          const q = c.q; const col = codes[j];
          if (q.type === 'rc' || q.type === 'select') {
            const o = matchOpt(q, raw);
            if (!o) { err(col + ': "' + raw + '" bukan pilihan yang dikenal.'); return; }
            fields.push([q.id, o.v], [q.id + '_teks', o.t.id]);
          } else if (q.type === 'cb') {
            const parts = String(raw).split(/[;\n]+/).map((x) => x.trim()).filter(Boolean);
            const opts = []; let bad = false;
            parts.forEach((pt) => { const o = matchOpt(q, pt); if (!o) { bad = true; err(col + ': "' + pt + '" bukan pilihan yang dikenal.'); } else if (!opts.includes(o)) opts.push(o); });
            if (bad) return;
            if (opts.length > 1 && opts.some((o) => o.exclusive)) { err(col + ': "' + opts.find((o) => o.exclusive).t.id + '" tidak boleh digabung dengan pilihan lain.'); return; }
            if (q.max && opts.length > q.max) out.warnings.push({ where: ref, msg: col + ': ' + opts.length + ' pilihan, melebihi batas survei (' + q.max + '). Tetap diimpor.' });
            fields.push([q.id, opts.map((o) => o.v).join('; ')], [q.id + '_teks', opts.map((o) => o.t.id).join('; ')]);
          } else if (q.type === 'sk' || q.type === 'mx') {
            const n = Number(raw);
            if (!(Number.isInteger(n) && n >= 1 && n <= 5)) { err(col + ': skor harus angka 1–5, bukan "' + raw + '".'); return; }
            fields.push([q.type === 'mx' ? q.id + '_' + c.row : q.id, String(n)]);
          } else {
            fields.push([q.id, String(raw).slice(0, 3000)]);
          }
          if (!/^U[1-3]$/.test(q.id)) answered++;
        });
        if (!tanggal && !out.errors.some((e) => e.where === ref)) err('Tanggal wawancara wajib diisi.');
        if (tanggal && (tanggal < '2020-01-01' || tanggal > today)) err('Tanggal ' + tanggal + ' di luar rentang wajar (2020 sampai hari ini).');
        if (!iv) err('Nama pewawancara wajib diisi.');
        if (!fields.some((f) => f[0] === 'U1')) err('Provinsi (U1) wajib diisi.');
        if (answered === 0) err('Belum ada jawaban pertanyaan selain profil.');
        else if (answered < 3) out.warnings.push({ where: ref, msg: 'Hanya ' + answered + ' pertanyaan terjawab.' });
        if (note) fields.push(['catatan_umum', note.slice(0, 3000)]);
        out.rows.push({ ref, seg, tanggal, pewawancara: iv, fields, answered });
        out.counts[seg]++;
      }
    });
    if (!out.sheetsFound) out.errors.push({ where: 'File', msg: 'Tidak ada tab Peternak, RPH, Pedagang, atau Konsumen. Pastikan memakai template TernaQin.' });
    else if (!out.rows.length) out.errors.push({ where: 'File', msg: 'Tidak ada baris data. Isi mulai baris ke-4.' });
    if (out.rows.length > 500) out.errors.push({ where: 'File', msg: out.rows.length + ' baris; maksimal 500 per impor. Bagi menjadi beberapa file.' });
    return out;
  }
  async function readImportFile(file) {
    const I = D.imp;
    I.parsed = null; I.err = ''; I.result = null; I.fileName = file.name; I.busy = true; render();
    try {
      if (!/\.xlsx?$/i.test(file.name)) throw new Error('Pilih file Excel (.xlsx). Kalau mengisi di Google Sheets: File → Download → Microsoft Excel.');
      if (file.size > 5 * 1024 * 1024) throw new Error('File lebih dari 5 MB.');
      const X = await loadXLSX();
      const wb = X.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      I.parsed = parseImport(wb);
    } catch (e) { I.err = e.message; }
    I.busy = false; render();
  }
  async function loadImports() {
    D.imp.listErr = '';
    try {
      const res = await api({ action: 'imports', session: D.session });
      if (!res.ok) { if (res.error === 'sesi') { logout('Sesi berakhir. Silakan masuk lagi.'); return; } D.imp.listErr = 'Riwayat impor gagal dimuat (' + res.error + ').'; }
      else D.imp.list = res.imports;
    } catch (e) { D.imp.listErr = 'Server tidak bisa dihubungi.'; }
    if (D.page === 'impor') render();
  }
  async function submitImport() {
    const I = D.imp; const P = I.parsed;
    if (!P || P.errors.length || !P.rows.length) return;
    if (I.label.trim().length < 5) { I.err = 'Isi keterangan sumber minimal 5 karakter.'; render(); return; }
    if (!I.attest) { I.err = 'Centang pernyataan keaslian data.'; render(); return; }
    I.busy = true; I.err = ''; render();
    try {
      const res = await api({ action: 'import', session: D.session, batch: { label: I.label.trim(), attest: true, rows: P.rows.map((r) => ({ ref: r.ref, seg: r.seg, tanggal: r.tanggal, pewawancara: r.pewawancara, fields: r.fields })) } });
      I.busy = false;
      if (!res.ok) { I.err = res.message || 'Impor gagal (' + res.error + ').'; if (res.error === 'sesi') { logout('Sesi berakhir. Silakan masuk lagi.'); return; } render(); return; }
      I.result = res; I.parsed = null; I.fileName = ''; I.label = ''; I.attest = false; I.list = null;
      window.scrollTo(0, 0);
      await loadImports();
      load();
    } catch (e) { I.busy = false; I.err = 'Server tidak bisa dihubungi. Tidak ada data yang masuk; coba lagi.'; render(); }
  }
  async function withdrawImport(id) {
    try {
      const res = await api({ action: 'importWithdraw', session: D.session, id });
      if (!res.ok) { toast(res.message || 'Gagal menarik batch'); return; }
      D.imp.confirm = ''; toast(res.removed + ' baris ditarik dari data');
      D.imp.list = null; await loadImports(); load();
    } catch (e) { toast('Server tidak bisa dihubungi'); }
  }
  function pImpor() {
    if (!isFounder()) return '<div class="empty-big"><i class="ph ph-lock-key"></i>Hanya founder yang dapat mengimpor data.</div>';
    const I = D.imp; const P = I.parsed;
    let html = '';
    if (I.result) {
      const c = I.result.counts;
      html += '<div class="cred" role="status"><div class="cred-h"><i class="ph-fill ph-check-circle"></i><div><b>' + fmtN(I.result.total) + ' respons diimpor · batch ' + esc(I.result.id) + '</b><p>' + SEGS.filter((s) => c[s]).map((s) => SEG_NAME[s] + ' ' + c[s]).join(', ') + '. Sudah tampil di dashboard dengan label "Wawancara awal" dan tanggal wawancara aslinya.</p></div></div>' +
        '<div class="cred-actions"><button type="button" class="btn btn-primary btn-sm" data-nav="ikhtisar">Lihat ikhtisar</button><button type="button" class="btn btn-ghost btn-sm" data-act="imp-done">Tutup</button></div></div>';
    }
    // langkah
    html += '<section class="sec"><ol class="steps3">' +
      '<li><span class="n">1</span><div><b>Unduh template</b><p>Satu tab per segmen, pilihan jawaban sudah berupa dropdown.</p><a class="btn btn-secondary btn-sm" href="' + TEMPLATE_URL + '" download><i class="ph ph-download-simple"></i>Template Excel</a></div></li>' +
      '<li><span class="n">2</span><div><b>Isi dari catatan wawancara</b><p>Satu baris per responden. Isi hanya yang memang ditanyakan saat itu; sisanya biarkan kosong.</p></div></li>' +
      '<li><span class="n">3</span><div><b>Unggah dan periksa</b><p>Sistem memeriksa setiap sel sebelum ada data yang masuk.</p></div></li></ol></section>';
    // unggah
    html += '<section class="sec"><div class="sec-h"><div><h2>Unggah file</h2></div></div>' +
      '<label class="drop' + (I.busy && !P ? ' busy' : '') + '"><input type="file" accept=".xlsx,.xls" data-impfile hidden><i class="ph ' + (I.busy && !P ? 'ph-spinner-gap spin' : 'ph-table') + '"></i><span><b>' + (I.fileName ? esc(I.fileName) : 'Pilih file template yang sudah diisi') + '</b><small>' + (I.fileName ? 'Klik untuk mengganti file' : '.xlsx, maksimal 500 baris') + '</small></span></label>' +
      (I.err && !P ? '<div class="alert alert-danger" style="margin-top:12px"><i class="ph ph-warning-circle"></i><span>' + esc(I.err) + '</span></div>' : '');
    if (P) {
      const ok = !P.errors.length;
      html += '<div class="panel" style="margin-top:16px"><div class="panel-h"><div><h3>' + (ok ? 'Siap diimpor: ' + fmtN(P.rows.length) + ' respons' : fmtN(P.errors.length) + ' kesalahan perlu diperbaiki') + '</h3><p>' + SEGS.map((s) => SEG_NAME[s] + ' ' + P.counts[s]).join(' · ') + (P.warnings.length ? ' · ' + P.warnings.length + ' peringatan' : '') + '</p></div>' +
        '<span class="pill ' + (ok ? 'pill-ok' : 'pill-warn') + '"><i class="ph ' + (ok ? 'ph-check-circle' : 'ph-warning') + '"></i>' + (ok ? 'Lolos pemeriksaan' : 'Belum bisa diimpor') + '</span></div>';
      const issues = P.errors.map((e) => ['err', e]).concat(P.warnings.map((w) => ['warn', w]));
      if (issues.length) {
        html += '<div class="tbl-wrap issues"><table class="tbl"><thead><tr><th>Lokasi</th><th>Masalah</th></tr></thead><tbody>' + issues.slice(0, 80).map((x) => '<tr class="' + x[0] + '"><td class="idc">' + esc(x[1].where) + '</td><td>' + (x[0] === 'err' ? '<i class="ph ph-warning-circle"></i> ' : '<i class="ph ph-info"></i> ') + esc(x[1].msg) + '</td></tr>').join('') + '</tbody></table></div>' +
          (issues.length > 80 ? '<p class="small">… dan ' + (issues.length - 80) + ' lainnya.</p>' : '') +
          (!ok ? '<p class="small" style="margin:12px 0 0">Perbaiki di file Excel, simpan, lalu pilih file lagi. Tidak ada data yang masuk sebelum semua kesalahan beres.</p>' : '');
      }
      if (P.rows.length) {
        html += '<h3 class="mini-h">Pratinjau</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Baris</th><th>Segmen</th><th>Tanggal wawancara</th><th>Pewawancara</th><th>Provinsi</th><th class="num">Jawaban terisi</th></tr></thead><tbody>' +
          P.rows.slice(0, 12).map((r) => '<tr><td class="idc">' + esc(r.ref) + '</td><td><i class="sw c-' + r.seg + '" style="margin-right:6px;width:8px;height:8px"></i>' + SEG_NAME[r.seg] + '</td><td>' + (r.tanggal ? dateID(r.tanggal) : '–') + '</td><td>' + esc(r.pewawancara || '–') + '</td><td>' + esc(provLabel((r.fields.find((f) => f[0] === 'U1') || [])[1])) + '</td><td class="num">' + r.answered + '</td></tr>').join('') +
          '</tbody></table></div>' + (P.rows.length > 12 ? '<p class="small">+ ' + (P.rows.length - 12) + ' baris lainnya</p>' : '');
      }
      if (ok) {
        html += '<form id="impForm" class="imp-confirm" novalidate>' +
          '<div class="field"><label for="impl">Keterangan sumber</label><input class="input" id="impl" data-implabel maxlength="160" value="' + esc(I.label) + '" placeholder="Contoh: Wawancara kemitraan peternakan di Boyolali, Agustus 2026"><p class="helper">Tampil di dashboard (termasuk untuk mitra) sebagai asal data. Jangan tulis nama atau nomor HP responden.</p></div>' +
          '<label class="check-row"><input type="checkbox" data-impattest' + (I.attest ? ' checked' : '') + '><span>Saya menyatakan data ini berasal dari wawancara yang benar-benar dilakukan pada tanggal yang tercantum, dan dimasukkan sesuai catatan tanpa menambah atau mengubah jawaban.<small>Impor tercatat atas nama ' + esc(D.user.nama) + ' di Riwayat_Impor dan Log.</small></span></label>' +
          (I.err ? '<div class="alert alert-danger" style="margin-top:12px"><i class="ph ph-warning-circle"></i><span>' + esc(I.err) + '</span></div>' : '') +
          '<div class="form-foot"><button type="button" class="btn btn-ghost btn-sm" data-act="imp-reset">Batal</button><button type="submit" class="btn btn-primary btn-sm"' + (I.busy ? ' disabled' : '') + '>' + (I.busy ? '<i class="ph ph-spinner-gap spin"></i>Mengimpor' : 'Impor ' + fmtN(P.rows.length) + ' respons') + '</button></div></form>';
      }
      html += '</div>';
    }
    html += '</section>';
    // riwayat
    html += '<section class="sec"><div class="sec-h"><div><h2>Riwayat impor</h2><p>Juga tersimpan di tab Riwayat_Impor pada Google Sheet. Batch yang keliru bisa ditarik; penarikan ikut tercatat.</p></div></div><div class="panel">';
    if (I.listErr) html += '<div class="alert alert-danger"><i class="ph ph-warning-circle"></i><span>' + esc(I.listErr) + '</span></div>';
    else if (!I.list) html += '<div class="empty">Memuat…</div>';
    else if (!I.list.length) html += '<div class="empty">Belum pernah ada impor.</div>';
    else {
      html += '<div class="tbl-wrap"><table class="tbl ua-tbl"><thead><tr><th>Batch</th><th>Keterangan</th><th class="num">Respons</th><th>Diimpor</th><th>Status</th><th><span class="sr-only">Tindakan</span></th></tr></thead><tbody>' +
        I.list.map((x) => {
          const act = x.status !== 'aktif' ? '' : I.confirm === x.id_impor
            ? '<span class="ua-confirm">Tarik ' + x.total + ' respons?</span><button type="button" class="btn btn-sm ua-danger" data-impw="' + esc(x.id_impor) + '">Ya, tarik</button><button type="button" class="btn btn-ghost btn-sm" data-act="imp-unconfirm">Batal</button>'
            : '<button type="button" class="btn btn-ghost btn-sm" data-impconfirm="' + esc(x.id_impor) + '"' + tipAttr('Menghapus semua respons batch ini dari data. Riwayatnya tetap tercatat.') + '><i class="ph ph-arrow-bend-up-right"></i>Tarik batch</button>';
          return '<tr' + (x.status !== 'aktif' ? ' class="dim"' : '') + '><td class="idc">' + esc(x.id_impor) + '</td><td>' + esc(x.keterangan) + '<div class="sub">' + SEGS.filter((s) => +x[s]).map((s) => SEG_NAME[s] + ' ' + x[s]).join(', ') + '</div></td><td class="num">' + fmtN(x.total) + '</td>' +
            '<td>' + dfmt(parseDate(x.waktu_impor), { day: 'numeric', month: 'short', year: 'numeric' }) + '<div class="sub">oleh ' + esc(x.diimpor_oleh) + '</div></td>' +
            '<td>' + (x.status === 'aktif' ? '<span class="pill pill-ok"><i class="ph-fill ph-check-circle"></i>Aktif</span>' : '<span class="pill pill-mute"><i class="ph ph-prohibit"></i>Ditarik</span><div class="sub">' + dfmt(parseDate(x.ditarik_pada)) + (x.ditarik_oleh ? ' oleh ' + esc(x.ditarik_oleh) : '') + '</div>') + '</td>' +
            '<td><div class="ua">' + act + '</div></td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    html += '</div></section>';
    return html;
  }

  /* ---------- DEMO: akun tiruan & penyaringan mitra ---------- */
  function stripMitra(raw) {
    const hidden = /^(id_terkait|pewawancara|perangkat|sumber|bersedia_dihubungi|U2|catatan_.*|waktu_mulai|versi|sidik|kunci_impor|diimpor_oleh|id_impor)$/;
    const segments = {};
    SEGS.forEach((seg) => {
      const t = raw.segments[seg]; const keep = [];
      t.headers.forEach((h, i) => { if (!hidden.test(h)) keep.push(i); });
      const fi = t.headers.indexOf('flag_durasi'), ii = t.headers.indexOf('id_respons'); let n = 0;
      segments[seg] = { headers: keep.map((i) => t.headers[i]), rows: t.rows.filter((r) => r[fi] !== 'terlalu_cepat').map((r) => { n++; return keep.map((i) => (i === ii ? seg[0].toUpperCase() + '-' + String(1000 + n).slice(1) : r[i])); }) };
    });
    return { ok: true, segments, contacts: null };
  }
  function demoPw() { const abc = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 12; i++) { s += abc[Math.floor(Math.random() * abc.length)]; if (i === 3 || i === 7) s += '-'; } return s; }
  function demoApi(b) {
    if (!D.demoUsers) {
      const now = Date.now();
      D.demoUsers = [
        { u: 'demo', nama: 'Mode Demo', kategori: 'internal', peran: 'founder', org: '', aksesSampai: '', status: 'aktif', mustChange: false, loginTerakhir: new Date(now).toISOString() },
        { u: 'raka', nama: 'Raka Pratama (contoh)', kategori: 'internal', peran: 'riset', org: '', aksesSampai: '', status: 'aktif', mustChange: true, loginTerakhir: '' },
        { u: 'budi.s', nama: 'Budi Santoso (contoh)', kategori: 'mitra', peran: 'mitra', org: 'Modal Ventura Contoh', catatan: 'Due diligence pre-seed', aksesSampai: plusDays(5), status: 'aktif', mustChange: false, loginTerakhir: new Date(now - 26 * 36e5).toISOString() },
        { u: 'koperasi.a', nama: 'Siti Aminah (contoh)', kategori: 'mitra', peran: 'mitra', org: 'Koperasi Peternak Contoh', aksesSampai: plusDays(-3), status: 'berakhir', mustChange: false, loginTerakhir: new Date(now - 9 * 864e5).toISOString() },
      ];
    }
    const U = D.demoUsers; const find = (u) => U.find((x) => x.u === u);
    const re = (u) => { if (u.status !== 'nonaktif') u.status = u.kategori === 'mitra' && u.aksesSampai && daysLeft(u.aksesSampai) < 0 ? 'berakhir' : 'aktif'; return Object.assign({}, u); };
    switch (b.action) {
      case 'users': return Promise.resolve({ ok: true, users: U.map(re) });
      case 'userAdd': {
        const d = b.user;
        if (find(d.username)) return Promise.resolve({ ok: false, error: 'input', message: 'Username "' + d.username + '" sudah dipakai.' });
        const u = { u: d.username, nama: d.nama, kategori: d.kategori, peran: d.peran, org: d.org, catatan: d.catatan, aksesSampai: d.kategori === 'mitra' ? d.aksesSampai : '', status: 'aktif', mustChange: true, loginTerakhir: '' };
        U.push(u); return Promise.resolve({ ok: true, user: re(u), password: demoPw() });
      }
      case 'userReset': { const u = find(b.username); u.mustChange = true; return Promise.resolve({ ok: true, user: re(u), password: demoPw() }); }
      case 'userUpdate': {
        const u = find(b.username); const c = b.changes;
        if ('aktif' in c) u.status = c.aktif ? 'aktif' : 'nonaktif';
        if (c.aksesSampai) u.aksesSampai = c.aksesSampai;
        return Promise.resolve({ ok: true, user: re(u) });
      }
      case 'userDelete': D.demoUsers = U.filter((x) => x.u !== b.username); return Promise.resolve({ ok: true });
      case 'imports': return Promise.resolve({ ok: true, imports: D.demoImports || (D.demoImports = [{ id_impor: 'IMP-20260905-1410-DMO', waktu_impor: new Date(Date.now() - 40 * 864e5).toISOString(), diimpor_oleh: 'demo', keterangan: 'Wawancara kemitraan peternakan (contoh)', peternak: 6, rph: 2, pedagang: 0, konsumen: 0, total: 8, status: 'aktif' }]) });
      case 'import': {
        const id = 'IMP-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Date.now()).slice(-4) + '-DMO';
        const counts = { peternak: 0, rph: 0, pedagang: 0, konsumen: 0 };
        b.batch.rows.forEach((r, i) => {
          counts[r.seg]++;
          const o = { waktu_terima: new Date().toISOString(), id_respons: 'TQ-I' + String(Date.now() + i).slice(-5), tanggal_wawancara: r.tanggal, mode: 'wawancara', pewawancara: r.pewawancara, bahasa: 'id', sumber: 'impor', asal_data: 'impor', id_impor: id, keterangan_impor: b.batch.label, _utuh: 'ya' };
          r.fields.forEach((f) => { o[f[0]] = f[1]; });
          const t = D.raw.segments[r.seg];
          Object.keys(o).forEach((k) => { if (t.headers.indexOf(k) < 0) { t.headers.push(k); t.rows.forEach((row) => row.push('')); } });
          t.rows.push(t.headers.map((h) => (o[h] == null ? '' : o[h])));
        });
        const total = b.batch.rows.length;
        D.demoImports = D.demoImports || [];
        D.demoImports.unshift(Object.assign({ id_impor: id, waktu_impor: new Date().toISOString(), diimpor_oleh: D.user.u, keterangan: b.batch.label, total, status: 'aktif' }, counts));
        return Promise.resolve({ ok: true, id, counts, total });
      }
      case 'importWithdraw': {
        let removed = 0;
        SEGS.forEach((s) => { const t = D.raw.segments[s]; const ci = t.headers.indexOf('id_impor'); if (ci < 0) return; const before = t.rows.length; t.rows = t.rows.filter((r) => r[ci] !== b.id); removed += before - t.rows.length; });
        (D.demoImports || []).forEach((x) => { if (x.id_impor === b.id) { x.status = 'ditarik'; x.ditarik_pada = new Date().toISOString(); x.ditarik_oleh = D.user.u; } });
        return Promise.resolve({ ok: true, removed });
      }
      case 'changePassword':
        if (String(b.newPassword).length < 10) return Promise.resolve({ ok: false, error: 'input', message: 'Password baru minimal 10 karakter.' });
        return Promise.resolve({ ok: true, session: 'demo', user: Object.assign({}, D.user, { mustChange: false }) });
      default: return Promise.resolve({ ok: false, error: 'demo' });
    }
  }

  /* ---------- login ---------- */
  function vLogin() {
    const noEndpoint = !CFG.ENDPOINT;
    return '<div class="login-wrap"><div class="login"><div class="login-card">' +
      '<div class="login-top"><img src="/assets/logo.svg" alt="TernaQin"><button type="button" class="icon-btn icon-btn-line" data-theme-toggle></button></div>' +
      '<h1>Dashboard riset</h1><p class="sub">Khusus founder dan manajemen TernaQin. Masuk untuk melihat hasil riset lapangan.</p>' +
      (noEndpoint ? '<div class="alert alert-warn"><i class="ph ph-plugs"></i><span><b>Belum tersambung ke Google Sheet.</b> Isi ENDPOINT di js/config.js setelah Apps Script di-deploy. Sementara itu, coba dashboard dengan data demo.</span></div>' : '') +
      '<form id="loginForm" autocomplete="on" novalidate>' +
      '<div class="field" style="margin-top:16px"><label for="lu">Username</label><input class="input" id="lu" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required' + (noEndpoint ? ' disabled' : '') + '></div>' +
      '<div class="field" style="margin-top:12px"><label for="lp">Password</label><div class="pw-wrap"><input class="input" id="lp" name="password" type="password" autocomplete="current-password" required' + (noEndpoint ? ' disabled' : '') + '><button type="button" class="icon-btn" data-pw aria-label="Tampilkan password"><i class="ph ph-eye"></i></button></div></div>' +
      '<div id="lerr">' + (D.error ? '<div class="alert alert-danger" role="alert"><i class="ph ph-warning-circle"></i><span>' + esc(D.error) + '</span></div>' : '') + '</div>' +
      '<button type="submit" class="btn btn-primary btn-block"' + (noEndpoint || D.loading ? ' disabled' : '') + '>' + (D.loading ? '<i class="ph ph-spinner-gap spin"></i> Memeriksa' : '<i class="ph ph-sign-in"></i> Masuk') + '</button></form>' +
      '<div class="demo-row"><span>Coba dengan data demo sebagai</span><div class="demo-btns"><button type="button" class="btn btn-secondary btn-sm" data-act="demo" data-as="founder"><i class="ph ph-user-gear"></i>Tim internal</button><button type="button" class="btn btn-secondary btn-sm" data-act="demo" data-as="mitra"><i class="ph ph-handshake"></i>Mitra / investor</button></div></div>' +
      '</div><p class="login-foot">Belum punya akun atau lupa password? Minta founder menambahkan Anda lewat Apps Script.<br><a href="/">Kembali ke halaman riset</a></p></div></div>';
  }

  /* ---------- render ---------- */
  function render(opts) {
    const root = $('#dash');
    if (!D.user) { root.innerHTML = vLogin(); if (window.TQ_THEME) TQ_THEME.sync(); const u = $('#lu'); if (u && !u.disabled) u.focus(); return; }
    if (D.view === 'pw') { root.innerHTML = vChangePw(); if (window.TQ_THEME) TQ_THEME.sync(); const f = $('#pwo'); if (f) f.focus(); return; }
    let inner;
    if (!D.recs) inner = D.error ? '<div class="alert alert-danger" role="alert"><i class="ph ph-warning-circle"></i><span>' + esc(D.error) + '</span><button type="button" class="btn btn-secondary btn-sm" data-act="refresh">Coba lagi</button></div>' : '<div class="d-loading"><div><i class="ph ph-spinner-gap spin"></i><p>Memuat data riset</p></div></div>';
    else {
      if (D.page === 'ikhtisar') inner = pIkhtisar();
      else if (SEGS.includes(D.page)) inner = pSegment(D.page);
      else if (D.page === 'suara') inner = pVoices();
      else if (D.page === 'kontak') inner = pContacts();
      else if (D.page === 'akses') inner = pAkses();
      else if (D.page === 'impor') inner = pImpor();
      if (D.error) inner = '<div class="alert alert-danger" role="alert" style="margin-bottom:20px"><i class="ph ph-warning-circle"></i><span>' + esc(D.error) + '</span><button type="button" class="btn btn-secondary btn-sm" data-act="refresh">Coba lagi</button></div>' + inner;
    }
    const y = window.scrollY;
    const ae = document.activeElement;
    const focusKey = ae && ae.dataset && (ae.dataset.qs != null ? '[data-qs]' : ae.dataset.vs != null ? '[data-vs]' : null);
    const caret = focusKey ? ae.selectionStart : 0;
    root.innerHTML = vShell(inner);
    if (opts && opts.top) window.scrollTo(0, 0); else window.scrollTo(0, y);
    if (focusKey) { const i = $(focusKey); if (i) { i.focus(); i.setSelectionRange(caret, caret); } }
    if (window.TQ_THEME) TQ_THEME.sync();
  }
  function go(page) {
    D.page = page; D.ui.nav = false; D.ui.filterOpen = false; D.ui.qs = '';
    if (!SEGS.includes(page)) D.cond = { q: '', v: '' };
    try { history.replaceState(null, '', '#' + page); } catch (e) { /* abaikan */ }
    render({ top: true });
    if (page === 'akses' && !D.users) loadUsers();
    if (page === 'impor' && !D.imp.list) loadImports();
  }

  /* ---------- muat data ---------- */
  async function load() {
    if (D.demo) { D.raw = isMitra() ? stripMitra(demoData()) : demoData(); D.recs = normalize(D.raw); D.updated = new Date(); render(); return; }
    D.loading = true; D.error = ''; render();
    try {
      const res = await api({ action: 'data', session: D.session });
      if (!res.ok) {
        if (res.error === 'sesi') { logout('Sesi berakhir atau akses Anda sudah diubah. Silakan masuk lagi.'); return; }
        if (res.error === 'ganti_password') { D.loading = false; D.view = 'pw'; render(); return; }
        throw new Error(res.error || 'gagal');
      }
      const before = D.recs ? SEGS.reduce((a, s) => a + (D.recs[s] || []).length, 0) : null;
      D.raw = res; D.recs = normalize(res); D.user = res.user || D.user; D.updated = new Date();
      const after = SEGS.reduce((a, s) => a + (D.recs[s] || []).length, 0);
      if (before != null && after > before) setTimeout(() => toast((after - before) + ' respons baru masuk'), 50);
    } catch (e) {
      D.error = 'Data belum bisa dimuat (' + e.message + '). Periksa koneksi lalu coba lagi.';
    }
    D.loading = false; render();
  }
  async function login(u, p) {
    D.loading = true; D.error = ''; render();
    try {
      const res = await api({ action: 'login', username: u, password: p });
      if (!res.ok) {
        D.error = res.error === 'terkunci' ? 'Terlalu banyak percobaan gagal. Akun dikunci 15 menit, coba lagi setelahnya.'
          : res.error === 'nonaktif' ? 'Akun ini sedang dinonaktifkan. Hubungi founder TernaQin.'
          : res.error === 'berakhir' ? 'Masa akses akun ini sudah berakhir (' + dateID(res.aksesSampai) + '). Hubungi TernaQin untuk memperpanjang.'
          : res.error === 'salah' ? 'Username atau password salah.' + (res.sisa != null && res.sisa <= 2 ? ' Sisa ' + res.sisa + ' percobaan sebelum akun dikunci.' : '')
          : 'Login gagal (' + res.error + ').';
        D.loading = false; render(); return;
      }
      D.session = res.session; D.user = res.user; sess.set({ session: res.session, user: res.user });
      D.loading = false;
      if (res.user.mustChange) { D.view = 'pw'; D.ui.pwErr = ''; render(); return; }
      load();
    } catch (e) {
      D.error = 'Server tidak bisa dihubungi. Periksa koneksi internet atau ENDPOINT di config.js.';
      D.loading = false; render();
    }
  }
  function logout(msg) { sess.del(); Object.assign(D, { session: null, user: null, raw: null, recs: null, demo: false, error: msg || '', page: 'ikhtisar', view: 'app', users: null }); D.ui.cred = null; D.ui.addOpen = false; render(); }

  /* ---------- ekspor Excel ---------- */
  function loadXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = '/assets/vendor/xlsx.full.min.js'; // SheetJS 0.18.5, di-host sendiri
      s.onload = () => res(window.XLSX); s.onerror = () => rej(new Error('pustaka Excel gagal dimuat'));
      document.head.appendChild(s);
    });
  }
  async function exportXlsx() {
    try {
      const X = await loadXLSX();
      const wb = X.utils.book_new();
      const info = [['Riset Lapangan TernaQin — ekspor dashboard'], ['Dibuat', new Date().toLocaleString('id-ID')], ['Oleh', (D.user && (D.user.nama || D.user.u)) || ''],
        ['Periode', D.f.period === 'all' ? 'Semua waktu' : D.f.period + ' hari terakhir'], ['Provinsi', D.f.prov === 'all' ? 'Semua' : provLabel(D.f.prov)],
        ['Cara isi', D.f.mode === 'all' ? 'Semua' : D.f.mode], ['Respons terlalu cepat', D.f.hideFast ? 'Tidak disertakan' : 'Disertakan']];
      if (D.demo) info.splice(1, 0, ['PERHATIAN', 'DATA DEMO — bukan hasil riset']);
      X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(info), 'Info');
      SEGS.forEach((s) => {
        const t = D.raw.segments[s] || { headers: [], rows: [] };
        const keep = new Set(recs(s).map((r) => r.id));
        const ii = t.headers.indexOf('id_respons');
        X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([t.headers].concat(t.rows.filter((r) => keep.has(String(r[ii]))))), 'Respons_' + SEG_NAME[s]);
      });
      if (D.user.peran === 'founder' && D.raw.contacts) X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([D.raw.contacts.headers].concat(D.raw.contacts.rows)), 'Kontak');
      X.writeFile(wb, 'Riset_TernaQin_' + (D.demo ? 'DEMO_' : '') + new Date().toISOString().slice(0, 10) + '.xlsx');
    } catch (e) { D.error = 'Ekspor gagal: ' + e.message; render(); }
  }

  /* ---------- tooltip ---------- */
  const tip = $('#tip');
  function showTip(el, x, y) {
    tip.innerHTML = el.getAttribute('data-tip'); tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let left = x + 14, top = y + 14;
    if (left + w > window.innerWidth - 8) left = x - w - 14;
    if (top + h > window.innerHeight - 8) top = y - h - 14;
    tip.style.left = Math.max(8, left) + 'px'; tip.style.top = Math.max(8, top) + 'px';
  }
  document.addEventListener('mousemove', (e) => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el) showTip(el, e.clientX, e.clientY); else tip.hidden = true; });
  document.addEventListener('scroll', () => { tip.hidden = true; }, { passive: true });

  /* ---------- event ---------- */
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'pwForm') { e.preventDefault(); submitPw(); return; }
    if (e.target.id === 'addForm') { e.preventDefault(); submitAdd(); return; }
    if (e.target.id === 'impForm') { e.preventDefault(); submitImport(); return; }
    if (e.target.id !== 'loginForm') return;
    e.preventDefault();
    const u = $('#lu').value.trim(), p = $('#lp').value;
    if (!u || !p) { D.error = 'Isi username dan password.'; render(); return; }
    login(u, p);
  });
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (D.ui.filterOpen && !t.closest('.fpop') && !t.closest('[data-act="filter-toggle"]')) { D.ui.filterOpen = false; render(); }
    const pw = t.closest('[data-pw]');
    if (pw) { const i = $('#lp'); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; pw.innerHTML = '<i class="ph ' + (show ? 'ph-eye-slash' : 'ph-eye') + '"></i>'; pw.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password'); return; }
    const nav = t.closest('[data-nav]');
    if (nav) { e.preventDefault(); go(nav.dataset.nav); return; }
    const per = t.closest('[data-period]');
    if (per) { D.f.period = per.dataset.period; render(); return; }
    const ch = t.closest('[data-ch]');
    if (ch) { D.ui.ch[D.page] = ch.dataset.ch; D.ui.qs = ''; render(); const w = $('.chnav-wrap'); if (w && w.getBoundingClientRect().top < 0) w.scrollIntoView(); return; }
    const gt = t.closest('[data-goto]');
    if (gt) {
      const parts = gt.dataset.goto.split('|'); const seg = parts[0], qid = parts[1]; const q = qById(seg, qid);
      D.ui.ch[seg] = q.ch; go(seg);
      requestAnimationFrame(() => { const el = document.getElementById('q-' + seg + '-' + qid); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.classList.add('flash'); } });
      return;
    }
    const tg = t.closest('[data-table]');
    if (tg) { D.ui.tables[tg.dataset.table] = !D.ui.tables[tg.dataset.table]; render(); return; }
    const cl = t.closest('[data-clear]');
    if (cl) { const k = cl.dataset.clear; if (k === 'cond') D.cond = { q: '', v: '' }; else if (k === 'hideFast') D.f.hideFast = true; else D.f[k] = 'all'; render(); return; }
    const vo = t.closest('[data-voice]');
    if (vo) { const p = vo.dataset.voice.split('|'); D.voice = { seg: p[0], q: p[1], s: '' }; go('suara'); return; }
    const vs = t.closest('[data-vseg]');
    if (vs) { D.voice.seg = vs.dataset.vseg; D.voice.q = 'all'; D.ui.more = 120; render(); return; }
    const vq = t.closest('[data-vq]');
    if (vq) { D.voice.q = vq.dataset.vq; D.ui.more = 120; render(); return; }
    const kt = t.closest('[data-kat]');
    if (kt) { D.ui.add.kat = kt.dataset.kat; D.ui.addErr = ''; render(); return; }
    const pr = t.closest('[data-peran]');
    if (pr) { D.ui.add.peran = pr.dataset.peran; render(); return; }
    const ua = t.closest('[data-uact]');
    if (ua) { userAction(ua.dataset.uact, ua.dataset.user); return; }
    const ic = t.closest('[data-impconfirm]');
    if (ic) { D.imp.confirm = ic.dataset.impconfirm; render(); return; }
    const iw = t.closest('[data-impw]');
    if (iw) { withdrawImport(iw.dataset.impw); return; }
    const pl = t.closest('[data-pilot]');
    if (pl) { D.ui.pilotOnly = pl.dataset.pilot === '1'; render(); return; }
    const a = t.closest('[data-act]');
    if (!a) return;
    const act = a.dataset.act;
    if (act === 'demo') {
      D.demo = true; D.error = ''; D.page = 'ikhtisar'; D.view = 'app'; D.users = null; D.demoUsers = null;
      D.user = a.dataset.as === 'mitra'
        ? { u: 'budi.s', nama: 'Budi Santoso (contoh)', kategori: 'mitra', peran: 'mitra', org: 'Modal Ventura Contoh', aksesSampai: plusDays(5) }
        : { u: 'demo', nama: 'Mode Demo', kategori: 'internal', peran: 'founder' };
      load();
    }
    else if (act === 'pw') { D.view = 'pw'; D.ui.pwErr = ''; render(); }
    else if (act === 'pw-cancel') { D.view = 'app'; render(); }
    else if (act === 'add-open') { D.ui.addOpen = true; D.ui.add = addDefault(); D.ui.addErr = ''; render(); const n = $('#an'); if (n) n.focus(); }
    else if (act === 'add-cancel') { D.ui.addOpen = false; D.ui.addErr = ''; render(); }
    else if (act === 'cred-close') { D.ui.cred = null; render(); }
    else if (act === 'copy-msg') copyText(credMessage(D.ui.cred), 'Pesan disalin. Tempel di chat pribadi.');
    else if (act === 'copy-pw') copyText(D.ui.cred.password, 'Password disalin');
    else if (act === 'users-reload') { D.users = null; render(); loadUsers(); }
    else if (act === 'imp-reset') { Object.assign(D.imp, { parsed: null, fileName: '', label: '', attest: false, err: '' }); render(); }
    else if (act === 'imp-done') { D.imp.result = null; render(); }
    else if (act === 'imp-unconfirm') { D.imp.confirm = ''; render(); }
    else if (act === 'logout') logout();
    else if (act === 'refresh') load();
    else if (act === 'export') exportXlsx();
    else if (act === 'menu') { D.ui.nav = !D.ui.nav; render(); }
    else if (act === 'filter-toggle') { D.ui.filterOpen = !D.ui.filterOpen; render(); const f = $('.fpop select'); if (f) f.focus(); }
    else if (act === 'filter-close') { D.ui.filterOpen = false; render(); }
    else if (act === 'filter-reset') { D.f = { period: D.f.period, prov: 'all', mode: 'all', origin: 'all', hideFast: true }; D.cond = { q: '', v: '' }; render(); }
    else if (act === 'toggle-fast') { D.f.hideFast = !D.f.hideFast; render(); }
    else if (act === 'more') { D.ui.more += 120; render(); }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.impfile != null) { if (t.files && t.files[0]) readImportFile(t.files[0]); return; }
    if (t.dataset && t.dataset.impattest != null) { D.imp.attest = t.checked; if (D.imp.err) { D.imp.err = ''; const a = $('#impForm .alert'); if (a) a.remove(); } return; }
    if (!t.dataset || !t.dataset.f) return;
    const k = t.dataset.f;
    if (k === 'hideFast') D.f.hideFast = t.checked;
    else if (k === 'condq') D.cond = { q: t.value, v: '' };
    else if (k === 'condv') D.cond.v = t.value;
    else D.f[k] = t.value;
    render();
    const again = $('[data-f="' + k + '"]'); if (again) again.focus();
  });
  let deb;
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (!t.dataset) return;
    if (t.dataset.implabel != null) { D.imp.label = t.value; if (D.imp.err) { D.imp.err = ''; const a = $('#impForm .alert'); if (a) a.remove(); } return; }
    if (t.dataset.add) {
      const a = D.ui.add; const k = t.dataset.add;
      a[k] = t.value;
      if (k === 'username') a.userEdited = !!t.value;
      if (k === 'nama' && !a.userEdited) { a.username = slug(t.value); const u = $('#au'); if (u) u.value = a.username; }
      return;
    }
    if (t.dataset.qs != null) { D.ui.qs = t.value; clearTimeout(deb); deb = setTimeout(render, 200); }
    if (t.dataset.vs != null) { D.voice.s = t.value; D.ui.more = 120; clearTimeout(deb); deb = setTimeout(render, 200); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (D.ui.filterOpen || D.ui.nav)) { D.ui.filterOpen = false; D.ui.nav = false; render(); const b = $('[data-act="filter-toggle"]'); if (b) b.focus(); }
  });

  /* ---------- data demo (acak, berlabel DEMO) ---------- */
  function demoData() {
    let seed = 20261018;
    const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const pick = (arr, w) => { const ws = w || arr.map(() => 1); const s = ws.reduce((a, b) => a + b, 0); let x = rnd() * s; for (let i = 0; i < arr.length; i++) { x -= ws[i]; if (x <= 0) return arr[i]; } return arr[arr.length - 1]; };
    const PROV = ['jawa_tengah', 'di_yogyakarta', 'jawa_timur', 'jawa_barat', 'nusa_tenggara_barat', 'bali', 'lampung', 'sulawesi_selatan'];
    const PW = [30, 14, 18, 12, 6, 4, 4, 3];
    const KAB = { jawa_tengah: ['Kab. Boyolali', 'Kab. Grobogan', 'Kab. Blora', 'Kota Semarang'], di_yogyakarta: ['Kab. Gunungkidul', 'Kab. Sleman', 'Kab. Bantul'], jawa_timur: ['Kab. Tuban', 'Kab. Probolinggo', 'Kota Surabaya'], jawa_barat: ['Kab. Garut', 'Kota Bandung', 'Kab. Bogor'] };
    const TX = {
      peternak: ['Dua sapi saya terlambat ketahuan sakit, satu mati sebelum dokter datang.', 'Blantik menawar jauh di bawah harga karena kami tidak tahu berat sebenarnya.', 'Harga pakan naik terus, jual sapi malah turun waktu dekat lebaran.', 'Catatan vaksin hilang waktu buku kena air hujan.', 'Pekerja ganti-ganti, jadi tidak ada yang hafal riwayat sapi.'],
      rph: ['Waktu audit NKV, dokumen asal ternak paling susah dilengkapi.', 'Sering datang sapi tanpa surat, kami tidak bisa menolak karena langganan.', 'Pencatatan penerima daging masih di buku, sering tidak terbaca.'],
      pedagang: ['Pembeli pernah protes daging berair, padahal dari pemasok biasa.', 'Ada pelanggan restoran yang minta bukti halal tiap bulan.', 'Kalah harga dengan daging beku di pasar sebelah.'],
      konsumen: ['Pernah beli daging yang setelah dimasak menyusut banyak, seperti digelonggong.', 'Saya hanya percaya penjual langganan, tidak pernah tanya asal.', 'Ingin tahu apakah sapinya disuntik hormon atau tidak.', 'Label halal di pasar sering hanya stiker tanpa nomor.'],
    };
    const N = { peternak: 34, rph: 9, pedagang: 21, konsumen: 87 };
    const segments = {}; const contacts = { headers: ['waktu_terima', 'id_respons', 'peran', 'nama', 'whatsapp', 'provinsi', 'kab_kota', 'uji_coba', 'waktu'], rows: [] };
    let cid = 0;
    SEGS.forEach((seg) => {
      const qs = qsFor(seg);
      const bias = {}; qs.forEach((q) => { if (q.opts) bias[q.id] = q.opts.map(() => 0.2 + rnd() * 2); });
      const rows = []; let headers = null;
      for (let i = 0; i < N[seg]; i++) {
        const a = {};
        qs.forEach((q) => {
          if (q.showIf && !q.showIf(a)) return;
          if (q.type === 'rc') a[q.id] = pick(q.opts.map((o) => o.v), bias[q.id]);
          else if (q.type === 'select') a[q.id] = pick(PROV, PW);
          else if (q.type === 'text') a[q.id] = pick(KAB[a.U1] || ['Kab. Lainnya']);
          else if (q.type === 'cb') {
            const free = q.opts.filter((o) => !o.exclusive);
            if (q.opts.some((o) => o.exclusive) && rnd() < 0.12) { a[q.id] = [q.opts.find((o) => o.exclusive).v]; return; }
            const k = 1 + Math.floor(rnd() * (q.max || 3)); const s = new Set();
            for (let j = 0; j < k * 2 && s.size < k; j++) s.add(pick(free.map((o) => o.v), bias[q.id].filter((_, x) => !q.opts[x].exclusive)));
            a[q.id] = Array.from(s);
          } else if (q.type === 'sk') a[q.id] = pick([1, 2, 3, 4, 5], [1, 2, 3, 3, 2]);
          else if (q.type === 'mx') { const o = {}; q.rows.forEach((r) => { o[r.v] = pick([1, 2, 3, 4, 5], [1, 1, 2, 3, 3].map((w, x) => w + (r.v.charCodeAt(0) % 3 === x % 3 ? 2 : 0))); }); a[q.id] = o; }
          else if (q.type === 'tx') { if (rnd() < 0.45) a[q.id] = pick(TX[seg]); }
        });
        const t = new Date(Date.now() - Math.pow(rnd(), 1.6) * 42 * 864e5);
        const dur = Math.round(rnd() < 0.08 ? 60 + rnd() * 90 : 360 + rnd() * 700);
        const id = 'TQ-D' + seg[0].toUpperCase() + String(1000 + i).slice(1) + 'X';
        const mode = seg !== 'konsumen' && rnd() < 0.65 ? 'wawancara' : 'mandiri';
        const imp = (seg === 'peternak' && i < 6) || (seg === 'rph' && i < 2);
        const ok = imp ? 'tidak' : rnd() < 0.35 ? 'ya' : 'tidak';
        const f = [['waktu_terima', imp ? new Date(Date.now() - 40 * 864e5).toISOString() : t.toISOString()], ['id_respons', id], ['id_terkait', ''], ['waktu_mulai', new Date(t - dur * 1000).toISOString()], ['waktu_kirim', t.toISOString()],
          ['durasi_detik', dur], ['flag_durasi', dur < 200 ? 'terlalu_cepat' : ''], ['bahasa', rnd() < 0.95 ? 'id' : 'en'], ['mode', mode], ['pewawancara', mode === 'wawancara' ? pick(['Daffa', 'Tim Marketing']) : ''],
          ['perangkat', pick(['mobile · Android', 'mobile · iOS', 'desktop · Windows'], [7, 2, 1])], ['sumber', pick(['', 'grup-wa-peternak', 'instagram'], [5, 2, 1])], ['versi', C.VERSION], ['bersedia_dihubungi', ok]];
        qs.forEach((q) => {
          const v = a[q.id];
          if (q.type === 'mx') { q.rows.forEach((r) => f.push([q.id + '_' + r.v, v ? v[r.v] : ''])); return; }
          if (q.opts) { const arr = v == null ? [] : Array.isArray(v) ? v : [v]; f.push([q.id, arr.join('; ')]); f.push([q.id + '_teks', arr.map((x) => optLabel(q, x)).join('; ')]); return; }
          f.push([q.id, v == null ? '' : v]);
        });
        CHS.forEach((ch) => f.push(['catatan_' + ch, mode === 'wawancara' && ch === 'b4' && rnd() < 0.4 ? 'Responden terlihat ragu soal biaya, minta contoh nyata dulu.' : '']));
        f.push(['asal_data', imp ? 'impor' : 'web'], ['tanggal_wawancara', imp ? '2026-08-' + String(10 + i * 3) : ''], ['id_impor', imp ? 'IMP-20260905-1410-DMO' : ''], ['keterangan_impor', imp ? 'Wawancara kemitraan peternakan (contoh)' : ''],
          ['catatan_umum', imp && i % 2 === 0 ? 'Peternak mitra, mencatat di buku; tertarik bila ada pendampingan.' : ''], ['_utuh', seg === 'konsumen' && i === 7 ? 'diubah' : 'ya']);
        if (imp) { f.forEach((x) => { if (x[0] === 'flag_durasi') x[1] = ''; if (x[0] === 'mode') x[1] = 'wawancara'; if (x[0] === 'durasi_detik') x[1] = ''; if (x[0] === 'pewawancara') x[1] = 'Daffa'; if (x[0] === 'sumber') x[1] = 'impor'; }); }
        if (!headers) headers = f.map((x) => x[0]);
        rows.push(f.map((x) => x[1]));
        if (ok === 'ya' && seg !== 'konsumen') { cid++; contacts.rows.push([t.toISOString(), id, seg, 'Responden Demo ' + cid, '6281200000' + String(100 + cid).slice(1), a.U1, a.U2 || '', a[PILOT_Q[seg]] || '', t.toISOString()]); }
      }
      segments[seg] = { headers: headers || [], rows };
    });
    return { ok: true, segments, contacts, generatedAt: new Date().toISOString() };
  }

  /* ---------- pembaruan otomatis ----------
     Dashboard mengambil data terbaru tiap 3 menit selama tab terbuka, dan langsung saat tab
     dibuka lagi. Tab yang tersembunyi tidak memanggil server (hemat kuota Apps Script). */
  const AUTO_MS = 3 * 60 * 1000;
  function autoRefresh(force) {
    if (D.demo || !D.user || !D.recs || D.view !== 'app' || D.loading || document.visibilityState !== 'visible') return;
    if (D.imp && (D.imp.busy || D.imp.parsed)) return; // jangan ganggu impor yang sedang diperiksa
    if (!force && D.updated && Date.now() - D.updated < AUTO_MS - 5000) return;
    load();
  }
  setInterval(() => autoRefresh(false), 30 * 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && D.updated && Date.now() - D.updated > 60 * 1000) autoRefresh(true); });

  /* ---------- mulai ---------- */
  document.documentElement.lang = 'id';
  const hash = location.hash.slice(1);
  if (hash && (hash === 'ikhtisar' || SEGS.includes(hash) || hash === 'suara' || hash === 'kontak' || hash === 'akses' || hash === 'impor')) D.page = hash;
  const saved = sess.get();
  if (new URLSearchParams(location.search).get('demo') === '1') { D.demo = true; D.user = new URLSearchParams(location.search).get('as') === 'mitra' ? { u: 'budi.s', nama: 'Budi Santoso (contoh)', kategori: 'mitra', peran: 'mitra', org: 'Modal Ventura Contoh', aksesSampai: plusDays(5) } : { u: 'demo', nama: 'Mode Demo', kategori: 'internal', peran: 'founder' }; load(); if (D.page === 'akses') loadUsers(); }
  else if (saved && saved.session && CFG.ENDPOINT) { D.session = saved.session; D.user = saved.user; if (D.user.mustChange) { D.view = 'pw'; render(); } else { load(); if (D.page === 'akses') loadUsers(); } }
  else render();
})();
