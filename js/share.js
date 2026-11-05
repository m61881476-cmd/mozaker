/* مذاكِر — مشاركة امتحان تفاعلي بلينك + لينك النتيجة اللي بيرجع */
(function () {
  'use strict';
  const E = self.Engine, U = self.UI;
  const { $, $$, esc, icon, Store, Router, header, sheet, toast, Char, haptic, beep } = U;
  const D = () => Store.data;
  const base = () => location.href.split('#')[0];
  const MAX_Q = 30;

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { /* */ } t.remove(); return ok;
    }
  }
  /** ورقة فيها اللينك + شير/نسخ/واتساب */
  function linkSheet(title, intro, msg, link) {
    const body = U.el('<div><div class="hero" style="margin:0 0 6px">' + Char.html('', 56) + '<div class="bubble">' + intro + '</div></div>'
      + '<textarea class="input linkbox" readonly dir="ltr" rows="3">' + esc(link) + '</textarea>'
      + '<div class="btns mt">' + (navigator.share ? '<button class="btn" data-sh>' + icon('share') + 'شير</button>' : '') + '<button class="btn tint" data-cp>نسخ اللينك</button><a class="btn tint" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(msg + '\n' + link) + '">واتساب</a></div>'
      + '<p class="group-f" style="margin-top:10px">اللينك فيه الأسئلة نفسها، فبيشتغل عند صاحبك حتى لو مش عنده نفس المواد. طوله ' + link.length.toLocaleString('en') + ' حرف.</p></div>');
    body.querySelector('[data-cp]').onclick = async () => { toast(await copy(link) ? 'اتنسخ ✅' : 'انسخه من الخانة', 'check'); haptic('success'); };
    const sh = body.querySelector('[data-sh]'); if (sh) sh.onclick = () => navigator.share({ title, text: msg, url: link }).catch(() => {});
    body.querySelector('textarea').onclick = e => e.target.select();
    sheet({ title, body, doneText: 'تمام', done: () => { Router.render(); } });
  }

  /* ---------- عمل امتحان للمشاركة ---------- */
  App.shareSheet = (o = {}) => {
    const d = D(), S = App.S, L = App.LESSONS;
    const n = Math.min(MAX_Q, o.fixed ? o.fixed.length : (o.n || 10));
    let qs = o.fixed ? o.fixed.slice(0, MAX_Q) : App.pickQuestions(o.sel || [], o.lid, n, o.star, o.sc);
    if (!qs.length) return toast('مفيش أسئلة بالاختيارات دي');
    const defTitle = o.title || ((o.lid ? 'امتحان ' + L[o.lid].title : 'امتحان ' + (o.sel || []).map(x => S(x).short).join(' و ')) + (o.sc && o.sc !== 'all' ? ' (' + App.SCN[o.sc] + ')' : '') + (o.star ? ' — المتوقع ⭐' : ''));
    let mode = o.mode === 'exam' ? 'exam' : 'practice', mins = Math.max(1, Math.round(qs.length * 1.5));
    const body = U.el('<div><label class="field"><span>اسم الامتحان</span><input class="input" id="shT" maxlength="80" value="' + esc(defTitle) + '"></label>'
      + '<div class="group-h" style="margin-top:4px">النظام عند صاحبك</div><div class="seg" id="shM"></div><div id="shMin"></div>'
      + '<div class="group-h">الأسئلة (' + qs.length + ')' + (o.fixed ? '' : ' <a href="#" id="shR">غيّرهم</a>') + '</div><div class="group" id="shQ"></div></div>');
    const draw = () => {
      body.querySelector('#shM').innerHTML = '<button type="button" data-m="practice" class="' + (mode === 'practice' ? 'on' : '') + '">تدريب (تصحيح فوري)</button><button type="button" data-m="exam" class="' + (mode === 'exam' ? 'on' : '') + '">امتحان بوقت</button>';
      body.querySelector('#shMin').innerHTML = mode === 'exam' ? '<label class="row noicon" style="margin-bottom:12px;border-radius:12px;background:var(--bg2)"><span class="tx"><b>الوقت بالدقايق</b></span><input type="number" id="shMn" min="1" max="180" value="' + mins + '" style="width:80px" inputmode="numeric"></label>' : '';
      const mn = body.querySelector('#shMn'); if (mn) mn.oninput = () => { mins = Math.max(1, Math.min(180, +mn.value || 1)); };
      body.querySelector('#shQ').innerHTML = qs.map((q, i) => '<div class="row noicon"><span class="tx"><b style="font-size:14.5px;font-weight:500">' + (i + 1) + '. ' + (q.star ? '⭐ ' : '') + esc(q.q) + '</b></span></div>').join('');
      $$('[data-m]', body).forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
    };
    draw();
    const R = body.querySelector('#shR'); if (R) R.onclick = e => { e.preventDefault(); qs = App.pickQuestions(o.sel || [], o.lid, n, o.star, o.sc); draw(); haptic(); };
    sheet({ title: 'ابعت امتحان', body, doneText: 'اعمل اللينك', done: async () => {
      const title = body.querySelector('#shT').value.trim() || defTitle;
      const ex = E.makeShareExam(qs, { title, by: d.name || '', mode, limit: mode === 'exam' ? mins * 60 : 0 });
      let code; try { code = await E.packData(ex); } catch (e) { toast('حصلت مشكلة في عمل اللينك'); return false; }
      const link = base() + '#take?d=' + code;
      d.sent[ex.id] = { id: ex.id, t: title, at: ex.at, n: qs.length, m: ex.m, lim: ex.lim, ex, code, results: [] };
      Store.save();
      setTimeout(() => linkSheet('اللينك جاهز ✅', 'ابعته لصاحبك. أول ما يخلص هيطلعله زرار <b>«ابعت نتيجتك»</b>، ولما تفتح اللينك اللي هيرجعلك هتلاقي نتيجته متسجلة هنا بالتفصيل.', (d.name ? d.name + ' بعتلك' : 'جالك') + ' امتحان «' + title + '» (' + qs.length + ' سؤال) على مذاكِر 👇 حله وابعتلي نتيجتك', link), 450);
    } });
  };

  /* ---------- قايمة الامتحانات اللي بعتها ---------- */
  App.sentListHTML = () => {
    const list = Object.values(D().sent || {}).sort((a, b) => b.at - a.at);
    let h = '<div class="group-h">امتحانات بعتها' + (list.length ? ' <a href="#sent">الكل</a>' : '') + '</div><div class="group">';
    h += list.slice(0, 3).map(sentRow).join('');
    h += '<button class="row tap" data-paste><span class="ic bg-blue">' + icon('down') + '</span><span class="tx"><b>استلم نتيجة صاحبك</b><small>لو اللينك اتفتح في مكان تاني، الصقه هنا</small></span>' + icon('chev', 'chev') + '</button></div>';
    setTimeout(bindPaste, 0);
    return h;
  };
  function sentRow(x) {
    const rs = x.results || [], best = rs.length ? Math.max(...rs.map(r => r.ok / r.of)) : null;
    return '<a class="row tap" href="#sent/' + x.id + '"><span class="ic bg-purple">' + icon('share') + '</span><span class="tx"><b>' + esc(x.t) + '</b><small>' + x.n + ' سؤال · ' + esc(E.prettyDate(x.at)) + ' · ' + (rs.length ? rs.length + ' حلّوه' + ' (أعلى ' + Math.round(best * 100) + '%)' : 'لسه محدش بعت نتيجة') + '</small></span>' + icon('chev', 'chev') + '</a>';
  }
  function bindPaste() {
    $$('[data-paste]').forEach(b => b.onclick = () => {
      const body = U.el('<div><p class="note" style="margin:0 0 10px">الصق لينك النتيجة اللي صاحبك بعتهولك.</p><textarea class="input" id="pIn" rows="4" dir="ltr" placeholder="https://…#res?d=…"></textarea></div>');
      sheet({ title: 'استلم نتيجة', body, doneText: 'افتح', done: async () => {
        const v = body.querySelector('#pIn').value.trim(); const m = v.match(/#(take|res)\?d=([A-Za-z0-9_-]+)/) || (/^[zj][A-Za-z0-9_-]{8,}$/.test(v) ? [0, 'res', v] : null);
        if (!m) { toast('ده مش لينك نتيجة'); return false; }
        Router.go(m[1] + '?d=' + m[2]);
      } });
      setTimeout(() => { const t = $('#pIn'); t && t.focus(); }, 350);
    });
  }

  Router.on('sent', (view, r) => {
    const d = D(), x = r.args[0] && d.sent[r.args[0]];
    if (!x) {
      header(view, 'امتحانات بعتها', { back: { to: 'quiz', label: 'امتحني' } });
      const list = Object.values(d.sent || {}).sort((a, b) => b.at - a.at);
      view.insertAdjacentHTML('beforeend', (list.length ? '<div class="group">' + list.map(sentRow).join('') + '</div>' : '<div class="empty">' + Char.html('', 80) + '<p>لسه مابعتش امتحانات. من صفحة «امتحني» اختار المادة واضغط «ابعت الامتحان ده لصاحبك».</p></div>') + '<div class="group"><button class="row tap" data-paste><span class="ic bg-blue">' + icon('down') + '</span><span class="tx"><b>استلم نتيجة صاحبك</b><small>الصق اللينك</small></span>' + icon('chev', 'chev') + '</button></div>');
      return bindPaste();
    }
    header(view, x.t, { back: { to: 'sent', label: 'المبعوتة' } });
    const rs = (x.results || []).slice().sort((a, b) => b.at - a.at);
    let h = '<div class="card mb"><div class="note">' + x.n + ' سؤال · ' + (x.m === 'e' ? 'امتحان بوقت ' + Math.round(x.lim / 60) + ' دقيقة' : 'تدريب بتصحيح فوري') + ' · اتبعت ' + esc(E.prettyDate(x.at)) + '</div><div class="btns mt"><button class="btn sm" id="again">' + icon('share') + 'ابعت اللينك تاني</button><a class="btn sm tint" href="#take?d=' + x.code + '">جرّب تحله</a><button class="btn sm gray" id="del">' + icon('trash') + 'امسح</button></div></div>';
    h += '<div class="group-h">النتايج (' + rs.length + ')</div>';
    h += rs.length ? '<div class="group">' + rs.map((r2, i) => '<button class="row tap" data-r="' + i + '">' + App.ring(r2.ok / r2.of, 40, r2.ok / r2.of >= 0.75 ? 'var(--green)' : r2.ok / r2.of >= 0.5 ? 'var(--orange)' : 'var(--red)') + '<span class="tx"><b>' + esc(r2.n) + ' — ' + r2.ok + '/' + r2.of + '</b><small>' + esc(E.prettyDate(r2.at)) + (r2.s ? ' · ' + mm(r2.s) : '') + '</small></span>' + icon('chev', 'chev') + '</button>').join('') + '</div>'
      : '<div class="empty" style="padding:20px 0">' + Char.html('', 64) + '<p>لسه محدش بعتلك نتيجته. لما صاحبك يخلص ويبعتلك اللينك، افتحه وهيظهر هنا.</p></div>';
    view.insertAdjacentHTML('beforeend', h);
    $('#again').onclick = () => linkSheet('لينك الامتحان', 'ده نفس اللينك، ابعته لأي حد تاني.', 'امتحان «' + x.t + '» على مذاكِر 👇', base() + '#take?d=' + x.code);
    $('#del').onclick = async () => { if (await U.confirmBox('تمسح الامتحان ده ونتايجه من عندك؟ (اللينك نفسه هيفضل شغال عند اللي معاه)', { ok: 'امسح', danger: true })) { delete d.sent[x.id]; Store.save(); Router.go('sent', { replace: true }); } };
    $$('[data-r]').forEach(b => b.onclick = () => resultSheet(rs[+b.dataset.r]));
  });
  const mm = s => s < 60 ? s + ' ثانية' : Math.round(s / 60) + ' دقيقة';
  function resultBody(r) {
    return '<div class="hero" style="margin:0 0 10px">' + Char.html('', 60) + '<div class="bubble"><b>' + esc(r.n) + '</b> حل «' + esc(r.t) + '» وجاب <b>' + r.ok + ' من ' + r.of + '</b>' + (r.s ? ' في ' + mm(r.s) : '') + (r.ok / r.of >= 0.75 ? ' 👏' : '') + '</div></div>'
      + '<div class="group">' + r.r.map((x, i) => '<div class="row noicon"><span class="tx"><b style="font-size:14.5px;font-weight:500">' + (i + 1) + '. ' + esc(x[1]) + '</b><small><span class="' + (x[0] ? 'check-ok' : 'check-bad') + '">' + (x[0] ? '✓ ' : '✗ ') + 'إجابته: ' + esc(x[2]) + '</span>' + (x[0] ? '' : ' · <span class="check-ok">الصح: ' + esc(x[3]) + '</span>') + '</small></span></div>').join('') + '</div>';
  }
  function resultSheet(r) { sheet({ title: 'نتيجة ' + r.n, body: resultBody(r) }); }

  /* ---------- صاحبك بيفتح لينك الامتحان ---------- */
  Router.on('take', async (view, r) => {
    header(view, 'امتحان من صاحبك', { back: { to: 'home', label: 'الرئيسية' } });
    const box = U.el('<div><div class="empty">' + Char.html('', 70) + '<p>بفتح الامتحان…</p></div></div>'); view.appendChild(box);
    let ex; try { ex = await E.unpackData(r.q.d); if (!ex || !Array.isArray(ex.q) || !ex.q.length) throw 0; } catch (e) {
      box.innerHTML = '<div class="empty">' + Char.html('', 80) + '<p><b>اللينك ده مش سليم 😕</b><br>غالبًا اتقص وهو بيتبعت. اطلب من صاحبك يبعته تاني بزرار «نسخ اللينك».</p></div>'; return;
    }
    if (Router.cur.raw !== r.raw) return;
    const d = D(), prev = d.takes[ex.id], mine = d.sent[ex.id];
    let h = '<div class="hero">' + Char.html('', 80) + '<div class="bubble">' + (mine ? 'ده الامتحان اللي إنت بعته. جرّبه بنفسك 😉' : (ex.by ? '<b>' + esc(ex.by) + '</b> بعتلك امتحان!' : 'جالك امتحان!') + ' حله وابعتله نتيجتك.') + '</div></div>';
    h += '<div class="card mb"><b style="font-size:19px">' + esc(ex.t) + '</b><div class="note mt">' + ex.q.length + ' سؤال · ' + (ex.m === 'e' ? 'امتحان بوقت: ' + Math.round(ex.lim / 60) + ' دقيقة، والتصحيح في الآخر' : 'تدريب: هتعرف الصح بعد كل سؤال') + (ex.q.some(a => a[7]) ? ' · فيه أسئلة ⭐ متوقعة' : '') + '</div>'
      + '<div class="note">هتحله باسم <b>' + esc(d.name || 'من غير اسم') + '</b>.</div></div>';
    if (prev) h += '<div class="card mb"><b>حليته قبل كده: ' + prev.ok + '/' + prev.of + '</b><div class="btns mt"><button class="btn sm tint" id="resend">' + icon('share') + 'ابعت نتيجتك تاني</button></div></div>';
    h += '<button class="btn block" id="startT">' + icon('play') + (prev ? 'حله تاني' : 'ابدأ') + '</button>';
    box.innerHTML = h;
    Char.act(box.querySelector('.hero .char'), 'cheer');
    $('#startT').onclick = () => {
      const qs = E.shareQuestions(ex);
      App.startQuiz(qs, ex.m === 'e' ? 'exam' : 'practice', { share: ex.id, ex, sel: [], lid: null, limit: ex.lim || 0 });
    };
    const rs = $('#resend'); if (rs) rs.onclick = () => sendResult(ex, prev.ans, prev.secs);
  });

  async function sendResult(ex, answers, secs) {
    const d = D(), res = E.makeShareResult(ex, answers, { name: d.name || 'صاحبك', secs });
    let code; try { code = await E.packData(res); } catch (e) { return toast('حصلت مشكلة'); }
    linkSheet('ابعت نتيجتك', 'ابعت اللينك ده لـ <b>' + esc(ex.by || 'صاحبك') + '</b>، ولما يفتحه هيشوف نتيجتك وإجاباتك سؤال سؤال.', 'خلصت امتحان «' + ex.t + '» وجبت ' + res.ok + '/' + res.of + ' 👇 افتح اللينك تشوف إجاباتي', base() + '#res?d=' + code);
  }
  App.takeResultHTML = QZ => {
    const ex = QZ.meta.ex; if (!ex) return '';
    return '<div class="card mb sharecard"><b>' + (ex.by ? 'ابعت نتيجتك لـ ' + esc(ex.by) : 'ابعت نتيجتك') + '</b><div class="note">هيوصله لينك فيه درجتك وإجاباتك.</div><button class="btn block mt" id="sendRes">' + icon('share') + 'ابعت نتيجتك</button></div>';
  };
  App.bindTakeResult = (view, QZ) => {
    const ex = QZ.meta.ex; if (!ex) return;
    const answers = QZ.qs.map(it => it.skipped || it.ans == null ? null : it.ans), secs = Math.round((QZ.end - QZ.start) / 1000);
    const g = E.gradeShared(ex, answers);
    D().takes[ex.id] = { at: QZ.end, ok: g.ok, of: g.of, ans: answers, secs }; Store.save();
    const b = $('#sendRes', view); if (b) b.onclick = () => sendResult(ex, answers, secs);
  };

  /* ---------- لينك النتيجة بيرجعلك ---------- */
  Router.on('res', async (view, r) => {
    header(view, 'نتيجة صاحبك', { back: { to: 'sent', label: 'المبعوتة' } });
    const box = U.el('<div><div class="empty">' + Char.html('', 70) + '<p>بفتح النتيجة…</p></div></div>'); view.appendChild(box);
    let res; try { res = await E.unpackData(r.q.d); if (!res || !Array.isArray(res.r)) throw 0; } catch (e) {
      box.innerHTML = '<div class="empty">' + Char.html('', 80) + '<p><b>اللينك ده مش سليم 😕</b><br>اطلب منه يبعته تاني.</p></div>'; return;
    }
    if (Router.cur.raw !== r.raw) return;
    const d = D(), x = d.sent[res.id];
    let saved = false;
    if (x) { x.results = x.results || []; if (!x.results.some(y => y.n === res.n && y.at === res.at)) { x.results.push(res); Store.save(); saved = true; } }
    const p = res.ok / res.of;
    let h = '<div class="result-big">' + App.ring(p, 100, p >= 0.75 ? 'var(--green)' : p >= 0.5 ? 'var(--orange)' : 'var(--red)') + '<div><div style="font-size:22px;font-weight:700">' + esc(res.n) + '</div><div class="note">' + res.ok + ' من ' + res.of + (res.s ? ' · ' + mm(res.s) : '') + '</div></div></div>';
    h += resultBody(res);
    h += x ? '<p class="group-f">' + (saved ? 'اتسجلت في «' + esc(x.t) + '» ✅' : 'النتيجة دي متسجلة عندك من قبل.') + '</p><a class="btn block tint" href="#sent/' + x.id + '">كل نتايج الامتحان ده</a>'
      : '<p class="group-f">الامتحان ده مش متسجل في البروفايل ده (يمكن بعته من بروفايل أو متصفح تاني)، بس النتيجة ظاهرة كاملة فوق.</p>';
    box.innerHTML = h;
    Char.act(box.querySelector('.hero .char'), p >= 0.75 ? 'cheer' : 'nod');
    if (saved) { beep('done'); haptic('success'); }
  });
})();
