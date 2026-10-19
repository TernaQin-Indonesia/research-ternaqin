/**
 * TernaQin — Penerima jawaban Riset Lapangan + API Dashboard  (v3)
 *
 * PEMASANGAN (sekali saja, tidak perlu mengubah kode apa pun):
 *   1. Tempel seluruh file ini ke Extensions → Apps Script pada Google Sheet riset, lalu Save.
 *   2. Pilih fungsi `setup` → Run → izinkan akses.
 *   3. Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 *   4. Kembali ke Google Sheet, muat ulang halaman. Muncul menu "TernaQin" di menu atas.
 *      Pilih TernaQin → "Buat akun founder" untuk membuat akun pertama.
 *   5. Akun berikutnya (tim riset & mitra) dibuat founder dari dashboard, halaman "Akses tim".
 *
 * KATEGORI AKUN
 *   Tim internal  · founder  : semua data, kontak responden, unduh Excel, kelola akun
 *                 · riset    : semua data & unduh Excel, tanpa kontak, tanpa kelola akun
 *   Mitra         · mitra    : temuan & grafik saja (untuk investor/mitra kerja sama).
 *                              Tanpa kontak, tanpa ID responden, tanpa kabupaten, tanpa catatan
 *                              pewawancara, tanpa unduh Excel. Punya tanggal berakhir akses.
 *                              Penyaringan dilakukan DI SERVER, bukan hanya disembunyikan di layar.
 *
 * IMPOR WAWANCARA LAMA (founder, dari dashboard → "Impor data lama")
 *   Wawancara yang dilakukan sebelum website ada dapat dimasukkan lewat template Excel.
 *   Setiap baris impor ditandai asal_data = "impor", menyimpan tanggal wawancara asli,
 *   keterangan sumber, nomor batch, dan siapa yang mengimpor. Riwayatnya tercatat di tab
 *   Riwayat_Impor dan Log. Batch yang keliru bisa ditarik kembali; penarikan juga tercatat.
 *
 * SIDIK INTEGRITAS
 *   Setiap baris (dari website maupun impor) diberi sidik HMAC saat masuk. Saat dashboard
 *   memuat data, sidik dihitung ulang; baris yang isinya diubah manual di Sheet sesudahnya
 *   ditandai "diubah". Ini mendeteksi perubahan, bukan mencegahnya: orang yang punya akses
 *   editor ke Apps Script tetap bisa mengakali. Untuk bukti yang lebih kuat, sidik bisa
 *   dijangkarkan ke pihak ketiga (mis. blockchain) di tahap berikutnya.
 *
 * KEAMANAN
 *   - Password tidak pernah disimpan; yang disimpan hanya salt + hash SHA-256 berulang.
 *   - Akun baru & reset mendapat password sementara yang WAJIB diganti saat login pertama.
 *   - Token sesi bertanda tangan HMAC, berlaku 12 jam; otomatis batal bila password direset,
 *     akun dinonaktifkan/dihapus, atau akses mitra berakhir.
 *   - 5 kali salah password dalam 15 menit → akun dikunci 15 menit.
 */

const TOKEN = 'tq-riset-2026-9f4c2a'; // harus sama dengan TOKEN di js/config.js (khusus kiriman survei)
const SHEETS = { peternak: 'Respons_Peternak', rph: 'Respons_RPH', pedagang: 'Respons_Pedagang', konsumen: 'Respons_Konsumen' };
const CONTACT_SHEET = 'Kontak';
const LOG_SHEET = 'Log';
const CONTACT_HEADERS = ['waktu_terima', 'id_respons', 'peran', 'nama', 'whatsapp', 'provinsi', 'kab_kota', 'uji_coba', 'waktu'];
const SESSION_HOURS = 12;
const HASH_ROUNDS = 400;
const MAX_FAILS = 5;
const PERAN = { founder: 'Founder', riset: 'Tim riset', mitra: 'Mitra' };
// Kolom yang TIDAK pernah dikirim ke akun mitra
const MITRA_HIDDEN = /^(id_terkait|pewawancara|perangkat|sumber|bersedia_dihubungi|U2|catatan_.*|waktu_mulai|versi|sidik|kunci_impor|diimpor_oleh|id_impor)$/;
const IMPORT_SHEET = 'Riwayat_Impor';
const IMPORT_HEADERS = ['id_impor', 'waktu_impor', 'diimpor_oleh', 'keterangan', 'peternak', 'rph', 'pedagang', 'konsumen', 'total', 'status', 'ditarik_pada', 'ditarik_oleh'];
const IMPORT_MAX = 500;
const ANSWER_KEY = /^(U[1-3]|C1|[PRDK]\d{1,2})(_[a-z0-9]{1,12})?$/;
const NO_SEAL = { sidik: 1, _utuh: 1 };

