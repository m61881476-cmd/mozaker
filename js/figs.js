/* مذاكِر — محرك الرسومات: كل رسمة وصف بسيط (هرم، دواير، حلقة اتصال، منحنى…) بيتحول لرسم SVG/HTML
   وفيه وضع تدريب: الأسماء تستخبى والجزء المطلوب يتعلّم عليه */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Figs = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const REG = {};
  const PAL = ['purple', 'blue', 'green', 'orange', 'red', 'teal', 'pink', 'indigo', 'yellow'];
  const col = (f, i) => (f.pal && f.pal[i]) || PAL[i % PAL.length];
  const isHid = (o, i) => o.hide === true || (Array.isArray(o.hide) && o.hide.includes(i));
  const f1 = v => (Math.round(v * 10) / 10);
  /** حجم خط يخلي النص يدخل في العرض المتاح */
  const fit = (text, avail, max = 13, min = 8) => Math.max(min, Math.min(max, f1(avail / (String(text).length * 0.56))));
  /** تقسيم النص سطور بحد أقصى حروف */
  function wrap(text, maxChars) {
    const words = String(text).split(' '), lines = []; let cur = '';
    for (const w of words) { if (cur && (cur + ' ' + w).length > maxChars) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }
    if (cur) lines.push(cur); return lines;
  }
  const svg = (w, h, inner, cls = '') => '<svg class="fg ' + cls + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" direction="rtl">' + inner + '</svg>';
  /** نص متوسّط، سطر أو أكتر */
  function tx(x, y, lines, size, cls = 'fg-tx', extra = '') {
    lines = Array.isArray(lines) ? lines : [lines];
    const y0 = y - (lines.length - 1) * size * 0.6;
    return '<text x="' + f1(x) + '" y="' + f1(y0) + '" font-size="' + size + '" text-anchor="middle" class="' + cls + '" ' + extra + '>' +
      lines.map((l, i) => '<tspan x="' + f1(x) + '"' + (i ? ' dy="' + f1(size * 1.22) + '"' : '') + '>' + esc(l) + '</tspan>').join('') + '</text>';
  }
  /** سهم: خط + راس */
  function arrow(x1, y1, x2, y2) {
    const a = Math.atan2(y2 - y1, x2 - x1), s = 5.5, p = (d, r) => f1(x2 + r * Math.cos(a + d)) + ',' + f1(y2 + r * Math.sin(a + d));
    return '<line x1="' + f1(x1) + '" y1="' + f1(y1) + '" x2="' + f1(x2 - 3 * Math.cos(a)) + '" y2="' + f1(y2 - 3 * Math.sin(a)) + '" class="fg-ln"/><polygon points="' + f1(x2) + ',' + f1(y2) + ' ' + p(Math.PI * 0.84, s) + ' ' + p(-Math.PI * 0.84, s) + '" class="fg-ah"/>';
  }
  const band = (attrs, f, i, o) => '<' + attrs + ' class="fg-band' + (o.hot === i ? ' hot' : '') + '" style="--c:var(--' + col(f, i) + ')"/>';
  const lab = (p, o, i) => isHid(o, i) ? '؟' : (p.s || p.t);

  /* ---------- هرم (عادي أو مقلوب) ---------- */
  function pyramid(f, o) {
    const L = f.levels, n = L.length, bh = f.bh || 46, W = 340, H = n * bh + 6, wTop = f.inv ? 332 : (f.top || 108), wBot = f.inv ? (f.tip || 84) : 332;
    const wAt = y => wTop + (wBot - wTop) * (y / (n * bh));
    let s = '';
    L.forEach((lv, i) => {
      const y0 = i * bh, y1 = y0 + bh - 4, wa = wAt(y0), wb = wAt(y1);
      const pts = [[170 - wa / 2, y0 + 3], [170 + wa / 2, y0 + 3], [170 + wb / 2, y1 + 3], [170 - wb / 2, y1 + 3]].map(p => f1(p[0]) + ',' + f1(p[1])).join(' ');
      const t = lab(lv, o, i), fs = fit(t, Math.min(wa, wb) - 14, 13.5);
      s += band('polygon points="' + pts + '"', f, i, o) + tx(170, y0 + 3 + (bh - 4) / 2 + fs * 0.36, t, fs, 'fg-tx b' + (isHid(o, i) ? ' q' : ''));
    });
    return svg(W, H, s);
  }
  /* ---------- دواير جوه بعض (من جوه لبره) ---------- */
  function rings(f, o) {
    const R = f.rings, n = R.length, cx = 170, cy = 168, rad = f.rad || [48, 104, 162].slice(0, n);
    let s = '';
    for (let i = n - 1; i >= 0; i--) s += band('circle cx="' + cx + '" cy="' + cy + '" r="' + rad[i] + '"', f, i, o);
    R.forEach((r, i) => {
      const t = lab(r, o, i), q = isHid(o, i) ? ' q' : '';
      if (i === 0) { const ls = wrap(t, 9); s += tx(cx, cy + 4, ls, fit(ls.reduce((a, b) => a.length > b.length ? a : b), rad[0] * 1.7, 12.5), 'fg-tx b' + q); return; }
      const rm = (rad[i - 1] + rad[i]) / 2;
      s += tx(cx, cy - rm + 5, t, fit(t, rm * 1.35, 12.5), 'fg-tx b' + q);
      if (!o.hide) (r.it || []).forEach((it, k, a) => {
        const ang = (a.length > 1 ? 62 + k * (236 / (a.length - 1)) : 180) * Math.PI / 180, ls = wrap(it, 9);
        s += tx(cx + rm * Math.sin(ang), cy - rm * Math.cos(ang) + 4, ls, 10.5, 'fg-tx sm');
      });
    });
    return svg(340, 336, s);
  }
  /* ---------- حلقة من صفين (عملية الاتصال) ---------- */
  function loop(f, o) {
    const S = f.steps, k = Math.ceil(S.length / 2), W = 340, gap = 10, bw = (W - 14 - (k - 1) * gap) / k, bh = 58, y1 = 8, y2 = 124;
    const X = j => W - 7 - bw - j * (bw + gap);
    const pos = i => i < k ? { x: X(i), y: y1 } : { x: X(k - 1 - (i - k)), y: y2 };
    let s = '';
    S.forEach((st, i) => {
      const p = pos(i), t = lab(st, o, i), ls = wrap(t, 11), fs = fit(ls.reduce((a, b) => a.length > b.length ? a : b), bw - 8, 11.5);
      s += band('rect x="' + f1(p.x) + '" y="' + p.y + '" width="' + f1(bw) + '" height="' + bh + '" rx="8"', f, i, o);
      s += tx(p.x + bw / 2, p.y + (st.en && !isHid(o, i) ? 24 : 32), ls, fs, 'fg-tx b' + (isHid(o, i) ? ' q' : ''));
      if (st.en && !isHid(o, i)) s += '<text x="' + f1(p.x + bw / 2) + '" y="' + (p.y + bh - 8) + '" font-size="8.5" text-anchor="middle" class="fg-tx sm" direction="ltr">' + esc(st.en) + '</text>';
      const nx = pos((i + 1) % S.length);
      if (i < k - 1) s += arrow(p.x - 1, p.y + bh / 2, nx.x + bw + 1, nx.y + bh / 2);
      else if (i === k - 1) s += arrow(p.x + bw / 2, p.y + bh + 1, nx.x + bw / 2, nx.y - 1);
      else if (i < S.length - 1) s += arrow(p.x + bw + 1, p.y + bh / 2, nx.x - 1, nx.y + bh / 2);
      else s += arrow(p.x + bw / 2, p.y - 1, nx.x + bw / 2, nx.y + bh + 1);
    });
    if (f.mid) s += tx(170, (y1 + bh + y2) / 2 + 4, f.mid, 10.5, 'fg-tx sm');
    return svg(W, y2 + bh + 8, s);
  }
  /* ---------- دورة (نظام مستمر) ---------- */
  function cycle(f, o) {
    const S = f.steps, n = S.length, cx = 170, cy = 156, r = 112, bw = 92, bh = 38;
    let s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" class="fg-ring"/>';
    const P = i => { const a = (-90 + i * 360 / n) * Math.PI / 180; return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), a }; };
    S.forEach((st, i) => {
      const m = (-90 + (i + 0.5) * 360 / n) * Math.PI / 180, mx = cx + r * Math.cos(m), my = cy + r * Math.sin(m);
      s += arrow(mx - 4 * Math.cos(m + Math.PI / 2), my - 4 * Math.sin(m + Math.PI / 2), mx + 5 * Math.cos(m + Math.PI / 2), my + 5 * Math.sin(m + Math.PI / 2));
    });
    S.forEach((st, i) => {
      const p = P(i), t = lab(st, o, i), ls = wrap(t, 14), fs = fit(ls.reduce((a, b) => a.length > b.length ? a : b), bw - 8, 10.5);
      s += band('rect x="' + f1(p.x - bw / 2) + '" y="' + f1(p.y - bh / 2) + '" width="' + bw + '" height="' + bh + '" rx="9"', f, i, o);
      s += tx(p.x, p.y + 4, ls, fs, 'fg-tx b' + (isHid(o, i) ? ' q' : ''));
    });
    if (f.mid) s += tx(cx, cy + 4, wrap(f.mid, 14), 11.5, 'fg-tx b acc');
    return svg(340, 312, s);
  }
  /* ---------- منحنى دورة حياة المنتج ---------- */
  function curve(f, o) {
    const St = f.stages, n = St.length, x0 = 30, x1 = 334, w = (x1 - x0) / n, zero = 178;
    let s = '';
    St.forEach((st, i) => {
      if (o.hot === i) s += '<rect x="' + f1(x0 + i * w) + '" y="30" width="' + f1(w) + '" height="' + (zero - 30 + 14) + '" class="fg-hotcol"/>';
      if (i) s += '<line x1="' + f1(x0 + i * w) + '" y1="30" x2="' + f1(x0 + i * w) + '" y2="' + (zero + 14) + '" class="fg-dash"/>';
      const t = lab(st, o, i); s += tx(x0 + (i + 0.5) * w, 22, t, fit(t, w - 6, 12), 'fg-tx b' + (isHid(o, i) ? ' q' : ''));
    });
    s += '<line x1="' + x0 + '" y1="30" x2="' + x0 + '" y2="' + (zero + 14) + '" class="fg-ax"/><line x1="' + x0 + '" y1="' + zero + '" x2="' + x1 + '" y2="' + zero + '" class="fg-ax"/>';
    s += '<path d="M30,166 C66,165 88,150 104,134 S146,84 182,64 S232,38 258,54 S312,96 334,118" class="fg-c1"/>';
    s += '<path d="M30,187 C58,189 78,185 98,174 S148,122 186,118 S272,152 334,173" class="fg-c2"/>';
    s += tx(292, 46, f.l1 || 'منحنى المبيعات', 10, 'fg-tx sm c1') + tx(268, 171, f.l2 || 'منحنى الأرباح', 10, 'fg-tx sm c2');
    s += tx(182, 208, (f.x || 'الزمن') + ' →', 10.5, 'fg-tx sm', 'direction="ltr"');
    s += '<text x="12" y="104" font-size="10" text-anchor="middle" class="fg-tx sm" transform="rotate(-90 12 104)">' + esc(f.y || 'الإيراد النقدي') + '</text>';
    s += tx(54, zero - 4, f.z || 'نقطة الصفر', 8.5, 'fg-tx sm');
    return svg(340, 214, s);
  }
  /* ---------- منحنى الجرس (تقبل المنتجات الجديدة) ---------- */
  function bell(f, o) {
    const G = f.groups, base = 150, xs = [8]; let tot = G.reduce((a, g) => a + (g.w || 1), 0);
    G.forEach(g => xs.push(xs[xs.length - 1] + 324 * (g.w || 1) / tot));
    const P = [[8, 128], [44, 70], [112, 24], [186, 24], [262, 24], [300, 108], [332, base]];
    const bez = (a, b, c, d, t) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };
    const pts = []; for (let k = 0; k < 2; k++) for (let t = 0; t <= 1.0001; t += 0.02) pts.push([bez(P[k * 3][0], P[k * 3 + 1][0], P[k * 3 + 2][0], P[k * 3 + 3][0], t), bez(P[k * 3][1], P[k * 3 + 1][1], P[k * 3 + 2][1], P[k * 3 + 3][1], t)]);
    const yAt = x => { for (let i = 1; i < pts.length; i++) if (pts[i][0] >= x) { const a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * ((x - a[0]) / Math.max(0.01, b[0] - a[0])); } return base; };
    let s = '';
    G.forEach((g, i) => {
      const a = xs[i], b = xs[i + 1], mid = (a + b) / 2;
      if (o.hot === i) { let d = 'M' + f1(a) + ',' + base; for (let x = a; x <= b; x += 3) d += ' L' + f1(x) + ',' + f1(yAt(x)); d += ' L' + f1(b) + ',' + f1(yAt(b)) + ' L' + f1(b) + ',' + base + ' Z'; s += '<path d="' + d + '" class="fg-hotcol"/>'; }
      if (i) s += '<line x1="' + f1(a) + '" y1="' + base + '" x2="' + f1(a) + '" y2="' + f1(yAt(a)) + '" class="fg-dash"/>';
      const t = lab(g, o, i), room = base - yAt(mid) - 10, ls = isHid(o, i) ? [t] : wrap(t, Math.max(6, Math.floor(room / 5.6)));
      ls.forEach((l, j) => { const xx = mid + (j - (ls.length - 1) / 2) * 12; s += '<text x="' + f1(xx) + '" y="' + (base - 8) + '" font-size="' + (isHid(o, i) ? 13 : 10) + '" text-anchor="start" class="fg-tx b' + (isHid(o, i) ? ' q' : '') + '" transform="rotate(-90 ' + f1(xx) + ' ' + (base - 8) + ')" direction="ltr" style="unicode-bidi:plaintext">' + esc(l) + '</text>'; });
      s += tx(mid, base + 16, g.p || '', 10.5, 'fg-tx sm', 'direction="ltr"');
    });
    s += '<path d="M' + P[0] + ' C' + P[1] + ' ' + P[2] + ' ' + P[3] + ' C' + P[4] + ' ' + P[5] + ' ' + P[6] + '" class="fg-c1"/>';
    s += '<line x1="8" y1="' + base + '" x2="334" y2="' + base + '" class="fg-ax"/><line x1="8" y1="16" x2="8" y2="' + base + '" class="fg-ax"/>';
    s += tx(170, base + 34, (f.x || 'الزمن') + ' →', 10.5, 'fg-tx sm', 'direction="ltr"');
    return svg(340, base + 42, s);
  }
  /* ---------- شجرة: أصل وفروع (HTML) ---------- */
  function tree(f, o) {
    const kid = (k, i, top) => '<div class="fg-kid' + (top && o.hot === i ? ' hot' : '') + '" style="--c:var(--' + col(f, i) + ')"><b' + (top && isHid(o, i) ? ' class="q"' : '') + '>' + esc(top ? lab(k, o, i) : k.t) + '</b>' +
      (o.hide ? '' : (k.it && k.it.length ? '<small>' + k.it.map(esc).join('<br>') + '</small>' : '') + (k.sub ? '<div class="fg-sub">' + k.sub.map(x => kid(x, i, false)).join('') + '</div>' : '')) + '</div>';
    return '<div class="fg-tree">' + (f.root ? '<div class="fg-root">' + esc(f.root) + '</div><div class="fg-stem"></div>' : '') + '<div class="fg-kids n' + f.kids.length + '">' + f.kids.map((k, i) => kid(k, i, true)).join('') + '</div>' + (f.foot ? '<div class="fg-foot">' + esc(f.foot) + '</div>' : '') + '</div>';
  }
  /* ---------- سلسلة بأسهم (HTML) ---------- */
  function chain(f, o) {
    const row = (steps, base) => '<ol class="fg-chain">' + steps.map((st, j) => { const i = base + j; return '<li class="' + (o.hot === i ? 'hot' : '') + '" style="--c:var(--' + (f.rows ? (j === 0 ? 'blue' : j === steps.length - 1 ? 'green' : 'orange') : col(f, i)) + ')"><span' + (isHid(o, i) ? ' class="q"' : '') + '>' + esc(typeof st === 'string' ? (isHid(o, i) ? '؟' : st) : lab(st, o, i)) + '</span></li>'; }).join('') + '</ol>';
    let h = '';
    if (f.rows) f.rows.forEach(r => { h += '<div class="fg-row">' + (r.t ? '<div class="fg-rt">' + esc(r.t) + '</div>' : '') + row(r.steps, 1e6) + '</div>'; });
    else h = row(f.steps, 0);
    if (f.notes && !o.hide) h += '<div class="fg-notes">' + f.notes.map(x => '<div class="fg-note">' + esc(x) + '</div>').join('') + '</div>';
    return '<div class="fg-chainbox">' + h + '</div>';
  }
  const DRAW = { pyramid, rings, loop, cycle, curve, bell, tree, chain };
  /** الأجزاء اللي ليها أسماء (للتدريب والشرح) */
  function parts(f) { return f.levels || f.rings || f.steps || f.stages || f.groups || f.kids || []; }

  const api = {
    reg(sid, figs) { Object.keys(figs || {}).forEach(id => { REG[id] = Object.assign({ id, sid }, figs[id]); }); },
    get: id => REG[id] || null,
    list: sid => Object.values(REG).filter(f => !sid || f.sid === sid),
    parts: id => REG[id] ? parts(REG[id]).map(p => typeof p === 'string' ? { t: p } : p) : [],
    canPractice: id => !!REG[id] && !REG[id].rows && parts(REG[id]).length >= 3,
    draw(f, o = {}) { const fn = DRAW[f.type]; return fn ? fn(f, o) : ''; },
    /** الرسمة كاملة: عنوان + رسم + مفتاح الأجزاء + المصدر */
    html(id, o = {}) {
      const f = REG[id]; if (!f) return '';
      const ps = api.parts(id), leg = !o.hide && !o.bare && f.legend !== false && ps.some(p => p.d);
      return '<figure class="fig' + (o.hide ? ' prac' : '') + '" data-fig="' + esc(id) + '">' + (o.bare ? '' : '<div class="fig-t">' + esc(f.title) + (f.ext ? ' <span class="pill ext">📘 رسم مقترح</span>' : '') + '</div>') +
        '<div class="fig-b">' + api.draw(f, o) + '</div>' +
        (leg ? '<ol class="fig-leg">' + ps.map((p, i) => '<li style="--c:var(--' + col(f, i) + ')"><b>' + esc(p.t) + '</b>' + (p.d ? '<span>' + esc(p.d) + '</span>' : '') + '</li>').join('') + '</ol>' : '') +
        (!o.hide && !o.bare && f.cap ? '<figcaption>' + esc(f.cap) + '</figcaption>' : '') +
        (!o.hide && !o.bare && !o.noact && api.canPractice(id) ? '<div class="fig-acts"><a class="btn sm tint" href="#fig/' + esc(id) + '">✏️ اتدرب على الرسمة</a></div>' : '') + '</figure>';
    },
    wrap, fit
  };
  return api;
});
