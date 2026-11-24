/* اختبارات سلامة منهج التسويق المدمج + محرك الرسومات + أوامر المذاكرة */
global.self = global;
const E = require('../js/engine.js');
const F = require('../js/figs.js');
// المصادر الكاملة في content-src/ (مش على GitHub). لو مش موجودة: node tools/mz.cjs unpack
if (!require('fs').existsSync(__dirname + '/../content-src/mkt.js')) { console.log('⚠️ content-src مش موجودة — اتخطّيت اختبارات المحتوى'); process.exit(0); }
['mkt', 'mkt-b', 'mkt-q1', 'mkt-q2', 'mkt-kb', 'mkt-bd', 'eco', 'eco-b1', 'eco-q', 'eco-rev', 'eco-islm', 'law', 'law-b1', 'law-q', 'stat', 'prod'].forEach(f => require('../content-src/' + f + '.js'));
let pass = 0, fail = 0; const fails = [];
const t = (n, c, x) => { if (c) pass++; else { fail++; fails.push(n + (x ? ' — ' + x : '')); } };
const S = self.MZ_CONTENT.find(s => s.id === 'mkt');
E.mergePlus(S); E.setSubjects([S]); F.reg(S.id, S.figs);
const ids = S.lessons.map(l => l.id), chapters = ids.filter(i => i !== S.final);