/* =================================================================
   MENU DI GOOGLE SHEET (muncul otomatis saat Sheet dibuka)
   ================================================================= */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('TernaQin')
    .addItem('Buat akun founder', 'menuBuatFounder')
    .addItem('Reset password akun', 'menuResetPassword')
    .addItem('Lihat daftar akun', 'menuDaftarAkun')
    .addSeparator()
    .addItem('Keluarkan semua sesi login', 'menuCabutSesi')
    .addToUi();
}

function menuBuatFounder() {
  const ui = SpreadsheetApp.getUi();
  const r1 = ui.prompt('Buat akun founder (1/2)', 'Username untuk login.\nHuruf kecil, angka, titik, minus, atau garis bawah. Contoh: daffa', ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  const r2 = ui.prompt('Buat akun founder (2/2)', 'Nama yang tampil di dashboard. Contoh: Daffa Naufal', ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;
  try {
    const res = createUser_({ username: r1.getResponseText(), nama: r2.getResponseText(), kategori: 'internal', peran: 'founder' }, 'menu-sheet');
    ui.alert('Akun founder dibuat',
      'Username: ' + res.user.u + '\nPassword sementara: ' + res.password +
      '\n\nCatat password ini sekarang — tidak bisa dilihat lagi.\nSaat login pertama di dashboard, Anda akan diminta membuat password sendiri.',
      ui.ButtonSet.OK);
  } catch (e) { ui.alert('Gagal membuat akun', String(e.message || e), ui.ButtonSet.OK); }
}

function menuResetPassword() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Reset password', 'Username yang ingin direset:', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  try {
    const res = resetPassword_(r.getResponseText(), 'menu-sheet');
    ui.alert('Password direset', 'Username: ' + res.user.u + '\nPassword sementara baru: ' + res.password + '\n\nSesi lama orang ini otomatis keluar. Ia wajib mengganti password saat login.', ui.ButtonSet.OK);
  } catch (e) { ui.alert('Gagal', String(e.message || e), ui.ButtonSet.OK); }
}

function menuDaftarAkun() {
  const list = listUsers_();
  const txt = list.length ? list.map(function (u) {
    return '• ' + u.u + ' — ' + u.nama + ' (' + PERAN[u.peran] + (u.org ? ', ' + u.org : '') + ')' +
      (u.status !== 'aktif' ? ' [' + u.status + ']' : '') + (u.aksesSampai ? ' s.d. ' + u.aksesSampai : '');
  }).join('\n') : 'Belum ada akun. Pilih TernaQin → Buat akun founder.';
  SpreadsheetApp.getUi().alert('Daftar akun dashboard', txt, SpreadsheetApp.getUi().ButtonSet.OK);
}

function menuCabutSesi() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Keluarkan semua sesi?', 'Semua orang (termasuk Anda) harus login ulang di dashboard. Lanjutkan?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  PropertiesService.getScriptProperties().setProperty('SESSION_SECRET', Utilities.getUuid() + Utilities.getUuid());
  log_('semua_sesi_dicabut', 'menu-sheet');
  ui.alert('Selesai. Semua sesi sudah dikeluarkan.');
}

/** Jalankan sekali dari editor: membuat semua tab dan kunci sesi. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(function (k) { sheet_(ss, SHEETS[k], ['waktu_terima', 'id_respons']); });
  sheet_(ss, CONTACT_SHEET, CONTACT_HEADERS);
  sheet_(ss, LOG_SHEET, ['waktu', 'jenis', 'keterangan']);
  sheet_(ss, IMPORT_SHEET, IMPORT_HEADERS);
  integrityKey_();
  const first = ss.getSheetByName('Sheet1') || ss.getSheetByName('Lembar1');
  if (first && first.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(first);
  secret_();

  // Buat akun founder pertama otomatis jika belum ada
  if (!getUser_('admin')) {
    var res = createUser_({ username: 'admin', nama: 'Admin TernaQin', kategori: 'internal', peran: 'founder' }, 'setup');
    Logger.log('========================================');
    Logger.log('AKUN FOUNDER PERTAMA BERHASIL DIBUAT');
    Logger.log('Username : admin');
    Logger.log('Password : ' + res.password);
    Logger.log('========================================');
    Logger.log('Catat password di atas! Tidak bisa dilihat lagi.');
    Logger.log('Saat login pertama di /dashboard, Anda akan diminta membuat password sendiri.');
  } else {
    Logger.log('Akun founder "admin" sudah ada. Lewati pembuatan akun.');
  }

  Logger.log('Setup selesai.');
}

/* =================================================================
   PINTU MASUK HTTP
   ================================================================= */
