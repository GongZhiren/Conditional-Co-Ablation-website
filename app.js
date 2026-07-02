/* ============================================================
   CoAx project page — interactions (vanilla JS + SVG)
   ============================================================ */
(function () {
  "use strict";
  const SVGNS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };
  const BLUE = "#2e6fb0", ORANGE = "#d98a2b", GRAY = "#c3ccd8", INK = "#16202b";

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

  /* -------- tooltip -------- */
  const tip = document.getElementById("tooltip");
  const showTip = (x, y, html) => { tip.innerHTML = html; tip.style.left = x + "px"; tip.style.top = y + "px"; tip.classList.add("show"); };
  const hideTip = () => tip.classList.remove("show");

  /* ============================================================
     1. Blind-spot scatter (real per-head data)
     ============================================================ */
  function buildScatter() {
    const host = document.getElementById("scatter");
    if (!host || !window.COAX_DATA) return;
    const W = 640, H = 440, m = { l: 62, r: 20, t: 22, b: 56 };
    const px = (x) => m.l + x * (W - m.l - m.r);
    const py = (y) => H - m.b - y * (H - m.t - m.b);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img" });

    // shaded blind-spot region: low first-order (x<0.5), high CoAx (y>0.55)
    svg.appendChild(el("rect", {
      x: px(0), y: py(1), width: px(0.5) - px(0), height: py(0.55) - py(1),
      fill: BLUE, opacity: 0.07, rx: 6,
    }));
    const bsLabel = el("text", { x: px(0.25), y: py(0.97), "text-anchor": "middle", fill: BLUE, "font-size": 13, "font-weight": 700, opacity: 0.8 });
    bsLabel.textContent = "first-order blind spot";
    svg.appendChild(bsLabel);

    // axes
    svg.appendChild(el("line", { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: "#d6dde6", "stroke-width": 1.4 }));
    svg.appendChild(el("line", { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: "#d6dde6", "stroke-width": 1.4 }));
    const xlab = el("text", { x: (m.l + W - m.r) / 2, y: H - 14, "text-anchor": "middle", fill: "#4a586b", "font-size": 13.5, "font-weight": 600 });
    xlab.textContent = "first-order saliency  (rank percentile) →";
    svg.appendChild(xlab);
    const ylab = el("text", { x: -H / 2 + 6, y: 18, "text-anchor": "middle", fill: "#4a586b", "font-size": 13.5, "font-weight": 600, transform: "rotate(-90)" });
    ylab.textContent = "CoAx score  (rank percentile) →";
    svg.appendChild(ylab);
    [0, 0.5, 1].forEach((t) => {
      const gx = el("text", { x: px(t), y: H - m.b + 18, "text-anchor": "middle", fill: "#8592a3", "font-size": 11 }); gx.textContent = t; svg.appendChild(gx);
      const gy = el("text", { x: m.l - 10, y: py(t) + 4, "text-anchor": "end", fill: "#8592a3", "font-size": 11 }); gy.textContent = t; svg.appendChild(gy);
    });

    const star = (cx, cy, r) => {
      let d = ""; for (let i = 0; i < 10; i++) { const ang = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? r * 0.44 : r; d += (i ? "L" : "M") + (cx + rr * Math.cos(ang)).toFixed(1) + "," + (cy + rr * Math.sin(ang)).toFixed(1); }
      return d + "Z";
    };

    const order = { other: 0, primary: 1, backup: 2 }; // draw backups last (on top)
    window.COAX_DATA.heads.slice().sort((a, b) => order[a.role] - order[b.role]).forEach((d) => {
      const cx = px(d.x), cy = py(d.y);
      let node;
      if (d.role === "backup") {
        node = el("path", { d: star(cx, cy, 9), fill: BLUE, stroke: "#fff", "stroke-width": 1.2 });
      } else if (d.role === "primary") {
        node = el("rect", { x: cx - 6, y: cy - 6, width: 12, height: 12, fill: ORANGE, stroke: "#fff", "stroke-width": 1.2, transform: `rotate(45 ${cx} ${cy})` });
      } else {
        node = el("circle", { cx, cy, r: 4.2, fill: GRAY, opacity: 0.85 });
      }
      node.style.cursor = "pointer";
      const roleTxt = d.role === "backup" ? "documented backup" : d.role === "primary" ? "name-mover (seed)" : "ordinary head";
      const label = `L${d.l}.H${d.h} · ${roleTxt}<br>1st-order pct ${d.x.toFixed(2)} · CoAx pct ${d.y.toFixed(2)}`;
      node.addEventListener("mouseenter", (e) => { node.setAttribute("opacity", "1"); showTip(e.clientX, e.clientY, label); });
      node.addEventListener("mousemove", (e) => showTip(e.clientX, e.clientY, label));
      node.addEventListener("mouseleave", hideTip);
      svg.appendChild(node);
    });
    host.appendChild(svg);
  }

  /* ============================================================
     2. Knockout / self-repair demo
     ============================================================ */
  const DEMO = {
    clean: { margin: 2.53, acc: 1.00, cls: "ok", title: "Healthy",
      html: "The name-mover heads write the indirect object to the logits. The answer margin is large and the model is correct." },
    prim: { margin: 2.42, acc: 0.97, cls: "mid", title: "Self-repair",
      html: "Ablate the three name-mover <b>primaries</b> — the heads a first-order analysis calls “the circuit”. The margin barely drops and accuracy holds at <b>0.97</b>: dormant backups silently take over. The circuit looks knocked out, but the capability survives." },
    coax: { margin: 1.37, acc: 0.70, cls: "ok", title: "Complete knockout",
      html: "Add the label-free <b>CoAx backups</b>. Now the margin collapses and accuracy falls to <b>0.70</b> — matching the documented-backup oracle (0.72). The capability is actually removed, and CoAx found the backups without labels." },
    own: { margin: 0.90, acc: 0.24, cls: "warn", title: "Over-ablation",
      html: "A first-order <b>top-up</b> of the same size removes the model’s own next-most-salient heads instead. It overshoots to <b>0.24</b>, cutting past the backups into the core name-movers. More heads — but the wrong ones." },
  };
  function setDemo(state) {
    const d = DEMO[state];
    document.getElementById("marginBar").style.width = (d.margin / 2.6 * 100) + "%";
    document.getElementById("marginVal").textContent = (state === "own" ? "≈" : "") + d.margin.toFixed(2);
    document.getElementById("accBar").style.width = (d.acc * 100) + "%";
    document.getElementById("accVal").textContent = d.acc.toFixed(2);
    document.getElementById("demoExplain").innerHTML =
      `<span class="verdict ${d.cls}">${d.title}</span><br>${d.html}`;
    document.querySelectorAll(".dbtn").forEach((b) => b.classList.toggle("active", b.dataset.state === state));
  }
  function bindDemo() {
    document.querySelectorAll(".dbtn").forEach((b) => b.addEventListener("click", () => setDemo(b.dataset.state)));
    setDemo("clean");
  }

  /* ============================================================
     3. Wake-up gauges (real numbers, Table 6)
     ============================================================ */
  const WAKE = {
    norm:  { backup: [1.00, 1.02, 1.08, 1.15], random: [1.00, 1.00, 1.00, 1.00], min: 0.98, max: 1.2, fmt: (v) => v.toFixed(2) + "×" },
    drop:  { backup: [0.05, 0.05, 0.09, 0.11], random: [-0.03, -0.03, -0.04, -0.06], min: -0.08, max: 0.14, fmt: (v) => (v >= 0 ? "+" : "") + v.toFixed(2) },
  };
  function gaugeSVG(host) {
    const W = 260, H = 164, base = 118, bw = 54;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}` });
    svg.appendChild(el("line", { x1: 20, y1: base, x2: W - 20, y2: base, stroke: "#d6dde6", "stroke-width": 1.2 }));
    const mk = (x, color, cls) => {
      const bar = el("rect", { x, y: base, width: bw, height: 0, rx: 5, fill: color, class: cls });
      bar.style.transition = "height .5s cubic-bezier(.22,1,.36,1), y .5s cubic-bezier(.22,1,.36,1)";
      svg.appendChild(bar);
      const val = el("text", { x: x + bw / 2, y: base + 20, "text-anchor": "middle", fill: "#4a586b", "font-size": 12, "font-weight": 600, class: cls + "-v" });
      svg.appendChild(val);
      const lab = el("text", { x: x + bw / 2, y: base + 34, "text-anchor": "middle", fill: "#8592a3", "font-size": 10.5 });
      lab.textContent = cls === "b" ? "backup" : "random";
      svg.appendChild(lab);
      return { bar, val };
    };
    const b = mk(56, BLUE, "b"), r = mk(150, GRAY, "r");
    host.innerHTML = ""; host.appendChild(svg);
    return { b, r, base, top: 22 };
  }
  let gNorm, gDrop;
  function updateWake(k) {
    document.getElementById("kval").textContent = k;
    [["norm", gNorm], ["drop", gDrop]].forEach(([key, g]) => {
      const cfg = WAKE[key];
      const span = cfg.max - cfg.min, usable = g.base - g.top;
      const put = (obj, v) => {
        const h = Math.max(2, (v - cfg.min) / span * usable);
        obj.bar.setAttribute("y", g.base - h); obj.bar.setAttribute("height", h);
        obj.val.textContent = cfg.fmt(v);
      };
      put(g.b, cfg.backup[k]); put(g.r, cfg.random[k]);
    });
  }
  function bindWake() {
    gNorm = gaugeSVG(document.getElementById("wakeNorm"));
    gDrop = gaugeSVG(document.getElementById("wakeDla"));
    const s = document.getElementById("kSlider");
    s.addEventListener("input", () => updateWake(+s.value));
    updateWake(0);
  }

  /* ============================================================
     4. Nav scroll-spy + copy bibtex
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
        el.textContent = (target * e).toFixed(2);
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
    document.querySelectorAll(".figure.zoom img").forEach((im) => {
      im.addEventListener("click", () => { img.src = im.src; box.classList.add("open"); });
    });
    box.addEventListener("click", () => box.classList.remove("open"));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") box.classList.remove("open"); });
  }

  /* -------- init -------- */
  function init() {
    renderMath();
    buildScatter();
    bindDemo();
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
