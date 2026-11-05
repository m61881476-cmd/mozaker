/* اختبارات ثابتة لمنطق مذاكِر — تشغيل: node tests/run-tests.cjs */
'use strict';
const path = require('path');
const E = require(path.join(__dirname, '..', 'js', 'engine.js'));
global.self = global;
['acc', 'stats', 'prod', 'econ', 'mkt', 'law'].forEach(f => require(path.join(__dirname, '..', 'js', 'content', f + '.js')));
const C = global.MZ_CONTENT;

let pass = 0, fail = 0; const fails = [];
function t(name, cond, info) { if (cond) pass++; else { fail++; fails.push(name + (info !== undefined ? ' → ' + JSON.stringify(info) : '')); } }
const near = (a, b, e = 0.01) => Math.abs(a - b) <= e;
const NOW = new Date(2026, 10, 5, 10, 0); // الخميس 5 نوفمبر 2026
const ymd = d => E.ymd(d);

/* ===== تطبيع وأرقام ===== */
t('أرقام عربية', E.toLatinDigits('١٢٣٫٥') === '123.5');
t('تطبيع الألف والتاء', E.norm('إدارة الإنتاج') === 'اداره الانتاج');
t('parseNumber بفاصلة', E.parseNumber('12,500') === 12500);
t('parseNumber ألف', E.parseNumber('3 آلاف') === 3000);
t('parseNumber نسبة', E.parseNumber('15%') === 0.15);
t('parseNumber كسر', near(E.parseNumber('2/3'), 0.6667, 0.001));

/* ===== تواريخ بالعامية ===== */
const pd = s => { const r = E.parseDate(s, NOW); return r ? ymd(r.date) : null; };
t('النهارده', pd('امتحان النهارده') === '2026-11-05');
t('بكرة', pd('الامتحان بكرة') === '2026-11-06');
t('بعد بكرة', pd('بعد بكره') === '2026-11-07');
t('يوم السبت', pd('امتحان يوم السبت') === '2026-11-07', pd('امتحان يوم السبت'));
t('الاتنين', pd('امتحان المحاسبة الاتنين') === '2026-11-09', pd('امتحان المحاسبة الاتنين'));
t('الخميس الجاي (مش النهارده)', pd('الخميس الجاي') === '2026-11-12', pd('الخميس الجاي'));
t('يوم 20', pd('امتحان الاحصاء يوم 20') === '2026-11-20');
t('يوم 3 (الشهر الجاي)', pd('يوم 3') === '2026-12-03', pd('يوم 3'));
t('20/11', pd('امتحان 20/11') === '2026-11-20');
t('5-1-2027', pd('امتحان 5-1-2027') === '2027-01-05');
t('15 ديسمبر', pd('الفاينال 15 ديسمبر') === '2026-12-15');
t('بعد 3 أيام', pd('بعد 3 ايام') === '2026-11-08');
t('بعد اسبوعين', pd('بعد اسبوعين') === '2026-11-19');
t('الأسبوع الجاي', pd('الاسبوع الجاي') === '2026-11-12');
t('وقت 1:15 = بعد الضهر', E.parseTime('الساعة 1:15') === '13:15', E.parseTime('الساعة 1:15'));
t('وقت 2:30', E.parseTime('امتحان 2:30') === '14:30', E.parseTime('امتحان 2:30'));
t('وقت 9 الصبح', E.parseTime('الساعة 9 الصبح') === '09:00');
t('وقت 7 بالليل', E.parseTime('الساعة 7 بالليل') === '19:00');

