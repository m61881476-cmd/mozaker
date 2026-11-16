/* مذاكِر — الاشتراك: فتح المحتوى المدفوع، صفحة الاشتراك، التفعيل، ولوحة الأدمن.
   الجزء الأول بيشتغل فورًا (قبل app.js) عشان يدمج المحتوى المفتوح قبل ما البرنامج يقرا المواد. */
(function () {
  'use strict';
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
  const PRICE = 250, INSTAPAY = '01284134090', WHATSAPP = '01206580045', WA_INTL = '201206580045';
  const TERM_END = '2027-02-28';
  const KEYS = self.MZ_KEYS || {};

  /* ---------- (1) فتح المحتوى فورًا لو فيه اشتراك ---------- */
  const lic = LS.get('mz:lic', null);
  const expired = l => !!(l && l.exp && Date.now() > l.exp + 864e5);
  let paidOn = false;
  function merge(paid) {
    for (const S of self.MZ_CONTENT || []) {
      const P = paid && paid.subjects && paid.subjects[S.id]; if (!P) continue;
      S.lessons.forEach(l => { if (P.lessons[l.id] != null) { l.summary = P.lessons[l.id]; delete l.locked; } });
      S.questions.push(...(P.questions || [])); S.cards.push(...(P.cards || [])); S.concepts.push(...(P.concepts || []));
      S.figs = Object.assign(S.figs || {}, P.figs); S.boards = Object.assign(S.boards || {}, P.boards);
      S.must = P.must; S.howto = P.howto; S.lockedConcepts = []; S.unlocked = true;
    }
  }
  if (lic && !expired(lic)) {
    try { const raw = localStorage.getItem('mz:paid'); if (raw) { merge(JSON.parse(raw)); paidOn = true; } } catch (e) { paidOn = false; }
  }

  /* ---------- (2) أدوات ---------- */
  function device() { let d = LS.get('mz:dev', null); if (!d) { d = License.newDevice(); LS.set('mz:dev', d); } return d; }
  const fmtDate = d => { try { return new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return String(d).slice(0, 10); } };
  async function fetchPaid() { const r = await fetch('content/paid.mz', { cache: 'no-cache' }); if (!r.ok) throw new Error('net'); return new Uint8Array(await r.arrayBuffer()); }
  function wipe() { ['mz:lic', 'mz:paid', 'mz:k'].forEach(LS.del); }
  async function store(K, licObj) {
    const paid = await License.decryptJSON(K, await fetchPaid());
    try { localStorage.setItem('mz:paid', JSON.stringify(paid)); } catch (e) { throw new Error('space'); }
    LS.set('mz:k', License.b64u.enc(K)); LS.set('mz:lic', licObj);
  }
  const MSG = {
    format: 'ده مش كود تفعيل. انسخ الكود كله زي ما وصلك (بيبدأ بـ MZ1.) أو اكتب الكود الخاص بتاعك.',
    sig: 'الكود ده مش سليم. اتأكد إنك نسخته كله من غير ما يتقطع.',
    device: 'الكود ده متطلّع لجهاز تاني. كل كود بيشتغل على جهاز واحد بس. لو ده جهازك الجديد ابعت لمحمد رقم جهازك اللي تحت وهيبعتلك كود جديد.',
    name: 'الكود ده متطلّع باسم تاني. اكتب اسمك بالظبط زي ما بعته في رسالة الاشتراك.',
    expired: 'الكود ده مدته خلصت. جدّد الاشتراك من نفس الصفحة.',
    vanity: 'الكود ده مش صحيح، أو الاسم مش مطابق ليه.',
    net: 'محتاج نت مرة واحدة بس عشان المحتوى ينزل. اتصل بالنت وجرّب تاني.',
    space: 'مساحة المتصفح مليانة. امسح شوية بيانات من المتصفح وجرّب تاني.'
  };
  /** تفعيل: كود موقّع أو كود خاص */
  async function activate(text, name) {
    text = String(text || '').trim(); name = String(name || '').trim();
    if (!text) return { ok: false, msg: 'الصق الكود الأول.' };
    if (!name) return { ok: false, msg: 'اكتب اسمك الأول (نفس الاسم اللي بعته في رسالة الاشتراك).' };
    try {
      if (License.extract(text)) {
        const r = await License.verify(text, { pubJwk: KEYS.pub, device: device(), name });
        if (!r.ok) return { ok: false, msg: MSG[r.reason] || MSG.format, reason: r.reason };
        if ((LS.get('mz:revoked', []) || []).includes(r.serial)) return { ok: false, msg: 'الكود ده اتلغى. كلّم محمد على واتساب.' };
        await store(r.K, { kind: 'code', code: License.extract(text), name, plan: r.plan, exp: r.exp ? r.exp.getTime() : null, serial: r.serial, at: Date.now() });
        return { ok: true, plan: r.plan };
      }
      const v = await License.tryVanity(text, name, KEYS.vanity, KEYS.vsalt);
      if (!v) return { ok: false, msg: MSG.vanity };
      await store(License.b64u.dec(v.K), { kind: 'vanity', name, plan: v.plan, exp: null, who: v.who, label: v.label, admin: !!v.admin, ap: v.ap || null, at: Date.now() });
      return { ok: true, plan: v.plan, who: v.who };
    } catch (e) { return { ok: false, msg: MSG[e.message] || MSG.net }; }
  }
  /** بعد التشغيل: نتأكد من الكود، ومن قايمة الأكواد الملغية، ونحدّث المحتوى لو نزل جديد */
  async function check() {
    const L0 = LS.get('mz:lic', null); if (!L0) return;
    if (L0.kind === 'code') {
      const r = await License.verify(L0.code, { pubJwk: KEYS.pub, device: device(), name: L0.name });
      if (!r.ok && r.reason !== 'expired') { wipe(); location.reload(); return; }
    }
    try {
      const res = await fetch('data/revoked.json?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const rv = await res.json(); LS.set('mz:revoked', rv.serials || []);
        if ((L0.kind === 'code' && (rv.serials || []).includes(L0.serial)) || (L0.kind === 'vanity' && (rv.who || []).includes(L0.who))) { wipe(); location.reload(); return; }
      }
    } catch (e) { /* من غير نت: نكمّل */ }
    if (expired(L0)) return;
    let cur = null; try { cur = JSON.parse(localStorage.getItem('mz:paid') || 'null'); } catch (e) {}
    if (self.MZ_PAID_VER && (!cur || cur.ver !== self.MZ_PAID_VER) && !sessionStorage.getItem('mz:upd')) {
      try {
        const K = License.b64u.dec(LS.get('mz:k', '')); await store(K, L0);
        sessionStorage.setItem('mz:upd', '1');
        if (self.UI) UI.toast('نزل محتوى جديد 🎉', 'spark');
        setTimeout(() => location.reload(), 900);
      } catch (e) { /* نجرّب المرة الجاية */ }
    }
  }

  const Sub = {
    PRICE, INSTAPAY, WHATSAPP, WA_INTL,
    on: () => paidOn,
    info: () => LS.get('mz:lic', null),
    expired: () => expired(LS.get('mz:lic', null)),
    device, activate, check, merge,
    who: () => { const l = LS.get('mz:lic', null); return l && paidOn ? l.who || null : null; },
    wa: text => 'https://wa.me/' + WA_INTL + '?text=' + encodeURIComponent(text),
    /** المادة دي فيها جزء مقفول؟ */
    lockedSubject: s => !!(s && s.paid && !s.unlocked)
  };
  self.Sub = Sub;

  /* ---------- (3) الصفحات (بتتسجل لما الواجهة تبقى جاهزة) ---------- */
  if (!self.UI) return;
  const { $, $$, esc, icon, Router, header, toast, Char, haptic, beep, sheet } = UI;
  const FEATURES = [
    ['📚', 'كل فصول المواد المتاحة', 'التسويق كامل والاقتصاد الكلي، وكل فصل جديد أول ما ينزل'],
    ['🆕', 'المواد الجاية من غير فلوس زيادة', 'إدارة الإنتاج، القانون التجاري، المحاسبة، والإحصاء أول ما يجهزوا'],
    ['🎬', 'شرح على البورد بالصوت', 'سبورة بتتكتب وتترسم قدامك وسَنَد بيشرح خطوة خطوة'],
    ['⭐', 'الأسئلة المتوقعة بالتفرعات', 'مئات الأسئلة بالشرح، وكل اختيار غلط بيتقالك بيبقى صح إمتى'],
    ['🏁', 'المراجعة النهائية والماراثون', '«حاجات حتمًا هتيجي» و«إزاي تحل كل نوع سؤال»'],
    ['🎓', 'ذاكر معايا', 'الدرس حتة حتة وسؤال بعد كل جزء'],
    ['🖼️', 'الرسومات والتدريب عليها', 'هرم ماسلو ودورة حياة المنتج وغيرهم'],
    ['💬', 'سَنَد يفهمك في كل المنهج', 'اسأله أي سؤال في المادة بالعامية'],
    ['📴', 'شغال من غير نت', 'بعد التفعيل كل حاجة على موبايلك']
  ];
  const featHTML = () => '<div class="group feat">' + FEATURES.map(f => '<div class="row noicon"><span class="fe">' + f[0] + '</span><span class="tx"><b>' + esc(f[1]) + '</b><small>' + esc(f[2]) + '</small></span></div>').join('') + '</div>';

  /** صفحة «الدرس ده للمشتركين» */
  Sub.wallHTML = (title, sub) => '<div class="card paywall">' + Char.html('', 64) + '<div class="pw-t"><b>🔒 ' + esc(title || 'الجزء ده للمشتركين') + '</b><span>' + esc(sub || 'اشترك مرة واحدة للترم كله وكل حاجة تتفتح، ومعاها المواد الجاية.') + '</span></div><a class="btn block" href="#subscribe">⭐ اشترك الترم كامل · ' + PRICE + ' ج</a><a class="btn block tint mt" href="#subscribe?have=1">معايا كود</a></div>';

  Router.on('subscribe', (view, r) => {
    const L0 = LS.get('mz:lic', null), on = paidOn, d = device();
    header(view, 'الاشتراك', { back: { to: 'home', label: 'الرئيسية' } });
    let h = '';
    if (on && L0) {
      const vip = L0.plan === 'vip';
      h += '<div class="card subok">' + Char.html('', 70) + '<div><b>' + (L0.who === 'fatma' ? 'كل حاجة مفتوحة ليكي يا فاطمة 🤍' : L0.who === 'owner' ? 'أهلًا يا مخترع 👑' : 'إنت مشترك ✓') + '</b><span>' + (vip ? '⭐ VIP · من غير مدة' : 'صالح لحد ' + esc(fmtDate(L0.exp))) + '</span><span>النسخة دي باسم: <b>' + esc(L0.name) + '</b></span></div></div>';
      if (L0.admin) h += '<a class="btn block mb" href="#admin">' + icon('lock') + 'لوحة الأدمن (الأكواد)</a>';
      h += '<div class="group-h">معاك دلوقتي</div>' + featHTML();
      view.insertAdjacentHTML('beforeend', h + '<p class="note center">رقم جهازك: <b dir="ltr">' + esc(License.prettyDevice(d)) + '</b></p>');
      return;
    }
    if (L0 && expired(L0)) h += '<div class="warn">' + icon('info') + ' اشتراكك خلص في ' + esc(fmtDate(L0.exp)) + '. جدّده من هنا.</div>';
    const pend = LS.get('mz:subreq', {});
    const rq = pend.req || ('R' + License.b32enc(License.rand(3)).slice(0, 5));
    h += '<div class="card subhero">' + Char.html('', 78) + '<div><span class="pill star">الترم كامل</span><b class="price">' + PRICE + ' <small>جنيه</small></b><span>كل المواد، كل الفصول، ومن غير اشتراك شهري</span></div></div>';
    h += '<div class="group-h">هتاخد إيه</div>' + featHTML();
    h += '<div class="group-h" id="steps">خطوات الاشتراك</div><div class="card steps">'
      + '<div class="st"><span class="stepn">1</span><div><b>اكتب اسمك الثلاثي</b><span class="note">الكود هيتربط باسمك وجهازك، فمحدش غيرك يقدر يستخدمه.</span><input class="input mt" id="sbName" placeholder="مثال: أحمد محمد علي" value="' + esc(pend.name || '') + '" autocomplete="name"></div></div>'
      + '<div class="st"><span class="stepn">2</span><div><b>حوّل ' + PRICE + ' جنيه إنستا باي</b><span class="note">على الرقم ده، واكتب اسمك في ملاحظة التحويل.</span><div class="paynum"><b dir="ltr">' + INSTAPAY + '</b><button class="btn sm tint" id="cpPay">' + icon('note') + 'انسخ</button></div></div></div>'
      + '<div class="st"><span class="stepn">3</span><div><b>ابعت سكرين التحويل على واتساب</b><span class="note">لمحمد على <b dir="ltr">' + WHATSAPP + '</b>. الرسالة جاهزة فيها اسمك ورقم جهازك.</span><button class="btn block green mt" id="waGo">' + icon('chat') + 'افتح واتساب وابعت</button></div></div>'
      + '<div class="st"><span class="stepn">4</span><div><b>هيوصلك كود التفعيل</b><span class="note">الصقه هنا ودوس فعّل. أو دوس على اللينك اللي هيوصلك.</span></div></div>'
      + '</div>';
    h += '<div class="group-h" id="have">معاك كود؟</div><div class="card"><textarea class="input" id="sbCode" rows="3" dir="ltr" placeholder="الصق كود التفعيل هنا (أو الكود الخاص)"></textarea><button class="btn block mt" id="sbGo">' + icon('check') + 'فعّل</button><div id="sbMsg"></div></div>';
    h += '<p class="note center mt">رقم جهازك: <b dir="ltr">' + esc(License.prettyDevice(d)) + '</b> · أي مشكلة كلّم محمد على <a href="' + Sub.wa('محتاج مساعدة في مذاكِر. رقم جهازي: ' + License.prettyDevice(d)) + '" target="_blank" rel="noopener" dir="ltr">' + WHATSAPP + '</a></p>';
    view.insertAdjacentHTML('beforeend', h);
    const nameIn = $('#sbName'), save = () => LS.set('mz:subreq', { name: nameIn.value.trim(), req: rq, at: Date.now() });
    nameIn.oninput = save;
    $('#cpPay').onclick = () => { copy(INSTAPAY); toast('اتنسخ الرقم', 'check'); };
    $('#waGo').onclick = () => {
      const nm = nameIn.value.trim(); if (nm.split(/\s+/).length < 2) { toast('اكتب اسمك الثلاثي الأول'); nameIn.focus(); return; }
      save();
      const msg = 'السلام عليكم 👋\nحوّلت ' + PRICE + ' جنيه إنستا باي لاشتراك مذاكِر (الترم كامل).\nالاسم: ' + nm + '\nرقم الجهاز: ' + License.prettyDevice(d) + '\nرقم الطلب: ' + rq + '\n(السكرين مرفق)';
      open(Sub.wa(msg));
    };
    const codeIn = $('#sbCode'), msgEl = $('#sbMsg');
    if (r.args[0]) codeIn.value = decodeURIComponent(r.args.join('/'));
    const go = async () => {
      const nm = nameIn.value.trim() || pend.name || '';
      if (!nm) { msgEl.innerHTML = '<p class="warn-t mt">اكتب اسمك فوق في خطوة 1 (نفس الاسم اللي بعته) وبعدين دوس فعّل.</p>'; nameIn.focus(); return; }
      save(); const b = $('#sbGo'); b.disabled = true; b.textContent = 'ثانية واحدة…';
      const res = await activate(codeIn.value, nm);
      b.disabled = false; b.innerHTML = icon('check') + 'فعّل';
      if (!res.ok) { msgEl.innerHTML = '<p class="warn mt">' + esc(res.msg) + (res.reason === 'device' ? '<br>رقم جهازك: <b dir="ltr">' + esc(License.prettyDevice(d)) + '</b>' : '') + '</p>'; haptic('error'); return; }
      haptic('success'); beep('done');
      sessionStorage.setItem('mz:welcome', res.who || 'sub');
      location.hash = '#home'; location.reload();
    };
    $('#sbGo').onclick = go;
    if (r.args[0] && (pend.name || nameIn.value)) setTimeout(go, 300);
    if (r.q.have) setTimeout(() => $('#have').scrollIntoView({ behavior: 'smooth' }), 300);
  });
  Router.on('activate', (view, r) => Router.go('subscribe/' + r.args.join('/'), { replace: true }));
  function copy(t) { try { navigator.clipboard.writeText(t); } catch (e) { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); } }
  function open(url) { const w = window.open(url, '_blank'); if (!w) location.href = url; }
  Sub.copy = copy;

  /* ---------- (4) لوحة الأدمن ---------- */
  let ADM = null;
  Router.on('admin', view => {
    header(view, 'لوحة الأدمن', { back: { to: 'subscribe', label: 'الاشتراك' } });
    const LA = LS.get('mz:lic', null);
    if (!ADM && LA && LA.admin && LA.ap) { view.insertAdjacentHTML('beforeend', '<p class="note center">بيفتح…</p>'); License.openAdminBundle(LA.ap, KEYS.admin).then(a => { ADM = { privJwk: a.privJwk, K: License.b64u.dec(a.K) }; Router.render(); }).catch(() => { LA.ap = null; LS.set('mz:lic', LA); Router.render(); }); return; }
    if (!ADM) {
      view.insertAdjacentHTML('beforeend', '<div class="card"><b>كلمة سر الأدمن</b><p class="note">بتفتح المفتاح اللي بيطلّع الأكواد. مابتتحفظش، ومحدش يقدر يطلّع كود من غيرها.</p><input class="input" id="admPw" type="password" dir="ltr" autocomplete="current-password" placeholder="MZK-XXXX-XXXX-XXXX-XXXX"><button class="btn block mt" id="admGo">' + icon('lock') + 'افتح</button><p id="admMsg"></p></div>');
      $('#admGo').onclick = async () => {
        const b = $('#admGo'); b.disabled = true; b.textContent = 'بيفتح…';
        try { const a = await License.openAdminBundle($('#admPw').value.trim(), KEYS.admin); ADM = { privJwk: a.privJwk, K: License.b64u.dec(a.K) }; Router.render(); }
        catch (e) { $('#admMsg').innerHTML = '<p class="warn mt">كلمة السر غلط.</p>'; b.disabled = false; b.innerHTML = icon('lock') + 'افتح'; }
      };
      return;
    }
    const log = LS.get('mz:adminlog', []);
    let h = '<div class="card"><b>كود جديد</b><p class="note">الصق رسالة الواتساب اللي وصلتك كلها، وأنا هطلّع منها الاسم ورقم الجهاز. <b>اتأكد من التحويل في تطبيق إنستا باي بتاعك</b> قبل ما تطلّع الكود، مش من السكرين.</p>'
      + '<textarea class="input" id="aMsg" rows="4" placeholder="الصق رسالة المشترك هنا"></textarea>'
      + '<label class="field mt"><span>الاسم</span><input class="input" id="aName"></label>'
      + '<label class="field"><span>رقم الجهاز</span><input class="input" id="aDev" dir="ltr" placeholder="ABCD-EFGH"></label>'
      + '<div class="seg" id="aPlan"><button data-p="term" class="on">ترم (' + PRICE + ' ج)</button><button data-p="vip">VIP (مجاني ومن غير مدة)</button></div>'
      + '<label class="field mt" id="aExpW"><span>صالح لحد</span><input class="input" id="aExp" type="date" value="' + TERM_END + '"></label>'
      + '<button class="btn block" id="aGo">' + icon('spark') + 'طلّع الكود</button><div id="aOut"></div></div>';
    const nT = log.filter(x => x.plan !== 'vip').length, nV = log.filter(x => x.plan === 'vip').length;
    h = '<div class="card mb quota"><b>الـ 100 كود</b><div class="qrow"><span>عادي (ترم · ' + PRICE + ' ج)</span><b>' + nT + ' / 90</b></div><div class="bar"><i style="width:' + Math.min(100, nT / 90 * 100) + '%"></i></div><div class="qrow"><span>VIP (مجاني من غير مدة)</span><b>' + nV + ' / 10</b></div><div class="bar vip"><i style="width:' + Math.min(100, nV / 10 * 100) + '%"></i></div><p class="note">أرقام 1–90 للعادي و91–100 للـ VIP. كل كود بيتعمل لطالب معين بعد ما يدفع، لأنه مربوط باسمه ورقم جهازه.</p></div>' + h;
    h += '<div class="group-h">الأكواد اللي طلعت (' + log.length + ') · VIP: ' + log.filter(x => x.plan === 'vip').length + '</div><div class="group">' + (log.length ? log.slice().reverse().map(x => '<div class="row noicon"><span class="tx"><b>' + esc(x.name) + (x.plan === 'vip' ? ' <span class="pill star">VIP</span>' : '') + '</b><small dir="ltr" style="text-align:right">#' + x.serial + ' · ' + esc(License.prettyDevice(x.device)) + ' · ' + esc(String(x.at).slice(0, 10)) + '</small></span><button class="btn sm gray" data-cp="' + esc(x.code) + '">انسخ</button></div>').join('') : '<div class="row noicon"><span class="tx"><small>لسه مفيش</small></span></div>') + '</div>';
    h += '<p class="note">لو عايز تلغي كود، ابعت رقمه (اللي بعد #) وهيتضاف لقايمة الأكواد الملغية. الكود الملغي بيتقفل أول ما صاحبه يفتح البرنامج على النت.</p><button class="btn block gray" id="aCsv">' + icon('down') + 'نزّل القايمة (Excel)</button>';
    view.insertAdjacentHTML('beforeend', h);
    let plan = 'term';
    $$('[data-p]', view).forEach(b => b.onclick = () => { plan = b.dataset.p; $$('[data-p]', view).forEach(x => x.classList.toggle('on', x === b)); $('#aExpW').hidden = plan === 'vip'; });
    $('#aMsg').oninput = e => { const t = e.target.value; const n = t.match(/الاسم\s*[:：]\s*(.+)/), dv = t.match(/رقم الجهاز\s*[:：]\s*([0-9A-Za-z-]{8,9})/); if (n) $('#aName').value = n[1].trim(); if (dv) $('#aDev').value = dv[1].toUpperCase(); };
    $('#aGo').onclick = async () => {
      const name = $('#aName').value.trim(), dev = License.cleanDevice($('#aDev').value);
      if (!name || dev.length !== 8) { toast('اكتب الاسم ورقم الجهاز (8 حروف)'); return; }
      // رقم مسلسل بالترتيب: العادي من 1 لـ 90، والـ VIP من 91 لـ 100، ولو خلصوا يكمّل من 101
      const used = new Set(log.map(x => x.serial)); let serial = plan === 'vip' ? 91 : 1; const top = plan === 'vip' ? 100 : 90;
      while (used.has(serial) && serial <= top) serial++;
      if (serial > top) { serial = 101; while (used.has(serial)) serial++; toast(plan === 'vip' ? 'الـ 10 VIP خلصوا، ده كود زيادة' : 'الـ 90 كود العادي خلصوا، ده كود زيادة'); }
      try {
        const code = await License.issue({ privJwk: ADM.privJwk, K: ADM.K, name, device: dev, plan, exp: plan === 'vip' ? null : new Date($('#aExp').value + 'T00:00:00Z'), serial });
        log.push({ serial, name, device: dev, plan, code, at: new Date().toISOString() }); LS.set('mz:adminlog', log);
        setTimeout(() => { const q = document.querySelector('.quota'); if (q) { const a = log.filter(x => x.plan !== 'vip').length, v = log.filter(x => x.plan === 'vip').length; const bs = q.querySelectorAll('.qrow b'), is = q.querySelectorAll('.bar i'); bs[0].textContent = a + ' / 90'; bs[1].textContent = v + ' / 10'; is[0].style.width = Math.min(100, a / 90 * 100) + '%'; is[1].style.width = Math.min(100, v / 10 * 100) + '%'; } }, 0);
        const link = location.origin + location.pathname + '#activate/' + code;
        const msg = 'أهلًا يا ' + name.split(' ')[0] + ' 🎉 اشتراكك في مذاكِر اتفعّل' + (plan === 'vip' ? ' (VIP)' : '') + '.\n\nكود التفعيل:\n' + code + '\n\nافتح مذاكِر ← الاشتراك ← الصق الكود ← فعّل.\nأو دوس هنا: ' + link + '\n\nالكود مربوط باسمك وجهازك، فمش هيشتغل مع حد تاني.';
        $('#aOut').innerHTML = '<div class="card mt codeout"><b>الكود جاهز ✓ (#' + serial + ')</b><textarea class="input mt" rows="4" dir="ltr" readonly>' + esc(code) + '</textarea><div class="btns mt"><button class="btn" id="aCp">انسخ الرسالة</button><button class="btn green" id="aWa">ابعت على واتساب</button></div></div>';
        $('#aCp').onclick = () => { copy(msg); toast('اتنسخت الرسالة', 'check'); };
        $('#aWa').onclick = () => { if (navigator.share) navigator.share({ text: msg }).catch(() => {}); else open('https://wa.me/?text=' + encodeURIComponent(msg)); };
        haptic('success');
      } catch (e) { toast(e.message || 'حصلت مشكلة'); }
    };
    $$('[data-cp]', view).forEach(b => b.onclick = () => { copy(b.dataset.cp); toast('اتنسخ', 'check'); });
    $('#aCsv').onclick = () => {
      const rows = [['serial', 'name', 'device', 'plan', 'date', 'code']].concat(log.map(x => [x.serial, x.name, x.device, x.plan, x.at, x.code]));
      const csv = '﻿' + rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'mozaker-codes.csv'; a.click();
    };
  });
})();
