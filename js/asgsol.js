/* مذاكِر — «ضيف حلك + الغلاف»: الطالب بيحل الأسايمنت بنفسه، والبرنامج بيحط صفحة الغلاف بأسامي التيم أول صفحة في ملفه (PDF أو Word) ويرفعه.
   البرنامج مابيحلّش أي أسايمنت. */
(function () {
  'use strict';
  const U = self.UI, { $, $$, esc, Store, Router, header, toast, Char, haptic } = U;
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

  /* ---------- PDF: (الغلاف) + صفحات ملفكم ---------- */
  const PW = 595.28, PH = 841.89;
  async function addJpeg(out, bytes, pad) { const img = await out.embedJpg(bytes), m = pad || 0, sc = Math.min((PW - 2 * m) / img.width, (PH - 2 * m) / img.height); out.addPage([PW, PH]).drawImage(img, { x: (PW - img.width * sc) / 2, y: (PH - img.height * sc) / 2, width: img.width * sc, height: img.height * sc }); }
  async function startDoc(id, cover) { const { PDFDocument } = await pdfLib(), out = await PDFDocument.create(); if (cover) await addJpeg(out, (await coverJpeg(id)).bytes); return out; }
  async function withCoverPdf(id, file, cover) {
    const { PDFDocument } = await pdfLib();
    let src; try { src = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), { ignoreEncryption: true }); } catch (e) { throw new Error('badpdf'); }
    if (!src.getPageCount()) throw new Error('badpdf');
    const out = await startDoc(id, cover);
    (await out.copyPages(src, src.getPageIndices())).forEach(p => out.addPage(p));
    return { file: new File([await out.save()], file.name, { type: 'application/pdf' }), pages: src.getPageCount() };
  }

  /* ---------- صور الورق (متصوّرة بالموبايل) ← صفحات PDF ---------- */
  async function photoJpeg(file) {
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (e) { bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('badimg')); i.src = URL.createObjectURL(file); }); }
    const w0 = bmp.width || bmp.naturalWidth, h0 = bmp.height || bmp.naturalHeight; if (!w0 || !h0) throw new Error('badimg');
    const k = Math.min(1, 2000 / Math.max(w0, h0)), c = document.createElement('canvas'); c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height); if (bmp.close) bmp.close();
    return jpeg(c);
  }
  async function withCoverImgs(id, files, cover, name) {
    const out = await startDoc(id, cover);
    for (const fl of files) await addJpeg(out, await photoJpeg(fl), 14);
    return { file: new File([await out.save()], name, { type: 'application/pdf' }), pages: files.length };
  }

  /* ---------- Word ← صفحات PDF: بنعرض المستند جوه الصفحة ونصوّر كل صفحة ---------- */
  const docxLib = () => zipLib().then(() => lib('docx', 'js/vendor/docx-preview.min.js', 'docx'));
  const shotLib = () => lib('h2c', 'js/vendor/html2canvas.min.js', 'html2canvas');
  /** بيقطّع صفحة طويلة على مقاس A4، والقطع بيدوّر على سطر فاضي عشان مايقطعش في نص الكلام */
  function slices(cv) {
    const W = cv.width, H = cv.height, PH = Math.round(W * 841.89 / 595.28), out = [];
    const g = cv.getContext('2d', { willReadFrequently: true });
    const blank = y => { const d = g.getImageData(0, y, W, 1).data; for (let i = 0; i < d.length; i += 16) if (d[i] < 235 || d[i + 1] < 235 || d[i + 2] < 235) return false; return true; };
    const M = Math.round(PH * 0.06); let y = 0; // هامش فوق وتحت للصفحات اللي بتتقسم
    while (y < H - 4) {
      const top = y ? M : 0, room = PH - top - (H - y > PH ? M : 0);
      let end = Math.min(H, y + room);
      if (end < H) { for (let t = end; t > y + room * 0.75; t--) if (blank(t)) { end = t; break; } }
      const c = document.createElement('canvas'); c.width = W; c.height = PH; const x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, W, PH); x.drawImage(cv, 0, y, W, end - y, 0, top, W, end - y); out.push(c); y = end;
    }
    return out;
  }
  const jpeg = c => new Promise(r => c.toBlob(r, 'image/jpeg', 0.88)).then(b => b.arrayBuffer()).then(a => new Uint8Array(a));
  async function docxPages(file) {
    const [docx, h2c] = await Promise.all([docxLib(), shotLib()]);
    const box = document.createElement('div'); box.className = 'docx-render';
    box.style.cssText = 'position:fixed;left:-20000px;top:0;width:auto;background:#fff;color:#000;direction:ltr;text-align:left;font-size:16px;line-height:normal;z-index:-1';
    document.body.appendChild(box);
    try {
      try { await docx.renderAsync(await file.arrayBuffer(), box, null, { inWrapper: false, breakPages: true, ignoreLastRenderedPageBreak: false, renderHeaders: true, renderFooters: true, experimental: true }); }
      catch (e) { throw new Error('baddoc'); }
      box.querySelectorAll('p').forEach(p => { p.dir = 'auto'; }); // الفقرة العربي تتعرض من اليمين، والإنجليزي اللي جواها يفضل في مكانه
      try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
      const secs = [...box.querySelectorAll('section.docx')]; if (!secs.length) throw new Error('baddoc');
      const pages = [];
      for (const s of secs) { const cv = await h2c(s, { scale: 2, backgroundColor: '#fff', logging: false, useCORS: true }); for (const c of slices(cv)) pages.push(await jpeg(c)); }
      return pages;
    } finally { box.remove(); }
  }
  async function withCoverDocx(id, file, cover) {
    const pages = await docxPages(file), out = await startDoc(id, cover);
    for (const b of pages) await addJpeg(out, b);
    return { file: new File([await out.save()], file.name.replace(/\.docx$/i, '') + '.pdf', { type: 'application/pdf' }), pages: pages.length };
  }
  const isImg = f => /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name || '');
  /** src = { files: [...] } صور، أو { file } ملف PDF/Word */
  async function withCover(id, src, cover = true) {
    if (src.files) return Object.assign({ kind: 'img' }, await withCoverImgs(id, src.files, cover, src.name || 'Assignment.pdf'));
    const file = src.file || src, nm = (file.name || '').toLowerCase();
    if (nm.endsWith('.pdf') || file.type === 'application/pdf') return Object.assign({ kind: 'pdf' }, await withCoverPdf(id, file, cover));
    if (nm.endsWith('.docx')) return Object.assign({ kind: 'docx' }, await withCoverDocx(id, file, cover));
    if (nm.endsWith('.doc')) throw new Error('olddoc');
    throw new Error('type');
  }
  App.AsgUp = { coverJpeg, withCover };

  const ERR = {
    net: 'محتاج نت مرة واحدة عشان الأداة تنزل. اتصل وجرّب تاني.',
    badpdf: 'الملف ده مش PDF سليم، أو عليه باسورد. صدّره PDF تاني وجرّب.',
    baddoc: 'ملف الوورد ده مش سليم. افتحه في Word واحفظه .docx وجرّب تاني.',
    olddoc: 'ده ملف وورد قديم (.doc). افتحه في Word واحفظه بصيغة .docx أو PDF وجرّب تاني.',
    type: 'الملف لازم يكون PDF أو Word (.docx) بس.',
    pdfonly: 'الأسايمنت ده بخط الإيد: صوّروا الورق وضيفوا الصور، أو ضيفوا ملف PDF.',
    badimg: 'فيه صورة مش عارف أفتحها. صوّرها تاني وجرّب.'
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
    const A = state(id), own = () => !!A.ownCover;
    h += '<div class="card mb note">✍️ البرنامج <b>مابيحلّش</b> الأسايمنت. ' + (n.pdfOnly ? 'اكتبوه <b>بخط الإيد</b>، <b>صوّروا الصفحات</b> وضيفوا الصور هنا (أو ملف PDF).' : 'حلّوه بنفسكم، وضيفوا صور الورق أو ملفكم هنا (<b>PDF أو Word</b>).') + ' والملف كله بيطلع <b>PDF واحد</b> جاهز للرفع.</div>';
    h += '<div class="group-h">1. صفحة الغلاف</div><div class="seg mb" id="cvMode"><button data-cv="app"' + (own() ? '' : ' class="on"') + '>🪪 من البرنامج</button><button data-cv="own"' + (own() ? ' class="on"' : '') + '>✍️ كاتبينها بخط الإيد</button></div>';
    h += '<div id="cvTeam">' + (T.length ? '<div class="group">' + T.map((m, i) => '<div class="row noicon"><span class="tx"><b>' + (i + 1) + '. ' + esc(m.n) + '</b><small dir="ltr" style="text-align:right">' + esc(m.c || 'من غير كود') + (m.t ? ' · محوّل' : '') + '</small></span></div>').join('') + '</div><p class="note"><a href="#cover/' + esc(id) + '">✏️ عدّل الأسامي</a></p>'
      : '<div class="card mb warn">لسه مفيش أسامي. <a href="#cover/' + esc(id) + '">ضيف التيم</a> (الأسامي والأكواد، وعلّم على «محوّل»).</div>') + '</div>';
    h += '<p class="note" id="cvOwnNote">صفحة الغلاف اللي كاتبينها صوّروها مع الصفحات وخلّوها <b>أول صورة</b>.</p>';
    const acc = 'image/*,.pdf,application/pdf' + (n.pdfOnly ? '' : ',.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    h += '<div class="group-h">2. حلّكم</div><div class="btns mb"><label class="btn tint" id="upPhotos"><input type="file" id="upImg" accept="image/*" multiple hidden>📷 ضيف صور الصفحات</label><label class="btn gray" id="upPick"><input type="file" id="upIn" accept="' + acc + '" hidden>📎 ' + (n.pdfOnly ? 'أو ملف PDF' : 'أو ملف PDF / Word') + '</label></div>';
    h += '<div class="card mb upfile"><span class="up-ic">📄</span><span style="flex:1"><b id="upName">لسه مفيش صفحات</b><span class="note" id="upInfo" style="display:block">صوّروا كل صفحة لوحدها، في نور كويس ومن فوق.</span></span></div><div id="upThumbs" class="upthumbs"></div>';
    h += '<div class="btns mt solbtns"><button class="btn green" id="solUp" disabled>📤 ' + (n.link ? 'ارفع على الدرايف' : 'شارك الملف') + '</button><button class="btn" id="solDl" disabled>⬇️ نزّل الـ PDF</button></div>';
    if (n.link) h += '<p class="note center"><a href="' + esc(n.link) + '" target="_blank" rel="noopener">افتح فولدر التسليم</a></p>';
    h += '<div id="prevW"><div class="group-h">معاينة الغلاف</div><div id="solPrev" class="solprev">' + (T.length ? '<div class="note center">بيجهّز…</div>' : '<div class="note center">ضيف التيم الأول.</div>') + '</div></div>';
    view.insertAdjacentHTML('beforeend', h);
    setTimeout(() => { const c = $('.solhero .char', view); if (c && App.Props) { App.Props.put(c, 'stick'); Char.act(c, 'happy'); } }, 250);

    let src = null, imgs = [], out = null;
    const ready = () => !!src && (own() || T.length);
    const btns = () => { $('#solUp').disabled = !ready(); $('#solDl').disabled = !ready(); };
    const busy = (b, on, t) => { b.disabled = on; if (on) { b.dataset.t = b.innerHTML; b.textContent = t; } else b.innerHTML = b.dataset.t; };
    const fail = e => { toast(ERR[e && e.message] || 'حصلت مشكلة، جرّب تاني', 'info'); haptic('error'); };
    const make = async () => out || (out = await withCover(id, src, !own()));
    const pdfName = () => n.fileName || 'Assignment.pdf'; // اسم إنجليزي: الأسامي العربي بتبوّظ التنزيل في بعض المتصفحات
    const modeUI = () => { $('#cvTeam').hidden = own(); $('#cvOwnNote').hidden = !own(); $('#prevW').hidden = own(); $$('#cvMode button').forEach(x => x.classList.toggle('on', (x.dataset.cv === 'own') === own())); };
    const info = async () => {
      btns();
      if (!src) { $('#upName').textContent = 'لسه مفيش صفحات'; $('#upInfo').textContent = 'صوّروا كل صفحة لوحدها، في نور كويس ومن فوق.'; return; }
      if (!own() && !T.length) { $('#upInfo').textContent = 'ضيف التيم الأول عشان الغلاف'; return; }
      $('#upInfo').textContent = src.files ? 'بيجهّز الصفحات…' : /\.docx$/i.test(src.file.name) ? 'بيحوّل الوورد لـ PDF…' : 'بيتأكد من الملف…';
      try {
        const o = await make(), cv = own() ? 0 : 1;
        $('#upInfo').textContent = (o.kind === 'img' ? '✓ ' + o.pages + ' صورة' : o.kind === 'pdf' ? '✓ PDF · ' + o.pages + ' صفحة' : '✓ Word ← اتحوّل PDF · ' + o.pages + ' صفحة') + (cv ? ' + الغلاف = ' + (o.pages + 1) + ' صفحة' : '') + ' في PDF واحد';
        mark(/سكان|عملناه|صوّرنا/);
      } catch (err) { if (!src.files) { src = null; $('#upName').textContent = 'لسه مفيش صفحات'; } btns(); fail(err); $('#upInfo').textContent = 'جرّب تاني.'; }
    };
    const thumbs = () => {
      const box = $('#upThumbs'); [...box.querySelectorAll('img')].forEach(i => URL.revokeObjectURL(i.src));
      box.innerHTML = imgs.map((fl, i) => '<figure><img src="' + URL.createObjectURL(fl) + '" alt="صفحة ' + (i + 1) + '"><figcaption><b>' + (i + 1) + '</b><span><button class="ib" data-mv="' + i + '" data-d="-1" aria-label="قبلها"' + (i ? '' : ' disabled') + '>→</button><button class="ib" data-mv="' + i + '" data-d="1" aria-label="بعدها"' + (i < imgs.length - 1 ? '' : ' disabled') + '>←</button><button class="ib" data-rm="' + i + '" aria-label="شيل">✕</button></span></figcaption></figure>').join('');
      box.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => { const i = +b.dataset.mv, j = i + +b.dataset.d; [imgs[i], imgs[j]] = [imgs[j], imgs[i]]; setImgs(); });
      box.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { imgs.splice(+b.dataset.rm, 1); setImgs(); });
    };
    const setImgs = () => { out = null; src = imgs.length ? { files: imgs.slice(), name: pdfName() } : null; $('#upName').textContent = imgs.length ? imgs.length + ' صفحة متصوّرة' : 'لسه مفيش صفحات'; thumbs(); info(); };
    $$('#cvMode button').forEach(b => b.onclick = () => { A.ownCover = b.dataset.cv === 'own'; Store.save(); out = null; modeUI(); info(); });
    modeUI();
    $('#upImg').onchange = e => {
      const fs = [...(e.target.files || [])]; e.target.value = ''; if (!fs.length) return;
      if (fs.some(x => !isImg(x))) { fail(new Error('badimg')); return; }
      if (src && src.file) imgs = []; imgs = imgs.concat(fs); setImgs();
    };
    $('#upIn').onchange = async e => {
      const file = e.target.files && e.target.files[0]; e.target.value = ''; if (!file) return;
      const nm = file.name.toLowerCase();
      if (isImg(file)) { imgs = (src && src.file ? [] : imgs).concat([file]); setImgs(); return; }
      if (n.pdfOnly && !/\.pdf$/.test(nm) && file.type !== 'application/pdf') { fail(new Error('pdfonly')); return; }
      if (!/\.(pdf|docx)$/.test(nm) && file.type !== 'application/pdf') { fail(new Error(/\.doc$/.test(nm) ? 'olddoc' : 'type')); return; }
      imgs = []; thumbs(); src = { file }; out = null; $('#upName').textContent = file.name; info();
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