/* ===== فهم العامية ===== */
const pi = s => E.parseIntent(s, NOW);
const cases = [
  ['امتحني محاسبة 10 اسئلة', 'quiz', 'acc', { count: 10 }],
  ['اختبرني في الاحصاء', 'quiz', 'stats'],
  ['عايز اراجع محاسبة', 'review', 'acc'],
  ['راجعلي بطاقات التسويق', 'review', 'mkt'],
  ['سمعلي القانون التجاري', 'review', 'law'],
  ['امتحان الإنتاج يوم 20', 'add_exam', 'prod'],
  ['عندي امتحان اقتصاد كلي يوم السبت الساعة 1:15', 'add_exam', 'econ'],
  ['الميدتيرم بتاع الاحصاء بكرة', 'add_exam', 'stats'],
  ['ايه اضعف حاجة عندي', 'weak', null],
  ['انا ضعيف في ايه في المحاسبة', 'weak', 'acc'],
  ['اذاكر ايه النهارده', 'plan', null],
  ['ابدأ بإيه', 'plan', null],
  ['شغل بومودورو 25 دقيقة', 'pomodoro', null, { minutes: 25 }],
  ['عايز استراحة 10 دقايق', 'break', null, { minutes: 10 }],
  ['يعني ايه شهرة المحل', 'summary', 'acc'],
  ['اشرحلي المضاعف', 'summary', 'econ'],
  ['ايه الفرق بين البيع والتسويق', 'summary', 'mkt'],
  ['احسب الوسط ل 4 8 15', 'calc', 'stats'],
  ['وزع ارباح', 'calc', 'acc'],
  ['سجل ملاحظة: اراجع قيود الشهرة', 'note', null],
  ['ضيف بطاقة: الإنتاجية = المخرجات ÷ المدخلات', 'add_card', null],
  ['تعبت وزهقت', 'tired', null],
  ['مش قادر اذاكر', 'tired', null],
  ['شكرا يا سند', 'thanks', null],
  ['اهلا', 'greet', null],
  ['امتحاناتي امتى', 'next_exam', null],
  ['فاضل كام يوم على الامتحان', 'next_exam', null],
  ['تقدمي عامل ايه', 'progress', null],
  ['عايز احل تمارين قيود', 'practice', 'acc'],
  ['بتعمل ايه', 'help', null],
  ['امتحان تجريبي في القانون', 'quiz', 'law'],
  ['كويز سريع ادارة انتاج 5 اسئلة', 'quiz', 'prod', { count: 5 }]
];
for (const [s, intent, subj, extra] of cases) {
  const r = pi(s);
  t('نية: ' + s, r.intent === intent, r.intent);
  if (subj !== null) t('مادة: ' + s, r.subject === subj, r.subject);
  if (extra) for (const [k, v] of Object.entries(extra)) t(k + ': ' + s, r[k] === v, r[k]);
}
const ex = pi('عندي امتحان اقتصاد كلي يوم السبت الساعة 1:15');
t('امتحان: التاريخ', ymd(ex.date) === '2026-11-07'); t('امتحان: الوقت', ex.time === '13:15', ex.time);
t('ميدتيرم: النوع', pi('الميدتيرم بتاع الاحصاء بكرة').kind === 'ميدتيرم');
t('ملاحظة: النص', pi('سجل ملاحظة: اراجع قيود الشهرة').body === 'اراجع قيود الشهرة', pi('سجل ملاحظة: اراجع قيود الشهرة').body);
const ac = pi('ضيف بطاقة: الإنتاجية = المخرجات ÷ المدخلات');
t('بطاقة: الوش', ac.front === 'الإنتاجية', ac.front); t('بطاقة: الضهر', ac.back === 'المخرجات ÷ المدخلات', ac.back);
t('أرقام الحساب', JSON.stringify(pi('احسب الوسط ل 4 8 15').numbers) === '[4,8,15]');

/* ===== التصحيح ===== */
t('أكمل: مطابقة', E.gradeFill({ answer: 'الشامل', accept: ['شامل'] }, 'شامل').ok);
t('أكمل: من غير ال', E.gradeFill({ answer: 'المدة' }, 'مدة').ok);
t('أكمل: غلطة إملائية', E.gradeFill({ answer: 'التعادل' }, 'التعادول').ok);
t('أكمل: تاء مربوطة', E.gradeFill({ answer: 'تجزئة' }, 'تجزئه').ok);
t('أكمل: غلط', !E.gradeFill({ answer: 'باش' }, 'لاسبير').ok);
t('رقم: أرقام عربية', E.gradeNumber(7500, '٧٥٠٠').ok);
t('رقم: بفاصلة', E.gradeNumber(23100, '23,100').ok);
t('رقم: غلط', !E.gradeNumber(7500, '7400').ok);
t('رقم: سالب', E.gradeNumber(-0.8, '-0.8').ok);
t('صح وغلط', E.grade({ type: 'tf', answer: false }, false).ok && !E.grade({ type: 'tf', answer: true }, false).ok);

