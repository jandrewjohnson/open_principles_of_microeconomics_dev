/* econ_viz_textbook.js shared runtime for interactive textbook figures.
 * Canonical source: interactive_textbook_pipeline. Copies next to apps are written by sync; do not edit them.
 *
 * Usage (in the app file):
 *
 *   const viz = new EconViz({
 *     canvas: 'graph',
 *     stateVersion: 1,
 *     downloadName: 'supply_shifts.png',
 *     axes: { xMin, xMax, yMin, yMax, margin:{top,right,bottom,left} },
 *     sliders: [ {id, label, min, max, value, step, fmt} ... ],   // rendered into [data-sliders]
 *     toggles: [ {id, label, checked:true} ... ],                  // rendered into [data-toggles]
 *     panels:  { title:'Title', graph:'Graph', ... },              // id suffix -> restore-bar label
 *     leftPanels:  ['graph','explanation'],
 *     rightPanels: ['shifts','keyvals'],
 *     nudgeKeys: ['x','y','s0','pt.J', ...],                        // draggable label keys
 *     draw(g) { ... }                                              // app-specific drawing
 *   });
 *
 * The draw callback receives a helper object `g` with:
 *   ctx, S (design pixel ratio), canvas, W/H (design canvas size), width/height (plot area), margin,
 *   tCX(x), tCY(y), val(id) (slider value as number), vis(id) (toggle state),
 *   getNudge(key), regLabel(key,x,y,w,h), drawArrow(x1,y1,x2,y2[,color]),
 *   interpQ(pts,price), text(str,x,y,opts), setText(id,str)
 *
 * URL hash is the public state contract:
 *   #v=1&<slider>=<value>&<toggle>=0&@<label>=<dx>,<dy>
 * Keys are emitted sorted (v first) so identical states give identical links.
 * Only non-default values are emitted.
 *
 * KEY VOCABULARY (use these names in every app so links read the same everywhere)
 *   Curve ids:      d d0 d1 d2  s s0 s1 s2  ppf bc  (bc = budget constraint)
 *   Sliders:        p            explored / reference price
 *                   q            explored quantity
 *                   dq_<curve>   horizontal shift of a curve (sign = direction)
 *                   dp_<curve>   vertical shift of a curve
 *                   n_<curve>    curvature / elasticity parameter
 *                   max_<good>   axis maximum (PPF-style apps)
 *   Toggles:        show_<thing> e.g. show_grid show_points show_s1 show_annot
 *   Label nudges:   @x @y        axis labels
 *                   @<curve>     curve label, e.g. @s0
 *                   @pt.<L>      named point letter, e.g. @pt.J
 *                   @an.<L>      annotation attached to point L
 *   Underscores in slider/toggle keys, dots inside nudge targets, never hyphens.
 *
 * Bump stateVersion when a key changes and supply cfg.migrateState(params, fromVersion)
 * to rewrite old hashes in place.
 * ?embed strips chrome and skips KaTeX; clicking the canvas then opens the full app in the same state.
 * The canvas bitmap is sized to its rendered width (never larger than the design size);
 * apps always draw in design coordinates and never need to know.
 */

const ECON_VIZ_FONT = "'Source Sans 3','Source Sans Pro',system-ui,sans-serif";
const ECON_VIZ_EMBED = new URLSearchParams(location.search).has('embed');

// KaTeX is loaded by the library, and only when not embedded: every panel that
// contains math is hidden in ?embed mode, so the ~300 KB would be wasted there.
const ECON_VIZ_KATEX = ECON_VIZ_EMBED ? Promise.resolve(false) : new Promise(resolve => {
  const base = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/';
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = base + 'katex.min.css';
  document.head.appendChild(css);
  const load = (src, next) => { const sc = document.createElement('script'); sc.src = src; sc.onload = next; sc.onerror = () => resolve(false); document.head.appendChild(sc); };
  load(base + 'katex.min.js', () => load(base + 'contrib/auto-render.min.js', () => resolve(true)));
});

class EconViz {
  constructor(cfg) {
    this.cfg = cfg;
    this.S = cfg.dpr || 2;
    this.canvas = typeof cfg.canvas === 'object' && cfg.canvas
      ? cfg.canvas : document.getElementById(cfg.canvas || 'graph');
    this.ctx = this.canvas.getContext('2d');
    // canvasUnits 'design' (default): the app draws at g.S times the CSS size,
    // and the library owns the bitmap, so a figure renders to a fixed size PNG
    // however wide it is on screen. 'css': the app has already called
    // ctx.scale(dpr, dpr) and draws in CSS pixels, so the library keeps its
    // hands off the bitmap and maps pointer coordinates one to one. Apps in
    // 'css' mode cannot be rendered to print figures.
    this.cssUnits = cfg.canvasUnits === 'css';
    // Design size: the width/height attributes the app was authored against.
    // The bitmap is resized to the rendered width (capped at design size) and a
    // uniform transform maps design coordinates onto it, so apps never see this.
    this.W = this.canvas.width; this.H = this.canvas.height; this.k = 1;
    this.nudge = {};
    this.labelHitBoxes = [];
    this.pointHitBoxes = [];
    this.sliderEls = {};
    this.toggleEls = {};
    this.textEls = {};
    this.selected = null;   // key of the clicked point, travels in the hash as sel=
    this.unknownKeys = [];  // hash keys this app does not recognise; the render step fails on them
    this.stateVersion = cfg.stateVersion || 1;
    window.econViz = this;  // handy for the render script, tests, and the console

    this._initEmbed();
    this._initResize();
    this._ensureOptionsUI();
    this._renderSliders();
    this._renderToggles();
    this._renderTexts();
    this._initPanels();
    this._initDragging();
    this._initPlotActions();
    this._initDisplayOptions();
    this._initLinks();
    this._loadHash();
    this.updateRestore();
    this.updateLayout();
    this._initKatex();
    this.draw();
    if (document.fonts && document.fonts.load) document.fonts.load(`14px ${ECON_VIZ_FONT}`).then(() => this.draw());
  }

