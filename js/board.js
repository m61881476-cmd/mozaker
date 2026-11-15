/* مذاكِر — البورد: شرح بيتكتب ويترسم قدامك (سطور، معادلات، جداول، رسومات بيانية) ومعاه صوت عربي وكلام مكتوب تحته.
   الدرس = مشاهد، وكل مشهد خطوات: [النوع، المحتوى، الكلام المنطوق، خيارات] */
(function () {
  'use strict';
  const E = self.Engine, U = self.UI;
  const { $, $$, esc, icon, Store, Router, header, Char, haptic } = U;
  const D = () => Store.data;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- الدروس المتاحة ---------- */
  const scenesOf = lid => { for (const s of App.BUILT || []) if (s.boards && s.boards[lid]) return s.boards[lid]; return null; };
  const norm = st => Array.isArray(st) ? { k: st[0], v: st[1], say: st[2] || '', o: st[3] || {} } : st;

  /* ---------- الصوت ---------- */
  const LAT = { yd: 'واي دي', y: 'واي', c: 'سي', i: 'آي', g: 'جي', s: 'إس', t: 'تي', r: 'آر', b: 'بي', a: 'إيه', k: 'كيه', l: 'إل', d: 'دي', m: 'إم', e: 'إي', x: 'إكس', p: 'بي', mlr: 'إم إل آر', is: 'آي إس', lm: 'إل إم', gdp: 'جي دي بي', gnp: 'جي إن بي', ndp: 'إن دي بي', ms: 'إم إس', md: 'إم دي', mpc: 'إم بي سي', mps: 'إم بي إس', apc: 'إيه بي سي', aps: 'إيه بي إس', ad: 'إيه دي', as: 'إيه إس', m1: 'إم واحد', m2: 'إم اتنين' };
  /** يجهز النص للنطق: الرموز تتقري بالعربي */
  function speakable(t) {
    return String(t || '').replace(/[«»*]/g, '').replace(/Ā|A̅/g, ' إيه بار ').replace(/Δ/g, ' التغير في ')
      .replace(/(\d)\s*[−-]\s*(\d)/g, '$1 ناقص $2').replace(/=/g, ' يساوي ').replace(/\+/g, ' زائد ').replace(/[×*]/g, ' في ').replace(/÷/g, ' على ').replace(/%/g, ' في المية ').replace(/−/g, ' ناقص ')
      .replace(/[A-Za-z][A-Za-z0-9]*/g, w => LAT[w.toLowerCase()] || w).replace(/\s+/g, ' ').trim();
  }
  const Voice = {
    v: null, ready: false, ok: null, fails: 0, unlocked: false,
    has: () => 'speechSynthesis' in self && typeof SpeechSynthesisUtterance !== 'undefined',
    pick() {
      if (!this.has()) return null;
      let all = []; try { all = speechSynthesis.getVoices() || []; } catch (e) {}
      const vs = all.filter(v => /^ar([-_]|$)/i.test(v.lang || ''));
      const pref = ['ar-EG', 'ar-SA', 'ar-001', 'ar-XA', 'ar-AE'], L = v => String(v.lang).replace('_', '-');
      const rank = v => { const k = pref.findIndex(p => L(v).toLowerCase().startsWith(p.toLowerCase())); return k < 0 ? 9 : k; };
      vs.sort((a, b) => rank(a) - rank(b) || (b.localService ? 1 : 0) - (a.localService ? 1 : 0));
      this.v = vs[0] || null; this.ready = true; return this.v;
    },
    /** لغة النطق: لو مفيش صوت عربي ظاهر في القايمة بنطلب العربي برضه، وأندرويد بيختار المحرك المناسب */
    lang() { return this.v ? String(this.v.lang).replace('_', '-') : 'ar-SA'; },
    init() { if (!this.has()) { this.ready = true; return; } this.pick(); try { speechSynthesis.addEventListener('voiceschanged', () => { this.pick(); this.note(); }); } catch (e) {} setTimeout(() => this.pick(), 800); },
    note() { if (App.Board && App.Board.onVoices) App.Board.onVoices(); },
    usable() { return this.has() && this.ok !== false; },
    stop() { try { this.has() && speechSynthesis.cancel(); } catch (e) {} },
    /** آيفون وأندرويد مابيسمحوش بالنطق إلا لو أول جملة اتطلبت جوه ضغطة المستخدم نفسها */
    unlock() {
      if (!this.has()) return;
      try { if (!this.v) this.pick(); const u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.lang = this.lang(); if (this.v) u.voice = this.v; speechSynthesis.resume && speechSynthesis.resume(); speechSynthesis.speak(u); this.unlocked = true; } catch (e) {}
    },
    fail() { this.fails++; if (this.ok !== true && this.fails >= 2) { this.ok = false; this.note(); } },
    /** ينطق جملة ويرجع لما تخلص. لو النطق ماشتغلش بيستنى الوقت التقديري عشان الشرح المكتوب يمشي بنفس الإيقاع */
    say(text, rate) {
      const est = Board.estimate(text, rate);
      if (!this.usable() || !text) return wait(est);
      return new Promise(res => {
        const t0 = Date.now(); let done = false, started = false;
        const fin = () => { if (done) return; done = true; clearTimeout(tm); clearTimeout(wd); const left = est * (started ? 0.5 : 1) - (Date.now() - t0); if (left > 0) setTimeout(res, left); else res(); };
        const tm = setTimeout(fin, est * 1.9 + 2500);
        const wd = setTimeout(() => { if (!started && !done) { let sp = false; try { sp = speechSynthesis.speaking || speechSynthesis.pending; } catch (e) {} if (!sp) { this.fail(); fin(); } } }, 3500);
        try {
          const u = new SpeechSynthesisUtterance(speakable(text)); if (this.v) u.voice = this.v; u.lang = this.lang(); u.rate = Math.min(2, Math.max(0.5, rate)); u.pitch = 1; u.volume = 1;
          u.onstart = () => { started = true; if (this.ok !== true) { this.ok = true; this.fails = 0; this.note(); } };
          u.onend = () => { if (!started && Date.now() - t0 < 400) this.fail(); fin(); };
          u.onerror = e => { const k = e && e.error; if (k !== 'interrupted' && k !== 'canceled' && !started) this.fail(); fin(); };
          Voice.cur = u; speechSynthesis.resume && speechSynthesis.resume(); speechSynthesis.speak(u);
        } catch (e) { this.fail(); fin(); }
      });
    }
  };

  /* ---------- رسم الخطوات ---------- */
  /** نص فيه *تمييز* يتحول لأجزاء */
  function segs(t) { const out = []; String(t).split(/(\*[^*]+\*)/).forEach(p => { if (!p) return; if (p[0] === '*' && p.length > 2) out.push({ t: p.slice(1, -1), hi: 1 }); else out.push({ t: p }); }); return out; }
  /** يكتب النص حرف حرف */
  function type(el, text, ms, skip) {
    const S = segs(text), spans = S.map(s => { const sp = document.createElement('span'); if (s.hi) sp.className = 'hi'; el.appendChild(sp); return sp; });
    const total = S.reduce((a, s) => a + s.t.length, 0);
    if (!ms || skip()) { S.forEach((s, i) => { spans[i].textContent = s.t; }); return Promise.resolve(); }
    const cur = document.createElement('i'); cur.className = 'bd-cur'; el.appendChild(cur);
    return new Promise(res => {
      const t0 = performance.now(); let shown = 0;
      const tick = () => {
        const n = skip() ? total : Math.min(total, Math.ceil((performance.now() - t0) / ms * total));
        if (n !== shown) { shown = n; let left = n; S.forEach((s, i) => { const k = Math.min(left, s.t.length); spans[i].textContent = s.t.slice(0, k); left -= k; }); }
        if (n >= total) { cur.remove(); res(); } else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
  const line = (cls, o) => { const d = document.createElement('div'); d.className = 'bd-l ' + cls + (o && o.c ? ' c-' + o.c : '') + (o && o.sm ? ' sm' : '') + (o && o.ce ? ' ce' : ''); return d; };
  /* رسم بياني: كل العناصر خطوط ونقط على محورين */
  function graphEl(g) {
    const W = 340, H = g.h || 236, L = 40, R = 16, T = 18, B = 32;
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('class', 'bd-g'); svg.setAttribute('direction', 'ltr');
    svg._m = { W, H, L, R, T, B, xmax: g.xmax || 10, ymax: g.ymax || 10, X: x => L + (x / (g.xmax || 10)) * (W - L - R), Y: y => H - B - (y / (g.ymax || 10)) * (H - T - B) };
    return svg;
  }
  function sv(svg, tag, attrs, text) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; svg.appendChild(e); return e; }
  function drawLine(svg, x1, y1, x2, y2, cls, ms, skip) {
    const e = sv(svg, 'line', { x1, y1, x2, y2, class: cls });
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (!ms || skip()) return Promise.resolve(e);
    e.style.strokeDasharray = len; e.style.strokeDashoffset = len; e.getBoundingClientRect(); e.style.transition = 'stroke-dashoffset ' + ms + 'ms ease'; e.style.strokeDashoffset = 0;
    return new Promise(res => { const t0 = performance.now(); const ck = () => { if (skip() || performance.now() - t0 >= ms) { e.style.transition = 'none'; if (!/dash/.test(cls)) e.style.strokeDasharray = ''; e.style.strokeDashoffset = 0; res(e); } else requestAnimationFrame(ck); }; ck(); });
  }
  async function graphAdd(svg, v, ms, skip) {
    const m = svg._m, c = v.c || 'w';
    if (v.line) {
      const [x1, y1, x2, y2] = v.line; await drawLine(svg, m.X(x1), m.Y(y1), m.X(x2), m.Y(y2), 'ln c-' + c + (v.dash ? ' dash' : ''), ms, skip);
      if (v.label) { const at = v.at === 'start' ? [x1, y1] : [x2, y2]; sv(svg, 'text', { x: m.X(at[0]) + (v.dx || 4), y: m.Y(at[1]) + (v.dy || -5), class: 'tx c-' + c, 'text-anchor': v.anchor || 'start' }, v.label); }
    }
    if (v.pt) {
      const [x, y] = v.pt;
      if (v.guides !== false) { await drawLine(svg, m.X(x), m.Y(y), m.X(x), m.Y(0), 'ln dash c-' + c, ms / 2, skip); await drawLine(svg, m.X(x), m.Y(y), m.X(0), m.Y(y), 'ln dash c-' + c, ms / 2, skip); }
      sv(svg, 'circle', { cx: m.X(x), cy: m.Y(y), r: 4.2, class: 'pt c-' + c });
      if (v.label) sv(svg, 'text', { x: m.X(x) + (v.dx == null ? 7 : v.dx), y: m.Y(y) + (v.dy == null ? -7 : v.dy), class: 'tx b c-' + c }, v.label);
      if (v.xl != null) sv(svg, 'text', { x: m.X(x), y: m.H - m.B + 14, class: 'tx sm c-' + c, 'text-anchor': 'middle' }, v.xl);
      if (v.yl != null) sv(svg, 'text', { x: m.L - 5, y: m.Y(y) + 4, class: 'tx sm c-' + c, 'text-anchor': 'end' }, v.yl);
    }
    if (v.xtick) sv(svg, 'text', { x: m.X(v.xtick[0]), y: m.H - m.B + 14, class: 'tx sm c-' + c, 'text-anchor': 'middle' }, v.xtick[1] == null ? v.xtick[0] : v.xtick[1]);
    if (v.ytick) sv(svg, 'text', { x: m.L - 5, y: m.Y(v.ytick[0]) + 4, class: 'tx sm c-' + c, 'text-anchor': 'end' }, v.ytick[1] == null ? v.ytick[0] : v.ytick[1]);
    if (v.arrow) { const [x1, y1, x2, y2] = v.arrow, X1 = m.X(x1), Y1 = m.Y(y1), X2 = m.X(x2), Y2 = m.Y(y2), a = Math.atan2(Y2 - Y1, X2 - X1); await drawLine(svg, X1, Y1, X2, Y2, 'ln thin c-' + c, ms, skip); sv(svg, 'polygon', { points: [[X2, Y2], [X2 - 8 * Math.cos(a - 0.45), Y2 - 8 * Math.sin(a - 0.45)], [X2 - 8 * Math.cos(a + 0.45), Y2 - 8 * Math.sin(a + 0.45)]].map(p => p.map(n => n.toFixed(1)).join(',')).join(' '), class: 'ah c-' + c }); }
    if (v.text) sv(svg, 'text', { x: m.X(v.text[0]), y: m.Y(v.text[1]), class: 'tx c-' + c + (v.b ? ' b' : ''), 'text-anchor': v.anchor || 'middle' }, v.text[2]);
  }
  /** يرسم خطوة واحدة في البورد */
  async function render(box, st, dur, skip) {
    const k = st.k, v = st.v, o = st.o || {};
    const add = el => { box.appendChild(el); box.parentElement.scrollTop = box.parentElement.scrollHeight; return el; };
    if (k === 'h') return type(add(line('h', o)), v, dur, skip);
    if (k === 'w') return type(add(line('w', o)), v, dur, skip);
    if (k === 'li') { const l = add(line('w li', o)); return type(l, v, dur, skip); }
    if (k === 'eq') { const l = add(line('eq', o)); l.dir = 'ltr'; return type(l, v, dur, skip); }
    if (k === 'note') { const l = add(line('nt', o)); return type(l, v, dur, skip); }
    if (k === 'sp') { add(line('sp', o)); return; }
    if (k === 'flow') {
      const l = add(line('flow', o)); const per = dur / Math.max(1, v.length);
      for (let i = 0; i < v.length; i++) { const b = document.createElement('span'); b.className = 'fl' + (i ? ' ar' : ''); b.textContent = v[i]; l.appendChild(b); if (!skip() && per) await wait(per); }
      return;
    }
    if (k === 'tbl') {
      const w = add(line('tw', o)), t = document.createElement('table'); t.className = 'bd-t'; w.appendChild(t); box._tbl = t;
      if (v.head) { const tr = t.insertRow(); v.head.forEach(h => { const th = document.createElement('th'); th.textContent = h; tr.appendChild(th); }); }
      for (const r of v.rows || []) { rowAdd(t, r, true); }
      if (dur && !skip()) await wait(Math.min(dur, 700));
      return;
    }
    if (k === 'tr') { const t = box._tbl; if (!t) return; const tr = rowAdd(t, v, skip() || !dur); box.parentElement.scrollTop = box.parentElement.scrollHeight; if (dur && !skip()) { const cells = [...tr.cells], per = Math.min(420, dur / cells.length); for (const c of cells) { if (skip()) break; c.classList.add('on'); await wait(per); } cells.forEach(c => c.classList.add('on')); } return; }
    if (k === 'tc') { const t = box._tbl; if (!t) return; const c = t.rows[v[0]] && t.rows[v[0]].cells[v[1]]; if (c) { if (v[2] != null) c.textContent = v[2]; c.classList.add('on', 'mark'); } if (dur && !skip()) await wait(Math.min(dur, 500)); return; }
    if (k === 'g') {
      const w = add(line('gw', o)), svg = graphEl(v), m = svg._m; w.appendChild(svg); box._g = svg;
      await drawLine(svg, m.L, m.H - m.B, m.L, m.T - 4, 'ax', dur / 2, skip); await drawLine(svg, m.L, m.H - m.B, m.W - m.R + 6, m.H - m.B, 'ax', dur / 2, skip);
      sv(svg, 'text', { x: m.L - 4, y: m.T - 6, class: 'tx b', 'text-anchor': 'middle' }, v.y || ''); sv(svg, 'text', { x: m.W - m.R + 8, y: m.H - m.B + 14, class: 'tx b', 'text-anchor': 'end' }, v.x || '');
      sv(svg, 'text', { x: m.L - 6, y: m.H - m.B + 13, class: 'tx sm', 'text-anchor': 'end' }, '0');
      for (const e of v.els || []) await graphAdd(svg, e, 0, () => true);
      box.parentElement.scrollTop = box.parentElement.scrollHeight;
      return;
    }
    if (k === 'gl') { const svg = box._g; if (!svg) return; const list = Array.isArray(v) ? v : [v]; for (const e of list) await graphAdd(svg, e, dur / list.length, skip); return; }
  }
  function rowAdd(t, r, on) { const tr = t.insertRow(); r.forEach(c => { const td = tr.insertCell(); const hi = typeof c === 'string' && c[0] === '*'; td.textContent = hi ? c.replace(/\*/g, '') : c; if (hi) td.classList.add('mark'); if (on) td.classList.add('on'); }); return tr; }

  /* ---------- المشغّل ---------- */
  const Board = {
    estimate(text, rate) { const w = speakable(text).split(' ').filter(Boolean).length; return w ? (w * 430 + 350) / (rate || 1) : 0; },
    P: null,
    has: lid => !!scenesOf(lid),
    count(lid) { const sc = scenesOf(lid); return sc ? sc.length : 0; },
    open(view, lid) {
      const scenes = scenesOf(lid), l = App.LESSONS[lid]; if (!scenes || !l) return Router.go('subjects', { replace: true });
      const d = D(); d.board = d.board || {}; const saved = d.board[lid] || {};
      const P = this.P = { lid, scenes: scenes.map(s => ({ t: s.t, s: s.s.map(norm) })), si: Math.min(saved.si || 0, scenes.length - 1), ki: 0, drawn: 0, playing: false, tok: 0, rate: (d.settings.boardRate || 1), mute: !!d.settings.boardMute, t0: Date.now(), ended: false };
      header(view, 'شرح على البورد', { back: { to: 'lesson/' + lid, label: 'الملخص' } });
      view.classList.add('boardview');
      view.insertAdjacentHTML('beforeend',
        '<div class="bd-top"><button class="bd-sc" id="bdSc" aria-label="قايمة المشاهد"><span id="bdScT"></span>' + icon('list') + '</button></div>'
        + '<div class="bd" id="bd"><div class="bd-in" id="bdIn" dir="rtl"></div><button class="bd-big" id="bdBig" aria-label="تشغيل">' + icon('play') + '<span>ابدأ الشرح</span></button></div>'
        + '<div class="bar bd-bar"><i id="bdBar" style="width:0"></i></div>'
        + '<div class="bd-cap">' + Char.html('', 46) + '<div class="bd-capt" id="bdCap" aria-live="polite"></div></div>'
        + '<div class="bd-ctl"><button data-b="sprev" aria-label="المشهد اللي قبله">⏮</button><button data-b="back" aria-label="خطوة لورا">◀</button><button data-b="play" class="pp" id="bdPP" aria-label="تشغيل أو إيقاف">' + icon('play') + '</button><button data-b="fwd" aria-label="خطوة لقدام">▶</button><button data-b="snext" aria-label="المشهد اللي بعده">⏭</button></div>'
        + '<div class="bd-opt"><button id="bdRate" class="chip"></button><button id="bdMute" class="chip"></button><button id="bdTest" class="chip">🔈 جرّب الصوت</button><button id="bdHelp" class="chip">الصوت مش شغال؟</button></div><p class="note center" id="bdVoice" style="margin:-4px 0 10px"></p>'
        + '<div id="bdEnd"></div>');
      const ctl = { sprev: () => this.scene(P.si - 1), snext: () => this.scene(P.si + 1), back: () => this.step(-1), fwd: () => this.step(1), play: () => this.toggle() };
      $$('[data-b]', view).forEach(b => b.onclick = () => { haptic(); ctl[b.dataset.b](); });
      $('#bdBig').onclick = () => this.toggle();
      $('#bd').addEventListener('click', e => { if (e.target.closest('#bdBig')) return; if (P.playing) this.pause(); });
      $('#bdSc').onclick = () => this.list();
      $('#bdRate').onclick = () => { const R = [0.8, 1, 1.2, 1.5], i = (R.indexOf(P.rate) + 1) % R.length; P.rate = R[i]; D().settings.boardRate = P.rate; Store.save(); this.ui(); if (P.playing) { this.pause(); this.play(); } };
      $('#bdMute').onclick = () => { P.mute = !P.mute; D().settings.boardMute = P.mute; Store.save(); this.ui(); if (P.playing) { this.pause(); this.play(); } };
      this.onVoices = () => this.ui();
      $('#bdTest').onclick = () => { this.pause(); Voice.ok = null; Voice.fails = 1; Voice.stop(); Voice.unlock(); this.caption('ده اختبار للصوت. لو سامعني يبقى كله تمام.'); setTimeout(() => Voice.say('ده اختبار للصوت. لو سامعني يبقى كله تمام.', P.rate).then(() => this.ui()), 120); };
      $('#bdHelp').onclick = () => { this.pause(); U.sheet({ title: 'تشغيل الصوت العربي', body: '<div class="prose" style="font-size:15.5px"><p>الشرح بيتنطق بالصوت العربي اللي في موبايلك نفسه. لو مش سامع حاجة جرّب بالترتيب:</p><h3>في الأول (أي موبايل)</h3><ol><li>علّي صوت <b>الميديا</b> وشيل الوضع الصامت (في الآيفون زرار الجنب).</li><li>دوس <b>«🔈 جرّب الصوت»</b> تحت البورد.</li></ol><h3>أندرويد</h3><ol><li>الإعدادات ← النظام ← اللغات والإدخال ← <b>تحويل النص إلى كلام</b> (أو دوّر في الإعدادات على «تحويل النص»).</li><li>اختار المحرك <b>Speech Services by Google</b> (خدمات النطق من Google). لو مش موجود نزّله من Google Play.</li><li>دوس ⚙️ ← <b>تثبيت بيانات الصوت</b> ← <b>العربية</b> ونزّلها.</li><li>اقفل مذاكِر وافتحه تاني من <b>Chrome</b>.</li></ol><h3>آيفون</h3><ol><li>الإعدادات ← تسهيلات الاستخدام ← <b>المحتوى المنطوق</b> ← الأصوات ← <b>العربية</b> ونزّل صوت (ماجد مثلًا).</li><li>افتح مذاكِر من <b>Safari</b> أو من الأيقونة اللي على الشاشة الرئيسية.</li></ol><p class="note">ولو الصوت ماشتغلش برضه، الشرح كله مكتوب تحت البورد وماشي بنفس السرعة.</p></div>' }); };
      this.clear(); this.ui();
      $('#bdCap').innerHTML = 'دوس ▶ وأنا أشرحلك <b>«' + esc(l.title) + '»</b> على البورد: هكتب وأرسم وأتكلم، وإنت تقدر توقفني أو ترجّع في أي وقت.';
      App.keys = e => { if (e.target.matches('input,textarea')) return; if (e.key === ' ') { e.preventDefault(); this.toggle(); } else if (e.key === 'ArrowLeft') this.step(1); else if (e.key === 'ArrowRight') this.step(-1); };
    },
    box() { return $('#bdIn'); },
    clear() { const b = this.box(); if (b) { b.innerHTML = ''; b._tbl = null; b._g = null; } this.P.drawn = 0; },
    ui() {
      const P = this.P; if (!P || !$('#bdScT')) return;
      const sc = P.scenes[P.si], total = P.scenes.reduce((a, s) => a + s.s.length, 0), before = P.scenes.slice(0, P.si).reduce((a, s) => a + s.s.length, 0);
      $('#bdScT').textContent = 'مشهد ' + (P.si + 1) + ' من ' + P.scenes.length + ' · ' + sc.t;
      $('#bdBar').style.width = ((before + Math.min(P.ki, sc.s.length)) / total * 100) + '%';
      $('#bdPP').innerHTML = icon(P.playing ? 'pause' : 'play'); $('#bdPP').classList.toggle('on', P.playing);
      $('#bdBig').hidden = P.playing || P.drawn > 0 || P.ended;
      $('#bdRate').textContent = 'السرعة ×' + P.rate;
      const hasV = Voice.usable();
      $('#bdMute').textContent = P.mute || !hasV ? '🔇 الصوت مقفول' : '🔊 الصوت شغال'; $('#bdMute').disabled = !hasV;
      $('#bdTest').hidden = !Voice.has();
      $('#bdVoice').textContent = !Voice.has() ? 'المتصفح ده مابيدعمش النطق. افتح البرنامج من Chrome أو Safari. الشرح هيظهر مكتوب تحت البورد.' : Voice.ok === false ? 'الصوت العربي ماشتغلش على الجهاز ده، فالشرح ماشي مكتوب. دوس «الصوت مش شغال؟» وشوف الخطوات.' : '';
      view_wake(P.playing);
    },
    toggle() { this.P.playing ? this.pause() : this.play(); },
    pause() { const P = this.P; if (!P) return; P.playing = false; P.tok++; Voice.stop(); this.ui(); },
    async play() {
      const P = this.P; if (!P || P.playing) return;
      if (P.ended) { P.ended = false; P.si = 0; P.ki = 0; this.clear(); $('#bdEnd').innerHTML = ''; }
      P.playing = true; const my = ++P.tok; this.ui();
      const dead = () => my !== P.tok || this.P !== P;
      Voice.stop(); if (!P.mute) Voice.unlock(); await wait(90);
      while (!dead()) {
        const sc = P.scenes[P.si], st = sc.s[P.ki];
        if (!st) {
          if (P.si >= P.scenes.length - 1) return this.finish();
          await wait(900 / P.rate); if (dead()) return;
          P.si++; P.ki = 0; this.clear(); this.save(); this.ui(); await wait(350); if (dead()) return; continue;
        }
        const say = st.say || '', est = this.estimate(say, P.rate);
        const dur = st.o && st.o.fast ? 250 : Math.max(450, Math.min(est * 0.85, 7000) || 700) / (say ? 1 : P.rate);
        if (say) this.caption(say);
        const p1 = P.ki >= P.drawn ? render(this.box(), st, dur, dead).then(() => { if (P.drawn <= P.ki) P.drawn = P.ki + 1; }) : Promise.resolve();
        const p2 = say ? (P.mute ? wait(est) : Voice.say(say, P.rate)) : Promise.resolve();
        if (say && !P.mute && P.ki % 6 === 0) this.ui();
        this.talk(!!say);
        await Promise.all([p1, p2]); this.talk(false);
        if (dead()) return;
        await wait((st.o && st.o.hold || 260) / P.rate); if (dead()) return;
        P.ki++; this.ui();
      }
    },
    talk(on) { const c = $('.bd-cap .char'); if (c) c.classList.toggle('talk', on); },
    caption(t) { const c = $('#bdCap'); if (c) c.textContent = t.replace(/\*/g, ''); },
    /** يعيد رسم المشهد لحد خطوة معينة من غير حركة */
    async rebuild(upto) { const P = this.P; this.clear(); const sc = P.scenes[P.si]; for (let i = 0; i < Math.min(upto, sc.s.length); i++) await render(this.box(), sc.s[i], 0, () => true); P.drawn = Math.min(upto, sc.s.length); },
    async step(dir) {
      const P = this.P, was = P.playing; this.pause(); const sc = P.scenes[P.si];
      if (dir > 0) { if (P.ki >= sc.s.length) return this.scene(P.si + 1, was); P.ki++; await this.rebuild(P.ki); }
      else { if (P.ki <= 0) { if (P.si > 0) { P.si--; P.ki = Math.max(0, P.scenes[P.si].s.length - 1); await this.rebuild(P.ki); } } else { P.ki--; await this.rebuild(P.ki); } }
      const cur = P.scenes[P.si].s[Math.max(0, P.ki - (dir > 0 ? 1 : 0))]; if (cur && cur.say) this.caption(cur.say);
      this.ui(); if (was) this.play();
    },
    scene(n, autoplay) {
      const P = this.P, was = P.playing || autoplay; this.pause();
      if (n < 0) n = 0; if (n >= P.scenes.length) { if (was) return this.finish(); n = P.scenes.length - 1; }
      P.si = n; P.ki = 0; P.ended = false; $('#bdEnd').innerHTML = ''; this.clear(); this.save(); this.caption(P.scenes[n].t); this.ui(); if (was) this.play();
    },
    list() {
      const P = this.P; this.pause();
      const sh = U.sheet({ title: 'مشاهد الشرح', body: '<div class="group">' + P.scenes.map((s, i) => '<button class="row tap" data-sc="' + i + '"><span class="stepn' + (i < P.si ? ' done' : '') + '">' + (i < P.si ? '✓' : i + 1) + '</span><span class="tx"><b>' + esc(s.t) + '</b></span>' + (i === P.si ? '<span class="pill acc">هنا</span>' : '') + '</button>').join('') + '</div>', onOpen: a => $$('[data-sc]', a.body).forEach(b => b.onclick = () => { a.close(true); this.scene(+b.dataset.sc, true); }) });
      return sh;
    },
    save() { const P = this.P, d = D(); d.board = d.board || {}; d.board[P.lid] = Object.assign(d.board[P.lid] || {}, { si: P.si, t: Date.now() }); Store.save(); },
    finish() {
      const P = this.P; P.playing = false; P.tok++; P.ended = true; Voice.stop();
      const d = D(), l = App.LESSONS[P.lid], s = App.S(l.s); d.board[P.lid] = { si: 0, done: Date.now(), t: Date.now() };
      App.logDay({ min: Math.max(1, Math.round((Date.now() - P.t0) / 60000)) }); Store.save(true);
      const nq = App.questionsOf(l.s, P.lid).length;
      this.caption('خلصنا شرح «' + l.title + '» على البورد 🎉 دلوقتي جرّب نفسك في أسئلة الفصل.');
      $('#bdEnd').innerHTML = '<div class="card bd-end"><b>🎉 خلصنا الشرح</b><div class="note">قريت الملخص وشفت الشرح على البورد، فاضل تثبّت بالأسئلة.</div><div class="btns mt">' + (nq ? '<a class="btn" href="#quiz?l=' + P.lid + '&n=' + Math.min(10, nq) + '&go=1">' + icon('quiz') + 'امتحني في الفصل</a>' : '') + '<button class="btn tint" id="bdAgain">' + icon('reset') + 'عيد الشرح</button><a class="btn gray" href="#lesson/' + P.lid + '">الملخص</a></div></div>';
      $('#bdAgain').onclick = () => { this.scene(0, true); };
      const c = $('.bd-cap .char'); if (c) Char.act(c, 'cheer'); U.beep('done'); this.ui();
      $('#bdEnd').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
    leave() { if (this.P) { this.P.playing = false; this.P.tok++; this.P = null; } Voice.stop(); view_wake(false); }
  };
  let lock = null;
  function view_wake(on) { try { if (on && !lock && navigator.wakeLock) navigator.wakeLock.request('screen').then(l => { lock = l; l.addEventListener('release', () => { lock = null; }); }).catch(() => {}); else if (!on && lock) { lock.release(); lock = null; } } catch (e) {} }
  App.Board = Board; App.Board.render = render; App.Board.speakable = speakable; App.Board.Voice = Voice;
  Voice.init();

  Router.on('board', (view, r) => Board.open(view, r.args[0]));
  const oldLeave = App.beforeLeave;
  App.beforeLeave = (prev, next) => { if (prev && prev.name === 'board') Board.leave(); if (oldLeave) oldLeave(prev, next); };
  document.addEventListener('visibilitychange', () => { if (document.hidden && Board.P && Board.P.playing) Board.pause(); });
  addEventListener('pagehide', () => Voice.stop());
})();