/* قيود: القيد المركب = القيود المنفصلة */
const sep = [{ lines: [{ acc: 'النقدية بالصندوق', dr: 60000 }, { acc: 'رأس مال الشريك أحمد', cr: 60000 }] }, { lines: [{ acc: 'النقدية بالصندوق', dr: 40000 }, { acc: 'رأس مال الشريك خالد', cr: 40000 }] }];
const comb = [{ lines: [{ acc: 'ح/ النقدية بالصندوق', dr: 100000 }, { acc: 'رأس مال الشريك أحمد', cr: 60000 }, { acc: 'رأس مال الشريك خالد', cr: 40000 }] }];
t('قيد مركب = منفصل', E.gradeJournal(sep, comb).ok);
const wrongSide = [{ lines: [{ acc: 'رأس مال الشريك أحمد', dr: 60000 }, { acc: 'النقدية بالصندوق', cr: 60000 }] }];
const g1 = E.gradeJournal([sep[0]], wrongSide); t('قيد معكوس', !g1.ok && g1.issues.some(i => i.kind === 'side'));
t('قيد مش متوازن', E.gradeJournal([sep[0]], [{ lines: [{ acc: 'النقدية بالصندوق', dr: 60000 }, { acc: 'رأس مال الشريك أحمد', cr: 50000 }] }]).issues.some(i => i.kind === 'unbalanced'));

/* ===== التكرار المتباعد ===== */
let s = E.srsNext(null, 2, 0); t('أول مرة كويس = يوم', near(s.ivl, 1) && s.due === 86400000);
s = E.srsNext(s, 2, s.due); t('تاني مرة كويس = 3 أيام', near(s.ivl, 3));
const s3 = E.srsNext(s, 3, s.due); t('سهلة بتطول المدة', s3.ivl > 6, s3.ivl);
const s0 = E.srsNext(s3, 0, 1000); t('نسيت = 10 دقايق', s0.due === 1000 + 600000 && s0.reps === 0 && s0.lapses === 1);
t('الإتقان بين 0 و 1', E.mastery(s3) > 0 && E.mastery(s3) <= 1);

