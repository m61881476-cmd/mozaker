/* مذاكِر — الجدول والمؤقت، التقدم، الإعدادات، البروفايلات والقفل، والتشغيل */
(function () {
  'use strict';
  const E = self.Engine, U = self.UI;
  const { $, $$, esc, icon, Store, Pre, Router, header, sheet, toast, Char, buddy, haptic, beep, confirmBox, sha } = U;
  const D = () => Store.data;
  const now = () => Date.now();

  /* ---------- ورقة الامتحان ---------- */
  App.examSheet = (ex = {}) => {
    const isEdit = !!ex.id, SUBJ = App.SUBJ;
    const kinds = ['امتحان', 'ميدتيرم', 'فاينال', 'كويز', 'شفوي', 'سكشن'];
    const body = U.el('<div><div class="group" style="margin-bottom:14px">'
      + '<label class="row noicon"><span class="tx"><b>المادة</b></span><select id="es">' + SUBJ.map(s => '<option value="' + s.id + '"' + (s.id === ex.subject ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('') + '</select></label>'
      + '<label class="row noicon"><span class="tx"><b>النوع</b></span><select id="ek">' + kinds.map(k => '<option' + (k === (ex.kind || 'امتحان') ? ' selected' : '') + '>' + k + '</option>').join('') + '</select></label>'
      + '<label class="row noicon"><span class="tx"><b>اليوم</b></span><input type="date" id="ed" value="' + esc(ex.date || E.ymd(E.addDays(new Date(), 7))) + '" min="' + E.ymd(new Date()) + '"></label>'
      + '<label class="row noicon"><span class="tx"><b>الساعة</b></span><input type="time" id="et" value="' + esc(ex.time || '') + '"></label></div>'
      + '<div class="chips" style="margin:0 0 12px" id="eq">' + [['13:15', 'مجموعة 1 (1:15)'], ['14:30', 'مجموعة 2 (2:30)'], ['09:00', '9 الصبح'], ['11:00', '11']].map(([v, t]) => '<button type="button" class="chip" data-t="' + v + '">' + t + '</button>').join('') + '</div>'
      + '<label class="field"><span>ملاحظة (مقرر الامتحان، المكان…)</span><textarea class="input" id="en" placeholder="مثال: من غير محاضرة 3/11">' + esc(ex.note || '') + '</textarea></label>'
      + (isEdit ? '<button class="btn block danger" id="edel">' + icon('trash') + 'امسح الامتحان</button>' : '') + '</div>');
    $$('[data-t]', body).forEach(b => b.onclick = () => { body.querySelector('#et').value = b.dataset.t; });
    const sh = sheet({ title: isEdit ? 'تعديل امتحان' : 'امتحان جديد', body, doneText: 'حفظ', done: () => {
      const date = body.querySelector('#ed').value; if (!date) { toast('اختار اليوم'); return false; }
      const o = { id: ex.id || E.uid('e'), subject: body.querySelector('#es').value, kind: body.querySelector('#ek').value, date, time: body.querySelector('#et').value, note: body.querySelector('#en').value.trim() };
      const d = D(); if (isEdit) d.exams = d.exams.map(x => x.id === o.id ? o : x); else d.exams.push(o);
      Store.save(); toast('اتسجل، والخطة اتحدثت', 'check'); haptic('success'); Router.render();
    } });
    const del = body.querySelector('#edel'); if (del) del.onclick = () => { const d = D(); d.exams = d.exams.filter(x => x.id !== ex.id); Store.save(); sh.close(); Router.render(); };
  };

  /* ---------- الجدول ---------- */
  Router.on('plan', (view, r) => {
    const tab = r.q.tab || 'plan';
    header(view, 'الجدول', { right: tab === 'exams' ? '<button class="btn-nav" id="addE" aria-label="امتحان جديد">' + icon('plus') + '</button>' : '' });
    view.insertAdjacentHTML('beforeend', '<div class="seg">' + [['plan', 'خطة المذاكرة'], ['exams', 'الامتحانات'], ['timer', 'مؤقت التركيز']].map(([k, t]) => '<button data-tb="' + k + '" class="' + (k === tab ? 'on' : '') + '">' + t + '</button>').join('') + '</div><div id="pb"></div>');
    $$('[data-tb]').forEach(b => b.onclick = () => Router.go('plan?tab=' + b.dataset.tb, { replace: true }));
    const pb = $('#pb');
    if (tab === 'exams') {
      const a = $('#addE'); if (a) a.onclick = () => App.examSheet();
      const all = D().exams.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)), t0 = E.startOfDay(new Date());
      const up = all.filter(e => new Date(e.date) >= t0), past = all.filter(e => new Date(e.date) < t0);
      pb.innerHTML = (up.length ? '<div class="group">' + up.map(examRow).join('') + '</div>' : '<div class="empty">' + Char.html('', 80) + '<p>مفيش امتحانات متسجلة. ضيفها وأنا أوزعلك المذاكرة على الأيام اللي فاضلة.</p></div>')
        + '<button class="btn block" id="addE2">' + icon('plus') + 'ضيف امتحان</button><p class="group-f mt" style="margin-top:10px">أو قولّي في المحادثة: «امتحان الإحصاء يوم الاتنين الساعة 1:15».</p>'
        + (past.length ? '<div class="group-h">امتحانات فاتت</div><div class="group">' + past.map(examRow).join('') + '</div>' : '');
      $('#addE2').onclick = () => App.examSheet();
      $$('[data-ex]', pb).forEach(b => b.onclick = () => App.examSheet(D().exams.find(x => x.id === b.dataset.ex)));
    } else if (tab === 'timer') {
      Pomo.render(pb, r.q);
    } else {
      const P = App.plan(), days = Object.keys(P).sort(), due = App.dueCards().length;
      if (!App.upcomingExams().length) {
        pb.innerHTML = '<div class="empty">' + Char.html('', 86) + '<p style="color:var(--fg)"><b>سجل مواعيد امتحاناتك الأول</b></p><p>وأنا هوزع الدروس اللي لسه ماخلصتهاش على الأيام اللي قبل كل امتحان، وأسيب اليوم الأخير مراجعة شاملة.</p><button class="btn" id="go">' + icon('plus') + 'ضيف امتحان</button></div>';
        $('#go').onclick = () => App.examSheet();
      } else {
        let html = '<p class="note" style="margin:-4px 4px 10px">الخطة بتتحدث لوحدها كل ما تقفل درس أو تحل أسئلة. الدرس بيتشال من الخطة لما توصل فيه 80%.</p>';
        if (due) html += '<div class="group"><a class="row tap" href="#review"><span class="ic bg-blue">' + icon('cards') + '</span><span class="tx"><b>كل يوم: البطاقات المستحقة</b><small>' + due + ' مستحقة النهارده</small></span>' + icon('chev', 'chev') + '</a></div>';
        days.slice(0, 14).forEach(k => {
          const d = new Date(k + 'T00:00:00'), items = P[k];
          html += '<div class="day-h"><b>' + esc(E.prettyDate(d)) + '</b><small>' + items.length + ' مهمة</small></div><div class="group">' + items.map(it => {
            const s = App.S(it.subject);
            if (it.type === 'lesson') { const l = App.LESSONS[it.lesson]; return '<a class="row tap" href="#lesson/' + l.id + '">' + App.subjIcon(s) + '<span class="tx"><b>' + esc(l.title) + '</b><small>' + esc(s.short) + ' · ' + Math.round(App.lessonProgress(l.id) * 100) + '%</small></span>' + icon('chev', 'chev') + '</a>'; }
            return '<a class="row tap" href="#quiz?s=' + s.id + '&n=20&mode=exam"><span class="ic bg-red">' + icon('target') + '</span><span class="tx"><b>مراجعة شاملة + امتحان تجريبي</b><small>' + esc(s.name) + '</small></span>' + icon('chev', 'chev') + '</a>';
          }).join('') + '</div>';
        });
        html += '<div class="group-h">عدد الدروس في اليوم</div><div class="seg">' + [2, 3, 4, 5].map(n => '<button data-pd="' + n + '" class="' + (n === (D().settings.perDay || 3) ? 'on' : '') + '">' + n + '</button>').join('') + '</div>';
        pb.innerHTML = html;
        $$('[data-pd]', pb).forEach(b => b.onclick = () => { D().settings.perDay = +b.dataset.pd; Store.save(); Router.render(); });
      }
    }
  });
  function examRow(e) {
    const s = App.S(e.subject), left = E.daysBetween(new Date(), new Date(e.date));
    return '<button class="row" data-ex="' + e.id + '"><span class="countdown"><span class="d" style="width:52px;height:52px"><b style="font-size:19px">' + (left < 0 ? '✓' : left) + '</b><small>' + (left < 0 ? 'فات' : left === 0 ? 'النهارده' : 'يوم') + '</small></span></span><span class="tx"><b>' + esc((e.kind || 'امتحان') + ' ' + (s ? s.name : '')) + '</b><small>' + esc(E.prettyDate(e.date)) + (e.time ? ' — ' + esc(e.time) : '') + (e.note ? '<br>' + esc(e.note) : '') + '</small></span>' + icon('edit', 'c-muted') + '</button>';
  }

  /* ---------- مؤقت التركيز (بومودورو) ---------- */
  const Pomo = {
    st: U.LS.get('mz:pomo', null), // {end, total, kind:'focus'|'break', subject, paused, left}
    save() { U.LS.set('mz:pomo', this.st); },
    left() { if (!this.st) return 0; return this.st.paused ? this.st.left : Math.max(0, Math.round((this.st.end - now()) / 1000)); },
    start(min, kind, subject) { this.st = { end: now() + min * 60000, total: min * 60, kind, subject: subject || null, paused: false }; this.save(); this.ensureTick(); Pomo.askNotify(); },
    pause() { if (!this.st || this.st.paused) return; this.st.left = this.left(); this.st.paused = true; this.save(); },
    resume() { if (!this.st || !this.st.paused) return; this.st.end = now() + this.st.left * 1000; this.st.paused = false; this.save(); this.ensureTick(); },
    stop(record = true) {
      if (this.st && this.st.kind === 'focus' && record) { const done = Math.round((this.st.total - this.left()) / 60); if (done >= 1) { App.logDay({ min: done }); D().sessions.push({ s: this.st.subject, m: done, t: now() }); Store.save(); toast('اتسجلت ' + done + ' دقيقة', 'clock'); } }
      this.st = null; this.save();
    },
    complete() {
      const st = this.st; if (!st) return;
      if (st.kind === 'focus') { App.logDay({ min: Math.round(st.total / 60) }); D().sessions.push({ s: st.subject, m: Math.round(st.total / 60), t: now() }); Store.save(); }
      this.st = null; this.save(); beep('done'); haptic('success');
      const msg = st.kind === 'focus' ? 'خلصت جلسة تركيز 👏 خد بريك ' + (D().settings.brk || 5) + ' دقايق.' : 'البريك خلص. يلا نرجع 💪';
      buddy(msg, 'cheer', 5000); this.notify(msg);
      if (Router.cur && Router.cur.name === 'plan') Router.render();
    },
    tm: 0,
    ensureTick() { clearInterval(this.tm); this.tm = setInterval(() => { if (!this.st) return clearInterval(this.tm); if (!this.st.paused && this.left() <= 0) { clearInterval(this.tm); this.complete(); return; } this.paint(); }, 500); },
    askNotify() { try { if ('Notification' in self && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {} },
    async notify(body) {
      try {
        if (!('Notification' in self) || Notification.permission !== 'granted') return;
        const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
        if (reg) reg.showNotification('مذاكِر', { body, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: 'pomo' }); else new Notification('مذاكِر', { body });
      } catch (e) {}
    },
    paint() {
      const box = $('#pomo'); if (!box) return;
      const st = this.st, total = st ? st.total : (D().settings.pomo || 25) * 60, left = st ? this.left() : total;
      const C = 2 * Math.PI * 54; const prg = box.querySelector('.prg');
      prg.style.strokeDashoffset = String(C * (1 - left / total));
      box.querySelector('.tm b').textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
      document.title = st && !st.paused ? (Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') + ' · مذاكِر') : 'الجدول · مذاكِر';
    },
    render(pb, q) {
      const d = D();
      if (q.auto && !this.st) { if (q.brk) this.start(+q.brk, 'break'); else this.start(+q.min || d.settings.pomo, 'focus', q.s); history.replaceState(null, '', '#plan?tab=timer'); }
      const st = this.st, C = 2 * Math.PI * 54;
      const subj = st ? st.subject : (q.s || '');
      pb.innerHTML = '<div class="card"><div class="pomo ' + (st && st.kind === 'break' ? 'brk' : '') + '" id="pomo"><div class="dial"><svg viewBox="0 0 120 120"><circle class="trk" cx="60" cy="60" r="54"/><circle class="prg" cx="60" cy="60" r="54" stroke-dasharray="' + C + '" stroke-dashoffset="0"/></svg><div class="tm"><b>25:00</b><small>' + (st ? (st.kind === 'break' ? 'بريك' : 'تركيز') + (st.paused ? ' (متوقف)' : '') : 'جاهز') + '</small></div></div>'
        + '<div class="btns" style="width:100%">' + (st ? (st.paused ? '<button class="btn" id="pr">' + icon('play') + 'كمّل</button>' : '<button class="btn" id="pp">' + icon('pause') + 'وقف</button>') + '<button class="btn gray" id="ps">' + icon('x') + 'إنهاء</button>' : '<button class="btn" id="pg">' + icon('play') + 'ابدأ ' + (d.settings.pomo || 25) + ' دقيقة</button><button class="btn tint" id="pb5">بريك ' + (d.settings.brk || 5) + '</button>') + '</div></div></div>'
        + (st ? '' : '<div class="group-h">بتذاكر إيه؟</div><div class="seg" id="psub"><button data-ps="" class="' + (!subj ? 'on' : '') + '">عام</button>' + App.SUBJ.map(s => '<button data-ps="' + s.id + '" class="' + (subj === s.id ? 'on' : '') + '">' + esc(s.short) + '</button>').join('') + '</div>'
          + '<div class="group-h">مدة الجلسة</div><div class="seg">' + [15, 25, 30, 45, 50].map(m => '<button data-pm="' + m + '" class="' + (m === d.settings.pomo ? 'on' : '') + '">' + m + ' د</button>').join('') + '</div>')
        + '<p class="note mt">المؤقت شغال حتى لو قفلت الشاشة أو رحت لصفحة تانية، والدقايق بتتسجل في تقدمك. ' + ('Notification' in self ? 'هبعتلك إشعار لما الجلسة تخلص لو سمحت بالإشعارات.' : '') + '</p>'
        + todaySessions();
      let chosen = subj;
      $$('[data-ps]', pb).forEach(b => b.onclick = () => { chosen = b.dataset.ps; $$('[data-ps]', pb).forEach(x => x.classList.toggle('on', x === b)); });
      $$('[data-pm]', pb).forEach(b => b.onclick = () => { d.settings.pomo = +b.dataset.pm; Store.save(); Router.render(); });
      const on = (id, fn) => { const b = $('#' + id); if (b) b.onclick = () => { fn(); haptic(); Router.render(); }; };
      on('pg', () => this.start(d.settings.pomo || 25, 'focus', chosen)); on('pb5', () => this.start(d.settings.brk || 5, 'break'));
      on('pp', () => this.pause()); on('pr', () => this.resume()); on('ps', () => this.stop());
      this.paint(); if (st) this.ensureTick();
    }
  };
  function todaySessions() {
    const t0 = E.startOfDay(new Date()).getTime(), ss = D().sessions.filter(s => s.t >= t0);
    if (!ss.length) return '';
    return '<div class="group-h">جلسات النهارده</div><div class="group">' + ss.map(s => '<div class="row noicon"><span class="tx"><b>' + s.m + ' دقيقة</b><small>' + (s.s ? esc(App.S(s.s).name) : 'عام') + ' · ' + new Date(s.t).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' }) + '</small></span></div>').join('') + '</div>';
  }
  App.Pomo = Pomo;

  /* ---------- التقدم ---------- */
  Router.on('stats', view => {
    header(view, 'تقدمي', { back: { to: 'home', label: 'الرئيسية' } });
    const d = D(), days = [];
    for (let i = 13; i >= 0; i--) { const k = E.ymd(E.addDays(new Date(), -i)); days.push({ k, v: (d.days[k] || {}).min || 0, d: E.addDays(new Date(), -i) }); }
    const mx = Math.max(d.settings.goal || 30, ...days.map(x => x.v));
    const tot = d.attempts.length, ok = d.attempts.filter(a => a.ok).length, cardsSeen = Object.keys(d.srs).length, mins = Object.values(d.days).reduce((a, x) => a + (x.min || 0), 0);
    let html = '<div class="stats3"><div class="stat">' + icon('flame', 'c-orange') + '<span class="n">' + App.streakNow() + '</span><span class="l">سلسلة الأيام</span></div><div class="stat">' + icon('clock', 'c-green') + '<span class="n">' + mins + '</span><span class="l">دقيقة مذاكرة</span></div><div class="stat">' + icon('target', 'c-blue') + '<span class="n">' + (tot ? Math.round(ok / tot * 100) : 0) + '%</span><span class="l">صح من ' + tot + ' سؤال</span></div></div>';
    html += '<div class="group-h">دقايق المذاكرة (آخر أسبوعين)</div><div class="card"><div class="bars">' + days.map(x => '<div><i style="height:' + Math.round(x.v / mx * 100) + '%;' + (x.v >= (d.settings.goal || 30) ? 'background:var(--green)' : '') + '" title="' + x.v + ' دقيقة"></i><small>' + x.d.getDate() + '</small></div>').join('') + '</div><p class="note center">الأخضر = حققت هدفك اليومي (' + (d.settings.goal || 30) + ' دقيقة)</p></div>';
    html += '<div class="group-h">المواد</div><div class="group">' + App.SUBJ.map(s => { const p = App.subjectProgress(s.id), qs = d.attempts.filter(a => a.s === s.id), okq = qs.filter(a => a.ok).length; return '<a class="row tap" href="#subject/' + s.id + '">' + App.ring(p, 40, 'var(--' + s.color + ')') + '<span class="tx"><b>' + esc(s.name) + '</b><small>' + Object.keys(d.srs).filter(k => k.startsWith(s.id + ':')).length + '/' + App.cardsOf(s.id).length + ' بطاقة · ' + (qs.length ? 'صح ' + Math.round(okq / qs.length * 100) + '% من ' + qs.length : 'لسه ماحلتش أسئلة') + '</small></span>' + icon('chev', 'chev') + '</a>'; }).join('') + '</div>';
    const w = E.weakness(d.attempts.map(a => ({ subject: a.s, lesson: a.l, ok: a.ok, t: a.t })), { min: 2 }).slice(0, 6);
    html += '<div class="group-h">نقط الضعف</div>' + (w.length ? '<div class="group">' + w.map(x => { const l = App.LESSONS[x.lesson]; if (!l) return ''; return '<a class="row tap" href="#quiz?l=' + l.id + '&n=10"><span class="ic bg-' + (x.score < 0.5 ? 'red' : x.score < 0.7 ? 'orange' : 'green') + '">' + icon('target') + '</span><span class="tx"><b>' + esc(l.title) + '</b><small>' + esc(App.S(l.s).short) + ' · صح ' + x.ok + ' من ' + x.n + '</small></span><span class="v">' + Math.round(x.acc * 100) + '%</span></a>'; }).join('') + '</div><p class="group-f">مرتبة من الأضعف. اضغط على أي درس وأنا أمتحنك فيه.</p>' : '<div class="card note">حل أسئلة أكتر وأنا أطلعلك بالظبط بتغلط في أنهي دروس.</div>');
    html += '<div class="group-h">البطاقات</div><div class="card"><div class="note">شفت ' + cardsSeen + ' بطاقة من ' + App.allCards().length + '. البطاقات اللي مراجعتها جاية بعد 3 أسابيع أو أكتر بتتحسب «محفوظة».</div><div class="bar mt"><i style="width:' + Math.round(App.allCards().reduce((s, c) => s + E.mastery(d.srs[c.id]), 0) / App.allCards().length * 100) + '%"></i></div></div>';
    view.insertAdjacentHTML('beforeend', html);
  });

  /* ---------- الإعدادات ---------- */
  Router.on('settings', view => {
    const d = D(), pre = Pre.get(), prof = Store.profile() || {};
    header(view, 'الإعدادات', { back: { to: 'home', label: 'الرئيسية' } });
    const sw = (id, on) => '<span class="switch"><input type="checkbox" id="' + id + '" ' + (on ? 'checked' : '') + '><span></span></span>';
    let html = '<div class="group"><button class="row" id="sName"><span class="ic" style="background:linear-gradient(135deg,var(--accent),var(--accent-2));border-radius:50%;font-weight:700">' + esc((d.name || '؟').slice(0, 1)) + '</span><span class="tx"><b>' + esc(d.name || 'من غير اسم') + '</b><small>اضغط عشان تغير اسمك</small></span>' + icon('chev', 'chev') + '</button>'
      + '<button class="row" id="sChar"><span class="ic bg-gray" style="padding:2px;background:var(--fill)!important"><img src="icons/char.png" alt="" style="height:26px"></span><span class="tx"><b>اسم الشخصية</b></span><span class="v">' + esc(d.charName) + '</span>' + icon('chev', 'chev') + '</button></div>';
    html += '<div class="group-h">المذاكرة</div><div class="group">'
      + '<label class="row"><span class="ic bg-green">' + icon('target') + '</span><span class="tx"><b>الهدف اليومي (دقيقة)</b></span><select id="sGoal">' + [15, 20, 30, 45, 60, 90, 120].map(v => '<option' + (v === d.settings.goal ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></label>'
      + '<label class="row"><span class="ic bg-blue">' + icon('quiz') + '</span><span class="tx"><b>أسئلة الامتحان الافتراضية</b></span><select id="sQc">' + [5, 10, 20, 30].map(v => '<option' + (v === d.settings.quizCount ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></label>'
      + '<label class="row"><span class="ic bg-red">' + icon('timer') + '</span><span class="tx"><b>الامتحان بوقت افتراضيًا</b></span>' + sw('sTimer', d.settings.timer) + '</label>'
      + '<label class="row"><span class="ic bg-orange">' + icon('clock') + '</span><span class="tx"><b>مدة البريك</b></span><select id="sBrk">' + [3, 5, 10, 15].map(v => '<option' + (v === d.settings.brk ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></label></div>';
    html += '<div class="group-h">الشكل</div><div class="group"><div class="row noicon" style="display:block"><div class="seg" style="margin:4px 0">' + [['system', 'تلقائي'], ['light', 'فاتح'], ['dark', 'غامق']].map(([k, t]) => '<button data-th="' + k + '" class="' + ((pre.theme || 'system') === k ? 'on' : '') + '">' + t + '</button>').join('') + '</div></div>'
      + '<div class="row noicon"><span class="tx"><b>اللون</b></span><span style="display:flex;gap:10px">' + [['', '#0a84ff'], ['purple', '#8e44ec'], ['green', '#30a14e'], ['orange', '#f97316'], ['pink', '#e11d64'], ['teal', '#0e9aa7']].map(([k, c]) => '<button data-ac="' + k + '" aria-label="لون" style="width:28px;height:28px;border-radius:50%;background:' + c + ';box-shadow:' + ((pre.accent || '') === k ? '0 0 0 2px var(--bg2),0 0 0 4px ' + c : 'none') + '"></button>').join('') + '</span></div>'
      + '<label class="row noicon"><span class="tx"><b>حجم الخط</b></span><select id="sFs">' + [[14, 'صغير'], [16, 'عادي'], [17, 'كبير'], [19, 'أكبر']].map(([v, t]) => '<option value="' + v + '"' + (v === (pre.fs || 16) ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></label>'
      + '<label class="row noicon"><span class="tx"><b>تقليل الحركة</b></span>' + sw('sMotion', pre.motion === 'reduce') + '</label>'
      + '<label class="row noicon"><span class="tx"><b>الأصوات</b></span>' + sw('sSound', d.settings.sound) + '</label>'
      + '<label class="row noicon"><span class="tx"><b>الاهتزاز</b></span>' + sw('sHap', d.settings.haptics) + '</label>'
      + '<label class="row noicon"><span class="tx"><b>تعليقات ' + esc(d.charName) + ' الطايرة</b></span>' + sw('sBuddy', d.settings.buddy !== false) + '</label></div>';
    html += '<div class="group-h">الحساب والخصوصية</div><div class="group">'
      + '<button class="row" id="sPin"><span class="ic bg-indigo">' + icon('lock') + '</span><span class="tx"><b>' + (prof.pin ? 'تغيير الرقم السري' : 'رقم سري للبروفايل') + '</b><small>' + (prof.pin ? 'البروفايل مقفول برقم سري' : 'عشان محدش غيرك يفتح مذاكرتك') + '</small></span>' + icon('chev', 'chev') + '</button>'
      + (prof.pin ? '<button class="row" id="sPinX"><span class="ic bg-gray">' + icon('lock') + '</span><span class="tx"><b>شيل الرقم السري</b></span></button>' : '')
      + '<button class="row" id="sSwitch"><span class="ic bg-teal">' + icon('users') + '</span><span class="tx"><b>تبديل البروفايل / إضافة شخص</b><small>كل واحد بياناته لوحده على نفس الجهاز</small></span>' + icon('chev', 'chev') + '</button>'
      + (prof.pin ? '<button class="row" id="sLock"><span class="ic bg-gray">' + icon('lock') + '</span><span class="tx"><b>اقفل دلوقتي</b></span></button>' : '') + '</div>';
    html += '<div class="group-h">البيانات</div><div class="group">'
      + '<button class="row" id="sExp"><span class="ic bg-green">' + icon('down') + '</span><span class="tx"><b>نسخة احتياطية</b><small>ملف فيه كل تقدمك تقدر ترجعه على أي جهاز</small></span></button>'
      + '<button class="row" id="sImp"><span class="ic bg-blue">' + icon('up') + '</span><span class="tx"><b>استرجاع نسخة أو استيراد بطاقات وأسئلة</b><small>من ملف .json (منك أو من صاحبك)</small></span></button>'
      + '<button class="row" id="sShare"><span class="ic bg-purple">' + icon('share') + '</span><span class="tx"><b>شارك بطاقاتك وأسئلتك</b><small>ملف فيه اللي ضفته بس (من غير تقدمك)</small></span></button>'
      + '<button class="row" id="sReset"><span class="ic bg-orange">' + icon('reset') + '</span><span class="tx"><b>صفّر التقدم</b><small>البطاقات والأسئلة والإحصائيات (الامتحانات والملاحظات بتفضل)</small></span></button>'
      + '<button class="row" id="sDel"><span class="ic bg-red">' + icon('trash') + '</span><span class="tx" style="color:var(--red)"><b>امسح البروفايل ده خالص</b></span></button></div><input type="file" id="fileIn" accept=".json,application/json" hidden>';
    html += '<div class="group-h">عن البرنامج</div><div class="group"><div class="row noicon"><span class="tx"><b>مذاكِر ' + App.VERSION + '</b><small>بيشتغل من غير نت وكل بياناتك على جهازك بس. المحتوى مبني على ملفات المنهج اللي في درايف الدفعة.</small></span></div>'
      + '<button class="row noicon" id="sInstall" ' + (App.installEvt ? '' : 'hidden') + '><span class="tx"><b style="color:var(--accent)">ثبّت البرنامج على الجهاز</b></span></button>'
      + '<button class="row noicon" id="sUpd"><span class="tx"><b style="color:var(--accent)">دوّر على تحديث</b></span></button></div>';
    view.insertAdjacentHTML('beforeend', html);
    const set = (k, v) => { d.settings[k] = v; Store.save(); };
    $('#sGoal').onchange = e => set('goal', +e.target.value); $('#sQc').onchange = e => set('quizCount', +e.target.value); $('#sBrk').onchange = e => set('brk', +e.target.value);
    $('#sTimer').onchange = e => set('timer', e.target.checked); $('#sSound').onchange = e => set('sound', e.target.checked); $('#sHap').onchange = e => set('haptics', e.target.checked); $('#sBuddy').onchange = e => set('buddy', e.target.checked);
    $$('[data-th]').forEach(b => b.onclick = () => { Pre.set({ theme: b.dataset.th === 'system' ? null : b.dataset.th }); Router.render(); });
    $$('[data-ac]').forEach(b => b.onclick = () => { Pre.set({ accent: b.dataset.ac || null }); Router.render(); });
    $('#sFs').onchange = e => Pre.set({ fs: +e.target.value }); $('#sMotion').onchange = e => Pre.set({ motion: e.target.checked ? 'reduce' : null });
    $('#sName').onclick = () => textSheet('اسمك', d.name, v => { d.name = v; Store.updateProfile({ name: v }); Store.save(); });
    $('#sChar').onclick = () => textSheet('اسم الشخصية', d.charName, v => { d.charName = v; Store.save(); });
    $('#sPin').onclick = () => Lock.setPin();
    const px = $('#sPinX'); if (px) px.onclick = async () => { if (await confirmBox('تشيل الرقم السري؟ أي حد معاه الجهاز هيقدر يفتح البروفايل.', { ok: 'شيله' })) { Store.updateProfile({ pin: null }); Router.render(); } };
    $('#sSwitch').onclick = () => Lock.show(true);
    const lk = $('#sLock'); if (lk) lk.onclick = () => Lock.show();
    $('#sExp').onclick = () => download('مذاكر-' + (d.name || 'نسخة') + '-' + E.ymd(new Date()) + '.json', { app: 'mozaker', kind: 'backup', v: 1, at: new Date().toISOString(), data: d });
    $('#sShare').onclick = () => { if (!d.custom.cards.length && !d.custom.questions.length) return toast('لسه ماضفتش بطاقات أو أسئلة'); download('بطاقات-وأسئلة-' + (d.name || '') + '.json', { app: 'mozaker', kind: 'pack', v: 1, by: d.name, cards: d.custom.cards, questions: d.custom.questions }); };
    $('#sImp').onclick = () => $('#fileIn').click();
    $('#fileIn').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { importFile(JSON.parse(await f.text())); } catch (err) { toast('الملف ده مش مفهوم'); } e.target.value = ''; };
    $('#sReset').onclick = async () => { if (await confirmBox('هتتمسح حالة البطاقات وإجاباتك وإحصائياتك. متأكد؟', { ok: 'صفّر', danger: true })) { Object.assign(d, { srs: {}, attempts: [], lessonsDone: {}, lessonsRead: {}, days: {}, sessions: [] }); Store.save(true); toast('اتصفّر'); Router.go('home'); } };
    $('#sDel').onclick = async () => { if (await confirmBox('هيتمسح البروفايل «' + (d.name || '') + '» بكل بياناته من الجهاز ده. مفيش رجوع (إلا لو عندك نسخة احتياطية).', { ok: 'امسح نهائيًا', danger: true })) { Store.remove(Store.current); Store.current = null; Store.data = null; Lock.show(true); } };
    const ins = $('#sInstall'); if (ins) ins.onclick = async () => { if (!App.installEvt) return; App.installEvt.prompt(); await App.installEvt.userChoice; App.installEvt = null; ins.hidden = true; };
    $('#sUpd').onclick = async () => { try { const r = await navigator.serviceWorker.getRegistration(); if (r) { await r.update(); toast(r.waiting || r.installing ? 'فيه تحديث، هيتطبق دلوقتي' : 'إنت على آخر نسخة', 'check'); if (r.waiting) r.waiting.postMessage({ type: 'SKIP_WAITING' }); } else toast('إنت على آخر نسخة'); } catch (e) { toast('مش قادر أوصل للنت دلوقتي'); } };
  });
  function textSheet(title, val, cb) {
    const body = U.el('<div><input class="input" id="tv" value="' + esc(val || '') + '" maxlength="30"></div>');
    sheet({ title, body, doneText: 'حفظ', done: () => { const v = body.querySelector('#tv').value.trim(); if (!v) return false; cb(v); Router.render(); } });
  }
  function download(name, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('الملف اتنزل', 'check');
  }
  async function importFile(o) {
    const d = D();
    if (o && o.app === 'mozaker' && o.kind === 'backup' && o.data) {
      if (!await confirmBox('هترجع النسخة دي مكان بيانات البروفايل الحالي. متأكد؟', { ok: 'استرجع' })) return;
      Store.data = Object.assign(d, o.data); Store.save(true); toast('النسخة رجعت', 'check'); Router.go('home'); return;
    }
    if (o && o.app === 'mozaker' && o.kind === 'pack') {
      const have = new Set(d.custom.cards.map(c => c.front + '|' + c.back)), haveQ = new Set(d.custom.questions.map(q => q.q));
      let nc = 0, nq = 0;
      (o.cards || []).forEach(c => { if (c && c.front && c.back && !have.has(c.front + '|' + c.back)) { d.custom.cards.push(Object.assign({}, c, { id: E.uid('cc') })); nc++; } });
      (o.questions || []).forEach(q => { if (q && q.q && !haveQ.has(q.q)) { d.custom.questions.push(Object.assign({}, q, { id: E.uid('cq') })); nq++; } });
      Store.save(true); toast('اتضاف ' + nc + ' بطاقة و ' + nq + ' سؤال' + (o.by ? ' من ' + o.by : ''), 'check'); return;
    }
    toast('الملف ده مش من مذاكِر');
  }

  /* ---------- البروفايلات والقفل والترحيب ---------- */
  const Lock = {
    el: null,
    show(pick) {
      const list = Store.profiles();
      if (!list.length) return this.onboard();
      this.open();
      this.el.innerHTML = Char.html('', 100) + '<h2>مين بيذاكر؟</h2><div class="profiles">' + list.map(p => '<button class="prof" data-p="' + p.id + '"><span class="av" style="background:linear-gradient(135deg,hsl(' + (p.hue || 210) + ' 80% 55%),hsl(' + ((p.hue || 210) + 40) + ' 80% 50%))">' + esc((p.name || '؟').slice(0, 1)) + '</span><span>' + esc(p.name) + (p.pin ? ' 🔒' : '') + '</span></button>').join('') + '<button class="prof add" id="addP"><span class="av">' + icon('plus') + '</span><span>شخص جديد</span></button></div><p class="note">كل بروفايل ليه بطاقاته وامتحاناته وتقدمه لوحده.</p>';
      $$('[data-p]', this.el).forEach(b => b.onclick = () => this.enter(b.dataset.p));
      $('#addP').onclick = () => this.onboard(true);
    },
    open() { if (!this.el) { this.el = document.createElement('div'); this.el.className = 'lock'; this.el.setAttribute('role', 'dialog'); this.el.setAttribute('aria-modal', 'true'); document.body.appendChild(this.el); } document.body.style.overflow = 'hidden'; },
    close() { if (this.el) { this.el.remove(); this.el = null; } document.body.style.overflow = ''; },
    enter(id) {
      const p = Store.profiles().find(x => x.id === id); if (!p) return;
      if (!p.pin) { Store.open(id); this.close(); App.after(); return; }
      this.pinPad('اكتب الرقم السري يا ' + esc(p.name), async code => { if (await sha(code) === p.pin) { Store.open(id); this.close(); App.after(); return true; } return false; }, () => this.show(true));
    },
    pinPad(title, check, back) {
      document.removeEventListener('keydown', this.keyH);
      this.open(); let code = '';
      this.el.innerHTML = Char.html('', 90) + '<h2 style="font-size:20px">' + title + '</h2><div class="pins">' + '<i></i>'.repeat(4) + '</div><div class="pad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => '<button data-k="' + n + '">' + n + '</button>').join('') + '<button class="fn" data-k="b">' + (back ? 'رجوع' : '') + '</button><button data-k="0">0</button><button class="fn" data-k="d">مسح</button></div>';
      const pins = $$('.pins i', this.el);
      const paint = () => pins.forEach((p, i) => p.classList.toggle('on', i < code.length));
      const press = async k => {
        if (k === 'b') return back && back(); if (k === 'd') { code = code.slice(0, -1); return paint(); }
        if (code.length >= 4) return; code += k; paint(); haptic();
        if (code.length === 4) { const ok = await check(code); if (!ok) { haptic('error'); const pp = this.el.querySelector('.pins'); pp.classList.add('shake'); setTimeout(() => { pp.classList.remove('shake'); code = ''; paint(); }, 450); } }
      };
      $$('[data-k]', this.el).forEach(b => b.onclick = () => press(b.dataset.k));
      this.keyH = e => { if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('d'); };
      document.addEventListener('keydown', this.keyH, { once: false });
    },
    setPin() {
      let first = null;
      const done = () => { document.removeEventListener('keydown', this.keyH); this.close(); };
      this.pinPad('اختار رقم سري من 4 أرقام', async code => {
        if (!first) { first = code; this.pinPad('اكتبه تاني للتأكيد', async c2 => { if (c2 === first) { Store.updateProfile({ pin: await sha(c2) }); done(); toast('الرقم السري اتحفظ', 'lock'); Router.render(); return true; } return false; }, done); return true; }
        return true;
      }, done);
    },
    onboard(adding) {
      this.open();
      const step1 = () => {
        this.el.innerHTML = Char.html('', 130) + '<h2>أهلًا بيك في مذاكِر 👋</h2><p class="note" style="max-width:420px;font-size:15.5px">أنا <b>سَنَد</b>، هكون معاك طول الترم: ملخصات المواد الست، بطاقات حفظ بتفتكر إمتى تراجعها، امتحانات بتركز على اللي بتغلط فيه، تمارين محاسبة وإحصاء وإنتاج واقتصاد بالحل، وجدول لحد يوم الامتحان. وكله شغال من غير نت.</p><input class="input" id="obName" placeholder="اسمك إيه؟" maxlength="30" style="max-width:320px;text-align:center" autocomplete="given-name"><label class="row" style="max-width:320px;background:var(--bg2);border-radius:12px"><span class="tx"><b>اقفل البروفايل برقم سري</b><small>لو حد تاني بيستخدم الجهاز</small></span><span class="switch"><input type="checkbox" id="obPin"><span></span></span></label><button class="btn" id="obGo" style="min-width:220px">يلا نبدأ</button>' + (adding ? '<button class="btn gray sm" id="obBack">رجوع</button>' : '');
        setTimeout(() => { const c = this.el.querySelector('.char'); Char.act(c, 'happy'); }, 300);
        const go = async () => {
          const name = $('#obName').value.trim(); if (!name) { $('#obName').focus(); $('#obName').classList.add('shake'); setTimeout(() => $('#obName').classList.remove('shake'), 400); return; }
          const wantPin = $('#obPin').checked;
          const id = Store.create(name, null); Store.open(id);
          if (wantPin) { this.setPinThen(() => { this.close(); App.after(true); }); } else { this.close(); App.after(true); }
        };
        $('#obGo').onclick = go; $('#obName').onkeydown = e => { if (e.key === 'Enter') go(); };
        const bk = $('#obBack'); if (bk) bk.onclick = () => this.show(true);
      };
      step1();
    },
    setPinThen(cb) {
      let first = null;
      this.pinPad('اختار رقم سري من 4 أرقام', async code => {
        first = code;
        this.pinPad('اكتبه تاني للتأكيد', async c2 => { if (c2 !== first) return false; Store.updateProfile({ pin: await sha(c2) }); document.removeEventListener('keydown', this.keyH); cb(); return true; }, () => this.setPinThen(cb));
        return true;
      });
    }
  };
  App.Lock = Lock;

  /* ---------- التشغيل ---------- */
  App.VERSION = '1.2.0';
  App.after = (fresh) => {
    document.removeEventListener('keydown', Lock.keyH);
    if (!location.hash || (fresh && !/^#(take|res)\b/.test(location.hash))) history.replaceState(null, '', '#home');
    Router.cur = null; Router.render();
    renderBadges();
    if (fresh && !/^#(take|res)\b/.test(location.hash)) setTimeout(() => buddy('أنا ' + esc(D().charName) + '! لو عايز حاجة اكتبلي في الخانة اللي فوق بالعامية 😉', 'happy', 5200), 700);
    if (Pomo.st) Pomo.ensureTick();
  };
  function renderBadges() {
    if (!Store.data) return;
    const n = App.dueCards().length;
    $$('[data-badge="review"]').forEach(b => { b.textContent = n > 99 ? '99+' : n; b.hidden = !n; });
  }
  App.renderBadges = renderBadges;
  App.beforeLeave = (prev, next) => { App.keys = null; if (prev && prev.name === 'review') renderBadges(); };
  document.addEventListener('keydown', e => { if (App.keys && !document.querySelector('.sheet.on') && !Lock.el) App.keys(e); });
  // قفل تلقائي بعد 5 دقايق في الخلفية لو فيه رقم سري
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = now(); Store.save(true); return; }
    const p = Store.profile && Store.current && Store.profile();
    if (p && p.pin && hiddenAt && now() - hiddenAt > 5 * 60000) Lock.enter(p.id);
    renderBadges(); if (Pomo.st && !Pomo.st.paused && Pomo.left() <= 0) Pomo.complete();
  });
  addEventListener('pagehide', () => Store.save(true));
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); App.installEvt = e; });

  function boot() {
    Pre.apply();
    matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => Pre.apply());
    Char.startBlinking();
    const list = Store.profiles(), last = U.LS.get('mz:last', null);
    const p = list.find(x => x.id === last) || (list.length === 1 ? list[0] : null);
    if (!list.length) Lock.onboard();
    else if (p && !p.pin && list.length === 1) { Store.open(p.id); App.after(); }
    else if (p && p.pin) Lock.enter(p.id);
    else Lock.show(true);
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').then(reg => {
        reg.addEventListener('updatefound', () => { const w = reg.installing; w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) { toast('فيه نسخة جديدة — هتتطبق لما تفتح البرنامج تاني', 'spark'); } }); });
      }).catch(() => {});
      let reloaded = false; navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloaded) return; reloaded = true; location.reload(); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