  /* ---------- embed / figure mode ---------- */
  _initEmbed() {
    const p = new URLSearchParams(location.search);
    this.embed = p.has('embed');
    if (this.embed) {
      document.body.classList.add('embed-mode');
      // ?embed&hide=controls,header adds embed-hide-<name> to the body, so an
      // app can strip more than the default set from one particular embed.
      (p.get('hide') || '').split(',').map(s => s.trim()).filter(Boolean)
        .forEach(name => document.body.classList.add('embed-hide-' + name));
      const body = this.canvas.closest('.graph-body');
      if (body && !body.querySelector('.figure-open')) {
        const chip = document.createElement('div');
        chip.className = 'figure-open';
        chip.textContent = 'Open interactive ↗';
        body.appendChild(chip);
      }
      this.canvas.addEventListener('click', () => {
        window.open(location.pathname + this.stateHash(), '_blank', 'noopener');
      });
      this.canvas.addEventListener('mouseup', () => history.replaceState(null, '', this.stateHash()));
    }
  }

  /* ---------- bitmap sizing ---------- */
  _fitBitmap() {
    if (this.cssUnits) return false;
    const cssW = this.canvas.getBoundingClientRect().width || this.W;
    const target = Math.min(this.W, Math.round(cssW * (window.devicePixelRatio || 1)));
    if (target === this.canvas.width) return false;
    this.canvas.width = target;
    this.canvas.height = Math.round(target * this.H / this.W);
    this.k = target / this.W;
    return true;
  }
  _initResize() {
    if (typeof ResizeObserver === 'undefined') return;
    let first = true;
    new ResizeObserver(() => { if (this._fitBitmap() && !first) this.draw(); first = false; }).observe(this.canvas);
  }
  // Draw the current state at full design resolution into a fresh canvas (for copy/save).
  _renderFull() {
    if (this.cssUnits) return this.canvas;   // the app owns its own resolution
    const off = document.createElement('canvas'); off.width = this.W; off.height = this.H;
    const saved = { ctx: this.ctx, k: this.k, hb: this.labelHitBoxes };
    this.ctx = off.getContext('2d'); this.k = 1;
    this.cfg.draw(this._helpers());
    Object.assign(this, { ctx: saved.ctx, k: saved.k, labelHitBoxes: saved.hb });
    return off;
  }

  /* ---------- display options panel ---------- */
  // Apps written for this library carry the display-options markup themselves.
  // An adapted app gives cfg.optionsMount instead and the library builds it, so
  // adopting the library needs no new markup in the app file.
  _ensureOptionsUI() {
    if (!this.cfg.optionsMount || document.querySelector('.display-options-wrapper')) return;
    const mount = document.querySelector(this.cfg.optionsMount);
    if (!mount) return;
    const wrap = document.createElement('div');
    wrap.className = 'display-options-wrapper';
    wrap.innerHTML =
      '<button class="display-options-toggle" id="display-toggle-btn"><span class="arrow" id="display-arrow">▶</span> Display options</button>' +
      '<div class="display-options-panel" id="display-panel">' +
      '<div class="panel-title">Plot Elements <small>drag labels to reposition</small></div>' +
      '<div data-toggles></div><div data-texts></div>' +
      '<div class="restore-bar" id="restore-bar"></div>' +
      '<div class="url-state-bar">' +
      '<button id="copy-url-btn">📋 Copy app link</button>' +
      '<button id="copy-fig-btn">🖼 Copy figure link</button>' +
      '<button id="reset-url-btn">↺ Reset</button>' +
      '</div></div>';
    mount.appendChild(wrap);
  }

