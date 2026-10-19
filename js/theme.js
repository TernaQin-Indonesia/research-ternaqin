/* Tema terang/gelap — dimuat di <head> agar tidak berkedip. Pilihan disimpan per perangkat. */
(function () {
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('tq_theme'); } catch (e) { /* storage tidak tersedia */ }
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  var api = {
    get: function () {
      var a = root.getAttribute('data-theme');
      if (a === 'light' || a === 'dark') return a;
      return mq && mq.matches ? 'dark' : 'light';
    },
    toggle: function () {
      var next = api.get() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('tq_theme', next); } catch (e) { /* abaikan */ }
      api.sync();
      return next;
    },
    sync: function () {
      var dark = api.get() === 'dark';
      var en = root.lang === 'en';
      var label = dark ? (en ? 'Switch to light mode' : 'Ganti ke mode terang') : (en ? 'Switch to dark mode' : 'Ganti ke mode gelap');
      var btns = document.querySelectorAll('[data-theme-toggle]');
      for (var i = 0; i < btns.length; i++) {
        btns[i].innerHTML = '<i class="ph ' + (dark ? 'ph-sun' : 'ph-moon') + '"></i>';
        btns[i].setAttribute('aria-label', label);
        btns[i].title = label;
      }
      var meta = document.querySelector('meta[name="theme-color"]:not([media])');
      if (meta) meta.setAttribute('content', dark ? '#111413' : '#F3F3F3');
      document.dispatchEvent(new CustomEvent('tq-theme', { detail: api.get() }));
    },
  };
  window.TQ_THEME = api;
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-theme-toggle]')) api.toggle();
  });
  document.addEventListener('DOMContentLoaded', api.sync);
  if (mq && mq.addEventListener) mq.addEventListener('change', api.sync);
})();
