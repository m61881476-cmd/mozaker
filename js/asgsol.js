/* مذاكِر — حل الأسايمنت للمشتركين: صفحة غلاف بأسامي التيم + صفحات الحل ← ملف PDF واحد جاهز للرفع */
(function () {
  'use strict';
  const U = self.UI, { $, $$, esc, icon, Store, Router, header, toast, Char, haptic } = U;
  const D = () => Store.data;

  /* الأسايمنتات اللي ليها حل جاهز */
  const SOLS = {
    'asg-eco-1': {
      asset: 'asg-eco-1', news: 'asg-eco-1', file: 'Assignment-Macroeconomics-IS-LM.pdf',
      title: 'تكليف الاقتصاد الكلي', sub: 'تطبيقات نموذج التوازن العام في سوق السلع والنقود (IS-LM)', grade: '15 درجة',
      link: 'https://drive.google.com/drive/folders/1Was38RzlLQnV1eFczQIZ25l9QeBCmHWJ?usp=drive_link',
      team: () => { const d = D(); return (d.asg && d.asg.team) || []; }, checks: () => { const d = D(); d.asg = d.asg || { chk: {}, team: [] }; return d.asg.chk; },
      ck: { cover: 2, pdf: 5, up: 6, got: 3, solved: 4 },
      warn: ['التكليف فيه <b>معطيات ومطالب من الفصل السادس (الاقتصاد المفتوح)</b>: صافي الصادرات والميل الحدي للاستيراد. والفصل ده <b>لسه ماتشرحش</b> في المحاضرات.',
        'جزء الاقتصاد المفتوح في الحل متحل بالطريقة العامة للنموذج. ممكن الدكتور يشرحه بطريقة أو رموز مختلفة، فـ<b>الأحسن تستنى محاضرة الفصل السادس</b> أو تتأكد من المعيد قبل الرفع.',
        'الحل معتبر دالة الطلب على النقود <b dir="ltr">MD = 0.8Y − 160r</b> (بـ r).',
        '<b>واحد بس</b> من التيم يرفع، و<b>مرة واحدة</b> بس.']
    }
  };

  /* ---------- PDF من صور JPEG (من غير أي مكتبة) ---------- */
  function jpegInfo(b) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xFF) { i++; continue; }
      const m = b[i + 1], len = (b[i + 2] << 8) | b[i + 3];
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { h: (b[i + 5] << 8) | b[i + 6], w: (b[i + 7] << 8) | b[i + 8], c: b[i + 9] };
      i += 2 + len;
    }
    throw new Error('jpeg');
  }
  function makePdf(jpegs) {
    const te = new TextEncoder(), parts = [], offs = []; let pos = 0;
    const push = x => { const u = typeof x === 'string' ? te.encode(x) : x; parts.push(u); pos += u.length; };
    const obj = (n, body) => { offs[n] = pos; push(n + ' 0 obj\n'); body(); push('\nendobj\n'); };
    const PW = 595.28, PH = 841.89, n = jpegs.length;
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const kids = []; for (let i = 0; i < n; i++) kids.push((3 + i * 3) + ' 0 R');
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push('<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>'));
    jpegs.forEach((b, i) => {
      const p = 3 + i * 3, inf = jpegInfo(b), sc = Math.min(PW / inf.w, PH / inf.h), w = inf.w * sc, h = inf.h * sc, x = (PW - w) / 2, y = (PH - h) / 2;
      const cs = 'q ' + w.toFixed(2) + ' 0 0 ' + h.toFixed(2) + ' ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' cm /Im0 Do Q';
      obj(p, () => push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /XObject << /Im0 ' + (p + 2) + ' 0 R >> >> /Contents ' + (p + 1) + ' 0 R >>'));
      obj(p + 1, () => { push('<< /Length ' + cs.length + ' >>\nstream\n'); push(cs); push('\nendstream'); });
      obj(p + 2, () => { push('<< /Type /XObject /Subtype /Image /Width ' + inf.w + ' /Height ' + inf.h + ' /ColorSpace /' + (inf.c === 1 ? 'DeviceGray' : inf.c === 4 ? 'DeviceCMYK' : 'DeviceRGB') + ' /BitsPerComponent 8 /Filter /DCTDecode /Length ' + b.length + ' >>\nstream\n'); push(b); push('\nendstream'); });
    });
    const total = 3 + n * 3, xref = pos;
    let x = 'xref\n0 ' + total + '\n0000000000 65535 f \n'; for (let i = 1; i < total; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
    push(x + 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF');
    const out = new Uint8Array(pos); let o = 0; parts.forEach(u => { out.set(u, o); o += u.length; }); return out;
  }

  /* ---------- صفحة الغلاف (بترسم على canvas بخط الجهاز) ---------- */
  const FONT = '"Noto Naskh Arabic","Noto Sans Arabic","Segoe UI",Tahoma,"Geeza Pro",Arial,sans-serif';
  function fit(ctx, text, max, size, weight) { let s = size; do { ctx.font = (weight || 400) + ' ' + s + 'px ' + FONT; if (ctx.measureText(text).width <= max) break; s -= 2; } while (s > 14); return s; }
  async function coverJpeg(sol) {
    try { if (document.fonts && document.fonts.load) await Promise.all([document.fonts.load('700 40px ' + FONT, 'تكليف'), document.fonts.load('400 30px ' + FONT, 'الاسم')]); } catch (e) {}
    const W = 1159, H = 1639, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#000'; c.lineWidth = 2.5; c.strokeRect(50, 50, W - 100, H - 100);
    const txt = (t, x, y, size, weight, color, align, dir) => { c.direction = dir || 'rtl'; c.textAlign = align || 'center'; c.fillStyle = color || '#111'; c.font = (weight || 400) + ' ' + size + 'px ' + FONT; c.fillText(t, x, y); };
    txt('Assignment', W / 2, 200, 80, 700, '#000', 'center', 'ltr');
    txt(sol.title, W / 2, 300, fit(c, sol.title, W - 200, 60, 700), 700, '#111');
    txt(sol.sub, W / 2, 370, fit(c, sol.sub, W - 200, 32), 400, '#333');
    txt('الدرجة: ' + sol.grade, W / 2, 425, 30, 400, '#333');
    c.fillStyle = '#000'; c.fillRect(W / 2 - 180, 465, 360, 2);
    txt('أسماء الطلاب', W / 2, 545, 40, 700, '#000');
    const team = sol.team().filter(m => (m.n || '').trim()), x0 = 100, x1 = W - 100, top = 590, hh = 74, rh = Math.min(96, Math.floor((H - 210 - top - hh) / Math.max(4, team.length)));
    // الأعمدة من اليمين: م · الاسم · الكود · ملاحظات
    const cols = [{ t: 'م', w: 80 }, { t: 'الاسم', w: 520 }, { t: 'الكود', w: 230 }, { t: 'ملاحظات', w: x1 - x0 - 830 }];
    let xr = x1; cols.forEach(cl => { cl.r = xr; cl.l = xr - cl.w; xr = cl.l; });
    c.fillStyle = '#e6e6e6'; c.fillRect(x0, top, x1 - x0, hh);
    cols.forEach(cl => txt(cl.t, (cl.l + cl.r) / 2, top + hh / 2 + 12, 32, 700, '#000'));
    const rows = Math.max(team.length, 4);
    for (let i = 0; i < rows; i++) {
      const y = top + hh + i * rh, m = team[i];
      if (m) {
        txt(String(i + 1), (cols[0].l + cols[0].r) / 2, y + rh / 2 + 11, 30, 700, '#111');
        const nm = m.n.trim(); txt(nm, cols[1].r - 18, y + rh / 2 + 11, fit(c, nm, cols[1].w - 36, 34), 400, '#111', 'right');
        if (m.c) txt(String(m.c), (cols[2].l + cols[2].r) / 2, y + rh / 2 + 11, fit(c, String(m.c), cols[2].w - 24, 32), 400, '#111', 'center', 'ltr');
        if (m.t) txt('محوّل', (cols[3].l + cols[3].r) / 2, y + rh / 2 + 11, 30, 700, '#000');
      }
    }
    c.strokeStyle = '#000'; c.lineWidth = 1.6; c.strokeRect(x0, top, x1 - x0, hh + rows * rh);
    for (let i = 1; i <= rows; i++) { c.beginPath(); c.moveTo(x0, top + hh + (i - 1) * rh); c.lineTo(x1, top + hh + (i - 1) * rh); c.stroke(); }
    cols.slice(1).forEach(cl => { c.beginPath(); c.moveTo(cl.r, top); c.lineTo(cl.r, top + hh + rows * rh); c.stroke(); });
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.9));
    return { bytes: new Uint8Array(await blob.arrayBuffer()), url: URL.createObjectURL(blob) };
  }

  async function buildPdf(sol) {
    const a = await Sub.asset(sol.asset), cover = await coverJpeg(sol);
    const pdf = makePdf([cover.bytes].concat(a.pages));
    return new File([pdf], sol.file, { type: 'application/pdf' });
  }
  App.AsgPdf = { makePdf, coverJpeg, buildPdf, SOLS };

  /* ---------- الصفحة ---------- */
  Router.on('asgsol', async (view, r) => {
    const id = r.args[0] || 'asg-eco-1', sol = SOLS[id]; if (!sol) return Router.go('news', { replace: true });
    header(view, 'حل الأسايمنت', { back: { to: 'news/' + sol.news, label: 'الأسايمنت' } });
    if (!(self.Sub && Sub.on())) { view.insertAdjacentHTML('beforeend', Sub.wallHTML('حل الأسايمنت للمشتركين', 'الحل الكامل بخطوات الدكتور والرسومات، ومعاه صفحة الغلاف بأسامي التيم، في ملف PDF واحد جاهز للرفع.')); return; }
    const team = sol.team().filter(m => (m.n || '').trim()), f = App.fatma && App.fatma();
    let h = '<div class="card mb solhero">' + Char.html('', 70) + '<div class="bubble">' + (team.length ? 'الحل جاهز ✅ وغلافكم فيه ' + team.length + ' ' + (team.length > 2 && team.length < 11 ? 'أسامي' : 'اسم') + '. ' + (f ? 'دوسي' : 'دوس') + ' «ارفع» وخلصنا 🚀' : 'الحل جاهز ✅ ' + (f ? 'ضيفي' : 'ضيف') + ' أسامي التيم الأول، وأنا أعمل الغلاف وأحطه أول صفحة 🪪') + '</div></div>';
    h += '<div class="group-h">التيم (صفحة الغلاف) <a href="#cover/' + id + '">✏️ عدّل</a></div>';
    h += team.length ? '<div class="group">' + team.map((m, i) => '<div class="row noicon"><span class="tx"><b>' + (i + 1) + '. ' + esc(m.n) + '</b><small dir="ltr" style="text-align:right">' + esc(m.c || 'من غير كود') + (m.t ? ' · محوّل' : '') + '</small></span></div>').join('') + '</div>'
      : '<div class="card mb warn">لسه مفيش أسامي. <a href="#cover/' + id + '">ضيف التيم</a> (الأسامي والأكواد، وعلّم على «محوّل»).</div>';
    if (team.length && team.length < 4) h += '<p class="warn-t">⚠️ التيم لازم يكون من 4 لـ 6 طلاب (الأحسن 5 أو 6).</p>';
    if (team.length && team.some(m => !String(m.c || '').trim())) h += '<p class="warn-t">⚠️ فيه اسم من غير كود.</p>';
    h += '<div class="btns mt solbtns"><button class="btn green" id="solUp"' + (team.length ? '' : ' disabled') + '>📤 ارفع على الدرايف</button><button class="btn" id="solDl"' + (team.length ? '' : ' disabled') + '>⬇️ نزّل الـ PDF</button></div>';
    h += '<p class="note center">الملف = صفحة الغلاف + الحل كامل في PDF واحد. <a href="' + sol.link + '" target="_blank" rel="noopener">افتح فولدر الدرايف</a></p>';
    h += '<div class="card mb note">☝️ <b>واحد بس</b> من التيم يرفع، <b>مرة واحدة</b> بس.<br>🧾 الحل معتبر دالة الطلب على النقود <b dir="ltr">MD = 0.8Y − 160r</b> (بـ r). لو الدكتور قال غير كده كلّم محمد.</div>';
    h += '<div class="group-h">معاينة</div><div id="solPrev" class="solprev"><div class="note center">بيجهّز الحل…</div></div>';
    view.insertAdjacentHTML('beforeend', h);
    setTimeout(() => { const c = $('.solhero .char', view); if (c && App.Props) { App.Props.put(c, team.length ? 'thumbs' : 'stick'); Char.act(c, 'happy'); } }, 250);
    const ck = sol.checks(), mark = (...ks) => { ks.forEach(k => { ck[sol.ck[k]] = true; }); Store.save(); };
    mark('got', 'solved');
    let cache = null; const make = async () => { if (!cache) cache = await buildPdf(sol); return cache; };
    const busy = (b, on, t) => { b.disabled = on; if (on) { b.dataset.t = b.innerHTML; b.textContent = t; } else b.innerHTML = b.dataset.t; };
    const download = file => { const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); };
    const dl = $('#solDl'); if (dl) dl.onclick = async () => {
      busy(dl, true, 'بيجهّز…');
      try { const file = await make(); download(file); mark('cover', 'pdf'); toast('اتنزّل الملف ✓', 'check'); haptic('success'); }
      catch (e) { toast(e.message === 'net' ? 'محتاج نت أول مرة عشان ينزل الحل' : 'حصلت مشكلة، جرّب تاني', 'info'); }
      busy(dl, false);
    };
    /** «هل انت متأكد؟» قبل الرفع، ومعاها التنبيهات */
    const sure = () => new Promise(res => {
      let done = false;
      const s = U.sheet({ title: 'متأكد إنك عايز ترفع؟', cancelText: 'رجوع',
        body: '<div class="sure">' + Char.html('', 64) + '<div class="bubble">' + (f ? 'استني ثانية قبل ما ترفعي 🤚' : 'استنى ثانية قبل ما ترفع 🤚') + '</div></div><ul class="surel">' + (sol.warn || []).map(w => '<li>⚠️ ' + w + '</li>').join('') + '</ul>'
          + '<button class="btn block green" data-yes>📤 أيوه، ارفع دلوقتي</button><button class="btn block gray mt" data-no>⏳ هستنى المحاضرة</button>',
        onOpen: a => { const c = a.body.querySelector('.char'); if (c && App.Props) { App.Props.put(c, 'stick'); Char.act(c, 'nod'); } a.body.querySelector('[data-yes]').onclick = () => { done = true; a.close(true); res(true); }; a.body.querySelector('[data-no]').onclick = () => { done = true; a.close(false); res(false); }; },
        onClose: () => { if (!done) res(false); } });
    });
    const up = $('#solUp'); if (up) up.onclick = async () => {
      busy(up, true, 'بيجهّز…');
      try {
        const file = await make(); mark('cover', 'pdf');
        busy(up, false);
        if (!(await sure())) { toast('تمام، الملف جاهز وقت ما تحب 👌', 'info'); return; }
        busy(up, true, 'بيفتح…');
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: sol.file }); mark('up'); toast('اختار Drive وبعدين فولدر التسليم ✓', 'check'); }
          catch (e) { if (e && e.name !== 'AbortError') { download(file); open(sol.link, '_blank'); } }
        } else {
          download(file); setTimeout(() => open(sol.link, '_blank', 'noopener'), 400);
          toast('نزل الملف ✓ وفتحتلك الفولدر: دوس «جديد» ← «تحميل ملف» واختاره', 'check');
        }
        haptic('success');
      } catch (e) { toast(e.message === 'net' ? 'محتاج نت أول مرة عشان ينزل الحل' : 'حصلت مشكلة، جرّب تاني', 'info'); }
      busy(up, false);
    };
    // المعاينة: الغلاف + الصفحات
    try {
      const [a, cover] = await Promise.all([Sub.asset(sol.asset), team.length ? coverJpeg(sol) : Promise.resolve(null)]);
      const box = $('#solPrev'); if (!box) return;
      const urls = a.pages.map(b => URL.createObjectURL(new Blob([b], { type: 'image/jpeg' })));
      box.innerHTML = (cover ? '<figure><img src="' + cover.url + '" alt="صفحة الغلاف"><figcaption>صفحة 1: الغلاف</figcaption></figure>' : '') + urls.map((u, i) => '<figure><img src="' + u + '" alt="صفحة ' + (i + 2) + '" loading="lazy"><figcaption>صفحة ' + (i + (cover ? 2 : 1)) + '</figcaption></figure>').join('');
    } catch (e) { const box = $('#solPrev'); if (box) box.innerHTML = '<div class="card warn">' + (e.message === 'net' ? 'محتاج نت أول مرة عشان ينزل الحل. بعد كده بيشتغل من غير نت.' : 'ماقدرتش أفتح الحل. جرّب تاني.') + '</div>'; }
  });
})();