function doGet() {
  return json_({ ok: true, service: 'TernaQin Riset', time: new Date().toISOString() });
}

function doPost(e) {
  let p;
  try { p = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return json_({ ok: false, error: 'format' }); }
  try {
    switch (p.action) {
      case 'login': return json_(login_(p));
      case 'data': return json_(withSession_(p, data_));
      case 'me': return json_(withSession_(p, function (s) { return { ok: true, user: s }; }));
      case 'changePassword': return json_(changePassword_(p));
      case 'users': return json_(withFounder_(p, function () { return { ok: true, users: listUsers_() }; }));
      case 'userAdd': return json_(withFounder_(p, function (s) { const r = createUser_(p.user || {}, s.u); return { ok: true, user: r.user, password: r.password }; }));
      case 'userReset': return json_(withFounder_(p, function (s) { const r = resetPassword_(p.username, s.u); return { ok: true, user: r.user, password: r.password }; }));
      case 'userUpdate': return json_(withFounder_(p, function (s) { return { ok: true, user: updateUser_(p.username, p.changes || {}, s) }; }));
      case 'userDelete': return json_(withFounder_(p, function (s) { deleteUser_(p.username, s); return { ok: true }; }));
      case 'import': return json_(withFounder_(p, function (s) { return import_(p.batch || {}, s); }));
      case 'imports': return json_(withFounder_(p, function () { return { ok: true, imports: imports_() }; }));
      case 'importWithdraw': return json_(withFounder_(p, function (s) { return withdraw_(p.id, s); }));
      default: return json_(submit_(p));
    }
  } catch (err) {
    const msg = String(err && err.message || err);
    if (/^USER:/.test(msg)) return json_({ ok: false, error: 'input', message: msg.slice(5) });
    log_('error: ' + msg, p && (p.rid || p.username));
    return json_({ ok: false, error: 'server' });
  }
}
function withSession_(p, fn) {
  const s = verify_(p.session);
  if (!s) return { ok: false, error: 'sesi' };
  if (s.mustChange) return { ok: false, error: 'ganti_password' };
  return fn(s);
}
function withFounder_(p, fn) {
  return withSession_(p, function (s) { return s.peran === 'founder' ? fn(s) : { ok: false, error: 'akses' }; });
}

/* =================================================================
   KIRIMAN SURVEI
   ================================================================= */
