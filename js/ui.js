/* مذاكِر — طبقة الواجهة: أيقونات، تخزين وبروفايلات، توجيه، ورقة منزلقة، تنبيهات، الشخصية، عارض الملخصات */
(function () {
  'use strict';
  const E = self.Engine;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const AR = n => String(n);

  /* ---------- أيقونات (خطوط بسيطة على طريقة SF Symbols) ---------- */
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H19v-3"/><path d="M8 7h7M8 10.5h5"/>',
    cards: '<rect x="3" y="6" width="14" height="15" rx="2.5"/><path d="M7 3h11.5A2.5 2.5 0 0 1 21 5.5V17"/>',
    quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5 1c0 1.8-2.5 2.2-2.5 3.8"/><circle cx="12" cy="17.2" r=".6" fill="currentColor"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14h2M14 14h2M8 17.5h2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    chev: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
    pause: '<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    flame: '<path d="M12 3s5 4.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 1.5-4s.5 2 2 2.5C10 8 12 3 12 3z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    send: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4h6v3"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    down: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>',
    up: '<path d="M12 20V8M6 14l6-6 6 6M4 4h16"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8 7h8M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    megaphone: '<path d="M3 10v4a1 1 0 0 0 1 1h2l5 4V5L6 9H4a1 1 0 0 0-1 1z"/><path d="M15 9a3.5 3.5 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',
    scale: '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    note: '<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4M8.5 12h7M8.5 16h5"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    gearp: '<circle cx="12" cy="12" r="3"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    gift: '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8S10.5 3 8 4s0 4 4 4zM12 8s1.5-5 4-4 0 4-4 4z"/>',
    share: '<path d="M12 3v13M7 8l5-5 5 5M5 13v7h14v-7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
    wand: '<path d="m15 4 5 5L9 20l-5-5zM12 7l5 5M3 3l2 2M8 2v2M2 8h2"/>'
  };
  function icon(name, cls = '') { return '<svg class="i ' + cls + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[name] || P.info) + '</svg>'; }

  /* ---------- تخزين ---------- */
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { toast('المساحة خلصت — اعمل نسخة احتياطية وامسح حاجات قديمة'); return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const DEFAULT_DATA = () => ({
    v: 1, name: '', charName: 'سَنَد', created: Date.now(),
    settings: { goal: 30, quizCount: 10, timer: false, haptics: true, sound: true, pomo: 25, brk: 5, buddy: true, perDay: 3 },
    srs: {}, attempts: [], lessonsDone: {}, lessonsRead: {}, exams: [], sessions: [], days: {}, notes: [], custom: { cards: [], questions: [] }, chat: [], dismissed: {}
  });
  const Store = {
    profiles() { return LS.get('mz:profiles', []); },
    saveProfiles(p) { LS.set('mz:profiles', p); },
    current: null, data: null, _t: 0,
    open(id) {
      const raw = LS.get('mz:p:' + id, null);
      this.current = id; this.data = Object.assign(DEFAULT_DATA(), raw || {});
      this.data.settings = Object.assign(DEFAULT_DATA().settings, this.data.settings || {});
      this.data.custom = Object.assign({ cards: [], questions: [] }, this.data.custom || {});
      LS.set('mz:last', id);
      return this.data;
    },
    save(now) {
      if (!this.current) return;
      clearTimeout(this._t);
      const w = () => { const d = this.data; if (d.attempts.length > 4000) d.attempts = d.attempts.slice(-4000); if (d.chat.length > 80) d.chat = d.chat.slice(-80); LS.set('mz:p:' + this.current, d); };
      if (now) w(); else this._t = setTimeout(w, 250);
    },
    create(name, pinHash) {
      const id = E.uid('p'); const list = this.profiles();
      list.push({ id, name, pin: pinHash || null, created: Date.now(), hue: Math.floor(Math.random() * 360) });
      this.saveProfiles(list);
      const d = DEFAULT_DATA(); d.name = name; LS.set('mz:p:' + id, d);
      return id;
    },
    remove(id) { this.saveProfiles(this.profiles().filter(p => p.id !== id)); LS.del('mz:p:' + id); if (LS.get('mz:last') === id) LS.del('mz:last'); },
    profile() { return this.profiles().find(p => p.id === this.current); },
    updateProfile(patch) { const l = this.profiles(); const p = l.find(x => x.id === this.current); if (p) { Object.assign(p, patch); this.saveProfiles(l); } }
  };
  async function sha(s) {
    try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('mz|' + s)); return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''); }
    catch (e) { return 'h' + E.hashStr('mz|' + s); }
  }
  /* تفضيلات الجهاز (قبل الرسم) */
  const Pre = {
    get() { return LS.get('mz:pre', {}); },
    set(p) { const v = Object.assign(this.get(), p); LS.set('mz:pre', v); this.apply(v); },
    apply(v = this.get()) {
      const r = document.documentElement;
      if (v.theme === 'light' || v.theme === 'dark') r.dataset.theme = v.theme; else delete r.dataset.theme;
      if (v.accent) r.dataset.accent = v.accent; else delete r.dataset.accent;
      if (v.motion === 'reduce') r.dataset.motion = 'reduce'; else delete r.dataset.motion;
      r.style.setProperty('--fs', (v.fs || 16) + 'px');
      const dark = r.dataset.theme === 'dark' || (!r.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
      const m = document.querySelector('meta[name="theme-color"]:not([media])'); if (m) m.content = dark ? '#000000' : '#f2f2f7';
    }
  };

  /* ---------- اهتزاز وصوت ---------- */
  function haptic(kind = 'light') {
    if (!Store.data || !Store.data.settings.haptics) return;
    try { navigator.vibrate && navigator.vibrate(kind === 'success' ? [12, 40, 18] : kind === 'error' ? [30, 50, 30] : 8); } catch (e) {}
  }
  let AC = null;
  function beep(type = 'ok') {
    if (!Store.data || !Store.data.settings.sound) return;
    try {
      AC = AC || new (self.AudioContext || self.webkitAudioContext)();
      const notes = type === 'ok' ? [660, 880] : type === 'bad' ? [300, 220] : type === 'done' ? [523, 659, 784, 1046] : [880];
      notes.forEach((f, i) => {
        const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f;
        const t = AC.currentTime + i * 0.11; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        o.connect(g).connect(AC.destination); o.start(t); o.stop(t + 0.2);
      });
    } catch (e) {}
  }

  /* ---------- تنبيه ---------- */
  let toastT = 0;
  function toast(msg, ic) {
    let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.innerHTML = (ic ? icon(ic) : '') + '<span>' + esc(msg) + '</span>';
    requestAnimationFrame(() => t.classList.add('on'));
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600);
  }

  /* ---------- الورقة المنزلقة ---------- */
  const sheets = [];
  function sheet({ title = '', body = '', done = null, doneText = 'تم', cancelText = 'إلغاء', onOpen, onClose, wide } = {}) {
    const scrim = document.createElement('div'); scrim.className = 'scrim';
    const el = document.createElement('div'); el.className = 'sheet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', title);
    el.innerHTML = '<div class="grab"></div><div class="sh"><button class="x">' + esc(cancelText) + '</button><b>' + esc(title) + '</b><button class="ok strong">' + (done ? esc(doneText) : '') + '</button></div><div class="sb"></div>';
    const sb = el.querySelector('.sb');
    if (typeof body === 'string') sb.innerHTML = body; else sb.appendChild(body);
    document.body.append(scrim, el);
    const prevFocus = document.activeElement;
    const api = {
      el, body: sb,
      close(result) {
        el.classList.remove('on'); scrim.classList.remove('on');
        setTimeout(() => { el.remove(); scrim.remove(); }, 420);
        const i = sheets.indexOf(api); if (i >= 0) sheets.splice(i, 1);
        onClose && onClose(result);
        try { prevFocus && prevFocus.focus && prevFocus.focus({ preventScroll: true }); } catch (e) {}
      }
    };
    sheets.push(api);
    el.querySelector('.x').onclick = () => api.close(false);
    scrim.onclick = () => api.close(false);
    const ok = el.querySelector('.ok');
    if (done) ok.onclick = async () => { const r = await done(api); if (r !== false) api.close(true); }; else ok.style.visibility = 'hidden';
    // سحب لتحت للقفل
    let y0 = null, dy = 0;
    el.querySelector('.grab').parentElement.addEventListener('touchstart', e => { if (e.target.closest('.sb')) return; y0 = e.touches[0].clientY; el.style.transition = 'none'; }, { passive: true });
    el.addEventListener('touchmove', e => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); el.style.transform = 'translateY(' + dy + 'px)'; }, { passive: true });
    el.addEventListener('touchend', () => { if (y0 == null) return; el.style.transition = ''; el.style.transform = ''; if (dy > 110) api.close(false); y0 = null; dy = 0; });
    requestAnimationFrame(() => requestAnimationFrame(() => { scrim.classList.add('on'); el.classList.add('on'); onOpen && onOpen(api); const f = sb.querySelector('input,textarea,select'); if (f && matchMedia('(min-width:700px)').matches) f.focus(); }));
    return api;
  }
  function confirmBox(msg, { ok = 'تأكيد', danger = false } = {}) {
    return new Promise(res => {
      sheet({ title: 'متأكد؟', body: '<p style="font-size:16px;line-height:1.7;margin:6px 4px 18px">' + esc(msg) + '</p><button class="btn block ' + (danger ? 'danger' : '') + '" data-ok>' + esc(ok) + '</button>', onOpen: a => { a.body.querySelector('[data-ok]').onclick = () => { res(true); a.close(true); }; }, onClose: r => { if (!r) res(false); } });
    });
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheets.length) sheets[sheets.length - 1].close(false); });

  /* ---------- الشخصية ---------- */
  const Char = {
    html(cls = '', size) { return '<span class="char idle ' + cls + '"' + (size ? ' style="width:' + size + 'px"' : '') + ' aria-hidden="true"><img src="icons/char.png" alt="" draggable="false"><i class="eye l"></i><i class="eye r"></i></span>'; },
    act(el, mood) {
      if (!el) return;
      el.classList.remove('jump', 'nod', 'sad', 'happy'); void el.offsetWidth;
      if (mood === 'happy' || mood === 'cheer') { el.classList.add('jump', 'happy'); this.fx(el, mood === 'cheer' ? '🎉' : '✨'); setTimeout(() => el.classList.remove('happy'), 1400); }
      else if (mood === 'nod') el.classList.add('nod');
      else if (mood === 'sad') { el.classList.add('sad'); this.fx(el, '💧'); }
      else if (mood === 'think') { const t = document.createElement('span'); t.className = 'think'; t.textContent = '...'; el.appendChild(t); setTimeout(() => t.remove(), 1600); }
      else if (mood === 'sleep') this.fx(el, '💤');
      else if (mood === 'fire') { el.classList.add('jump'); this.fx(el, '🔥'); }
    },
    fx(el, s) { const f = document.createElement('span'); f.className = 'spark'; f.textContent = s; el.appendChild(f); setTimeout(() => f.remove(), 1300); },
    startBlinking() {
      const tick = () => {
        $$('.char').forEach(c => { if (Math.random() < 0.55 && !c.classList.contains('happy')) { c.classList.add('blink'); setTimeout(() => c.classList.remove('blink'), 140); } });
        setTimeout(tick, 2200 + Math.random() * 2600);
      };
      setTimeout(tick, 1800);
    }
  };
  /* الشخصية الطايرة: تعليق سريع */
  let buddyT = 0;
  function buddy(text, mood = 'happy', ms = 3200) {
    if (Store.data && Store.data.settings.buddy === false) return;
    let b = $('#buddy');
    if (!b) { b = document.createElement('div'); b.id = 'buddy'; b.className = 'buddy'; b.setAttribute('role', 'status'); document.body.appendChild(b); b.onclick = () => b.classList.remove('on'); }
    b.innerHTML = Char.html() + '<div class="bubble">' + text + '</div>';
    requestAnimationFrame(() => { b.classList.add('on'); Char.act(b.querySelector('.char'), mood); });
    clearTimeout(buddyT); buddyT = setTimeout(() => b.classList.remove('on'), ms);
  }

  /* ---------- عارض الملخصات (ماركداون مبسط) ---------- */
  function inline(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<kbd>$1</kbd>');
  }
  function md(src, hl) {
    const lines = String(src || '').split('\n'); let out = '', list = null, li = false, sub = false, tbl = null, pre = null;
    const closeSub = () => { if (sub) { out += '</ul>'; sub = false; } };
    const closeLi = () => { closeSub(); if (li) { out += '</li>'; li = false; } };
    const closeList = () => { closeLi(); if (list) { out += '</' + list + '>'; list = null; } };
    const closeTbl = () => { if (tbl) { out += '<div class="tblwrap"><table class="tbl">' + tbl.map(r => '<tr>' + r.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</table></div>'; tbl = null; } };
    for (let raw of lines) {
      const l = raw.replace(/\s+$/, '');
      if (l.trim().startsWith('```')) { if (pre != null) { out += '<pre>' + esc(pre.join('\n')) + '</pre>'; pre = null; } else { closeList(); closeTbl(); pre = []; } continue; }
      if (pre != null) { pre.push(l); continue; }
      const t = l.trim();
      if (t.startsWith('|')) { closeList(); (tbl || (tbl = [])).push(t.replace(/^\|/, '').replace(/\|$/, '').split('|').map(s => s.trim())); continue; } else closeTbl();
      if (!t) { continue; }
      let m;
      if ((m = t.match(/^(#{2,3})\s+(.*)/))) { closeList(); out += '<h' + m[1].length + '>' + inline(m[2]) + '</h' + m[1].length + '>'; continue; }
      const indented = /^\s{2,}/.test(l);
      if ((m = t.match(/^>\s?(.*)/))) { if (indented && li) { out += '<blockquote>' + inline(m[1]) + '</blockquote>'; continue; } closeList(); out += '<blockquote>' + inline(m[1]) + '</blockquote>'; continue; }
      if ((m = t.match(/^[-•]\s+(.*)/))) {
        if (indented && li) { if (!sub) { out += '<ul>'; sub = true; } out += '<li>' + inline(m[1]) + '</li>'; continue; }
        if (list !== 'ul') { closeList(); out += '<ul>'; list = 'ul'; } else closeLi();
        out += '<li>' + inline(m[1]); li = true; continue;
      }
      if ((m = t.match(/^(\d+)[.)]\s+(.*)/))) {
        if (list !== 'ol') { closeList(); out += '<ol start="' + m[1] + '">'; list = 'ol'; } else closeLi();
        out += '<li>' + inline(m[2]); li = true; continue;
      }
      closeList(); out += '<p>' + inline(t) + '</p>';
    }
    closeList(); closeTbl(); if (pre) out += '<pre>' + esc(pre.join('\n')) + '</pre>';
    if (hl) { const words = E.tokenize(hl).filter(w => w.length > 2); if (words.length) out = highlight(out, words); }
    return out;
  }
  function highlight(html, words) {
    // تمييز كلمات البحث في النص فقط (مش جوه الوسوم)
    return html.replace(/>([^<]+)</g, (all, txt) => {
      let t = txt;
      for (const w of words) {
        const re = new RegExp('(' + w.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).map(c => ({ 'ا': '[اأإآ]', 'ي': '[يى]', 'ه': '[هة]' }[c] || c)).join('[ً-ْ]*') + ')', 'g');
        t = t.replace(re, '<mark class="hl">$1</mark>');
      }
      return '>' + t + '<';
    });
  }

  /* ---------- التوجيه ---------- */
  const Router = {
    routes: {}, stack: [], cur: null,
    on(name, fn) { this.routes[name] = fn; },
    go(hash, { replace } = {}) { if (location.hash === '#' + hash) this.render(); else if (replace) { history.replaceState(null, '', '#' + hash); this.render(); } else location.hash = hash; },
    parse() { const h = decodeURIComponent(location.hash.slice(1) || 'home'); const [path, qs] = h.split('?'); const parts = path.split('/'); return { name: parts[0], args: parts.slice(1), q: Object.fromEntries(new URLSearchParams(qs || '')), raw: h }; },
    render() {
      const r = this.parse();
      const fn = this.routes[r.name] || this.routes.home;
      const prev = this.cur; this.cur = r;
      const depth = r.args.length + (r.name === 'home' ? 0 : 1), pdepth = prev ? prev.args.length + (prev.name === 'home' ? 0 : 1) : 0;
      const view = $('#view');
      const bd = $('#buddy'); if (bd && prev) bd.classList.remove('on');
      if (self.App && App.beforeLeave) App.beforeLeave(prev, r);
      view.className = 'view ' + (prev ? (depth >= pdepth ? 'enter' : 'back') : '');
      view.innerHTML = '';
      fn(view, r);
      if (!prev || prev.raw !== r.raw) window.scrollTo(0, 0);
      $$('[data-tab]').forEach(a => a.classList.toggle('on', a.dataset.tab === tabOf(r.name)));
      document.title = (view.dataset.title ? view.dataset.title + ' · ' : '') + 'مذاكِر';
      onScroll();
    }
  };
  function tabOf(n) { return ({ home: 'home', chat: 'home', notes: 'home', subjects: 'subjects', subject: 'subjects', lesson: 'subjects', tool: 'subjects', search: 'subjects', review: 'review', quiz: 'quiz', plan: 'plan', stats: 'plan', settings: 'settings' })[n] || 'home'; }
  addEventListener('hashchange', () => Router.render());
  function onScroll() { const n = $('.nav'); if (n) n.classList.toggle('scrolled', scrollY > 30); }
  addEventListener('scroll', onScroll, { passive: true });

  /** شريط العنوان + العنوان الكبير */
  function header(view, title, { back, right, sub } = {}) {
    view.dataset.title = title;
    const nav = document.createElement('div'); nav.className = 'nav';
    nav.innerHTML = (back ? '<button class="btn-nav" data-back>' + icon('back', 'flip') + '<span>' + esc(back.label || 'رجوع') + '</span></button>' : '<span class="sp"></span>') + '<div class="t">' + esc(title) + '</div>' + (right || '<span class="sp"></span>');
    if (back) nav.querySelector('[data-back]').onclick = () => { if (back.to) Router.go(back.to); else history.length > 1 ? history.back() : Router.go('home'); };
    view.appendChild(nav);
    const h = document.createElement('h1'); h.className = 'big'; h.textContent = title; view.appendChild(h);
    if (sub) { const s = document.createElement('p'); s.className = 'sub'; s.innerHTML = sub; view.appendChild(s); }
    return nav;
  }
  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function frag(html) { const t = document.createElement('template'); t.innerHTML = html; return t.content; }

  self.UI = { $, $$, esc, icon, LS, Store, Pre, sha, haptic, beep, toast, sheet, confirmBox, Char, buddy, md, Router, header, el, frag, AR };
})();
