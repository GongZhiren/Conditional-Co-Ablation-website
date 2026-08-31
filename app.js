/* ============================================================
   CoAx project page — interactions (vanilla JS + SVG)
   ============================================================ */
(function () {
  "use strict";
  /* -------- KaTeX auto-render -------- */
  function renderMath() {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\(", right: "\\)", display: false },
        ],
        throwOnError: false,
      });
    }
  }

  /* ============================================================
     1. Nav scroll-spy + copy bibtex
     ============================================================ */
  function bindNav() {
    const links = [...document.querySelectorAll(".nav-links a")];
    const map = {};
    links.forEach((a) => { const id = a.getAttribute("href").slice(1); if (id) map[id] = a; });
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && map[e.target.id]) {
          links.forEach((l) => l.classList.remove("active"));
          map[e.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("section[id]").forEach((s) => obs.observe(s));
  }
  function bindCopy() {
    const btn = document.getElementById("copyBib");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const txt = document.getElementById("bibContent").textContent;
      navigator.clipboard.writeText(txt).then(() => {
        const old = btn.textContent; btn.textContent = "Copied ✓";
        setTimeout(() => (btn.textContent = old), 1600);
      });
    });
  }

  /* -------- scroll progress -------- */
  function bindScrollbar() {
    const bar = document.getElementById("scrollbar");
    const on = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", on, { passive: true });
    on();
  }

  /* -------- reveal on scroll -------- */
  function bindReveal() {
    const els = [...document.querySelectorAll(".reveal")];
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px" });
    els.forEach((e) => obs.observe(e));
  }

  /* -------- animated stat counters -------- */
  function bindCounters() {
    const els = [...document.querySelectorAll("[data-count]")];
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const t0 = performance.now(), dur = 1100;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * e).toFixed(3);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { run(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.6 });
    els.forEach((e) => obs.observe(e));
  }

  /* -------- figure lightbox -------- */
  function bindLightbox() {
    const box = document.getElementById("lightbox"), img = document.getElementById("lightbox-img");
    if (!box) return;
    document.querySelectorAll(".figure.zoom img, .gcard img").forEach((im) => {
      im.addEventListener("click", () => { img.src = im.src; box.classList.add("open"); });
    });
    box.addEventListener("click", () => box.classList.remove("open"));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") box.classList.remove("open"); });
  }

  /* -------- init -------- */
  function init() {
    renderMath();
    bindNav();
    bindCopy();
    bindScrollbar();
    bindReveal();
    bindCounters();
    bindLightbox();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