function submit_(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (p.token !== TOKEN) { log_('token_salah', p.rid); return { ok: false, error: 'token' }; }
    if (p.hp) { log_('honeypot', p.rid); return { ok: true }; } // bot: pura-pura berhasil, tidak disimpan
    const name = SHEETS[p.role];
    if (!name || !Array.isArray(p.fields) || !p.rid || !/^TQ-[A-Z0-9]{6}$/.test(p.rid)) return { ok: false, error: 'format' };
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = sheet_(ss, name, ['waktu_terima']);
    if (exists_(sh, p.rid)) return { ok: true, duplicate: true };
    const fields = [['waktu_terima', new Date()]].concat(p.fields.slice(0, 400).filter(function (f) { return !/^(asal_data|id_impor|kunci_impor|diimpor_oleh|keterangan_impor|tanggal_wawancara|sidik|_utuh)$/.test(String(f[0])); }), [['asal_data', 'web']]);
    const headers = ensureHeaders_(sh, fields.map(function (f) { return String(f[0]).slice(0, 60); }).concat(['sidik']));
    const map = {}; fields.forEach(function (f) { map[String(f[0]).slice(0, 60)] = f[1]; });
    sh.appendRow(headers.map(function (h) { return clean_(map[h]); }));
    seal_(sh, sh.getLastRow(), 1);
    if (p.contact && p.contact.whatsapp) {
      const cs = sheet_(ss, CONTACT_SHEET, CONTACT_HEADERS);
      cs.appendRow(CONTACT_HEADERS.map(function (h) { return h === 'waktu_terima' ? new Date() : clean_(p.contact[h]); }));
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* =================================================================
   LOGIN & SESI
   ================================================================= */
function login_(p) {
  const u = String(p.username || '').trim().toLowerCase();
  const pw = String(p.password || '');
  if (!u || !pw) return { ok: false, error: 'kosong' };
  const cache = CacheService.getScriptCache();
  const fk = 'fail_' + u;
  const fails = Number(cache.get(fk) || 0);
  if (fails >= MAX_FAILS) { log_('login_terkunci', u); return { ok: false, error: 'terkunci' }; }
  const rec = getUser_(u);
  const h = hash_(pw, rec ? rec.salt : 'x'); // tetap dihitung agar waktu respons tidak membocorkan username
  if (!rec || h !== rec.hash) {
    cache.put(fk, String(fails + 1), 900);
    log_('login_gagal', u);
    return { ok: false, error: 'salah', sisa: Math.max(0, MAX_FAILS - fails - 1) };
  }
  const st = status_(rec);
  if (st === 'nonaktif') { log_('login_nonaktif', u); return { ok: false, error: 'nonaktif' }; }
  if (st === 'berakhir') { log_('login_berakhir', u); return { ok: false, error: 'berakhir', aksesSampai: rec.aksesSampai }; }
  cache.remove(fk);
  rec.loginTerakhir = new Date().toISOString();
  putUser_(rec);
  log_('login_ok', u);
  const sess = sessionOf_(rec);
  return { ok: true, session: sign_(sess), user: sess };
}

function changePassword_(p) {
  const s = verify_(p.session);
  if (!s) return { ok: false, error: 'sesi' };
  const rec = getUser_(s.u);
  if (!rec || hash_(String(p.oldPassword || ''), rec.salt) !== rec.hash) return { ok: false, error: 'salah' };
  const np = String(p.newPassword || '');
  if (np.length < 10) return { ok: false, error: 'input', message: 'Password baru minimal 10 karakter.' };
  if (np === String(p.oldPassword)) return { ok: false, error: 'input', message: 'Password baru harus berbeda dari yang lama.' };
  if (np.toLowerCase().indexOf(rec.u) > -1) return { ok: false, error: 'input', message: 'Password tidak boleh mengandung username.' };
  rec.salt = Utilities.getUuid();
  rec.hash = hash_(np, rec.salt);
  rec.pv = (rec.pv || 0) + 1;
  rec.mustChange = false;
  putUser_(rec);
  log_('ganti_password', rec.u);
  const sess = sessionOf_(rec);
  return { ok: true, session: sign_(sess), user: sess };
}

function sessionOf_(rec) {
  return { u: rec.u, nama: rec.nama, kategori: rec.kategori, peran: rec.peran, org: rec.org || '', aksesSampai: rec.aksesSampai || '',
    mustChange: !!rec.mustChange, pv: rec.pv || 0, exp: Date.now() + SESSION_HOURS * 3600 * 1000 };
}

/* =================================================================
   DATA UNTUK DASHBOARD
   ================================================================= */
function data_(s) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mitra = s.kategori === 'mitra';
  const out = { ok: true, user: s, generatedAt: new Date().toISOString(), segments: {}, contacts: null };
  Object.keys(SHEETS).forEach(function (k) {
    const sh = ss.getSheetByName(SHEETS[k]);
    const t = sh ? withIntegrity_(table_(sh)) : { headers: [], rows: [] };
    out.segments[k] = mitra ? forMitra_(t, k) : t;
  });
  if (s.peran === 'founder') {
    const cs = ss.getSheetByName(CONTACT_SHEET);
    out.contacts = cs ? table_(cs) : { headers: CONTACT_HEADERS, rows: [] };
  }
  log_('lihat_data', s.u + (mitra ? ' (mitra' + (s.org ? ': ' + s.org : '') + ')' : ''));
  return out;
}
/** Versi data untuk mitra: tanpa kolom pribadi/operasional, tanpa respons terlalu cepat, ID diganti nomor urut. */
function forMitra_(t, seg) {
  const keep = [];
  t.headers.forEach(function (h, i) { if (!MITRA_HIDDEN.test(h)) keep.push(i); });
  const fi = t.headers.indexOf('flag_durasi');
  const ii = t.headers.indexOf('id_respons');
  let n = 0;
  const rows = t.rows.filter(function (r) { return fi < 0 || r[fi] !== 'terlalu_cepat'; }).map(function (r) {
    n++;
    return keep.map(function (i) { return i === ii ? seg.slice(0, 1).toUpperCase() + '-' + ('000' + n).slice(-3) : r[i]; });
  });
  return { headers: keep.map(function (i) { return t.headers[i]; }), rows: rows };
}
function table_(sh) {
  const v = sh.getDataRange().getValues();
  if (!v.length) return { headers: [], rows: [] };
  const headers = v[0].map(String);
  const rows = v.slice(1).filter(function (r) { return r.join('') !== ''; }).map(function (r) {
    return r.map(function (c) { return c instanceof Date ? c.toISOString() : c; });
  });
  return { headers: headers, rows: rows };
}

/* =================================================================
   KELOLA AKUN
   ================================================================= */
function createUser_(d, by) {
  const u = String(d.username || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(u)) throw new Error('USER:Username 3–30 karakter: huruf kecil, angka, titik, minus, atau garis bawah.');
  if (getUser_(u)) throw new Error('USER:Username "' + u + '" sudah dipakai.');
  const nama = String(d.nama || '').trim().slice(0, 60);
  if (!nama) throw new Error('USER:Nama wajib diisi.');
  const kategori = d.kategori === 'mitra' ? 'mitra' : 'internal';
  const peran = kategori === 'mitra' ? 'mitra' : (d.peran === 'founder' ? 'founder' : 'riset');
  let aksesSampai = '';
  if (kategori === 'mitra') {
    aksesSampai = String(d.aksesSampai || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(aksesSampai)) throw new Error('USER:Tanggal akhir akses mitra wajib diisi.');
  }
  const pw = tempPassword_();
  const salt = Utilities.getUuid();
  const rec = { u: u, nama: nama, kategori: kategori, peran: peran, org: kategori === 'mitra' ? String(d.org || '').trim().slice(0, 60) : '',
    catatan: String(d.catatan || '').trim().slice(0, 160), aksesSampai: aksesSampai, aktif: true, salt: salt, hash: hash_(pw, salt), pv: 1, mustChange: true,
    dibuat: new Date().toISOString(), dibuatOleh: by || '', loginTerakhir: '' };
  putUser_(rec);
  log_('akun_dibuat', u + ' (' + peran + ') oleh ' + by);
  return { user: publicUser_(rec), password: pw };
}
function resetPassword_(username, by) {
  const rec = getUser_(String(username || '').trim().toLowerCase());
  if (!rec) throw new Error('USER:Username tidak ditemukan.');
  const pw = tempPassword_();
  rec.salt = Utilities.getUuid();
  rec.hash = hash_(pw, rec.salt);
  rec.pv = (rec.pv || 0) + 1; // sesi lama otomatis batal
  rec.mustChange = true;
  putUser_(rec);
  CacheService.getScriptCache().remove('fail_' + rec.u);
  log_('password_direset', rec.u + ' oleh ' + by);
  return { user: publicUser_(rec), password: pw };
}
function updateUser_(username, ch, s) {
  const rec = getUser_(String(username || '').trim().toLowerCase());
  if (!rec) throw new Error('USER:Username tidak ditemukan.');
  if ('aktif' in ch) {
    if (!ch.aktif && rec.u === s.u) throw new Error('USER:Anda tidak bisa menonaktifkan akun sendiri.');
    if (!ch.aktif && rec.peran === 'founder' && activeFounders_() <= 1) throw new Error('USER:Harus ada minimal satu founder aktif.');
    rec.aktif = !!ch.aktif;
    if (!rec.aktif) rec.pv = (rec.pv || 0) + 1;
  }
  if ('aksesSampai' in ch && rec.kategori === 'mitra') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ch.aksesSampai))) throw new Error('USER:Format tanggal tidak valid.');
    rec.aksesSampai = String(ch.aksesSampai);
  }
  if ('nama' in ch && String(ch.nama).trim()) rec.nama = String(ch.nama).trim().slice(0, 60);
  if ('org' in ch && rec.kategori === 'mitra') rec.org = String(ch.org).trim().slice(0, 60);
  putUser_(rec);
  log_('akun_diubah', rec.u + ' oleh ' + s.u + ' ' + JSON.stringify(ch));
  return publicUser_(rec);
}
function deleteUser_(username, s) {
  const rec = getUser_(String(username || '').trim().toLowerCase());
  if (!rec) throw new Error('USER:Username tidak ditemukan.');
  if (rec.u === s.u) throw new Error('USER:Anda tidak bisa menghapus akun sendiri.');
  if (rec.peran === 'founder' && rec.aktif && activeFounders_() <= 1) throw new Error('USER:Harus ada minimal satu founder aktif.');
  PropertiesService.getScriptProperties().deleteProperty('USER_' + rec.u);
  log_('akun_dihapus', rec.u + ' oleh ' + s.u);
}
function listUsers_() {
  const all = PropertiesService.getScriptProperties().getProperties();
  return Object.keys(all).filter(function (k) { return k.indexOf('USER_') === 0; })
    .map(function (k) { try { return publicUser_(JSON.parse(all[k])); } catch (e) { return null; } })
    .filter(Boolean)
    .sort(function (a, b) { return (a.kategori === b.kategori ? 0 : a.kategori === 'internal' ? -1 : 1) || a.nama.localeCompare(b.nama); });
}
function activeFounders_() { return listUsers_().filter(function (u) { return u.peran === 'founder' && u.status === 'aktif'; }).length; }
function publicUser_(r) {
  return { u: r.u, nama: r.nama, kategori: r.kategori, peran: r.peran, org: r.org || '', catatan: r.catatan || '', aksesSampai: r.aksesSampai || '',
    status: status_(r), mustChange: !!r.mustChange, dibuat: r.dibuat, dibuatOleh: r.dibuatOleh || '', loginTerakhir: r.loginTerakhir || '' };
}
function status_(r) {
  if (!r.aktif) return 'nonaktif';
  if (r.kategori === 'mitra' && r.aksesSampai && new Date(r.aksesSampai + 'T23:59:59+07:00').getTime() < Date.now()) return 'berakhir';
  return 'aktif';
}
function getUser_(u) {
  if (!u) return null;
  const raw = PropertiesService.getScriptProperties().getProperty('USER_' + u);
  try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
function putUser_(rec) { PropertiesService.getScriptProperties().setProperty('USER_' + rec.u, JSON.stringify(rec)); }
function tempPassword_() {
  const abc = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Utilities.getUuid() + Date.now());
  let s = '';
  for (let i = 0; i < 12; i++) { s += abc[(bytes[i] + 256) % abc.length]; if (i === 3 || i === 7) s += '-'; }
  return s;
}