/* ===== المحاسبة: أمثلة المحاضرات والسكاشن ===== */
// سكشن 5: 3 شركاء
let r = E.distributeProfit({ netProfit: 120000, rates: { capital: .1, drawings: .12, current: .08 }, partners: [{ name: 'محمد', capital: 250000, ratio: 2, opening: -5000, drawings: [{ amount: 20000, month: 7, day: 1 }] }, { name: 'أمين', capital: 250000, ratio: 2, opening: 10000, drawings: [{ amount: 25000, month: 9, day: 1 }], salaryMonthly: 2000, salaryPaid: 12000 }, { name: 'عبدالله', capital: 250000, ratio: 1, drawings: [{ amount: 10000, month: 10, day: 1 }] }] });
t('سكشن 5: الباقي 23100', r.remain === 23100, r.remain);
t('سكشن 5: الأنصبة', JSON.stringify(r.shares) === '[9240,9240,4620]');
t('سكشن 5: فوائد المسحوبات', JSON.stringify(r.drawInt) === '[1200,1000,300]');
t('سكشن 5: أرصدة الجاري', JSON.stringify(r.current.map(c => c.balance)) === '[7640,31040,19320]', r.current.map(c => c.balance));
t('سكشن 5: ح/ التوزيع متوازن', near(r.debit.reduce((a, x) => a + x.amount, 0), r.credit.reduce((a, x) => a + x.amount, 0)));
// سكشن 6: مكافأة بعد فوائد رأس المال + مرتب
r = E.distributeProfit({ netProfit: 10000, rates: { capital: .15, drawings: .16, current: .14 }, bonus: { partner: 0, rate: .1, base: 'afterCapInt' }, partners: [{ name: 'أ', capital: 10000, ratio: 1, opening: -600, drawings: [{ amount: 1000, month: 3 }] }, { name: 'ب', capital: 20000, ratio: 1, opening: 200, drawings: [{ amount: 400, month: 9 }], salaryMonthly: 150, salaryPaid: 1200 }] });
t('سكشن 6: المكافأة 550', r.bonus[0] === 550); t('سكشن 6: الباقي 3342', r.remain === 3342, r.remain); t('سكشن 6: فوائد المسحوبات 120/16', JSON.stringify(r.drawInt) === '[120,16]');
t('سكشن 6: فائدة الجاري 84 مدين و28 دائن', r.curDr[0] === 84 && r.curCr[1] === 28);
// محاضرة 6: مرتب 100 شهري، قبض 800
r = E.distributeProfit({ netProfit: 16000, rates: { capital: .06, drawings: .04, current: .05 }, partners: [{ name: 'أ', capital: 20000, ratio: 1, opening: -1000, drawings: [{ amount: 2000, month: 9 }], salaryMonthly: 100, salaryPaid: 800 }, { name: 'ب', capital: 40000, ratio: 1, opening: 600, drawings: [{ amount: 1200, month: 3 }], loanInterest: 800 }] });
t('محاضرة 6: الباقي 11276', r.remain === 11276, r.remain); t('محاضرة 6: النصيب 5638', r.shares[0] === 5638); t('محاضرة 6: جاري أ 4168', r.current[0].balance === 4168, r.current[0].balance);
// خسارة
r = E.distributeProfit({ netProfit: -6000, rates: {}, partners: [{ name: 'أ', capital: 1, ratio: 2 }, { name: 'ب', capital: 1, ratio: 1 }] });
t('خسارة تتوزع بالنسبة', JSON.stringify(r.shares) === '[-4000,-2000]' && r.current[0].side === 'مدين');
// تكوين رأس المال: شهرة محل (سكشن 3)
const cf = E.capitalFormation({ total: 240000, ratio: [3, 2, 1], partners: [{ name: 'أحمد', method: 'cash' }, { name: 'خالد', method: 'bank' }, { name: 'منى', method: 'business', assets: [{ acc: 'الأثاث', value: 18000 }, { acc: 'النقدية بالصندوق', value: 6000 }, { acc: 'النقدية بالبنك', value: 9000 }, { acc: 'البضاعة', value: 12000 }], liabilities: [{ acc: 'الدائنون', value: 5000 }, { acc: 'أوراق الدفع', value: 4000 }], settle: 'cash' }] });
t('تكوين: الحصص', JSON.stringify(cf.shares) === '[120000,80000,40000]');
t('تكوين: منى تسدد 4000', cf.entries.some(e => /باقي/.test(e.memo) && e.lines[0].dr === 4000));
t('تكوين: كل القيود متوازنة', cf.entries.every(E.entryBalanced));
for (let seed = 1; seed <= 60; seed++) { const g = E.genCapital(seed); if (!g.entries.every(E.entryBalanced)) { t('genCapital متوازن ' + seed, false); break; } const net = E.netByAccount(g.entries); const capKey = E.accKey('رأس مال الشريك ' + g.names[2]); if (Math.abs(-net[capKey] - g.shares[2]) > 0.5) { t('genCapital رأس مال الشريك = الحصة ' + seed, false, [net[capKey], g.shares[2], g.mode]); break; } }
t('genCapital: 60 تمرين متوازن ورأس المال = الحصة', true);
for (let seed = 1; seed <= 60; seed++) { const g = E.genDistribution(seed); const d = g.solution; const dr = d.debit.reduce((a, x) => a + x.amount, 0), cr = d.credit.reduce((a, x) => a + x.amount, 0); if (!near(dr, cr, 0.02)) { t('genDistribution متوازن ' + seed, false, [dr, cr]); break; } }
t('genDistribution: 60 تمرين متوازن', true);

