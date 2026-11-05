/* مذاكِر — الحاسبات والتمارين العملية (كل حاجة بتطلع الحل بالخطوات) */
(function () {
  'use strict';
  const E = self.Engine, U = self.UI;
  const { $, $$, esc, icon, Store, Router, header, toast, Char, buddy, beep, haptic } = U;
  const f = (x, d = 2) => E.fmt(x, d);
  const num = v => E.parseNumber(v);

  const meta = {
    distribution: { s: 'acc', icon: 'calc', title: 'توزيع الأرباح والخسائر', desc: 'حاسبة + تمارين متولدة: ح/ التوزيع والحسابات الجارية' },
    capital: { s: 'acc', icon: 'users', title: 'حصص الشركاء ومعالجة الفرق', desc: 'صافي الأصول مقابل الحصة: شهرة، احتياطي، أو تسوية' },
    journal: { s: 'acc', icon: 'edit', title: 'تمرين قيود تكوين رأس المال', desc: 'اكتب القيود بنفسك وأنا أصححها حساب حساب' },
    describe: { s: 'stats', icon: 'chart', title: 'بيانات خام: الوسط والوسيط والتشتت', desc: 'الوسط، الوسيط، المنوال، التباين، الربيعات، الالتواء' },
    grouped: { s: 'stats', icon: 'list', title: 'جدول تكراري (بيانات مبوبة)', desc: 'الوسط والوسيط والمنوال والانحراف المعياري من الفئات' },
    index: { s: 'stats', icon: 'up', title: 'الأرقام القياسية', desc: 'التجميعي البسيط، لاسبير، باش، فيشر' },
    decision: { s: 'prod', icon: 'target', title: 'نظرية القرارات', desc: 'المعايير الخمسة + القيمة المتوقعة + مسألة الجرايد' },
    location: { s: 'prod', icon: 'globe', title: 'اختيار الموقع', desc: 'حجم التعادل ونقطة السواء التشغيلي لموقعين' },
    assign: { s: 'prod', icon: 'users', title: 'التخصيص (الآلات والأوامر)', desc: 'أقل تكلفة أو أعلى ربح بخطوات التخفيض' },
    lp: { s: 'prod', icon: 'chart', title: 'البرمجة الخطية (بيانيًا)', desc: 'النقط الركنية والحل الأمثل لمتغيرين' },
    control: { s: 'prod', icon: 'list', title: 'خرائط الرقابة (الأوساط والمدى)', desc: 'الحدود العليا والدنيا والحكم على العملية' },
    keynes: { s: 'econ', icon: 'globe', title: 'النموذج الكينزي البسيط', desc: 'الدخل التوازني، المضاعف، MLR، نقطة التعادل' },
    islm: { s: 'econ', icon: 'chart', title: 'IS–LM وسوق النقود', desc: 'معادلة IS و LM والتوازن' },
    accounts: { s: 'econ', icon: 'calc', title: 'حسابات الدخل القومي', desc: 'GDP و GNP و NDP والمكمش' }
  };

  /* ---------- أدوات رسم مشتركة ---------- */
  const rowHTML = r => { const m = String(r).match(/^([^:=0-9]{1,40}?):\s(.*)$/); if (m && /[0-9]/.test(m[2]) && !/[\u0600-\u06FF]/.test(m[2])) return esc(m[1]) + ': <span class="ltr">' + esc(m[2]) + '</span>'; if ((/^[=\d(−-]/.test(r) || /^[A-Za-zXRσsQkYyrCSITM]/.test(r)) && !/[\u0600-\u06FF]/.test(r)) return '<span class="ltr">' + esc(r) + '</span>'; return esc(r); };
  const stepsHTML = steps => '<div class="steps">' + steps.map(s => '<div class="step"><b>' + esc(s.t) + '</b>' + (s.rows || []).map(r => '<div class="r">' + rowHTML(r) + '</div>').join('') + '</div>').join('') + '</div>';
  function tAcc(title, dr, cr, opts = {}) {
    const sd = dr.reduce((a, x) => a + x.amount, 0), sc = cr.reduce((a, x) => a + x.amount, 0);
    const bal = E.round(sc - sd);
    const drl = dr.slice(), crl = cr.slice();
    if (opts.balance && Math.abs(bal) > 0.004) { if (bal > 0) drl.push({ label: 'رصيد مرحل (دائن)', amount: bal, b: 1 }); else crl.push({ label: 'رصيد مرحل (مدين)', amount: -bal, b: 1 }); }
    const tot = Math.max(drl.reduce((a, x) => a + x.amount, 0), crl.reduce((a, x) => a + x.amount, 0));
    const line = x => '<div class="ln"' + (x.b ? ' style="font-weight:700"' : '') + '><span>' + esc(x.label) + (x.parts ? '<br><small class="c-muted">' + esc(x.parts.join(' / ')) + '</small>' : '') + '</span><span class="amt">' + f(x.amount) + '</span></div>';
    return '<div class="tacc"><div class="h">' + esc(title) + '</div><div class="cols"><div class="col"><div class="ch">منه (مدين)</div>' + drl.map(line).join('') + '</div><div class="col"><div class="ch">له (دائن)</div>' + crl.map(line).join('') + '</div></div><div class="tot"><div class="num">' + f(tot) + '</div><div class="num">' + f(tot) + '</div></div></div>';
  }
  const inp = (id, val, ph, attrs = '') => '<input class="input" id="' + id + '" value="' + esc(val == null ? '' : val) + '" placeholder="' + esc(ph || '') + '" inputmode="decimal" dir="ltr" ' + attrs + '>';
  const fld = (label, inner) => '<label class="field"><span>' + label + '</span>' + inner + '</label>';
  const val = id => num(($('#' + id) || {}).value || '');
  function mark(ok) { if (ok) { beep('ok'); haptic('success'); } else { beep('bad'); haptic('error'); } }

  /* ---------- الشاشة العامة ---------- */
  Router.on('tool', (view, r) => {
    const k = r.args[0], m = meta[k]; if (!m) return Router.go('subjects', { replace: true });
    const s = App.S(m.s);
    header(view, m.title, { back: { to: 'subject/' + s.id + '?tab=tools', label: s.short } });
    const box = document.createElement('div'); view.appendChild(box);
    TOOLS[k](box, r.q);
  });

  const TOOLS = {};

  /* ===== توزيع الأرباح والخسائر ===== */
  TOOLS.distribution = (box, q) => {
    let mode = q.ex ? 'ex' : 'calc', ex = null, seed = Date.now() % 100000;
    const draw = () => {
      box.innerHTML = '<div class="seg"><button data-m="calc" class="' + (mode === 'calc' ? 'on' : '') + '">حاسبة</button><button data-m="ex" class="' + (mode === 'ex' ? 'on' : '') + '">تمرين متولد</button></div><div id="tb"></div>';
      $$('[data-m]', box).forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
      mode === 'calc' ? calc($('#tb')) : exercise($('#tb'));
    };
    const partnerForm = (i, p) => '<div class="card mb" data-pi="' + i + '"><b>الشريك ' + (i + 1) + '</b><div class="grid2 mt">' + fld('الاسم', '<input class="input" data-k="name" value="' + esc(p.name) + '">') + fld('رأس المال', '<input class="input" data-k="capital" value="' + (p.capital || '') + '" inputmode="decimal" dir="ltr">') + fld('نسبة الأرباح', '<input class="input" data-k="ratio" value="' + (p.ratio || 1) + '" inputmode="decimal" dir="ltr">') + fld('رصيد جاري أول المدة (+ دائن / − مدين)', '<input class="input" data-k="opening" value="' + (p.opening || 0) + '" inputmode="decimal" dir="ltr">') + fld('مسحوبات', '<input class="input" data-k="dAmt" value="' + ((p.drawings[0] || {}).amount || '') + '" inputmode="decimal" dir="ltr">') + fld('شهور فائدة المسحوبات (لآخر السنة)', '<input class="input" data-k="dMon" value="' + ((p.drawings[0] || {}).months != null ? p.drawings[0].months : '') + '" inputmode="decimal" dir="ltr" placeholder="31/3 = 9 · 1/7 = 6">') + fld('مرتب شهري', '<input class="input" data-k="salaryMonthly" value="' + (p.salaryMonthly || '') + '" inputmode="decimal" dir="ltr">') + fld('اللي قبضه من المرتب', '<input class="input" data-k="salaryPaid" value="' + (p.salaryPaid || '') + '" inputmode="decimal" dir="ltr">') + fld('فائدة قرض مستحقة له', '<input class="input" data-k="loanInterest" value="' + (p.loanInterest || '') + '" inputmode="decimal" dir="ltr">') + '</div></div>';
    let partners = [{ name: 'أ', capital: 10000, ratio: 1, opening: -600, drawings: [{ amount: 1000, months: 9 }] }, { name: 'ب', capital: 20000, ratio: 1, opening: 200, drawings: [{ amount: 400, months: 3 }], salaryMonthly: 150, salaryPaid: 1200 }];
    let base = { net: 10000, rc: 15, rd: 16, rcur: 14, bRate: 10, bPartner: 0, bBase: 'afterCapInt' };
    const calc = tb => {
      tb.innerHTML = '<p class="note mb">الأرقام دي مثال سكشن 6 — غيّرها بأرقام مسألتك.</p><div class="card mb"><div class="grid2">' + fld('صافي الربح (والخسارة بالسالب)', inp('net', base.net)) + fld('فائدة رأس المال %', inp('rc', base.rc)) + fld('فائدة المسحوبات %', inp('rd', base.rd)) + fld('فائدة الجاري %', inp('rcur', base.rcur)) + fld('مكافأة %', inp('bRate', base.bRate)) + fld('المكافأة لمين', '<select class="input" id="bP">' + partners.map((p, i) => '<option value="' + i + '"' + (i === base.bPartner ? ' selected' : '') + '>' + esc(p.name) + '</option>').join('') + '</select>') + '</div>' + fld('أساس المكافأة', '<select class="input" id="bB"><option value="net"' + (base.bBase === 'net' ? ' selected' : '') + '>من صافي الربح</option><option value="afterCapInt"' + (base.bBase === 'afterCapInt' ? ' selected' : '') + '>من صافي الربح بعد خصم فوائد رأس المال</option></select>') + '</div><div id="pf">' + partners.map((p, i) => partnerForm(i, p)).join('') + '</div><div class="btns mb"><button class="btn tint sm" id="addP">' + icon('plus') + 'شريك</button>' + (partners.length > 2 ? '<button class="btn gray sm" id="rmP">شيل آخر شريك</button>' : '') + '</div><button class="btn block" id="go">' + icon('calc') + 'احسب</button><div id="out" class="mt"></div>';
      const read = () => {
        base = { net: val('net'), rc: val('rc') || 0, rd: val('rd') || 0, rcur: val('rcur') || 0, bRate: val('bRate') || 0, bPartner: +$('#bP').value, bBase: $('#bB').value };
        partners = $$('[data-pi]', tb).map(c => { const g = k => c.querySelector('[data-k="' + k + '"]').value; const dAmt = num(g('dAmt')), dMon = num(g('dMon')); return { name: g('name') || '؟', capital: num(g('capital')) || 0, ratio: num(g('ratio')) || 1, opening: num(g('opening')) || 0, drawings: dAmt ? [{ amount: dAmt, months: isNaN(dMon) ? 12 : dMon }] : [], salaryMonthly: num(g('salaryMonthly')) || 0, salaryPaid: num(g('salaryPaid')) || 0, loanInterest: num(g('loanInterest')) || 0 }; });
      };
      $('#addP').onclick = () => { read(); partners.push({ name: 'ج', capital: 0, ratio: 1, opening: 0, drawings: [] }); calc(tb); };
      const rm = $('#rmP'); if (rm) rm.onclick = () => { read(); partners.pop(); calc(tb); };
      $('#go').onclick = () => {
        read(); if (isNaN(base.net)) return toast('اكتب صافي الربح');
        const res = E.distributeProfit({ netProfit: base.net, partners, rates: { capital: base.rc / 100, drawings: base.rd / 100, current: base.rcur / 100 }, bonus: base.bRate ? { partner: base.bPartner, rate: base.bRate / 100, base: base.bBase } : null });
        $('#out').innerHTML = solutionHTML(res);
        $('#out').scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    };
    const solutionHTML = res => '<div class="group-h">الحل بالخطوات</div>' + stepsHTML(res.steps)
      + '<div class="group-h">ح/ توزيع الأرباح والخسائر</div>' + tAcc('ح/ توزيع الأرباح والخسائر', res.debit.map(x => ({ label: x.label, amount: x.amount, parts: x.parts && x.parts.filter(Boolean).length > 1 ? x.parts.map(f) : null })), res.credit.map(x => ({ label: x.label, amount: x.amount, parts: x.parts && x.parts.filter(Boolean).length > 1 ? x.parts.map(f) : null })))
      + '<div class="group-h">الحسابات الجارية للشركاء</div>' + res.current.map(c => tAcc('ح/ جاري الشريك ' + c.name, c.dr, c.cr, { balance: true }) + '<p class="note" style="margin:-6px 4px 12px">الرصيد ' + f(Math.abs(c.balance)) + ' ' + c.side + (c.balance >= 0 ? ' → يظهر في المركز المالي مع حقوق الملكية' : ' → يظهر في الأصول') + '</p>').join('');
    const exercise = tb => {
      ex = E.genDistribution(seed);
      const P = ex.params.partners, S = ex.solution;
      const fields = [['capInt', 'إجمالي فوائد رأس المال', E.sum(S.capInt)], ['drawInt', 'إجمالي فوائد المسحوبات', E.sum(S.drawInt)], ['remain', 'الربح الباقي اللي يتوزع بالنسبة', S.remain]].concat(P.map((p, i) => ['sh' + i, 'نصيب ' + p.name + ' في الباقي', S.shares[i]])).concat(S.current.map((c, i) => ['cur' + i, 'رصيد جاري ' + c.name + ' آخر المدة (+ دائن / − مدين)', c.balance]));
      tb.innerHTML = '<div class="card prose mb">' + ex.text.map(t => '<p>' + esc(t) + '</p>').join('') + '<p><b>المطلوب:</b> تصوير ح/ توزيع الأرباح والخسائر والحسابات الجارية للشركاء.</p></div><p class="note mb">احسب على ورقة، وبعدين اكتب الأرقام دي وأنا أصححها:</p><div class="card mb">' + fields.map(([k, l]) => fld(l, inp('x_' + k, '', 'اكتب الرقم'))).join('') + '</div><div class="btns"><button class="btn" id="chk">' + icon('check') + 'صحّح</button><button class="btn tint" id="sol">' + icon('eye') + 'الحل</button><button class="btn gray" id="nw">' + icon('shuffle') + 'غيره</button></div><div id="out" class="mt"></div>';
      $('#nw').onclick = () => { seed = Date.now() % 100000; exercise(tb); };
      $('#sol').onclick = () => { $('#out').innerHTML = solutionHTML(S); };
      $('#chk').onclick = () => {
        let right = 0;
        fields.forEach(([k, , exp]) => { const i = $('#x_' + k), g = E.gradeNumber(exp, i.value, 1); i.style.boxShadow = 'inset 0 0 0 2px ' + (g.ok ? 'var(--green)' : 'var(--red)'); if (g.ok) right++; });
        const all = right === fields.length; mark(all);
        $('#out').innerHTML = '<div class="feedback ' + (all ? 'ok' : 'bad') + '"><b>' + right + ' من ' + fields.length + ' صح</b>' + (all ? ' — ممتاز! ده بالظبط الحل 🎉' : '<br>الخانات الحمرا محتاجة مراجعة. اضغط «الحل» تشوف الخطوات.') + '</div>';
        App.logDay({ q: 1, ok: all ? 1 : 0 });
        if (all) buddy('حلّيت التمرين صح من أول مرة؟ ده مستوى امتحان 🔥', 'cheer');
      };
    };
    draw();
  };

  /* ===== حصص الشركاء ومعالجة الفرق ===== */
  TOOLS.capital = box => {
    box.innerHTML = '<div class="card mb">' + fld('رأس مال الشركة', inp('tot', 120000)) + fld('النسب (افصل بينهم بـ : )', inp('rat', '3:2:1')) + '</div><div class="card mb"><b>الشريك اللي بيقدم منشأته</b><div class="grid2 mt">' + fld('رقم الشريك في النسبة', inp('who', 3)) + fld('إجمالي الأصول (بعد التقدير)', inp('A', 45000)) + fld('إجمالي الخصوم (بعد التقدير)', inp('L', 9000)) + fld('فيه نص على التسوية نقدًا؟', '<select class="input" id="st"><option value="0">لأ</option><option value="1">أيوه</option></select>') + '</div></div><button class="btn block" id="go">احسب</button><div id="out" class="mt"></div>';
    $('#go').onclick = () => {
      const tot = val('tot'), rat = $('#rat').value.split(/[:،,\s]+/).map(num).filter(x => !isNaN(x) && x > 0), who = Math.max(1, Math.min(rat.length, val('who'))) - 1;
      if (!tot || !rat.length) return toast('اكتب رأس المال والنسب');
      const rs = E.sum(rat), shares = rat.map(r => tot * r / rs), net = val('A') - val('L'), gap = E.round(net - shares[who]), settle = $('#st').value === '1';
      let tr = '';
      if (Math.abs(gap) < 0.01) tr = 'صافي الأصول = الحصة بالظبط → مفيش قيود إضافية.';
      else if (gap > 0) tr = settle ? 'صافي الأصول أكبر بـ ' + f(gap) + ' وفيه نص تسوية → الشريك يسحب الزيادة:\nمن ح/ رأس مال الشريك ' + f(gap) + '\n    إلى ح/ النقدية بالصندوق ' + f(gap) : 'صافي الأصول أكبر بـ ' + f(gap) + ' ومفيش نص → احتياطي رأسمالي:\nمن ح/ رأس مال الشريك ' + f(gap) + '\n    إلى ح/ احتياطي رأسمالي ' + f(gap);
      else tr = settle ? 'صافي الأصول أقل بـ ' + f(-gap) + ' وفيه نص تسوية → الشريك يسدد الباقي:\nمن ح/ النقدية بالصندوق ' + f(-gap) + '\n    إلى ح/ رأس مال الشريك ' + f(-gap) : 'صافي الأصول أقل بـ ' + f(-gap) + ' ومفيش نص → شهرة محل:\nمن ح/ شهرة المحل ' + f(-gap) + '\n    إلى ح/ رأس مال الشريك ' + f(-gap);
      $('#out').innerHTML = stepsHTML([{ t: 'حصص الشركاء = رأس المال × النسبة ÷ ' + rs, rows: shares.map((s, i) => 'الشريك ' + (i + 1) + ': ' + f(s)) }, { t: 'صافي الأصول = الأصول − الخصوم', rows: [f(val('A')) + ' − ' + f(val('L')) + ' = ' + f(net)] }]) + '<div class="card prose"><pre>' + esc(tr) + '</pre></div>';
    };
  };

  /* ===== تمرين القيود ===== */
  TOOLS.journal = box => {
    let seed = Date.now() % 100000, ex;
    const draw = () => {
      ex = E.genCapital(seed);
      const accs = ex.accounts.slice().sort();
      box.innerHTML = '<div class="card prose mb">' + ex.text.map(t => '<p>' + esc(t) + '</p>').join('') + '<p><b>المطلوب:</b> قيود اليومية لإثبات ما تقدم.</p></div><div class="warn">' + icon('info') + ' ممكن تعمل قيد لكل شريك أو قيد مركب — أنا بقارن صافي كل حساب، فالاتنين صح.</div><div class="journal" id="J"></div><div class="btns mt"><button class="btn tint sm" id="addE">' + icon('plus') + 'قيد جديد</button></div><div class="btns mt"><button class="btn" id="chk">' + icon('check') + 'صحّح</button><button class="btn tint" id="sol">' + icon('eye') + 'الحل</button><button class="btn gray" id="nw">' + icon('shuffle') + 'غيره</button></div><div id="out" class="mt"></div>';
      const J = $('#J');
      const addEntry = () => {
        const e = U.el('<div class="jentry"><div class="jhead"><span>الحساب</span><span>مدين</span><span>دائن</span><span></span></div><div class="rows"></div><button class="btn sm gray" data-addr>' + icon('plus') + 'سطر</button></div>');
        const addRow = () => { const r = U.el('<div class="jrow"><select><option value="">اختار حساب…</option>' + accs.map(a => '<option>' + esc(a) + '</option>').join('') + '</select><input inputmode="decimal" placeholder="مدين"><input inputmode="decimal" placeholder="دائن"><button class="x" aria-label="امسح السطر">' + icon('x') + '</button></div>'); r.querySelector('.x').onclick = () => r.remove(); e.querySelector('.rows').appendChild(r); };
        addRow(); addRow(); e.querySelector('[data-addr]').onclick = addRow; J.appendChild(e);
      };
      addEntry();
      $('#addE').onclick = addEntry;
      $('#nw').onclick = () => { seed = Date.now() % 100000; draw(); };
      $('#sol').onclick = () => { $('#out').innerHTML = '<div class="group-h">الحل</div>' + ex.entries.map(e => '<div class="card mb" style="padding:12px"><pre style="margin:0;background:none;padding:0">' + esc(e.lines.filter(l => l.dr).map(l => 'من ح/ ' + l.acc + '   ' + f(l.dr)).join('\n') + '\n' + e.lines.filter(l => l.cr).map(l => '    إلى ح/ ' + l.acc + '   ' + f(l.cr)).join('\n')) + '</pre><small class="c-muted">' + esc(e.memo) + '</small></div>').join(''); };
      $('#chk').onclick = () => {
        const given = $$('.jentry', J).map(e => ({ lines: $$('.jrow', e).map(r => { const [s, d, c] = r.querySelectorAll('select,input'); return { acc: s.value, dr: num(d.value) || 0, cr: num(c.value) || 0 }; }).filter(l => l.acc && (l.dr || l.cr)) })).filter(e => e.lines.length);
        if (!given.length) return toast('اكتب قيد الأول');
        const g = E.gradeJournal(ex.entries, given); mark(g.ok); App.logDay({ q: 1, ok: g.ok ? 1 : 0 });
        $('#out').innerHTML = '<div class="feedback ' + (g.ok ? 'ok' : 'bad') + '"><b>' + (g.ok ? 'قيودك صح 100% 🎉' : 'صح ' + Math.round(g.score * 100) + '% — راجع دول:') + '</b>' + (g.ok ? '' : '<ul style="margin:6px 0 0;padding-inline-start:20px">' + g.issues.map(i => '<li>' + esc(i.msg) + '</li>').join('') + '</ul>') + '</div>';
        if (g.ok) buddy('قيودك متظبطة ومتوازنة 👌', 'happy');
      };
    };
    draw();
  };

  /* ===== الإحصاء: بيانات خام ===== */
  TOOLS.describe = (box, q) => {
    box.innerHTML = '<div class="seg"><button data-m="c" class="on">حاسبة</button><button data-m="e">تمرين</button></div><div id="tb"></div>';
    const calc = tb => {
      tb.innerHTML = fld('اكتب القيم (مسافة أو فاصلة بينهم)', '<textarea class="input" id="d" dir="ltr" style="min-height:80px">' + esc(q.d ? q.d.replace(/,/g, ' ') : '10 12 15 18 20 22 25 28 30 32 35') + '</textarea>') + '<button class="btn block" id="go">احسب</button><div id="out" class="mt"></div>';
      const go = () => { const a = E.parseList($('#d').value); if (a.length < 2) return toast('اكتب قيمتين على الأقل'); const r = E.describeRaw(a); $('#out').innerHTML = '<div class="stats3"><div class="stat"><span class="n">' + f(r.mean, 3) + '</span><span class="l">الوسط</span></div><div class="stat"><span class="n">' + f(r.median, 3) + '</span><span class="l">الوسيط</span></div><div class="stat"><span class="n">' + f(r.sd, 3) + '</span><span class="l">s</span></div></div>' + stepsHTML(r.steps); };
      $('#go').onclick = go; if (q.d) go();
    };
    const exer = tb => {
      const g = E.genStats(Date.now() % 100000), r = g.solution;
      const fields = [['mean', 'الوسط الحسابي', r.mean], ['median', 'الوسيط', r.median], ['range', 'المدى', r.range], ['var', 'تباين العينة s²', r.variance]];
      tb.innerHTML = '<div class="card mb"><b>البيانات:</b> <span class="num">' + g.data.join('، ') + '</span></div><div class="card mb">' + fields.map(([k, l]) => fld(l, inp('x_' + k, '', 'لأقرب رقمين عشريين'))).join('') + '</div><div class="btns"><button class="btn" id="chk">صحّح</button><button class="btn gray" id="nw">' + icon('shuffle') + 'تاني</button></div><div id="out" class="mt"></div>';
      $('#nw').onclick = () => exer(tb);
      $('#chk').onclick = () => { let ok = 0; fields.forEach(([k, , e]) => { const i = $('#x_' + k), gg = E.gradeNumber(e, i.value, 0.011); i.style.boxShadow = 'inset 0 0 0 2px ' + (gg.ok ? 'var(--green)' : 'var(--red)'); if (gg.ok) ok++; }); mark(ok === fields.length); App.logDay({ q: 1, ok: ok === fields.length ? 1 : 0 }); $('#out').innerHTML = '<div class="feedback ' + (ok === fields.length ? 'ok' : 'bad') + '"><b>' + ok + ' من ' + fields.length + '</b></div>' + stepsHTML(r.steps); };
    };
    $$('[data-m]', box).forEach(b => b.onclick = () => { $$('[data-m]', box).forEach(x => x.classList.toggle('on', x === b)); b.dataset.m === 'c' ? calc($('#tb')) : exer($('#tb')); });
    calc($('#tb'));
  };

  /* ===== جدول تكراري ===== */
  TOOLS.grouped = box => {
    let rows = [[20, 25, 30], [25, 30, 20], [30, 35, 25], [35, 40, 13], [40, 45, 7], [45, 50, 5]];
    const draw = () => {
      box.innerHTML = '<p class="note mb">مثال المحاضرة (100 موظف حسب الدخل). عدّل الفئات والتكرارات:</p><div class="card mb tblwrap"><table class="matrix" style="width:100%"><tr><th>من</th><th>إلى</th><th>التكرار</th><th></th></tr>' + rows.map((r, i) => '<tr><td><input data-r="' + i + '" data-c="0" value="' + r[0] + '"></td><td><input data-r="' + i + '" data-c="1" value="' + r[1] + '"></td><td><input data-r="' + i + '" data-c="2" value="' + r[2] + '"></td><td><button class="x c-muted" data-del="' + i + '" aria-label="امسح">' + icon('x') + '</button></td></tr>').join('') + '</table><button class="btn sm tint mt" id="add">' + icon('plus') + 'فئة</button></div><button class="btn block" id="go">احسب</button><div id="out" class="mt"></div>';
      const read = () => { rows = rows.map((r, i) => [0, 1, 2].map(c => num($('[data-r="' + i + '"][data-c="' + c + '"]', box).value))); };
      $('#add').onclick = () => { read(); const l = rows[rows.length - 1] || [0, 10, 0]; rows.push([l[1], l[1] + (l[1] - l[0]), 0]); draw(); };
      $$('[data-del]', box).forEach(b => b.onclick = () => { read(); rows.splice(+b.dataset.del, 1); draw(); });
      $('#go').onclick = () => { read(); const r = E.describeGrouped(rows.map(x => ({ lo: x[0], hi: x[1], f: x[2] }))); if (!r.n) return toast('اكتب تكرارات'); $('#out').innerHTML = '<div class="stats3"><div class="stat"><span class="n">' + f(r.mean, 3) + '</span><span class="l">الوسط</span></div><div class="stat"><span class="n">' + f(r.median, 3) + '</span><span class="l">الوسيط</span></div><div class="stat"><span class="n">' + f(r.mode, 3) + '</span><span class="l">المنوال</span></div></div>' + stepsHTML(r.steps); };
    };
    draw();
  };

  /* ===== الأرقام القياسية ===== */
  TOOLS.index = box => {
    box.innerHTML = '<p class="note mb">اكتب أسعار وكميات كل سلعة (سطر لكل سلعة). الكميات اختيارية للرقم البسيط.</p><div class="card mb tblwrap"><table class="matrix" style="width:100%" id="T"><tr><th>ع0 (سعر الأساس)</th><th>ك0</th><th>ع1 (سعر المقارنة)</th><th>ك1</th></tr>' + [[10, 50, 15, 40], [20, 30, 25, 35], [5, 100, 8, 90]].map(r => '<tr>' + r.map(v => '<td><input value="' + v + '"></td>').join('') + '</tr>').join('') + '</table><button class="btn sm tint mt" id="add">' + icon('plus') + 'سلعة</button></div><button class="btn block" id="go">احسب</button><div id="out" class="mt"></div>';
    $('#add').onclick = () => $('#T').insertAdjacentHTML('beforeend', '<tr>' + '<td><input></td>'.repeat(4) + '</tr>');
    $('#go').onclick = () => {
      const rows = $$('#T tr', box).slice(1).map(tr => $$('input', tr).map(i => num(i.value))).filter(r => !isNaN(r[0]) && !isNaN(r[2]));
      if (!rows.length) return toast('اكتب الأسعار');
      const hasQ0 = rows.every(r => !isNaN(r[1])), hasQ1 = rows.every(r => !isNaN(r[3]));
      const r = E.indexNumbers(rows.map(x => x[0]), rows.map(x => x[2]), hasQ0 ? rows.map(x => x[1]) : null, hasQ1 ? rows.map(x => x[3]) : null);
      $('#out').innerHTML = stepsHTML(r.steps) + '<div class="feedback ok">' + esc(r.meaning) + '</div>';
    };
  };

  /* ===== نظرية القرارات ===== */
  function matrixEditor(id, rows, cols, data, rLabels, cLabels) {
    return '<div class="tblwrap"><table class="matrix" id="' + id + '"><tr><th></th>' + cLabels.map((c, j) => '<th><input data-ch="' + j + '" value="' + esc(c) + '" style="width:70px;font-weight:600"></th>').join('') + '</tr>' + data.map((r, i) => '<tr><th><input data-rh="' + i + '" value="' + esc(rLabels[i]) + '" style="width:70px;font-weight:600"></th>' + r.map((v, j) => '<td><input data-i="' + i + '" data-j="' + j + '" value="' + v + '"></td>').join('') + '</tr>').join('') + '</table></div>';
  }
  function readMatrix(id) { const T = $('#' + id); const R = $$('tr', T).slice(1).map(tr => $$('[data-j]', tr).map(i => num(i.value))); return { m: R, rl: $$('[data-rh]', T).map(i => i.value), cl: $$('[data-ch]', T).map(i => i.value) }; }
  TOOLS.decision = box => {
    let mode = 'matrix', data = [[100, 100, 100, 100], [90, 110, 110, 110], [80, 100, 120, 120], [70, 90, 110, 130]], rl = ['100', '110', '120', '130'], cl = ['طلب 100', 'طلب 110', 'طلب 120', 'طلب 130'];
    const draw = () => {
      box.innerHTML = '<div class="seg"><button data-m="matrix" class="' + (mode === 'matrix' ? 'on' : '') + '">مصفوفة نتائج</button><button data-m="news" class="' + (mode === 'news' ? 'on' : '') + '">سلعة بتبور (الجرايد)</button></div><div id="tb"></div>';
      $$('[data-m]', box).forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
      const tb = $('#tb');
      if (mode === 'news') {
        tb.innerHTML = '<div class="card mb"><div class="grid2">' + fld('الكميات/الطلب (مسافة بينهم)', inp('qs', '100 110 120 130')) + fld('عدد الأيام لكل طلب', inp('ds', '20 15 30 35')) + fld('تكلفة الوحدة', inp('c', 0.4)) + fld('سعر البيع', inp('p', 0.5)) + '</div></div><button class="btn block" id="go">احسب</button><div id="out" class="mt"></div>';
        $('#go').onclick = () => {
          const Q = E.parseList($('#qs').value), Dd = E.parseList($('#ds').value), tot = E.sum(Dd), probs = Dd.map(x => x / tot);
          if (!Q.length || Q.length !== Dd.length) return toast('عدد الكميات لازم يساوي عدد الأيام');
          const m = E.perishablePayoff(Q, Q, val('c'), val('p')), r = E.decision(m, { probs });
          $('#out').innerHTML = stepsHTML([{ t: 'الاحتمالات = أيام كل طلب ÷ ' + tot, rows: Q.map((q, i) => q + ': ' + f(probs[i], 3)) }]) + resultTable(m, Q.map(String), Q.map(q => 'طلب ' + q), r, true);
        };
      } else {
        tb.innerHTML = '<p class="note mb">الصفوف = البدائل، والأعمدة = حالات الطبيعة. (مثال: تكلفة 4 وسعر 5)</p><div class="card mb">' + matrixEditor('M', 0, 0, data, rl, cl) + '<div class="btns mt"><button class="btn sm tint" id="ar">' + icon('plus') + 'بديل</button><button class="btn sm tint" id="ac">' + icon('plus') + 'حالة</button></div></div><div class="card mb"><div class="grid2">' + fld('دليل التفاؤل α', inp('al', 0.6)) + fld('نوع المصفوفة', '<select class="input" id="ty"><option value="p">أرباح</option><option value="c">تكاليف</option></select>') + '</div>' + fld('احتمالات الحالات (اختياري، مسافة بينهم)', inp('pr', '')) + '</div><button class="btn block" id="go">طبّق المعايير</button><div id="out" class="mt"></div>';
        const sync = () => { const x = readMatrix('M'); data = x.m; rl = x.rl; cl = x.cl; };
        $('#ar').onclick = () => { sync(); data.push(cl.map(() => 0)); rl.push('بديل ' + (rl.length + 1)); draw(); };
        $('#ac').onclick = () => { sync(); data.forEach(r => r.push(0)); cl.push('حالة ' + (cl.length + 1)); draw(); };
        $('#go').onclick = () => { sync(); const pr = E.parseList($('#pr').value); const r = E.decision(data, { alpha: val('al'), cost: $('#ty').value === 'c', probs: pr.length === cl.length ? pr : null }); $('#out').innerHTML = resultTable(data, rl, cl, r); };
      }
    };
    const resultTable = (m, rl, cl, r, onlyEV) => {
      const crit = onlyEV ? ['ev'] : ['optimistic', 'pessimistic', 'hurwicz', 'laplace', 'savage'].concat(r.ev ? ['ev'] : []);
      let h = '<div class="group-h">مصفوفة النتائج</div><div class="card mb tblwrap"><table class="matrix"><tr><th></th>' + cl.map(c => '<th>' + esc(c) + '</th>').join('') + crit.map(k => '<th>' + esc(r[k].label.split(' (')[0]) + '</th>').join('') + '</tr>' + m.map((row, i) => '<tr><th>' + esc(rl[i]) + '</th>' + row.map(v => '<td style="padding:8px">' + f(v) + '</td>').join('') + crit.map(k => '<td style="padding:8px" class="' + (r[k].best === i ? 'best' : '') + '">' + f(r[k].values[i], 3) + '</td>').join('') + '</tr>').join('') + '</table></div>';
      if (!onlyEV) h += '<div class="group-h">مصفوفة الأسف</div><div class="card mb tblwrap"><table class="matrix"><tr><th></th>' + cl.map(c => '<th>' + esc(c) + '</th>').join('') + '<th>أقصى أسف</th></tr>' + r.savage.regret.map((row, i) => '<tr><th>' + esc(rl[i]) + '</th>' + row.map(v => '<td style="padding:8px">' + f(v) + '</td>').join('') + '<td style="padding:8px" class="' + (r.savage.best === i ? 'best' : '') + '">' + f(r.savage.values[i]) + '</td></tr>').join('') + '</table></div>';
      h += '<div class="group">' + crit.map(k => '<div class="row noicon"><span class="tx"><b>' + esc(r[k].label) + '</b><small>' + esc(r[k].how || 'مج (النتيجة × الاحتمال) ← نختار الأكبر') + '</small></span><span class="pill green">' + esc(rl[r[k].best]) + '</span></div>').join('') + '</div>';
      if (r.evpi != null && !onlyEV) h += '<p class="note">قيمة المعلومات الكاملة EVPI = ' + f(r.evpi, 3) + '</p>';
      return h;
    };
    draw();
  };

  /* ===== اختيار الموقع ===== */
  TOOLS.location = box => {
    box.innerHTML = '<div class="grid2"><div class="card">' + '<b>الموقع الأول</b>' + fld('التكاليف الثابتة', inp('Fa', 600000)) + fld('التكلفة المتغيرة للوحدة', inp('va', 120)) + '</div><div class="card"><b>الموقع التاني</b>' + fld('التكاليف الثابتة', inp('Fb', 1000000)) + fld('التكلفة المتغيرة للوحدة', inp('vb', 80)) + '</div></div><div class="card mt mb"><div class="grid2">' + fld('سعر بيع الوحدة', inp('p', 200)) + fld('أحجام الطلب المتوقعة', inp('qs', '9000 12000')) + '</div></div><button class="btn block" id="go">قارن</button><div id="out" class="mt"></div>';
    $('#go').onclick = () => {
      const a = { F: val('Fa'), v: val('va') }, b = { F: val('Fb'), v: val('vb') }, p = val('p'), L = E.locations(a, b, p), qs = E.parseList($('#qs').value);
      const steps = [];
      if (p) steps.push({ t: 'حجم التعادل = الثابتة ÷ (السعر − المتغيرة)', rows: ['الأول: ' + f(a.F) + ' ÷ (' + f(p) + ' − ' + f(a.v) + ') = ' + f(L.a.be), 'التاني: ' + f(b.F) + ' ÷ (' + f(p) + ' − ' + f(b.v) + ') = ' + f(L.b.be), 'الأفضل بالتعادل: الموقع ' + (L.a.be <= L.b.be ? 'الأول' : 'التاني') + ' (بيوصل للتعادل أسرع)'] });
      if (L.indiff) steps.push({ t: 'نقطة السواء = فرق الثابتة ÷ فرق المتغيرة', rows: [f(Math.abs(b.F - a.F)) + ' ÷ ' + f(Math.abs(a.v - b.v)) + ' = ' + f(L.indiff) + ' وحدة'].concat(qs.map(q => 'طلب ' + f(q) + ': ' + (L.pick(q) === 'equal' ? 'الموقعين متساويين' : 'الموقع ' + (L.pick(q) === 'a' ? 'الأول' : 'التاني') + (q < L.indiff ? ' (الثابتة الأقل لأن الطلب أقل من نقطة السواء)' : ' (المتغيرة الأقل لأن الطلب أكبر من نقطة السواء)')) + ' — التكلفة الكلية: ' + f(L.cost(a, q)) + ' مقابل ' + f(L.cost(b, q)))) });
      $('#out').innerHTML = stepsHTML(steps);
    };
  };

  /* ===== التخصيص ===== */
  TOOLS.assign = box => {
    let data = [[10, 12, 8, 15], [14, 9, 11, 13], [12, 14, 10, 9], [11, 10, 13, 12]];
    const draw = () => {
      box.innerHTML = '<p class="note mb">الصفوف = الآلات، الأعمدة = الأوامر.</p><div class="card mb">' + matrixEditor('M', 0, 0, data, data.map((_, i) => 'آلة ' + (i + 1)), data.map((_, j) => 'أمر ' + (j + 1))) + '<div class="btns mt"><button class="btn sm tint" id="sz">' + icon('plus') + 'كبّر المصفوفة</button>' + (data.length > 2 ? '<button class="btn sm gray" id="sm">صغّر</button>' : '') + '</div></div>' + fld('الهدف', '<select class="input" id="ty"><option value="c">أقل تكلفة</option><option value="p">أعلى ربح</option></select>') + '<button class="btn block" id="go">خصّص</button><div id="out" class="mt"></div>';
      const sync = () => { data = readMatrix('M').m; };
      $('#sz').onclick = () => { sync(); if (data.length >= 7) return toast('أقصى حاجة 7'); data.forEach(r => r.push(0)); data.push(data[0].map(() => 0)); draw(); };
      const sm = $('#sm'); if (sm) sm.onclick = () => { sync(); data.pop(); data.forEach(r => r.pop()); draw(); };
      $('#go').onclick = () => {
        sync(); if (data.flat().some(isNaN)) return toast('كمّل كل الخانات');
        const r = E.assignment(data, { maximize: $('#ty').value === 'p' });
        const tbl = (m, mark) => '<div class="tblwrap"><table class="matrix">' + m.map((row, i) => '<tr><th>آلة ' + (i + 1) + '</th>' + row.map((v, j) => '<td style="padding:8px" class="' + (mark && r.assign[i] === j ? 'best' : '') + '">' + f(v) + '</td>').join('') + '</tr>').join('') + '</table></div>';
        $('#out').innerHTML = '<div class="group-h">1) طرح أقل قيمة في كل صف</div><div class="card mb">' + tbl(r.rowRed) + '</div><div class="group-h">2) طرح أقل قيمة في كل عمود</div><div class="card mb">' + tbl(r.colRed, true) + '</div><div class="group-h">3) التخصيص على الأصفار</div><div class="group">' + r.assign.map((j, i) => '<div class="row noicon"><span class="tx"><b>آلة ' + (i + 1) + ' ← أمر ' + (j + 1) + '</b></span><span class="v num">' + f(data[i][j]) + '</span></div>').join('') + '</div><div class="feedback ok"><b>' + ($('#ty').value === 'p' ? 'أقصى ربح' : 'أقل تكلفة') + ' = ' + r.assign.map((j, i) => f(data[i][j])).join(' + ') + ' = ' + f(r.total) + '</b> (من المصفوفة الأصلية)</div>';
      };
    };
    draw();
  };

  /* ===== البرمجة الخطية ===== */
  TOOLS.lp = box => {
    box.innerHTML = '<div class="card mb">' + fld('دالة الهدف: ربح س1 ، ربح س2', '<div class="grid2">' + inp('c1', 12) + inp('c2', 7) + '</div>') + '<b>القيود (أ س1 + ب س2 ≤ المتاح)</b><div id="C" class="mt">' + [[2, 3, 12], [2, 1, 8]].map(c => '<div class="grid3 mb" data-c>' + c.map(v => '<input class="input" value="' + v + '" inputmode="decimal" dir="ltr">').join('') + '</div>').join('') + '</div><button class="btn sm tint" id="add">' + icon('plus') + 'قيد</button></div><button class="btn block" id="go">حل</button><div id="out" class="mt"></div>';
    $('#add').onclick = () => $('#C').insertAdjacentHTML('beforeend', '<div class="grid3 mb" data-c>' + '<input class="input" inputmode="decimal" dir="ltr">'.repeat(3) + '</div>');
    $('#go').onclick = () => {
      const cons = $$('[data-c]', box).map(r => $$('input', r).map(i => num(i.value))).filter(r => r.every(x => !isNaN(x)));
      const r = E.lp2([val('c1'), val('c2')], cons);
      if (!r.best) return toast('مفيش منطقة حلول ممكنة');
      const W = 300, H = 240, mx = Math.max(1, ...r.points.map(p => p.x), ...r.intercepts.map(i => i.x || 0)) * 1.1, my = Math.max(1, ...r.points.map(p => p.y), ...r.intercepts.map(i => i.y || 0)) * 1.1;
      const X = x => 30 + x / mx * (W - 40), Y = y => H - 25 - y / my * (H - 35);
      const hull = r.points.slice().sort((a, b) => Math.atan2(a.y - my / 4, a.x - mx / 4) - Math.atan2(b.y - my / 4, b.x - mx / 4));
      const svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;max-width:420px;direction:ltr;display:block;margin:auto"><line x1="30" y1="' + (H - 25) + '" x2="' + W + '" y2="' + (H - 25) + '" stroke="currentColor" opacity=".4"/><line x1="30" y1="0" x2="30" y2="' + (H - 25) + '" stroke="currentColor" opacity=".4"/><polygon points="' + hull.map(p => X(p.x) + ',' + Y(p.y)).join(' ') + '" fill="var(--accent)" opacity=".18"/>' + r.intercepts.map(i => i.x != null && i.y != null ? '<line x1="' + X(i.x) + '" y1="' + Y(0) + '" x2="' + X(0) + '" y2="' + Y(i.y) + '" stroke="var(--accent)" stroke-width="1.5"/>' : '').join('') + r.points.map(p => '<circle cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="' + (p === r.best ? 5 : 3.5) + '" fill="' + (p === r.best ? 'var(--green)' : 'var(--accent)') + '"/><text x="' + (X(p.x) + 5) + '" y="' + (Y(p.y) - 6) + '" font-size="10" fill="currentColor">(' + f(p.x) + '،' + f(p.y) + ')</text>').join('') + '<text x="' + (W - 14) + '" y="' + (H - 10) + '" font-size="11" fill="currentColor">س1</text><text x="34" y="12" font-size="11" fill="currentColor">س2</text></svg>';
      $('#out').innerHTML = stepsHTML([{ t: 'نقط تقاطع القيود مع المحاور', rows: r.intercepts.map((i, k) => 'القيد ' + (k + 1) + ': س1 = ' + (i.x != null ? f(i.x) : '—') + ' ، س2 = ' + (i.y != null ? f(i.y) : '—')) }, { t: 'النقط الركنية وقيمة دالة الهدف', rows: r.points.map(p => '(' + f(p.x) + ' ، ' + f(p.y) + ') ← ' + f(p.z)) }]) + '<div class="card mb">' + svg + '</div><div class="feedback ok"><b>الحل الأمثل: س1 = ' + f(r.best.x) + '، س2 = ' + f(r.best.y) + ' ← أقصى ربح ' + f(r.best.z) + '</b></div>';
    };
  };

  /* ===== خرائط الرقابة ===== */
  TOOLS.control = box => {
    box.innerHTML = '<p class="note mb">كل سطر = عينة (مثال السكشن: 8 عينات × 3 مفردات).</p>' + fld('العينات', '<textarea class="input" id="S" dir="ltr" style="min-height:170px">5 7 12\n6 3 9\n3 5 4\n6 6 12\n2 5 2\n7 9 11\n8 10 12\n10 12 14</textarea>') + '<div class="card mb"><div class="grid3">' + fld('A2', inp('A2', 1.12)) + fld('D3', inp('D3', 0)) + fld('D4', inp('D4', 2.574)) + '</div><p class="note">لو سبتهم فاضيين هستخدم الجدول القياسي لحجم العينة.</p></div><button class="btn block" id="go">احسب الحدود</button><div id="out" class="mt"></div>';
    $('#go').onclick = () => {
      const S = $('#S').value.trim().split('\n').map(E.parseList).filter(r => r.length);
      if (S.length < 2 || S.some(r => r.length !== S[0].length)) return toast('كل العينات لازم بنفس الحجم');
      const c = {}; ['A2', 'D3', 'D4'].forEach(k => { const v = val(k); if (!isNaN(v) && $('#' + k).value.trim() !== '') c[k] = v; });
      const r = E.xbarR(S, c); if (!r) return toast('حجم العينة لازم من 2 لـ 10 أو اكتب الثوابت');
      const chart = (vals, lim, title) => { const W = 320, H = 150, lo = Math.min(lim.lcl, ...vals) - 1, hi = Math.max(lim.ucl, ...vals) + 1, X = i => 24 + i * (W - 34) / Math.max(1, vals.length - 1), Y = v => H - 15 - (v - lo) / (hi - lo) * (H - 25); return '<div class="card mb"><b>' + title + '</b><svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;direction:ltr">' + [['ucl', 'var(--red)'], ['cl', 'var(--green)'], ['lcl', 'var(--red)']].map(([k, col]) => '<line x1="20" x2="' + W + '" y1="' + Y(lim[k]) + '" y2="' + Y(lim[k]) + '" stroke="' + col + '" stroke-dasharray="' + (k === 'cl' ? '0' : '5 4') + '"/><text x="0" y="' + (Y(lim[k]) + 3) + '" font-size="9" fill="currentColor">' + f(lim[k]) + '</text>').join('') + '<polyline fill="none" stroke="var(--accent)" stroke-width="2" points="' + vals.map((v, i) => X(i) + ',' + Y(v)).join(' ') + '"/>' + vals.map((v, i) => '<circle cx="' + X(i) + '" cy="' + Y(v) + '" r="3.5" fill="' + (v > lim.ucl || v < lim.lcl ? 'var(--red)' : 'var(--accent)') + '"/>').join('') + '</svg></div>'; };
      $('#out').innerHTML = stepsHTML([{ t: 'الوسط والمدى لكل عينة', rows: S.map((s, i) => 'العينة ' + (i + 1) + ': الوسط = ' + f(r.xbars[i], 3) + '، المدى = ' + f(r.ranges[i])) }, { t: 'الوسط الكبير = مج الأوساط ÷ عدد العينات، والمدى المتوسط = مج المدى ÷ عدد العينات', rows: ['X̿ = ' + f(r.x.cl, 3) + '، R̄ = ' + f(r.r.cl, 3)] }, { t: 'حدود خريطة الأوساط = X̿ ± A2 × R̄', rows: ['الأعلى = ' + f(r.x.ucl, 3) + '، الأدنى = ' + f(r.x.lcl, 3)] }, { t: 'حدود خريطة المدى: D4 × R̄ و D3 × R̄', rows: ['الأعلى = ' + f(r.r.ucl, 3) + '، الأدنى = ' + f(r.r.lcl, 3)] }]) + chart(r.xbars, r.x, 'خريطة الأوساط') + chart(r.ranges, r.r, 'خريطة المدى') + '<div class="feedback ' + (r.inControl ? 'ok' : 'bad') + '"><b>' + (r.inControl ? 'كل العينات جوه الحدود → العملية تحت السيطرة والانحرافات للصدفة.' : 'فيه عينات برة الحدود (' + r.outX.concat(r.outR).join('، ') + ') → العملية خارج السيطرة ولازم ندور على السبب.') + '</b><div class="note mt">ماتنساش تبص على نمط النقط: لو فيه اتجاه صاعد أو هابط متتالي ممكن يبقى فيه سبب خاص.</div></div>';
    };
  };

  /* ===== النموذج الكينزي ===== */
  TOOLS.keynes = box => {
    box.innerHTML = '<p class="note mb">مثال السكشن الأول. غيّر الأرقام:</p><div class="card mb"><div class="grid2">' + fld('الاستهلاك التلقائي a', inp('a', 160)) + fld('الميل الحدي للاستهلاك b', inp('b', 0.8)) + fld('معدل الضريبة t', inp('t', 0.25)) + fld('الاستثمار I', inp('I', 840)) + fld('الإنفاق الحكومي G', inp('G', 600)) + fld('ضرايب ثابتة T₀ (اختياري)', inp('T', '')) + '</div></div><button class="btn block" id="go">احسب التوازن</button><div id="out" class="mt"></div>';
    $('#go').onclick = () => {
      const p = { a: val('a'), b: val('b'), t: val('t') || 0, I: val('I') || 0, G: val('G') || 0, T: val('T') || 0 };
      if (isNaN(p.a) || isNaN(p.b) || p.b <= 0 || p.b >= 1) return toast('b لازم بين 0 و 1');
      const r = E.keynes(p);
      $('#out').innerHTML = '<div class="stats3"><div class="stat"><span class="n">' + f(r.Y) + '</span><span class="l">الدخل التوازني</span></div><div class="stat"><span class="n">' + f(r.k, 3) + '</span><span class="l">المضاعف</span></div><div class="stat"><span class="n">' + f(r.mlr, 3) + '</span><span class="l">MLR</span></div></div>' + stepsHTML(r.steps) + '<div class="group">' + [['الضرائب T', r.T], ['الدخل المتاح Yd', r.Yd], ['الاستهلاك C', r.C], ['الادخار S', r.S], ['الميل الحدي للادخار', 1 - p.b], ['مضاعف الضرائب', r.taxMultiplier]].map(([l, v]) => '<div class="row noicon"><span class="tx"><b>' + l + '</b></span><span class="v num">' + f(v, 3) + '</span></div>').join('') + '</div>';
    };
  };

  /* ===== IS–LM ===== */
  TOOLS.islm = box => {
    box.innerHTML = '<p class="note mb">C = a + b(Y − tY) − e·r ، I = I₀ − d·r ، G — وسوق النقود: M = kY − L·r</p><div class="card mb"><b>سوق السلع (IS)</b><div class="grid3 mt">' + fld('a', inp('a', 200)) + fld('b', inp('b', 0.8)) + fld('t', inp('t', 0.25)) + fld('e', inp('e', 30)) + fld('I₀', inp('I0', 100)) + fld('d', inp('d', 20)) + fld('G', inp('G', 100)) + '</div></div><div class="card mb"><b>سوق النقود (LM)</b><div class="grid3 mt">' + fld('k', inp('k', 0.25)) + fld('L', inp('L', 50)) + fld('M', inp('M', 150)) + '</div></div><button class="btn block" id="go">احسب</button><div id="out" class="mt"></div>';
    $('#go').onclick = () => { const r = E.islm({ a: val('a'), b: val('b'), t: val('t') || 0, e: val('e') || 0, I0: val('I0') || 0, d: val('d') || 0, G: val('G') || 0, ky: val('k'), L: val('L'), M: val('M') }); $('#out').innerHTML = stepsHTML(r.steps) + (r.Y != null ? '<div class="feedback ok"><b>Y* = ' + f(r.Y, 3) + '، r* = ' + f(r.r, 3) + '%</b></div>' : ''); };
  };

  /* ===== حسابات الدخل ===== */
  TOOLS.accounts = box => {
    box.innerHTML = '<div class="card mb"><div class="grid2">' + [['C', 'الاستهلاك C', 500], ['I', 'الاستثمار الإجمالي I', 200], ['G', 'الإنفاق الحكومي G', 150], ['X', 'الصادرات X', 80], ['M', 'الواردات M', 100], ['nfi', 'صافي دخل عناصر الإنتاج من الخارج', -20], ['dep', 'الإهلاك', 60], ['indTax', 'الضرائب غير المباشرة', 40], ['nom', 'الناتج الاسمي (للمكمش)', ''], ['real', 'الناتج الحقيقي (للمكمش)', '']].map(([k, l, v]) => fld(l, inp(k, v))).join('') + '</div></div><button class="btn block" id="go">احسب</button><div id="out" class="mt"></div>';
    $('#go').onclick = () => {
      const g = k => val(k) || 0, r = E.nationalAccounts({ C: g('C'), I: g('I'), G: g('G'), X: g('X'), M: g('M'), nfi: g('nfi'), dep: g('dep'), indTax: g('indTax') });
      const st = [{ t: 'GDP = C + I + G + (X − M)', rows: ['= ' + f(r.GDP)] }, { t: 'GNP = GDP + صافي دخل عناصر الإنتاج من الخارج', rows: ['= ' + f(r.GNP)] }, { t: 'NDP = GDP − الإهلاك', rows: ['= ' + f(r.NDP)] }, { t: 'NNP = GNP − الإهلاك', rows: ['= ' + f(r.NNP)] }, { t: 'الدخل القومي (بتكلفة عناصر الإنتاج) = NNP − الضرائب غير المباشرة', rows: ['= ' + f(r.NI)] }];
      if (g('nom') && g('real')) st.push({ t: 'مكمش الناتج = الاسمي ÷ الحقيقي × 100', rows: ['= ' + f(g('nom') / g('real') * 100) + '%'] });
      $('#out').innerHTML = stepsHTML(st);
    };
  };

  self.Tools = { meta, TOOLS };
})();