/* =================================================================
   IMPOR WAWANCARA LAMA
   ================================================================= */
function import_(b, s) {
  const label = String(b.label || '').trim();
  if (label.length < 5 || label.length > 160) throw new Error('USER:Keterangan sumber wajib diisi (5–160 karakter).');
  if (b.attest !== true) throw new Error('USER:Pernyataan keaslian data wajib dicentang.');
  const rows = Array.isArray(b.rows) ? b.rows : [];
  if (!rows.length) throw new Error('USER:Tidak ada baris untuk diimpor.');
  if (rows.length > IMPORT_MAX) throw new Error('USER:Maksimal ' + IMPORT_MAX + ' baris per impor. Bagi menjadi beberapa file.');
  const today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    // validasi seluruh batch dulu: semua masuk atau tidak sama sekali
    const prepared = rows.map(function (r, i) {
      const where = 'Baris ' + (r.ref || i + 1) + ': ';
      if (!SHEETS[r.seg]) throw new Error('USER:' + where + 'segmen tidak dikenal.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(r.tanggal)) || r.tanggal < '2020-01-01' || r.tanggal > today) throw new Error('USER:' + where + 'tanggal wawancara tidak valid.');
      const iv = String(r.pewawancara || '').trim();
      if (!iv) throw new Error('USER:' + where + 'nama pewawancara wajib diisi.');
      const ans = {};
      (Array.isArray(r.fields) ? r.fields : []).slice(0, 400).forEach(function (f) {
        const k = String(f[0]); const v = String(f[1] == null ? '' : f[1]).trim().slice(0, 3000);
        if ((ANSWER_KEY.test(k) || k === 'catatan_umum') && v !== '') ans[k] = v;
      });
      if (!ans.U1) throw new Error('USER:' + where + 'provinsi (U1) wajib diisi.');
      const keyBase = r.seg + '|' + r.tanggal + '|' + iv.toLowerCase() + '|' + Object.keys(ans).sort().map(function (k) { return k + '=' + ans[k]; }).join('&');
      return { seg: r.seg, tanggal: r.tanggal, iv: iv.slice(0, 60), ans: ans, key: sha_(keyBase), where: where };
    });
    const seen = {};
    prepared.forEach(function (r) { if (seen[r.key]) throw new Error('USER:' + r.where + 'sama persis dengan baris lain di file ini.'); seen[r.key] = 1; });
    Object.keys(SHEETS).forEach(function (k) {
      const sh = ss.getSheetByName(SHEETS[k]); if (!sh || sh.getLastRow() < 2) return;
      const t = table_(sh); const ki = t.headers.indexOf('kunci_impor'); if (ki < 0) return;
      t.rows.forEach(function (row) { if (seen[row[ki]]) { const dup = prepared.filter(function (r) { return r.key === row[ki]; })[0]; throw new Error('USER:' + dup.where + 'sudah pernah diimpor sebelumnya (data ganda).'); } });
    });

    const id = 'IMP-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmm') + '-' + rand_(3);
    const now = new Date();
    const counts = { peternak: 0, rph: 0, pedagang: 0, konsumen: 0 };
    Object.keys(SHEETS).forEach(function (seg) {
      const list = prepared.filter(function (r) { return r.seg === seg; });
      if (!list.length) return;
      const sh = sheet_(ss, SHEETS[seg], ['waktu_terima', 'id_respons']);
      const base = ['waktu_terima', 'id_respons', 'tanggal_wawancara', 'durasi_detik', 'flag_durasi', 'bahasa', 'mode', 'pewawancara', 'sumber', 'versi', 'asal_data', 'id_impor', 'keterangan_impor', 'diimpor_oleh', 'kunci_impor'];
      const keys = {}; list.forEach(function (r) { Object.keys(r.ans).forEach(function (k) { keys[k] = 1; }); });
      const headers = ensureHeaders_(sh, base.concat(Object.keys(keys).sort(), ['sidik']));
      const out = list.map(function (r) {
        let rid; do { rid = 'TQ-' + rand_(6); } while (exists_(sh, rid));
        const m = { waktu_terima: now, id_respons: rid, tanggal_wawancara: r.tanggal, durasi_detik: '', flag_durasi: '', bahasa: 'id', mode: 'wawancara', pewawancara: r.iv,
          sumber: 'impor', versi: 'impor-1', asal_data: 'impor', id_impor: id, keterangan_impor: label, diimpor_oleh: s.u, kunci_impor: r.key };
        Object.keys(r.ans).forEach(function (k) { m[k] = r.ans[k]; });
        return headers.map(function (h) { return clean_(m[h]); });
      });
      const start = sh.getLastRow() + 1;
      sh.getRange(start, 1, out.length, headers.length).setNumberFormat('@').setValues(out);
      sh.getRange(start, headers.indexOf('waktu_terima') + 1, out.length, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss').setValues(out.map(function () { return [now]; }));
      seal_(sh, start, out.length);
      counts[seg] = out.length;
    });
    const total = prepared.length;
    sheet_(ss, IMPORT_SHEET, IMPORT_HEADERS).appendRow([id, now, s.u, clean_(label), counts.peternak, counts.rph, counts.pedagang, counts.konsumen, total, 'aktif', '', '']);
    log_('impor', id + ' · ' + total + ' baris · oleh ' + s.u + ' · ' + label);
    return { ok: true, id: id, counts: counts, total: total };
  } finally {
    lock.releaseLock();
  }
}
function imports_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(IMPORT_SHEET);
  if (!sh) return [];
  const t = table_(sh);
  return t.rows.map(function (r) { const o = {}; t.headers.forEach(function (h, i) { o[h] = r[i]; }); return o; }).reverse();
}
function withdraw_(id, s) {
  id = String(id || '');
  if (!/^IMP-[0-9-]+-[A-Z0-9]{3}$/.test(id)) throw new Error('USER:Nomor batch tidak valid.');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    let removed = 0;
    Object.keys(SHEETS).forEach(function (k) {
      const sh = ss.getSheetByName(SHEETS[k]); if (!sh || sh.getLastRow() < 2) return;
      const v = sh.getDataRange().getValues(); const ci = v[0].indexOf('id_impor'); if (ci < 0) return;
      for (let r = v.length - 1; r >= 1; r--) { if (v[r][ci] === id) { sh.deleteRow(r + 1); removed++; } }
    });
    const ish = ss.getSheetByName(IMPORT_SHEET);
    if (ish) {
      const v = ish.getDataRange().getValues();
      for (let r = 1; r < v.length; r++) if (v[r][0] === id) ish.getRange(r + 1, 10, 1, 3).setValues([['ditarik', new Date(), s.u]]);
    }
    log_('impor_ditarik', id + ' · ' + removed + ' baris · oleh ' + s.u);
    return { ok: true, removed: removed };
  } finally {
    lock.releaseLock();
  }
}