/* ===== الإحصاء ===== */
let st = E.describeRaw([10, 12, 15, 18, 20, 22, 25, 28, 30, 32, 35]);
t('الربيع الأول 15', st.q1 === 15); t('الربيع التالت 30', st.q3 === 30); t('المدى الربيعي 15', st.iqr === 15);
st = E.describeRaw([820, 700, 880, 900, 760, 950, 600, 1000]); t('وسيط زوجي 850', st.median === 850);
t('منوال', JSON.stringify(E.modes([2, 4, 2, 5, 3, 2, 4])) === '[2]'); t('مفيش منوال', E.modes([1, 2, 3]).length === 0);
t('تباين العينة ÷ (ن−1)', near(E.describeRaw([2, 4, 4, 4, 5, 5, 7, 9]).variance, 32 / 7, 1e-9));
const gr = E.describeGrouped([{ lo: 20, hi: 25, f: 30 }, { lo: 25, hi: 30, f: 20 }, { lo: 30, hi: 35, f: 25 }, { lo: 35, hi: 40, f: 13 }, { lo: 40, hi: 45, f: 7 }, { lo: 45, hi: 50, f: 5 }]);
t('مبوب: الوسط 30.6 (محاضرة 5)', near(gr.mean, 30.6));
const ix = E.indexNumbers([10, 20], [15, 25], [5, 4], [6, 3]); t('لاسبير', near(ix.laspeyres, (15 * 5 + 25 * 4) / (10 * 5 + 20 * 4) * 100)); t('فيشر = وسط هندسي', near(ix.fisher, Math.sqrt(ix.laspeyres * ix.paasche)));

/* ===== الإنتاج ===== */
const xr = E.xbarR([[5, 7, 12], [6, 3, 9], [3, 5, 4], [6, 6, 12], [2, 5, 2], [7, 9, 11], [8, 10, 12], [10, 12, 14]], { A2: 1.12 });
t('خرائط: الوسط الكبير 7.5', xr.x.cl === 7.5); t('خرائط: الحد الأعلى 12.54', near(xr.x.ucl, 12.54)); t('خرائط: الحد الأدنى 2.46', near(xr.x.lcl, 2.46)); t('خرائط: تحت السيطرة', xr.inControl);
t('برمجة خطية: (3،2) = 50', JSON.stringify(E.lp2([12, 7], [[2, 3, 12], [2, 1, 8]]).best) === JSON.stringify({ x: 3, y: 2, z: 50 }));
const L = E.locations({ F: 600000, v: 120 }, { F: 1000000, v: 80 }, 200);
t('التعادل 7500', L.a.be === 7500); t('السواء 10000', L.indiff === 10000); t('طلب 9000 ← الأول', L.pick(9000) === 'a'); t('طلب 12000 ← التاني', L.pick(12000) === 'b');
const pm = E.perishablePayoff([100, 110, 120, 130], [100, 110, 120, 130], 0.4, 0.5);
const dv = E.decision(pm, { probs: [.2, .15, .3, .35] }); t('الجرايد: القيمة المتوقعة 10', near(dv.ev.values[0], 10) && near(dv.ev.values[1], 10));
const dm = E.decision([[100, 140], [120, 120]], { alpha: 0.6 });
t('المتفائل', dm.optimistic.best === 0); t('المتشائم', dm.pessimistic.best === 1); t('الأمثلية 124', near(dm.hurwicz.values[0], 124));
const as = E.assignment([[9, 2, 7, 8], [6, 4, 3, 7], [5, 8, 1, 8], [7, 6, 9, 4]]); t('التخصيص: أقل تكلفة 13', as.total === 13, as.total);

/* ===== الاقتصاد ===== */
let k = E.keynes({ a: 160, b: 0.8, t: 0.25, I: 840, G: 600 });
t('كينز 1: Y = 4000', near(k.Y, 4000)); t('كينز 1: المضاعف 2.5', near(k.k, 2.5)); t('كينز 1: C = 2560', near(k.C, 2560)); t('كينز 1: S = 440', near(k.S, 440)); t('كينز 1: الحقن = التسرب', near(k.leak, k.inject));
k = E.keynes({ a: 400, b: 0.75, t: 0.2, I: 1200, G: 800 }); t('كينز 2: Y = 6000', near(k.Y, 6000)); t('نقطة التعادل 1600', near(k.breakEven, 1600));
t('سوق النقود r = 3.2', near(E.moneyMarket({ ky: 0.8, Y: 600, L: 100, M: 160 }).r, 3.2));
const is = E.islm({ a: 200, b: 0.8, t: 0.25, e: 30, I0: 100, d: 20, G: 100 }); t('IS: 1000 − 125r', near(is.isAlpha, 1000) && near(is.isBeta, 125));

