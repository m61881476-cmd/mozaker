/* مذاكِر — المحرك: منطق صافي من غير واجهة (يشتغل في المتصفح وفي Node للاختبارات)
   - تطبيع العربي والأرقام
   - التكرار المتباعد (SRS)
   - فهم العامية المصرية (نوايا + مادة + أرقام + تواريخ)
   - تصحيح الإجابات (اختيار، صح/غلط، أكمل، قيود يومية)
   - محاسبة شركات الأشخاص: تكوين رأس المال + توزيع الأرباح والخسائر + الحسابات الجارية
   - إحصاء: مقاييس النزعة المركزية والتشتت والارتباط والانحدار (بالخطوات)
   - إدارة إنتاج: نظرية القرارات + خرائط الرقابة على الجودة
   - اقتصاد كلي: النموذج الكينزي البسيط والمضاعف + IS/LM
   - مخطط المذاكرة وتحليل نقط الضعف
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Engine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ================= أدوات عامة ================= */
  const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩', FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
  function toLatinDigits(s) {
    return String(s == null ? '' : s).replace(/[٠-٩۰-۹]/g, d => {
      let i = AR_DIGITS.indexOf(d); if (i < 0) i = FA_DIGITS.indexOf(d); return String(i);
    }).replace(/٫/g, '.').replace(/٬/g, ',');
  }
  /** تطبيع للبحث والمطابقة: يشيل التشكيل والتطويل ويوحّد الألف والياء والتاء المربوطة */
  function norm(s) {
    return toLatinDigits(s).toLowerCase()
      .replace(/[ً-ْٰـ]/g, '')
      .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[«»"'`“”‘’]/g, ' ')
      .replace(/[؟?!.,،؛;:()\[\]{}\-_/\\|+*=<>~^]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  const round = (x, d = 2) => { const p = Math.pow(10, d); return Math.round((x + Number.EPSILON) * p) / p; };
  const sum = a => a.reduce((s, x) => s + x, 0);
  const fmt = (x, d = 2) => {
    if (x == null || isNaN(x)) return '—';
    const r = round(x, d);
    return r.toLocaleString('en-US', { maximumFractionDigits: d });
  };
  function uid(p = '') { return p + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(arr, r = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  /** مسافة تعديل (Levenshtein) لمقارنة الإجابات المكتوبة */
  function lev(a, b) {
    if (a === b) return 0; if (!a.length) return b.length; if (!b.length) return a.length;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }
  /** يحوّل نص لرقم: يفهم الأرقام العربية والفواصل و«ألف/مليون» والكسور */
  function parseNumber(s) {
    if (typeof s === 'number') return s;
    let t = toLatinDigits(s).replace(/,/g, '').replace(/\s+/g, ' ').trim();
    if (!t) return NaN;
    let mult = 1;
    if (/مليون/.test(t)) mult = 1e6; else if (/(الف|ألف|آلاف|الاف)/.test(t)) mult = 1e3;
    const pct = /%/.test(t);
    const frac = t.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
    if (frac) return +frac[1] / +frac[2];
    const m = t.match(/-?\d+(?:\.\d+)?/);
    if (!m) { const w = WORD_NUM[norm(t)]; return w != null ? w * mult : NaN; }
    let v = parseFloat(m[0]) * mult; if (pct) v = v / 100; return v;
  }
  const WORD_NUM = { 'واحد': 1, 'واحده': 1, 'اتنين': 2, 'اثنين': 2, 'تلاته': 3, 'ثلاثه': 3, 'تلات': 3, 'اربعه': 4, 'اربع': 4, 'خمسه': 5, 'خمس': 5, 'سته': 6, 'ست': 6, 'سبعه': 7, 'سبع': 7, 'تمانيه': 8, 'ثمانيه': 8, 'تمن': 8, 'تسعه': 9, 'تسع': 9, 'عشره': 10, 'عشر': 10, 'حداشر': 11, 'اتناشر': 12, 'خمستاشر': 15, 'عشرين': 20, 'تلاتين': 30, 'ثلاثين': 30, 'اربعين': 40, 'خمسين': 50 };

  /* ================= التواريخ ================= */
  const DAY = 86400000;
  function ymd(d) { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
  function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function daysBetween(a, b) { return Math.round((startOfDay(b) - startOfDay(a)) / DAY); }
  function addDays(d, n) { const x = startOfDay(d); x.setDate(x.getDate() + n); return x; }
  const WEEKDAYS = [['الحد', 'الاحد', 'حد'], ['الاتنين', 'الاثنين', 'اتنين'], ['التلات', 'الثلاثاء', 'التلاتاء', 'تلات'], ['الاربع', 'الاربعاء', 'اربع'], ['الخميس', 'خميس'], ['الجمعه', 'جمعه'], ['السبت', 'سبت']];
  const WEEKDAY_NAMES = ['الأحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];
  const MONTHS = [['يناير'], ['فبراير'], ['مارس'], ['ابريل'], ['مايو'], ['يونيو'], ['يوليو'], ['اغسطس'], ['سبتمبر'], ['اكتوبر'], ['نوفمبر'], ['ديسمبر']];
  const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  function prettyDate(d, now = new Date()) {
    const x = new Date(d); const diff = daysBetween(now, x);
    const base = WEEKDAY_NAMES[x.getDay()] + ' ' + x.getDate() + ' ' + MONTH_NAMES[x.getMonth()];
    if (diff === 0) return 'النهارده (' + base + ')';
    if (diff === 1) return 'بكرة (' + base + ')';
    if (diff === 2) return 'بعد بكرة (' + base + ')';
    return base;
  }
  function inDaysText(n) {
    if (n === 0) return 'النهارده'; if (n === 1) return 'بكرة'; if (n === 2) return 'بعد بكرة';
    if (n < 0) return 'من ' + (-n) + ' يوم';
    if (n <= 10) return 'بعد ' + n + ' أيام'; return 'بعد ' + n + ' يوم';
  }
  /** يستخرج تاريخ من كلام عامي: النهارده/بكرة/بعد بكرة/يوم السبت/السبت الجاي/يوم 20/20-11/20 نوفمبر/بعد 3 أيام/الأسبوع الجاي */
  function parseDate(text, now = new Date()) {
    const t = ' ' + norm(text) + ' ';
    const today = startOfDay(now);
    if (/ (النهارده|النهاردة|اليوم|انهارده) /.test(t)) return { date: today, span: 'النهارده' };
    if (/ بعد بكره /.test(t)) return { date: addDays(today, 2), span: 'بعد بكرة' };
    if (/ (بكره|بكرا|غدا) /.test(t)) return { date: addDays(today, 1), span: 'بكرة' };
    let m = t.match(/ بعد (\d+|[^\s]+) (يوم|ايام|يومين) /);
    if (/ بعد يومين /.test(t)) return { date: addDays(today, 2), span: 'بعد يومين' };
    if (m) { const n = parseNumber(m[1]); if (!isNaN(n)) return { date: addDays(today, n), span: m[0].trim() }; }
    m = t.match(/ بعد (اسبوع|اسبوعين|\d+ اسابيع) /);
    if (m) { const n = m[1] === 'اسبوع' ? 7 : m[1] === 'اسبوعين' ? 14 : parseInt(m[1]) * 7; return { date: addDays(today, n), span: m[0].trim() }; }
    if (/ (الاسبوع|الاسبوع) (الجاي|القادم|اللي جاي) /.test(t)) return { date: addDays(today, 7), span: 'الأسبوع الجاي' };
    // تاريخ رقمي 20/11 أو 20-11-2026 (norm بيحوّل / و - لمسافات)
    m = t.match(/ (\d{1,2}) (\d{1,2})(?: (\d{2,4}))? /);
    if (m && +m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= 31) {
      let y = m[3] ? +m[3] : today.getFullYear(); if (y < 100) y += 2000;
      let d = new Date(y, +m[2] - 1, +m[1]);
      if (!m[3] && d < today) d = new Date(y + 1, +m[2] - 1, +m[1]);
      return { date: d, span: m[0].trim() };
    }
    // 20 نوفمبر
    for (let i = 0; i < 12; i++) for (const nm of MONTHS[i]) {
      const re = new RegExp(' (\\d{1,2}) (شهر )?' + nm + ' ');
      const mm = t.match(re);
      if (mm) { let d = new Date(today.getFullYear(), i, +mm[1]); if (d < today) d = new Date(today.getFullYear() + 1, i, +mm[1]); return { date: d, span: mm[0].trim() }; }
    }
    // يوم السبت / السبت الجاي
    for (let i = 0; i < 7; i++) for (const nm of WEEKDAYS[i]) {
      const re = new RegExp(' (يوم )?' + nm + '( الجاي| القادم| اللي جاي)? ');
      const mm = t.match(re);
      if (mm) {
        let diff = (i - today.getDay() + 7) % 7; if (diff === 0) diff = 7;
        if (mm[2] && diff < 7 && /الجاي|القادم|اللي جاي/.test(mm[2]) && diff <= 0) diff += 7;
        return { date: addDays(today, diff), span: mm[0].trim() };
      }
    }
    // يوم 20 (الشهر ده أو الجاي)
    m = t.match(/ (يوم|في|فى|يوم ال) (\d{1,2}) /);
    if (m && +m[2] >= 1 && +m[2] <= 31) {
      let d = new Date(today.getFullYear(), today.getMonth(), +m[2]);
      if (d < today) d = new Date(today.getFullYear(), today.getMonth() + 1, +m[2]);
      return { date: d, span: m[0].trim() };
    }
    return null;
  }
  /** يستخرج وقت: الساعة 1:15 / 2 الضهر / 7 بالليل */
  function parseTime(text) {
    const t = ' ' + toLatinDigits(text).replace(/[٫]/g, ':') + ' ';
    let m = t.match(/(?:الساعه|الساعة|ساعه|ساعة)\s*(\d{1,2})(?:[:.](\d{2}))?/) || t.match(/\s(\d{1,2}):(\d{2})\s/);
    if (!m) return null;
    let h = +m[1], mi = m[2] ? +m[2] : 0;
    const n = norm(text);
    if (/(الضهر|الظهر|العصر|بالليل|المغرب|مساء|م\b)/.test(n) && h < 12) h += 12;
    else if (!/(الصبح|صباحا|ص\b)/.test(n) && h >= 1 && h <= 7) h += 12; // 1–7 من غير توضيح = بعد الضهر (مواعيد الجامعة)
    if (h > 23 || mi > 59) return null;
    return String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0');
  }

  /* ================= التكرار المتباعد ================= */
  /** نسخة مبسطة من SM-2: grade 0=نسيت، 1=صعبة، 2=كويس، 3=سهلة. بترجع حالة جديدة */
  function srsNext(state, grade, now = Date.now()) {
    const s = Object.assign({ reps: 0, ivl: 0, ef: 2.5, lapses: 0, due: now, seen: 0 }, state || {});
    s.seen = (s.seen || 0) + 1; s.last = now;
    if (grade === 0) {
      s.reps = 0; s.lapses++; s.ef = Math.max(1.3, s.ef - 0.2); s.ivl = 0;
      s.due = now + 10 * 60 * 1000; // بعد 10 دقايق
      return s;
    }
    const q = [0, 3, 4, 5][grade];
    s.ef = Math.max(1.3, s.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    if (s.reps === 0) s.ivl = grade === 1 ? 0.5 : grade === 2 ? 1 : 3;
    else if (s.reps === 1) s.ivl = grade === 1 ? 2 : grade === 2 ? 3 : 6;
    else s.ivl = Math.max(1, s.ivl * (grade === 1 ? 1.2 : grade === 2 ? s.ef : s.ef * 1.3));
    s.ivl = round(Math.min(s.ivl, 180), 2);
    s.reps++;
    s.due = now + s.ivl * DAY;
    return s;
  }
  function srsLabel(state, grade) { const n = srsNext(state, grade, 0); const d = n.due / DAY; if (d < 0.02) return '10 د'; if (d < 1) return Math.round(d * 24) + ' س'; if (d < 30) return Math.round(d) + ' يوم'; return Math.round(d / 30) + ' شهر'; }
  function isDue(state, now = Date.now()) { return !state || state.due <= now; }
  function mastery(state) { if (!state || !state.seen) return 0; return Math.max(0, Math.min(1, (state.ivl || 0) / 21)); }

  /* ================= فهم العامية ================= */
  const SUBJECT_KEYS = {
    acc: ['محاسبه', 'محاسبة', 'شركات اشخاص', 'شركات الاشخاص', 'تضامن', 'توصيه', 'شركات', 'توزيع ارباح', 'توزيع الارباح', 'ارباح', 'جاري الشركاء', 'جاري', 'شريك', 'شركاء', 'راس المال', 'قيد', 'قيود', 'حسابات جاريه', 'شهره المحل', 'شهره', 'احتياطي راسمالي', 'مسحوبات', 'المسحوبات', 'صافي الاصول', 'اكونتنج', 'accounting'],
    stats: ['احصا', 'احصاء', 'الاحصاء', 'احصائي', 'وسط حسابي', 'الوسط', 'الوسيط', 'المنوال', 'انحراف', 'تشتت', 'ارتباط', 'انحدار', 'تكراري', 'ستات', 'statistics'],
    prod: ['انتاج', 'الانتاج', 'اداره انتاج', 'اداره الانتاج', 'جوده', 'الجوده', 'رقابه', 'خرائط', 'قرارات', 'نظريه القرارات', 'عمليات', 'production'],
    law: ['قانون', 'القانون', 'تجاري', 'قانون تجاري', 'التاجر', 'تاجر', 'الاعمال التجاريه', 'احتراف', 'سمسره', 'law'],
    mkt: ['تسويق', 'التسويق', 'ماركتنج', 'مارکتنج', 'سوق مستهدف', 'المزيج', 'marketing'],
    econ: ['اقتصاد', 'الاقتصاد', 'كلي', 'اقتصاد كلي', 'كينز', 'الكينزي', 'مضاعف', 'الدخل القومي', 'ناتج', 'is lm', 'is', 'lm', 'نقود', 'macro', 'ماكرو']
  };
  function detectSubject(text) {
    const t = ' ' + norm(text) + ' ';
    let best = null, bestLen = 0;
    for (const [k, words] of Object.entries(SUBJECT_KEYS)) for (const w of words) {
      const nw = norm(w);
      if (t.includes(' ' + nw + ' ') || (nw.length >= 4 && t.includes(nw))) { if (nw.length > bestLen) { best = k; bestLen = nw.length; } }
    }
    return best;
  }
  function extractCount(text) {
    const t = ' ' + norm(text) + ' ';
    let m = t.match(/ (\d{1,3}) (سؤال|اسئله|سوال|بطاقه|بطاقات|كارت|كروت|مسأله|مساله|مسائل|دقيقه|دقايق|دقائق)/);
    if (m) return +m[1];
    for (const [w, n] of Object.entries(WORD_NUM)) if (new RegExp(' ' + w + ' (سؤال|اسئله|سوال|بطاقات|كروت|مسائل|دقايق|دقيقه|دقائق)').test(t)) return n;
    m = t.match(/ (\d{1,3}) /); if (m) return +m[1];
    return null;
  }
  const INTENTS = [
    { id: 'help', re: /(تعمل ايه|بتعمل ايه|تقدر تعمل|ساعدني ازاي|المساعده|مساعده|هيلب|help|اوامر|ازاي استخدم)/ },
    { id: 'greet', re: /^(اهلا|هاي|هلا|السلام|سلام|صباح|مساء|ازيك|عامل ايه|هالو|hi|hello)( |$)/ },
    { id: 'thanks', re: /(شكرا|متشكر|تسلم|ميرسي|thanks|حبيبي|جدع)/ },
    { id: 'tired', re: /(تعبان|زهقت|زهقان|مش قادر|مضغوط|خايف|قلقان|متوتر|مليت|مش فاهم حاجه|يأست|يئست|عايز انام|نعسان)/ },
    { id: 'add_exam', re: /(امتحان|الامتحان|ميدتيرم|ميد ترم|فاينال|كويز|اختبار|سكشن|شفوي)[^]*?(يوم|بكره|بعد|النهارده|\d{1,2} \d{1,2}|السبت|الحد|الاحد|الاتنين|التلات|الاربع|الخميس|الجمعه|يناير|فبراير|مارس|ابريل|مايو|يونيو|يوليو|اغسطس|سبتمبر|اكتوبر|نوفمبر|ديسمبر)/ },
    { id: 'next_exam', re: /(امتحاني|امتحاناتي|الامتحانات|امتحان ايه|فاضل كام|امتي الامتحان|ميعاد الامتحان|الامتحان امتي|اقرب امتحان|عندي امتحان)/ },
    { id: 'weak', re: /(اضعف|ضعيف|ضعفي|نقط الضعف|نقاط الضعف|بغلط في ايه|غلطاتي|اخطائي|محتاج اركز علي|اركز علي ايه)/ },
    { id: 'progress', re: /(مستوايا|مستواي|تقدمي|انا عامل ايه في|احصائياتي|انجازي|انجزت|ذاكرت قد ايه|الاستريك|السلسله)/ },
    { id: 'plan', re: /(خطه|الخطه|جدول|اذاكر ايه|ابدا بايه|ابدأ بإيه|ابدء|اعمل ايه النهارده|المطلوب النهارده|نظملي|رتبلي)/ },
    { id: 'pomodoro', re: /(بومودورو|بومودور|تايمر|مؤقت|موقت|ركز معايا|جلسه تركيز|جلسة|عداد)/ },
    { id: 'break', re: /(استراحه|بريك|break|ارتاح)/ },
    { id: 'note', re: /^(سجل|اكتب|دون|فكرني|ملاحظه|نوت)/ },
    { id: 'add_card', re: /(ضيف|اضف|زود) (بطاقه|كارت|سؤال)/ },
    { id: 'quiz', re: /(امتحني|امتحنى|اختبرني|اسالني|اسألني|سؤال|اسئله|كويز|quiz|امتحان تجريبي|امتحان سريع|جربني|اختبار)/ },
    { id: 'review', re: /(راجع|مراجعه|اراجع|راجعلي|بطاقات|فلاش|كروت|احفظ|تسميع|سمعلي|ريفيو)/ },
    { id: 'practice', re: /(تمرين|تمارين|مساله|مسائل|(^| )(حل|احل|نحل|حللي)( |$)|(^| )عملي( |$)|اتمرن|(^| )قيود( |$)|(^| )قيد( |$))/ },
    { id: 'calc', re: /(احسب|احسبلي|حاسبه|اوجد|وزع|وزعلي|الوسط الحسابي ل|الوسيط ل|المنوال ل|الانحراف ل)/ },
    { id: 'summary', re: /(لخص|ملخص|ملخصات|اشرح|اشرحلي|فهمني|يعني ايه|ما هو|ما هي|ايه هو|ايه هي|ايه الفرق|الفرق بين|تعريف|عرف)/ },
    { id: 'open', re: /^(افتح|وديني|روح|خش علي)/ }
  ];
  /** يحلل جملة عامية ويرجع {intent, subject, count, date, time, query, minutes} */
  function parseIntent(text, now = new Date()) {
    const raw = String(text || '').trim();
    const t = norm(raw);
    const out = { intent: 'unknown', subject: detectSubject(raw), raw, text: t };
    if (!t) return out;
    // ترتيب الأولويات: إضافة امتحان بتاريخ قبل الاختبار العادي
    const hasExamWord = /(امتحان|ميدتيرم|ميد ترم|فاينال|كويز|اختبار|شفوي)/.test(t);
    const d = parseDate(raw, now);
    if (hasExamWord && d && !/(امتحني|اختبرني|اسالني|امتحان تجريبي|امتحان سريع)/.test(t)) {
      out.intent = 'add_exam'; out.date = d.date; out.dateSpan = d.span; out.time = parseTime(raw);
      out.kind = /(ميدتيرم|ميد ترم|نص الترم)/.test(t) ? 'ميدتيرم' : /(فاينال|اخر الترم|نهايه)/.test(t) ? 'فاينال' : /(كويز)/.test(t) ? 'كويز' : /(شفوي)/.test(t) ? 'شفوي' : /(سكشن)/.test(t) ? 'سكشن' : 'امتحان';
      return out;
    }
    for (const it of INTENTS) {
      if (it.id === 'add_exam') continue;
      if (it.re.test(t)) { out.intent = it.id; break; }
    }
    if (out.intent === 'unknown' && out.subject) out.intent = 'open_subject';
    if (['quiz', 'review', 'practice', 'pomodoro', 'break'].includes(out.intent)) {
      const c = extractCount(raw); if (c) { if (out.intent === 'pomodoro' || out.intent === 'break') out.minutes = c; else out.count = c; }
    }
    if (out.intent === 'pomodoro' && /دقيق|دقايق|دقائق/.test(t)) { const c = extractCount(raw); if (c) out.minutes = c; }
    if (out.intent === 'summary' || out.intent === 'unknown' || out.intent === 'open_subject') {
      out.query = t.replace(/^(لخصلي|لخص|ملخص|اشرحلي|اشرح|فهمني|عرف|تعريف|يعني ايه|ما هو|ما هي|ايه هو|ايه هي)\s*/, '').replace(/\s*(يعني ايه|ايه)$/, '').trim();
    }
    if (out.intent === 'calc') out.numbers = (toLatinDigits(raw).match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    if (out.intent === 'note') out.body = raw.replace(/^\s*(سجل|سجّل|اكتب|دوّن|دون|فكرني|ملاحظة|ملاحظه|نوت)\s*(ملاحظه|ملاحظة)?\s*[:：]?\s*/, '');
    if (out.intent === 'add_card') {
      const m = raw.split(/[:：]/).slice(1).join(':');
      const parts = m.split(/\s*(?:=|←|->|الاجابه|الإجابة|الجواب)\s*/);
      if (parts.length >= 2) { out.front = parts[0].trim(); out.back = parts.slice(1).join(' ').trim(); }
    }
    return out;
  }

  /* ================= البحث في المحتوى ================= */
  function tokenize(s) { return norm(s).split(' ').filter(w => w.length > 1 && !STOP.has(w)); }
  const STOP = new Set(['في', 'من', 'علي', 'الي', 'عن', 'ما', 'هو', 'هي', 'ايه', 'يعني', 'و', 'او', 'ثم', 'ان', 'لا', 'مع', 'هل', 'ده', 'دي', 'دا', 'اللي', 'التي', 'الذي', 'كل', 'بين', 'لل', 'بس', 'عايز', 'عاوز', 'لو', 'انا', 'لي', 'ليا', 'بتاع', 'بتاعه']);
  function stem(w) { return w.replace(/^(وال|بال|كال|فال|لل|ال)/, '').replace(/(ات|ون|ين|ه|ها|هم)$/, ''); }
  /** بحث مرتب: docs = [{id, title, text, ...}] */
  function search(docs, query, limit = 8) {
    const q = tokenize(query).map(stem).filter(Boolean);
    if (!q.length) return [];
    const res = [];
    for (const d of docs) {
      const title = norm(d.title || ''), body = norm(d.text || '');
      let score = 0;
      for (const w of q) {
        if (!w) continue;
        if (title.includes(w)) score += 6;
        const c = body.split(w).length - 1; if (c) score += Math.min(c, 5) * 1.2;
      }
      const phrase = norm(query); if (phrase.length > 3 && (title + ' ' + body).includes(phrase)) score += 8;
      if (score > 0) res.push({ doc: d, score });
    }
    return res.sort((a, b) => b.score - a.score).slice(0, limit);
  }
  function snippet(text, query, len = 140) {
    const t = String(text || ''); const n = norm(t); const q = tokenize(query).map(stem).filter(Boolean);
    let at = -1; for (const w of q) { at = n.indexOf(w); if (at >= 0) break; }
    if (at < 0) return t.slice(0, len) + (t.length > len ? '…' : '');
    const s = Math.max(0, at - 50); return (s > 0 ? '…' : '') + t.slice(s, s + len) + (s + len < t.length ? '…' : '');
  }

  /* ================= التصحيح ================= */
  function gradeChoice(q, answer) { return { ok: +answer === +q.answer }; }
  function gradeTF(q, answer) { return { ok: !!answer === !!q.answer }; }
  /** «أكمل»: يقبل أي صيغة من الإجابات المقبولة مع سماحية أخطاء إملائية بسيطة، ويقبل الأرقام بفاصلة */
  function gradeFill(q, answer) {
    const accepted = [].concat(q.answer, q.accept || []);
    const a = norm(answer);
    if (!a) return { ok: false };
    for (const acc of accepted) {
      const n = norm(acc);
      const na = parseNumber(answer), nn = parseNumber(acc);
      if (!isNaN(nn) && /\d/.test(String(acc)) && !isNaN(na)) { if (Math.abs(na - nn) <= Math.max(0.011, Math.abs(nn) * 0.001)) return { ok: true }; continue; }
      if (a === n) return { ok: true };
      const sa = a.replace(/(^| )ال/g, '$1'), sn = n.replace(/(^| )ال/g, '$1');
      if (sa === sn) return { ok: true };
      const tol = n.length <= 4 ? 0 : n.length <= 8 ? 1 : 2;
      if (lev(sa, sn) <= tol) return { ok: true, close: true };
      if (n.length >= 6 && (sa.includes(sn) || (sa.length >= 5 && sn.includes(sa)))) return { ok: true, close: true };
    }
    return { ok: false };
  }
  function gradeNumber(expected, answer, tol) {
    const v = parseNumber(answer);
    if (isNaN(v)) return { ok: false, empty: !String(answer || '').trim() };
    const t = tol != null ? tol : Math.max(0.011, Math.abs(expected) * 0.005);
    return { ok: Math.abs(v - expected) <= t, value: v };
  }
  function grade(q, answer) {
    if (q.type === 'mcq') return gradeChoice(q, answer);
    if (q.type === 'tf') return gradeTF(q, answer);
    if (q.type === 'fill') return gradeFill(q, answer);
    if (q.type === 'num') return gradeNumber(q.answer, answer, q.tol);
    return { ok: false };
  }
  /** تصحيح قيود يومية: expected/given = [{lines:[{acc, dr, cr}]}]. بيقارن صافي كل حساب (عشان القيد المركب = القيود المنفصلة) */
  function netByAccount(entries) {
    const m = {};
    for (const e of entries || []) for (const l of e.lines || []) {
      const k = accKey(l.acc); if (!k) continue;
      m[k] = (m[k] || 0) + (+l.dr || 0) - (+l.cr || 0);
    }
    for (const k of Object.keys(m)) if (Math.abs(m[k]) < 0.005) delete m[k];
    return m;
  }
  function accKey(name) {
    return norm(name).replace(/^(من|الي)\s+/, '').replace(/^ح\s+/, '').replace(/^حساب\s+/, '')
      .replace(/(^| )(ال)/g, '$1').replace(/ه$/, '').replace(/\s+/g, ' ').trim();
  }
  function entryBalanced(e) { let d = 0, c = 0; for (const l of e.lines || []) { d += +l.dr || 0; c += +l.cr || 0; } return Math.abs(d - c) < 0.005 && d > 0; }
  function gradeJournal(expected, given) {
    const E = netByAccount(expected), G = netByAccount(given);
    const issues = [];
    const unbalanced = (given || []).filter(e => (e.lines || []).length && !entryBalanced(e)).length;
    if (unbalanced) issues.push({ kind: 'unbalanced', msg: 'فيه ' + unbalanced + ' قيد مش متوازن (المدين لازم يساوي الدائن)' });
    const keys = new Set([...Object.keys(E), ...Object.keys(G)]);
    let right = 0;
    for (const k of keys) {
      const e = E[k] || 0, g = G[k] || 0;
      if (Math.abs(e - g) < 0.5) { right++; continue; }
      if (!E[k]) issues.push({ kind: 'extra', acc: k, msg: 'الحساب «' + k + '» مالوش لازمة هنا' });
      else if (!G[k]) issues.push({ kind: 'missing', acc: k, msg: 'ناقص حساب «' + k + '» (' + (e > 0 ? 'مدين' : 'دائن') + ' ' + fmt(Math.abs(e)) + ')' });
      else if (Math.sign(e) !== Math.sign(g)) issues.push({ kind: 'side', acc: k, msg: '«' + k + '» المفروض يبقى ' + (e > 0 ? 'مدين' : 'دائن') });
      else issues.push({ kind: 'amount', acc: k, msg: 'مبلغ «' + k + '» المفروض ' + fmt(Math.abs(e)) + ' مش ' + fmt(Math.abs(g)) });
    }
    const total = keys.size || 1;
    return { ok: !issues.length, score: round(right / total, 2), issues };
  }

  /* ================= محاسبة شركات الأشخاص ================= */
  /**
   * توزيع الأرباح والخسائر في شركة تضامن.
   * p = {
   *   netProfit,                         // صافي الربح (أو خسارة بالسالب) من ح/ الأرباح والخسائر
   *   partners: [{ name, capital, ratio, opening (+دائن/−مدين), salaryMonthly, salaryPaid,
   *                drawings: [{amount, month}] أو monthlyDrawing + timing('end'|'start'|'mid'),
   *                loanInterest (فائدة قرض الشريك المستحقة — بتتقيد في الجاري، مش في التوزيع) }],
   *   rates: { capital, drawings, current },   // نسب سنوية (0.06 = 6%)
   *   bonus: { partner (index), rate, base: 'net' | 'afterCapInt' },
   *   currentInterestOn: 'opening'
   * }
   */
  function distributeProfit(p) {
    const P = p.partners.map(x => Object.assign({ capital: 0, opening: 0, salaryMonthly: 0, salaryPaid: 0, drawings: [], loanInterest: 0 }, x));
    const r = Object.assign({ capital: 0, drawings: 0, current: 0 }, p.rates || {});
    const steps = [];
    const debit = [], credit = []; // جانبي ح/ توزيع الأرباح والخسائر
    const net = +p.netProfit || 0;
    if (net >= 0) credit.push({ label: 'من ح/ الأرباح والخسائر (صافي الربح)', amount: net, kind: 'net' });
    else debit.push({ label: 'إلى ح/ الأرباح والخسائر (صافي الخسارة)', amount: -net, kind: 'net' });

    // 1) فائدة رأس المال
    const capInt = P.map(x => round(x.capital * r.capital));
    if (r.capital) {
      steps.push({ t: 'فائدة رأس المال = رأس المال × المعدل', rows: P.map((x, i) => x.name + ': ' + fmt(x.capital) + ' × ' + fmt(r.capital * 100) + '% = ' + fmt(capInt[i])) });
      debit.push({ label: 'إلى ح/ فائدة رأس المال', amount: sum(capInt), parts: capInt, kind: 'capInt' });
    }
    // 2) فائدة المسحوبات
    const drawTotal = [], drawInt = [];
    P.forEach((x, i) => {
      let tot = 0, intr = 0; const rows = [];
      if (x.monthlyDrawing) {
        const m = x.monthlyDrawing, months = x.drawMonths || 12;
        tot = m * months;
        const avg = x.timing === 'start' ? (months + 1) / 2 : x.timing === 'mid' ? months / 2 : (months - 1) / 2; // متوسط مدة الاستحقاق بالشهور
        intr = round(tot * r.drawings * avg / 12);
        rows.push(fmt(tot) + ' × ' + fmt(r.drawings * 100) + '% × ' + fmt(avg, 2) + '/12 = ' + fmt(intr));
      }
      for (const d of x.drawings || []) {
        // d.months صريحة، أو d.day=1 (سحب أول الشهر → 13 − الشهر)، أو آخر الشهر (متوسط تاريخ السحب → 12 − الشهر)
        const months = d.months != null ? +d.months : (+d.day === 1 ? 13 - (+d.month || 0) : 12 - (+d.month || 0));
        const v = round(d.amount * r.drawings * months / 12);
        tot += d.amount; intr += v;
        rows.push(fmt(d.amount) + ' × ' + fmt(r.drawings * 100) + '% × ' + months + '/12 = ' + fmt(v));
      }
      drawTotal[i] = tot; drawInt[i] = round(intr);
      x._drawRows = rows;
    });
    if (r.drawings && sum(drawInt)) {
      steps.push({ t: 'فائدة المسحوبات = المسحوبات × المعدل × المدة من تاريخ السحب لآخر السنة', rows: P.map((x, i) => x.name + ': ' + (x._drawRows.join(' + ') || '0') + (x._drawRows.length > 1 ? ' → ' + fmt(drawInt[i]) : '')) });
      credit.push({ label: 'من ح/ فائدة المسحوبات', amount: sum(drawInt), parts: drawInt, kind: 'drawInt' });
    }
    // 3) فائدة الحسابات الجارية (أرصدة أول المدة)
    const curCr = P.map(x => x.opening > 0 ? round(x.opening * r.current) : 0);
    const curDr = P.map(x => x.opening < 0 ? round(-x.opening * r.current) : 0);
    if (r.current && (sum(curCr) || sum(curDr))) {
      steps.push({ t: 'فائدة الجاري = رصيد أول المدة × المعدل (الدائن للشريك، المدين عليه)', rows: P.map((x, i) => x.name + ' (' + (x.opening >= 0 ? 'دائن' : 'مدين') + '): ' + fmt(Math.abs(x.opening)) + ' × ' + fmt(r.current * 100) + '% = ' + fmt(curCr[i] || curDr[i])) });
      if (sum(curCr)) debit.push({ label: 'إلى ح/ فائدة الأرصدة الجارية الدائنة', amount: sum(curCr), parts: curCr, kind: 'curCr' });
      if (sum(curDr)) credit.push({ label: 'من ح/ فائدة الأرصدة الجارية المدينة', amount: sum(curDr), parts: curDr, kind: 'curDr' });
    }
    // 4) المرتبات
    const salary = P.map(x => round((x.salaryMonthly || 0) * 12));
    if (sum(salary)) {
      steps.push({ t: 'مرتب الشريك السنوي = الشهري × 12 (اللي ماقبضوش يتقيد في جاريه)', rows: [].concat(...P.filter((x, i) => salary[i]).map(x => [x.name + ': ' + fmt(x.salaryMonthly) + ' × 12 = ' + fmt(x.salaryMonthly * 12), 'المستحق لـ ' + x.name + ' (السنوي − اللي قبضه): ' + fmt(x.salaryMonthly * 12) + ' − ' + fmt(x.salaryPaid) + ' = ' + fmt(x.salaryMonthly * 12 - x.salaryPaid)])) });
      debit.push({ label: 'إلى ح/ مرتبات الشركاء', amount: sum(salary), parts: salary, kind: 'salary' });
    }
    // 5) المكافأة
    const bonus = P.map(() => 0);
    if (p.bonus && p.bonus.rate) {
      const base = p.bonus.base === 'afterCapInt' ? net - sum(capInt) : p.bonus.base === 'afterAll' ? (sum(credit.map(c => c.amount)) - sum(debit.map(d => d.amount))) : net;
      const b = round(Math.max(0, base) * p.bonus.rate);
      bonus[p.bonus.partner] = b;
      steps.push({ t: 'المكافأة = ' + fmt(p.bonus.rate * 100) + '% × ' + (p.bonus.base === 'afterCapInt' ? '(صافي الربح − فوائد رأس المال)' : p.bonus.base === 'afterAll' ? '(الربح بعد الفوائد والمرتبات)' : 'صافي الربح'), rows: [P[p.bonus.partner].name + ': ' + fmt(p.bonus.rate * 100) + '% × ' + fmt(base) + ' = ' + fmt(b)] });
      debit.push({ label: 'إلى ح/ مكافأة الشريك ' + P[p.bonus.partner].name, amount: b, parts: bonus, kind: 'bonus' });
    }
    // 6) الباقي
    const crSum = sum(credit.map(c => c.amount)), drSum = sum(debit.map(d => d.amount));
    const remain = round(crSum - drSum);
    const ratios = P.map(x => +x.ratio || 1), rs = sum(ratios);
    const shares = ratios.map(q => round(remain * q / rs));
    const diff = round(remain - sum(shares)); if (diff) shares[0] = round(shares[0] + diff);
    steps.push({ t: (remain >= 0 ? 'الربح الباقي' : 'الخسارة الباقية') + ' = جملة الدائن − جملة المدين = ' + fmt(crSum) + ' − ' + fmt(drSum) + ' = ' + fmt(remain) + ' ويتوزع بنسبة ' + ratios.join(':'), rows: P.map((x, i) => x.name + ': ' + fmt(remain) + ' × ' + ratios[i] + '/' + rs + ' = ' + fmt(shares[i])) });
    if (remain >= 0) debit.push({ label: 'إلى مذكورين ح/ جاري الشركاء (نصيبهم في الربح)', amount: remain, parts: shares, kind: 'share' });
    else credit.push({ label: 'من مذكورين ح/ جاري الشركاء (نصيبهم في الخسارة)', amount: -remain, parts: shares.map(s => -s), kind: 'share' });
    const total = round(Math.max(sum(debit.map(d => d.amount)), sum(credit.map(c => c.amount))));

    // الحسابات الجارية
    const current = P.map((x, i) => {
      const dr = [], cr = [];
      if (x.opening < 0) dr.push({ label: 'رصيد أول المدة (مدين)', amount: -x.opening });
      if (x.opening > 0) cr.push({ label: 'رصيد أول المدة (دائن)', amount: x.opening });
      if (drawTotal[i]) dr.push({ label: 'إلى ح/ المسحوبات', amount: drawTotal[i] });
      if (drawInt[i]) dr.push({ label: 'إلى ح/ فائدة المسحوبات', amount: drawInt[i] });
      if (curDr[i]) dr.push({ label: 'إلى ح/ فائدة الرصيد الجاري المدين', amount: curDr[i] });
      if (capInt[i]) cr.push({ label: 'من ح/ فائدة رأس المال', amount: capInt[i] });
      if (curCr[i]) cr.push({ label: 'من ح/ فائدة الرصيد الجاري الدائن', amount: curCr[i] });
      const salDue = round(salary[i] - (x.salaryPaid || 0));
      if (salDue > 0) cr.push({ label: 'من ح/ مرتب الشريك (المستحق)', amount: salDue });
      if (salDue < 0) dr.push({ label: 'إلى ح/ مرتب الشريك (المسحوب زيادة)', amount: -salDue });
      if (bonus[i]) cr.push({ label: 'من ح/ المكافأة', amount: bonus[i] });
      if (x.loanInterest) cr.push({ label: 'من ح/ فائدة قرض الشريك المستحقة', amount: x.loanInterest });
      if (shares[i] > 0) cr.push({ label: 'من ح/ توزيع الأرباح والخسائر', amount: shares[i] });
      if (shares[i] < 0) dr.push({ label: 'إلى ح/ توزيع الأرباح والخسائر', amount: -shares[i] });
      const bal = round(sum(cr.map(c => c.amount)) - sum(dr.map(d => d.amount)));
      return { name: x.name, dr, cr, balance: bal, side: bal >= 0 ? 'دائن' : 'مدين' };
    });
    return { debit, credit, total, remain, shares, capInt, drawInt, drawTotal, curCr, curDr, salary, bonus, current, steps };
  }

  /** تكوين رأس المال: يرجع القيود المطلوبة لسداد الحصص */
  function capitalFormation(p) {
    // p = { total, ratio:[..], partners:[{name, method:'cash'|'bank'|'kind'|'business', assets:[{acc, value}], liabilities:[{acc, value}], settle:'cash'|'bank'}] }
    const rs = sum(p.ratio), entries = [], shares = p.ratio.map(q => round(p.total * q / rs));
    p.partners.forEach((x, i) => {
      const cap = 'رأس مال الشريك ' + x.name;
      if (x.method === 'cash') entries.push({ memo: 'سداد ' + x.name + ' حصته نقدًا', lines: [{ acc: 'النقدية بالصندوق', dr: shares[i] }, { acc: cap, cr: shares[i] }] });
      else if (x.method === 'bank') entries.push({ memo: 'سداد ' + x.name + ' حصته بشيك أودع البنك', lines: [{ acc: 'النقدية بالبنك', dr: shares[i] }, { acc: cap, cr: shares[i] }] });
      else {
        const A = x.assets || [], L = x.liabilities || [];
        const netAssets = round(sum(A.map(a => a.value)) - sum(L.map(l => l.value)));
        const lines = A.map(a => ({ acc: a.acc, dr: a.value })).concat(L.map(l => ({ acc: l.acc, cr: l.value })));
        lines.push({ acc: cap, cr: netAssets });
        entries.push({ memo: 'سداد ' + x.name + ' حصته ' + (L.length ? 'بأصول وخصوم منشأته' : 'عينًا'), lines });
        const gap = round(shares[i] - netAssets), via = x.settle === 'bank' ? 'النقدية بالبنك' : 'النقدية بالصندوق';
        if (gap > 0) entries.push({ memo: 'سداد ' + x.name + ' باقي حصته', lines: [{ acc: via, dr: gap }, { acc: cap, cr: gap }] });
        if (gap < 0) entries.push({ memo: 'سحب ' + x.name + ' الزيادة', lines: [{ acc: cap, dr: -gap }, { acc: via, cr: -gap }] });
      }
    });
    return { shares, entries };
  }


  /** مولّد تمرين تكوين رأس مال: شريك نقدي + شريك بشيك + شريك بأصول وخصوم منشأته (بقيمتها الدفترية بدون نص تسوية، أو بنص تسوية نقدًا) */
  function genCapital(seed) {
    const R = rng(seed || Date.now()), pick = a => a[Math.floor(R() * a.length)];
    const names = pick([['أحمد', 'خالد', 'منى'], ['محمد', 'محمود', 'حميدة'], ['عمر', 'هشام', 'سلمى'], ['كريم', 'ياسر', 'نورا']]);
    const ratio = pick([[3, 2, 1], [2, 2, 1], [1, 1, 1], [4, 3, 1], [2, 1, 1]]);
    const unit = pick([10000, 20000, 40000]);
    const total = unit * sum(ratio);
    const share3 = unit * ratio[2];
    const mode = pick(['goodwill', 'reserve', 'settle', 'equal']);
    // نبني أصول وخصوم منشأة الشريك التالت
    const liab = [{ acc: 'الدائنون', value: pick([4000, 5000, 6000, 8000]) }, { acc: 'أوراق الدفع', value: pick([2000, 3000, 4000]) }];
    const L = sum(liab.map(x => x.value));
    const gap = mode === 'equal' ? 0 : pick([2000, 4000, 6000]) * (mode === 'reserve' ? 1 : -1) * (mode === 'settle' ? (R() < 0.5 ? 1 : -1) : 1);
    const netA = share3 + gap; // صافي الأصول المطلوب
    const A = netA + L;
    const furn = Math.round(A * 0.3 / 1000) * 1000, cash = Math.round(A * 0.15 / 1000) * 1000, goods = Math.round(A * 0.3 / 1000) * 1000;
    const debtors = A - furn - cash - goods;
    const assets = [{ acc: 'الأثاث', value: furn }, { acc: 'النقدية بالصندوق', value: cash }, { acc: 'البضاعة', value: goods }, { acc: 'المدينون', value: debtors }];
    const settle = mode === 'settle';
    const res = capitalFormation({ total, ratio, partners: [{ name: names[0], method: 'cash' }, { name: names[1], method: 'bank' }, { name: names[2], method: 'business', assets, liabilities: liab, settle: settle ? 'cash' : null }] });
    // من غير نص تسوية: نشيل قيد السداد/السحب ونحط شهرة أو احتياطي
    if (!settle && gap) {
      res.entries = res.entries.filter(e => !/باقي حصته|الزيادة/.test(e.memo));
      const cap = 'رأس مال الشريك ' + names[2];
      if (gap < 0) res.entries.push({ memo: 'إثبات الفرق شهرة محل لاستكمال حصة ' + names[2], lines: [{ acc: 'شهرة المحل', dr: -gap }, { acc: cap, cr: -gap }] });
      else res.entries.push({ memo: 'تخفيض رأس مال ' + names[2] + ' لحصته وإثبات الزيادة احتياطي رأسمالي', lines: [{ acc: cap, dr: gap }, { acc: 'احتياطي رأسمالي', cr: gap }] });
    }
    const text = [
      'اتفق ' + names.join(' و') + ' على تكوين شركة تضامن برأس مال ' + fmt(total) + ' جنيه بنسبة ' + ratio.join(':') + '.',
      'يسدد ' + names[0] + ' حصته نقدًا بخزينة الشركة، ويسدد ' + names[1] + ' حصته بشيك أودع البنك باسم الشركة، ويقدم ' + names[2] + ' أصول وخصوم منشأته الفردية:',
      'الأصول: ' + assets.map(a => a.acc + ' ' + fmt(a.value)).join('، ') + '.',
      'الخصوم: ' + liab.map(a => a.acc + ' ' + fmt(a.value)).join('، ') + '.',
      settle ? 'وتم الاتفاق على قبول القائمة بقيمتها الدفترية على أن يسوي ' + names[2] + ' الفرق نقدًا.' : 'وتم قبول القائمة بقيمتها الدفترية ولا يوجد نص في العقد على تسوية الفرق.'
    ];
    const accounts = ['النقدية بالصندوق', 'النقدية بالبنك', 'الأثاث', 'البضاعة', 'المدينون', 'الدائنون', 'أوراق الدفع', 'شهرة المحل', 'احتياطي رأسمالي', 'أوراق القبض', 'المسحوبات'].concat(names.map(n => 'رأس مال الشريك ' + n));
    return { text, entries: res.entries, shares: res.shares, netAssets: netA, accounts, mode, names };
  }

  /** مولّد تمارين توزيع أرباح بأرقام نضيفة (seed ثابت = نفس التمرين) */
  const NAMES = [['أحمد', 'خالد'], ['محمد', 'محمود'], ['عمر', 'هشام'], ['ياسر', 'كريم'], ['سارة', 'منى'], ['مصطفى', 'إبراهيم'], ['أ', 'ب']];
  function genDistribution(seed) {
    const R = rng(seed || Date.now());
    const pick = a => a[Math.floor(R() * a.length)];
    const names = pick(NAMES).slice();
    const ratio = pick([[1, 1], [2, 1], [3, 2], [1, 2], [3, 1]]);
    const total = pick([60000, 90000, 120000, 150000, 180000, 240000]);
    const capRatio = pick([ratio, [1, 1], [2, 1]]);
    const caps = capRatio.map(q => round(total * q / sum(capRatio)));
    const rates = { capital: pick([0.05, 0.06, 0.08, 0.1]), drawings: pick([0.04, 0.05, 0.06, 0.1]), current: pick([0, 0.05, 0.05, 0.06]) };
    const netProfit = pick([16000, 24000, 30000, 36000, 40000, 48000, 60000]);
    const partners = names.map((n, i) => ({ name: n, capital: caps[i], ratio: ratio[i], opening: 0, drawings: [], salaryMonthly: 0, salaryPaid: 0 }));
    partners[0].drawings.push({ amount: pick([1200, 2000, 2400, 3000]), month: pick([3, 6, 9]) });
    partners[1].drawings.push({ amount: pick([1200, 1800, 2400, 3600]), month: pick([3, 4, 6, 9]) });
    if (rates.current) { partners[0].opening = pick([1000, -1000, 2000, -600]); partners[1].opening = pick([600, -400, 1500, 800]); }
    const sal = R() < 0.6; if (sal) { const k = R() < 0.5 ? 0 : 1; partners[k].salaryMonthly = pick([100, 150, 200, 250]); partners[k].salaryPaid = partners[k].salaryMonthly * pick([8, 9, 10, 12]); }
    const bonus = R() < 0.45 ? { partner: sal ? 1 - partners.findIndex(x => x.salaryMonthly) : 0, rate: pick([0.05, 0.1]), base: pick(['net', 'afterCapInt']) } : null;
    const p = { netProfit, partners, rates, bonus };
    return { params: p, solution: distributeProfit(p), text: describeDistribution(p) };
  }
  function describeDistribution(p) {
    const P = p.partners, pct = x => fmt(x * 100) + '%';
    const L = [];
    L.push(P.map(x => x.name).join(' و') + ' شركاء في شركة تضامن، رأس مالها ' + fmt(sum(P.map(x => x.capital))) + ' جنيه (' + P.map(x => x.name + ' ' + fmt(x.capital)).join('، ') + ')، والأرباح والخسائر بينهم بنسبة ' + P.map(x => x.ratio).join(':') + '.');
    const terms = [];
    if (p.rates.capital) terms.push('فائدة على رأس المال ' + pct(p.rates.capital) + ' سنويًا');
    if (p.rates.drawings) terms.push('فائدة على المسحوبات ' + pct(p.rates.drawings) + ' سنويًا');
    if (p.rates.current) terms.push('فائدة على أرصدة الحسابات الجارية أول المدة ' + pct(p.rates.current));
    P.forEach(x => { if (x.salaryMonthly) terms.push('مرتب للشريك ' + x.name + ' ' + fmt(x.salaryMonthly) + ' جنيه شهريًا نظير الإدارة'); });
    if (p.bonus) terms.push('مكافأة للشريك ' + P[p.bonus.partner].name + ' ' + pct(p.bonus.rate) + ' من صافي الربح' + (p.bonus.base === 'afterCapInt' ? ' بعد خصم فوائد رأس المال' : ''));
    L.push('وينص العقد على: ' + terms.join('، ') + '.');
    L.push('صافي الربح عن السنة المنتهية في 31/12 = ' + fmt(p.netProfit) + ' جنيه.');
    const dr = P.map(x => x.drawings.map(d => x.name + ' سحب ' + fmt(d.amount) + ' (متوسط تاريخ السحب ' + monthEnd(d.month) + ')').join('، ')).filter(Boolean);
    if (dr.length) L.push('المسحوبات: ' + dr.join('؛ ') + '.');
    const op = P.filter(x => x.opening).map(x => x.name + ' ' + fmt(Math.abs(x.opening)) + (x.opening > 0 ? ' دائن' : ' مدين'));
    if (op.length) L.push('أرصدة الجاري أول المدة: ' + op.join('، ') + '.');
    P.forEach(x => { if (x.salaryMonthly) L.push('رصيد ح/ مرتب الشريك ' + x.name + ' في ميزان المراجعة ' + fmt(x.salaryPaid) + ' جنيه.'); });
    return L;
  }
  function monthEnd(m) { const d = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][(m - 1 + 12) % 12]; return d + '/' + m; }

  /* ================= الإحصاء ================= */
  function parseList(s) { return (toLatinDigits(s).match(/-?\d+(?:\.\d+)?/g) || []).map(Number); }
  function mean(a) { return a.length ? sum(a) / a.length : NaN; }
  function median(a) { if (!a.length) return NaN; const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }
  function modes(a) { const c = {}; let mx = 0; for (const x of a) { c[x] = (c[x] || 0) + 1; mx = Math.max(mx, c[x]); } if (mx <= 1) return []; return Object.keys(c).filter(k => c[k] === mx).map(Number).sort((x, y) => x - y); }
  function variance(a, sample = false) { const m = mean(a); return sum(a.map(x => (x - m) ** 2)) / (a.length - (sample ? 1 : 0)); }
  function sd(a, sample = false) { return Math.sqrt(variance(a, sample)); }
  function geoMean(a) { return a.some(x => x <= 0) ? NaN : Math.exp(mean(a.map(Math.log))); }
  function harMean(a) { return a.some(x => x === 0) ? NaN : a.length / sum(a.map(x => 1 / x)); }
  function quantile(a, q) { const s = a.slice().sort((x, y) => x - y); const pos = (s.length + 1) * q; const lo = Math.floor(pos), hi = Math.ceil(pos); if (lo < 1) return s[0]; if (hi > s.length) return s[s.length - 1]; return s[lo - 1] + (pos - lo) * (s[hi - 1] - s[lo - 1]); }
  /** وصف كامل لبيانات غير مبوبة بالخطوات (التباين بطريقتين: المجتمع ÷ن والعينة ÷(ن−1) زي المحاضرة) */
  function describeRaw(a) {
    const n = a.length, s = a.slice().sort((x, y) => x - y), m = mean(a), md = median(a), mo = modes(a);
    const ss = sum(a.map(x => (x - m) ** 2)), vP = ss / n, vS = n > 1 ? ss / (n - 1) : NaN;
    const sdP = Math.sqrt(vP), sdS = Math.sqrt(vS);
    const q1p = (n + 1) / 4, q3p = 3 * (n + 1) / 4, q1 = quantile(a, 0.25), q3 = quantile(a, 0.75);
    const sk1 = mo.length === 1 && sdS ? (m - mo[0]) / sdS : NaN, sk2 = sdS ? 3 * (m - md) / sdS : NaN;
    const skTxt = v => isNaN(v) ? '—' : Math.abs(v) < 0.05 ? 'متماثل تقريبًا' : v > 0 ? 'التواء موجب (الوسط > الوسيط > المنوال)' : 'التواء سالب (المنوال > الوسيط > الوسط)';
    const steps = [
      { t: 'الوسط الحسابي = مجموع القيم ÷ عددها', rows: ['= ' + fmt(sum(a)) + ' ÷ ' + n + ' = ' + fmt(m, 4)] },
      { t: 'الوسيط: نرتب القيم تصاعديًا، ترتيبه (ن+1)÷2 = ' + fmt((n + 1) / 2), rows: [s.join('، '), n % 2 ? 'ن فردي → الوسيط = القيمة رقم ' + (n + 1) / 2 + ' = ' + fmt(md, 4) : 'ن زوجي → الوسيط = متوسط القيمتين رقم ' + n / 2 + ' و ' + (n / 2 + 1) + ' = ' + fmt(md, 4)] },
      { t: 'المنوال = القيمة الأكثر تكرارًا', rows: [mo.length ? mo.join(' و ') + (mo.length > 1 ? ' (أكتر من منوال)' : '') : 'مفيش منوال (مفيش قيمة اتكررت)'] },
      { t: 'المدى = أكبر قيمة − أصغر قيمة', rows: [fmt(s[n - 1]) + ' − ' + fmt(s[0]) + ' = ' + fmt(s[n - 1] - s[0])] },
      { t: 'مجموع مربعات الانحرافات مج(س − الوسط)²', rows: ['= ' + fmt(ss, 4)] },
      { t: 'تباين العينة s² = مج(س − الوسط)² ÷ (ن − 1)', rows: ['= ' + fmt(ss, 4) + ' ÷ ' + (n - 1) + ' = ' + fmt(vS, 4) + ' → الانحراف المعياري s = ' + fmt(sdS, 4)] },
      { t: 'تباين المجتمع σ² = مج(س − الوسط)² ÷ ن', rows: ['= ' + fmt(ss, 4) + ' ÷ ' + n + ' = ' + fmt(vP, 4) + ' → σ = ' + fmt(sdP, 4)] },
      { t: 'معامل الاختلاف = (الانحراف المعياري ÷ الوسط) × 100', rows: ['= ' + fmt(sdS, 4) + ' ÷ ' + fmt(m, 4) + ' × 100 = ' + fmt(m ? sdS / m * 100 : NaN, 2) + '% (بانحراف العينة)'] },
      { t: 'الربيعات: ترتيب Q1 = (ن+1)÷4 = ' + fmt(q1p) + '، ترتيب Q3 = 3(ن+1)÷4 = ' + fmt(q3p), rows: ['Q1 = ' + fmt(q1, 4) + '، Q2 (الوسيط) = ' + fmt(md, 4) + '، Q3 = ' + fmt(q3, 4), 'المدى الربيعي IQR = Q3 − Q1 = ' + fmt(q3 - q1, 4)] },
      { t: 'معامل الالتواء (بيرسون)', rows: ['بالمنوال: (الوسط − المنوال) ÷ s = ' + fmt(sk1, 3), 'بالوسيط: 3(الوسط − الوسيط) ÷ s = ' + fmt(sk2, 3) + ' → ' + skTxt(sk2)] }
    ];
    return { n, mean: m, median: md, modes: mo, range: s[n - 1] - s[0], ss, variance: vS, sd: sdS, popVariance: vP, popSd: sdP, cv: m ? sdS / m * 100 : NaN, q1, q3, iqr: q3 - q1, sk1, sk2, sorted: s, steps };
  }
  /** الأرقام القياسية للأسعار: p0,p1 أسعار الأساس والمقارنة، q0,q1 الكميات */
  function indexNumbers(p0, p1, q0, q1) {
    const simple = sum(p1) / sum(p0) * 100;
    const out = { simple, steps: [{ t: 'الرقم التجميعي البسيط = (مج ع1 ÷ مج ع0) × 100', rows: ['= ' + fmt(sum(p1)) + ' ÷ ' + fmt(sum(p0)) + ' × 100 = ' + fmt(simple) + '%'] }] };
    if (q0 && q0.length === p0.length) {
      const a = sum(p1.map((v, i) => v * q0[i])), b = sum(p0.map((v, i) => v * q0[i]));
      out.laspeyres = a / b * 100;
      out.steps.push({ t: 'رقم لاسبير (مرجح بكميات سنة الأساس) = مج(ع1×ك0) ÷ مج(ع0×ك0) × 100', rows: ['= ' + fmt(a) + ' ÷ ' + fmt(b) + ' × 100 = ' + fmt(out.laspeyres) + '%'] });
    }
    if (q1 && q1.length === p0.length) {
      const a = sum(p1.map((v, i) => v * q1[i])), b = sum(p0.map((v, i) => v * q1[i]));
      out.paasche = a / b * 100;
      out.steps.push({ t: 'رقم باش (مرجح بكميات سنة المقارنة) = مج(ع1×ك1) ÷ مج(ع0×ك1) × 100', rows: ['= ' + fmt(a) + ' ÷ ' + fmt(b) + ' × 100 = ' + fmt(out.paasche) + '%'] });
    }
    if (out.laspeyres && out.paasche) {
      out.fisher = Math.sqrt(out.laspeyres * out.paasche);
      out.steps.push({ t: 'رقم فيشر الأمثل = √(لاسبير × باش)', rows: ['= √(' + fmt(out.laspeyres) + ' × ' + fmt(out.paasche) + ') = ' + fmt(out.fisher) + '%'] });
    }
    const last = out.fisher || out.paasche || out.laspeyres || simple;
    out.meaning = last >= 100 ? 'الأسعار زادت بنسبة ' + fmt(last - 100) + '% عن سنة الأساس' : 'الأسعار قلت بنسبة ' + fmt(100 - last) + '% عن سنة الأساس';
    return out;
  }
  /** بيانات مبوبة: classes = [{lo, hi, f}] (فئات متصلة) */
  function describeGrouped(classes) {
    const C = classes.map(c => ({ lo: +c.lo, hi: +c.hi, f: +c.f })).filter(c => !isNaN(c.lo) && !isNaN(c.hi) && !isNaN(c.f));
    const n = sum(C.map(c => c.f));
    C.forEach(c => { c.x = (c.lo + c.hi) / 2; c.fx = c.f * c.x; c.w = c.hi - c.lo; });
    let cum = 0; C.forEach(c => { cum += c.f; c.cum = cum; });
    const m = sum(C.map(c => c.fx)) / n;
    // الوسيط
    const half = n / 2; const mi = C.findIndex(c => c.cum >= half); const mc = C[mi]; const before = mi > 0 ? C[mi - 1].cum : 0;
    const med = mc.lo + (half - before) / mc.f * mc.w;
    // المنوال (طريقة الفروق — بيرسون/كينج): المنوال = الحد الأدنى + (ف1 ÷ (ف1+ف2)) × طول الفئة
    let ki = 0; C.forEach((c, i) => { if (c.f > C[ki].f) ki = i; });
    const kc = C[ki], d1 = kc.f - (ki > 0 ? C[ki - 1].f : 0), d2 = kc.f - (ki < C.length - 1 ? C[ki + 1].f : 0);
    const mode = kc.lo + (d1 + d2 ? d1 / (d1 + d2) : 0.5) * kc.w;
    const ssG = sum(C.map(c => c.f * (c.x - m) ** 2)), v = ssG / (n - 1), vP = ssG / n;
    const steps = [
      { t: 'مراكز الفئات س = (الحد الأدنى + الحد الأعلى) ÷ 2، وبعدين ك×س', rows: C.map(c => fmt(c.lo) + '–' + fmt(c.hi) + ': س=' + fmt(c.x) + '، ك=' + c.f + '، ك×س=' + fmt(c.fx)) },
      { t: 'الوسط الحسابي = مج(ك×س) ÷ مج ك', rows: ['= ' + fmt(sum(C.map(c => c.fx))) + ' ÷ ' + n + ' = ' + fmt(m, 4)] },
      { t: 'الوسيط: ترتيبه ن÷2 = ' + fmt(half) + ' → فئة الوسيط ' + fmt(mc.lo) + '–' + fmt(mc.hi), rows: ['الوسيط = الحد الأدنى + ((ن÷2 − التكرار المتجمع قبلها) ÷ تكرارها) × طول الفئة', '= ' + fmt(mc.lo) + ' + ((' + fmt(half) + ' − ' + before + ') ÷ ' + mc.f + ') × ' + fmt(mc.w) + ' = ' + fmt(med, 4)] },
      { t: 'المنوال (طريقة الفروق): الفئة المنوالية ' + fmt(kc.lo) + '–' + fmt(kc.hi), rows: ['ف1 = ' + d1 + '، ف2 = ' + d2, 'المنوال = الحد الأدنى + (ف1 ÷ (ف1+ف2)) × طول الفئة = ' + fmt(kc.lo) + ' + (' + d1 + ' ÷ ' + (d1 + d2) + ') × ' + fmt(kc.w) + ' = ' + fmt(mode, 4)] },
      { t: 'تباين العينة = مج ك(س − الوسط)² ÷ (مج ك − 1)', rows: ['مج ك(س − الوسط)² = ' + fmt(ssG, 4), '= ' + fmt(ssG, 4) + ' ÷ ' + (n - 1) + ' = ' + fmt(v, 4) + '، والانحراف المعياري = ' + fmt(Math.sqrt(v), 4), '(تباين المجتمع ÷ مج ك = ' + fmt(vP, 4) + '، σ = ' + fmt(Math.sqrt(vP), 4) + ')'] },
      { t: 'معامل الاختلاف = s ÷ الوسط × 100', rows: ['= ' + fmt(Math.sqrt(v) / m * 100, 2) + '%'] }
    ];
    return { n, mean: m, median: med, mode, variance: v, sd: Math.sqrt(v), popVariance: vP, cv: Math.sqrt(v) / m * 100, classes: C, steps };
  }
  /** ارتباط بيرسون + سبيرمان + خط الانحدار ص = أ + ب س */
  function correlation(x, y) {
    const n = Math.min(x.length, y.length); x = x.slice(0, n); y = y.slice(0, n);
    const sx = sum(x), sy = sum(y), sxy = sum(x.map((v, i) => v * y[i])), sx2 = sum(x.map(v => v * v)), sy2 = sum(y.map(v => v * v));
    const num = n * sxy - sx * sy, den = Math.sqrt((n * sx2 - sx * sx) * (n * sy2 - sy * sy));
    const r = den ? num / den : NaN;
    const b = (n * sx2 - sx * sx) ? num / (n * sx2 - sx * sx) : NaN, a = (sy - b * sx) / n;
    const rx = ranks(x), ry = ranks(y); const d2 = sum(rx.map((v, i) => (v - ry[i]) ** 2));
    const rs = 1 - 6 * d2 / (n * (n * n - 1));
    const strength = v => { const a = Math.abs(v); const dir = v > 0 ? 'طردي' : v < 0 ? 'عكسي' : ''; if (a === 1) return dir + ' تام'; if (a >= 0.7) return dir + ' قوي'; if (a >= 0.5) return dir + ' متوسط'; if (a > 0) return dir + ' ضعيف'; return 'مفيش ارتباط'; };
    const steps = [
      { t: 'نحسب: ن، مج س، مج ص، مج س ص، مج س²، مج ص²', rows: ['ن=' + n + '، مج س=' + fmt(sx) + '، مج ص=' + fmt(sy) + '، مج س ص=' + fmt(sxy) + '، مج س²=' + fmt(sx2) + '، مج ص²=' + fmt(sy2)] },
      { t: 'معامل ارتباط بيرسون ر = (ن مج س ص − مج س مج ص) ÷ √[(ن مج س² − (مج س)²)(ن مج ص² − (مج ص)²)]', rows: ['= ' + fmt(num) + ' ÷ ' + fmt(den, 4) + ' = ' + fmt(r, 4) + ' → ارتباط ' + strength(r)] },
      { t: 'معامل ارتباط الرتب لسبيرمان = 1 − (6 مج ف²) ÷ (ن(ن²−1))', rows: ['مج ف² = ' + fmt(d2) + ' → ر = ' + fmt(rs, 4) + ' (' + strength(rs) + ')'] },
      { t: 'خط انحدار ص على س: ص = أ + ب س', rows: ['ب = (ن مج س ص − مج س مج ص) ÷ (ن مج س² − (مج س)²) = ' + fmt(b, 4), 'أ = (مج ص − ب مج س) ÷ ن = ' + fmt(a, 4), 'ص = ' + fmt(a, 4) + (b >= 0 ? ' + ' : ' − ') + fmt(Math.abs(b), 4) + ' س'] }
    ];
    return { n, r, rs, a, b, strength: strength(r), steps };
  }
  function ranks(a) { const idx = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]); const r = new Array(a.length); let i = 0; while (i < idx.length) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; const avg = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r[idx[k][1]] = avg; i = j + 1; } return r; }
  /** جدول توزيع تكراري من بيانات خام (قاعدة ستيرجس لعدد الفئات) */
  function frequencyTable(a, k) {
    const n = a.length, mn = Math.min(...a), mx = Math.max(...a);
    k = k || Math.max(3, Math.round(1 + 3.322 * Math.log10(n)));
    const w = Math.ceil((mx - mn + 1) / k) || 1;
    const rows = []; for (let i = 0; i < k; i++) { const lo = mn + i * w, hi = lo + w; rows.push({ lo, hi, f: a.filter(x => x >= lo && (x < hi || (i === k - 1 && x <= hi))).length }); }
    return { k, w, rows };
  }
  function genStats(seed) {
    const R = rng(seed || Date.now()); const n = 5 + Math.floor(R() * 5);
    const a = Array.from({ length: n }, () => 2 + Math.floor(R() * 18));
    if (R() < 0.7) a[Math.floor(R() * n)] = a[0];
    return { data: a, solution: describeRaw(a) };
  }

  /* ================= إدارة الإنتاج ================= */
  /** نظرية القرارات: payoff[i][j] = عائد البديل i في الحالة j. probs اختياري (للقيمة المتوقعة). alpha للهيرويكز */
  function decision(payoff, opts = {}) {
    const alpha = opts.alpha != null ? opts.alpha : 0.6, cost = !!opts.cost;
    const m = payoff.length, k = payoff[0].length;
    const better = (x, y) => cost ? x < y : x > y;
    const bestOf = arr => arr.reduce((bi, v, i) => better(v, arr[bi]) ? i : bi, 0);
    const rowMax = payoff.map(r => cost ? Math.min(...r) : Math.max(...r));
    const rowMin = payoff.map(r => cost ? Math.max(...r) : Math.min(...r));
    const lap = payoff.map(r => mean(r));
    const hur = payoff.map((r, i) => alpha * rowMax[i] + (1 - alpha) * rowMin[i]);
    const colBest = Array.from({ length: k }, (_, j) => cost ? Math.min(...payoff.map(r => r[j])) : Math.max(...payoff.map(r => r[j])));
    const regret = payoff.map(r => r.map((v, j) => Math.abs(colBest[j] - v)));
    const maxRegret = regret.map(r => Math.max(...r));
    const res = {
      optimistic: { label: cost ? 'المتفائل (أدنى الأدنى)' : 'أقصى الأقصى (المتفائل)', how: cost ? 'أصغر قيمة في كل صف ← نختار أصغرها' : 'أكبر قيمة في كل صف ← نختار أكبرها', values: rowMax, best: bestOf(rowMax) },
      pessimistic: { label: cost ? 'المتشائم (أدنى الأقصى)' : 'أقصى الأدنى (المتشائم)', how: cost ? 'أكبر قيمة في كل صف ← نختار أصغرها' : 'أصغر قيمة في كل صف ← نختار أكبرها', values: rowMin, best: bestOf(rowMin) },
      hurwicz: { label: 'الأمثلية (هيرويكز) — دليل التفاؤل ' + alpha, how: 'الأفضل × ' + alpha + ' + الأسوأ × ' + round(1 - alpha, 2) + ' لكل صف ← نختار ' + (cost ? 'أصغرها' : 'أكبرها'), values: hur, best: bestOf(hur) },
      laplace: { label: 'الوسط (لابلاس — تساوي الاحتمالات)', how: 'متوسط كل صف ← نختار ' + (cost ? 'أصغره' : 'أكبره'), values: lap, best: bestOf(lap) },
      savage: { label: 'الأسف (أدنى أقصى أسف)', how: 'مصفوفة الأسف = أفضل قيمة في العمود − كل قيمة ← أكبر أسف في كل صف ← نختار أصغره', values: maxRegret, best: maxRegret.indexOf(Math.min(...maxRegret)), regret }
    };
    if (opts.probs && opts.probs.length === k) {
      const ev = payoff.map(r => sum(r.map((v, j) => v * opts.probs[j])));
      res.ev = { label: 'القيمة المتوقعة (ظروف المخاطرة)', values: ev, best: bestOf(ev) };
      const evpi = sum(colBest.map((v, j) => v * opts.probs[j])) - (cost ? Math.min(...ev) : Math.max(...ev));
      res.evpi = Math.abs(evpi);
    }
    return res;
  }
  /** ثوابت خرائط الرقابة (حجم العينة n = 2..10) */
  const CC = { 2: { A2: 1.880, D3: 0, D4: 3.267, d2: 1.128 }, 3: { A2: 1.023, D3: 0, D4: 2.574, d2: 1.693 }, 4: { A2: 0.729, D3: 0, D4: 2.282, d2: 2.059 }, 5: { A2: 0.577, D3: 0, D4: 2.114, d2: 2.326 }, 6: { A2: 0.483, D3: 0, D4: 2.004, d2: 2.534 }, 7: { A2: 0.419, D3: 0.076, D4: 1.924, d2: 2.704 }, 8: { A2: 0.373, D3: 0.136, D4: 1.864, d2: 2.847 }, 9: { A2: 0.337, D3: 0.184, D4: 1.816, d2: 2.970 }, 10: { A2: 0.308, D3: 0.223, D4: 1.777, d2: 3.078 } };
  /** خريطتي الوسط والمدى من عينات: samples = [[...], ...] */
  function xbarR(samples, consts) {
    const n = samples[0].length, c = Object.assign({}, CC[n] || {}, consts || {}); if (c.A2 == null) return null;
    const xb = samples.map(mean), R = samples.map(s => Math.max(...s) - Math.min(...s));
    const X = mean(xb), Rb = mean(R);
    const x = { cl: X, ucl: X + c.A2 * Rb, lcl: X - c.A2 * Rb }, r = { cl: Rb, ucl: c.D4 * Rb, lcl: c.D3 * Rb };
    const outX = xb.map((v, i) => v > x.ucl || v < x.lcl ? i + 1 : 0).filter(Boolean), outR = R.map((v, i) => v > r.ucl || v < r.lcl ? i + 1 : 0).filter(Boolean);
    return { n, consts: c, xbars: xb, ranges: R, x, r, outX, outR, inControl: !outX.length && !outR.length };
  }
  /** خريطة نسبة المعيب p: defects = عدد المعيب في كل عينة، n = حجم العينة */
  function pChart(defects, n) {
    const p = defects.map(d => d / n), pb = sum(defects) / (n * defects.length), s = Math.sqrt(pb * (1 - pb) / n);
    const ucl = pb + 3 * s, lcl = Math.max(0, pb - 3 * s);
    return { p, cl: pb, ucl, lcl, sigma: s, out: p.map((v, i) => v > ucl || v < lcl ? i + 1 : 0).filter(Boolean) };
  }
  /** خريطة عدد العيوب c */
  function cChart(counts) { const cb = mean(counts), s = Math.sqrt(cb); const ucl = cb + 3 * s, lcl = Math.max(0, cb - 3 * s); return { cl: cb, ucl, lcl, out: counts.map((v, i) => v > ucl || v < lcl ? i + 1 : 0).filter(Boolean) }; }
  /** خريطة np */
  function npChart(defects, n) { const pb = sum(defects) / (n * defects.length), cl = n * pb, s = Math.sqrt(n * pb * (1 - pb)); return { cl, ucl: cl + 3 * s, lcl: Math.max(0, cl - 3 * s), pbar: pb }; }


  /** مصفوفة نتائج لسلعة بتفقد قيمتها لو مااتباعتش (الصحف): الكمية المشتراة × الطلب */
  function perishablePayoff(qty, demand, cost, price, salvage = 0) {
    return qty.map(q => demand.map(d => { const sold = Math.min(q, d); return round(sold * price + (q - sold) * salvage - q * cost); }));
  }
  /** تحليل التعادل والسواء التشغيلي لموقعين */
  function breakEven(F, price, v) { return F / (price - v); }
  function locations(a, b, price) {
    const out = { a: { be: price ? breakEven(a.F, price, a.v) : null }, b: { be: price ? breakEven(b.F, price, b.v) : null } };
    out.indiff = (a.v !== b.v) ? Math.abs((b.F - a.F) / (a.v - b.v)) : null;
    out.lowFixed = a.F <= b.F ? 'a' : 'b';
    out.lowVar = a.v <= b.v ? 'a' : 'b';
    out.pick = q => q < out.indiff ? out.lowFixed : q > out.indiff ? out.lowVar : 'equal';
    out.cost = (L, q) => L.F + L.v * q;
    return out;
  }
  /** التخصيص (المجرية) — بنجرب كل التباديل لأن المصفوفات صغيرة (≤ 8) */
  function assignment(m, opts = {}) {
    const n = m.length, max = !!opts.maximize;
    // خطوات التخفيض للعرض
    const base = max ? m.map(r => r.map(v => Math.max(...m.flat()) - v)) : m.map(r => r.slice());
    const rowRed = base.map(r => { const mn = Math.min(...r); return r.map(v => v - mn); });
    const colRed = rowRed.map(r => r.slice());
    for (let j = 0; j < n; j++) { const mn = Math.min(...colRed.map(r => r[j])); for (let i = 0; i < n; i++) colRed[i][j] -= mn; }
    let best = null, bestV = max ? -Infinity : Infinity;
    const perm = (arr, k) => {
      if (k === n) { const v = sum(arr.map((j, i) => m[i][j])); if (max ? v > bestV : v < bestV) { bestV = v; best = arr.slice(); } return; }
      for (let i = k; i < n; i++) { [arr[k], arr[i]] = [arr[i], arr[k]]; perm(arr, k + 1); [arr[k], arr[i]] = [arr[i], arr[k]]; }
    };
    perm(Array.from({ length: n }, (_, i) => i), 0);
    return { assign: best, total: bestV, rowRed, colRed };
  }
  /** البرمجة الخطية بالطريقة البيانية (متغيرين): max c1x + c2y s.t. a x + b y <= r */
  function lp2(c, cons, opts = {}) {
    const max = opts.minimize ? false : true;
    const lines = cons.map(k => ({ a: +k[0], b: +k[1], r: +k[2], op: k[3] || '<=' }));
    const all = lines.concat([{ a: 1, b: 0, r: 0, op: '>=' }, { a: 0, b: 1, r: 0, op: '>=' }]);
    const pts = [];
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const L1 = all[i], L2 = all[j], det = L1.a * L2.b - L2.a * L1.b; if (Math.abs(det) < 1e-12) continue;
      const x = (L1.r * L2.b - L2.r * L1.b) / det, y = (L1.a * L2.r - L2.a * L1.r) / det;
      if (x < -1e-9 || y < -1e-9) continue;
      const ok = lines.every(L => { const v = L.a * x + L.b * y; return L.op === '>=' ? v >= L.r - 1e-7 : L.op === '=' ? Math.abs(v - L.r) < 1e-7 : v <= L.r + 1e-7; });
      if (ok && !pts.some(p => Math.abs(p.x - x) < 1e-7 && Math.abs(p.y - y) < 1e-7)) pts.push({ x: round(x, 4), y: round(y, 4) });
    }
    pts.forEach(p => { p.z = round(c[0] * p.x + c[1] * p.y, 4); });
    const best = pts.reduce((b, p) => !b || (max ? p.z > b.z : p.z < b.z) ? p : b, null);
    const intercepts = lines.map(L => ({ x: L.a ? round(L.r / L.a, 4) : null, y: L.b ? round(L.r / L.b, 4) : null }));
    return { points: pts, best, intercepts };
  }

  /* ================= الاقتصاد الكلي ================= */
  /** النموذج الكينزي البسيط: C = a + bYd ، Yd = Y − T (+TR)، T = T0 + tY. Y = C + I + G (+ X − M، M = M0 + mY) */
  function keynes(p) {
    const a = +p.a || 0, b = +p.b || 0, I = +p.I || 0, G = +p.G || 0, T0 = +p.T || 0, t = +p.t || 0, TR = +p.TR || 0, X = +p.X || 0, M0 = +p.M || 0, mm = +p.m || 0;
    const auto = a - b * T0 + b * TR + I + G + X - M0;
    const k = 1 / (1 - b * (1 - t) + mm);
    const Y = auto * k, Yd = Y - (T0 + t * Y) + TR, C = a + b * Yd, S = Yd - C, T = T0 + t * Y, M = M0 + mm * Y;
    const steps = [
      { t: 'شرط التوازن: Y = C + I + G' + (X || M0 || mm ? ' + X − M' : ''), rows: ['Y = ' + fmt(a) + ' + ' + fmt(b) + '(Y' + (T0 || t ? ' − T' : '') + (TR ? ' + TR' : '') + ')' + ' + ' + fmt(I) + (G ? ' + ' + fmt(G) : '') + (X ? ' + ' + fmt(X) : '') + (M0 || mm ? ' − (' + fmt(M0) + (mm ? ' + ' + fmt(mm) + 'Y' : '') + ')' : '')] },
      { t: 'الإنفاق المستقل (التلقائي) = a − bT₀ + bTR + I + G + X − M₀', rows: ['= ' + fmt(auto, 3)] },
      { t: 'المضاعف k = 1 ÷ (1 − b(1 − t) + m)', rows: ['= 1 ÷ (1 − ' + fmt(b) + '×(1 − ' + fmt(t) + ') + ' + fmt(mm) + ') = ' + fmt(k, 4)] },
      { t: 'الدخل التوازني Y* = الإنفاق المستقل × المضاعف', rows: ['= ' + fmt(auto, 3) + ' × ' + fmt(k, 4) + ' = ' + fmt(Y, 3)] },
      { t: 'الاستهلاك والادخار عند التوازن', rows: ['Yd = ' + fmt(Yd, 3) + '، C = ' + fmt(C, 3) + '، S = Yd − C = ' + fmt(S, 3)] }
    ];
    const be = (1 - b) ? a / (1 - b) : NaN, mlr = 1 - b * (1 - t) + mm;
    steps.push({ t: 'الميل الحدي للتسرب MLR = 1 − b + bt' + (mm ? ' + m' : '') + ' = 1 ÷ k', rows: ['= ' + fmt(mlr, 4)] });
    steps.push({ t: 'نقطة التعادل (C = Yd و S = 0): Yd = a ÷ (1 − b)', rows: ['= ' + fmt(a) + ' ÷ ' + fmt(1 - b, 4) + ' = ' + fmt(be, 3)] });
    steps.push({ t: 'إثبات التوازن: العرض الكلي C + S + T = الطلب الكلي C + I + G، والحقن (I + G) = التسرب (S + T)', rows: ['C + S + T = ' + fmt(C + S + T, 3) + '، C + I + G = ' + fmt(C + I + G + X - M, 3), 'S + T = ' + fmt(S + T, 3) + '، I + G = ' + fmt(I + G, 3)] });
    return { Y, C, S, T, Yd, M, k, mlr, breakEven: be, leak: S + T, inject: I + G, autonomous: auto, taxMultiplier: -b * k, trMultiplier: b * k, balancedBudget: (1 - b) * k, apc: Y ? C / Y : NaN, mpc: b, mps: 1 - b, steps };
  }
  /** IS–LM: C = a + b(Y − tY) − e·r ، I = I0 − d·r ، G. سوق النقود: Md = kY·Y − L·r = M/P */
  function islm(p) {
    const b = +p.b, a = +p.a || 0, t = +p.t || 0, e = +p.e || 0, I0 = +p.I0 || 0, d = +p.d || 0, G = +p.G || 0;
    const k = 1 / (1 - b * (1 - t)), A = a + I0 + G, beta = (e + d) * k, alpha = A * k;
    const out = { k, A, IS: 'Y = ' + fmt(alpha, 3) + ' − ' + fmt(beta, 3) + ' r', isAlpha: alpha, isBeta: beta };
    if (p.ky != null && p.L != null && p.M != null) {
      const ky = +p.ky, L = +p.L, MP = +p.M / (+p.P || 1);
      out.LM = 'r = ' + fmt(ky / L, 4) + ' Y − ' + fmt(MP / L, 3);
      out.Y = (alpha + beta * MP / L) / (1 + beta * ky / L);
      out.r = (ky * out.Y - MP) / L;
    }
    out.steps = [
      { t: 'الإنفاق المستقل A = a + I₀ + G', rows: ['= ' + fmt(A)] },
      { t: 'المضاعف k = 1 ÷ (1 − b(1 − t))', rows: ['= ' + fmt(k, 4)] },
      { t: 'معادلة IS: Y = k·A − k(e + d)·r', rows: [out.IS + ' (علاقة عكسية بين الدخل وسعر الفائدة)'] }
    ];
    if (out.LM) out.steps.push({ t: 'معادلة LM من Ms = Md: M/P = kY·Y − L·r', rows: [out.LM + ' (علاقة طردية)', 'التوازن: Y* = ' + fmt(out.Y, 3) + '، r* = ' + fmt(out.r, 3)] });
    return out;
  }
  /** سوق النقود: الطلب = معاملات kY + مضاربة −L r */
  function moneyMarket(p) { const ky = +p.ky, Y = +p.Y, L = +p.L, M = +p.M; const r = (ky * Y - M) / L; return { r, mdT: ky * Y, mdS: -L * r }; }
  /** حسابات الدخل القومي */
  function nationalAccounts(p) {
    const C = +p.C || 0, I = +p.I || 0, G = +p.G || 0, X = +p.X || 0, M = +p.M || 0, dep = +p.dep || 0, nfi = +p.nfi || 0, indTax = +p.indTax || 0, sub = +p.sub || 0;
    const GDP = C + I + G + X - M, GNP = GDP + nfi, NNP = GNP - dep, NI = NNP - indTax + sub;
    return { GDP, GNP, NNP, NI, NDP: GDP - dep };
  }

  /* ================= المخطط ونقط الضعف ================= */
  /** يحلل المحاولات: attempts = [{qid, subject, lesson, ok, t}] → ترتيب الدروس من الأضعف */
  function weakness(attempts, opts = {}) {
    const by = {};
    for (const a of attempts || []) {
      const k = (a.subject || '?') + '|' + (a.lesson || '');
      const x = by[k] || (by[k] = { subject: a.subject, lesson: a.lesson, n: 0, ok: 0, recent: 0, last: 0 });
      x.n++; if (a.ok) x.ok++; x.last = Math.max(x.last, a.t || 0);
    }
    const list = Object.values(by).map(x => {
      const acc = x.ok / x.n; // ثقة بايزية بسيطة: نفترض بداية 50%
      const score = (x.ok + 1) / (x.n + 2);
      return Object.assign(x, { acc, score });
    }).filter(x => x.n >= (opts.min || 2));
    return list.sort((a, b) => a.score - b.score);
  }
  /**
   * خطة مذاكرة: exams = [{subject, date}], lessons = {subject: [lessonIds]}, progress = {lessonId: 0..1}
   * بيوزع الدروس اللي مش مقفولة على الأيام الفاضلة قبل كل امتحان، ويسيب آخر يوم مراجعة شاملة.
   */
  function buildPlan(exams, lessons, progress = {}, opts = {}) {
    const now = opts.now ? new Date(opts.now) : new Date();
    const perDay = opts.perDay || 3;
    const days = {};
    const upcoming = (exams || []).filter(e => daysBetween(now, e.date) >= 0).sort((a, b) => new Date(a.date) - new Date(b.date));
    for (const ex of upcoming) {
      const left = daysBetween(now, ex.date);
      const todo = (lessons[ex.subject] || []).filter(l => (progress[l] || 0) < 0.8);
      const studyDays = Math.max(1, left); // اليوم الأخير قبل الامتحان = مراجعة
      const slots = [];
      for (let i = 0; i < studyDays; i++) slots.push(ymd(addDays(now, i)));
      todo.forEach((l, i) => {
        const day = slots[Math.min(slots.length - 1, Math.floor(i * slots.length / Math.max(1, todo.length)))];
        (days[day] || (days[day] = [])).push({ type: 'lesson', subject: ex.subject, lesson: l, exam: ex.id });
      });
      const revDay = ymd(addDays(ex.date, left >= 1 ? -1 : 0));
      (days[revDay] || (days[revDay] = [])).push({ type: 'review', subject: ex.subject, exam: ex.id });
    }
    // سقف لكل يوم: الزيادة تتزق لليوم اللي بعده لو ينفع
    const keys = Object.keys(days).sort();
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i], items = days[k];
      const lessonsOnly = items.filter(x => x.type === 'lesson');
      if (lessonsOnly.length > perDay && i + 1 < keys.length) {
        const extra = lessonsOnly.slice(perDay);
        days[k] = items.filter(x => !extra.includes(x));
        days[keys[i + 1]].unshift(...extra);
      }
    }
    return days;
  }
  function streak(daysSet, now = new Date()) {
    let s = 0; let d = startOfDay(now);
    if (!daysSet.has(ymd(d))) d = addDays(d, -1);
    while (daysSet.has(ymd(d))) { s++; d = addDays(d, -1); }
    return s;
  }

  return {
    toLatinDigits, norm, round, sum, fmt, uid, hashStr, rng, shuffle, lev, parseNumber,
    ymd, startOfDay, daysBetween, addDays, parseDate, parseTime, prettyDate, inDaysText, WEEKDAY_NAMES, MONTH_NAMES,
    srsNext, srsLabel, isDue, mastery,
    detectSubject, extractCount, parseIntent, SUBJECT_KEYS,
    tokenize, search, snippet,
    grade, gradeFill, gradeNumber, gradeJournal, netByAccount, accKey, entryBalanced,
    distributeProfit, capitalFormation, genCapital, genDistribution, describeDistribution,
    parseList, mean, median, modes, variance, sd, describeRaw, describeGrouped, indexNumbers, correlation, ranks, frequencyTable, genStats, quantile,
    decision, xbarR, pChart, cChart, npChart, CC, perishablePayoff, breakEven, locations, assignment, lp2,
    keynes, islm, moneyMarket, nationalAccounts,
    weakness, buildPlan, streak
  };
});