/* =================================================================
   SIDIK INTEGRITAS
   ================================================================= */
function integrityKey_() {
  // kunci terpisah dari kunci sesi: "Keluarkan semua sesi" tidak boleh membuat semua sidik tampak rusak
  const pr = PropertiesService.getScriptProperties();
  let k = pr.getProperty('INTEGRITY_SECRET');
  if (!k) { k = Utilities.getUuid() + Utilities.getUuid(); pr.setProperty('INTEGRITY_SECRET', k); }
  return k;
}
function canon_(headers, row) {
  const parts = [];
  headers.forEach(function (h, i) {
    if (!h || NO_SEAL[h]) return;
    let v = row[i];
    if (v === '' || v == null) return;
    if (v instanceof Date) v = 'd:' + v.getTime();
    else if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(v)) v = 'd:' + new Date(v).getTime();
    else v = String(v).trim();
    parts.push([h, v]);
  });
  parts.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });
  return JSON.stringify(parts);
}
function sealOf_(headers, row) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(canon_(headers, row), integrityKey_())).slice(0, 22);
}
/** Membaca kembali baris yang baru ditulis (setelah Sheets mengubah tipe data), lalu menulis sidiknya. */
function seal_(sh, startRow, n) {
  const last = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, last).getValues()[0].map(String);
  const si = headers.indexOf('sidik');
  if (si < 0) return;
  const vals = sh.getRange(startRow, 1, n, last).getValues();
  sh.getRange(startRow, si + 1, n, 1).setValues(vals.map(function (r) { return [sealOf_(headers, r)]; }));
}
/** Menambah kolom virtual _utuh: "ya" (cocok), "diubah" (isi berubah sesudah masuk), "" (baris lama tanpa sidik). */
function withIntegrity_(t) {
  const si = t.headers.indexOf('sidik');
  return { headers: t.headers.concat(['_utuh']), rows: t.rows.map(function (r) {
    const sd = si > -1 ? r[si] : '';
    return r.concat([!sd ? '' : sealOf_(t.headers, r) === sd ? 'ya' : 'diubah']);
  }) };
}
function sha_(s) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)).slice(0, 22); }
function rand_(n) {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid());
  let s = ''; for (let i = 0; i < n; i++) s += abc[(b[i] + 256) % abc.length];
  return s;
}