t('الدروس بالترتيب والمراجعة النهائية في الآخر', ids.join() === 'mk0,mk1,mk2,mk3,mk4,mk5,mk6,mk7,mk9' && S.final === 'mk9');
t('كل درس له عنوان ومصدر وملخص بأقسام', S.lessons.every(l => l.title && l.source && l.summary.length > 1500 && (l.summary.match(/^## /gm) || []).length >= 4));
chapters.forEach(c => { const n = S.questions.filter(q => q.l === c).length; t('20 سؤال أو أكتر على ' + c, n >= 20, String(n)); });
const stars = S.questions.filter(q => q.x);
t('100 سؤال متوقع أو أكتر وكل واحد له سبب', stars.length >= 100 && stars.every(q => q.w && q.w.length > 8), String(stars.length));
t('كل سؤال له درس صح وشرح', S.questions.every(q => ids.includes(q.l) && q.e && q.e.length > 8));
t('مفتاح كل سؤال فريد', new Set(S.questions.map(q => q.k)).size === S.questions.length);
t('نصوص الأسئلة مش متكررة', new Set(S.questions.map(q => q.q)).size === S.questions.length);
t('الاختياري: 3–4 اختيارات مختلفة وإجابة في المدى', S.questions.filter(q => q.t === 'mcq').every(q => q.o.length >= 3 && q.o.length <= 4 && new Set(q.o).size === q.o.length && q.a >= 0 && q.a < q.o.length));
t('صح وغلط: إجابة منطقية، والغلط له تصحيح', S.questions.filter(q => q.t === 'tf').every(q => typeof q.a === 'boolean' && (q.a || q.fix)));
t('كل الأسئلة اختيار من متعدد أو صح وغلط بس (مفيش «أكمل»)', S.questions.every(q => q.t === 'mcq' || q.t === 'tf'));
t('مكان الإجابة الصح متوزع على الأربعة', [0, 1, 2, 3].every(i => S.questions.filter(q => q.t === 'mcq' && q.a === i).length >= S.questions.filter(q => q.t === 'mcq').length / 6));
t('التفرعات على اختيارات غلط موجودة', S.questions.filter(q => q.on).every(q => q.t === 'mcq' && Object.keys(q.on).every(i => +i !== q.a && +i < q.o.length)));
t('95+ سؤال فيه تفرعات مكتوبة', S.questions.filter(q => q.on).length >= 95);
t('أنواع الأسئلة متنوعة', [['mcq', 100], ['tf', 25]].every(([k, n]) => S.questions.filter(q => q.t === k).length >= n));
t('الكلمات المفتاحية اتنقلت', S.questions.some(q => Array.isArray(q.kw) && q.kw.length));
// بطاقات
t('50+ بطاقة وكل بطاقة على درس', S.cards.length >= 50 && S.cards.every(c => c[0] && c[1] && chapters.includes(c[2])));
chapters.forEach(c => t('بطاقات على ' + c, S.cards.filter(x => x[2] === c).length >= 4));
// رسومات
const figIds = Object.keys(S.figs);
t('17 رسمة في التسويق', figIds.length === 17);
const refs = [].concat(...S.lessons.map(l => (l.summary.match(/\[\[fig:([\w-]+)\]\]/g) || []).map(m => m.slice(6, -2))));
t('كل رسمة مذكورة في الدروس موجودة', refs.every(r => S.figs[r]), refs.filter(r => !S.figs[r]).join());
t('كل رسمة مستخدمة في درس', figIds.every(f => refs.includes(f)), figIds.filter(f => !refs.includes(f)).join());
t('كل رسمة بتترسم', figIds.every(f => { const h = F.html(f); return h.includes('<figure') && h.length > 300; }));
t('وضع التدريب بيخبّي الأسماء', (() => { const h = F.html('mk-maslow', { hide: true, hot: 2 }); return h.includes('؟') && !h.includes('تحقيق الذات') && (h.match(/fg-band hot/g) || []).length === 1; })());
t('التدريب الجزئي بيظهر اللي اتحل', (() => { const h = F.html('mk-maslow', { hide: [0, 1], hot: 0, noact: true }); return h.includes('حاجات الأمان') && !h.includes('>تحقيق الذات<') && !h.includes('#fig/'); })());
t('هرم ماسلو: القمة تحقيق الذات والقاعدة الفسيولوجية', F.parts('mk-maslow').length === 5 && F.parts('mk-maslow')[0].t === 'تحقيق الذات' && /فسيولوجية/.test(F.parts('mk-maslow')[4].t));
t('دورة حياة المنتج 4 مراحل بالترتيب', F.parts('mk-plc').map(p => p.s || p.t).join('،').replace(/مرحلة /g, '').startsWith('التقديم'));
t('الرسومات القابلة للتدريب 10+', figIds.filter(f => F.canPractice(f)).length >= 10);
// مفاهيم
t('50+ مفهوم سليم', S.concepts.length >= 50 && S.concepts.every(c => c.k && c.def && ids.includes(c.l) && (!c.fig || S.figs[c.fig]) && (c.rel || []).every(r => S.concepts.some(x => x.k === r))));
t('أسماء المفاهيم فريدة', new Set(S.concepts.map(c => c.k)).size === S.concepts.length);
const tu = (x, ctx) => E.tutor(S.concepts, x, ctx || {});
t('«يعني إيه تجزئة السوق»', tu('يعني ايه تجزئة السوق').c.k === 'تجزئة السوق');
t('«ليه؟» بعدها', (() => { const r = tu('ليه؟', { last: 'تجزئة السوق' }); return r && r.kind === 'why' && r.c.k === 'تجزئة السوق' && E.tutorParts(r)[0].t.includes('مش متجانسين'); })());
t('الفرق بين الإعلان والدعاية', (() => { const r = tu('ايه الفرق بين الاعلان والدعاية'); return r.kind === 'diff' && r.c.k === 'الإعلان' && r.c2.k === 'الدعاية'; })());
t('هرم ماسلو بيتعرف', tu('اشرحلي هرم ماسلو').c.k === 'هرم ماسلو');
t('AIDA بيتعرف', tu('يعني ايه AIDA').c.k === 'نموذج AIDA');
t('must و howto موجودين', S.must.length >= 8 && S.howto.length >= 6 && S.must.every(m => m.t && m.href));
// أوامر المذاكرة
const si = x => E.studyIntent(x);
t('ارسملي', si('ارسملي هرم ماسلو').kind === 'draw' && si('وريني الرسومات').kind === 'draw');
t('ذاكرلي + رقم الفصل', si('ذاكرلي الفصل الاول').ord === 1 && si('اشرحلي الفصل 3').ord === 3 && si('ذاكرلي المقدمة').ord === 0 && si('ذاكرلي').kind === 'teach');
t('ترتيب الدروس بيتقري من عناوينها', S.lessons.slice(0, 6).every((l, i) => si('ذاكرلي ' + l.title).ord === i));
t('مراجعة نهائية', si('مراجعة نهائية').kind === 'final' && si('عايز مراجعه شامله').kind === 'final');
t('أهم الأسئلة', si('ايه اهم الاسئلة المتوقعة').kind === 'important' && si('ايه اللي حتما هييجي').kind === 'important');
t('الكلام العادي مش أمر مذاكرة', [si('امتحني 10 اسئلة'), si('عايز اراجع'), si('يعني ايه تجزئة السوق'), si('ايه الفرق بين البيع والتسويق')].every(x => x === null));


/* ---------- الاقتصاد الكلي (الفصول 1 إلى 3) ---------- */
{
  const Ec = self.MZ_CONTENT.find(x => x.id === 'eco'); E.mergePlus(Ec);
  const ch = ['ec1', 'ec2', 'ec3', 'ecr', 'ec4', 'ec5'], lids = Ec.lessons.map(l => l.id);
  t('اقتصاد: الدروس 4 فصول (الرابع درسين) + مراجعتين', lids.join() === 'ec1,ec2,ec3,ecr,ec4,ec5,ec9' && Ec.final === 'ec9');
  t('اقتصاد: كل درس ملخصه بأقسام', Ec.lessons.every(l => l.summary.length > 2000 && (l.summary.match(/^## /gm) || []).length >= 5));
  ch.forEach(c => { const n = Ec.questions.filter(q => q.l === c).length; t('اقتصاد: 20+ سؤال على ' + c, n >= 20, String(n)); });
  t('اقتصاد: كل سؤال له شرح ودرس', Ec.questions.every(q => ch.includes(q.l) && q.e && q.e.length > 8));
  t('اقتصاد: المتوقع له سبب', Ec.questions.filter(q => q.x).length >= 50 && Ec.questions.filter(q => q.x).every(q => q.w));
  t('اقتصاد: كل الأسئلة اختيار أو صح وغلط', Ec.questions.every(q => q.t === 'mcq' || q.t === 'tf'));
  t('اقتصاد: مسائل حسابية 30+ (اختياراتها أرقام)', Ec.questions.filter(q => q.t === 'mcq' && q.o.every(o => /^[\u200e−\-]?[\d.]+$/.test(o))).length >= 30);
  t('اقتصاد: الاختياري سليم', Ec.questions.filter(q => q.t === 'mcq').every(q => q.o.length === 4 && new Set(q.o).size === 4 && q.a >= 0 && q.a < 4 && Object.keys(q.on || {}).every(i => +i !== q.a)));
  t('اقتصاد: نصوص الأسئلة فريدة', new Set(Ec.questions.map(q => q.q)).size === Ec.questions.length);
  t('اقتصاد: 20+ بطاقة على الفصول', Ec.cards.length >= 20 && Ec.cards.every(c => ch.includes(c[2])));
  t('اقتصاد: مفاهيم سليمة', Ec.concepts.length >= 25 && Ec.concepts.every(c => c.k && c.def && lids.includes(c.l) && (c.rel || []).every(r => Ec.concepts.some(x => x.k === r))));
  // صحة أرقام الأمثلة (بتتحسب من أول وجديد)
  const keynes = (a, b, tx, I, G) => { const MLR = 1 - b + b * tx, k = 1 / MLR, A = a + I + G, Y = k * A, T = tx * Y, Yd = Y - T, C = a + b * Yd, Sv = Yd - C; return { MLR, k, A, Y, T, Yd, C, S: Sv, be: a / (1 - b) }; };
  const near = (x, y) => Math.abs(x - y) < 1e-6;
  const q1 = keynes(80, 0.8, 0.25, 420, 300);
  t('سؤال الدكتور: k=2.5, A=800, Y=2000, T=500, Yd=1500, C=1280, S=220, تعادل 400', near(q1.k, 2.5) && near(q1.A, 800) && near(q1.Y, 2000) && near(q1.T, 500) && near(q1.Yd, 1500) && near(q1.C, 1280) && near(q1.S, 220) && near(q1.be, 400));
  t('سؤال الدكتور: العرض = الطلب والحقن = التسرب', near(q1.C + q1.S + q1.T, q1.C + 420 + 300) && near(q1.S + q1.T, 720));
  const s1 = keynes(160, 0.8, 0.25, 840, 600), s2 = keynes(400, 0.75, 0.2, 1200, 800), s3 = keynes(1000, 0.8, 0.375, 1500, 1000);
  t('مثال السكشن 1: Y=4000, C=2560, S=440, تعادل 800', near(s1.Y, 4000) && near(s1.C, 2560) && near(s1.S, 440) && near(s1.be, 800));
  t('مثال السكشن 2: MLR=0.4, Y=6000, C=4000, S=800, تعادل 1600', near(s2.MLR, 0.4) && near(s2.Y, 6000) && near(s2.C, 4000) && near(s2.S, 800) && near(s2.be, 1600));
  t('مثال الضريبة 0.375: MLR=0.5, Y=7000, T=2625, Yd=4375, C=4500, S=−125', near(s3.MLR, 0.5) && near(s3.Y, 7000) && near(s3.T, 2625) && near(s3.Yd, 4375) && near(s3.C, 4500) && near(s3.S, -125));
  const gdp = 460 + (126 + 14) + 120 + (28 - 34), ndp = gdp - 14, di = ndp - 10, pi2 = di - (80 + 50 + 40) + 10, yd = pi2 - 30;
  t('التمرين الشامل: 714، 700، 690، 530، 500', gdp === 714 && ndp === 700 && di === 690 && di === 400 + 150 + 80 + 60 && pi2 === 530 && yd === 500 && yd === 460 + 40);
  t('الخبز: مجموع القيم المضافة 100، والتنبيه على غلطة جمع الكتاب موجود', 30 + 35 + 25 + 10 === 100 && (30 + 65 + 90 + 100) - (30 + 65 + 90) === 100 && Ec.lessons[1].summary.includes('285'));
  t('اسمي وحقيقي: 1000، 2000، 1000، والأرقام القياسية 220 و 200', 100 * 4 + 1000 * 0.2 + 40 * 10 === 1000 && 150 * 6 + 500 * 0.4 + 30 * 30 === 2000 && 150 * 4 + 500 * 0.2 + 30 * 10 === 1000 && near((100 * 6 + 1000 * 0.4 + 40 * 30) / 1000 * 100, 220));
  const txt = Ec.lessons.map(l => l.summary).join('\n');
  t('الأرقام دي مكتوبة في الملخصات', ['2000', '1280', '220', '714', '690', '530', '7000', '−125', '4375'].every(n => txt.includes(n)));
  // البورد
  const B = Ec.boards, TYPES = ['h', 'w', 'li', 'eq', 'note', 'sp', 'flow', 'tbl', 'tr', 'tc', 'g', 'gl'];
  t('بورد: درس لكل فصل', ch.every(c => Array.isArray(B[c]) && B[c].length >= 6) && !B.ec9);
  t('بورد: كل خطوة نوعها معروف', ch.every(c => B[c].every(sc => sc.t && sc.s.length >= 5 && sc.s.every(st => TYPES.includes(st[0])))));
  t('بورد: كل خطوة مكتوبة ليها كلام منطوق', ch.every(c => B[c].every(sc => sc.s.every(st => ['sp', 'tc'].includes(st[0]) || (typeof st[2] === 'string' && st[2].length > 5)))));
  t('بورد: tr بعد tbl و gl بعد g', ch.every(c => B[c].every(sc => { let tb = false, g = false; return sc.s.every(st => { if (st[0] === 'tbl') tb = true; if (st[0] === 'g') g = true; return (st[0] !== 'tr' && st[0] !== 'tc' || tb) && (st[0] !== 'gl' || g); }); })));
  t('بورد: صفوف الجدول بعدد أعمدة الرأس', ch.every(c => B[c].every(sc => { let n = 0; return sc.s.every(st => { if (st[0] === 'tbl') { n = st[1].head.length; return (st[1].rows || []).every(r => r.length === n); } return st[0] !== 'tr' || st[1].length === n; }); })));
  t('بورد: الكلام المنطوق مفيهوش رموز لاتيني كتير', ch.every(c => B[c].every(sc => sc.s.every(st => !/[A-Za-z]{3,}/.test(st[2] || '')))));
  const board3 = B.ec3.map(sc => sc.s.map(st => typeof st[1] === 'string' ? st[1] : '').join(' ')).join(' ');
  t('بورد الفصل 3 فيه الاشتقاق والنتايج', ['Y = *k* A̅', '2.5 × 800', '*2000*', 'Yd = *400*', '*−125*'].every(x => board3.includes(x)));
  t('اقتصاد: must و howto', Ec.must.length >= 6 && Ec.howto.length >= 5);
  const tu = x => E.tutor(Ec.concepts, x, {});
  t('اقتصاد: سَنَد يشرح المضاعف والفرق بين التعادل والتوازن', tu('يعني ايه مضاعف الانفاق').c.k === 'مضاعف الإنفاق' && tu('الفرق بين التعادل والتوازن').kind === 'diff');
}
/* ---------- القانون التجاري ---------- */
{
  const Lw = self.MZ_CONTENT.find(s => s.id === 'law');
  t('قانون: المادة موجودة بالفصل الأول', !!Lw && Lw.lessons.length === 1 && Lw.lessons[0].id === 'lw1');
  const q = Lw.questions;
  t('قانون: 29 سؤال (زي الامتحان الأصلي، والـ 30 لسه ماوصلش)', q.length === 29, q.length);
  t('قانون: اختيار من متعدد وصح وغلط بس', q.every(x => x.t === 'mcq' || x.t === 'tf'));
  t('قانون: كل MCQ أربع اختيارات وإجابة صح', q.filter(x => x.t === 'mcq').every(x => x.o.length === 4 && x.a >= 0 && x.a < 4 && x.e));
  t('قانون: الإجابات الصح متوزعة على الأماكن', [0, 1, 2, 3].every(i => q.filter(x => x.t === 'mcq' && x.a === i).length >= 2));
  t('قانون: كل سؤال ليه شرح', q.every(x => x.e && x.e.length > 20));
  t('قانون: أول سؤال عن القانون العام', q[0].q.includes('صاحبة سلطة وسيادة') && q[0].a === 2);
  t('قانون: البورد 9 مشاهد', Lw.boards.lw1 && Lw.boards.lw1.length === 9);
  F.reg('law', Lw.figs);
  const refs = (Lw.lessons[0].summary.match(/\[\[fig:([\w-]+)\]\]/g) || []).map(m => m.slice(6, -2));
  t('قانون: كل الرسومات المذكورة موجودة وبترسم', refs.length === 4 && refs.every(id => F.get(id) && F.html(id).includes('<figure')));
  const sum = Lw.lessons[0].summary;
  t('قانون: الملخص فيه كل المعلومات المهمة', ['صاحبة سلطة وسيادة', 'الشريعة العامة', 'العرف التجاري', '1000 جنيه', 'اليمين الحاسمة', 'التاريخ الثابت', 'افتراض التضامن', 'أمين التفليسة', 'النفاذ المعجل', '2008', '4%', '5%', 'متجمّد الفوائد', 'الرهن الحيازي', 'المضاربة', 'التداول', 'الحرفة', 'دور منطقي', 'المنفردة', 'الاحتراف'].every(w => sum.includes(w)));
  E.mergePlus(Lw);
  const tu = x => E.tutor(Lw.concepts, x, {});
  t('قانون: سَنَد يفهم «يعني ايه النفاذ المعجل»', (tu('يعني ايه النفاذ المعجل') || { c: {} }).c.k === 'النفاذ المعجل');
  t('قانون: سَنَد يفهم الغلط الإملائي «نظريه التدوال»', (tu('اشرحلي نظريه التدوال') || { c: {} }).c.k === 'نظرية التداول');
}
// كل المواد: بورد لكل درس (ماعدا المراجعات النهائية) + الأسئلة اختيار أو صح وغلط بس
for (const X of self.MZ_CONTENT) {
  X.lessons.filter(l => !/9$/.test(l.id)).forEach(l => t(X.id + ': بورد لـ ' + l.id, X.boards && Array.isArray(X.boards[l.id]) && X.boards[l.id].length >= 3 && X.boards[l.id].every(sc => sc.t && sc.s.length >= 3)));
  t(X.id + ': كل الأسئلة اختيار أو صح وغلط', X.questions.every(q => q.t === 'mcq' || q.t === 'tf'));
  t(X.id + ': الاختياري 4 اختيارات مختلفة', X.questions.filter(q => q.t === 'mcq').every(q => q.o.length === 4 && new Set(q.o).size === 4 && q.a >= 0 && q.a < 4));
}
console.log((fail ? '✗' : '✓') + ' ' + pass + ' نجح، ' + fail + ' فشل');
if (fail) { console.log(fails.map(f => '  • ' + f).join('\n')); process.exit(1); }
