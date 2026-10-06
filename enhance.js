/* ============================================================================
   Premium enhancement layer — shared behavior across all project websites.
   Progressive enhancement: everything is guarded, degrades gracefully with JS
   off, and respects prefers-reduced-motion. Safe to drop into any of the sites.
   ============================================================================ */
(function () {
  var d = document, root = d.documentElement, body = d.body;
  root.classList.add('x-js');
  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var hasIO = 'IntersectionObserver' in window;

  /* ---- reading progress + back-to-top ---- */
  var pb = d.createElement('div'); pb.className = 'x-progress'; body.appendChild(pb);
  var bt = d.createElement('button'); bt.className = 'x-top'; bt.type = 'button';
  bt.setAttribute('aria-label', 'Back to top'); bt.innerHTML = '↑';
  bt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  body.appendChild(bt);
  var topbar = d.querySelector('.topbar');
  function onScroll() {
    var h = d.documentElement;
    var sc = h.scrollTop || body.scrollTop || 0;
    var max = (h.scrollHeight - h.clientHeight) || 1;
    pb.style.width = (sc / max * 100) + '%';
    bt.classList.toggle('show', sc > 420);
    if (topbar) topbar.classList.toggle('x-scrolled', sc > 12);
  }
  d.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---- scroll reveal ---- */
  var revSel = 'main > section, .hero, .overview-row, .card, .figure-card, .metrics, .metric-grid, .dataset-tabs, .result-controls';
  var els = [].slice.call(d.querySelectorAll(revSel)).filter(function (e) {
    return !e.closest('.x-rail') && !e.closest('.topbar');
  });
  if (hasIO && !reduce && els.length) {
    els.forEach(function (e) { e.classList.add('x-reveal'); });
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('x-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });
    els.forEach(function (e) { io.observe(e); });
    // safety net: never leave content hidden
    setTimeout(function () { els.forEach(function (e) { e.classList.add('x-in'); }); }, 3800);
  }

  /* ---- metric count-up ---- */
  function countUp(el) {
    var raw = el.getAttribute('data-x-raw');
    if (raw == null) { raw = el.textContent; el.setAttribute('data-x-raw', raw); }
    var groups = raw.match(/\d+(\.\d+)?/g);
    if (!groups || groups.length !== 1) return; // skip "3 + 2" etc.
    var m = raw.match(/\d+(\.\d+)?/);
    var target = parseFloat(m[0]);
    var prefix = raw.slice(0, m.index), suffix = raw.slice(m.index + m[0].length);
    var dec = (m[0].split('.')[1] || '').length;
    var t0 = null, dur = 1150;
    function fr(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * e).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(fr); else el.textContent = raw;
    }
    requestAnimationFrame(fr);
  }
  var metricNums = [].slice.call(d.querySelectorAll('.metrics h3, .metric-grid h3, .stat h3, .kpi h3'));
  if (hasIO && !reduce && metricNums.length) {
    var mo = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); mo.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    metricNums.forEach(function (e) { mo.observe(e); });
  }

  /* ---- nav scroll-spy ---- */
  var navLinks = [].slice.call(d.querySelectorAll('.topbar nav a[href^="#"]'));
  var navSecs = navLinks.map(function (a) {
    return d.getElementById(a.getAttribute('href').slice(1));
  });
  function spy() {
    var pos = (d.documentElement.scrollTop || 0) + 130, cur = -1;
    navSecs.forEach(function (s, i) { if (s && s.offsetTop <= pos) cur = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('x-active', i === cur); });
  }
  if (navLinks.length) { d.addEventListener('scroll', spy, { passive: true }); spy(); }

  /* ---- section outline rail ---- */
  var railSecs = [].slice.call(d.querySelectorAll('main section[id]')).filter(function (s) {
    return s.querySelector('h2, h1');
  });
  if (railSecs.length >= 3) {
    var rail = d.createElement('nav'); rail.className = 'x-rail';
    rail.setAttribute('aria-label', 'Section navigation');
    railSecs.forEach(function (s) {
      var h = s.querySelector('h2, h1');
      var a = d.createElement('a');
      a.href = '#' + s.id;
      a.setAttribute('data-label', (h ? h.textContent : s.id).trim());
      rail.appendChild(a);
    });
    body.appendChild(rail);
    var rlinks = [].slice.call(rail.children);
    function railSpy() {
      var pos = (d.documentElement.scrollTop || 0) + 150, cur = -1;
      railSecs.forEach(function (s, i) { if (s.offsetTop <= pos) cur = i; });
      rlinks.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
    }
    d.addEventListener('scroll', railSpy, { passive: true }); railSpy();
  }

  /* ---- author name -> personal website ---- */
  var PERSONAL = 'https://gongzhiren.github.io/personal-website/';
  var nameEls = [].slice.call(d.querySelectorAll('.author-hero-names, p.authors, .authors'));
  nameEls.forEach(function (el) {
    if (el.querySelector('.x-me') || !/Zhiren\s+Gong/.test(el.innerHTML)) return;
    el.innerHTML = el.innerHTML.replace(/Zhiren\s+Gong/g,
      '<a class="x-me" href="' + PERSONAL + '" target="_blank" rel="noreferrer">Zhiren Gong</a>');
  });
})();
