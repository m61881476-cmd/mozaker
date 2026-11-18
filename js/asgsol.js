/* مذاكِر — «ضيف حلك + الغلاف»: الطالب بيحل الأسايمنت بنفسه، والبرنامج بيحط صفحة الغلاف بأسامي التيم أول صفحة في ملفه (PDF أو Word) ويرفعه.
   البرنامج مابيحلّش أي أسايمنت. */
(function () {
  'use strict';
  const U = self.UI, { $, esc, Store, Router, header, toast, Char, haptic } = U;
  const D = () => Store.data;
  const News = () => App.News;
  const state = id => App.asgOf(id);
  const team = id => (state(id).team || []).filter(m => (m.n || '').trim());

  /* المكتبات بتتحمّل بس لما الصفحة دي تتفتح */
  const LIBS = {};
  function lib(name, src, global) {
    if (self[global]) return Promise.resolve(self[global]);
    return LIBS[name] || (LIBS[name] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = () => self[global] ? res(self[global]) : rej(new Error('lib')); s.onerror = () => { delete LIBS[name]; rej(new Error('net')); }; document.head.appendChild(s); }));
  }
  const pdfLib = () => lib('pdf', 'js/vendor/pdf-lib.min.js', 'PDFLib');
  const zipLib = () => lib('zip', 'js/vendor/jszip.min.js', 'JSZip');

  /* بيانات الغلاف من خبر الأسايمنت */
  function meta(id) { const n = News().get(id) || {}; return { title: n.cover || 'Assignment', sub: n.coverSub || '', grade: n.grade || '' }; }

  /* ---------- صفحة الغلاف كصورة (للـ PDF والمعاينة) ---------- */
  const FONT = '"Noto Naskh Arabic","Noto Sans Arabic","Segoe UI",Tahoma,"Geeza Pro",Arial,sans-serif';
  function fit(ctx, text, max, size, weight) { let s = size; do { ctx.font = (weight || 400) + ' ' + s + 'px ' + FONT; if (ctx.measureText(text).width <= max) break; s -= 2; } while (s > 14); return s; }
  async function coverJpeg(id) {
    try { if (document.fonts && document.fonts.load) await Promise.all([document.fonts.load('700 40px ' + FONT, 'تكليف'), document.fonts.load('400 30px ' + FONT, 'الاسم')]); } catch (e) {}
    const M = meta(id), T = team(id);
    const W = 1159, H = 1639, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#000'; c.lineWidth = 2.5; c.strokeRect(50, 50, W - 100, H - 100);
    const txt = (t, x, y, size, weight, color, align, dir) => { c.direction = dir || 'rtl'; c.textAlign = align || 'center'; c.fillStyle = color || '#111'; c.font = (weight || 400) + ' ' + size + 'px ' + FONT; c.fillText(t, x, y); };
    txt('Assignment', W / 2, 200, 80, 700, '#000', 'center', 'ltr');
    let y = 300; txt(M.title, W / 2, y, fit(c, M.title, W - 200, 60, 700), 700, '#111');
    if (M.sub) { y += 70; txt(M.sub, W / 2, y, fit(c, M.sub, W - 200, 32), 400, '#333'); }
    if (M.grade) { y += 55; txt('الدرجة: ' + M.grade, W / 2, y, 30, 400, '#333'); }
    y += 40; c.fillStyle = '#000'; c.fillRect(W / 2 - 180, y, 360, 2);
    txt('أسماء الطلاب', W / 2, y + 80, 40, 700, '#000');
    const x0 = 100, x1 = W - 100, top = y + 125, hh = 74, rh = Math.min(96, Math.floor((H - 210 - top - hh) / Math.max(4, T.length)));
    const cols = [{ t: 'م', w: 80 }, { t: 'الاسم', w: 520 }, { t: 'الكود', w: 230 }, { t: 'ملاحظات', w: x1 - x0 - 830 }];
    let xr = x1; cols.forEach(cl => { cl.r = xr; cl.l = xr - cl.w; xr = cl.l; });
    c.fillStyle = '#e6e6e6'; c.fillRect(x0, top, x1 - x0, hh);
    cols.forEach(cl => txt(cl.t, (cl.l + cl.r) / 2, top + hh / 2 + 12, 32, 700, '#000'));
    const rows = Math.max(T.length, 4);
    for (let i = 0; i < rows; i++) {
      const yy = top + hh + i * rh, m = T[i]; if (!m) continue;
      txt(String(i + 1), (cols[0].l + cols[0].r) / 2, yy + rh / 2 + 11, 30, 700, '#111');
      const nm = m.n.trim(); txt(nm, cols[1].r - 18, yy + rh / 2 + 11, fit(c, nm, cols[1].w - 36, 34), 400, '#111', 'right');
      if (m.c) txt(String(m.c), (cols[2].l + cols[2].r) / 2, yy + rh / 2 + 11, fit(c, String(m.c), cols[2].w - 24, 32), 400, '#111', 'center', 'ltr');
      if (m.t) txt('محوّل', (cols[3].l + cols[3].r) / 2, yy + rh / 2 + 11, 30, 700, '#000');
    }
    c.strokeStyle = '#000'; c.lineWidth = 1.6; c.strokeRect(x0, top, x1 - x0, hh + rows * rh);
    for (let i = 1; i <= rows; i++) { c.beginPath(); c.moveTo(x0, top + hh + (i - 1) * rh); c.lineTo(x1, top + hh + (i - 1) * rh); c.stroke(); }
    cols.slice(1).forEach(cl => { c.beginPath(); c.moveTo(cl.r, top); c.lineTo(cl.r, top + hh + rows * rh); c.stroke(); });
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.9));
    return { bytes: new Uint8Array(await blob.arrayBuffer()), url: URL.createObjectURL(blob) };
  }

  /* ---------- PDF: الغلاف + صفحات ملفكم ---------- */
  async function withCoverPdf(id, file) {
    const { PDFDocument } = await pdfLib();
    let src; try { src = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), { ignoreEncryption: true }); } catch (e) { throw new Error('badpdf'); }
    if (!src.getPageCount()) throw new Error('badpdf');
    const out = await PDFDocument.create(), cover = await coverJpeg(id);
    const img = await out.embedJpg(cover.bytes), PW = 595.28, PH = 841.89, sc = Math.min(PW / img.width, PH / img.height);
    out.addPage([PW, PH]).drawImage(img, { x: (PW - img.width * sc) / 2, y: (PH - img.height * sc) / 2, width: img.width * sc, height: img.height * sc });
    (await out.copyPages(src, src.getPageIndices())).forEach(p => out.addPage(p));
    const bytes = await out.save();
    return { file: new File([bytes], file.name, { type: 'application/pdf' }), pages: src.getPageCount() };
  }

  /* ---------- Word: صفحة غلاف حقيقية (نص وجدول) أول المستند ---------- */
  const X = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const run = (t, o = {}) => '<w:r><w:rPr>' + (o.rtl === false ? '' : '<w:rtl/>') + (o.b ? '<w:b/><w:bCs/>' : '') + '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="' + (o.sz || 28) + '"/><w:szCs w:val="' + (o.sz || 28) + '"/></w:rPr><w:t xml:space="preserve">' + X(t) + '</w:t></w:r>';
  const para = (t, o = {}) => '<w:p><w:pPr>' + (o.rtl === false ? '' : '<w:bidi/>') + '<w:jc w:val="' + (o.jc || 'center') + '"/><w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after == null ? 160 : o.after) + '"/></w:pPr>' + (t ? run(t, o) : '') + '</w:p>';
  function coverXml(id) {
    const M = meta(id), T = team(id), rows = Math.max(4, T.length), W = [700, 4300, 2000, 1600];
    const bd = '<w:top w:val="single" w:sz="8" w:color="000000"/><w:left w:val="single" w:sz="8" w:color="000000"/><w:bottom w:val="single" w:sz="8" w:color="000000"/><w:right w:val="single" w:sz="8" w:color="000000"/><w:insideH w:val="single" w:sz="6" w:color="000000"/><w:insideV w:val="single" w:sz="6" w:color="000000"/>';
    const cell = (t, i, o = {}) => '<w:tc><w:tcPr><w:tcW w:w="' + W[i] + '" w:type="dxa"/>' + (o.head ? '<w:shd w:val="clear" w:color="auto" w:fill="E6E6E6"/>' : '') + '<w:vAlign w:val="center"/></w:tcPr>' + para(t, { jc: i === 1 && !o.head ? 'right' : 'center', after: 0, b: o.head || o.b, sz: 26, rtl: o.rtl }) + '</w:tc>';
    const row = (cells, head) => '<w:tr><w:trPr><w:trHeight w:val="' + (head ? 560 : 620) + '"/></w:trPr>' + cells.map((t, i) => cell(t, i, { head, b: !head && i === 3, rtl: !(i === 2 && !head) })).join('') + '</w:tr>';
    let tbl = '<w:tbl><w:tblPr><w:bidiVisual/><w:tblW w:w="' + W.reduce((a, b) => a + b) + '" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders>' + bd + '</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>' + W.map(w => '<w:gridCol w:w="' + w + '"/>').join('') + '</w:tblGrid>';
    tbl += row(['م', 'الاسم', 'الكود', 'ملاحظات'], true);
    for (let i = 0; i < rows; i++) { const m = T[i]; tbl += row(m ? [String(i + 1), m.n.trim(), String(m.c || ''), m.t ? 'محوّل' : ''] : ['', '', '', '']); }
    tbl += '</w:tbl>';
    return para('Assignment', { b: true, sz: 64, rtl: false, before: 1600, after: 400 })
      + para(M.title, { b: true, sz: 48, after: 200 })
      + (M.sub ? para(M.sub, { sz: 28, after: 120 }) : '') + (M.grade ? para('الدرجة: ' + M.grade, { sz: 26 }) : '')
      + para('أسماء الطلاب', { b: true, sz: 34, before: 500, after: 240 }) + tbl
      + '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  }
  async function withCoverDocx(id, file) {
    const JSZip = await zipLib(); let zip;
    try { zip = await JSZip.loadAsync(await file.arrayBuffer()); } catch (e) { throw new Error('baddoc'); }
    const f = zip.file('word/document.xml'); if (!f) throw new Error('baddoc');
    const xml = await f.async('string'), m = xml.match(/<w:body(\s[^>]*)?>/); if (!m) throw new Error('baddoc');
    zip.file('word/document.xml', xml.slice(0, m.index + m[0].length) + coverXml(id) + xml.slice(m.index + m[0].length));
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    return { file: new File([blob], file.name, { type: blob.type }) };
  }
  async function withCover(id, file) {
    const nm = (file.name || '').toLowerCase();
    if (nm.endsWith('.pdf') || file.type === 'application/pdf') return Object.assign({ kind: 'pdf' }, await withCoverPdf(id, file));
    if (nm.endsWith('.docx')) return Object.assign({ kind: 'docx' }, await withCoverDocx(id, file));
    if (nm.endsWith('.doc')) throw new Error('olddoc');
    throw new Error('type');
  }
  App.AsgUp = { coverJpeg, coverXml, withCover };

  const ERR = {
    net: 'محتاج نت مرة واحدة عشان الأداة تنزل. اتصل وجرّب تاني.',
    badpdf: 'الملف ده مش PDF سليم، أو عليه باسورد. صدّره PDF تاني وجرّب.',
    baddoc: 'ملف الوورد ده مش سليم. افتحه في Word واحفظه .docx وجرّب تاني.',
    olddoc: 'ده ملف وورد قديم (.doc). افتحه في Word واحفظه بصيغة .docx أو PDF وجرّب تاني.',
    type: 'الملف لازم يكون PDF أو Word (.docx) بس.'
  };

  /* ---------- الصفحة ---------- */
  Router.on('asgup', (view, r) => {
    const id = r.args[0] || 'asg-eco-1', n = News().get(id);
    if (!n || n.kind !== 'asg') return Router.go('news', { replace: true });
    header(view, 'ضيف حلّك + الغلاف', { back: { to: 'news/' + id, label: 'الأسايمنت' } });
    if (!(self.Sub && Sub.on())) { view.insertAdjacentHTML('beforeend', Sub.wallHTML('ضيف حلّك + الغلاف للمشتركين', 'إنتو بتحلّوا الأسايمنت، وأنا بحط صفحة الغلاف بأسامي التيم أول صفحة في ملفكم وأجهّزه للرفع.')); return; }
    const T = team(id), f = App.fatma && App.fatma(), ck = state(id).chk, fd = re => (n.checks || []).findIndex(c => re.test(c));
    const mark = (...res) => { res.forEach(re => { const i = fd(re); if (i >= 0) ck[i] = true; }); Store.save(); };
    let h = '<div class="card mb solhero">' + Char.html('', 70) + '<div class="bubble">' + (f ? 'إنتي بتحلّي، وأنا بحط الغلاف وأجهّز الملف للرفع 🪪' : 'إنت بتحل، وأنا بحط الغلاف وأجهّز الملف للرفع 🪪') + '</div></div>';
    h += '<div class="card mb note">✍️ البرنامج <b>مابيحلّش</b> الأسايمنت. حلّوه بنفسكم، واعملوه <b>PDF أو Word</b>، وضيفوه هنا. الغلاف بأسامي التيم بيتحط <b>أول صفحة</b> في نفس الملف.</div>';
    h += '<div class="group-h">1. التيم (صفحة الغلاف) <a href="#cover/' + esc(id) + '">✏️ عدّل</a></div>';
    h += T.length ? '<div class="group">' + T.map((m, i) => '<div class="row noicon"><span class="tx"><b>' + (i + 1) + '. ' + esc(m.n) + '</b><small dir="ltr" style="text-align:right">' + esc(m.c || 'من غير كود') + (m.t ? ' · محوّل' : '') + '</small></span></div>').join('') + '</div>'
      : '<div class="card mb warn">لسه مفيش أسامي. <a href="#cover/' + esc(id) + '">ضيف التيم</a> (الأسامي والأكواد، وعلّم على «محوّل»).</div>';
    h += '<div class="group-h">2. ملف حلّكم</div><label class="card tap mb upfile" id="upPick"><input type="file" id="upIn" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden><span class="up-ic">📎</span><span style="flex:1"><b id="upName">اختار ملف الحل</b><span class="note" id="upInfo" style="display:block">PDF أو Word (.docx)</span></span></label>';
    h += '<div class="btns mt solbtns"><button class="btn green" id="solUp" disabled>📤 ' + (n.link ? 'ارفع على الدرايف' : 'شارك الملف') + '</button><button class="btn" id="solDl" disabled>⬇️ نزّل الملف</button></div>';
    if (n.link) h += '<p class="note center"><a href="' + esc(n.link) + '" target="_blank" rel="noopener">افتح فولدر التسليم</a></p>';
    h += '<div class="group-h">معاينة الغلاف</div><div id="solPrev" class="solprev">' + (T.length ? '<div class="note center">بيجهّز…</div>' : '<div class="note center">ضيف التيم الأول.</div>') + '</div>';
    view.insertAdjacentHTML('beforeend', h);
    setTimeout(() => { const c = $('.solhero .char', view); if (c && App.Props) { App.Props.put(c, 'stick'); Char.act(c, 'happy'); } }, 250);

    let src = null, out = null;
    const btns = () => { const on = !!(src && T.length); $('#solUp').disabled = !on; $('#solDl').disabled = !on; };
    const busy = (b, on, t) => { b.disabled = on; if (on) { b.dataset.t = b.innerHTML; b.textContent = t; } else b.innerHTML = b.dataset.t; };
    const fail = e => { toast(ERR[e && e.message] || 'حصلت مشكلة، جرّب تاني', 'info'); haptic('error'); };
    const make = async () => out || (out = await withCover(id, src));
    $('#upIn').onchange = async e => {
      const file = e.target.files && e.target.files[0]; if (!file) return;
      const nm = file.name.toLowerCase();
      if (!/\.(pdf|docx)$/.test(nm) && file.type !== 'application/pdf') { fail(new Error(/\.doc$/.test(nm) ? 'olddoc' : 'type')); e.target.value = ''; return; }
      src = file; out = null; $('#upName').textContent = file.name; $('#upInfo').textContent = 'بيتأكد من الملف…'; btns();
      if (!T.length) { $('#upInfo').textContent = 'ضيف التيم الأول عشان الغلاف'; return; }
      try { const o = await make(); $('#upInfo').textContent = o.kind === 'pdf' ? '✓ PDF · ' + o.pages + ' صفحة + الغلاف = ' + (o.pages + 1) : '✓ Word · الغلاف هيبقى أول صفحة'; mark(/عملناه/); }
      catch (err) { src = null; $('#upName').textContent = 'اختار ملف الحل'; $('#upInfo').textContent = 'PDF أو Word (.docx)'; e.target.value = ''; btns(); fail(err); }
    };
    const download = file => { const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); };
    $('#solDl').onclick = async () => { const b = $('#solDl'); busy(b, true, 'بيجهّز…'); try { download((await make()).file); mark(/الغلاف/); toast('اتنزّل الملف ✓', 'check'); haptic('success'); } catch (e) { fail(e); } busy(b, false); };
    const sure = () => new Promise(res => {
      let done = false;
      const warn = (n.warn || []).concat(['<b>واحد بس</b> من التيم يرفع، و<b>مرة واحدة</b> بس.', 'اتأكدوا إن ده <b>ملف حلّكم النهائي</b>.']);
      U.sheet({ title: 'متأكد إنك عايز ترفع؟', cancelText: 'رجوع',
        body: '<div class="sure">' + Char.html('', 64) + '<div class="bubble">' + (f ? 'استني ثانية قبل ما ترفعي 🤚' : 'استنى ثانية قبل ما ترفع 🤚') + '</div></div><ul class="surel">' + warn.map(w => '<li>⚠️ ' + w + '</li>').join('') + '</ul>'
          + '<button class="btn block green" data-yes>📤 أيوه، ارفع دلوقتي</button><button class="btn block gray mt" data-no>⏳ لسه</button>',
        onOpen: a => { const c = a.body.querySelector('.char'); if (c && App.Props) { App.Props.put(c, 'stick'); Char.act(c, 'nod'); } a.body.querySelector('[data-yes]').onclick = () => { done = true; a.close(true); res(true); }; a.body.querySelector('[data-no]').onclick = () => { done = true; a.close(false); res(false); }; },
        onClose: () => { if (!done) res(false); } });
    });
    $('#solUp').onclick = async () => {
      const b = $('#solUp'); busy(b, true, 'بيجهّز…');
      try {
        const file = (await make()).file; mark(/الغلاف/); busy(b, false);
        if (!(await sure())) { toast('تمام، الملف جاهز وقت ما تحب 👌', 'info'); return; }
        busy(b, true, 'بيفتح…');
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: file.name }); mark(/رفع|سلّمنا/); toast(n.link ? 'اختار Drive وبعدين فولدر التسليم ✓' : 'تمام ✓', 'check'); }
          catch (e) { if (e && e.name !== 'AbortError') { download(file); if (n.link) open(n.link, '_blank'); } }
        } else {
          download(file); if (n.link) setTimeout(() => open(n.link, '_blank', 'noopener'), 400);
          toast(n.link ? 'نزل الملف ✓ وفتحتلك الفولدر: دوس «جديد» ← «تحميل ملف» واختاره' : 'نزل الملف ✓', 'check');
        }
        haptic('success');
      } catch (e) { fail(e); }
      busy(b, false);
    };
    if (T.length) coverJpeg(id).then(cv => { const box = $('#solPrev'); if (box) box.innerHTML = '<figure><img src="' + cv.url + '" alt="صفحة الغلاف"><figcaption>صفحة 1: الغلاف · بعدها صفحات ملفكم</figcaption></figure>'; });
  });
})();
