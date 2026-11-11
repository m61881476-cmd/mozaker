/* اختبارات سلامة منهج التسويق المدمج + محرك الرسومات + أوامر المذاكرة */
global.self = global;
const E = require('../js/engine.js');
const F = require('../js/figs.js');
['mkt', 'mkt-b', 'mkt-q1', 'mkt-q2', 'mkt-kb'].forEach(f => require('../js/content/' + f + '.js'));
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
t('أكمل: فيه فراغ وإجابة نصية', S.questions.filter(q => q.t === 'fill').every(q => /_{3,}/.test(q.q) && typeof q.a === 'string' && q.a.length));
t('أكمل: الإجابة نفسها بتتصحح صح', S.questions.filter(q => q.t === 'fill').every(q => E.grade({ type: 'fill', answer: q.a, accept: q.accept }, q.a).ok));
t('التفرعات على اختيارات غلط موجودة', S.questions.filter(q => q.on).every(q => q.t === 'mcq' && Object.keys(q.on).every(i => +i !== q.a && +i < q.o.length)));
t('95+ سؤال فيه تفرعات مكتوبة', S.questions.filter(q => q.on).length >= 95);
t('أنواع الأسئلة متنوعة', [['mcq', 100], ['tf', 25], ['fill', 12]].every(([k, n]) => S.questions.filter(q => q.t === k).length >= n));
t('الكلمات المفتاحية اتنقلت', S.questions.some(q => Array.isArray(q.kw) && q.kw.length));
// بطاقات
t('50+ بطاقة وكل بطاقة على درس', S.cards.length >= 50 && S.cards.every(c => c[0] && c[1] && chapters.includes(c[2])));
chapters.forEach(c => t('بطاقات على ' + c, S.cards.filter(x => x[2] === c).length >= 4));
// رسومات
const figIds = Object.keys(S.figs);
t('16 رسمة', figIds.length === 16);
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

console.log((fail ? '✗' : '✓') + ' ' + pass + ' نجح، ' + fail + ' فشل');
if (fail) { console.log(fails.map(f => '  • ' + f).join('\n')); process.exit(1); }