/* ===== المخطط ===== */
const plan = E.buildPlan([{ id: 'x', subject: 'acc', date: E.addDays(NOW, 4) }], { acc: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'] }, { a1: 1 }, { now: NOW, perDay: 3 });
const lessonsPlanned = Object.values(plan).flat().filter(x => x.type === 'lesson').map(x => x.lesson);
t('المخطط: الدروس المقفولة مش بتتجدول', !lessonsPlanned.includes('a1') && lessonsPlanned.length === 5, lessonsPlanned);
t('المخطط: يوم مراجعة قبل الامتحان', (plan[ymd(E.addDays(NOW, 3))] || []).some(x => x.type === 'review'));
t('السلسلة', E.streak(new Set([ymd(NOW), ymd(E.addDays(NOW, -1)), ymd(E.addDays(NOW, -2))]), NOW) === 3);
t('السلسلة من امبارح', E.streak(new Set([ymd(E.addDays(NOW, -1))]), NOW) === 1);
const wk = E.weakness([{ subject: 'acc', lesson: 'a', ok: false }, { subject: 'acc', lesson: 'a', ok: false }, { subject: 'acc', lesson: 'b', ok: true }, { subject: 'acc', lesson: 'b', ok: true }]);
t('نقط الضعف مرتبة', wk[0].lesson === 'a');

/* ===== البحث ===== */
const docs = []; C.forEach(s => s.lessons.forEach(l => docs.push({ id: l.id, title: l.title, text: l.summary })));
const top = q => (E.search(docs, q)[0] || {}).doc || {};
t('بحث: شهرة المحل', ['acc3', 'acc4'].includes(top('شهرة المحل').id), top('شهرة المحل').id);
t('بحث: المضاعف', top('المضاعف').id === 'ec3', top('المضاعف').id);
t('بحث: لاسبير', top('رقم لاسبير').id === 'st7', top('رقم لاسبير').id);
t('بحث: السمسرة', top('السمسرة').id === 'lw3', top('السمسرة').id);
t('بحث: تجزئة السوق', top('تجزئة السوق').id === 'mk5', top('تجزئة السوق').id);

/* ===== سلامة المحتوى ===== */
const subjects = C.map(s => s.id); t('6 مواد', subjects.length === 6);
let nQ = 0, nC = 0;
for (const s of C) {
  const L = new Set(s.lessons.map(l => l.id));
  for (const c of s.cards) { nC++; if (!L.has(c[2]) || !c[0] || !c[1]) t('بطاقة سليمة: ' + s.id + ' ' + c[0], false); }
  for (const q of s.questions) {
    nQ++;
    if (!L.has(q.l)) t('سؤال درسه موجود: ' + q.q, false);
    if (q.t === 'mcq' && !(Array.isArray(q.o) && q.o.length >= 2 && q.a >= 0 && q.a < q.o.length)) t('اختيار سليم: ' + q.q, false);
    if (q.t === 'tf' && typeof q.a !== 'boolean') t('صح/غلط سليم: ' + q.q, false);
    if (q.t === 'num' && typeof q.a !== 'number') t('رقم سليم: ' + q.q, false);
    if (q.t === 'fill' && !q.a) t('أكمل سليم: ' + q.q, false);
  }
  for (const l of s.lessons) if (!s.questions.some(q => q.l === l.id) || !s.cards.some(c => c[2] === l.id)) t('كل درس ليه أسئلة وبطاقات: ' + l.id, false);
}
t('عدد الأسئلة ≥ 200', nQ >= 200, nQ); t('عدد البطاقات ≥ 200', nC >= 200, nC);
// كل الأسئلة الرقمية بتتصحح صح بإجابتها
for (const s of C) for (const q of s.questions) if (q.t === 'num' && !E.grade({ type: 'num', answer: q.a, tol: q.tol }, String(q.a)).ok) t('سؤال رقمي بيصحح نفسه: ' + q.q, false);

console.log('\n' + (fail ? '✗' : '✓') + ' ' + pass + ' نجح، ' + fail + ' فشل' + ' — ' + nQ + ' سؤال و ' + nC + ' بطاقة');
if (fail) { console.log(fails.map(f => '  • ' + f).join('\n')); process.exit(1); }
