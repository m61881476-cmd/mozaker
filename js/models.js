/* مذاكِر — نماذج «100 سؤال مهمين»: النموذج كله في صفحة واحدة زي فورم جوجل، تختار (أ ب ج د) وفي الآخر «صحّح» */
(function () {
  'use strict';
  const U = self.UI;
  const { $, $$, esc, icon, Store, Router, header, toast, Char, haptic, beep, confirmBox } = U;
  const D = () => Store.data;
  const L = 'أبجد';
  const st = mid => { const d = D(); d.models = d.models || {}; return d.models[mid] || (d.models[mid] = { a: {}, done: false, best: 0, last: 0, n: 0 }); };
  const find = (sid, mid) => { const s = App.S(sid); return s && (s.models || []).find(m => m.id === mid) ? { s, m: s.models.find(m => m.id === mid) } : null; };
  App.modelsOf = sid => { const s = App.S(sid); return (s && s.models) || []; };

  /* كارت النموذج في صفحة المادة */
  App.modelCards = s => (s.models || []).map(m => {
    const r = (D().models || {})[m.id], n = m.n || m.qs.length;
    const sub = r && r.done ? 'آخر نتيجة ' + r.last + ' من ' + n + ' · أحسن نتيجة ' + r.best : r && Object.keys(r.a).length ? 'جاوبت ' + Object.keys(r.a).length + ' من ' + n + ' · كمّل من مكانك' : 'أسئلة متوقعة بنص المحاضرة · (أ) (ب) (ج) (د) والتصحيح في الآخر';
    return '<a class="card tap modelcard mb" href="#model/' + s.id + '/' + m.id + '"><span class="mc-ic">📝</span><span style="flex:1"><b>نموذج: ' + esc(m.title) + '</b><span class="note" style="display:block">' + esc(sub) + '</span></span>' + icon('chev', 'chev') + '</a>';
  }).join('');

  Router.on('model', (view, r) => {
    const f = find(r.args[0], r.args[1]); if (!f) return Router.go('subjects', { replace: true });
    const { s, m } = f, all = m.n || m.qs.length, total = m.qs.length, locked = !m.full && total < all;
    const R = st(m.id), d = D();
    header(view, 'نموذج ' + s.short, { back: { to: 'subject/' + s.id, label: s.short } });
    const only = r.q.wrong === '1' && R.done;
    let h = '<div class="card mb mdl-head"><div style="display:flex;gap:12px;align-items:center">' + Char.html('', 56) + '<div style="flex:1"><b>' + esc(m.title) + '</b><div class="note">' + esc(m.intro || '') + '</div></div></div>'
      + '<div class="mdl-how">اختار الإجابة الصح لكل سؤال: <b>(أ) (ب) (ج) (د)</b>. ماحدش هيقولك صح ولا غلط غير لما تدوس <b>«صحّح النموذج»</b> في الآخر، زي الامتحان بالظبط.</div></div>';
    if (R.done) {
      const pct = Math.round(R.last / total * 100), msg = pct >= 90 ? 'إيه ده! إنت جاهز للامتحان 🔥' : pct >= 75 ? 'حلو أوي 👏 راجع الغلط وهتقفلها' : pct >= 50 ? 'كويس، بس محتاج تراجع الغلط تحت كويس 💪' : 'ولا يهمك، ذاكر الفصول تاني وارجع حل النموذج 🤍';
      h += '<div class="card mb mdl-score"><div class="mdl-big">' + R.last + ' <small>من ' + total + '</small></div><div class="mdl-pct">' + pct + '%</div><div class="note">' + msg + (R.best > R.last ? ' · أحسن نتيجة ليك ' + R.best : '') + '</div>'
        + '<div class="btns mt"><a class="btn sm' + (only ? ' tint' : '') + '" href="#model/' + s.id + '/' + m.id + (only ? '' : '?wrong=1') + '">' + (only ? 'كل الأسئلة' : '❌ الغلط بس (' + (total - R.last) + ')') + '</a><button class="btn sm gray" id="mdlAgain">↻ حله من الأول</button></div></div>';
    }
    h += '<div class="mdl-list">';
    m.qs.forEach((q, i) => {
      const a = R.a[i], ok = a === q[2];
      if (only && ok) return;
      h += '<div class="qcard mdl-q' + (R.done ? (ok ? ' is-ok' : ' is-bad') : '') + '" data-i="' + i + '"><div class="q"><span class="mdl-n">' + (i + 1) + '</span>' + esc(q[0]) + '</div><div class="opts">'
        + q[1].map((o, k) => '<button class="opt' + (R.done ? (k === q[2] ? ' ok' : k === a ? ' bad' : '') : a === k ? ' sel' : '') + '" data-k="' + k + '"' + (R.done ? ' disabled' : '') + '><span class="k">' + L[k] + '</span><span>' + esc(o) + '</span></button>').join('') + '</div>'
        + (R.done ? '<div class="mdl-fb">' + (ok ? '✓ صح' : a == null ? 'ماجاوبتش · الصح: <b>(' + L[q[2]] + ') ' + esc(q[1][q[2]]) + '</b>' : '✗ اخترت (' + L[a] + ') · الصح: <b>(' + L[q[2]] + ') ' + esc(q[1][q[2]]) + '</b>') + (q[3] ? '<div class="note">' + esc(q[3]) + '</div>' : '') + '</div>' : '') + '</div>';
    });
    h += '</div>';
    if (locked) h += Sub.wallHTML('باقي النموذج للمشتركين (' + (all - total) + ' سؤال)', 'دي أول ' + m.qs.length + ' أسئلة بس كتجربة. اشترك ويتفتحلك النموذج كامل بالتصحيح والشرح، ومعاه كل نماذج المواد التانية.');
    if (!R.done) h += '<div class="mdl-bar"><span id="mdlCnt"></span><button class="btn" id="mdlGo">صحّح النموذج</button></div>';
    view.insertAdjacentHTML('beforeend', h);

    const cnt = () => { const n = Object.keys(R.a).length, el = $('#mdlCnt'); if (el) el.innerHTML = 'جاوبت <b>' + n + '</b> من ' + m.qs.length; };
    cnt();
    if (!R.done) $$('.mdl-q', view).forEach(box => box.addEventListener('click', e => {
      const b = e.target.closest('.opt'); if (!b) return;
      const i = +box.dataset.i, k = +b.dataset.k;
      R.a[i] = k; Store.save(); haptic();
      $$('.opt', box).forEach(x => x.classList.toggle('sel', x === b));
      cnt();
    }));
    const go = $('#mdlGo');
    if (go) go.onclick = async () => {
      const n = Object.keys(R.a).length, left = m.qs.length - n;
      if (left && !(await confirmBox('فاضل ' + left + ' سؤال ماجاوبتش عليهم. أصحّح كده؟', { ok: 'صحّح' }))) {
        const first = $$('.mdl-q', view).find(x => R.a[+x.dataset.i] == null); first && first.scrollIntoView({ behavior: 'smooth', block: 'center' }); return;
      }
      let ok = 0; m.qs.forEach((q, i) => { if (R.a[i] === q[2]) ok++; });
      R.done = true; R.last = ok; R.best = Math.max(R.best || 0, ok); R.n = (R.n || 0) + 1; R.t = Date.now();
      App.logDay({ q: n, ok });
      Store.save();
      ok / m.qs.length >= 0.75 ? (beep('ok'), haptic('success'), App.confetti && App.confetti(90)) : beep('bad');
      Router.render(); window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const again = $('#mdlAgain');
    if (again) again.onclick = () => { R.a = {}; R.done = false; Store.save(); Router.go('model/' + s.id + '/' + m.id, { replace: true }); window.scrollTo({ top: 0 }); };
  });
})();
