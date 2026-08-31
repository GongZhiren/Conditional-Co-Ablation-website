# CoAx — project page

Source for the project page of **Conditional Co-Ablation: Recovering Self-Repair Backups in
Transformer Circuits**.

Live site: **https://gongzhiren.github.io/Conditional-Co-Ablation-website**

A static, dependency-free page (HTML + CSS + vanilla JS). Every figure and number comes from the
paper; the [reference implementation](https://github.com/GongZhiren/Conditional-Co-Ablation)
reproduces them.

## Local preview
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy (GitHub Pages)
Push to a repo named `CoAx`, then enable **Settings → Pages → Deploy from branch → main / root**.
The `.nojekyll` file ensures the assets are served as-is.

```
index.html    structure + content (KaTeX for equations, via CDN)
tutorial.html the narrated video tour, with chapter links
style.css     styling (Inter / Newsreader / JetBrains Mono, blue accent #2e6fb0)
app.js        interactions: scroll-spy, reveal-on-scroll, stat counters, figure lightbox
assets/       paper figures (PNG), tutorial video + captions
```
