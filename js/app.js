/* مذاكِر — الشاشات الأساسية: الرئيسية، المواد، الدرس، البطاقات، الامتحان، المحادثة */
(function () {
  'use strict';
  const E = self.Engine, U = self.UI;
  const { $, $$, esc, icon, Store, Router, header, sheet, toast, Char, buddy, md, haptic, beep, confirmBox } = U;
  /* المنهج المدمج (لو اتضاف تاني في js/content) + المواد اللي كل مستخدم بيضيفها لنفسه */
  const BUILT = (self.MZ_CONTENT || []).slice();
  BUILT.forEach(s => { E.mergePlus(s, (self.MZ_PLUS || {})[s.id]); (s.concepts || []).forEach(c => { c.s = s.id; }); if (self.Figs) Figs.reg(s.id, s.figs); });
  const SUBJ = [], LESSONS = {};
  let CONCEPTS = [];
  const S = id => SUBJ.find(s => s.id === id);
  const D = () => Store.data;
  const COLORS = ['blue', 'green', 'orange', 'purple', 'pink', 'teal', 'indigo', 'red', 'yellow'];
  function refreshSubjects() {
    SUBJ.length = 0; Object.keys(LESSONS).forEach(k => delete LESSONS[k]);
    const mine = ((Store.data && Store.data.subjects) || []).map(x => Object.assign(x, { lessons: x.lessons || [], kind: x.kind || 'نظري', short: x.short || x.name, color: x.color || 'blue', icon: x.kind === 'عملي' || x.kind === 'عملي + نظري' ? 'calc' : 'book' }));
    SUBJ.push(...BUILT, ...mine.map(x => Object.assign({}, x, { tools: [], cards: [], questions: [], concepts: [], custom: true })));
    SUBJ.forEach(x => x.lessons.forEach((l, i) => { l.s = x.id; l.i = i; LESSONS[l.id] = l; }));
    CONCEPTS = [].concat(...SUBJ.map(x => x.concepts || []));
    E.setSubjects(SUBJ);
  }
  App.refreshSubjects = refreshSubjects;
  const SCN = { mid: 'ميدترم', final: 'فاينال', both: 'ميدترم وفاينال', all: 'كل المنهج' };
  const inSc = (lid, sc) => E.inScope(D().scope, lid, sc);
  const hasMid = sid => !!S(sid) && S(sid).lessons.some(l => inSc(l.id, 'mid'));
  const today = () => E.ymd(new Date());
  const now = () => Date.now();

  /* ---------- البيانات المشتقة ---------- */
  function builtinCards() {
    const out = [];
    BUILT.forEach(s => s.cards.forEach((c, i) => out.push({ id: s.id + ':c' + i, s: s.id, l: c[2], front: c[0], back: c[1] })));
    return out;
  }
  const BUILT_CARDS = builtinCards();
  function allCards() { return BUILT_CARDS.concat((D().custom.cards || []).filter(c => S(c.s)).map(c => Object.assign({ custom: true }, c))); }
  const TYPE = { mcq: 'mcq', tf: 'tf', fill: 'fill', num: 'num' };
  const BUILT_Q = []; BUILT.forEach(s => s.questions.forEach((q, i) => BUILT_Q.push({ id: s.id + ':' + (q.k || 'q' + i), s: s.id, l: q.l, type: TYPE[q.t], q: q.q, options: q.o, answer: q.a, accept: q.accept, tol: q.tol, explain: q.e, star: !!q.x, why: q.w || '', on: q.on, vars: q.v, keys: q.kw, fix: q.fix, ext: !!q.ext })));
  function allQuestions() { return BUILT_Q.concat((D().custom.questions || []).filter(q => S(q.s)).map(q => Object.assign({ custom: true }, q))); }
  const cardsOf = (sid, lid) => allCards().filter(c => (!sid || c.s === sid) && (!lid || c.l === lid));
  const questionsOf = (sid, lid) => allQuestions().filter(q => (!sid || q.s === sid) && (!lid || q.l === lid));
  function dueCards(sid, lid) { const t = now(); return cardsOf(sid, lid).filter(c => D().srs[c.id] && D().srs[c.id].due <= t); }
  function newCards(sid, lid) { return cardsOf(sid, lid).filter(c => !D().srs[c.id]); }
  function lessonAcc(lid) { let n = 0, ok = 0; for (const a of D().attempts) if (a.l === lid) { n++; if (a.ok) ok++; } return { n, ok, score: (ok + 1) / (n + 2) }; }
  function lessonProgress(lid) {
    const cs = cardsOf(null, lid);
    const m = cs.length ? cs.reduce((s, c) => s + E.mastery(D().srs[c.id]), 0) / cs.length : 0;
    const a = lessonAcc(lid); const acc = a.n ? a.ok / a.n * Math.min(1, a.n / 4) : 0;
    const read = D().lessonsRead[lid] ? 1 : 0;
    let p = 0.2 * read + 0.45 * m + 0.35 * acc;
    if (D().lessonsDone[lid]) p = Math.max(p, 0.8);
    return Math.min(1, p);
  }
  function subjectProgress(sid) { const ls = S(sid).lessons; return ls.length ? ls.reduce((s, l) => s + lessonProgress(l.id), 0) / ls.length : 0; }
  function logDay(patch) {
    const k = today(); const d = D().days[k] || (D().days[k] = { min: 0, cards: 0, q: 0, ok: 0 });
    for (const [x, v] of Object.entries(patch)) d[x] = (d[x] || 0) + v;
    Store.save();
  }
  function streakNow() { return E.streak(new Set(Object.keys(D().days).filter(k => { const d = D().days[k]; return d.min || d.cards || d.q; }))); }
  function upcomingExams() { const t = E.startOfDay(new Date()); return (D().exams || []).filter(e => S(e.subject) && new Date(e.date) >= t).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''))); }
  function plan() {
    const lessons = {}; SUBJ.forEach(s => { lessons[s.id] = s.lessons.map(l => l.id); });
    const exams = upcomingExams().filter(e => S(e.subject)).map(e => { const sc = E.examScope(e.kind), ls = sc === 'all' || (sc === 'mid' && !hasMid(e.subject)) ? null : E.scopeLessons(D().scope, lessons[e.subject], sc); return { id: e.id, subject: e.subject, date: new Date(e.date), lessons: ls && ls.length ? ls : null }; });
    const prog = {}; Object.keys(LESSONS).forEach(l => { prog[l] = lessonProgress(l); });
    return E.buildPlan(exams, lessons, prog, { perDay: D().settings.perDay || 3 });
  }
  function greeting() { const h = new Date().getHours(); return h < 5 ? 'سهران؟' : h < 12 ? 'صباح الخير' : h < 17 ? 'أهلًا' : 'مساء الخير'; }
  const subjIcon = (s, size = '') => '<span class="ic bg-' + s.color + '" ' + size + '>' + icon(s.icon) + '</span>';
  const ring = (p, s = 44, c) => '<span class="ring" style="--p:' + Math.round(p * 100) + ';--s:' + s + 'px' + (c ? ';--c:' + c : '') + '"><span>' + Math.round(p * 100) + '</span></span>';

  /* ---------- الرئيسية ---------- */
  function homeBubble() {
    const d = D(), due = dueCards().length, ex = upcomingExams()[0], st = streakNow(), mins = (d.days[today()] || {}).min || 0;
    const n = esc(d.name || 'يا بطل');
    if (ex) {
      const left = E.daysBetween(new Date(), new Date(ex.date));
      const s = S(ex.subject);
      if (left === 0) return 'امتحان <b>' + esc(s ? s.short : '') + '</b> النهارده! بالتوفيق يا ' + n + '. خد مراجعة خفيفة وماتجهدش نفسك 💪';
      if (left === 1) return 'بكرة امتحان <b>' + esc(s ? s.short : '') + '</b>. يلا نعمل مراجعة شاملة ونحل امتحان تجريبي.';
      if (left <= 7) return 'فاضل <b>' + left + ' أيام</b> على امتحان ' + esc(s ? s.short : '') + '. ' + (due ? 'عندك ' + due + ' بطاقة مستنياك نراجعها الأول.' : 'خلينا نمشي على الخطة.');
    }
    if (due) return greeting() + ' يا ' + n + '! عندك <b>' + due + ' بطاقة</b> وقت مراجعتها جه. ' + (due > 20 ? 'نبدأ بـ 20 بس؟' : 'دول مش هياخدوا 5 دقايق.');
    if (st >= 3) return 'سلسلة <b>' + st + ' أيام</b> ورا بعض 🔥 ماتقطعهاش النهارده!';
    if (mins >= d.settings.goal) return 'خلصت هدف النهارده (' + mins + ' دقيقة) 👏 أي حاجة زيادة دي بونص.';
    return greeting() + ' يا ' + n + '! أنا ' + esc(d.charName) + '، معاك في المذاكرة. قولّي عايز تعمل إيه، أو ابدأ من الخطة تحت.';
  }
  Router.on('home', view => {
    const d = D();
    const nav = header(view, greeting() + (d.name ? '، ' + d.name : ''), { right: '<button class="btn-nav" data-go="settings" aria-label="الإعدادات">' + icon('gear') + '</button>' });
    view.querySelector('h1').style.fontSize = '30px';
    const due = dueCards().length, st = streakNow(), mins = (d.days[today()] || {}).min || 0, goal = d.settings.goal || 30;
    const exs = upcomingExams();
    const p = plan(); const todayItems = p[today()] || [];
    const weak = E.weakness(d.attempts.filter(a => LESSONS[a.l]).map(a => ({ subject: a.s, lesson: a.l, ok: a.ok, t: a.t })), { min: 3 }).filter(w => w.score < 0.7).slice(0, 3);
    let html = '<div class="hero">' + Char.html('', 86) + '<div class="bubble" id="homeBubble">' + homeBubble() + '</div></div>';
    html += '<form class="ask" id="askForm" role="search"><input id="askIn" placeholder="قولّي عايز تعمل إيه… «امتحني 10 أسئلة»" autocomplete="off" enterkeyhint="send" aria-label="اكتب طلبك"><button class="send" aria-label="إرسال">' + icon('send') + '</button></form>';
    html += '<div class="chips">' + (BUILT.length ? ['ذاكرلي', 'امتحني 10 أسئلة', 'إيه أهم الأسئلة المتوقعة؟', 'وريني الرسومات', 'قسملي خطة', 'مراجعة نهائية'] : ['عايز أراجع', 'امتحني 10 أسئلة', 'إيه أضعف حاجة عندي؟', 'أذاكر إيه النهارده؟', 'شغل بومودورو']).map(t => '<button class="chip" data-say="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>';
    html += '<div class="stats3">'
      + (due || !newCards().length ? '<a class="stat" href="#review">' + icon('cards', 'c-blue') + '<span class="n">' + due + '</span><span class="l">بطاقة مستحقة</span></a>' : '<a class="stat" href="#review?mode=new">' + icon('cards', 'c-blue') + '<span class="n">' + newCards().length + '</span><span class="l">بطاقة جديدة</span></a>')
      + '<a class="stat" href="#stats">' + icon('flame', 'c-orange') + '<span class="n">' + st + '</span><span class="l">يوم ورا بعض</span></a>'
      + '<a class="stat" href="#plan?tab=timer"><span class="ring" style="--p:' + Math.min(100, Math.round(mins / goal * 100)) + ';--s:44px;--c:var(--green)"><span>' + mins + '</span></span><span class="l">من ' + goal + ' دقيقة</span></a></div>';
    SUBJ.filter(x => x.final).forEach(x => { html += '<a class="card tap finalcard mb" href="#final/' + x.id + '">' + Char.html('', 46) + '<span style="flex:1"><b>🏁 المراجعة النهائية: ' + esc(x.name) + '</b><span class="note" style="display:block">ملخص شامل، الرسومات، ماراثون المتوقع ⭐، وامتحان تجريبي.</span></span>' + icon('chev', 'chev') + '</a>'; });
    if (!SUBJ.length) html += '<div class="card mb startcard"><div style="display:flex;gap:12px;align-items:center">' + Char.html('', 60) + '<div style="flex:1"><b>يلا نبدأ! ضيف أول مادة</b><div class="note">اكتب اسم المادة، وبعدين ضيف محاضراتها: العنوان والشرح أو الملخص بتاعك. بعدها تقدر تعمل بطاقات وأسئلة وتمتحن نفسك وتبعت امتحانات لصحابك.</div></div></div><button class="btn block mt" data-addsubj>' + icon('plus') + 'ضيف مادة</button></div>';
    if (exs.length) {
      html += '<div class="group-h">الامتحانات الجاية <a href="#plan?tab=exams">الكل</a></div><div class="group">';
      exs.slice(0, 3).forEach(e => { const s = S(e.subject), left = E.daysBetween(new Date(), new Date(e.date)); html += '<a class="row tap" href="#subject/' + e.subject + '"><span class="countdown"><span class="d"><b>' + left + '</b><small>' + (left === 1 ? 'يوم' : 'أيام') + '</small></span></span><span class="tx"><b>' + esc((e.kind || 'امتحان') + ' ' + (s ? s.name : '')) + '</b><small>' + esc(E.prettyDate(e.date)) + (e.time ? ' — الساعة ' + esc(e.time) : '') + (e.note ? ' — ' + esc(e.note) : '') + '</small></span>' + icon('chev', 'chev') + '</a>'; });
      html += '</div>';
      const e0 = exs[0], s0 = S(e0.subject), sc0 = E.examScope(e0.kind), sc1 = sc0 === 'mid' && s0 && !hasMid(s0.id) ? 'all' : sc0, ns = s0 ? questionsOf(s0.id).filter(q => q.star && (sc1 === 'all' || inSc(q.l, sc1))).length : 0;
      if (ns) html += '<a class="card tap starcard mb" style="display:flex;gap:12px;align-items:center;margin-top:-6px" href="#quiz?s=' + s0.id + '&star=1&sc=' + sc1 + '&n=' + Math.min(10, ns) + '&go=1">' + Char.html('', 44) + '<span style="flex:1"><b>⭐ الأسئلة المتوقعة في ' + esc(s0.short) + (sc1 !== 'all' ? ' (' + SCN[sc1] + ')' : '') + '</b><span class="note" style="display:block">' + ns + ' سؤال هام بشرحهم، ابدأ بيهم قبل الامتحان.</span></span>' + icon('chev', 'chev') + '</a>';
    }
    html += '<div class="group-h">خطة النهارده <a href="#plan">الجدول</a></div><div class="group">';
    if (due) html += '<a class="row tap" href="#review"><span class="ic bg-blue">' + icon('cards') + '</span><span class="tx"><b>راجع البطاقات المستحقة</b><small>' + due + ' بطاقة — حوالي ' + Math.max(1, Math.round(due * 0.25)) + ' دقيقة</small></span>' + icon('chev', 'chev') + '</a>';
    todayItems.slice(0, 6).forEach(it => {
      const s = S(it.subject);
      if (it.type === 'lesson') { const l = LESSONS[it.lesson]; html += '<a class="row tap" href="#lesson/' + l.id + '">' + subjIcon(s) + '<span class="tx"><b>' + esc(l.title) + '</b><small>' + esc(s.name) + ' — ' + Math.round(lessonProgress(l.id) * 100) + '%</small></span>' + icon('chev', 'chev') + '</a>'; }
      else html += '<a class="row tap" href="#quiz?s=' + it.subject + '&n=20&mode=exam">' + '<span class="ic bg-red">' + icon('target') + '</span><span class="tx"><b>مراجعة شاملة وامتحان تجريبي</b><small>' + esc(s.name) + ' — الامتحان قرب</small></span>' + icon('chev', 'chev') + '</a>';
    });
    if (!due && !todayItems.length) html += '<div class="row noicon"><span class="tx"><b>مفيش حاجة متجدولة</b><small>ضيف مواعيد امتحاناتك وأنا أوزعلك الدروس على الأيام. أو اختار درس من المواد.</small></span><a class="btn sm tint" href="#plan?tab=exams">ضيف امتحان</a></div>';
    html += '</div>';
    if (weak.length) {
      html += '<div class="group-h">محتاج تركز على</div><div class="group">';
      weak.forEach(w => { const l = LESSONS[w.lesson]; if (!l) return; html += '<a class="row tap" href="#quiz?l=' + l.id + '&n=10"><span class="ic bg-orange">' + icon('target') + '</span><span class="tx"><b>' + esc(l.title) + '</b><small>' + esc(S(l.s).short) + ' — صح ' + w.ok + ' من ' + w.n + '</small></span><span class="pill orange">' + Math.round(w.acc * 100) + '%</span></a>'; });
      html += '</div>';
    }
    if (SUBJ.length) html += '<div class="group-h">المواد <a href="#subjects">الكل</a></div><div class="subjects">' + SUBJ.map(subjCard).join('') + '</div>';
    html += '<div class="group"><a class="row tap" href="#notes"><span class="ic bg-yellow">' + icon('note') + '</span><span class="tx"><b>ملاحظاتي</b><small>' + d.notes.length + ' ملاحظة</small></span>' + icon('chev', 'chev') + '</a><a class="row tap" href="#stats"><span class="ic bg-purple">' + icon('chart') + '</span><span class="tx"><b>تقدمي ونقط ضعفي</b></span>' + icon('chev', 'chev') + '</a><a class="row tap" href="#chat"><span class="ic bg-teal">' + icon('chat') + '</span><span class="tx"><b>كلّم ' + esc(d.charName) + '</b><small>اسأله بالعامية</small></span>' + icon('chev', 'chev') + '</a></div>';
    view.insertAdjacentHTML('beforeend', html);
    view.querySelector('[data-go]').onclick = () => Router.go('settings');
    $('#askForm').onsubmit = e => { e.preventDefault(); const v = $('#askIn').value.trim(); if (v) { App.pendingSay = v; Router.go('chat'); } };
    $$('[data-say]').forEach(b => b.onclick = () => { App.pendingSay = b.dataset.say; Router.go('chat'); });
    $$('[data-addsubj]', view).forEach(b => b.onclick = () => App.subjectSheet());
    setTimeout(() => Char.act(view.querySelector('.hero .char'), 'nod'), 450);
  });
  function subjCard(s) {
    const p = subjectProgress(s.id), due = dueCards(s.id).length;
    return '<a class="subj" href="#subject/' + s.id + '">' + subjIcon(s) + '<b>' + esc(s.name) + '</b><small>' + s.lessons.length + ' دروس · ' + cardsOf(s.id).length + ' بطاقة' + (due ? ' · <span class="c-blue">' + due + ' مستحقة</span>' : '') + '</small><div class="bar"><i style="width:' + Math.round(p * 100) + '%;background:var(--' + s.color + ')"></i></div></a>';
  }

  /* ---------- المواد ---------- */
  Router.on('subjects', view => {
    header(view, 'المواد', { sub: SUBJ.length ? SUBJ.length + (SUBJ.length > 2 && SUBJ.length < 11 ? ' مواد' : ' مادة') : 'ضيف موادك ومحاضراتها بنفسك', right: '<button class="btn-nav" data-addsubj aria-label="مادة جديدة">' + icon('plus') + '</button>' });
    if (!SUBJ.length) { view.insertAdjacentHTML('beforeend', '<div class="empty">' + Char.html('', 90) + '<p><b>لسه مفيش مواد</b><br>ضيف أول مادة، وبعدين ضيف محاضراتها.</p><button class="btn" data-addsubj>' + icon('plus') + 'ضيف مادة</button></div>'); $$('[data-addsubj]', view).forEach(b => b.onclick = () => App.subjectSheet()); return; }
    view.insertAdjacentHTML('beforeend', '<form class="ask" id="sForm"><input id="sIn" placeholder="دوّر في كل الملخصات والبطاقات…" type="search" enterkeyhint="search" aria-label="بحث"><button class="send" aria-label="بحث">' + icon('search') + '</button></form><div class="subjects">' + SUBJ.map(subjCard).join('') + '</div>');
    view.insertAdjacentHTML('beforeend', '<button class="btn block tint mt" data-addsubj>' + icon('plus') + 'ضيف مادة</button>');
    $$('[data-addsubj]', view).forEach(b => b.onclick = () => App.subjectSheet());
    $('#sForm').onsubmit = e => { e.preventDefault(); const v = $('#sIn').value.trim(); if (v) Router.go('search?q=' + encodeURIComponent(v)); };
  });
  Router.on('search', (view, r) => {
    const q = r.q.q || '';
    header(view, 'بحث', { back: { to: 'subjects', label: 'المواد' } });
    view.insertAdjacentHTML('beforeend', '<form class="ask" id="sForm"><input id="sIn" value="' + esc(q) + '" type="search" enterkeyhint="search" aria-label="بحث"><button class="send">' + icon('search') + '</button></form><div id="res"></div>');
    $('#sForm').onsubmit = e => { e.preventDefault(); Router.go('search?q=' + encodeURIComponent($('#sIn').value.trim()), { replace: true }); };
    $('#res').innerHTML = searchHTML(q);
  });
  function searchDocs() {
    const docs = [];
    Object.values(LESSONS).forEach(l => docs.push({ id: 'l:' + l.id, kind: 'lesson', title: l.title, text: l.summary, l }));
    allCards().forEach(c => docs.push({ id: 'c:' + c.id, kind: 'card', title: c.front, text: c.back, c }));
    D().notes.forEach(n => docs.push({ id: 'n:' + n.id, kind: 'note', title: n.text.slice(0, 60), text: n.text, n }));
    return docs;
  }
  function searchHTML(q, limit = 12) {
    const res = E.search(searchDocs(), q, limit);
    if (!res.length) return '<div class="empty">' + Char.html('', 80) + '<p>مالقيتش حاجة عن «' + esc(q) + '». جرّب كلمة تانية.</p></div>';
    return '<div class="group">' + res.map(({ doc }) => {
      if (doc.kind === 'lesson') return '<a class="row tap" href="#lesson/' + doc.l.id + '?hl=' + encodeURIComponent(q) + '">' + subjIcon(S(doc.l.s)) + '<span class="tx"><b>' + esc(doc.title) + '</b><small>' + esc(E.snippet(doc.text.replace(/[#*|>`]/g, ''), q)) + '</small></span>' + icon('chev', 'chev') + '</a>';
      if (doc.kind === 'card') return '<div class="row"><span class="ic bg-gray">' + icon('cards') + '</span><span class="tx"><b>' + esc(doc.c.front) + '</b><small class="pre">' + esc(doc.c.back) + '</small></span></div>';
      return '<a class="row tap" href="#notes"><span class="ic bg-yellow">' + icon('note') + '</span><span class="tx"><b>ملاحظة</b><small>' + esc(doc.n.text) + '</small></span></a>';
    }).join('') + '</div>';
  }

  Router.on('subject', (view, r) => {
    const s = S(r.args[0]); if (!s) return Router.go('subjects', { replace: true });
    const tab = r.q.tab || 'lessons';
    header(view, s.name, { back: { to: 'subjects', label: 'المواد' }, right: s.custom ? '<button class="btn-nav" id="editS" aria-label="تعديل المادة">' + icon('edit') + '</button>' : '' });
    const p = subjectProgress(s.id), due = dueCards(s.id).length, nw = newCards(s.id).length, qs = questionsOf(s.id).length;
    const nextEx = upcomingExams().find(e => e.subject === s.id);
    let html = '<div class="card" style="display:flex;align-items:center;gap:14px;margin-bottom:16px">' + ring(p, 64, 'var(--' + s.color + ')') + '<div style="flex:1"><b>' + esc(s.kind) + '</b><div class="note">' + s.lessons.length + ' دروس · ' + cardsOf(s.id).length + ' بطاقة · ' + qs + ' سؤال' + (nextEx ? '<br>الامتحان ' + esc(E.inDaysText(E.daysBetween(new Date(), new Date(nextEx.date)))) : '') + '</div></div></div>';
    if (s.partial) html += '<div class="warn">' + icon('info') + ' ' + esc(s.partial) + '</div>';
    html += '<div class="btns mb"><a class="btn" href="#review/' + s.id + '">' + icon('cards') + (due ? 'راجع ' + due : nw ? 'ابدأ البطاقات' : 'راجع') + '</a><a class="btn tint" href="#quiz?s=' + s.id + '">' + icon('quiz') + 'امتحني</a></div>';
    if (s.final) html += '<a class="card tap finalcard mb" href="#final/' + s.id + '">' + Char.html('', 46) + '<span style="flex:1"><b>🏁 المراجعة النهائية</b><span class="note" style="display:block">ملخص شامل، الرسومات، ماراثون الأسئلة المتوقعة، وامتحان تجريبي.</span></span>' + icon('chev', 'chev') + '</a>';
    const tabs = [['lessons', 'الدروس'], ...(s.tools.length ? [['tools', 'تمارين وحاسبات']] : []), ...(self.Figs && Figs.list(s.id).length ? [['figs', 'الرسومات']] : []), ['cards', 'البطاقات'], ['qs', 'الأسئلة']];
    html += '<div class="seg" role="tablist">' + tabs.map(([k, t]) => '<button role="tab" aria-selected="' + (k === tab) + '" class="' + (k === tab ? 'on' : '') + '" data-tab2="' + k + '">' + t + '</button>').join('') + '</div><div id="tabBody"></div>';
    view.insertAdjacentHTML('beforeend', html);
    const es = $('#editS'); if (es) es.onclick = () => App.subjectSheet(s);
    $$('[data-tab2]').forEach(b => b.onclick = () => Router.go('subject/' + s.id + '?tab=' + b.dataset.tab2, { replace: true }));
    const body = $('#tabBody');
    if (tab === 'lessons') {
      const nMid = s.lessons.filter(l => inSc(l.id, 'mid')).length, nFin = s.lessons.filter(l => inSc(l.id, 'final')).length;
      body.innerHTML = '<div class="card mb scopecard"><div style="display:flex;gap:10px;align-items:center"><div style="flex:1"><b>منهج الميدترم والفاينال</b><div class="note">' + (nMid ? 'الميدترم: ' + nMid + ' درس · الفاينال: ' + nFin + ' درس' : 'لسه ماحددتش الميدترم. كل الدروس محسوبة على الفاينال.') + '</div></div><button class="btn sm tint" id="scopeBtn">حدد</button></div>'
        + (nMid ? '<div class="btns mt"><a class="btn sm" href="#quiz?s=' + s.id + '&sc=mid">امتحني ميدترم</a><a class="btn sm gray" href="#quiz?s=' + s.id + '&sc=final">امتحني فاينال</a></div>' : '') + '</div>'
        + '<div class="group">' + s.lessons.map((l, i) => { const lp = lessonProgress(l.id), v = D().scope[l.id]; return '<a class="row tap" href="#lesson/' + l.id + '">' + ring(lp, 34, 'var(--' + s.color + ')') + '<span class="tx"><b>' + (i + 1) + '. ' + esc(l.title) + (v === 'mid' || v === 'both' ? ' <span class="pill sc-mid">ميدترم</span>' : '') + '</b><small>' + esc(l.source) + (D().lessonsDone[l.id] ? ' · ✓ خلصته' : D().lessonsRead[l.id] ? ' · قريته' : '') + '</small></span>' + icon('chev', 'chev') + '</a>'; }).join('') + '</div>'
        + (s.custom ? (s.lessons.length ? '' : '<div class="empty" style="padding:18px 0">' + Char.html('', 70) + '<p>لسه مفيش محاضرات في المادة دي.</p></div>') + '<button class="btn block tint" id="addL">' + icon('plus') + 'ضيف محاضرة</button>' : '');
      $('#scopeBtn').onclick = () => scopeSheet(s);
      const al = $('#addL'); if (al) al.onclick = () => App.lessonSheet({ s: s.id });
    } else if (tab === 'tools') {
      body.innerHTML = '<div class="group">' + s.tools.map(t => { const T = self.Tools && Tools.meta[t]; if (!T) return ''; return '<a class="row tap" href="#tool/' + t + '"><span class="ic bg-' + s.color + '">' + icon(T.icon) + '</span><span class="tx"><b>' + esc(T.title) + '</b><small>' + esc(T.desc) + '</small></span>' + icon('chev', 'chev') + '</a>'; }).join('') + '</div><p class="group-f">كل حاسبة بتطلعلك الحل بالخطوات زي ما بيتكتب في الامتحان، وفيه تمارين متولدة تحلها وأنا أصححها.</p>';
    } else if (tab === 'figs') {
      App.figsTab(body, s);
    } else if (tab === 'cards') {
      const list = cardsOf(s.id);
      body.innerHTML = '<div class="btns mb"><button class="btn sm tint" id="addCard">' + icon('plus') + 'ضيف بطاقة</button></div>' + s.lessons.map(l => { const cs = list.filter(c => c.l === l.id); if (!cs.length) return ''; return '<div class="group-h">' + esc(l.title) + '</div><div class="group">' + cs.map(cardRow).join('') + '</div>'; }).join('') + (list.some(c => c.custom && !LESSONS[c.l]) ? '<div class="group-h">بطاقاتي</div><div class="group">' + list.filter(c => c.custom && !LESSONS[c.l]).map(cardRow).join('') + '</div>' : '');
      $('#addCard').onclick = () => App.cardSheet({ s: s.id });
      body.onclick = e => { const b = e.target.closest('[data-card]'); if (!b) return; const c = allCards().find(x => x.id === b.dataset.card); if (c && c.custom) App.cardSheet(c); else b.querySelector('small').hidden = !b.querySelector('small').hidden; };
    } else {
      const only = r.q.star === '1', all = questionsOf(s.id), stars = all.filter(q => q.star).length;
      let h = '<div class="card mb starcard"><div style="display:flex;gap:12px;align-items:center">' + Char.html('', 52) + '<div style="flex:1"><b>بنك أسئلة ' + esc(s.short) + '</b><div class="note">' + all.length + ' سؤال، منهم <b>' + stars + ' ⭐ متوقع</b> (أمثلة الدكتور والسكشن والنقط المتكررة). كل سؤال معاه شرحه.</div></div></div><div class="btns mt"><a class="btn sm" href="#quiz?s=' + s.id + '&star=1&n=' + Math.min(10, stars) + '&go=1">⭐ امتحني في المتوقع</a><a class="btn sm tint" href="#quiz?s=' + s.id + '">امتحان عادي</a></div></div>';
      h += '<div class="group-h">امتحني في درس</div><div class="group">' + s.lessons.map(l => { const qs = questionsOf(s.id, l.id), n = qs.length, x = qs.filter(q => q.star).length, a = lessonAcc(l.id); return '<a class="row tap" href="#quiz?l=' + l.id + '&n=' + Math.min(10, n) + '"><span class="ic bg-' + s.color + '">' + icon('quiz') + '</span><span class="tx"><b>' + esc(l.title) + '</b><small>' + n + ' سؤال · ⭐ ' + x + ' متوقع' + (a.n ? ' · صح ' + a.ok + ' من ' + a.n : '') + '</small></span>' + icon('chev', 'chev') + '</a>'; }).join('') + '</div>';
      h += '<div class="group-h">بنك الأسئلة بالإجابات والشرح</div><div class="seg"><button data-bk="0" class="' + (only ? '' : 'on') + '">الكل</button><button data-bk="1" class="' + (only ? 'on' : '') + '">⭐ المتوقع بس</button></div>';
      h += s.lessons.map(l => { const qs = questionsOf(s.id, l.id).filter(q => !only || q.star); if (!qs.length) return ''; return '<div class="group-h">' + esc(l.title) + '</div><div class="group bank">' + qs.map(bankRow).join('') + '</div>'; }).join('');
      const mine = all.filter(q => q.custom && !LESSONS[q.l] && (!only || q.star)); if (mine.length) h += '<div class="group-h">أسئلتي</div><div class="group bank">' + mine.map(bankRow).join('') + '</div>';
      h += '<div class="btns"><button class="btn tint" id="addQ">' + icon('plus') + 'ضيف سؤال من عندك</button></div>';
      body.innerHTML = h;
      $$('[data-bk]', body).forEach(b => b.onclick = () => Router.go('subject/' + s.id + '?tab=qs' + (b.dataset.bk === '1' ? '&star=1' : ''), { replace: true }));
      body.addEventListener('click', e => { const b = e.target.closest('[data-bq]'); if (!b || e.target.closest('[data-ask],a')) return; const d2 = b.querySelector('.bq-a'); d2.hidden = !d2.hidden; b.classList.toggle('open', !d2.hidden); });
      App.bindExplain(body);
      $('#addQ').onclick = () => App.questionSheet({ s: s.id });
    }
  });
  function scopeSheet(s) {
    const d = D(), tmp = Object.assign({}, d.scope);
    const body = U.el('<div><p class="note" style="margin:0 0 12px">اختار كل درس داخل في إيه. الامتحانات اللي نوعها «ميدتيرم» هتذاكرلك الدروس اللي محددها ميدترم بس، وكذلك الفاينال.</p><div class="btns mb"><button class="btn sm gray" data-all="mid">كله ميدترم</button><button class="btn sm gray" data-all="both">كله الاتنين</button><button class="btn sm gray" data-all="final">كله فاينال</button></div><div id="scL"></div></div>');
    const draw = () => {
      body.querySelector('#scL').innerHTML = s.lessons.map((l, i) => { const v = tmp[l.id] || 'final'; return '<div class="sc-row"><b>' + (i + 1) + '. ' + esc(l.title) + '</b><div class="seg sm">' + ['mid', 'both', 'final'].map(k => '<button type="button" data-l="' + l.id + '" data-v="' + k + '" class="' + (v === k ? 'on' : '') + '">' + (k === 'both' ? 'الاتنين' : SCN[k]) + '</button>').join('') + '</div></div>'; }).join('');
      $$('[data-v]', body).forEach(b => b.onclick = () => { tmp[b.dataset.l] = b.dataset.v; haptic(); draw(); });
    };
    $$('[data-all]', body).forEach(b => b.onclick = () => { s.lessons.forEach(l => tmp[l.id] = b.dataset.all); draw(); });
    draw();
    sheet({ title: 'منهج ' + s.short, body, doneText: 'حفظ', done: () => { s.lessons.forEach(l => { if (tmp[l.id] && tmp[l.id] !== 'final') d.scope[l.id] = tmp[l.id]; else delete d.scope[l.id]; }); Store.save(); toast('المنهج اتحفظ، والخطة اتحدثت', 'check'); Router.render(); } });
  }
  function rightAnswer(q) { return q.type === 'tf' ? (q.answer ? 'صح' : 'غلط') : q.type === 'mcq' ? q.options[q.answer] : String(q.type === 'num' ? E.fmt(q.answer, 4) : q.answer); }
  function bankRow(q) {
    return '<div class="row noicon bq' + (q.star ? ' starred' : '') + '" data-bq="' + esc(q.id) + '" role="button" tabindex="0"><span class="tx"><b>' + (q.star ? '<span class="star-i" aria-label="متوقع">⭐</span> ' : '') + esc(q.q) + '</b>'
      + (q.type === 'mcq' ? '<small>' + q.options.map((o, i) => 'أبجد'[i] + ') ' + esc(o)).join('  ·  ') + '</small>' : '')
      + '<div class="bq-a" hidden><div class="xp-ans">✓ الإجابة: <b>' + esc(rightAnswer(q)) + '</b></div>' + (q.star && q.why ? '<div class="xp-why">⭐ ليه هام: ' + esc(q.why) + '</div>' : '') + App.explainHTML(q, false) + '</div></span></div>';
  }
  function cardRow(c) { const st = D().srs[c.id]; return '<button class="row noicon" data-card="' + esc(c.id) + '"><span class="tx"><b>' + esc(c.front) + (c.custom ? ' <span class="pill acc">بطاقتي</span>' : '') + '</b><small hidden class="pre">' + esc(c.back) + '</small></span><span class="v">' + (st ? Math.round(E.mastery(st) * 100) + '%' : 'جديدة') + '</span></button>'; }

  /* ---------- الدرس ---------- */
  Router.on('lesson', (view, r) => {
    const l = LESSONS[r.args[0]]; if (!l) return Router.go('subjects', { replace: true });
    const s = S(l.s), d = D();
    if (!d.lessonsRead[l.id]) { d.lessonsRead[l.id] = now(); Store.save(); }
    header(view, l.title, { back: { to: 'subject/' + s.id, label: s.short }, right: (s.custom ? '<button class="btn-nav" id="editL" aria-label="تعديل المحاضرة">' + icon('edit') + '</button>' : '') + '<button class="btn-nav" id="noteBtn" aria-label="ملاحظة">' + icon('note') + '</button>' });
    const nc = cardsOf(null, l.id).length, nq = questionsOf(null, l.id).length, idx = s.lessons.indexOf(l);
    let html = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:-6px 0 12px"><span class="pill acc">' + esc(s.name) + '</span>' + (l.source ? '<span class="pill">' + esc(l.source) + '</span>' : '') + '</div>';
    const isFinal = s.final === l.id, canTeach = !!(l.summary && /^##\s/m.test(l.summary));
    if (isFinal) html += '<a class="btn block mb" href="#final/' + s.id + '">🏁 افتح صفحة المراجعة النهائية (رسومات وماراثون وامتحان)</a>';
    else if (canTeach) html += '<a class="card tap teachcard mb" href="#teach/' + l.id + '">' + Char.html('', 46) + '<span style="flex:1"><b>🎓 ذاكر معايا الدرس ده</b><span class="note" style="display:block">' + esc(d.charName) + ' يشرحهولك حتة حتة ويسألك بعد كل جزء.</span></span>' + icon('chev', 'chev') + '</a>';
    html += l.summary && l.summary.trim() ? '<article class="card prose">' + md(l.summary, r.q.hl) + '</article>' : '<div class="empty" style="padding:16px 0">' + Char.html('', 70) + '<p>المحاضرة دي لسه فاضية. اضغط ✏️ فوق واكتب الشرح أو الملخص.</p></div>';
    if (s.custom) html += '<div class="btns mt"><button class="btn sm tint" id="addLC">' + icon('plus') + 'بطاقة</button><button class="btn sm tint" id="addLQ">' + icon('plus') + 'سؤال</button></div>';
    const myNotes = d.notes.filter(n => n.l === l.id);
    if (myNotes.length) html += '<div class="group-h">ملاحظاتي على الدرس</div><div class="group">' + myNotes.map(n => '<div class="row noicon"><span class="tx"><small style="color:var(--fg);font-size:15px">' + esc(n.text) + '</small></span></div>').join('') + '</div>';
    html += '<div class="btns mt"><a class="btn" href="#review/' + s.id + '/' + l.id + '">' + icon('cards') + nc + ' بطاقة</a><a class="btn tint" href="#quiz?l=' + l.id + '&n=' + Math.min(10, nq) + '">' + icon('quiz') + nq + ' سؤال</a></div>';
    html += '<button class="btn block ' + (d.lessonsDone[l.id] ? 'gray' : 'green') + ' mt" id="doneBtn">' + icon('check') + (d.lessonsDone[l.id] ? 'خلصت الدرس ده (اضغط للإلغاء)' : 'خلصت الدرس ده') + '</button>';
    html += '<div class="btns mt">' + (idx > 0 ? '<a class="btn gray" href="#lesson/' + s.lessons[idx - 1].id + '">→ اللي قبله</a>' : '') + (idx < s.lessons.length - 1 ? '<a class="btn gray" href="#lesson/' + s.lessons[idx + 1].id + '">اللي بعده ←</a>' : '') + '</div>';
    view.insertAdjacentHTML('beforeend', html);
    $('#doneBtn').onclick = () => { if (d.lessonsDone[l.id]) delete d.lessonsDone[l.id]; else { d.lessonsDone[l.id] = now(); buddy('برافو! الدرس ده اتقفل ✅ ماتنساش تراجع بطاقاته بكرة.', 'happy'); beep('ok'); haptic('success'); } Store.save(); Router.render(); };
    $('#noteBtn').onclick = () => App.noteSheet({ s: s.id, l: l.id });
    const el2 = $('#editL'); if (el2) el2.onclick = () => App.lessonSheet(l);
    const lc = $('#addLC'); if (lc) lc.onclick = () => App.cardSheet({ s: s.id, l: l.id });
    const lq = $('#addLQ'); if (lq) lq.onclick = () => App.questionSheet({ s: s.id, l: l.id });
  });

  /* ---------- البطاقات (التكرار المتباعد) ---------- */
  let REV = null;
  Router.on('review', (view, r) => {
    const sid = r.args[0] && S(r.args[0]) ? r.args[0] : null, lid = r.args[1] && LESSONS[r.args[1]] ? r.args[1] : null;
    const key = (sid || '') + '/' + (lid || '') + '/' + (r.q.mode || '');
    if (!REV || REV.key !== key || REV.done) {
      let due = dueCards(sid, lid), fresh = newCards(sid, lid);
      let queue;
      if (r.q.mode === 'all' || (lid && !due.length && !fresh.length)) queue = E.shuffle(cardsOf(sid, lid));
      else queue = E.shuffle(due).concat(fresh.slice(0, r.q.mode === 'new' ? 40 : Math.max(0, 20 - Math.min(due.length, 20))));
      if (r.q.n) queue = queue.slice(0, +r.q.n);
      REV = { key, queue: queue.map(c => c.id), i: 0, flipped: false, stats: [0, 0, 0, 0], start: now(), sid, lid, done: false };
    }
    const title = lid ? 'بطاقات الدرس' : sid ? 'بطاقات ' + S(sid).short : 'المراجعة';
    header(view, title, { back: sid ? { to: lid ? 'lesson/' + lid : 'subject/' + sid } : null });
    const box = document.createElement('div'); view.appendChild(box);
    const draw = () => {
      if (!REV.queue.length) {
        const totalNew = newCards().length;
        box.innerHTML = '<div class="empty">' + Char.html('', 96) + '<p style="font-size:17px;color:var(--fg)"><b>مفيش بطاقات مستحقة دلوقتي 🎉</b></p><p>كل اللي اتعلمته متجدول يرجعلك في وقته.</p><div class="btns" style="justify-content:center">' + (totalNew ? '<a class="btn" href="#review' + (sid ? '/' + sid : '') + '?mode=new">ذاكر بطاقات جديدة</a>' : '') + '<a class="btn tint" href="#review' + (sid ? '/' + sid : '') + '?mode=all&n=20">مراجعة سريعة 20</a></div></div>';
        if (!sid) box.insertAdjacentHTML('beforeend', '<div class="group-h">ولا اختار مادة</div><div class="group">' + SUBJ.map(s => '<a class="row tap" href="#review/' + s.id + '">' + subjIcon(s) + '<span class="tx"><b>' + esc(s.name) + '</b><small>' + dueCards(s.id).length + ' مستحقة · ' + newCards(s.id).length + ' جديدة</small></span>' + icon('chev', 'chev') + '</a>').join('') + '</div>');
        return;
      }
      if (REV.i >= REV.queue.length) return finish();
      const c = allCards().find(x => x.id === REV.queue[REV.i]); if (!c) { REV.i++; return draw(); }
      const st = D().srs[c.id], l = LESSONS[c.l];
      box.innerHTML = '<div class="progress-top"><span class="num">' + (REV.i + 1) + '/' + REV.queue.length + '</span><div class="bar"><i style="width:' + (REV.i / REV.queue.length * 100) + '%"></i></div></div>'
        + '<div class="flash" id="flash" role="button" tabindex="0" aria-label="اقلب البطاقة"><div class="in"><div class="face front"><span class="tag pill ' + (st ? '' : 'acc') + '">' + (st ? esc(S(c.s).short) : 'جديدة') + '</span><div class="q">' + esc(c.front) + '</div><div class="hint">اضغط عشان تشوف الإجابة</div></div><div class="face back"><span class="tag pill">' + esc(l ? l.title : S(c.s).short) + '</span><div class="a">' + esc(c.back) + '</div></div></div></div>'
        + '<div id="gradeBox">' + (REV.flipped ? gradesHTML(st) : '<button class="btn block" id="showBtn">اعرض الإجابة</button>') + '</div>';
      const fl = $('#flash'); if (REV.flipped) fl.classList.add('flip');
      const flip = () => { if (REV.flipped) return; REV.flipped = true; fl.classList.add('flip'); $('#gradeBox').innerHTML = gradesHTML(st); bindGrades(c); haptic(); };
      fl.onclick = flip; fl.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } };
      const sb = $('#showBtn'); if (sb) sb.onclick = flip;
      if (REV.flipped) bindGrades(c);
    };
    const gradesHTML = st => '<div class="grades">' + [['g0', 'نسيت', 0], ['g1', 'صعبة', 1], ['g2', 'كويس', 2], ['g3', 'سهلة', 3]].map(([c, t, g]) => '<button class="' + c + '" data-g="' + g + '">' + t + '<small>' + E.srsLabel(st, g) + '</small></button>').join('') + '</div><p class="note center mt">اختصارات الكيبورد: مسافة للقلب، و 1 2 3 4 للتقييم</p>';
    const bindGrades = c => $$('[data-g]').forEach(b => b.onclick = () => grade(c, +b.dataset.g));
    const grade = (c, g) => {
      const d = D(); d.srs[c.id] = E.srsNext(d.srs[c.id], g); REV.stats[g]++;
      logDay({ cards: 1 });
      if (g === 0) REV.queue.push(c.id); // ترجع آخر الجلسة
      REV.i++; REV.flipped = false; haptic(g === 0 ? 'error' : 'light');
      const n = REV.stats[2] + REV.stats[3];
      if (g >= 2 && n > 0 && n % 10 === 0) buddy(['جامد! ' + n + ' بطاقة صح 👏', 'كمّل كده 🔥', 'دماغك شغالة النهارده'][n / 10 % 3], 'happy', 2200);
      draw();
    };
    const finish = () => {
      REV.done = true;
      const mins = Math.max(1, Math.round((now() - REV.start) / 60000)); logDay({ min: mins }); Store.save(true);
      const tot = REV.stats.reduce((a, b) => a + b, 0), good = REV.stats[2] + REV.stats[3];
      box.innerHTML = '<div class="empty">' + Char.html('', 100) + '<p style="font-size:20px;color:var(--fg)"><b>خلصت ' + tot + ' بطاقة في ' + mins + ' دقيقة</b></p><p>' + good + ' كويس/سهلة · ' + REV.stats[1] + ' صعبة · ' + REV.stats[0] + ' نسيت</p><div class="btns" style="justify-content:center"><a class="btn" href="#home">الرئيسية</a><a class="btn tint" href="#quiz' + (sid ? '?s=' + sid : '') + '">اختبر نفسك</a></div></div>';
      beep('done'); haptic('success'); setTimeout(() => Char.act(box.querySelector('.char'), 'cheer'), 200);
    };
    draw();
    App.keys = e => {
      if (e.target.matches('input,textarea,select')) return;
      if (e.key === ' ' || e.key === 'Enter') { const f = $('#flash'); if (f && !REV.flipped) { e.preventDefault(); f.click(); } }
      if (REV && REV.flipped && /^[1-4]$/.test(e.key)) { const b = $('[data-g="' + (+e.key - 1) + '"]'); b && b.click(); }
    };
  });

  /* ---------- الشرح: لكل سؤال شرح، والمتوقع شرح أوسع + المفهوم + اسأل سَنَد ---------- */
  function conceptFor(q) {
    const pool = CONCEPTS.filter(c => c.s === q.s);
    const hit = E.findConcepts(pool, q.q + ' ' + (q.explain || ''));
    return hit.find(c => c.l === q.l) || hit[0] || pool.find(c => c.l === q.l) || null;
  }
  App.conceptFor = conceptFor;
  const optConcept = (q, text) => { const n = E.norm(text); return CONCEPTS.find(c => c.s === q.s && [c.k].concat(c.alt || []).some(a => E.norm(a) === n)); };
  /** تفرعات السؤال: كل اختيار غلط كان هيبقى صح إمتى */
  function branches(q, picked) {
    if (q.type !== 'mcq') return [];
    const out = [];
    q.options.forEach((o, i) => {
      if (i === q.answer) return;
      let t = q.on && q.on[i];
      if (!t) { const c = optConcept(q, o); if (c) t = 'لو السؤال عن: ' + String(c.def).split(/(?<=[.؛])\s/)[0]; }
      if (t) out.push({ i, o, t, mine: picked === i });
    });
    return out.sort((a, b) => (b.mine ? 1 : 0) - (a.mine ? 1 : 0));
  }
  App.branches = branches;
  function explainHTML(q, wrong, compact, picked) {
    const c = conceptFor(q), l = LESSONS[q.l];
    let h = '';
    if (q.fix && q.type === 'tf' && !q.answer) h += '<div class="xp-fix">✅ العبارة الصح: ' + esc(q.fix) + '</div>';
    const br = branches(q, picked);
    if (compact) { const m = br.find(b => b.mine); if (m) h += '<div class="xp-br one">🔀 «' + esc(m.o) + '» كانت تبقى صح ' + esc(m.t) + '</div>'; }
    if (q.explain) h += '<div class="xp' + (q.star ? ' big' : '') + '">' + (q.star && !compact ? '<div class="xp-h">⭐ الشرح المفصل</div>' : '') + esc(q.explain) + '</div>';
    if (q.star && q.why && compact) h += '<div class="xp-why">⭐ ' + esc(q.why) + '</div>';
    if (c && (q.star || wrong) && !compact) {
      h += '<div class="xp-c"><b>افتكر: ' + esc(c.k) + '</b><div>' + esc(c.def) + '</div>' + (c.err ? '<div class="xp-err">⚠️ الغلطة المشهورة: ' + esc(c.err) + '</div>' : '') + '</div>';
    }
    if (!compact) {
      if (br.length) h += '<div class="xp-br"><b>🔀 باقي الاختيارات بتبقى صح إمتى؟</b><ul>' + br.map(b => '<li' + (b.mine ? ' class="mine"' : '') + '><b>' + esc(b.o) + (b.mine ? ' (اختيارك)' : '') + ':</b> ' + esc(b.t) + '</li>').join('') + '</ul></div>';
      if (q.vars && q.vars.length) h += '<div class="xp-var"><b>🧩 ممكن ييجي كده كمان</b><ul>' + q.vars.map(v => '<li>' + esc(v) + '</li>').join('') + '</ul></div>';
      if (q.keys && q.keys.length) h += '<div class="xp-keys"><b>🔑 الكلمات المفتاحية:</b> ' + q.keys.map(k => '<span class="pill">' + esc(k) + '</span>').join(' ') + '</div>';
    }
    if (q.ext) h += '<div class="xp-ext">📘 الإجابة دي مش مكتوبة في الشرائح، كمّلتها من مراجع التسويق العامة. طابقها بكتابك.</div>';
    h += '<div class="xp-acts">' + (c ? '<button class="btn sm tint" data-ask=""' + esc('اشرحلي ' + c.k) + '">' + icon('chat') + 'مش فاهم؟ اسأل ' + esc(D().charName) + '</button>' : '') + (l && (wrong || q.star) ? '<a class="btn sm gray" href="#lesson/' + l.id + '">' + esc(compact ? 'الدرس' : 'راجع الدرس: ' + l.title) + '</a>' : '') + '</div>';
    return h;
  }
  function bindExplain(root) { $$('[data-ask]', root).forEach(b => b.onclick = e => { e.preventDefault(); App.pendingSay = b.dataset.ask; Router.go('chat'); }); }
  App.explainHTML = explainHTML; App.bindExplain = bindExplain;

  /* ---------- الامتحان ---------- */
  let QZ = null;
  function pickQuestions(sids, lid, n, star, sc) {
    const d = D(); let pool = allQuestions().filter(q => (lid ? q.l === lid : sids.includes(q.s)) && (!star || q.star) && (lid || !sc || sc === 'all' || inSc(q.l, sc)));
    const stat = {}; for (const a of d.attempts) { const x = stat[a.q] || (stat[a.q] = { n: 0, bad: 0, last: 0 }); x.n++; if (!a.ok) x.bad++; x.last = Math.max(x.last, a.t); }
    const weighted = pool.map(q => { const st = stat[q.id]; let w = 1; if (!st) w += 1.5; else { w += st.bad * 2 - (st.n - st.bad) * 0.6; if (now() - st.last < 3600e3) w -= 1; } w += (1 - lessonProgress(q.l)) * 1.5; if (q.star) w += 0.8; return { q, w: Math.max(0.15, w) * (0.6 + Math.random()) }; });
    weighted.sort((a, b) => b.w - a.w);
    return weighted.slice(0, n).map(x => x.q).sort(() => Math.random() - 0.5);
  }
  Router.on('quiz', (view, r) => {
    if (QZ && !QZ.finished && r.q.run) return runQuiz(view);
    if (QZ && QZ.finished && r.q.result) return quizResult(view);
    const pre = r.q;
    if (pre.go) {
      const lid0 = pre.l && LESSONS[pre.l] ? pre.l : null, sel0 = lid0 ? [LESSONS[lid0].s] : pre.s ? pre.s.split(',').filter(S) : SUBJ.map(s => s.id);
      const st0 = !!pre.star, sc0 = pre.sc || 'all'; return startQuiz(pickQuestions(sel0, lid0, +pre.n || D().settings.quizCount || 10, st0, sc0), pre.mode === 'exam' ? 'exam' : 'practice', { lid: lid0, sel: sel0, star: st0, sc: sc0 });
    }
    header(view, 'امتحني', { sub: 'أسئلة اختيار وصح وغلط وأكمل ومسائل، وبتركز على الحاجات اللي بتغلط فيها' });
    const lid = pre.l && LESSONS[pre.l] ? pre.l : null;
    let sel = lid ? [LESSONS[lid].s] : pre.s ? pre.s.split(',').filter(S) : SUBJ.map(s => s.id);
    let n = +pre.n || D().settings.quizCount || 10, mode = pre.mode || (D().settings.timer ? 'exam' : 'practice'), star = !!pre.star, sc = pre.sc || 'all';
    const box = document.createElement('div'); view.appendChild(box);
    const draw = () => {
      const avail = (lid ? questionsOf(null, lid) : allQuestions().filter(q => sel.includes(q.s) && (sc === 'all' || inSc(q.l, sc)))).filter(q => !star || q.star).length;
      const noMid = !lid && sc === 'mid' && sel.some(x => !hasMid(x));
      box.innerHTML = (lid ? '<div class="card mb"><b>' + esc(LESSONS[lid].title) + '</b><div class="note">' + esc(S(LESSONS[lid].s).name) + ' — ' + avail + ' سؤال</div></div>' :
        '<div class="group-h">المواد</div><div class="group">' + SUBJ.map(s => '<label class="row tap">' + subjIcon(s) + '<span class="tx"><b>' + esc(s.name) + '</b><small>' + questionsOf(s.id).length + ' سؤال</small></span><span class="switch"><input type="checkbox" data-s="' + s.id + '" ' + (sel.includes(s.id) ? 'checked' : '') + '><span></span></span></label>').join('') + '</div>')
        + (lid ? '' : '<div class="group-h">المنهج</div><div class="seg">' + ['all', 'mid', 'final'].map(k => '<button data-sc="' + k + '" class="' + (k === sc ? 'on' : '') + '">' + (k === 'all' ? 'الكل' : SCN[k]) + '</button>').join('') + '</div>'
          + (noMid ? '<p class="group-f warn-t" style="margin-top:-8px">فيه مواد لسه ماحددتش منهج الميدترم بتاعها. حدده من صفحة المادة ← الدروس ← «حدد الميدترم والفاينال».</p>' : ''))
        + '<div class="group-h">نوع الأسئلة</div><div class="seg"><button data-st="0" class="' + (star ? '' : 'on') + '">كل الأسئلة</button><button data-st="1" class="' + (star ? 'on' : '') + '">⭐ المتوقع بس</button></div>'
        + (star ? '<p class="group-f" style="margin-top:-8px">الأسئلة اللي عليها نجمة: متكررة في المحاضرات والسكاشن أو أمثلة الدكتور نفسها، وكل واحد معاه سبب أهميته وشرح مفصل.</p>' : '')
        + '<div class="group-h">عدد الأسئلة</div><div class="seg">' + [5, 10, 20, 30, 999].map(k => '<button data-n="' + k + '" class="' + (k === n ? 'on' : '') + '">' + (k === 999 ? 'الكل' : k) + '</button>').join('') + '</div>'
        + '<div class="group-h">النظام</div><div class="seg"><button data-m="practice" class="' + (mode === 'practice' ? 'on' : '') + '">تدريب (تصحيح فوري)</button><button data-m="exam" class="' + (mode === 'exam' ? 'on' : '') + '">امتحان بوقت</button></div>'
        + '<p class="group-f" style="margin-top:-8px">' + (mode === 'exam' ? 'دقيقة ونص لكل سؤال، والتصحيح في الآخر زي الامتحان الحقيقي.' : 'بعد كل سؤال هتعرف الصح والشرح.') + '</p>'
        + '<button class="btn block" id="go" ' + (avail ? '' : 'disabled') + '>' + icon('play') + 'ابدأ (' + Math.min(n, avail) + ' سؤال)</button>'
        + '<button class="btn block tint mt" id="shareX" ' + (avail ? '' : 'disabled') + '>' + icon('share') + 'ابعت الامتحان ده لصاحبك بلينك</button>'
        + App.sentListHTML();
      $$('[data-s]', box).forEach(i => i.onchange = () => { sel = $$('[data-s]', box).filter(x => x.checked).map(x => x.dataset.s); draw(); });
      $$('[data-n]', box).forEach(b => b.onclick = () => { n = +b.dataset.n; draw(); });
      $$('[data-m]', box).forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
      $$('[data-st]', box).forEach(b => b.onclick = () => { star = b.dataset.st === '1'; draw(); });
      $$('[data-sc]', box).forEach(b => b.onclick = () => { sc = b.dataset.sc; draw(); });
      $('#shareX').onclick = () => App.shareSheet({ sel, lid, n, star, sc, mode });
      $('#go').onclick = () => startQuiz(pickQuestions(sel, lid, n, star, sc), mode, { lid, sel, star, sc });
    };
    draw();
  });
  function startQuiz(qs, mode, meta) {
    if (!qs.length) return toast('مفيش أسئلة');
    QZ = { qs: qs.map(q => ({ q, ans: null, res: null, shown: false })), i: 0, mode, meta, start: now(), limit: mode === 'exam' ? ((meta && meta.limit) || qs.length * 90) : 0, finished: false, streak: 0 };
    Router.go('quiz?run=1');
  }
  App.startQuiz = startQuiz;
  function runQuiz(view) {
    header(view, QZ.mode === 'exam' ? 'امتحان' : 'تدريب', { back: { label: 'إنهاء' }, right: QZ.limit ? '<span class="pill timer-pill" id="tmr"></span>' : '' });
    view.querySelector('[data-back]').onclick = async () => { if (await confirmBox('تنهي الامتحان دلوقتي وتشوف النتيجة؟', { ok: 'أنهي' })) finishQuiz(); };
    const box = document.createElement('div'); view.appendChild(box);
    if (QZ.limit) {
      const tick = () => { const left = QZ.limit - Math.floor((now() - QZ.start) / 1000); const t = $('#tmr'); if (!t) return clearInterval(QZ.tm); t.textContent = '⏱ ' + Math.floor(Math.max(0, left) / 60) + ':' + String(Math.max(0, left) % 60).padStart(2, '0'); if (left <= 0) { clearInterval(QZ.tm); toast('الوقت خلص'); finishQuiz(); } };
      clearInterval(QZ.tm); QZ.tm = setInterval(tick, 1000); tick();
    }
    const draw = () => {
      const it = QZ.qs[QZ.i], q = it.q, l = LESSONS[q.l];
      const opts = q.type === 'tf' ? ['صح', 'غلط'] : q.options;
      let html = '<div class="progress-top"><span class="num">' + (QZ.i + 1) + '/' + QZ.qs.length + '</span><div class="bar"><i style="width:' + (QZ.i / QZ.qs.length * 100) + '%"></i></div></div>';
      html += '<div class="qcard' + (q.star ? ' starred' : '') + '"><div style="display:flex;gap:6px;flex-wrap:wrap">' + (S(q.s) ? '<span class="pill acc">' + esc(S(q.s).short) + '</span>' : '') + (l ? '<span class="pill">' + esc(l.title) + '</span>' : '') + (q.star ? '<span class="pill star">⭐ هام</span>' : '') + '</div>';
      if (q.star) html += '<div class="star-say">' + Char.html('', 40) + '<div class="bubble"><b>ركّز هنا، ده سؤال هام ⭐</b>' + (q.why ? '<br>' + esc(q.why) : '') + '</div></div>';
      html += '<div class="q">' + esc(q.q) + '</div>';
      if (q.type === 'mcq' || q.type === 'tf') html += '<div class="opts">' + opts.map((o, i) => '<button class="opt" data-o="' + i + '"><span class="k">' + (q.type === 'tf' ? (i ? '✗' : '✓') : 'أبجد'[i]) + '</span><span>' + esc(o) + '</span></button>').join('') + '</div>';
      else html += '<form id="fillF"><input class="input" id="fillIn" ' + (q.type === 'num' ? 'inputmode="decimal" dir="ltr" placeholder="اكتب الرقم"' : 'placeholder="اكتب الإجابة"') + ' autocomplete="off" enterkeyhint="done"><button class="btn block mt">' + (QZ.mode === 'exam' ? 'التالي' : 'صحّح') + '</button></form>';
      html += '<div id="fb"></div></div><div class="btns" id="nav"></div>';
      box.innerHTML = html;
      const answer = val => {
        if (it.shown) return;
        it.ans = val;
        let res;
        if (q.type === 'tf') res = E.grade(q, val === 0);
        else res = E.grade(q, val);
        it.res = res;
        const d = D(); if (S(q.s) && LESSONS[q.l]) d.attempts.push({ q: q.id, s: q.s, l: q.l, ok: !!res.ok, t: now() }); logDay({ q: 1, ok: res.ok ? 1 : 0 });
        if (QZ.mode === 'exam') { it.shown = true; return next(); }
        it.shown = true; reveal();
        if (self.Pal) Pal.react(res.ok ? 'ok' : 'bad', QZ.streak + (res.ok ? 1 : 0));
        if (res.ok) { QZ.streak++; beep('ok'); haptic('success'); if (QZ.streak === 3 || QZ.streak === 6 || QZ.streak === 10) buddy(['3 ورا بعض! 🔥', '6 صح ورا بعض، إيه الحلاوة دي', '10 صح! أنت جاهز للامتحان 💪'][[3, 6, 10].indexOf(QZ.streak)], 'fire', 2200); }
        else { QZ.streak = 0; beep('bad'); haptic('error'); box.querySelector('.qcard').classList.add('shake'); }
      };
      const reveal = () => {
        const res = it.res;
        if (q.type === 'mcq' || q.type === 'tf') {
          const correct = q.type === 'tf' ? (q.answer ? 0 : 1) : q.answer;
          $$('.opt', box).forEach((b, i) => { b.disabled = true; if (i === correct) b.classList.add('ok'); else if (i === it.ans) b.classList.add('bad'); });
        } else { const f = $('#fillIn'); if (f) { f.value = it.ans; f.disabled = true; } }
        const right = q.type === 'tf' ? (q.answer ? 'صح' : 'غلط') : q.type === 'mcq' ? q.options[q.answer] : String(q.type === 'num' ? E.fmt(q.answer, 4) : q.answer);
        $('#fb').innerHTML = '<div class="feedback ' + (res.ok ? 'ok' : 'bad') + '"><b>' + (res.ok ? (res.close ? 'صح (فيه غلطة إملائية بسيطة)' : 'صح 👏') : 'غلط — الإجابة: ' + esc(right)) + '</b>' + explainHTML(q, !res.ok, false, q.type === 'mcq' && !res.ok ? it.ans : undefined) + '</div>';
        bindExplain($('#fb'));
        $('#nav').innerHTML = '<button class="btn block" id="nextB">' + (QZ.i < QZ.qs.length - 1 ? 'السؤال اللي بعده' : 'النتيجة') + '</button>';
        $('#nextB').onclick = next; $('#nextB').focus({ preventScroll: true });
      };
      const next = () => { if (QZ.i < QZ.qs.length - 1) { QZ.i++; draw(); window.scrollTo({ top: 0, behavior: 'smooth' }); } else finishQuiz(); };
      $$('.opt', box).forEach(b => b.onclick = () => answer(+b.dataset.o));
      const ff = $('#fillF'); if (ff) ff.onsubmit = e => { e.preventDefault(); const v = $('#fillIn').value.trim(); if (!v) return $('#fillIn').focus(); answer(v); };
      if (it.shown && QZ.mode !== 'exam') reveal();
    };
    draw();
    App.keys = e => { if (e.target.matches('input,textarea')) return; const k = { '1': 0, '2': 1, '3': 2, '4': 3 }[e.key]; if (k != null) { const b = $('[data-o="' + k + '"]'); b && b.click(); } if (e.key === 'Enter') { const n = $('#nextB'); n && n.click(); } };
  }
  function finishQuiz() {
    clearInterval(QZ.tm);
    QZ.qs.forEach(it => { if (!it.shown) { it.res = { ok: false }; it.skipped = true; } });
    QZ.finished = true; QZ.end = now();
    if (App.onQuizFinish) App.onQuizFinish(QZ);
    logDay({ min: Math.max(1, Math.round((QZ.end - QZ.start) / 60000)) }); Store.save(true);
    Router.go('quiz?result=1', { replace: true });
  }
  function quizResult(view) {
    header(view, 'النتيجة', { back: { to: 'quiz', label: 'امتحان جديد' } });
    const tot = QZ.qs.length, ok = QZ.qs.filter(x => x.res && x.res.ok).length, p = ok / tot;
    const byL = {}; QZ.qs.forEach(it => { const k = it.q.l; const x = byL[k] || (byL[k] = { n: 0, ok: 0 }); x.n++; if (it.res.ok) x.ok++; });
    const msg = p >= 0.9 ? 'إيه ده! ممتاز جدًا 🏆' : p >= 0.75 ? 'شغل حلو أوي 👏 فاضل حبة تفاصيل.' : p >= 0.5 ? 'نص الطريق. ركز على الدروس اللي تحت دي.' : 'ولا يهمك، الغلط هنا أحسن من الغلط في الامتحان. يلا نراجع الدروس دي.';
    let html = '<div class="result-big">' + ring(p, 110, p >= 0.75 ? 'var(--green)' : p >= 0.5 ? 'var(--orange)' : 'var(--red)') + '<div><div style="font-size:22px;font-weight:700"><span class="num">' + ok + '/' + tot + '</span></div><div class="note">' + (Math.round((QZ.end - QZ.start) / 60000) < 1 ? 'أقل من دقيقة' : Math.round((QZ.end - QZ.start) / 60000) + ' دقيقة') + '</div></div></div>';
    html += '<div class="hero">' + Char.html('', 70) + '<div class="bubble">' + esc(msg) + '</div></div>';
    if (QZ.meta.share) html += App.takeResultHTML(QZ);
    html += '<div class="group-h">حسب الدرس</div><div class="group">' + Object.entries(byL).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n).map(([lid, x]) => { const l = LESSONS[lid]; return '<a class="row tap" href="#lesson/' + lid + '">' + ring(x.ok / x.n, 34, x.ok / x.n >= 0.75 ? 'var(--green)' : x.ok / x.n >= 0.5 ? 'var(--orange)' : 'var(--red)') + '<span class="tx"><b>' + esc(l ? l.title : lid) + '</b><small>' + x.ok + ' من ' + x.n + '</small></span>' + icon('chev', 'chev') + '</a>'; }).join('') + '</div>';
    const wrong = QZ.qs.filter(x => !x.res.ok);
    if (wrong.length) {
      html += '<div class="group-h">الأسئلة اللي غلطت فيها</div><div class="group">' + wrong.map(it => { const q = it.q; const right = q.type === 'tf' ? (q.answer ? 'صح' : 'غلط') : q.type === 'mcq' ? q.options[q.answer] : (q.type === 'num' ? E.fmt(q.answer, 4) : q.answer); const mine = it.skipped ? 'ماجاوبتش' : q.type === 'tf' ? (it.ans === 0 ? 'صح' : 'غلط') : q.type === 'mcq' ? q.options[it.ans] : it.ans; return '<div class="row noicon"><span class="tx"><b style="font-size:15px">' + esc(q.q) + '</b><small><span class="check-bad">إجابتك: ' + esc(mine) + '</span> · <span class="check-ok">الصح: ' + esc(right) + '</span>' + '</small>' + explainHTML(q, true, true, q.type === 'mcq' && !it.skipped ? it.ans : undefined) + '</span></div>'; }).join('') + '</div>';
      html += '<button class="btn block" id="redo">' + icon('reset') + 'عيد الأسئلة اللي غلطت فيها</button>';
    }
    html += '<div class="btns mt"><button class="btn tint" id="again">' + (QZ.meta.share ? 'حله تاني' : 'امتحان تاني بنفس الإعدادات') + '</button>' + (QZ.meta.share ? '' : '<button class="btn tint" id="shareSame">' + icon('share') + 'ابعت نفس الأسئلة لصاحبك</button>') + '<a class="btn gray" href="#home">الرئيسية</a></div>';
    if (QZ.meta.marathon) html += '<a class="btn block mt" href="#marathon/' + QZ.meta.marathon + '">⭐ ارجع للماراثون وكمّل</a>';
    view.insertAdjacentHTML('beforeend', html);
    bindExplain(view);
    if (QZ.meta.share) App.bindTakeResult(view, QZ);
    const sS = $('#shareSame'); if (sS) sS.onclick = () => App.shareSheet({ fixed: QZ.qs.map(x => x.q), mode: QZ.mode, title: QZ.meta.lid ? 'امتحان ' + LESSONS[QZ.meta.lid].title : '' });
    const R = $('#redo'); if (R) R.onclick = () => startQuiz(wrong.map(x => x.q), QZ.mode, QZ.meta);
    $('#again').onclick = () => startQuiz(QZ.meta.share ? QZ.qs.map(x => x.q) : pickQuestions(QZ.meta.sel || [], QZ.meta.lid, QZ.qs.length, QZ.meta.star, QZ.meta.sc), QZ.mode, QZ.meta);
    setTimeout(() => { Char.act(view.querySelector('.hero .char'), p >= 0.75 ? 'cheer' : p >= 0.5 ? 'nod' : 'sad'); if (p >= 0.75) beep('done'); }, 300);
  }

  /* ---------- ورقات الإضافة ---------- */
  App.cardSheet = c => {
    if (!SUBJ.length) { toast('ضيف مادة الأول'); return Router.go('subjects'); }
    const isEdit = !!c.id;
    const body = U.el('<div><label class="field"><span>المادة</span><select class="input" id="cs">' + SUBJ.map(s => '<option value="' + s.id + '"' + (s.id === c.s ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('') + '</select></label><label class="field"><span>الدرس (اختياري)</span><select class="input" id="cl"></select></label><label class="field"><span>الوش (السؤال)</span><textarea class="input" id="cf" placeholder="مثال: صافي الأصول">' + esc(c.front || '') + '</textarea></label><label class="field"><span>الضهر (الإجابة)</span><textarea class="input" id="cb" placeholder="مثال: إجمالي الأصول − إجمالي الخصوم">' + esc(c.back || '') + '</textarea></label>' + (isEdit ? '<button class="btn block danger" id="cdel">' + icon('trash') + 'امسح البطاقة</button>' : '') + '</div>');
    const fillL = () => { const s = S(body.querySelector('#cs').value); body.querySelector('#cl').innerHTML = '<option value="">—</option>' + s.lessons.map(l => '<option value="' + l.id + '"' + (l.id === c.l ? ' selected' : '') + '>' + esc(l.title) + '</option>').join(''); };
    body.querySelector('#cs').onchange = fillL; fillL();
    const sh = sheet({ title: isEdit ? 'تعديل بطاقة' : 'بطاقة جديدة', body, doneText: 'حفظ', done: () => {
      const f = body.querySelector('#cf').value.trim(), b = body.querySelector('#cb').value.trim(); if (!f || !b) { toast('اكتب الوش والضهر'); return false; }
      const d = D(), o = { id: c.id || E.uid('cc'), s: body.querySelector('#cs').value, l: body.querySelector('#cl').value || null, front: f, back: b };
      if (isEdit) d.custom.cards = d.custom.cards.map(x => x.id === o.id ? o : x); else d.custom.cards.push(o);
      Store.save(); toast('اتحفظت', 'check'); Router.render();
    } });
    const del = body.querySelector('#cdel'); if (del) del.onclick = () => { const d = D(); d.custom.cards = d.custom.cards.filter(x => x.id !== c.id); delete d.srs[c.id]; Store.save(); sh.close(); Router.render(); };
  };
  App.questionSheet = c => {
    if (!SUBJ.length) { toast('ضيف مادة الأول'); return Router.go('subjects'); }
    const body = U.el('<div><label class="field"><span>المادة</span><select class="input" id="qs">' + SUBJ.map(s => '<option value="' + s.id + '"' + (s.id === c.s ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('') + '</select></label><label class="field"><span>الدرس</span><select class="input" id="ql"></select></label><div class="seg" id="qt"><button data-t="mcq" class="on">اختيار</button><button data-t="tf">صح وغلط</button><button data-t="fill">أكمل</button><button data-t="num">رقم</button></div><label class="field"><span>السؤال</span><textarea class="input" id="qq"></textarea></label><div id="qa"></div></div>');
    let t = 'mcq';
    const fillL = () => { const s = S(body.querySelector('#qs').value); body.querySelector('#ql').innerHTML = '<option value="">—</option>' + s.lessons.map(l => '<option value="' + l.id + '"' + (l.id === c.l ? ' selected' : '') + '>' + esc(l.title) + '</option>').join(''); };
    body.appendChild(U.el('<div><label class="field"><span>الشرح (اختياري — بيظهر بعد الإجابة)</span><textarea class="input" id="qe" placeholder="ليه دي الإجابة الصح؟"></textarea></label><label class="row noicon" style="border-radius:12px;background:var(--bg2);margin-bottom:12px"><span class="tx"><b>⭐ سؤال متوقع / هام</b><small>الشخصية هتنبّه عليه في الامتحان</small></span><span class="switch"><input type="checkbox" id="qx"><span></span></span></label></div>'));
    const fillA = () => {
      const qa = body.querySelector('#qa');
      if (t === 'mcq') qa.innerHTML = [0, 1, 2, 3].map(i => '<label class="field" style="display:flex;gap:8px;align-items:center"><input type="radio" name="qc" value="' + i + '"' + (i ? '' : ' checked') + ' aria-label="الإجابة الصح"><input class="input" data-op="' + i + '" placeholder="اختيار ' + (i + 1) + '"></label>').join('') + '<p class="note">علّم على الاختيار الصح.</p>';
      else if (t === 'tf') qa.innerHTML = '<div class="seg"><button data-tf="1" class="on">صح</button><button data-tf="0">غلط</button></div>';
      else qa.innerHTML = '<label class="field"><span>الإجابة الصح</span><input class="input" id="qans"' + (t === 'num' ? ' inputmode="decimal" dir="ltr"' : '') + '></label>';
      $$('[data-tf]', qa).forEach(b => b.onclick = () => { $$('[data-tf]', qa).forEach(x => x.classList.toggle('on', x === b)); });
    };
    body.querySelector('#qs').onchange = fillL; fillL(); fillA();
    $$('[data-t]', body).forEach(b => b.onclick = () => { t = b.dataset.t; $$('[data-t]', body).forEach(x => x.classList.toggle('on', x === b)); fillA(); });
    sheet({ title: 'سؤال جديد', body, doneText: 'حفظ', done: () => {
      const q = body.querySelector('#qq').value.trim(); if (!q) { toast('اكتب السؤال'); return false; }
      const o = { id: E.uid('cq'), s: body.querySelector('#qs').value, l: body.querySelector('#ql').value || null, type: t, q };
      const xe = body.querySelector('#qe').value.trim(); if (xe) o.explain = xe; if (body.querySelector('#qx').checked) { o.star = true; o.why = 'إنت معلّم عليه إنه هام.'; }
      if (t === 'mcq') { o.options = $$('[data-op]', body).map(i => i.value.trim()).filter(Boolean); o.answer = +body.querySelector('input[name=qc]:checked').value; if (o.options.length < 2 || o.answer >= o.options.length) { toast('اكتب اختيارين على الأقل وعلّم الصح'); return false; } }
      else if (t === 'tf') o.answer = $('[data-tf].on', body).dataset.tf === '1';
      else { const a = body.querySelector('#qans').value.trim(); if (!a) { toast('اكتب الإجابة'); return false; } o.answer = t === 'num' ? E.parseNumber(a) : a; if (t === 'num' && isNaN(o.answer)) { toast('الإجابة لازم تبقى رقم'); return false; } }
      D().custom.questions.push(o); Store.save(); toast('السؤال اتضاف', 'check'); Router.render();
    } });
  };
  /* ---------- المواد والمحاضرات بتاعتك ---------- */
  const KINDS = ['نظري', 'عملي', 'عملي + نظري'];
  App.subjectSheet = (x = null) => {
    const d = D(), isEdit = !!x;
    let kind = isEdit ? x.kind : 'نظري', color = isEdit ? x.color : COLORS[(d.subjects || []).length % COLORS.length];
    const body = U.el('<div><label class="field"><span>اسم المادة</span><input class="input" id="sbN" maxlength="60" placeholder="مثال: محاسبة شركات أشخاص" value="' + esc(isEdit ? x.name : '') + '"></label>'
      + '<label class="field"><span>اسم مختصر (اختياري — بيظهر في الأماكن الصغيرة)</span><input class="input" id="sbS" maxlength="20" placeholder="مثال: محاسبة" value="' + esc(isEdit && x.short !== x.name ? x.short : '') + '"></label>'
      + '<div class="group-h" style="margin-top:4px">النوع</div><div class="seg" id="sbK"></div><div class="group-h">اللون</div><div class="colors" id="sbC"></div>'
      + (isEdit ? '<button class="btn block danger mt" id="sbDel">' + icon('trash') + 'امسح المادة</button>' : '') + '</div>');
    const draw = () => {
      body.querySelector('#sbK').innerHTML = KINDS.map(k => '<button type="button" data-k="' + k + '" class="' + (k === kind ? 'on' : '') + '">' + k + '</button>').join('');
      body.querySelector('#sbC').innerHTML = COLORS.map(c => '<button type="button" class="dot bg-' + c + (c === color ? ' on' : '') + '" data-c="' + c + '" aria-label="' + c + '"></button>').join('');
      $$('[data-k]', body).forEach(b => b.onclick = () => { kind = b.dataset.k; draw(); });
      $$('[data-c]', body).forEach(b => b.onclick = () => { color = b.dataset.c; haptic(); draw(); });
    };
    draw();
    const sh = sheet({ title: isEdit ? 'تعديل المادة' : 'مادة جديدة', body, doneText: 'حفظ', done: () => {
      const name = body.querySelector('#sbN').value.trim(); if (!name) { toast('اكتب اسم المادة'); return false; }
      const short = body.querySelector('#sbS').value.trim() || name;
      d.subjects = d.subjects || [];
      if (isEdit) { const o = d.subjects.find(y => y.id === x.id); Object.assign(o, { name, short, kind, color }); }
      else { const o = { id: E.uid('s'), name, short, kind, color, lessons: [] }; d.subjects.push(o); x = o; }
      Store.save(); refreshSubjects(); toast(isEdit ? 'اتعدلت' : 'المادة اتضافت، يلا ضيف محاضراتها', 'check'); haptic('success');
      Router.go('subject/' + x.id + '?tab=lessons', { replace: isEdit });
    } });
    const del = body.querySelector('#sbDel');
    if (del) del.onclick = async () => {
      if (!await confirmBox('هتتمسح مادة «' + x.name + '» بكل محاضراتها وبطاقاتها وأسئلتها وامتحاناتها المتسجلة. متأكد؟', { ok: 'امسح', danger: true })) return;
      removeSubjects([x.id]); sh.close(); toast('المادة اتمسحت', 'trash'); Router.go('subjects', { replace: true });
    };
    setTimeout(() => { const n = body.querySelector('#sbN'); if (n && !isEdit) n.focus(); }, 350);
  };
  /** يمسح مواد وكل حاجة مربوطة بيها */
  function removeSubjects(ids) {
    const d = D(), gone = new Set(ids), lessons = new Set();
    (d.subjects || []).filter(x => gone.has(x.id)).forEach(x => x.lessons.forEach(l => lessons.add(l.id)));
    d.subjects = (d.subjects || []).filter(x => !gone.has(x.id));
    pruneData(id => !gone.has(id), l => !lessons.has(l));
    Store.save(); refreshSubjects();
  }
  /** بيشيل أي بيانات بتشاور على مادة أو محاضرة مش موجودة */
  function pruneData(okS, okL) {
    const d = D(), cards = new Set();
    d.custom.cards = d.custom.cards.filter(c => okS(c.s)); d.custom.questions = d.custom.questions.filter(q => okS(q.s));
    d.custom.cards.forEach(c => { if (c.l && !okL(c.l)) c.l = null; }); d.custom.questions.forEach(q => { if (q.l && !okL(q.l)) q.l = null; });
    d.custom.cards.forEach(c => cards.add(c.id)); BUILT_CARDS.forEach(c => cards.add(c.id));
    Object.keys(d.srs).forEach(k => { if (!cards.has(k)) delete d.srs[k]; });
    d.exams = d.exams.filter(e => okS(e.subject));
    d.attempts = d.attempts.filter(a => okS(a.s) && okL(a.l));
    d.notes.forEach(n => { if (n.s && !okS(n.s)) n.s = null; if (n.l && !okL(n.l)) n.l = null; });
    ['scope', 'lessonsDone', 'lessonsRead'].forEach(k => Object.keys(d[k] || {}).forEach(l => { if (!okL(l)) delete d[k][l]; }));
  }
  /** تنضيف مرة واحدة بعد ما المنهج القديم اتشال من البرنامج */
  App.migrate = () => {
    const d = D(); if (!d || d.v >= 2) return;
    refreshSubjects();
    pruneData(id => !!S(id), l => !!LESSONS[l]);
    delete (d.dismissed || {}).accHint; d.chatCtx = null; d.v = 2; Store.save(true);
  };
  App.lessonSheet = (l = {}) => {
    const d = D(), isEdit = !!l.id, sid = l.s, subj = (d.subjects || []).find(y => y.id === sid);
    if (!subj) return toast('المادة دي مش موجودة');
    let sc = (d.scope || {})[l.id] || 'final';
    const body = U.el('<div><label class="field"><span>عنوان المحاضرة</span><input class="input" id="lT" maxlength="120" placeholder="مثال: محاضرة 3 — توزيع الأرباح" value="' + esc(l.title || '') + '"></label>'
      + '<label class="field"><span>المصدر (اختياري)</span><input class="input" id="lS" maxlength="80" placeholder="مثال: الكتاب ص 40–55 / سكشن 2" value="' + esc(l.source || '') + '"></label>'
      + '<label class="field"><span>الشرح أو الملخص</span><textarea class="input" id="lB" style="min-height:240px;line-height:1.7" placeholder="اكتب أو الصق شرح المحاضرة هنا…">' + esc(l.summary || '') + '</textarea></label>'
      + '<p class="group-f" style="margin:-6px 0 12px">تنسيق اختياري: سطر يبدأ بـ ## يبقى عنوان، و - يبقى نقطة، و 1. يبقى ترقيم، و **كلمة** تبقى غامقة.</p>'
      + '<div class="group-h">داخلة في</div><div class="seg" id="lSc"></div>'
      + (isEdit ? '<button class="btn block danger mt" id="lDel">' + icon('trash') + 'امسح المحاضرة</button>' : '') + '</div>');
    const draw = () => { body.querySelector('#lSc').innerHTML = ['mid', 'both', 'final'].map(k => '<button type="button" data-v="' + k + '" class="' + (k === sc ? 'on' : '') + '">' + (k === 'both' ? 'الاتنين' : SCN[k]) + '</button>').join(''); $$('[data-v]', body).forEach(b => b.onclick = () => { sc = b.dataset.v; draw(); }); };
    draw();
    const sh = sheet({ title: isEdit ? 'تعديل المحاضرة' : 'محاضرة جديدة — ' + subj.short, body, wide: true, doneText: 'حفظ', done: () => {
      const title = body.querySelector('#lT').value.trim(); if (!title) { toast('اكتب عنوان المحاضرة'); return false; }
      const o = isEdit ? subj.lessons.find(y => y.id === l.id) : { id: E.uid('l') };
      Object.assign(o, { title, source: body.querySelector('#lS').value.trim(), summary: body.querySelector('#lB').value.replace(/\s+$/, '') });
      if (!isEdit) subj.lessons.push(o);
      d.scope = d.scope || {}; if (sc === 'final') delete d.scope[o.id]; else d.scope[o.id] = sc;
      Store.save(); refreshSubjects(); toast(isEdit ? 'اتحفظت' : 'المحاضرة اتضافت', 'check'); haptic('success');
      Router.go('lesson/' + o.id, { replace: isEdit });
    } });
    const del = body.querySelector('#lDel');
    if (del) del.onclick = async () => {
      if (!await confirmBox('تمسح محاضرة «' + l.title + '»؟ البطاقات والأسئلة اللي عليها هتفضل في المادة.', { ok: 'امسح', danger: true })) return;
      subj.lessons = subj.lessons.filter(y => y.id !== l.id); pruneData(() => true, x => x !== l.id); Store.save(); refreshSubjects(); sh.close(); Router.go('subject/' + sid, { replace: true });
    };
    setTimeout(() => { const t = body.querySelector('#lT'); if (t && !isEdit) t.focus(); }, 350);
  };

  App.noteSheet = (n = {}) => {
    const isEdit = !!n.id;
    const body = U.el('<div><textarea class="input" id="nt" style="min-height:140px" placeholder="اكتب ملاحظتك…">' + esc(n.text || '') + '</textarea><label class="field mt"><span>المادة</span><select class="input" id="ns"><option value="">عامة</option>' + SUBJ.map(s => '<option value="' + s.id + '"' + (s.id === n.s ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('') + '</select></label>' + (isEdit ? '<button class="btn block danger" id="ndel">' + icon('trash') + 'امسح</button>' : '') + '</div>');
    const sh = sheet({ title: isEdit ? 'تعديل ملاحظة' : 'ملاحظة جديدة', body, doneText: 'حفظ', done: () => {
      const t = body.querySelector('#nt').value.trim(); if (!t) return false;
      const d = D(); const o = Object.assign({}, n, { id: n.id || E.uid('n'), text: t, s: body.querySelector('#ns').value || null, t: n.t || now() });
      if (isEdit) d.notes = d.notes.map(x => x.id === o.id ? o : x); else d.notes.unshift(o);
      Store.save(); toast('اتسجلت', 'check'); if (Router.cur.name !== 'chat') Router.render();
    } });
    const del = body.querySelector('#ndel'); if (del) del.onclick = () => { const d = D(); d.notes = d.notes.filter(x => x.id !== n.id); Store.save(); sh.close(); Router.render(); };
  };
  Router.on('notes', view => {
    header(view, 'ملاحظاتي', { back: { to: 'home', label: 'الرئيسية' }, right: '<button class="btn-nav" id="addN" aria-label="ملاحظة جديدة">' + icon('plus') + '</button>' });
    const ns = D().notes;
    view.insertAdjacentHTML('beforeend', ns.length ? '<div class="group">' + ns.map(n => '<button class="row noicon" data-n="' + n.id + '"><span class="tx"><b style="font-weight:400;white-space:pre-wrap">' + esc(n.text) + '</b><small>' + (n.s ? esc(S(n.s).short) + ' · ' : '') + esc(E.prettyDate(n.t)) + (n.l && LESSONS[n.l] ? ' · ' + esc(LESSONS[n.l].title) : '') + '</small></span></button>').join('') + '</div>' : '<div class="empty">' + Char.html('', 80) + '<p>مفيش ملاحظات لسه. اكتب أي حاجة عايز تفتكرها، أو قولّي في المحادثة «سجل ملاحظة: …».</p></div>');
    $('#addN').onclick = () => App.noteSheet();
    $$('[data-n]').forEach(b => b.onclick = () => App.noteSheet(D().notes.find(x => x.id === b.dataset.n)));
  });

  /* ---------- المحادثة ---------- */
  Router.on('chat', view => {
    const d = D();
    header(view, d.charName, { back: { to: 'home', label: 'الرئيسية' }, right: '<button class="btn-nav" id="clr" aria-label="مسح المحادثة">' + icon('trash') + '</button>' });
    view.insertAdjacentHTML('beforeend', '<div class="chat" id="chatBox" aria-live="polite"></div><form class="ask" id="chatF" style="position:sticky;bottom:calc(var(--tab-h) + var(--safe-b) + 10px);margin-top:10px"><input id="chatIn" placeholder="اكتب بالعامية…" autocomplete="off" enterkeyhint="send" aria-label="رسالتك"><button class="send" aria-label="إرسال">' + icon('send') + '</button></form><div class="chips" style="margin-top:0" id="sugg"></div>');
    const box = $('#chatBox');
    const sugg = BUILT.length ? ['ذاكرلي', 'إيه أهم الأسئلة المتوقعة؟', 'وريني الرسومات', 'قسملي خطة', 'مراجعة نهائية', 'امتحني 5 أسئلة', 'إيه أضعف حاجة عندي؟', 'يعني إيه المزيج التسويقي؟'] : ['امتحني 5 أسئلة', 'عايز أراجع', 'إيه أضعف حاجة عندي؟', 'أذاكر إيه النهارده؟', 'احسب الوسط ل 4 8 15 16 23 42', 'سجل ملاحظة: أراجع قيود الشهرة'];
    $('#sugg').innerHTML = sugg.map(s => '<button class="chip" data-say="' + esc(s) + '">' + esc(s) + '</button>').join('');
    const renderAll = () => { box.innerHTML = ''; if (!d.chat.length) addBot(Brain.hello(), [], false); else d.chat.forEach(m => m.who === 'me' ? addMe(m.text, false) : addBot(m.text, m.acts || [], false)); };
    function addMe(text, save = true) { box.insertAdjacentHTML('beforeend', '<div class="msg me">' + esc(text) + '</div>'); if (save) { d.chat.push({ who: 'me', text, t: now() }); Store.save(); } }
    function addBot(text, acts = [], save = true, mood) {
      const links = acts.filter(a => a.href), says = acts.filter(a => a.say);
      const row = U.el('<div class="bot-row">' + Char.html('', 34) + '<div class="msg bot">' + text + (links.length ? '<div class="acts">' + links.map((a, i) => '<a class="btn ' + (i ? 'tint' : '') + '" href="' + esc(a.href) + '">' + esc(a.label) + '</a>').join('') + '</div>' : '') + (says.length ? '<div class="says">' + says.map(a => '<button class="chip" data-say="' + esc(a.say) + '">' + esc(a.label || a.say) + '</button>').join('') + '</div>' : '') + '</div></div>');
      box.appendChild(row);
      if (save) { d.chat.push({ who: 'bot', text, acts, t: now() }); Store.save(); }
      if (mood) Char.act(row.querySelector('.char'), mood);
      window.scrollTo({ top: document.body.scrollHeight, behavior: save ? 'smooth' : 'auto' });
    }
    const say = text => {
      addMe(text);
      const thinking = U.el('<div class="bot-row">' + Char.html('', 34) + '<div class="msg bot" style="letter-spacing:3px">…</div></div>'); box.appendChild(thinking);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      setTimeout(() => { thinking.remove(); const r = Brain.reply(text); addBot(r.text, r.acts || [], true, r.mood); if (r.after) r.after(); }, 380 + Math.random() * 300);
    };
    renderAll();
    $('#chatF').onsubmit = e => { e.preventDefault(); const v = $('#chatIn').value.trim(); if (!v) return; $('#chatIn').value = ''; say(v); };
    view.addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) { e.preventDefault(); say(b.dataset.say); } });
    $('#clr').onclick = async () => { if (await confirmBox('تمسح المحادثة؟', { ok: 'امسح', danger: true })) { d.chat = []; d.chatCtx = null; Brain.ctx = null; Store.save(); renderAll(); } };
    if (App.pendingSay) { const t = App.pendingSay; App.pendingSay = null; setTimeout(() => say(t), 250); }
    window.scrollTo(0, document.body.scrollHeight);
  });

  /* ---------- «المخ»: ردود المحادثة ---------- */
  const Brain = {
    hello() { const d = D(); return 'أهلًا يا ' + esc(d.name || 'صاحبي') + '! أنا <b>' + esc(d.charName) + '</b> 👋<br>كلمني بالعامية زي ما بتكلم صاحبك: «امتحني 10 أسئلة»، «عايز أراجع»، «امتحان <اسم المادة> يوم 20»، «إيه أضعف حاجة عندي؟»، «سجل ملاحظة: …»، «احسب الوسط ل 3 5 7».' + (SUBJ.length ? '' : '<br>لسه مفيش مواد عندك، ضيف أول مادة ومحاضراتها من صفحة <b>المواد</b> 📚') + ''; },
    teach(tu) {
      const d = D(), c = tu.c, l = LESSONS[c.l], parts = E.tutorParts(tu);
      Brain.ctx = { last: (tu.kind === 'diff' ? tu.c2 : c).k, level: tu.kind === 'simpler' ? tu.level : 0, l: c.l };
      d.chatCtx = Brain.ctx; Store.save();
      const intro = {
        def: 'تمام، خليني أفهمك <b>' + esc(c.k) + '</b> 👇',
        why: 'سؤال في الجون! «ليه» دي اللي بتخليك تفهم مش تحفظ 👇',
        how: 'ماشي، نمشيها خطوة خطوة 👇',
        example: 'خد مثال يقرّبها 👇',
        mistake: 'دي الحتة اللي ناس كتير بتقع فيها، خلي بالك 👇',
        related: 'خلينا نربطها باللي حواليها 👇',
        diff: 'تعالى نحطهم جنب بعض: <b>' + esc(c.k) + '</b> و<b>' + esc(tu.c2 ? tu.c2.k : '') + '</b> 👇',
        simpler: tu.level >= 3 ? 'ولا يهمك خالص، كل واحد ليه طريقة. نجرب حاجة مختلفة 👇' : tu.level === 2 ? 'تمام، نفككها حتة حتة 👇' : 'ولا يهمك، أقولهالك أبسط 👇'
      }[tu.kind] || '';
      const body = parts.map(x => '<div class="tu"><b>' + esc(x.h) + '</b><div>' + esc(x.t) + '</div></div>').join('');
      const nStar = l ? questionsOf(l.s, l.id).filter(q => q.star).length : 0;
      const tail = l ? '<div class="note mt">من درس «' + esc(l.title) + '»' + (nStar ? ' — وعليه ' + nStar + ' أسئلة ⭐ متوقعة.' : '.') + '</div>' : '';
      const acts = [];
      if (l) { acts.push({ label: tu.level >= 3 ? 'اقرا الجزء ده في الدرس' : 'افتح الدرس', href: '#lesson/' + l.id + '?hl=' + encodeURIComponent(c.k) }); acts.push({ label: nStar ? '⭐ امتحني في المتوقع' : 'امتحني فيه', href: '#quiz?l=' + l.id + '&n=5' + (nStar >= 2 ? '&star=1' : '') + '&go=1' }); }
      const next = [];
      if (tu.kind !== 'why' && c.why) next.push('ليه؟');
      if (tu.kind !== 'how' && c.how) next.push('إزاي؟');
      if (tu.kind !== 'example' && c.ex) next.push('مثال');
      if (tu.kind !== 'mistake' && c.err) next.push('الغلطة المشهورة');
      next.push('مش فاهم');
      if ((c.rel || [])[0] && tu.kind !== 'diff') next.push('الفرق بين ' + c.k + ' و' + c.rel[0]);
      next.forEach(x => acts.push({ say: x }));
      return { text: intro + body + tail, acts, mood: tu.kind === 'simpler' ? 'nod' : 'happy' };
    },
    ctx: null,
    /** أوامر المذاكرة: ارسملي / ذاكرلي / المراجعة النهائية / أهم الأسئلة */
    study(si, p, text) {
      const d = D(), s = (p.subject && S(p.subject)) || SUBJ.find(x => x.final) || SUBJ.find(x => questionsOf(x.id).length) || SUBJ[0];
      if (!s) return null;
      const T = E.norm(text);
      if (si.kind === 'final') {
        if (!s.final) return null;
        return { text: 'يلا المراجعة النهائية بتاعة <b>' + esc(s.name) + '</b> 🏁<br>هنمشيها 5 خطوات: الملخص الشامل، الرسومات، ماراثون المتوقع ⭐، أسئلة الدكتور، وبعدين امتحان تجريبي. وأنا معاك في كل خطوة 💪', acts: [{ label: 'افتح المراجعة النهائية', href: '#final/' + s.id }, { label: '⭐ ماراثون المتوقع', href: '#marathon/' + s.id }], mood: 'happy' };
      }
      if (si.kind === 'draw') {
        const figs = self.Figs ? Figs.list() : []; if (!figs.length) return null;
        let f = figs.find(x => (x.k || []).concat([x.title]).some(k => T.includes(E.norm(k))));
        if (!f) { const c = E.findConcepts(CONCEPTS, text).find(x => x.fig); if (c) f = Figs.get(c.fig); }
        if (!f) return { text: 'عندي ' + figs.length + ' رسمة في المنهج. اختار واحدة أوريهالك، أو افتحهم كلهم:', acts: [{ label: 'كل الرسومات', href: '#subject/' + figs[0].sid + '?tab=figs' }].concat(figs.map(x => ({ say: 'ارسملي ' + x.title, label: x.title }))), mood: 'think' };
        return { text: 'اتفضل رسمة <b>' + esc(f.title) + '</b> 👇' + Figs.html(f.id, { noact: true }) + '<div class="note mt">عايز تثبتها؟ اتدرب عليها: هخبّي الأسماء وإنت تقولي كل جزء اسمه إيه.</div>', acts: [].concat(Figs.canPractice(f.id) ? [{ label: '✏️ اتدرب عليها', href: '#fig/' + f.id }] : [], [{ label: 'كل الرسومات', href: '#subject/' + f.sid + '?tab=figs' }]), mood: 'happy' };
      }
      if (si.kind === 'important') {
        const stars = questionsOf(s.id).filter(q => q.star); if (!stars.length) return null;
        if (p.intent === 'quiz') { const n = Math.min(p.count || 10, stars.length); return { text: 'يلا ' + n + ' سؤال من <b>المتوقع ⭐</b> في ' + esc(s.short) + '. كل سؤال هقولك هو هام ليه، ولو غلطت هفهمك الاختيارات التانية بتبقى صح إمتى.', acts: [{ label: 'ابدأ', href: '#quiz?s=' + s.id + '&star=1&n=' + n + '&go=1' }, { label: 'الماراثون كله', href: '#marathon/' + s.id }], mood: 'happy' }; }
        const must = (s.must || []).slice(0, 7);
        return { text: 'في <b>' + esc(s.name) + '</b> عندي <b>' + stars.length + ' سؤال ⭐ متوقع</b> من أسئلة الدكتور نفسها والنقط المتكررة.' + (must.length ? '<div class="tu"><b>🔑 حاجات حتمًا هتيجي</b><div>' + must.map(m => '• ' + esc(m.t)).join('<br>') + '</div></div>' : '') + '<div class="note mt">الماراثون بيمشيك عليهم كلهم على أجزاء، وبيحفظ إنت وصلت لفين.</div>', acts: [{ label: '⭐ ابدأ الماراثون', href: '#marathon/' + s.id }, { label: '10 أسئلة متوقعة', href: '#quiz?s=' + s.id + '&star=1&n=10&go=1' }].concat(s.final ? [{ label: 'إزاي أحل كل نوع سؤال', href: '#final/' + s.id + '?at=how' }] : []), mood: 'happy' };
      }
      if (si.kind === 'teach') {
        const ls = s.lessons.filter(l => l.id !== s.final && l.summary && /^##\s/m.test(l.summary)); if (!ls.length) return null;
        const ordOf = l => { const x = E.studyIntent('ذاكرلي ' + l.title); return x ? x.ord : null; };
        let l = si.ord != null ? ls.find(x => ordOf(x) === si.ord) : null;
        if (!l) l = ls.find(x => E.tokenize(x.title).some(w => w.length >= 4 && !/^(ال)?(فصل|درس|محاضره|اول|تاني|ثاني|تالت|ثالث|رابع|خامس)$/.test(w) && T.includes(w)));
        const named = !!l;
        if (!l) l = ls.find(x => !d.lessonsDone[x.id] && !(d.teach || {})[x.id + ':done']) || ls[0];
        const st = (d.teach || {})[l.id];
        return { text: (named ? 'يلا نذاكر' : 'نبدأ بـ') + ' <b>«' + esc(l.title) + '»</b> سوا 🎓<br>هشرحهولك حتة حتة، وبعد كل جزء هسألك سؤال أتأكد إنك فهمت. لو حاجة وقفت معاك دوس «مش فاهم» وأبسطهالك.' + (st && st.i ? '<br><span class="note">إنت كنت واصل للجزء ' + (st.i + 1) + '، هنكمّل منه.</span>' : ''), acts: [{ label: st && st.i ? 'كمّل' : 'ابدأ', href: '#teach/' + l.id }, { label: 'اقرا الملخص', href: '#lesson/' + l.id }].concat(named ? [] : ls.filter(x => x !== l).slice(0, 8).map(x => ({ say: 'ذاكرلي ' + x.title, label: x.title }))), mood: 'happy' };
      }
      return null;
    },
    reply(text) {
      const p = E.parseIntent(text), d = D(), s = p.subject ? S(p.subject) : null;
      if (!Brain.ctx || Brain.ctxP !== Store.current) { Brain.ctx = Object.assign({}, d.chatCtx || {}); Brain.ctxP = Store.current; }
      const si = E.studyIntent(text);
      if (si) { const r0 = Brain.study(si, p, text); if (r0) return r0; }
      let tt = E.norm(text); SUBJ.forEach(x => (x.rewrite || []).forEach(([from, to]) => from.forEach(ph => { tt = tt.split(E.norm(ph)).join(E.norm(to)); })));
      const tu = E.tutor(CONCEPTS, tt, Brain.ctx);
      const soft = ['summary', 'unknown', 'open_subject', 'open'], hard = soft.concat(['tired', 'practice', 'calc', 'help']);
      if (tu && (soft.includes(p.intent) || (tu.strong && hard.includes(p.intent) && !(p.intent === 'calc' && (p.numbers || []).length >= 2)))) return Brain.teach(tu);
      const sname = s ? s.name : '';
      switch (p.intent) {
        case 'greet': return { text: greeting() + ' يا ' + esc(d.name || 'صاحبي') + '! ' + homeBubble(), mood: 'happy' };
        case 'thanks': return { text: ['العفو يا معلم 😄', 'تحت أمرك دايمًا', 'ولا يهمك، كمّل وأنا معاك'][Math.floor(Math.random() * 3)], mood: 'happy' };
        case 'help': return { text: 'أقدر:<br>• أمتحنك: «امتحني 10 أسئلة» أو «امتحني <اسم المادة>»<br>• أراجع معاك بطاقات: «عايز أراجع»<br>• أسجل امتحان: «امتحان <اسم المادة> يوم السبت الساعة 1:15»<br>• أقولك تذاكر إيه: «أذاكر إيه النهارده؟»<br>• أذاكرلك درس حتة حتة: «ذاكرلي الفصل الأول»<br>• أوريك أي رسمة: «ارسملي هرم ماسلو»<br>• أقولك المتوقع: «إيه أهم الأسئلة؟»<br>• أعملك مراجعة ليلة الامتحان: «مراجعة نهائية»<br>• أقسملك خطة: «قسملي خطة»<br>• أفهمك أي حاجة: «يعني إيه …»، «ليه؟»، «الفرق بين … و…»<br>• أطلعلك نقط ضعفك: «أنا ضعيف في إيه؟»<br>• أدوّر في محاضراتك وبطاقاتك: «يعني إيه …»<br>• أحسب: «احسب الوسط ل 5 7 9»، «الانحراف ل 2 4 6»<br>• أشغل مؤقت: «بومودورو 25 دقيقة»<br>• أسجل ملاحظة: «سجل ملاحظة: …»<br>• أضيف بطاقة: «ضيف بطاقة: السؤال = الإجابة»' };
        case 'tired': return { text: 'حاسس بيك 🤍 المذاكرة تقيلة ساعات. خد بريك 5 دقايق، اشرب مية، وارجع نعمل حاجة صغيرة: 10 بطاقات بس. الخطوات الصغيرة بتكسب.', acts: [{ label: 'بريك 5 دقايق', href: '#plan?tab=timer&brk=5' }, { label: '10 بطاقات', href: '#review?n=10' }], mood: 'nod' };
        case 'add_exam': {
          if (!p.subject) return { text: 'تمام، بس امتحان أنهي مادة؟ قول مثلًا «امتحان ' + esc(SUBJ[0] ? SUBJ[0].short : '<اسم المادة>') + ' ' + esc(p.dateSpan || 'يوم 20') + '».' + (SUBJ.length ? '' : ' (ضيف المادة الأول من صفحة المواد)'), mood: 'think' };
          const ex = { id: E.uid('e'), subject: p.subject, date: E.ymd(p.date), time: p.time || '', kind: p.kind || 'امتحان', note: '' };
          d.exams.push(ex); Store.save();
          const left = E.daysBetween(new Date(), p.date);
          return { text: 'سجلت <b>' + esc(ex.kind + ' ' + sname) + '</b> ' + esc(E.prettyDate(p.date)) + (p.time ? ' الساعة ' + esc(p.time) : '') + ' ✅<br>' + (left > 1 ? 'فاضل ' + left + ' يوم، ووزعتلك الدروس اللي لسه على الأيام دي.' : left === 1 ? 'ده بكرة! يلا مراجعة شاملة.' : 'ده النهارده! بالتوفيق 💪'), acts: [{ label: 'شوف الخطة', href: '#plan' }, { label: 'ذاكر ' + s.short, href: '#subject/' + s.id }, { say: 'قسملي الخطة', label: 'قسملي الخطة هنا' }], mood: 'happy' };
        }
        case 'next_exam': {
          const ex = upcomingExams();
          if (!ex.length) return { text: 'مفيش امتحانات متسجلة. قولّي مثلًا «امتحان ' + esc(SUBJ[0] ? SUBJ[0].short : '<اسم المادة>') + ' يوم الاتنين» وأنا أسجله وأعملك خطة.', acts: [{ label: 'ضيف امتحان', href: '#plan?tab=exams' }] };
          return { text: 'امتحاناتك الجاية:<br>' + ex.slice(0, 5).map(e => '• <b>' + esc((e.kind || 'امتحان') + ' ' + S(e.subject).short) + '</b> ' + esc(E.prettyDate(e.date)) + (e.time ? ' ' + esc(e.time) : '') + ' (' + esc(E.inDaysText(E.daysBetween(new Date(), new Date(e.date)))) + ')').join('<br>'), acts: [{ label: 'الخطة', href: '#plan' }] };
        }
        case 'weak': {
          const w = E.weakness(d.attempts.filter(a => !p.subject || a.s === p.subject).map(a => ({ subject: a.s, lesson: a.l, ok: a.ok, t: a.t })), { min: 2 }).slice(0, 4);
          if (!w.length) return { text: 'لسه معنديش بيانات كفاية' + (s ? ' في ' + esc(s.short) : '') + '. حل امتحان صغير الأول وأنا أقولك بتغلط فين بالظبط.', acts: [{ label: 'امتحان 10 أسئلة', href: '#quiz?n=10' + (s ? '&s=' + s.id : '') }], mood: 'think' };
          return { text: 'دي أكتر حاجات محتاج تركز عليها:<br>' + w.map(x => { const l = LESSONS[x.lesson]; return '• <b>' + esc(l ? l.title : x.lesson) + '</b> (' + esc(S(x.subject).short) + ') — صح ' + x.ok + ' من ' + x.n; }).join('<br>'), acts: [{ label: 'امتحني في أضعفهم', href: '#quiz?l=' + w[0].lesson + '&n=10' }, { label: 'اقرا الدرس', href: '#lesson/' + w[0].lesson }], mood: 'think' };
        }
        case 'progress': {
          const st = streakNow(), mins = Object.values(d.days).reduce((a, x) => a + (x.min || 0), 0), q = d.attempts.length, ok = d.attempts.filter(a => a.ok).length;
          return { text: 'إنجازك لحد دلوقتي:<br>• سلسلة <b>' + st + '</b> يوم 🔥<br>• <b>' + mins + '</b> دقيقة مذاكرة<br>• <b>' + q + '</b> سؤال (صح ' + (q ? Math.round(ok / q * 100) : 0) + '%)<br>' + SUBJ.map(x => '• ' + esc(x.short) + ': ' + Math.round(subjectProgress(x.id) * 100) + '%').join('<br>'), acts: [{ label: 'التفاصيل', href: '#stats' }], mood: 'happy' };
        }
        case 'plan': {
          const items = (plan()[today()] || []), due = dueCards().length;
          const exs = upcomingExams(), wantsPlan = /(خطه|قسم|جدول|وزع|نظم|رتب)/.test(p.text);
          if (!exs.length && SUBJ.length && wantsPlan) { const s1 = s || SUBJ.find(x => x.final) || SUBJ[0]; return { text: 'عشان أقسملك خطة مظبوطة محتاج أعرف <b>امتحان ' + esc(s1.short) + ' إمتى؟</b> اختار من تحت أو اكتبلي التاريخ («امتحان ' + esc(s1.short) + ' يوم 25»).', acts: ['بكره', 'بعد 3 ايام', 'بعد اسبوع', 'بعد اسبوعين'].map(x => ({ say: 'امتحان ' + s1.short + ' ' + x, label: x.replace('ايام', 'أيام').replace('اسبوع', 'أسبوع') })), mood: 'think' }; }
          if (exs.length && wantsPlan) {
            const P = plan(), days = Object.keys(P).sort().filter(k => k >= today()).slice(0, 14);
            if (days.length) return { text: 'دي خطتك لحد الامتحان (' + (d.settings.perDay || 3) + ' دروس في اليوم بالكتير):' + days.map(k => '<div class="tu"><b>' + esc(k === today() ? 'النهارده' : E.prettyDate(k)) + '</b><div>' + P[k].map(it => it.type === 'lesson' ? '• ' + esc(LESSONS[it.lesson].title) : '• 🏁 مراجعة شاملة وامتحان تجريبي ' + esc(S(it.subject).short)).join('<br>') + '</div></div>').join('') + '<div class="note mt">كل يوم ابدأ بالبطاقات المستحقة، وبعدين «ذاكرلي» الدرس، وبعدين 10 أسئلة عليه.</div>', acts: [{ label: 'افتح الجدول', href: '#plan' }].concat(items[0] && items[0].type === 'lesson' ? [{ label: 'ابدأ درس النهارده', href: '#teach/' + items[0].lesson }] : []), mood: 'happy' };
          }
          if (!items.length && !due) return { text: 'مفيش حاجة متجدولة النهارده. ' + (upcomingExams().length ? 'إنت ماشي كويس على الخطة 👌 اختار درس تقويه.' : 'سجل مواعيد امتحاناتك («امتحان الاقتصاد يوم 25») وأنا أوزعلك الدروس.'), acts: [{ label: 'ضيف امتحان', href: '#plan?tab=exams' }, { label: 'المواد', href: '#subjects' }] };
          return { text: 'خطة النهارده:<br>' + (due ? '• راجع <b>' + due + '</b> بطاقة مستحقة<br>' : '') + items.map(it => it.type === 'lesson' ? '• ' + esc(LESSONS[it.lesson].title) + ' (' + esc(S(it.subject).short) + ')' : '• مراجعة شاملة + امتحان تجريبي ' + esc(S(it.subject).short)).join('<br>'), acts: [due ? { label: 'ابدأ بالبطاقات', href: '#review' } : null, items[0] && items[0].type === 'lesson' ? { label: 'افتح أول درس', href: '#lesson/' + items[0].lesson } : null].filter(Boolean) };
        }
        case 'pomodoro': return { text: 'يلا جلسة تركيز ' + (p.minutes || d.settings.pomo) + ' دقيقة' + (s ? ' في ' + esc(s.short) : '') + ' ⏱️ اقفل النوتيفيكيشنز وحط الموبايل بعيد.', acts: [{ label: 'ابدأ المؤقت', href: '#plan?tab=timer&min=' + (p.minutes || d.settings.pomo) + (s ? '&s=' + s.id : '') + '&auto=1' }], mood: 'nod' };
        case 'break': return { text: 'استاهل بريك ☕ ' + (p.minutes || 5) + ' دقايق وراجع.', acts: [{ label: 'مؤقت البريك', href: '#plan?tab=timer&brk=' + (p.minutes || 5) + '&auto=1' }] };
        case 'quiz': {
          const n = Math.min(p.count || d.settings.quizCount || 10, 40);
          return { text: 'جاهز؟ ' + n + ' سؤال' + (s ? ' في <b>' + esc(s.name) + '</b>' : ' من كل المواد') + '. هركز على الحاجات اللي بتغلط فيها 😉', acts: [{ label: 'ابدأ', href: '#quiz?n=' + n + (s ? '&s=' + s.id : '') + '&go=1' }, { label: 'امتحان بوقت', href: '#quiz?n=' + n + (s ? '&s=' + s.id : '') + '&mode=exam&go=1' }], mood: 'happy' };
        }
        case 'review': {
          const due = dueCards(p.subject).length, nw = newCards(p.subject).length;
          return { text: due ? 'عندك <b>' + due + '</b> بطاقة مستحقة' + (s ? ' في ' + esc(s.short) : '') + '. يلا بينا!' : 'مفيش مستحق' + (s ? ' في ' + esc(s.short) : '') + ' دلوقتي 👌 ' + (nw ? 'فيه ' + nw + ' بطاقة جديدة لو عايز تبدأ فيهم.' : ''), acts: [{ label: due ? 'ابدأ المراجعة' : 'بطاقات جديدة', href: '#review' + (s ? '/' + s.id : '') + (due ? '' : '?mode=new') + (p.count ? (due ? '?' : '&') + 'n=' + p.count : '') }] };
        }
        case 'practice': {
          const qn = questionsOf(p.subject).length;
          if (!SUBJ.length) return { text: 'لسه مفيش مواد. ضيف مادة ومحاضراتها وأسئلة عليها، وبعدين نتمرن 💪', acts: [{ label: 'المواد', href: '#subjects' }] };
          return { text: qn ? 'يلا نتمرن' + (s ? ' في <b>' + esc(s.name) + '</b>' : '') + ' (' + qn + ' سؤال).' : 'لسه مفيش أسئلة' + (s ? ' في ' + esc(s.short) : '') + '. ضيف أسئلة من صفحة المادة ← الأسئلة، أو من جوه المحاضرة.', acts: qn ? [{ label: 'ابدأ', href: '#quiz?n=10' + (s ? '&s=' + s.id : '') + '&go=1' }] : [{ label: 'المواد', href: s ? '#subject/' + s.id + '?tab=qs' : '#subjects' }] };
        }
        case 'calc': return Brain.calc(p);
        case 'note': {
          if (!p.body) return { text: 'اكتب الملاحظة بعد كلمة «سجل ملاحظة:»' };
          d.notes.unshift({ id: E.uid('n'), text: p.body, s: p.subject || null, t: now() }); Store.save();
          return { text: 'سجلتها 📝 «' + esc(p.body) + '»', acts: [{ label: 'ملاحظاتي', href: '#notes' }], mood: 'nod' };
        }
        case 'add_card': {
          if (!p.front || !p.back) return { text: 'اكتبها كده: «ضيف بطاقة: السؤال = الإجابة»' };
          if (!SUBJ.length) return { text: 'ضيف مادة الأول، وبعدين البطاقات تتسجل جواها.', acts: [{ label: 'المواد', href: '#subjects' }] };
          d.custom.cards.push({ id: E.uid('cc'), s: p.subject || SUBJ[0].id, l: null, front: p.front, back: p.back }); Store.save();
          return { text: 'ضفت البطاقة ✅ هتظهرلك في المراجعة.', mood: 'happy' };
        }
        case 'open': case 'open_subject':
          if (s && !p.query) return { text: 'افتح ' + esc(s.name) + '؟', acts: [{ label: 'افتح', href: '#subject/' + s.id }, { label: 'امتحني', href: '#quiz?s=' + s.id }] };
        // fallthrough → بحث
        case 'summary': default: {
          const q = p.query || p.text;
          const res = E.search(searchDocs().filter(x => x.kind !== 'note'), q, 3);
          if (!res.length) return { text: 'مافهمتش قصدك أوي 😅 جرّب: «امتحني 10 أسئلة»، «عايز أراجع»، «أذاكر إيه النهارده؟»، أو اكتب «مساعدة».', mood: 'think' };
          const top = res[0].doc;
          if (top.kind === 'card') return { text: '<b>' + esc(top.c.front) + '</b><br>' + esc(top.c.back) + (res[1] && res[1].doc.kind === 'lesson' ? '' : ''), acts: [{ label: 'افتح الدرس', href: '#lesson/' + top.c.l + '?hl=' + encodeURIComponent(q) }] };
          return { text: 'لقيت ده في <b>' + esc(top.l.title) + '</b>:<br>' + esc(E.snippet(top.text.replace(/[#*|>`]/g, ''), q, 220)), acts: [{ label: 'افتح الدرس', href: '#lesson/' + top.l.id + '?hl=' + encodeURIComponent(q) }].concat(res[1] ? [{ label: res[1].doc.kind === 'lesson' ? res[1].doc.title : 'نتائج أكتر', href: '#search?q=' + encodeURIComponent(q) }] : []) };
        }
      }
    },
    calc(p) {
      const t = p.text, nums = p.numbers || [];
      if (nums.length >= 2) {
        const r = E.describeRaw(nums);
        if (/(وسيط)/.test(t)) return { text: 'الوسيط = <b>' + E.fmt(r.median, 4) + '</b> (بعد الترتيب: ' + r.sorted.join('، ') + ')' };
        if (/(منوال)/.test(t)) return { text: 'المنوال = <b>' + (r.modes.length ? r.modes.join(' و ') : 'مفيش') + '</b>' };
        if (/(انحراف|تباين|تشتت)/.test(t)) return { text: 'تباين العينة s² = <b>' + E.fmt(r.variance, 4) + '</b>، والانحراف المعياري s = <b>' + E.fmt(r.sd, 4) + '</b><br>(للمجتمع: σ² = ' + E.fmt(r.popVariance, 4) + '، σ = ' + E.fmt(r.popSd, 4) + ')'
 };
        return { text: 'الوسط الحسابي = <b>' + E.fmt(r.mean, 4) + '</b><br>الوسيط = ' + E.fmt(r.median, 4) + ' · المنوال = ' + (r.modes.length ? r.modes.join(' و ') : 'مفيش') + '<br>المدى = ' + E.fmt(r.range) + ' · s = ' + E.fmt(r.sd, 4) };
      }
      return { text: 'اكتب الأرقام بعد الأمر، مثلًا: «احسب الوسط ل 12 15 18 20».', mood: 'think' };
    }
  };
  App.Brain = Brain;

  Object.assign(App, { BUILT, concepts: () => CONCEPTS, D, today, now, SUBJ, S, LESSONS, pickQuestions, startQuiz, inSc, SCN, allCards, allQuestions, cardsOf, questionsOf, dueCards, newCards, lessonProgress, subjectProgress, lessonAcc, logDay, streakNow, upcomingExams, plan, subjIcon, ring });
})();