/* =================================================================
   PEMBANTU: hash, token, sheet
   ================================================================= */
function secret_() {
  const pr = PropertiesService.getScriptProperties();
  let s = pr.getProperty('SESSION_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); pr.setProperty('SESSION_SECRET', s); }
  return s;
}
function hash_(pw, salt) {
  let h = salt + ':' + pw;
  for (let i = 0; i < HASH_ROUNDS; i++) {
    h = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h + salt, Utilities.Charset.UTF_8));
  }
  return h;
}
function sign_(obj) {
  const body = Utilities.base64EncodeWebSafe(JSON.stringify(obj), Utilities.Charset.UTF_8);
  const sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(body, secret_()));
  return body + '.' + sig;
}
/** Memeriksa token DAN keadaan akun terkini (aktif, versi password, masa akses mitra). */
function verify_(tok) {
  if (!tok || String(tok).indexOf('.') < 0) return null;
  const parts = String(tok).split('.');
  const sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(parts[0], secret_()));
  if (sig !== parts[1]) return null;
  let obj;
  try { obj = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString('UTF-8')); } catch (e) { return null; }
  if (!obj || obj.exp < Date.now()) return null;
  const rec = getUser_(obj.u);
  if (!rec || status_(rec) !== 'aktif' || (rec.pv || 0) !== obj.pv) return null;
  // selalu pakai peran & kategori terbaru dari server, bukan dari token
  obj.peran = rec.peran; obj.kategori = rec.kategori; obj.nama = rec.nama; obj.org = rec.org || ''; obj.aksesSampai = rec.aksesSampai || ''; obj.mustChange = !!rec.mustChange;
  return obj;
}
function sheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    styleHeader_(sh, headers.length);
  }
  return sh;
}
function styleHeader_(sh, n) {
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, n).setFontWeight('bold').setBackground('#1F4941').setFontColor('#FFFFFF');
}
function ensureHeaders_(sh, names) {
  const last = Math.max(sh.getLastColumn(), 1);
  let headers = sh.getRange(1, 1, 1, last).getValues()[0].map(String).filter(function (h) { return h !== ''; });
  const missing = names.filter(function (n) { return headers.indexOf(n) === -1; });
  if (missing.length) {
    sh.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    headers = headers.concat(missing);
    styleHeader_(sh, headers.length);
  }
  return headers;
}
function exists_(sh, rid) {
  if (sh.getLastRow() < 2) return false;
  return !!sh.createTextFinder(rid).matchEntireCell(true).findNext();
}
function clean_(v) {
  if (v == null) return '';
  if (v instanceof Date || typeof v === 'number') return v;
  let s = String(v).slice(0, 5000);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // cegah formula injection
  return s;
}
function log_(kind, info) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet_(ss, LOG_SHEET, ['waktu', 'jenis', 'keterangan']).appendRow([new Date(), kind, String(info || '').slice(0, 300)]);
  } catch (x) { /* abaikan */ }
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