  /* ---------- sliders & toggles (generated from config) ---------- */
  // A control goes to the host that names its id (data-sliders="p,q"), else to
  // the first unnamed host, so an app can split controls across panels.
  _host(attr, id) {
    const hosts = [...document.querySelectorAll(`[${attr}]`)];
    const names = h => (h.getAttribute(attr) || '').split(',').map(s => s.trim()).filter(Boolean);
    return hosts.find(h => names(h).includes(id)) || hosts.find(h => !names(h).length) || hosts[0];
  }
  _renderSliders() {
    (this.cfg.sliders || []).forEach(s => {
      const host = this._host('data-sliders', s.id);
      let el = document.getElementById(s.id);
      if (!el && host) {
        const g = document.createElement('div');
        g.className = 'slider-group';
        g.innerHTML = `<div class="slider-label"><span>${s.label}</span><span class="slider-value" id="${s.id}-val"></span></div>
          <input type="range" id="${s.id}" min="${s.min}" max="${s.max}" value="${s.value}" step="${s.step ?? 1}">`;
        host.appendChild(g);
        el = g.querySelector('input');
      }
      if (el) {
        this.sliderEls[s.id] = el;
        el.addEventListener('input', () => this.draw());
      }
    });
  }
  _renderToggles() {
    (this.cfg.toggles || []).forEach(t => {
      const host = this._host('data-toggles', t.id);
      let el = document.getElementById(t.id);
      if (!el && host) {
        const r = document.createElement('div');
        r.className = 'opt-row';
        r.innerHTML = `<input type="checkbox" id="${t.id}" ${t.checked === false ? '' : 'checked'}><label for="${t.id}">${t.label}</label>`;
        host.appendChild(r);
        el = r.querySelector('input');
      }
      if (el) {
        this.toggleEls[t.id] = el;
        el.addEventListener('change', () => this.draw());
      }
    });
  }
  // Free text controls (editable axis labels and the like). Rendered into
  // [data-texts]; the id is the state key, so it follows the same vocabulary.
  _renderTexts() {
    (this.cfg.texts || []).forEach(t => {
      const host = this._host('data-texts', t.id) || this._host('data-toggles', t.id);
      let el = document.getElementById(t.id);
      if (!el && host) {
        const r = document.createElement('div');
        r.className = 'opt-row';
        r.innerHTML = `<label for="${t.id}">${t.label}</label><input type="text" id="${t.id}" value="${t.value}">`;
        host.appendChild(r);
        el = r.querySelector('input');
      }
      if (el) {
        this.textEls[t.id] = el;
        el.addEventListener('input', () => this.draw());
      }
    });
  }

  val(id) { const el = this.sliderEls[id]; return el ? parseFloat(el.value) : NaN; }
  text(id) { const el = this.textEls[id], v = el ? el.value.trim() : ''; return v || this._textDefault(id); }
  _textDefault(id) { const t = (this.cfg.texts || []).find(x => x.id === id); return t ? t.value : ''; }
  // A text entry with a `target` selector also writes its value into the page,
  // which is how an app makes its own headings editable.
  _syncBoundText() {
    (this.cfg.texts || []).forEach(t => {
      if (!t.target) return;
      const el = document.querySelector(t.target);
      if (el) el.textContent = this.text(t.id);
    });
  }
  vis(id) { const el = this.toggleEls[id]; return el ? el.checked : true; }
  _sliderDefault(id) { const s = (this.cfg.sliders || []).find(x => x.id === id); return s ? s.value : undefined; }
  _toggleDefault(id) { const t = (this.cfg.toggles || []).find(x => x.id === id); return t ? t.checked !== false : true; }
  _updateSliderLabels() {
    (this.cfg.sliders || []).forEach(s => {
      const out = document.getElementById(s.id + '-val');
      if (out) out.textContent = s.fmt ? s.fmt(this.val(s.id)) : this.val(s.id);
    });
  }

  /* ---------- panels: collapse / close / restore ---------- */
  // cfg.panels takes two shapes:
  //   { key: 'Label', ... }                      ids follow section-/body-/toggle-<key>
  //   [ { key, name, el, title, body, column } ] adapter mode: point at markup
  //                                              the app already has
  // Adapter mode is how a hand-written app adopts the library without having
  // its panel markup rewritten. The library wraps the panel body and injects
  // the collapse and close buttons itself.
  _panelSpecs() {
    if (this._panelCache) return this._panelCache;
    const p = this.cfg.panels || {};
    const specs = Array.isArray(p) ? p.map(s => Object.assign({}, s))
                                   : Object.keys(p).map(key => ({ key, name: p[key] }));
    specs.forEach(s => {
      s.name = s.name || s.key;
      s.adapted = !!s.el;
      s.section = s.el ? document.querySelector(s.el) : document.getElementById('section-' + s.key);
      s.titleEl = s.title && s.section ? s.section.querySelector(s.title) : null;
      s.bodyEl = s.body && s.section ? s.section.querySelector(s.body)
                                     : document.getElementById('body-' + s.key);
      if (s.adapted && s.section && !s.bodyEl) s.bodyEl = this._wrapBody(s);
      if (s.adapted && s.section) this._injectPanelChrome(s);
    });
    this._panelCache = specs;
    return specs;
  }
  _spec(key) { return this._panelSpecs().find(s => s.key === key); }
  // Everything after the title becomes one collapsible element.
  _wrapBody(spec) {
    const wrap = document.createElement('div');
    wrap.className = 'panel-body-wrap';
    const kids = [...spec.section.childNodes].filter(n => n !== spec.titleEl);
    kids.forEach(n => wrap.appendChild(n));
    spec.section.appendChild(wrap);
    return wrap;
  }
  _injectPanelChrome(spec) {
    const host = spec.titleEl || spec.section;
    if (!host || host.querySelector('.panel-header-actions')) return;
    if (getComputedStyle(spec.section).position === 'static') spec.section.style.position = 'relative';
    const actions = document.createElement('div');
    actions.className = 'panel-header-actions';
    actions.innerHTML =
      `<button class="panel-collapse-btn" id="toggle-${spec.key}" onclick="event.stopPropagation();tog('${spec.key}')">▼</button>` +
      `<button class="panel-close-btn" onclick="event.stopPropagation();closePanel('${spec.key}')">✕</button>`;
    spec.section.appendChild(actions);
  }
  _initPanels() {
    const self = this;
    window.tog = n => {
      const s = self._spec(n);
      const b = s ? s.bodyEl : document.getElementById('body-' + n);
      const t = document.getElementById('toggle-' + n);
      if (b && t) t.textContent = b.classList.toggle('collapsed') ? '▶' : '▼';
    };
    window.closePanel = n => { const e = self._sectionOf(n); if (e) e.classList.add('panel-closed'); self.updateRestore(); self.updateLayout(); };
    window.restorePanel = n => { const e = self._sectionOf(n); if (e) e.classList.remove('panel-closed'); self.updateRestore(); self.updateLayout(); };
    // So a table row rendered by an app can select a point with inline onclick,
    // without the app registering an event listener of its own.
    window.selectPoint = k => self.selectPoint(k);
  }
  _sectionOf(n) { const s = this._spec(n); return s ? s.section : document.getElementById('section-' + n); }
  _closed(n) { return this._sectionOf(n)?.classList.contains('panel-closed'); }
  _inColumn(side) {
    const listed = this.cfg[side === 'left' ? 'leftPanels' : 'rightPanels'];
    if (listed) return listed;
    return this._panelSpecs().filter(s => s.column === side).map(s => s.key);
  }
  updateLayout() {
    const mc = document.querySelector(this.cfg.grid || '.main-content'); if (!mc) return;
    const left = this._inColumn('left'), right = this._inColumn('right');
    mc.classList.toggle('left-empty', left.length > 0 && left.every(n => this._closed(n)));
    mc.classList.toggle('right-empty', right.length > 0 && right.every(n => this._closed(n)));
    if (this.cfg.onLayout) this.cfg.onLayout();
  }
  updateRestore() {
    const bar = document.getElementById('restore-bar'); if (!bar) return;
    const closed = this._panelSpecs().filter(s => this._closed(s.key));
    bar.innerHTML = closed.length
      ? '<span class="restore-label">Restore:</span>' + closed.map(s => `<button class="restore-btn" onclick="restorePanel('${s.key}')">${s.name}</button>`).join('')
      : '';
  }
  _resetPanels() {
    this._panelSpecs().forEach(s => {
      if (s.section) s.section.classList.remove('panel-closed');
      if (s.bodyEl) s.bodyEl.classList.remove('collapsed');
      const t = document.getElementById('toggle-' + s.key); if (t) t.textContent = '▼';
    });
  }

