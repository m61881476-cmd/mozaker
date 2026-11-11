/* مذاكِر — المذاكرة مع الشخصية: الرسومات والتدريب عليها، «ذاكر معايا»، المراجعة النهائية، الماراثون، والرفيق اللي بيتحرك */
(function () {
  'use strict';
  const E = self.Engine, U = self.UI, F = self.Figs;
  const { $, $$, esc, icon, Store, Router, header, toast, Char, md, haptic, beep, confirmBox } = U;
  const D = () => Store.data;
  const S = id => App.S(id);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const now = () => Date.now();
  const rightText = q => q.type === 'tf' ? (q.answer ? 'صح' : 'غلط') : q.type === 'mcq' ? q.options[q.answer] : String(q.type === 'num' ? E.fmt(q.answer, 4) : q.answer);

  /* ---------- سؤال صغير جوه أي صفحة ---------- */
  function miniQ(box, q, cb, o = {}) {
    const opts = q.type === 'tf' ? ['صح', 'غلط'] : q.options;
    let h = '<div class="qcard mini' + (q.star ? ' starred' : '') + '">' + (o.tag ? '<div class="mq-tag">' + o.tag + '</div>' : '') + '<div class="q">' + esc(q.q) + '</div>';
    if (q.type === 'mcq' || q.type === 'tf') h += '<div class="opts">' + opts.map((t, i) => '<button class="opt" data-o="' + i + '"><span class="k">' + (q.type === 'tf' ? (i ? '✗' : '✓') : 'أبجد'[i]) + '</span><span>' + esc(t) + '</span></button>').join('') + '</div>';
    else h += '<form class="mq-f"><input class="input" ' + (q.type === 'num' ? 'inputmode="decimal" dir="ltr" placeholder="اكتب الرقم"' : 'placeholder="اكتب الإجابة"') + ' autocomplete="off" enterkeyhint="done"><button class="btn block mt">صحّح</button></form>';
    h += '<div class="mq-fb"></div></div>';
    box.innerHTML = h;
    let done = false;
    const answer = val => {
      if (done) return; done = true;
      const res = E.grade(q, q.type === 'tf' ? val === 0 : val), d = D();
      if (S(q.s) && App.LESSONS[q.l]) d.attempts.push({ q: q.id, s: q.s, l: q.l, ok: !!res.ok, t: now() });
      App.logDay({ q: 1, ok: res.ok ? 1 : 0 });
      if (q.type === 'mcq' || q.type === 'tf') { const c = q.type === 'tf' ? (q.answer ? 0 : 1) : q.answer; $$('.opt', box).forEach((b, i) => { b.disabled = true; if (i === c) b.classList.add('ok'); else if (i === val) b.classList.add('bad'); }); }
      else { const f = $('input', box); f.disabled = true; $('.mq-f button', box).hidden = true; }
      const fb = $('.mq-fb', box);
      fb.innerHTML = '<div class="feedback ' + (res.ok ? 'ok' : 'bad') + '"><b>' + (res.ok ? 'صح 👏' : 'غلط — الإجابة: ' + esc(rightText(q))) + '</b>' + App.explainHTML(q, !res.ok, false, q.type === 'mcq' && !res.ok ? val : undefined) + '</div>';
      App.bindExplain(fb);
      if (res.ok) { beep('ok'); haptic('success'); } else { beep('bad'); haptic('error'); }
      Pal.react(res.ok ? 'ok' : 'bad');
      cb && cb(!!res.ok);
    };
    $$('.opt', box).forEach(b => b.onclick = () => answer(+b.dataset.o));
    const ff = $('.mq-f', box); if (ff) ff.onsubmit = e => { e.preventDefault(); const v = $('input', box).value.trim(); if (v) answer(v); };
  }
  App.miniQ = miniQ;

  /* ---------- تبويب الرسومات ---------- */
  App.figsTab = (body, s) => {
    const figs = F.list(s.id), d = D(), sc = d.figs || {};
    const prac = figs.filter(f => F.canPractice(f.id)), done = prac.filter(f => sc[f.id] && sc[f.id].best >= sc[f.id].n).length;
    body.innerHTML = '<div class="card mb starcard"><div style="display:flex;gap:12px;align-items:center">' + Char.html('', 52) + '<div style="flex:1"><b>رسومات ' + esc(s.short) + ' بالترتيب (' + figs.length + ')</b><div class="note">الدكتور قال هيجيب رسمة واحدة منهم. ذاكرهم كلهم، وكل رسمة تحتها زرار «اتدرب»: هخبّي الأسماء وإنت تسمّي كل جزء. قفلت ' + done + ' من ' + prac.length + '.</div></div></div>'
      + (prac.length ? '<div class="btns mt"><a class="btn sm" href="#fig/' + prac[(prac.findIndex(f => !(sc[f.id] && sc[f.id].best >= sc[f.id].n)) + prac.length) % prac.length].id + '">✏️ ابدأ التدريب</a></div>' : '') + '</div>'
      + figs.map((f, i) => { const l = App.LESSONS[f.l], r = sc[f.id]; return '<div class="figwrap"><div class="fig-n">' + (i + 1) + ' من ' + figs.length + (l ? ' · ' + esc(l.title) : '') + (r ? ' · <span class="' + (r.best >= r.n ? 'check-ok' : 'c-orange') + '">أحسن نتيجة ' + r.best + '/' + r.n + '</span>' : '') + '</div>' + F.html(f.id) + '</div>'; }).join('');
  };

  /* ---------- التدريب على رسمة: الأسماء مستخبية وإنت تسمّي ---------- */
  Router.on('fig', (view, r) => {
    const f = F.get(r.args[0]); if (!f || !F.canPractice(f.id)) return Router.go('subjects', { replace: true });
    header(view, 'اتدرب على الرسمة', { back: { to: 'subject/' + f.sid + '?tab=figs', label: 'الرسومات' } });
    const parts = F.parts(f.id), name = p => p.s || p.t, order = E.shuffle(parts.map((_, i) => i));
    let k = 0, ok = 0; const wrong = [];
    const box = document.createElement('div'); view.appendChild(box);
    const draw = () => {
      if (k >= order.length) return finish();
      const i = order[k], rest = order.slice(k);
      const opts = E.shuffle([i].concat(E.shuffle(parts.map((_, j) => j).filter(j => j !== i && name(parts[j]) !== name(parts[i]))).slice(0, 3)));
      box.innerHTML = '<div class="progress-top"><span class="num">' + (k + 1) + '/' + order.length + '</span><div class="bar"><i style="width:' + (k / order.length * 100) + '%"></i></div></div>'
        + '<div class="hero sm">' + Char.html('', 54) + '<div class="bubble">' + (k ? pick(['والجزء ده؟', 'طيب والمتعلّم عليه دلوقتي؟', 'كمّل، ده اسمه إيه؟']) : 'الجزء <b>المتعلّم عليه</b> في رسمة «' + esc(f.title) + '» اسمه إيه؟') + '</div></div>'
        + F.html(f.id, { hide: rest, hot: i, noact: true })
        + '<div class="opts figopts">' + opts.map(j => '<button class="opt" data-j="' + j + '"><span>' + esc(name(parts[j])) + '</span></button>').join('') + '</div><div id="figFb"></div>';
      $$('[data-j]', box).forEach(b => b.onclick = () => {
        const j = +b.dataset.j, good = j === i;
        $$('[data-j]', box).forEach(x => { x.disabled = true; if (+x.dataset.j === i) x.classList.add('ok'); else if (x === b) x.classList.add('bad'); });
        if (good) { ok++; beep('ok'); haptic('success'); } else { wrong.push(i); beep('bad'); haptic('error'); }
        Pal.react(good ? 'ok' : 'bad');
        box.querySelector('.fig').outerHTML = F.html(f.id, { hide: order.slice(k + 1), hot: i, noact: true });
        $('#figFb').innerHTML = '<div class="feedback ' + (good ? 'ok' : 'bad') + '"><b>' + (good ? 'صح 👏 ' : 'ده «' + esc(name(parts[i])) + '». ') + '</b>' + (parts[i].d ? '<div class="xp">' + esc(parts[i].d) + '</div>' : '') + '</div><button class="btn block mt" id="figN">' + (k < order.length - 1 ? 'الجزء اللي بعده' : 'النتيجة') + '</button>';
        $('#figN').onclick = () => { k++; draw(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
      });
    };
    const finish = () => {
      const d = D(); d.figs = d.figs || {}; const old = d.figs[f.id];
      d.figs[f.id] = { best: Math.max(ok, old ? old.best : 0), last: ok, n: parts.length, t: now() }; App.logDay({ min: 1 }); Store.save();
      const list = F.list(f.sid).filter(x => F.canPractice(x.id)), nx = list[(list.findIndex(x => x.id === f.id) + 1) % list.length], full = ok === parts.length;
      box.innerHTML = '<div class="hero">' + Char.html('', 70) + '<div class="bubble">' + (full ? 'قفلتها! سمّيت <b>' + ok + ' من ' + parts.length + '</b> صح 🎉 لو جت في الامتحان هترسمها وإنت مغمض.' : 'سمّيت <b>' + ok + ' من ' + parts.length + '</b>. ' + (wrong.length ? 'ركّز على: ' + wrong.map(i => '«' + esc(name(parts[i])) + '»').join('، ') + '. بص على الرسمة كاملة تحت وجرّب تاني.' : '')) + '</div></div>'
        + F.html(f.id, { noact: true })
        + '<div class="btns mt"><button class="btn" id="figAgain">' + icon('reset') + 'تاني</button>' + (nx && nx.id !== f.id ? '<a class="btn tint" href="#fig/' + nx.id + '">الرسمة اللي بعدها ←</a>' : '') + '<a class="btn gray" href="#subject/' + f.sid + '?tab=figs">كل الرسومات</a></div>';
      $('#figAgain').onclick = () => Router.render();
      setTimeout(() => Char.act(box.querySelector('.char'), full ? 'cheer' : 'nod'), 250); if (full) beep('done');
    };
    draw();
  });

  /* ---------- «ذاكر معايا»: الدرس حتة حتة وسؤال بعد كل جزء ---------- */
  function sections(l) {
    const out = []; let cur = null;
    String(l.summary || '').split('\n').forEach(line => {
      const m = line.match(/^##\s+(.*)/);
      if (m) { cur = { t: m[1].trim(), b: [] }; out.push(cur); }
      else if (cur) cur.b.push(line);
      else if (line.trim()) { cur = { t: 'تمهيد', b: [line] }; out.push(cur); }
    });
    return out.map(x => ({ t: x.t, body: x.b.join('\n').trim() })).filter(x => x.body);
  }
  /** أنسب سؤال للجزء: أكتر سؤال كلماته موجودة في نص الجزء */
  function checkQ(l, sec, used) {
    const T = new Set(E.tokenize(sec.t + ' ' + sec.body)); let best = null, bs = 0;
    App.questionsOf(l.s, l.id).forEach(q => {
      if (used.has(q.id)) return;
      const w = E.tokenize(q.q + ' ' + rightText(q)); if (!w.length) return;
      const hit = w.filter(x => T.has(x)).length, sc = hit / Math.sqrt(w.length) + (q.star ? 0.3 : 0) + (q.type === 'mcq' ? 0.2 : 0);
      if (hit >= 2 && sc > bs) { bs = sc; best = q; }
    });
    return best;
  }
  App.teachSections = sections; App.teachCheckQ = checkQ;
  Router.on('teach', (view, r) => {
    const l = App.LESSONS[r.args[0]]; if (!l) return Router.go('subjects', { replace: true });
    const s = S(l.s), d = D(), secs = sections(l); if (!secs.length) return Router.go('lesson/' + l.id, { replace: true });
    d.teach = d.teach || {}; const st = d.teach[l.id] || (d.teach[l.id] = { i: 0, ok: 0, n: 0 });
    if (r.q.restart) { st.i = 0; st.ok = 0; st.n = 0; history.replaceState(null, '', '#teach/' + l.id); }
    if (st.i > secs.length) st.i = 0;
    if (!d.lessonsRead[l.id]) d.lessonsRead[l.id] = now();
    header(view, 'ذاكر معايا', { back: { to: 'lesson/' + l.id, label: 'الدرس' } });
    const box = document.createElement('div'); view.appendChild(box);
    const used = new Set(), name = esc(d.name || 'يا بطل'), t0 = now();
    const draw = () => {
      Store.save();
      if (st.i >= secs.length) return finish();
      const i = st.i, sec = secs[i], left = secs.length - i - 1;
      const q = checkQ(l, sec, used); if (q) used.add(q.id);
      const flags = (/📝/.test(sec.body) ? ' <br>📝 خلي بالك: الجزء ده فيه سؤال من أسئلة الدكتور نفسه.' : '') + (/\[\[fig:/.test(sec.body) ? ' <br>🖼️ وفيه رسمة، والدكتور قال هيجيب رسمة.' : '');
      const intro = i === 0 ? 'يلا يا ' + name + '! هنذاكر <b>«' + esc(l.title) + '»</b> في ' + secs.length + ' أجزاء صغيرة. خد نفس وركّز معايا 👇'
        : left === 0 ? 'آخر جزء! شد حيلك: <b>«' + esc(sec.t) + '»</b>'
          : pick(['حلو أوي! الجزء اللي جاي: <b>«' + esc(sec.t) + '»</b>', 'ماشيين كويس 💪 دلوقتي: <b>«' + esc(sec.t) + '»</b>', 'تمام، ندخل على: <b>«' + esc(sec.t) + '»</b>', 'فاضل ' + (left + 1) + ' أجزاء بس. يلا: <b>«' + esc(sec.t) + '»</b>']);
      box.innerHTML = '<div class="progress-top"><span class="num">' + (i + 1) + '/' + secs.length + '</span><div class="bar"><i style="width:' + (i / secs.length * 100) + '%"></i></div></div>'
        + '<div class="hero sm">' + Char.html('', 58) + '<div class="bubble">' + intro + flags + '</div></div>'
        + '<article class="card prose teach"><h2>' + esc(sec.t) + '</h2>' + md(sec.body) + '</article>'
        + '<div id="tSimpleBox"></div>'
        + (q ? '<div class="group-h">سؤال سريع أتأكد إنك معايا</div><div id="tQ"></div>' : '')
        + '<div class="btns mt teach-nav">' + (i ? '<button class="btn gray" id="tPrev">→ اللي قبله</button>' : '') + '<button class="btn tint" id="tSimple">🤔 مش فاهم، بسّطهالي</button><button class="btn" id="tNext">' + (left ? 'فهمت، كمّل ←' : 'خلصت ✓') + '</button></div>'
        + '<p class="note center mt">تقدر تسأل ' + esc(d.charName) + ' أي سؤال في الجزء ده: <a href="#chat" id="tAsk">افتح المحادثة</a></p>';
      if (q) miniQ($('#tQ'), q, good => { st.n++; if (good) st.ok++; Store.save(); });
      const pv = $('#tPrev'); if (pv) pv.onclick = () => { st.i--; draw(); window.scrollTo(0, 0); };
      $('#tNext').onclick = () => { st.i++; haptic(); draw(); window.scrollTo(0, 0); };
      $('#tSimple').onclick = () => simplify(sec);
      $('#tAsk').onclick = e => { e.preventDefault(); const c = E.findConcepts(App.concepts().filter(x => x.l === l.id), sec.t + ' ' + sec.body)[0]; App.pendingSay = c ? 'اشرحلي ' + c.k : 'يعني إيه ' + sec.t; Router.go('chat'); };
      setTimeout(() => Char.act(box.querySelector('.hero .char'), i ? 'nod' : 'happy'), 250);
    };
    const simplify = sec => {
      const pool = App.concepts().filter(x => x.l === l.id), cs = E.findConcepts(pool, sec.t + ' ' + sec.body).slice(0, 3), b = $('#tSimpleBox');
      if (!cs.length) { b.innerHTML = '<div class="card simple"><b>ولا يهمك 🤍</b><div class="note">اقرا السطور اللي جنبها 💡 تاني على مهلك، هي الشرح بالبلدي. ولو لسه، اسألني في المحادثة بالكلمة اللي وقفت معاك.</div><div class="btns mt"><button class="btn sm tint" data-ask="' + esc('يعني إيه ' + sec.t) + '">' + icon('chat') + 'اسأل ' + esc(d.charName) + '</button></div></div>'; }
      else b.innerHTML = '<div class="card simple"><b>ولا يهمك، نقولها أبسط 👇</b>' + cs.map(c => '<div class="tu"><b>' + esc(c.k) + '</b>' + E.tutorParts({ kind: 'simpler', c, level: 1 }).map(p => '<div><i>' + esc(p.h) + ':</i> ' + esc(p.t) + '</div>').join('') + (c.err ? '<div class="xp-err">⚠️ ' + esc(c.err) + '</div>' : '') + '</div>').join('') + '<div class="btns mt">' + cs.map(c => '<button class="btn sm tint" data-ask="' + esc('مثال على ' + c.k) + '">مثال على ' + esc(c.k) + '</button>').join('') + '</div></div>';
      App.bindExplain(b); b.scrollIntoView({ behavior: 'smooth', block: 'start' }); Pal.say('خد وقتك، مفيش حد بيفهم من أول مرة 🤍', 'nod', 2600);
    };
    const finish = () => {
      d.teach[l.id + ':done'] = now(); App.logDay({ min: Math.max(1, Math.round((now() - t0) / 60000)) }); Store.save(true);
      const ls = s.lessons.filter(x => x.id !== s.final), nx = ls[ls.indexOf(l) + 1], nq = App.questionsOf(s.id, l.id).length, nc = App.cardsOf(s.id, l.id).length;
      box.innerHTML = '<div class="empty">' + Char.html('', 100) + '<p style="font-size:20px;color:var(--fg)"><b>خلصنا «' + esc(l.title) + '» 🎉</b></p><p>' + (st.n ? 'جاوبت <b>' + st.ok + ' من ' + st.n + '</b> صح في الأسئلة السريعة. ' : '') + 'دلوقتي ثبّت اللي فهمته: 10 أسئلة على الدرس، وبعدين بطاقات أسئلة الدكتور.</p>'
        + '<div class="btns" style="justify-content:center">' + (nq ? '<a class="btn" href="#quiz?l=' + l.id + '&n=' + Math.min(10, nq) + '&go=1">' + icon('quiz') + 'امتحني في الدرس</a>' : '') + (nc ? '<a class="btn tint" href="#review/' + s.id + '/' + l.id + '">' + icon('cards') + 'أسئلة الدكتور (' + nc + ')</a>' : '') + '</div>'
        + '<div class="btns mt" style="justify-content:center">' + (nx ? '<a class="btn tint" href="#teach/' + nx.id + '">الدرس اللي بعده ←</a>' : s.final ? '<a class="btn tint" href="#final/' + s.id + '">🏁 المراجعة النهائية</a>' : '') + '<a class="btn gray" href="#teach/' + l.id + '?restart=1">عيد الدرس</a></div>'
        + (d.lessonsDone[l.id] ? '' : '<button class="btn block green mt" id="tDone">' + icon('check') + 'علّم إني خلصت الدرس ده</button>') + '</div>';
      const td = $('#tDone'); if (td) td.onclick = () => { d.lessonsDone[l.id] = now(); Store.save(); td.remove(); toast('اتعلّم عليه ✅', 'check'); };
      beep('done'); haptic('success'); setTimeout(() => Char.act(box.querySelector('.char'), 'cheer'), 200);
    };
    draw();
  });

  /* ---------- ماراثون الأسئلة المتوقعة ---------- */
  const PART = 25;
  function marState(sid) { const d = D(); d.marathon = d.marathon || {}; return d.marathon[sid] || (d.marathon[sid] = { r: {} }); }
  const starQs = sid => App.questionsOf(sid).filter(q => q.star);
  App.onQuizFinish = QZ => {
    if (!QZ.meta || !QZ.meta.marathon) return;
    const st = marState(QZ.meta.marathon); QZ.qs.forEach(it => { if (!it.skipped && it.res) st.r[it.q.id] = it.res.ok ? 1 : 0; }); Store.save();
  };
  Router.on('marathon', view => {
    const s = S(Router.cur.args[0]); if (!s) return Router.go('subjects', { replace: true });
    const qs = starQs(s.id), st = marState(s.id), d = D();
    header(view, 'ماراثون المتوقع ⭐', { back: { to: s.final ? 'final/' + s.id : 'subject/' + s.id, label: s.final ? 'المراجعة' : s.short } });
    if (!qs.length) { view.insertAdjacentHTML('beforeend', '<div class="empty">' + Char.html('', 80) + '<p>لسه مفيش أسئلة عليها ⭐ في المادة دي.</p></div>'); return; }
    const okN = qs.filter(q => st.r[q.id] === 1).length, badQ = qs.filter(q => st.r[q.id] === 0), seen = qs.filter(q => st.r[q.id] != null).length;
    const parts = []; for (let i = 0; i < qs.length; i += PART) parts.push(qs.slice(i, i + PART));
    const go = list => App.startQuiz(list, 'practice', { marathon: s.id, sel: [s.id], star: true, sc: 'all' });
    let h = '<div class="card mb starcard" style="display:flex;gap:14px;align-items:center">' + App.ring(okN / qs.length, 70, 'var(--gold)') + '<div style="flex:1"><b>' + qs.length + ' سؤال متوقع في ' + esc(s.short) + '</b><div class="note">جاوبت صح على <b>' + okN + '</b> · شفت ' + seen + ' · فاضل ' + (qs.length - seen) + '. كل سؤال معاه: ليه هام، الشرح، وباقي الاختيارات بتبقى صح إمتى. تقدمك بيتحفظ.</div></div></div>';
    const nextP = parts.findIndex(p => p.some(q => st.r[q.id] == null));
    h += '<div class="btns mb">' + (nextP >= 0 ? '<button class="btn" id="mGo">' + icon('play') + (seen ? 'كمّل من الجزء ' + (nextP + 1) : 'ابدأ الماراثون') + '</button>' : '<button class="btn" id="mGo">' + icon('reset') + 'لفّة تانية من الأول</button>') + (badQ.length ? '<button class="btn tint" id="mBad">عيد اللي غلطت فيه (' + badQ.length + ')</button>' : '') + '</div>';
    h += '<div class="group-h">الأجزاء</div><div class="group">' + parts.map((p, i) => {
      const a = p.filter(q => st.r[q.id] === 1).length, sn = p.filter(q => st.r[q.id] != null).length, ls = [...new Set(p.map(q => (App.LESSONS[q.l] || {}).title).filter(Boolean))];
      return '<button class="row tap" data-part="' + i + '">' + App.ring(a / p.length, 34, a === p.length ? 'var(--green)' : 'var(--gold)') + '<span class="tx"><b>الجزء ' + (i + 1) + ' · أسئلة ' + (i * PART + 1) + '–' + (i * PART + p.length) + '</b><small>' + esc(ls.map(t => t.split(':')[0]).join('، ')) + (sn ? ' · صح ' + a + ' من ' + p.length : ' · لسه') + '</small></span>' + icon('chev', 'chev') + '</button>';
    }).join('') + '</div>';
    if (seen) h += '<button class="btn block gray" id="mReset">صفّر التقدم</button>';
    view.insertAdjacentHTML('beforeend', h);
    $('#mGo').onclick = () => go(parts[nextP >= 0 ? nextP : 0].filter(q => nextP < 0 || st.r[q.id] == null).concat(nextP >= 0 ? parts[nextP].filter(q => st.r[q.id] === 0) : []));
    const mb = $('#mBad'); if (mb) mb.onclick = () => go(badQ.slice(0, 40));
    $$('[data-part]', view).forEach(b => b.onclick = () => go(parts[+b.dataset.part]));
    const mr = $('#mReset'); if (mr) mr.onclick = async () => { if (await confirmBox('تصفّر تقدمك في الماراثون؟', { ok: 'صفّر', danger: true })) { d.marathon[s.id] = { r: {} }; Store.save(); Router.render(); } };
  });

  /* ---------- المراجعة النهائية ---------- */
  Router.on('final', (view, r) => {
    const s = S(r.args[0]); if (!s || !s.final) return Router.go('subjects', { replace: true });
    const d = D(), qs = starQs(s.id), st = marState(s.id), okN = qs.filter(q => st.r[q.id] === 1).length;
    const figs = F.list(s.id).filter(f => F.canPractice(f.id)), figOk = figs.filter(f => (d.figs || {})[f.id] && d.figs[f.id].best >= d.figs[f.id].n).length;
    const cards = App.cardsOf(s.id), cardsSeen = cards.filter(c => d.srs[c.id]).length, allQ = App.questionsOf(s.id).length;
    const ex = App.upcomingExams().find(e => e.subject === s.id), left = ex ? E.daysBetween(new Date(), new Date(ex.date)) : null;
    header(view, 'المراجعة النهائية', { back: { to: 'subject/' + s.id, label: s.short } });
    const say = left === 0 ? 'الامتحان النهارده! مراجعة خفيفة: بص على الرسومات و«حاجات حتمًا هتيجي» وادخل وإنت واثق 💪'
      : left === 1 ? 'بكرة الامتحان. امشي على الخطوات الخمسة بالترتيب، ونام بدري. إنت قدها 💪'
        : left != null ? 'فاضل <b>' + left + ' يوم</b> على امتحان ' + esc(s.short) + '. الخطوات الخمسة دي بتقفل المنهج كله.'
          : 'دي مراجعة <b>' + esc(s.name) + '</b> كلها في مكان واحد. امشي على الخطوات الخمسة بالترتيب وأنا معاك.';
    const row = (n, done, href, t, sub) => '<a class="row tap" href="' + href + '"><span class="stepn' + (done ? ' done' : '') + '">' + (done ? '✓' : n) + '</span><span class="tx"><b>' + t + '</b><small>' + sub + '</small></span>' + icon('chev', 'chev') + '</a>';
    let h = '<div class="hero">' + Char.html('', 80) + '<div class="bubble">' + say + '</div></div>';
    h += '<div class="group-h">الخطوات الخمسة</div><div class="group">'
      + row(1, !!d.lessonsRead[s.final], '#lesson/' + s.final, 'اقرا الملخص الشامل', 'كل المنهج في صفحة واحدة بالجداول والرسومات')
      + row(2, figs.length && figOk === figs.length, '#subject/' + s.id + '?tab=figs', 'الرسومات (' + F.list(s.id).length + ')', 'الدكتور هيجيب واحدة · قفلت ' + figOk + ' من ' + figs.length + ' في التدريب')
      + row(3, qs.length && okN === qs.length, '#marathon/' + s.id, 'ماراثون المتوقع ⭐ (' + qs.length + ' سؤال)', 'جاوبت صح على ' + okN + ' · بالشرح والتفرعات')
      + row(4, cards.length && cardsSeen === cards.length, '#review/' + s.id + '?mode=all', 'أسئلة الدكتور المقالية (' + cards.length + ')', 'نموذج الإجابة و🔑 الكلمات المفتاحية · شفت ' + cardsSeen)
      + row(5, false, '#quiz?s=' + s.id + '&n=30&mode=exam&go=1', 'امتحان تجريبي بوقت (30 سؤال)', 'من ' + allQ + ' سؤال في البنك · التصحيح في الآخر')
      + '</div>';
    const weak = E.weakness(d.attempts.filter(a => a.s === s.id && App.LESSONS[a.l]).map(a => ({ subject: a.s, lesson: a.l, ok: a.ok, t: a.t })), { min: 3 }).filter(w => w.score < 0.7).slice(0, 3);
    if (weak.length) h += '<div class="group-h">محتاج تركز على</div><div class="group">' + weak.map(w => { const l = App.LESSONS[w.lesson]; return '<a class="row tap" href="#teach/' + l.id + '?restart=1"><span class="ic bg-orange">' + icon('target') + '</span><span class="tx"><b>' + esc(l.title) + '</b><small>صح ' + w.ok + ' من ' + w.n + ' · ذاكره تاني معايا</small></span>' + icon('chev', 'chev') + '</a>'; }).join('') + '</div>';
    if (s.must) h += '<div class="group-h" id="must">🔑 حاجات حتمًا هتيجي</div><div class="group">' + s.must.map(m => '<a class="row tap noicon" href="' + esc(m.href || '#lesson/' + s.final) + '"><span class="tx"><b>' + esc(m.t) + '</b><small>' + esc(m.d || '') + '</small></span>' + icon('chev', 'chev') + '</a>').join('') + '</div>';
    if (s.howto) h += '<div class="group-h" id="how">🧭 إزاي تحل كل نوع سؤال</div>' + s.howto.map(x => '<div class="card howto"><b>' + esc(x.t) + '</b><div>' + esc(x.d) + '</div></div>').join('');
    h += '<div class="group-h">ذاكر فصل معين</div><div class="group">' + s.lessons.filter(l => l.id !== s.final).map(l => '<a class="row tap" href="#teach/' + l.id + '">' + App.ring(App.lessonProgress(l.id), 34, 'var(--' + s.color + ')') + '<span class="tx"><b>' + esc(l.title) + '</b><small>🎓 ذاكر معايا · ' + App.questionsOf(s.id, l.id).length + ' سؤال</small></span>' + icon('chev', 'chev') + '</a>').join('') + '</div>';
    if (s.partial) h += '<div class="warn">' + icon('info') + ' ' + esc(s.partial) + '</div>';
    view.insertAdjacentHTML('beforeend', h);
    if (r.q.at) setTimeout(() => { const t = $('#' + r.q.at); t && t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 350);
    setTimeout(() => Char.act(view.querySelector('.hero .char'), 'happy'), 400);
  });

  /* ---------- الرفيق: بيتمشى على الشاشة، بيشجع، بيتسحب، وتدوس عليه يطلعلك قايمة ---------- */
  const CHEER = ['كمّل، إنت ماشي صح 💪', 'كل سؤال بتحله دلوقتي درجة في الامتحان ✨', 'أنا شايف مجهودك، برافو عليك 👏', 'خطوة خطوة وهنقفل المنهج كله', 'لو تعبت خد دقيقتين واشرب مية وارجعلي 💧', 'اللي بتذاكره النهارده هتلاقيه في الورقة', 'دماغك شغالة حلو النهارده 🔥', 'ماتستعجلش، الفهم أهم من السرعة', 'فخور بيك والله 🤍', 'ركّز في الكلمات المفتاحية 🔑 هي اللي بتجيب الدرجة'];
  const OKS = ['✨', '👏', '💪', '🔥', '⭐'];
  const BADS = ['ولا يهمك، الغلط هنا بيعلّم 🤍', 'اقرا الشرح على مهلك، دي بتتكرر', 'عادي، المرة الجاية هتيجي صح', 'بص على «باقي الاختيارات» تحت، هتفرق معاك'];
  const Pal = {
    el: null, x: 12, y: 0, size: 58, dragging: false, asleep: false, calm: false, off: true, lastUser: now(), sayAt: 0, menuOn: false, pinnedTill: 0,
    reduced() { return document.documentElement.dataset.motion === 'reduce' || matchMedia('(prefers-reduced-motion:reduce)').matches; },
    on() { return !!this.el && !this.off; },
    bounds() {
      const tb = $('.tabbar'), th = tb && getComputedStyle(tb).display !== 'none' ? tb.offsetHeight : 0, side = $('.side'), sw = side && getComputedStyle(side).display !== 'none' ? side.offsetWidth : 0;
      return { x0: 8, x1: Math.max(8, innerWidth - sw - this.size - 8), y0: 60, yb: innerHeight - th - this.size * 1.343 - 6 };
    },
    mount() {
      if (this.el) return this.sync();
      const el = this.el = document.createElement('div'); el.id = 'pal'; el.className = 'pal off';
      el.innerHTML = '<div class="pal-b" role="status"></div><div class="pal-menu" hidden></div><button class="pal-c" aria-label="الشخصية: دوس للقايمة">' + Char.html('', this.size) + '</button>';
      document.body.appendChild(el);
      this.size = innerWidth >= 900 ? 70 : 58; el.style.setProperty('--ps', this.size + 'px'); el.querySelector('.char').style.width = this.size + 'px';
      const b = this.bounds(); this.x = b.x0 + 4; this.y = b.yb; this.place(0);
      const c = el.querySelector('.pal-c'); let sx = 0, sy = 0, ox = 0, oy = 0, down = false, moved = false;
      c.addEventListener('pointerdown', e => { down = true; moved = false; sx = e.clientX; sy = e.clientY; ox = this.x; oy = this.y; try { c.setPointerCapture(e.pointerId); } catch (x) {} });
      c.addEventListener('pointermove', e => {
        if (!down) return; const dx = e.clientX - sx, dy = e.clientY - sy;
        if (!moved && Math.hypot(dx, dy) < 7) return;
        moved = true; this.dragging = true; el.classList.add('drag'); this.hideMenu(); this.x = ox + dx; this.y = oy + dy; this.clamp(); this.place(0);
      });
      const up = () => { if (!down) return; down = false; if (moved) { this.dragging = false; el.classList.remove('drag'); this.pinnedTill = now() + 25000; this.hop(); } else this.tap(); };
      c.addEventListener('pointerup', up); c.addEventListener('pointercancel', () => { down = false; this.dragging = false; el.classList.remove('drag'); });
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.tap(); } });
      el.querySelector('.pal-b').onclick = () => this.hush();
      document.addEventListener('pointerdown', e => { this.lastUser = now(); if (this.asleep) this.wake(); if (this.menuOn && !e.target.closest('#pal')) this.hideMenu(); }, true);
      document.addEventListener('keydown', () => { this.lastUser = now(); }, true);
      addEventListener('resize', () => { this.clamp(); this.place(0); });
      this.loop(); this.cheerLoop(); this.sync();
    },
    sync() {
      if (!this.el) return;
      const r = Router.cur, d = D();
      this.off = !d || d.settings.buddy === false || !!document.querySelector('.lock') || !r || ['chat', 'take', 'res'].includes(r.name);
      this.calm = !!r && (r.name === 'quiz' && (r.q.run || r.q.result));
      this.el.classList.toggle('off', this.off);
      if (this.off) { this.hideMenu(); this.hush(); }
    },
    clamp() { const b = this.bounds(); this.x = Math.min(b.x1, Math.max(b.x0, this.x)); this.y = Math.min(b.yb, Math.max(b.y0, this.y)); },
    place(dur) {
      const el = this.el; el.style.transitionDuration = (dur || 0) + 's'; el.style.transform = 'translate3d(' + Math.round(this.x) + 'px,' + Math.round(this.y) + 'px,0)';
      const bw = Math.min(280, innerWidth * 0.76), side = $('.side'), sw = side && getComputedStyle(side).display !== 'none' ? side.offsetWidth : 0;
      el.style.setProperty('--shift', Math.min(0, Math.round(innerWidth - sw - 8 - bw - this.x)) + 'px');
      el.classList.toggle('below', this.y < 400);
    },
    char() { return this.el.querySelector('.char'); },
    walkTo(x, y) {
      const b = this.bounds(); x = Math.min(b.x1, Math.max(b.x0, x)); y = y == null ? b.yb : Math.min(b.yb, Math.max(b.y0, y));
      const dist = Math.hypot(x - this.x, y - this.y); if (dist < 12) return;
      const dur = this.reduced() ? 0 : Math.min(3.4, Math.max(0.6, dist / 85));
      this.el.classList.add('walk'); this.el.classList.toggle('faceL', x < this.x);
      this.x = x; this.y = y; this.place(dur);
      clearTimeout(this.wt); this.wt = setTimeout(() => this.el.classList.remove('walk'), dur * 1000 + 60);
    },
    hop() { const c = this.char(); c.classList.remove('jump'); void c.offsetWidth; c.classList.add('jump'); },
    trick(k) {
      const c = this.char(); k = k || pick(['hop', 'spin', 'wave', 'peek']);
      if (k === 'hop') this.hop();
      else if (k === 'spin') { this.el.classList.add('spin'); setTimeout(() => this.el.classList.remove('spin'), 800); }
      else if (k === 'wave') Char.act(c, 'nod');
      else if (k === 'peek') { const b = this.bounds(), ox = this.x; this.walkTo(this.x < innerWidth / 2 ? b.x0 : b.x1); setTimeout(() => { this.el.classList.add('peek'); setTimeout(() => { this.el.classList.remove('peek'); this.walkTo(ox); }, 1500); }, 900); }
    },
    loop() {
      const tick = () => {
        setTimeout(tick, 6500 + Math.random() * 6500);
        this.sync();
        if (!this.on() || document.hidden || this.dragging || this.menuOn || this.asleep || this.reduced() || document.querySelector('.sheet.on')) return;
        if (now() - this.sayAt < 4500) return;
        if (now() - this.lastUser > 100000) return this.sleep();
        if (this.calm) { if (Math.random() < 0.3) Char.act(this.char(), 'nod'); return; }
        const b = this.bounds(), r = Math.random();
        if (now() < this.pinnedTill) { if (r < 0.5) this.trick(pick(['hop', 'wave', 'spin'])); return; }
        if (r < 0.58) this.walkTo(b.x0 + Math.random() * (b.x1 - b.x0), b.yb);
        else this.trick();
      };
      setTimeout(tick, 5000);
    },
    cheerLoop() {
      const tick = () => {
        setTimeout(tick, 55000 + Math.random() * 60000);
        const r = Router.cur; if (!this.on() || document.hidden || this.asleep || this.menuOn || !r || !['lesson', 'teach', 'review', 'subject', 'final', 'marathon', 'fig', 'quiz'].includes(r.name) || (r.name === 'quiz' && r.q.run)) return;
        if (now() - this.lastUser > 60000 || now() - this.sayAt < 30000) return;
        this.say(this.cheerLine(), 'happy', 4200);
      };
      setTimeout(tick, 40000);
    },
    cheerLine() {
      const d = D(), mins = ((d.days || {})[App.today()] || {}).min || 0, st = App.streakNow(), ex = App.upcomingExams()[0];
      const extra = [];
      if (mins >= 10) extra.push('ذاكرت ' + mins + ' دقيقة النهارده، جامد 👏');
      if (st >= 2) extra.push('سلسلة ' + st + ' أيام ورا بعض 🔥 ماتقطعهاش');
      if (ex) { const l = E.daysBetween(new Date(), new Date(ex.date)); if (l > 0 && l <= 10) extra.push('فاضل ' + l + ' يوم على الامتحان، وإنت ماشي كويس 💪'); }
      return Math.random() < 0.4 && extra.length ? pick(extra) : pick(CHEER);
    },
    sleep() { this.asleep = true; this.el.classList.add('sleep'); const b = this.bounds(); this.walkTo(b.x0 + 4, b.yb); },
    wake() { if (!this.asleep) return; this.asleep = false; this.el.classList.remove('sleep'); if (this.on()) { this.hop(); } },
    say(html, mood = 'happy', ms = 3200) {
      if (!this.el) return; this.sync(); if (this.off) return;
      this.wake(); this.hideMenu();
      const b = this.el.querySelector('.pal-b'); b.innerHTML = html; this.el.classList.add('say'); this.sayAt = now();
      Char.act(this.char(), mood);
      clearTimeout(this.st); this.st = setTimeout(() => this.el.classList.remove('say'), ms);
    },
    hush() { if (this.el) this.el.classList.remove('say'); },
    react(kind) {
      if (!this.on()) return; this.wake();
      if (kind === 'ok') { this.hop(); Char.fx(this.char(), pick(OKS)); }
      else if (kind === 'bad') { Char.act(this.char(), 'sad'); if (Math.random() < 0.5 && now() - this.sayAt > 6000) this.say(pick(BADS), 'nod', 2600); }
      else if (kind === 'done') Char.act(this.char(), 'cheer');
    },
    route(r, prev) {
      if (!this.el) return;
      this.hideMenu(); if (now() - this.sayAt > 400) this.hush();
      this.sync();
      if (this.on() && prev && prev.name !== r.name && !this.calm && !this.reduced() && now() >= this.pinnedTill) setTimeout(() => this.hop(), 350);
      const b = this.bounds();
      if (this.calm) this.walkTo(b.x0 + 4, b.yb);
      else if (this.on() && prev && prev.name !== r.name && this.y < b.yb - 4) { this.pinnedTill = 0; this.walkTo(this.x, b.yb); }
    },
    /** اقتراح أنسب حاجة تتعمل دلوقتي */
    suggest() {
      const d = D(), due = App.dueCards().length;
      if (due) return { t: 'راجع ' + due + ' بطاقة مستحقة', href: '#review' };
      for (const s of App.SUBJ) { const l = s.lessons.find(x => x.id !== s.final && !d.lessonsDone[x.id] && !(d.teach || {})[x.id + ':done'] && /^##\s/m.test(x.summary || '')); if (l) return { t: 'ذاكر «' + l.title.split(':')[0] + '» معايا', href: '#teach/' + l.id }; }
      const sf = App.SUBJ.find(x => x.final); if (sf) return { t: 'كمّل ماراثون المتوقع ⭐', href: '#marathon/' + sf.id };
      return App.SUBJ.length ? { t: 'امتحني 10 أسئلة', href: '#quiz?n=10&go=1' } : { t: 'ضيف أول مادة', href: '#subjects' };
    },
    tap() {
      if (this.menuOn) return this.hideMenu();
      this.wake(); this.hush();
      const r = Router.cur || { name: 'home', args: [] }, d = D(), items = [], sg = this.suggest();
      const l = (r.name === 'lesson' || r.name === 'teach') ? App.LESSONS[r.args[0]] : null, s = r.name === 'subject' || r.name === 'final' || r.name === 'marathon' ? S(r.args[0]) : l ? S(l.s) : null;
      if (r.name === 'lesson' && l && s.final !== l.id) items.push({ t: '🎓 ذاكرلي الدرس ده', href: '#teach/' + l.id }, { t: '📝 امتحني فيه', href: '#quiz?l=' + l.id + '&n=10&go=1' });
      if (r.name === 'teach') items.push({ t: '🤔 مش فاهم الجزء ده', click: '#tSimple' });
      if (s && s.final && r.name !== 'final') items.push({ t: '🏁 المراجعة النهائية', href: '#final/' + s.id });
      if (s && F.list(s.id).length && r.name !== 'fig') items.push({ t: '🖼️ الرسومات', href: '#subject/' + s.id + '?tab=figs' });
      if (!(r.name === 'quiz' && r.q.run)) items.push({ t: '👉 ' + sg.t, href: sg.href });
      items.push({ t: '💬 اسألني أي سؤال', href: '#chat' }, { t: '🤸 اعمل حركة', fn: () => this.trick(pick(['spin', 'hop', 'peek'])) }, { t: '💛 شجعني', fn: () => this.say(this.cheerLine(), 'cheer', 3600) }, { t: '😴 نام شوية', fn: () => this.sleep() });
      const m = this.el.querySelector('.pal-menu');
      m.innerHTML = '<div class="pal-mh">' + esc(d.charName) + ' معاك، عايز إيه؟</div>' + items.slice(0, 8).map((it, i) => '<button data-pi="' + i + '">' + esc(it.t) + '</button>').join('');
      m.hidden = false; this.menuOn = true; this.el.classList.add('menu'); Char.act(this.char(), 'nod'); haptic();
      $$('[data-pi]', m).forEach(b => b.onclick = e => { e.stopPropagation(); const it = items[+b.dataset.pi]; this.hideMenu(); if (it.href) Router.go(it.href.slice(1)); else if (it.click) { const t = $(it.click); t && t.click(); } else it.fn(); });
    },
    hideMenu() { if (!this.el) return; this.menuOn = false; this.el.classList.remove('menu'); const m = this.el.querySelector('.pal-menu'); if (m) m.hidden = true; }
  };
  self.Pal = Pal;
})();