  /* ---------- draggable labels ---------- */
  getNudge(k) { const o = this.nudge[k]; return o ? { dx: o.dx * this.S, dy: o.dy * this.S } : { dx: 0, dy: 0 }; }
  regLabel(k, x, y, w, h) { this.labelHitBoxes.push({ key: k, x, y, w, h }); }
  _hit(cx, cy) {
    for (let i = this.labelHitBoxes.length - 1; i >= 0; i--) {
      const b = this.labelHitBoxes[i];
      if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) return b.key;
    }
    return null;
  }
  _pos(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    if (this.cssUnits) return { x: clientX - r.left, y: clientY - r.top };
    return { x: (clientX - r.left) * this.W / r.width, y: (clientY - r.top) * this.H / r.height };
  }

  /* ---------- clickable points ---------- */
  // Apps register a point per draw with g.regPoint(key, cx, cy, r). Clicking one
  // toggles this.selected, which the app reads back as g.selected.
  regPoint(k, cx, cy, r) { this.pointHitBoxes.push({ key: k, cx, cy, r }); }
  _hitPoint(cx, cy) {
    for (let i = this.pointHitBoxes.length - 1; i >= 0; i--) {
      const p = this.pointHitBoxes[i];
      if (Math.hypot(cx - p.cx, cy - p.cy) <= p.r + 8 * this.S) return p.key;
    }
    return null;
  }
  selectPoint(k) {
    this.selected = this.selected === k ? null : k;
    this.draw();
    if (this.cfg.onSelect) this.cfg.onSelect(this.selected);
  }
  _tip() {
    if (!this._tipEl) {
      const host = this.canvas.closest('.graph-body') || this.canvas.parentElement;
      this._tipEl = document.createElement('div');
      this._tipEl.className = 'canvas-tooltip';
      host.appendChild(this._tipEl);
    }
    return this._tipEl;
  }
  _showTip(ev, key) {
    const html = this.cfg.pointTooltip(key, this._helpers());
    if (!html) return this._hideTip();
    const el = this._tip();
    el.innerHTML = html;
    const host = (this.canvas.closest('.graph-body') || this.canvas.parentElement).getBoundingClientRect();
    el.style.left = (ev.clientX - host.left + 16) + 'px';
    el.style.top = (ev.clientY - host.top - 20) + 'px';
    el.classList.add('visible');
  }
  _hideTip() { if (this._tipEl) this._tipEl.classList.remove('visible'); }
  _initDragging() {
    const c = this.canvas; let drag = null, sx = 0, sy = 0, ox = 0, oy = 0;
    const start = (p) => {
      const k = this._hit(p.x, p.y); if (!k) return false;
      drag = k; sx = p.x; sy = p.y;
      if (!this.nudge[k]) this.nudge[k] = { dx: 0, dy: 0 };
      ox = this.nudge[k].dx; oy = this.nudge[k].dy;
      c.classList.add('dragging'); return true;
    };
    const move = (p, ev) => {
      if (drag) { this.nudge[drag].dx = ox + (p.x - sx) / this.S; this.nudge[drag].dy = oy + (p.y - sy) / this.S; this.draw(); }
      else {
        const lab = this._hit(p.x, p.y);
        c.classList.toggle('hovering-label', !!lab);
        // In embed mode a canvas click opens the app, so points are not live.
        const pk = (!lab && !this.embed) ? this._hitPoint(p.x, p.y) : null;
        c.classList.toggle('hovering-point', !!pk);
        if (pk && ev && this.cfg.pointTooltip) this._showTip(ev, pk); else this._hideTip();
      }
    };
    const end = () => { drag = null; c.classList.remove('dragging'); };
    c.addEventListener('mousedown', e => {
      const p = this._pos(e.clientX, e.clientY);
      if (start(p)) { e.preventDefault(); return; }
      if (this.embed) return;
      const k = this._hitPoint(p.x, p.y);
      if (k) { this.selectPoint(k); e.preventDefault(); }
    });
    c.addEventListener('mousemove', e => move(this._pos(e.clientX, e.clientY), e));
    c.addEventListener('mouseup', end);
    c.addEventListener('mouseleave', () => { end(); c.classList.remove('hovering-label', 'hovering-point'); this._hideTip(); });
    c.addEventListener('touchstart', e => {
      const t = e.touches[0], p = this._pos(t.clientX, t.clientY);
      if (start(p)) { e.preventDefault(); return; }
      if (this.embed) return;
      const k = this._hitPoint(p.x, p.y);
      if (k) { this.selectPoint(k); e.preventDefault(); }
    }, { passive: false });
    c.addEventListener('touchmove', e => { if (drag) { const t = e.touches[0]; move(this._pos(t.clientX, t.clientY)); e.preventDefault(); } }, { passive: false });
    c.addEventListener('touchend', end);
  }

  /* ---------- copy / save plot ---------- */
  // These two act on the plot image. The link buttons live in display options;
  // keep the labels distinct or "Copy" reads as "copy link".
  _initPlotActions() {
    const flash = (btn, lbl, msg) => {
      const orig = lbl.dataset.label || lbl.textContent;
      lbl.dataset.label = orig;
      btn.classList.add('copied');
      lbl.textContent = msg;
      setTimeout(() => { btn.classList.remove('copied'); lbl.textContent = orig; }, 1500);
    };
    const download = () => {
      const a = document.createElement('a');
      a.href = this._renderFull().toDataURL('image/png');
      a.download = this.cfg.downloadName || 'figure.png';
      a.click();
    };
    const cb = document.getElementById('copy-plot-btn'), cl = document.getElementById('copy-label');
    if (cb && cl) cb.addEventListener('click', async () => {
      try {
        const blob = await new Promise(r => this._renderFull().toBlob(r, 'image/png'));
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        flash(cb, cl, 'Copied!');
      } catch {
        // Chromium refuses clipboard image writes on a file:// page, which is how
        // these apps are usually opened. Fall back to the download so the click
        // always does something rather than flashing an easily missed "Failed".
        download();
        flash(cb, cl, 'Saved instead');
      }
    });
    const sb = document.getElementById('save-plot-btn'), sl = document.getElementById('save-label');
    if (sb && sl) sb.addEventListener('click', () => { download(); flash(sb, sl, 'Saved!'); });
  }

  /* ---------- display options ---------- */
  _initDisplayOptions() {
    const btn = document.getElementById('display-toggle-btn');
    if (btn) btn.addEventListener('click', () => {
      const p = document.getElementById('display-panel'), a = document.getElementById('display-arrow');
      a.classList.toggle('open', p.classList.toggle('open'));
    });
  }

  /* ---------- URL state (public contract for textbook links) ---------- */
  buildState() {
    const s = { v: this.stateVersion };
    (this.cfg.sliders || []).forEach(sl => { if (this.val(sl.id) !== sl.value) s[sl.id] = this.sliderEls[sl.id].value; });
    (this.cfg.toggles || []).forEach(t => { if (this.vis(t.id) !== this._toggleDefault(t.id)) s[t.id] = this.vis(t.id) ? 1 : 0; });
    (this.cfg.texts || []).forEach(t => { if (this.text(t.id) !== t.value) s[t.id] = this.text(t.id); });
    if (this.selected) s.sel = this.selected;
    // Panel chrome is deliberately absent from a figure hash: a link printed in
    // the book describes the plot, not which panels happened to be open. Apps
    // that are only ever live embeds can opt in.
    if (this.cfg.stateIncludesChrome) {
      this._panelSpecs().forEach(sp => {
        if (this._closed(sp.key)) s['closed_' + sp.key] = 1;
        if (sp.bodyEl && sp.bodyEl.classList.contains('collapsed')) s['sec_' + sp.key] = 0;
      });
    }
    (this.cfg.nudgeKeys || []).forEach(k => {
      const o = this.nudge[k];
      if (o && (Math.abs(o.dx) > 0.5 || Math.abs(o.dy) > 0.5)) s['@' + k] = Math.round(o.dx) + ',' + Math.round(o.dy);
    });
    return s;
  }
  // Deterministic: v first, then sorted keys, so identical states give identical links.
  stateHash() {
    const st = this.buildState();
    const keys = Object.keys(st).filter(k => k !== 'v').sort();
    // '@' ',' '.' are legal in a fragment; keep them literal so links stay readable.
    const enc = x => encodeURIComponent(x).replace(/%40/g, '@').replace(/%2C/g, ',');
    const parts = ['v=' + st.v, ...keys.map(k => enc(k) + '=' + enc(st[k]))];
    return '#' + parts.join('&');
  }
  appURL() { return location.origin + location.pathname + this.stateHash(); }
  figureURL() { return location.origin + location.pathname + '?embed' + this.stateHash(); }
  _loadHash() {
    this.unknownKeys = [];
    const h = location.hash.slice(1); if (!h) return;
    const p = new URLSearchParams(h);
    const v = parseInt(p.get('v') || '1', 10);
    if (this.cfg.migrateState && v < this.stateVersion) this.cfg.migrateState(p, v);
    // A state string carries no record of which app it came from. Pasted against
    // the wrong app it used to be silently ignored: identical render, identical
    // PNG, nothing reported. Collect what this app cannot interpret so the render
    // step can refuse it.
    const known = new Set(['v', 'sel']);
    (this.cfg.sliders || []).forEach(sl => known.add(sl.id));
    (this.cfg.toggles || []).forEach(tg => known.add(tg.id));
    (this.cfg.texts || []).forEach(tx => known.add(tx.id));
    (this.cfg.nudgeKeys || []).forEach(k => known.add('@' + k));
    if (this.cfg.stateIncludesChrome) this._panelSpecs().forEach(sp => { known.add('closed_' + sp.key); known.add('sec_' + sp.key); });
    for (const k of p.keys()) if (!known.has(k) && !this.unknownKeys.includes(k)) this.unknownKeys.push(k);
    if (this.unknownKeys.length) console.warn('econViz: hash keys not recognised by this app: ' + this.unknownKeys.join(', '));
    (this.cfg.sliders || []).forEach(sl => { if (p.has(sl.id)) this.sliderEls[sl.id].value = p.get(sl.id); });
    (this.cfg.toggles || []).forEach(t => { if (p.has(t.id)) this.toggleEls[t.id].checked = p.get(t.id) === '1'; });
    (this.cfg.texts || []).forEach(t => { if (p.has(t.id) && this.textEls[t.id]) this.textEls[t.id].value = p.get(t.id); });
    if (p.has('sel')) this.selected = p.get('sel');
    if (this.cfg.stateIncludesChrome) {
      this._panelSpecs().forEach(sp => {
        if (p.get('closed_' + sp.key) === '1') sp.section?.classList.add('panel-closed');
        if (p.get('sec_' + sp.key) === '0') {
          sp.bodyEl?.classList.add('collapsed');
          const t = document.getElementById('toggle-' + sp.key); if (t) t.textContent = '▶';
        }
      });
    }
    (this.cfg.nudgeKeys || []).forEach(k => {
      const key = '@' + k;
      if (p.has(key)) { const [dx, dy] = p.get(key).split(',').map(parseFloat); if (!isNaN(dx) && !isNaN(dy)) this.nudge[k] = { dx, dy }; }
    });
  }
  _initLinks() {
    const copy = async (btn, text) => {
      const orig = btn.textContent;
      try { await navigator.clipboard.writeText(text); btn.textContent = '✓ Copied!'; btn.classList.add('copied'); setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000); }
      catch { prompt('Copy:', text); }
    };
    const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', e => fn(e.currentTarget)); };
    bind('copy-url-btn', b => copy(b, this.appURL()));
    bind('copy-fig-btn', b => copy(b, this.figureURL()));
    bind('open-fig-btn', () => window.open(this.figureURL(), '_blank', 'noopener'));
    bind('reset-url-btn', () => this.reset());
  }
  reset() {
    (this.cfg.sliders || []).forEach(sl => this.sliderEls[sl.id].value = sl.value);
    (this.cfg.toggles || []).forEach(t => this.toggleEls[t.id].checked = this._toggleDefault(t.id));
    (this.cfg.texts || []).forEach(t => { if (this.textEls[t.id]) this.textEls[t.id].value = t.value; });
    this.selected = null;
    this.nudge = {};
    this._resetPanels();
    this.updateRestore(); this.updateLayout();
    history.replaceState(null, '', location.pathname + (this.embed ? '?embed' : ''));
    this.draw();
  }

  /* ---------- KaTeX ---------- */
  _initKatex() {
    const render = (root) => {
      if (typeof renderMathInElement !== 'undefined')
        renderMathInElement(root || document.body, { delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false });
    };
    this.renderMath = render;
    ECON_VIZ_KATEX.then(ok => { if (ok) render(); });
  }

  /* ---------- drawing helpers ---------- */
  // cfg.axes is one spec, or an array of them for a multi-panel figure. Each
  // spec may carry `left` and `width` in design px to place its panel on the
  // canvas; g.panel(i) returns the same helper API bound to panel i.
  _specs() { return Array.isArray(this.cfg.axes) ? this.cfg.axes : [this.cfg.axes]; }
  _helpers(idx = 0) {
    // An app that draws entirely on its own (adapter mode) need not declare
    // axes at all; it just never calls the coordinate helpers.
    const NO_AXES = { xMin: 0, xMax: 1, yMin: 0, yMax: 1, margin: { top: 0, right: 0, bottom: 0, left: 0 } };
    const S = this.S, ctx = this.ctx, canvas = this.canvas, ax = this._specs()[idx] || NO_AXES;
    const margin = ax.margin;
    const W = this.W, H = this.H;
    const left = ax.left || 0;
    const width = (ax.width || W) - margin.left - margin.right;
    const height = (ax.height || H) - margin.top - margin.bottom;
    // x0 / y0 are the top left corner of this panel's plot area.
    const x0 = left + margin.left, y0 = margin.top;
    const tCX = x => x0 + ((x - ax.xMin) / (ax.xMax - ax.xMin)) * width;
    const tCY = y => y0 + height - ((y - ax.yMin) / (ax.yMax - ax.yMin)) * height;
    return {
      ctx, S, canvas, W, H, width, height, margin, left, x0, y0, tCX, tCY, font: ECON_VIZ_FONT,
      panel: i => this._helpers(i),
      xMin: ax.xMin, xMax: ax.xMax, yMin: ax.yMin, yMax: ax.yMax,
      val: id => this.val(id),
      vis: id => this.vis(id),
      text: id => this.text(id),
      selected: this.selected,
      getNudge: k => this.getNudge(k),
      regLabel: (k, x, y, w, h) => this.regLabel(k, x, y, w, h),
      regPoint: (k, cx, cy, r) => this.regPoint(k, cx, cy, r),
      setText: (id, s) => { const el = document.getElementById(id); if (el) el.innerHTML = s; },
      renderMath: el => this.renderMath(el),

      clear() { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); },

      gridlines(xStep, yStep) {
        ctx.strokeStyle = '#edf2f7'; ctx.lineWidth = S;
        for (let x = ax.xMin; x <= ax.xMax + 1e-9; x += xStep) { ctx.beginPath(); ctx.moveTo(tCX(x), y0); ctx.lineTo(tCX(x), y0 + height); ctx.stroke(); }
        for (let y = ax.yMin; y <= ax.yMax + 1e-9; y += yStep) { ctx.beginPath(); ctx.moveTo(x0, tCY(y)); ctx.lineTo(x0 + width, tCY(y)); ctx.stroke(); }
      },

      axes(color = '#a0aec0') {
        ctx.strokeStyle = color; ctx.lineWidth = 2 * S; ctx.beginPath();
        ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + height); ctx.lineTo(x0 + width, y0 + height); ctx.stroke();
      },

      xTicks(values, fmt = v => v) {
        ctx.fillStyle = '#718096'; ctx.font = `${12 * S}px ${ECON_VIZ_FONT}`; ctx.textAlign = 'center';
        values.forEach(v => ctx.fillText(fmt(v), tCX(v), y0 + height + 22 * S));
      },
      yTicks(values, fmt = v => v) {
        ctx.fillStyle = '#718096'; ctx.font = `${12 * S}px ${ECON_VIZ_FONT}`; ctx.textAlign = 'right';
        values.forEach(v => ctx.fillText(fmt(v), x0 - 10 * S, tCY(v) + 5 * S));
      },

      // Draggable axis labels (nudge keys 'x' / 'y'). Pass null for an axis to
      // skip it, for apps that can hide one label independently of the other.
      axisLabels(xLabel, yLabel, suffix = '') {
        const self = this, sfx = suffix ? '.' + suffix : '';
        ctx.fillStyle = '#2b6cb0'; ctx.font = `bold ${14 * S}px ${ECON_VIZ_FONT}`; ctx.textAlign = 'center';
        if (xLabel) {
          const nx = self.getNudge('x' + sfx);
          const xlx = x0 + width / 2 + nx.dx, xly = H - 10 * S + nx.dy;
          ctx.fillText(xLabel, xlx, xly);
          const xw = ctx.measureText(xLabel).width;
          self.regLabel('x' + sfx, xlx - xw / 2 - 4 * S, xly - 16 * S, xw + 8 * S, 22 * S);
        }
        if (yLabel) {
          const ny = self.getNudge('y' + sfx);
          const ylx = left + 28 * S + ny.dx, yly = y0 + height / 2 + ny.dy;
          ctx.save(); ctx.translate(ylx, yly); ctx.rotate(-Math.PI / 2); ctx.fillText(yLabel, 0, 0); ctx.restore();
          const yw = ctx.measureText(yLabel).width;
          self.regLabel('y' + sfx, ylx - 14 * S, yly - yw / 2 - 4 * S, 28 * S, yw + 8 * S);
        }
      },

      // Draggable text label. opts: {font, color, align, key, pad}
      label(str, x, y, opts = {}) {
        const key = opts.key, ng = key ? this.getNudge(key) : { dx: 0, dy: 0 };
        ctx.font = opts.font || `${12 * S}px ${ECON_VIZ_FONT}`; ctx.fillStyle = opts.color || '#1a202c'; ctx.textAlign = opts.align || 'left';
        const lx = x + ng.dx, ly = y + ng.dy;
        const lines = String(str).split('\n');
        lines.forEach((l, i) => ctx.fillText(l, lx, ly + i * (opts.lineH || 14 * S)));
        if (key) {
          const w = Math.max(...lines.map(l => ctx.measureText(l).width));
          const left = ctx.textAlign === 'center' ? lx - w / 2 : ctx.textAlign === 'right' ? lx - w : lx;
          this.regLabel(key, left - 4 * S, ly - 14 * S, w + 8 * S, lines.length * (opts.lineH || 14 * S) + 8 * S);
        }
      },

      dashed(x1, y1, x2, y2, color = '#d53f8c', lw = 1.5) {
        ctx.strokeStyle = color; ctx.lineWidth = lw * S; ctx.setLineDash([6 * S, 4 * S]);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
      },

      drawArrow(x1, y1, x2, y2, color = '#1a202c') {
        const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy); if (len < 2) return;
        const ux = dx / len, uy = dy / len, hl = 10 * S, hw = 5 * S;
        ctx.strokeStyle = color; ctx.lineWidth = 2 * S; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - ux * hl + uy * hw, y2 - uy * hl - ux * hw); ctx.lineTo(x2 - ux * hl - uy * hw, y2 - uy * hl + ux * hw); ctx.closePath(); ctx.fill();
      },

      // Curly brace from (x1,y1) to (x2,y2) in design px. The tip sits on the
      // left of the direction of travel (below a left-to-right brace, left of
      // a top-to-bottom one); opts.flip puts it on the other side.
      // opts: {depth, color, lw}
      brace(x1, y1, x2, y2, opts = {}) {
        const L = Math.hypot(x2 - x1, y2 - y1); if (L < 4) return;
        const ux = (x2 - x1) / L, uy = (y2 - y1) / L, f = opts.flip ? -1 : 1, nx = -uy * f, ny = ux * f;
        const d = opts.depth ?? 10 * S, r = Math.min(8 * S, L / 4);
        const P = (t, s) => [x1 + ux * t + nx * s, y1 + uy * t + ny * s];
        ctx.strokeStyle = opts.color || '#2b6cb0'; ctx.lineWidth = (opts.lw || 2) * S; ctx.beginPath();
        ctx.moveTo(...P(0, 0)); ctx.quadraticCurveTo(...P(0, d / 2), ...P(r, d / 2)); ctx.lineTo(...P(L / 2 - r, d / 2));
        ctx.quadraticCurveTo(...P(L / 2, d / 2), ...P(L / 2, d)); ctx.quadraticCurveTo(...P(L / 2, d / 2), ...P(L / 2 + r, d / 2));
        ctx.lineTo(...P(L - r, d / 2)); ctx.quadraticCurveTo(...P(L, d / 2), ...P(L, 0)); ctx.stroke();
      },

      // Polyline through {p,q} data points, sorted by p
      curve(pts, color = '#2b6cb0', alpha = 1, lw = 2.5) {
        const s = [...pts].sort((a, b) => a.p - b.p);
        ctx.strokeStyle = color; ctx.lineWidth = lw * S; ctx.globalAlpha = alpha; ctx.beginPath();
        s.forEach((pt, i) => i ? ctx.lineTo(tCX(pt.q), tCY(pt.p)) : ctx.moveTo(tCX(pt.q), tCY(pt.p)));
        ctx.stroke(); ctx.globalAlpha = 1;
      },
      points(pts, color = '#2b6cb0', alpha = 1, r = 6) {
        ctx.globalAlpha = alpha;
        pts.forEach(pt => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(tCX(pt.q), tCY(pt.p), r * S, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 * S; ctx.stroke(); });
        ctx.globalAlpha = 1;
      },
      // Highlighted named point with draggable letter label
      namedPoint(letter, q, p, color = '#38a169') {
        const px = tCX(q), py = tCY(p);
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, 8 * S, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * S; ctx.stroke();
        this.label(letter, px + 12 * S, py - 10 * S, { key: 'pt.' + letter, font: `bold ${13 * S}px ${ECON_VIZ_FONT}`, align: 'center' });
      },

      // Equation defined curve: sample y = fn(x) across [xFrom, xTo].
      // opts: {color, alpha, lw, steps}
      plotFn(fn, xFrom, xTo, opts = {}) {
        const n = opts.steps || 200;
        ctx.strokeStyle = opts.color || '#2b6cb0'; ctx.lineWidth = (opts.lw || 2.5) * S;
        ctx.globalAlpha = opts.alpha ?? 1;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const x = xFrom + (i / n) * (xTo - xFrom);
          i ? ctx.lineTo(tCX(x), tCY(fn(x))) : ctx.moveTo(tCX(x), tCY(fn(x)));
        }
        ctx.stroke(); ctx.globalAlpha = 1;
      },
      // The region between that curve and the axes, for attainable-set shading.
      fillUnder(fn, xFrom, xTo, color, steps = 200) {
        ctx.fillStyle = color; ctx.beginPath();
        ctx.moveTo(tCX(xFrom), tCY(ax.yMin));
        for (let i = 0; i <= steps; i++) {
          const x = xFrom + (i / steps) * (xTo - xFrom);
          ctx.lineTo(tCX(x), tCY(fn(x)));
        }
        ctx.lineTo(tCX(xTo), tCY(ax.yMin)); ctx.closePath(); ctx.fill();
      },

      // Linear interpolation of q at a given p along a {p,q} schedule
      interpQ(pts, price) {
        const s = [...pts].sort((a, b) => a.p - b.p);
        if (price <= s[0].p) return s[0].q; if (price >= s[s.length - 1].p) return s[s.length - 1].q;
        for (let i = 0; i < s.length - 1; i++) if (price >= s[i].p && price <= s[i + 1].p) { const t = (price - s[i].p) / (s[i + 1].p - s[i].p); return s[i].q + t * (s[i + 1].q - s[i].q); }
        return s[0].q;
      },
    };
  }

  draw() {
    this.labelHitBoxes = [];
    this.pointHitBoxes = [];
    this._updateSliderLabels();
    this._syncBoundText();
    if (!this.cssUnits) this.ctx.setTransform(this.k, 0, 0, this.k, 0, 0);
    this.cfg.draw(this._helpers());
  }
}
