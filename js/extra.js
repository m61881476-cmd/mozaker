/* مذاكِر — القايمة الرئيسية، المواد الجاية، آخر الأخبار والأسايمنت، الجوايز، وكلام سَنَد ووضعياته */
(function () {
  'use strict';
  const E = self.Engine, U = self.UI;
  const { $, $$, esc, icon, Store, Router, header, toast, Char, haptic, beep } = U;
  const D = () => Store.data;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const now = () => Date.now();
  const cname = () => esc((D() && D().charName) || 'سَنَد');
  const isF = () => !!(self.Sub && Sub.who() === 'fatma');

  /* ================= آخر الأخبار ================= */
  const DRIVE = 'https://drive.google.com/drive/folders/1Was38RzlLQnV1eFczQIZ25l9QeBCmHWJ?usp=drive_link';
  const NEWS_DEFAULT = [
    {"id": "exam-tips-prod-law", "kind": "info", "date": "2026-11-26", "icon": "🎯", "title": "الدكتور قال: شكل امتحان الإنتاج والقانون التجاري", "short": "الإنتاج: بابل + سؤال مقالي قصير في ضهر الورقة، والمسار الحرج شبه مضمون. القانون: نظري وحالات عملية، ومفيش أرقام مواد ماعدا 505.", "say": "خبر مهم جدًا 🎤 الدكتور قال شكل امتحان الإنتاج والقانون التجاري. ركّز معايا!", "go": "#lesson/lw3", "goT": "⚖️ افتح الشركات التجارية (فيها المادة 505)", "points": [["🏭", "<b>إدارة الإنتاج والعمليات:</b> الامتحان <b>بابل</b>، ومعاه <b>سؤال مقالي قصير</b> (تعريف أو نقطة) بتكتبه <b>في ضهر ورقة البابل</b>."], ["⚠️", "<b>المسودة مابتتصححش</b>، فلو غلطت في الحساب <b>الإجابة كلها بتروح</b>. راجع حساباتك قبل ما تظلل."], ["🧮", "مسألة <b>المسار الحرج</b> شبه مضمونة، و<b>الفائض مش مطلوب</b>. (الفصل ده هينزل في البرنامج أول ما يوصلني.)"], ["⚖️", "<b>القانون التجاري (قانون الأعمال):</b> الأسئلة <b>نظرية وحالات عملية</b> مع بعض، وفي البرنامج أكتر من 15 حالة عملية جاهزة."], ["✍️", "التعريفات اكتبها <b>بأسلوبك</b>، بس <b>القاعدة نفسها</b> لازم تبقى موجودة."], ["🔢", "أرقام المواد <b>مش لازم</b>، <b>ماعدا المادة 505</b> (تعريف الشركة)."], ["🎓", "الامتحان من <b>شرح المحاضرات</b>، يعني <b>الحضور فارق</b>."], ["📚", "ونزل في القانون: <b>الفصل التاني (المقاولات التجارية)</b> و<b>الشركات التجارية</b> بالملخص والبورد والامتحان."]]},
    {
      id: 'asg-stat-3',
      for: 'ext',
      kind: 'info',
      date: '2026-11-19',
      icon: '📨',
      title: 'أسئلة أسايمنت الإحصاء نزلت! التسليم خلال أسبوع (انتساب)',
      short: 'PDF الأسئلة اتبعت على الجروبات، والتسليم خلال أسبوع من تاريخه. اللينك جاي النهارده أو بكرة. إجباري وكل طالب لوحده.',
      say: 'يلا يا بطل 🎤 أسئلة أسايمنت الإحصاء نزلت، وقدامك أسبوع بس. تعالى أقولك تعمل إيه',
      go: '#news/asg-stat-1',
      goT: '📊 صفحة أسايمنت الإحصاء',
      points: [['📨', '<b>PDF الأسئلة</b> اتبعت على <b>الجروبات</b>، على <b>أول 4 أبواب</b>.'], ['⏳', 'مدة التسليم <b>أسبوع</b> من تاريخ PDF الأسئلة.'], ['🔗', 'الدكتور هيبعت <b>لينك الرفع</b> النهارده أو بكرة بالكتير، وأول ما ييجي هنزله هنا.'], ['❗', 'الأسايمنت <b>إجباري</b>، و<b>كل طالب لوحده</b>.'], ['✍️', 'حل الأسئلة <b>بإيدك</b> على ورق، وصوّر صفحاتك وحوّلها <b>PDF</b>.'], ['🪪', 'اكتب <b>اسمك بالكامل</b> و<b>كودك</b> و<b>الفرقة الثانية انتساب</b>. وصفحة الغلاف في البرنامج بتكتبهم لوحدها أول صفحة.'], ['📤', 'ضيف صور صفحاتك في البرنامج، وهو يعملها PDF واحد، وبعدين ترفعه على اللينك.']]
    },
    {
      id: 'final-sched-1',
      for: 'reg',
      kind: 'info',
      date: '2026-11-19',
      icon: '🗓️',
      title: 'امتحانات الفاينل: البداية 20/12 + مراجعة ربع منهج الاقتصاد نزلت (انتظام)',
      short: 'الفاينل بيبدأ 20/12 في مبنى الامتحانات، 6 مواد. وفيه مراجعة ربع منهج الاقتصاد جاهزة بالملخص والبورد والامتحان.',
      say: 'خبر مهم 🎤 جدول الفاينل اتعرف، ومعاه هدية: مراجعة ربع منهج الاقتصاد كاملة!',
      go: '#lesson/ecr',
      goT: '📖 افتح مراجعة ربع منهج الاقتصاد',
      points: [['🗓️', 'الامتحانات بتبدأ يوم <b>20/12</b> في <b>مبنى الامتحانات</b> بكلية التجارة، و<b>6 مواد</b>.'], ['📋', 'الترتيب اللي اتقال: <b>محاسبة ← قانون الأعمال ← تسويق ← إنتاج ← إحصاء</b>، وموعد الاقتصاد لسه ماتأكدش.'], ['⚠️', 'الجدول ده <b>مؤكد 80% بس</b> ولسه ممكن يتغير. واتقال إن 20/12 «سبت»، بس 20/12 السنة دي <b>يوم أحد</b>، فاتأكد من الجدول الرسمي.'], ['📊', 'امتحان الاقتصاد <b>40 درجة</b>، والـ MCQ بيسأل على <b>كلمة أو كلمتين</b>، والدكتور بيرجع لأسئلة السنين اللي فاتت كتير.'], ['📖', '<b>مراجعة ربع منهج الاقتصاد</b> نزلت: تلات أسئلة الدخل، والتدفق الدائري، و GDP و GNP، والنموذج الكينزي، وتمرين الجدول، ومعاها <b>بورد</b> و<b>امتحان 30 سؤال</b>.']]
    },
    {
      id: 'asg-stat-2',
      for: 'ext',
      kind: 'info',
      date: '2026-11-19',
      icon: '🚨',
      title: 'تفاصيل أسايمنت الإحصاء: كل طالب لوحده! (انتساب)',
      short: 'د. خالد هيبعت أسئلة على أول 4 أبواب ولينك رفع خلال الأسبوع الجاي. الحل بخط الإيد، وكل طالب لوحده من غير مجموعات.',
      say: 'ركّز معايا جامد 🎤 تفاصيل أسايمنت الإحصاء نزلت، وأهم حاجة: كل واحد لوحده!',
      go: '#news/asg-stat-1',
      goT: '📊 صفحة أسايمنت الإحصاء',
      points: [['👤', '<b>كل طالب لوحده</b>، مفيش مجموعات ولا تيم.'], ['📚', '<b>د. خالد</b> هيحط مجموعة أسئلة على <b>أول 4 أبواب</b>.'], ['📨', 'هيبعت <b>PDF الأسئلة</b> و<b>لينك رفع الـ PDF</b> خلال <b>الأسبوع الجاي</b>، وأول ما يوصلوا هنزلهم هنا.'], ['✍️', 'الحل <b>بخط إيدك</b> على ورق.'], ['📸', 'صوّر صفحاتك وضيفها في البرنامج، وهو يعملها <b>PDF واحد</b> بالغلاف باسمك، وترفعه على اللينك.'], ['💡', 'لحد ما الأسئلة توصل، راجع <b>أول 4 أبواب</b> كويس.']]
    },
    {
      id: 'asg-eco-hand',
      for: 'reg',
      kind: 'info',
      date: '2026-11-18',
      icon: '✍️',
      title: 'توضيح من المعيدة: الأسايمنت بخط الإيد (انتظام)',
      short: 'الحل يتكتب بخط الإيد، والصفحات تتصوّر وتتحوّل PDF، ويترفع على اللينك. والتسليم متاح لحد آخر أسبوع في الدراسة.',
      say: 'توضيح مهم 🎤 المعيدة قالت الأسايمنت يتكتب بخط إيدكم! تعالى أقولك تعملوه إزاي',
      go: '#news/asg-eco-1',
      goT: '📝 تفاصيل الأسايمنت',
      points: [['✍️', 'الحل <b>يتكتب بخط الإيد</b> على ورق، مش متكتب على الكمبيوتر ولا Word.'], ['📸', '<b>صوّروا كل صفحة</b> بالموبايل وضيفوا الصور في البرنامج، وهو يرتّبهم ويحوّلهم <b>ملف PDF واحد</b>. (ولو عاملينه PDF من CamScanner أو Google Drive ضيفوه عادي.)'], ['🪪', '<b>صفحة الغلاف</b>: يا إما البرنامج يعملها بأسامي التيم وأكوادهم، يا إما تكتبوها <b>بخط الإيد</b> وتصوّروها <b>أول صورة</b>.'], ['📤', 'وبعدين <b>واحد بس</b> من التيم يرفعه على لينك الدرايف، <b>مرة واحدة</b> بس.'], ['📅', 'التسليم متاح <b>لحد آخر أسبوع في الدراسة</b>، فمفيش داعي للاستعجال، خصوصًا إن الفصل السادس لسه ماتشرحش.']]
    },
    {
      id: 'asg-eco-ch6', for: 'reg', kind: 'info', date: '2026-11-17', icon: '⚠️', title: 'تنبيه: أسايمنت الاقتصاد فيه جزء لسه ماتشرحش (انتظام)', short: 'التكليف فيه معطيات ومطالب من الفصل السادس (الاقتصاد المفتوح)، والفصل ده لسه ماتشرحش.',
      say: 'خلي بالك 🎤 الأسايمنت فيه حتة من الفصل السادس اللي لسه ماتشرحش',
      go: '#news/asg-eco-1', goT: '📝 تفاصيل الأسايمنت',
      points: [
        ['⚠️', 'تكليف الاقتصاد فيه <b>معطيات ومطالب من الفصل السادس (الاقتصاد المفتوح)</b>: دالة صافي الصادرات، وحساب المضاعف والتوازن «في الاقتصاد المفتوح».'],
        ['📚', 'الفصل ده <b>لسه ماتشرحش</b>، ومفروض يتشرح في المحاضرتين الجايين مع الفصل السابع.'],
        ['✅', '<b>النصيحة:</b> <b>استنوا محاضرة الفصل السادس</b> أو اتأكدوا من المعيد قبل الرفع، خصوصًا إن التسليم آخر أسبوع ولسه فيه وقت.']
      ]
    },
    {
      id: 'asg-stat-1',
      for: 'ext',
      kind: 'asg',
      date: '2026-11-19',
      icon: '📊',
      title: 'أسايمنت الإحصاء (انتساب)',
      short: 'إجباري وكل طالب لوحده. الأسئلة PDF على الجروبات، الحل بخط الإيد ويترفع PDF على لينك الدكتور خلال أسبوع.',
      say: 'خبر للانتساب 🎤 أسايمنت الإحصاء: إجباري، وكل واحد لوحده، والحل بخط إيدك!',
      points: [['❗', '<b>إجباري</b>، و<b>كل طالب لوحده</b> من غير مجموعات.'], ['📚', 'الأسئلة على <b>أول 4 أبواب</b>، و<b>PDF الأسئلة</b> اتبعت على الجروبات.'], ['⏳', 'التسليم خلال <b>أسبوع</b> من تاريخ PDF الأسئلة.'], ['🔗', '<b>لينك الرفع</b> الدكتور هيبعته النهارده أو بكرة بالكتير.'], ['✍️', 'الحل <b>بخط إيدك</b>، وبعدين تصوّر الصفحات وتحوّلها <b>PDF</b>.'], ['🪪', 'اكتب <b>اسمك بالكامل</b> و<b>كودك</b> و<b>الفرقة الثانية انتساب</b>.']],
      checks: ['نزّلت PDF الأسئلة من الجروب', 'كتبت اسمي وكودي في صفحة الغلاف', 'حلّيت بخط إيدي', 'صوّرت الصفحات وعملتها PDF', 'رفعته على لينك الدكتور (خلال أسبوع)'],
      cover: 'الإحصاء',
      wait: 'PDF الأسئلة على الجروبات. لينك الرفع الدكتور هيبعته النهارده أو بكرة، وأول ما ييجي هينزل هنا.',
      pdfOnly: true,
      solo: true,
      fileName: 'Assignment-Statistics.pdf',
      coverSub: 'الفرقة الثانية · انتساب'
    },
    {
      id: 'asg-eco-1', for: 'reg', kind: 'asg', date: '2026-11-15', link: DRIVE, cover: 'مبادئ الاقتصاد', wait: 'الأسئلة وصلت. حلّوها بخط إيدكم، صوّروا الصفحات وضيفوا الصور هنا، وأنا أعملهم PDF واحد بالغلاف.', pdfOnly: true, fileName: 'Assignment-Economics.pdf', grade: '15 درجة', warn: ['التكليف فيه جزء من <b>الفصل السادس (الاقتصاد المفتوح)</b> اللي لسه ماتشرحش. الأحسن تستنوا المحاضرة أو تتأكدوا من المعيد قبل الرفع.'], icon: '📝', title: 'أسايمنت الاقتصاد نزل! (انتظام)', short: 'بـ 15 درجة بدل الميدترم، تيم من 5 لـ 6، ويترفع PDF على الدرايف.',
      say: 'خبر عاجل 🎤 فيه أسايمنت اقتصاد بـ 15 درجة بدل الميدترم! تعالى أقولك التفاصيل',
      points: [
        ['🎯', 'الأسايمنت عليه <b>15 درجة</b> بدل الميدترم.'],
        ['👥', 'التيم من <b>4 لـ 6</b> طلاب (الأحسن 5 أو 6).'],
        ['✍️', 'يتكتب <b>بخط الإيد</b> على ورق عادي.'],
        ['🪪', 'أول صفحة: <b>أسامي كل التيم وأكوادهم</b>، واللي محوّل يتكتب جنب اسمه <b>«محوّل»</b>.'],
        ['📨', 'الأسئلة وصلت: <b>تطبيقات نموذج IS-LM</b> (7 أسئلة). حلّوها بنفسكم، وبعدين ضيفوا ملف الحل هنا وأنا أحط الغلاف أول صفحة.'],
        ['📸', 'الصفحات <b>تتصوّر</b> وتتحوّل <b>ملف PDF واحد</b>.'],
        ['☝️', '<b>واحد بس</b> من التيم يرفعه، <b>مرة واحدة</b> بس، على لينك الدرايف.'],
        ['📅', 'التسليم <b>آخر أسبوع في الدراسة</b>، والأفضل تسلّم قبل الميعاد.'],
        ['ℹ️', 'الدمج مش هيخضع للامتحان، بس اللي عايز يحله يحله عادي.'],
        ['⚠️', 'التكليف فيه جزء من <b>الفصل السادس (الاقتصاد المفتوح)</b> ولسه ماتشرحش. الأحسن تستنوا المحاضرة قبل الرفع.']
      ],
      checks: ['كوّنت تيم (5–6)', 'جمعت أسامي وأكواد التيم', 'عملت صفحة الغلاف', 'وصلت أسئلة الدكتور', 'حلّينا الأسئلة على ورق', 'صوّرنا الصفحات وعملناها PDF', 'واحد بس رفعه على الدرايف']
    },
    {
      id: 'eco-plan-1', kind: 'info', date: '2026-11-15', icon: '📚', title: 'خطة الاقتصاد لآخر الترم', short: '7 فصول: 4 اتشرحوا، الخامس اتلغى، والسادس والسابع في المحاضرتين الجايين.',
      say: 'خبر مهم في الاقتصاد 🎤 الفصل الخامس اتلغى! وفاضل حوالي 3 أسابيع',
      points: [
        ['📘', 'المنهج <b>7 فصول</b>، اتشرح منهم <b>4</b>.'],
        ['❌', '<b>الفصل الخامس اتلغى.</b>'],
        ['⏭️', 'الفصل <b>السادس والسابع</b> هيتشرحوا في المحاضرتين الجايين.'],
        ['🔁', 'آخر محاضرة <b>مراجعة</b>.'],
        ['✂️', 'حالات انتقال المنحنيات في التوازن <b>مش مطلوبة</b> في الامتحان، المطلوب <b>وضع التوازن</b> بس.'],
        ['⏳', 'فاضل حوالي <b>3 أسابيع</b> على آخر الدراسة.']
      ]
    }
  ];
  const News = {
    list: NEWS_DEFAULT.slice(),
    async load() {
      try { const r = await fetch('data/news.json', { cache: 'no-cache' }); if (!r.ok) return; const j = await r.json(); if (Array.isArray(j.items) && j.items.length) { this.list = j.items; if (Router.cur && ['home', 'news'].includes(Router.cur.name)) Router.render(); } } catch (e) { /* أوفلاين: النسخة اللي جوه */ }
    },
    seen() { const d = D(); return (d && d.newsSeen) || {}; },
    /** الأخبار اللي تخص الطالب ده: انتظام (reg) ولا انتساب (ext). لو لسه ماختارش بيشوف الكل */
    mine() { const t = track(); return this.list.filter(n => String(n.year || 2) === App.YEAR && (!n.for || !t || n.for === t)); },
    unseen() { const s = this.seen(); return this.mine().filter(n => !s[n.id]); },
    mark(id) { const d = D(); d.newsSeen = d.newsSeen || {}; if (!d.newsSeen[id]) { d.newsSeen[id] = now(); Store.save(); } },
    get(id) { return this.list.find(n => n.id === id); }
  };
  App.News = News;

  /* حالة كل أسايمنت لوحده (الاقتصاد متخزّن في d.asg من الأول) */
  const asg = id => { const d = D(); if (!id || id === 'asg-eco-1') return d.asg || (d.asg = { chk: {}, team: [] }); d.asgs = d.asgs || {}; return d.asgs[id] || (d.asgs[id] = { chk: {}, team: [] }); };
  /* انتظام ولا انتساب؟ */
  App.asgOf = asg;
  const TR = { reg: 'انتظام', ext: 'انتساب' };
  const track = () => { const d = D(); return d && TR[d.track] ? d.track : null; };
  const trPill = n => n.for ? ' <span class="pill ' + (n.for === 'ext' ? 'orange' : 'green') + '">' + TR[n.for] + '</span>' : '';
  function trackAskHTML(small) {
    const f = isF() || (App.bff && App.bff());
    return '<div class="card mb trask">' + Char.html('', small ? 46 : 58) + '<div style="flex:1"><b>' + (f ? 'إنتي' : 'إنت') + ' انتظام ولا انتساب؟ 🤔</b><div class="note">عشان أوريك الأخبار والأسايمنتات اللي تخصّك ' + (f ? 'إنتي' : 'إنت') + ' بس.</div><div class="btns mt"><button class="btn sm" data-tr="reg">🏫 انتظام</button><button class="btn sm tint" data-tr="ext">🏠 انتساب</button></div></div></div>';
  }
  function bindTrack(root) {
    $$('[data-tr]', root).forEach(b => b.onclick = () => {
      const d = D(); d.track = b.dataset.tr; Store.save(); haptic('success');
      toast('تمام، ' + (isF() ? 'إنتي' : 'إنت') + ' ' + TR[d.track] + ' ✓ هوريك الأخبار اللي تخصّك', 'check');
      Router.render();
      const nw = News.unseen()[0];
      if (nw && self.Pal && Pal.on()) setTimeout(() => { Props.pal('mic', 6000); Pal.say('🎤 ' + esc(nw.say || nw.title), 'happy', 5500, true); }, 700);
    });
  }
  App.track = track;

  Router.on('news', (view, r) => {
    const id = r.args[0], n = id && News.get(id);
    if (!n) {
      header(view, 'آخر الأخبار', { back: { to: 'home', label: 'الرئيسية' } });
      let h = (track() ? '' : trackAskHTML()) + '<div class="newshead">' + Char.html('', 70) + '<div class="bubble">' + (News.unseen().length ? 'معايا ' + News.unseen().length + ' ' + (News.unseen().length === 1 ? 'خبر جديد' : 'أخبار جديدة') + ' 🎤 دوس على أي خبر' : 'دي كل الأخبار لحد دلوقتي 🎤 أول ما يجي جديد هقولك') + '</div></div>';
      h += '<div class="group">' + News.mine().map(x => '<a class="row tap" href="#news/' + esc(x.id) + '"><span class="ic newsic">' + x.icon + '</span><span class="tx"><b>' + esc(x.title) + (track() ? '' : trPill(x)) + (News.seen()[x.id] ? '' : ' <span class="pill red">جديد</span>') + '</b><small>' + esc(x.short) + '</small></span>' + icon('chev', 'chev') + '</a>').join('') + '</div>';
      if (track()) h += '<p class="note center">بتشوف أخبار <b>' + TR[track()] + '</b> · <a href="#settings">غيّر</a></p>';
      view.insertAdjacentHTML('beforeend', h); bindTrack(view);
      setTimeout(() => { const c = $('.newshead .char', view); if (c) { Props.put(c, 'mic'); Char.act(c, 'happy'); } }, 200);
      return;
    }
    header(view, n.title, { back: { to: 'news', label: 'الأخبار' } });
    News.mark(n.id);
    let h = '<div class="newshead">' + Char.html('', 70) + '<div class="bubble">' + esc(n.say || n.short) + '</div></div>';
    h += '<div class="card mb newsbody"><ul class="pts">' + n.points.map(p => '<li><span>' + p[0] + '</span><div>' + p[1] + '</div></li>').join('') + '</ul></div>';
    if (n.go) h += '<a class="btn block mb green" href="' + esc(n.go) + '">' + esc(n.goT || 'افتح') + '</a>';
    if (n.kind === 'asg') h += '<a class="card tap solcard mb" href="#asgup/' + esc(n.id) + '">' + Char.html('', 46) + '<span style="flex:1"><b>📎 ضيف ملف حلّكم + الغلاف <span class="pill">مجاني</span></b><span class="note" style="display:block">إنتو بتحلّوا، وأنا بحط الغلاف بأسامي التيم أول صفحة في ملفكم (PDF أو Word) وأجهّزه للرفع.</span></span><span class="chev">‹</span></a>';
    if (n.kind === 'asg') {
      const A = asg(n.id), done = n.checks.filter((_, i) => A.chk[i]).length;
      h += '<div class="btns mb">' + (n.link ? '<a class="btn green" href="' + esc(n.link) + '" target="_blank" rel="noopener">📤 لينك التسليم</a>' : '') + '<a class="btn tint" href="#cover/' + esc(n.id) + '">🪪 اعمل صفحة الغلاف</a></div>';
      h += '<div class="group-h">جهّزت إيه؟ (' + done + ' من ' + n.checks.length + ')</div><div class="group">' + n.checks.map((c, i) => '<label class="row noicon chk"><input type="checkbox" data-ck="' + i + '"' + (A.chk[i] ? ' checked' : '') + '><span class="tx"><b>' + esc(c) + '</b></span></label>').join('') + '</div>';
      h += '<div class="card mb note">📨 ' + esc(n.wait || 'الأسئلة لسه ماوصلتش.') + ' و' + cname() + ' هيذاكرها معاك.</div>';
    }
    view.insertAdjacentHTML('beforeend', h);
    setTimeout(() => { const c = $('.newshead .char', view); if (c) { Props.put(c, 'mic'); Char.act(c, 'happy'); } }, 200);
    $$('[data-ck]', view).forEach(b => b.onchange = () => { const A = asg(n.id); A.chk[b.dataset.ck] = b.checked; Store.save(); if (b.checked) { haptic('success'); if (n.checks.every((_, i) => A.chk[i])) { toast('الأسايمنت جاهز 🎉', 'spark'); Awards.check(); } } Router.render(); });
  });

  /* صفحة الغلاف للأسايمنت */
  Router.on('cover', (view, r) => {
    const nid = r.args[0] || 'asg-eco-1', N = News.get(nid) || {}, subj = N.cover || 'مبادئ الاقتصاد', ci = Math.max(0, (N.checks || []).findIndex(c => /الغلاف/.test(c)));
    header(view, 'صفحة الغلاف', { back: { to: 'news/' + nid, label: 'الأسايمنت' } });
    const A = asg(nid); if (!A.team.length) A.team = [{ n: D().name || '', c: '', t: false }];
    const draw = () => {
      let h = N.solo ? '<div class="card mb note">👤 الأسايمنت ده <b>لكل طالب لوحده</b>: اكتب اسمك وكودك، وعلّم على «محوّل» لو إنت محوّل.</div>' : '<div class="card mb note">اكتب أسامي التيم وأكوادهم، وعلّم على «محوّل» للي محوّل. بعدها دوس «اطبع / احفظ PDF» وهتطلع صفحة أولى جاهزة.</div>';
      h += '<div class="group cover-in">' + A.team.map((m, i) => '<div class="row noicon cm"><span class="cm-n">' + (i + 1) + '</span><input class="input" data-f="n" data-i="' + i + '" placeholder="الاسم بالكامل" value="' + esc(m.n) + '"><input class="input" data-f="c" data-i="' + i + '" placeholder="الكود" inputmode="numeric" dir="ltr" value="' + esc(m.c) + '"><label class="cm-t"><input type="checkbox" data-f="t" data-i="' + i + '"' + (m.t ? ' checked' : '') + '> محوّل</label>' + (A.team.length > 1 ? '<button class="btn-x" data-del="' + i + '" aria-label="شيل">✕</button>' : '') + '</div>').join('') + '</div>';
      h += '<div class="btns mb">' + (A.team.length < (N.solo ? 1 : 6) ? '<button class="btn tint" id="cvAdd">' + icon('plus') + 'ضيف طالب</button>' : '') + '<button class="btn" id="cvPrint">🖨️ اطبع / احفظ PDF</button></div>';
      h += '<a class="btn block green mb" href="#asgup/' + esc(nid) + '">📎 ضيف ملف حلّكم والغلاف يتحط أول صفحة ←</a>';
      h += '<div class="cover-sheet" id="cvSheet"><div class="cv-t">Assignment</div><div class="cv-s">' + esc(subj) + '</div><table><thead><tr><th>#</th><th>الاسم</th><th>الكود</th><th></th></tr></thead><tbody>' + A.team.filter(m => m.n.trim()).map((m, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(m.n) + '</td><td dir="ltr">' + esc(m.c) + '</td><td>' + (m.t ? 'محوّل' : '') + '</td></tr>').join('') + '</tbody></table></div>';
      view.querySelectorAll('.cvx').forEach(x => x.remove());
      const w = document.createElement('div'); w.className = 'cvx'; w.innerHTML = h; view.appendChild(w);
      $$('[data-f]', w).forEach(inp => inp.oninput = inp.onchange = () => { const m = A.team[+inp.dataset.i]; if (inp.dataset.f === 't') m.t = inp.checked; else m[inp.dataset.f] = inp.value; Store.save(); const sh = $('#cvSheet'); if (sh && inp.dataset.f === 't') draw(); else if (sh) sh.querySelector('tbody').innerHTML = A.team.filter(x => x.n.trim()).map((x, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(x.n) + '</td><td dir="ltr">' + esc(x.c) + '</td><td>' + (x.t ? 'محوّل' : '') + '</td></tr>').join(''); });
      $$('[data-del]', w).forEach(b => b.onclick = () => { A.team.splice(+b.dataset.del, 1); Store.save(); draw(); });
      const ad = $('#cvAdd'); if (ad) ad.onclick = () => { A.team.push({ n: '', c: '', t: false }); Store.save(); draw(); const ins = $$('[data-f="n"]', w); setTimeout(() => { const l = $$('.cover-in [data-f="n"]'); l[l.length - 1].focus(); }, 30); };
      $('#cvPrint').onclick = () => { if (!A.team.some(m => m.n.trim())) return toast('اكتب اسم واحد على الأقل', 'info'); const ch = asg(nid).chk; ch[ci] = true; Store.save(); document.body.classList.add('printing'); setTimeout(() => { print(); setTimeout(() => document.body.classList.remove('printing'), 500); }, 50); };
    };
    draw();
  });

  /* ================= الجوايز ================= */
  const LEVELS = [[0, 'مبتدئ 🌱'], [200, 'شاطر 📗'], [600, 'متفوق 🚀'], [1500, 'نجم ⭐'], [3000, 'عبقري 🧠'], [6000, 'أسطورة 👑']];
  function facts() {
    const d = D(), at = d.attempts || [], ok = at.filter(a => a.ok).length, days = d.days || {};
    const teachDone = Object.keys(d.teach || {}).filter(k => /:done$/.test(k) && d.teach[k]).length;
    const boards = Object.values(d.board || {}).filter(b => b && b.done).length;
    const figs = Object.values(d.figs || {}).filter(f => f && f.best >= f.n).length;
    const lessons = Object.keys(d.lessonsDone || {}).filter(k => d.lessonsDone[k]).length;
    const cards = Object.values(days).reduce((s, x) => s + (x.cards || 0), 0);
    const maxMin = Object.values(days).reduce((m, x) => Math.max(m, x.min || 0), 0);
    const mar = Object.values(d.marathon || {}).reduce((s, m) => s + Object.keys((m && m.r) || {}).length, 0);
    const hours = at.map(a => new Date(a.t).getHours());
    const stars = new Set((App.allQuestions ? App.allQuestions() : []).filter(q => q.star).map(q => q.id));
    const starOk = new Set(at.filter(a => a.ok && stars.has(a.q)).map(a => a.q)).size;
    let fixed = 0; const wrong = {}; for (const a of at) { if (!a.ok) wrong[a.q] = 1; else if (wrong[a.q]) { fixed++; delete wrong[a.q]; } }
    const dk = Object.keys(days).filter(k => days[k].min || days[k].cards || days[k].q).sort();
    let comeback = false; for (let i = 1; i < dk.length; i++) if ((new Date(dk[i]) - new Date(dk[i - 1])) / 864e5 >= 3) comeback = true;
    const chat = (d.chat || []).filter(m => m.me || m.who === 'me' || m.from === 'me' || m.role === 'user').length;
    const asgDone = News.list.filter(n => n.kind === 'asg' && n.checks).some(n => { const A = asg(n.id); return n.checks.every((_, i) => A.chk[i]); });
    return { q: at.length, ok, teachDone, boards, figs, lessons, cards, maxMin, mar, night: hours.some(h => h >= 0 && h < 4), early: hours.some(h => h >= 4 && h < 7), starOk, fixed, comeback, chat, streak: Math.max(App.streakNow ? App.streakNow() : 0, d.bestStreak || 0), perfect: d.perfect || 0, asg: asgDone, sub: !!(self.Sub && Sub.on()) };
  }
  const AW = [
    ['first', '🐣', 'أول خطوة', 'حلّيت أول سؤال', f => [f.q, 1]],
    ['q50', '✏️', 'إيد سخنة', 'حلّيت 50 سؤال', f => [f.q, 50]],
    ['q200', '📚', 'دودة كتب', 'حلّيت 200 سؤال', f => [f.q, 200]],
    ['q500', '🏋️', 'وحش الأسئلة', 'حلّيت 500 سؤال', f => [f.q, 500]],
    ['ok100', '🎯', 'نشّان', '100 إجابة صح', f => [f.ok, 100]],
    ['star10', '⭐', 'صايد المتوقع', 'جاوبت 10 أسئلة متوقعة صح', f => [f.starOk, 10]],
    ['star50', '🌟', 'ملك المتوقع', 'جاوبت 50 سؤال متوقع صح', f => [f.starOk, 50]],
    ['perfect', '💯', 'العلامة الكاملة', 'امتحان 10 أسئلة أو أكتر من غير ولا غلطة', f => [f.perfect, 1]],
    ['fixed', '🩹', 'اتعلمت من غلطي', 'جاوبت صح سؤال كنت غلطت فيه قبل كده', f => [f.fixed, 1]],
    ['fixed20', '🛠️', 'مصلّح الأخطاء', 'صححت 20 غلطة قديمة', f => [f.fixed, 20]],
    ['lesson1', '📖', 'أول درس', 'قفلت درس كامل', f => [f.lessons, 1]],
    ['lesson5', '🗂️', 'خمسة على خمسة', 'قفلت 5 دروس', f => [f.lessons, 5]],
    ['teach1', '🎓', 'تلميذ سَنَد', 'ذاكرت درس كامل في «ذاكر معايا»', f => [f.teachDone, 1]],
    ['board1', '🎬', 'قدام البورد', 'تابعت شرح البورد لحد الآخر', f => [f.boards, 1]],
    ['board3', '🧑‍🏫', 'مدمن البورد', 'خلّصت 3 شروحات بورد', f => [f.boards, 3]],
    ['fig1', '🖼️', 'رسام', 'قفلت التدريب على رسمة', f => [f.figs, 1]],
    ['cards50', '🃏', 'ذاكرة حديد', 'راجعت 50 بطاقة', f => [f.cards, 50]],
    ['mar25', '🏃', 'عدّاء الماراثون', 'خلّصت 25 سؤال في الماراثون', f => [f.mar, 25]],
    ['streak3', '🔥', 'ولّعت', '3 أيام مذاكرة ورا بعض', f => [f.streak, 3]],
    ['streak7', '☄️', 'أسبوع نار', '7 أيام ورا بعض', f => [f.streak, 7]],
    ['streak14', '🌋', 'مابيقفش', '14 يوم ورا بعض', f => [f.streak, 14]],
    ['hour', '⏱️', 'ساعة تركيز', 'ذاكرت ساعة في يوم واحد', f => [f.maxMin, 60]],
    ['night', '🦉', 'بومة الليل', 'ذاكرت بعد نص الليل', f => [f.night ? 1 : 0, 1]],
    ['early', '🐓', 'صاحي بدري', 'ذاكرت قبل 7 الصبح', f => [f.early ? 1 : 0, 1]],
    ['comeback', '🔄', 'رجعت أقوى', 'رجعت تذاكر بعد غياب', f => [f.comeback ? 1 : 0, 1]],
    ['chat10', '💬', 'صاحب سَنَد', 'بعت 10 رسايل لسَنَد', f => [f.chat, 10]],
    ['asg', '📝', 'تيم الأسايمنت', 'جهّزت الأسايمنت كله', f => [f.asg ? 1 : 0, 1]],
    ['sub', '💎', 'مشترك مميز', 'فتحت كل الفصول', f => [f.sub ? 1 : 0, 1]]
  ];
  const Awards = {
    all() { const f = facts(), got = D().awards || {}; return AW.map(([id, ic, t, dsc, fn]) => { const [v, n] = fn(f); return { id, ic, t, d: dsc, v: Math.min(v, n), n, got: got[id] || (v >= n ? -1 : 0) }; }); },
    xp() { const f = facts(), d = D(); return f.q + f.ok * 2 + f.lessons * 15 + f.teachDone * 25 + f.boards * 20 + f.figs * 15 + Math.round(f.cards / 2) + Object.keys(d.awards || {}).length * 30; },
    level() { const x = this.xp(); let i = 0; while (i + 1 < LEVELS.length && x >= LEVELS[i + 1][0]) i++; const nx = LEVELS[i + 1]; return { i, name: LEVELS[i][1], xp: x, next: nx ? nx[0] : null, from: LEVELS[i][0] }; },
    check(quiet) {
      const d = D(); if (!d) return; d.awards = d.awards || {};
      const st = App.streakNow ? App.streakNow() : 0; if (st > (d.bestStreak || 0)) d.bestStreak = st;
      const fresh = this.all().filter(a => a.got === -1);
      if (!fresh.length) return;
      fresh.forEach(a => d.awards[a.id] = now()); Store.save();
      if (quiet || !d.awardsInit) { d.awardsInit = 1; Store.save(); return; }
      this.pop(fresh[0], fresh.length - 1);
    },
    pop(a, more) {
      if ($('.award-pop')) return;
      const w = document.createElement('div'); w.className = 'award-pop'; w.setAttribute('role', 'dialog');
      w.innerHTML = '<div class="ap-in"><div class="ap-ic">' + a.ic + '</div><div class="ap-k">جايزة جديدة!</div><b>' + esc(a.t) + '</b><small>' + esc(a.d) + '</small>' + (more > 0 ? '<small>و' + more + ' كمان 🎁</small>' : '') + '<div class="btns"><a class="btn" href="#awards">شوف الرف 🏆</a><button class="btn gray" data-x>حلو</button></div></div>';
      document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on')); beep('ok'); haptic('success');
      const close = () => { w.classList.remove('on'); setTimeout(() => w.remove(), 300); };
      w.onclick = e => { if (e.target === w || e.target.closest('[data-x]') || e.target.closest('a')) close(); };
      if (self.Pal && Pal.on()) { Props.pal('trophy', 4500); Pal.say(pick(isF() ? ['برافو عليكي يا فاطمة 🏆', 'جايزة جديدة على الرف 🤍'] : ['جايزة جديدة على الرف 🏆', 'إيه الحلاوة دي! كسبت «' + esc(a.t) + '»', 'فخور بيك 🏆']), 'cheer', 3600, true); }
    }
  };
  App.Awards = Awards;
  Router.on('awards', view => {
    Awards.check(true);
    const L = Awards.level(), list = Awards.all(), got = list.filter(a => a.got);
    header(view, 'جوايزي', { back: { to: 'home', label: 'الرئيسية' }, sub: got.length + ' من ' + list.length + ' جايزة' });
    const pct = L.next ? Math.round((L.xp - L.from) / (L.next - L.from) * 100) : 100;
    let h = '<div class="card mb lvl"><div class="lvl-r">' + Char.html('', 64) + '<div style="flex:1"><div class="lvl-n">' + L.name + '</div><div class="note">' + L.xp + ' نقطة' + (L.next ? ' · فاضل ' + (L.next - L.xp) + ' للمستوى الجاي' : ' · أعلى مستوى 👑') + '</div><div class="bar"><i style="width:' + pct + '%"></i></div></div></div></div>';
    const rows = []; for (let i = 0; i < list.length; i += 4) rows.push(list.slice(i, i + 4));
    h += '<div class="shelf">' + rows.map(r => '<div class="shelf-row">' + r.map(a => '<button class="aw' + (a.got ? ' got' : '') + '" data-aw="' + a.id + '"><span class="aw-ic">' + a.ic + '</span><span class="aw-t">' + esc(a.t) + '</span>' + (a.got ? '' : '<span class="aw-p"><i style="width:' + Math.round(a.v / a.n * 100) + '%"></i></span>') + '</button>').join('') + '</div><div class="plank"></div>').join('') + '</div>';
    view.insertAdjacentHTML('beforeend', h);
    $$('[data-aw]', view).forEach(b => b.onclick = () => { const a = list.find(x => x.id === b.dataset.aw); toast((a.got ? a.ic + ' ' : '🔒 ') + a.t + ': ' + a.d + (a.got ? '' : ' (' + a.v + '/' + a.n + ')'), a.got ? 'spark' : 'info'); });
    setTimeout(() => { const c = $('.lvl .char', view); if (c) { Props.put(c, 'trophy'); Char.act(c, 'happy'); } }, 250);
  });
  // نتيجة الامتحان: علامة كاملة
  const prevFinish = App.onQuizFinish;
  App.onQuizFinish = QZ => {
    if (prevFinish) prevFinish(QZ);
    const its = (QZ.qs || []).filter(it => !it.skipped && it.res);
    if (its.length >= 10 && its.every(it => it.res.ok)) { D().perfect = (D().perfect || 0) + 1; Store.save(); }
    setTimeout(() => Awards.check(), 600);
  };

  /* ================= وضعيات الشخصية (عصاية، مايك، نضارة، كاس، تاج) ================= */
  const PROP_SVG = {
    stick: '<g class="pp-stick"><line x1="214" y1="300" x2="330" y2="150" stroke="#7a4a21" stroke-width="10" stroke-linecap="round"/><line x1="214" y1="300" x2="330" y2="150" stroke="#a8693a" stroke-width="4" stroke-linecap="round"/><circle cx="332" cy="147" r="9" fill="#e53935"/><circle cx="222" cy="290" r="13" fill="#f2c39b" stroke="#6b3f22" stroke-width="3"/></g>',
    mic: '<g class="pp-mic"><rect x="214" y="222" width="14" height="74" rx="6" fill="#333"/><circle cx="221" cy="214" r="20" fill="#9aa0a6" stroke="#444" stroke-width="4"/><path d="M207 206h28M207 216h28" stroke="#666" stroke-width="3"/><circle cx="222" cy="290" r="13" fill="#f2c39b" stroke="#6b3f22" stroke-width="3"/></g>',
    glasses: '<g class="pp-gl" fill="rgba(255,255,255,.18)" stroke="#111" stroke-width="5"><rect x="50" y="116" width="40" height="36" rx="8"/><rect x="152" y="116" width="40" height="36" rx="8"/><path d="M90 130h62" fill="none"/></g>',
    trophy: '<g class="pp-tr"><path d="M104 196h64v26a32 32 0 0 1-64 0z" fill="#ffc107" stroke="#b8860b" stroke-width="4"/><path d="M104 204h-14a14 14 0 0 0 14 22M168 204h14a14 14 0 0 1-14 22" fill="none" stroke="#b8860b" stroke-width="5"/><rect x="128" y="252" width="16" height="22" fill="#ffb300"/><rect x="112" y="272" width="48" height="12" rx="3" fill="#8d6e63"/><text x="136" y="232" font-size="26" text-anchor="middle">★</text></g>',
    crown: '<g class="pp-cr"><path d="M84 40l18-36 30 28 30-28 18 36z" fill="#ffc107" stroke="#b8860b" stroke-width="4"/><circle cx="132" cy="20" r="6" fill="#e53935"/></g>',
    heart: '<g class="pp-ht"><path d="M300 90c-12-22-44-10-30 16l30 26 30-26c14-26-18-38-30-16z" fill="#ff5c8a"/></g>'
  };
  const Props = {
    put(charEl, name) {
      if (!charEl) return; this.clear(charEl); if (!PROP_SVG[name]) return;
      charEl.insertAdjacentHTML('beforeend', '<svg class="prop prop-' + name + '" viewBox="0 0 268 360" aria-hidden="true">' + PROP_SVG[name] + '</svg>');
    },
    clear(charEl) { if (charEl) charEl.querySelectorAll('.prop').forEach(p => p.remove()); },
    pal(name, ms) { if (!self.Pal || !Pal.el) return; const c = Pal.char(); this.put(c, name); clearTimeout(this.t); if (ms) this.t = setTimeout(() => { this.clear(c); Pal.base(); }, ms); }
  };
  App.Props = Props;

  /* ================= كلام سَنَد وقواعده ================= */
  const LINES = {
    m: ['كمّل، إنت ماشي صح 💪', 'كل سؤال بتحله دلوقتي درجة في الامتحان ✨', 'أنا شايف مجهودك، برافو عليك 👏', 'خطوة خطوة وهنقفل المنهج كله', 'لو تعبت خد دقيقتين واشرب مية وارجعلي 💧', 'اللي بتذاكره النهارده هتلاقيه في الورقة', 'دماغك شغالة حلو النهارده 🔥', 'ماتستعجلش، الفهم أهم من السرعة', 'فخور بيك والله 🤍', 'ركّز في الكلمات المفتاحية 🔑 هي اللي بتجيب الدرجة',
      'إنت أشطر مما إنت فاكر 😉', 'كل دقيقة دلوقتي بترتاح بيها ليلة الامتحان', 'الغلط هنا ببلاش، في الامتحان بدرجات 😅 فاغلط براحتك هنا', 'بطل! يلا حاجة كمان صغيرة', 'افتكر: الدكتور بيحب الكلمات المفتاحية', 'إنت كده بتبني الأساس صح 🧱', 'مافيش حد بيفهم كل حاجة من أول مرة، حتى أنا 😄', 'الاستمرار أهم من الكتير', 'حلو أوي التركيز ده 👌', 'كمان شوية وهتلاقي نفسك فاهم الفصل كله',
      'ابقى اشرح اللي فهمته لصاحبك، هتثبت معاك أكتر', 'لو حاجة مش واضحة اسألني، ماتكسفش 😄', 'الامتحان مش هيبقى صعب على اللي ذاكر زيك', 'ماشي بثقة 😎', 'نفسك طويل النهارده ماشاء الله', 'خليك فاكر الرسمة، بتيجي كتير', 'أنا معاك للآخر 🤝', 'وشك فيه نور المذاكرة 😂', 'شوية كمان وتستاهل استراحة حلوة ☕', 'الدرجة الكاملة بتبتدي من هنا 💯'],
    f: ['يا فطومة إنتي جامدة جدًا النهارده 🤍', 'كل ما بشوفك بتذاكري بفرح بيكي أكتر 🥹', 'شطورة يا قمر، كمّلي 🌸', 'إنتي أحلى وأشطر طالبة في الدنيا 💕', 'محمد فخور بيكي جدًا 🤍', 'خلّصي الحتة دي وأنا أقولك كلمة حلوة 😌', 'تعبتي؟ خدي نفس واشربي مية، أنا مستنيكي 🤍', 'يا بنتي دماغك ألماظ 💎', 'كل سؤال بتحليه بيقرّبك من الامتياز، وأنا متأكد منك', 'ركزي يا قمر، الكلمات المفتاحية هي اللي بتجيب الدرجة 🔑', 'إنتي بتعملي حاجة صعبة وبتعمليها حلو 👏', 'مفيش حد يستاهل النجاح قدّك 🤍', 'ابتسمي بقى 😄 المذاكرة معاكي أحلى',
      'كمّلي، إنتي ماشية صح 💪', 'كل سؤال بتحليه دلوقتي درجة في الامتحان ✨', 'شايف مجهودك يا فاطمة، برافو عليكي 👏', 'خطوة خطوة وهنقفل المنهج كله 🤍', 'لو تعبتي خدي دقيقتين واشربي مية وارجعيلي 💧', 'اللي بتذاكريه النهارده هتلاقيه في الورقة', 'دماغك شغالة حلو النهارده 🔥', 'ماتستعجليش، الفهم أهم من السرعة', 'فخور بيكي والله 🤍', 'ركّزي في الكلمات المفتاحية 🔑',
      'إنتي أشطر مما إنتي فاكرة 😉', 'محمد قالي أخلّي بالي منك في المذاكرة 🤍', 'الغلط هنا ببلاش، اغلطي براحتك 😄', 'بطلة! يلا حاجة صغيرة كمان', 'كمان شوية وهتلاقي نفسك فاهمة الفصل كله', 'أنا معاكي للآخر 🤝', 'شوية كمان وتستاهلي استراحة حلوة ☕', 'الدرجة الكاملة بتبتدي من هنا 💯', 'ماشاء الله عليكي النهارده 🌸', 'لو حاجة مش واضحة اسأليني 😄'],
    bad_m: ['ولا يهمك، الغلط هنا بيعلّم 🤍', 'اقرا الشرح على مهلك، دي بتتكرر', 'عادي، المرة الجاية هتيجي صح', 'بص على «باقي الاختيارات» تحت، هتفرق معاك', 'دي بالذات كتير بيغلطوا فيها، إنت مش لوحدك 😅'],
    bad_f: ['ولا يهمك يا حبيبتي، الغلطة دي عشان ماتتكررش في الامتحان 🤍', 'ماتزعليش نفسك يا قمري، حتى الشاطرين بيغلطوا 😌', 'دي بسيطة خالص، بصّي على الشرح وهتفتكريها على طول 🌸', 'يا ستي غلطة صغيرة، وإنتي أكبر منها بكتير 🤗', 'ولا يهمك يا قمر، دي بسيطة خالص 🤍', 'عادي يا فطومة، الغلط هنا عشان مايحصلش في الامتحان 😌', 'ماتزعليش، إنتي أشطر من سؤال 😄', 'ولا يهمك، الغلط هنا بيعلّم 🤍', 'اقري الشرح على مهلك، دي بتتكرر', 'عادي، المرة الجاية هتيجي صح', 'بصي على «باقي الاختيارات» تحت 👇', 'دي كتير بيغلطوا فيها، مش إنتي لوحدك 😅'],
    point: ['📌 دي مهمة! ركّز هنا', '👉 خد بالك من دي، بتيجي في الامتحان', '⚠️ الحتة دي بيغلطوا فيها كتير', '🔑 الكلمة المفتاحية هنا'],
    point_f: ['📌 دي مهمة! ركّزي هنا', '👉 خدي بالك من دي، بتيجي في الامتحان', '⚠️ الحتة دي بيغلطوا فيها كتير', '🔑 الكلمة المفتاحية هنا'],
    night: ['الوقت اتأخر 🌙 متنساش تنام كويس، النوم بيثبت المذاكرة', 'سهران؟ 🦉 خلّص الجزء ده ونام'],
    morning: ['صباح الفل ☀️ أحسن وقت للمذاكرة', 'صباح النشاط 🌞 دماغك فاضية ومستعدة'],
    streak: n => ['سلسلة ' + n + ' أيام ورا بعض 🔥 ماتقطعهاش', n + ' أيام ورا بعض! إنت كده محترف 😎']
  };
  const talk = () => (D() && D().settings.palTalk) || 'normal';
  const GAP = { more: 50000, normal: 150000, quiet: Infinity };
  if (self.Pal) {
    const P = self.Pal, rawSay = P.say.bind(P), rawHush = P.hush.bind(P), rawTap = P.tap.bind(P);
    let lastChat = 0, dism = [], quietTill = 0, nearTaps = 0;
    P.base = function () { const c = this.el && this.char(); if (!c) return; if (self.Sub && Sub.who() === 'owner') Props.put(c, 'crown'); else if (isF()) Props.put(c, 'heart'); else Props.clear(c); };
    P.say = function (html, mood, ms, force) {
      if (force === 'ev') { if (now() < quietTill || talk() === 'quiet') return; lastChat = now(); }
      else if (!force) {
        if (now() < quietTill || talk() === 'quiet') return;
        if (now() - lastChat < GAP[talk()]) return;
        lastChat = now();
      }
      rawSay(html, mood, ms);
    };
    P.hush = function () {
      const was = this.el && this.el.classList.contains('say');
      rawHush();
      if (was && now() - (this.userHush || 0) < 400 && now() - this.sayAt < 2500 && now() - this.sayAt > 150) { // قفل الفقاعة بإيده بسرعة = مضايق
        dism = dism.filter(t => now() - t < 600000).concat(now());
        if (dism.length >= 3) { dism = []; quietTill = now() + 20 * 60000; toast('تمام، هسكت شوية 🤐 (تقدر تغيّر كلامي من الإعدادات)', 'info'); }
      }
    };
    document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.pal-b')) P.userHush = now(); }, true);
    P.cheerLine = function () {
      const d = D(), st = App.streakNow(), h = new Date().getHours(), f = isF(), extra = [];
      const mins = ((d.days || {})[App.today()] || {}).min || 0;
      if (mins >= 10) extra.push((f ? 'ذاكرتي ' : 'ذاكرت ') + mins + ' دقيقة النهارده، جامد 👏');
      if (st >= 2) extra.push(...LINES.streak(st));
      if (h >= 0 && h < 4) extra.push(...LINES.night); else if (h >= 6 && h < 10) extra.push(...LINES.morning);
      const ex = App.upcomingExams()[0]; if (ex) { const l = E.daysBetween(new Date(), new Date(ex.date)); if (l > 0 && l <= 10) extra.push('فاضل ' + l + ' يوم على الامتحان، و' + (f ? 'إنتي ماشية' : 'إنت ماشي') + ' كويس 💪'); }
      // من غير تكرار: نشيل آخر 12 جملة اتقالت
      if (f && typeof sweet === 'function' && Math.random() < 0.5) return sweet(Math.random() < 0.5 ? 'da' : 'sh');
      if (App.bff && App.bff()) return bLine(Math.random() < 0.4 ? 'da' : 'sh');
      const pool = (Math.random() < 0.35 && extra.length ? extra : LINES[f ? 'f' : 'm']);
      P.used = P.used || []; let c = pool.filter(x => !P.used.includes(x)); if (!c.length) { P.used = []; c = pool; }
      const line = pick(c); P.used.push(line); if (P.used.length > 12) P.used.shift();
      return line;
    };
    const FOK = ['🤍', '💕', '🌸', '✨', '🥰'];
    const rawReact = P.react.bind(P);
    P.react = function (kind, n) {
      if (kind === 'bad' && this.on()) { this.wake(); Char.act(this.char(), 'sad'); if (Math.random() < 0.45) this.say(App.bff && App.bff() ? bLine('bad') : pick(LINES[isF() ? 'bad_f' : 'bad_m']), 'nod', 2600); return; }
      if (kind === 'ok' && this.on() && isF()) { this.wake(); this.hop(); Char.fx(this.char(), pick(FOK)); if (n && n % 3 === 0) this.say(pick([n + ' صح ورا بعض يا قمر 😍', 'إيه الشطارة دي يا فطومة 🤍 ' + n + ' صح!', 'محمد هيفرح أوي لما يعرف 🥹 ' + n + ' صح ورا بعض']), 'cheer', 2600, true); return; }
      if (kind === 'ok' && this.on() && n && n % 5 === 0) { rawReact('ok'); this.say(n + ' صح ورا بعض 🔥', 'fire', 2200, true); return; }
      rawReact(kind);
    };
    P.tap = function () {
      rawTap();
      const m = this.el && this.el.querySelector('.pal-menu'); if (!m || m.hidden) return;
      const extra = [['🏆 جوايزي', '#awards'], ['📰 آخر الأخبار', '#news']];
      m.insertAdjacentHTML('beforeend', extra.map(x => '<button data-px="' + x[1] + '">' + x[0] + '</button>').join(''));
      $$('[data-px]', m).forEach(b => b.onclick = e => { e.stopPropagation(); this.hideMenu(); Router.go(b.dataset.px.slice(1)); });
    };
    /** يشاور بالعصاية على حاجة مهمة في الصفحة */
    P.point = function (el) {
      if (!this.on() || this.calm || this.menuOn || this.dragging || talk() === 'quiet' || now() < quietTill) return;
      if (now() - (this.pointAt || 0) < (talk() === 'more' ? 60000 : 140000)) return;
      const r = el.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight - 40) return;
      this.pointAt = now();
      const b = this.bounds(), x = Math.max(b.x0, Math.min(b.x1, r.left - this.size * 0.95)), y = Math.max(b.y0, Math.min(b.yb, r.top + r.height / 2 - this.size * 0.55));
      this.pinnedTill = now() + 9000; this.walkTo(x, y);
      setTimeout(() => { if (!this.on()) return; Props.pal('stick', 6000); el.classList.add('pointed'); setTimeout(() => el.classList.remove('pointed'), 2400); rawSay(pick(LINES[isF() ? 'point_f' : 'point']), 'nod', 3800); lastChat = now(); }, this.reduced() ? 0 : 900);
    };
    // يبعد لو بيضايق: لو المستخدم داس جنبه مرتين يروح الناحية التانية
    document.addEventListener('pointerdown', e => {
      if (!P.on() || e.target.closest('#pal')) return;
      const r = P.el.getBoundingClientRect();
      if (e.clientX > r.left - 30 && e.clientX < r.right + 30 && e.clientY > r.top - 30 && e.clientY < r.bottom + 30) {
        if (++nearTaps >= 2) { nearTaps = 0; const bb = P.bounds(); P.pinnedTill = 0; P.walkTo(P.x < innerWidth / 2 ? bb.x1 : bb.x0, bb.yb); }
      } else nearTaps = 0;
    }, true);
    // صامت تمامًا جوه الامتحان
    const rawSync = P.sync.bind(P);
    P.sync = function () { rawSync(); if (this.el) { const r = Router.cur; if (r && r.name === 'quiz' && r.q.run) this.hush(); } };
  }
  // العصاية على البلوكات المهمة (⚠️ / 📝 / ⭐) في الدرس
  let io = null;
  function watchImportant(view) {
    if (io) io.disconnect(); if (!('IntersectionObserver' in self) || !self.Pal) return;
    const els = $$('.md blockquote, .md .warn, .callout, .md strong', view).filter(e => /⚠️|📝|⭐|مهم|بيجي في الامتحان|خد بالك/.test(e.textContent)).slice(0, 12);
    if (!els.length) return;
    io = new IntersectionObserver(ents => { ents.forEach(en => { if (en.isIntersecting && en.intersectionRatio > 0.9) setTimeout(() => { const r = en.target.getBoundingClientRect(); if (r.top > 70 && r.bottom < innerHeight - 40) Pal.point(en.target); }, 1600); }); }, { threshold: [0.9] });
    els.forEach(e => io.observe(e));
  }

  /* ================= الإعدادات: كلام سَنَد ================= */
  function settingsExtra(view) {
    const b = $('#sBuddy', view); if (!b) return;
    const row = b.closest('label, .row'); if (!row) return;
    const v = talk();
    row.insertAdjacentHTML('afterend', '<div class="row noicon"><span class="tx"><b>كلام ' + cname() + '</b><small>كتير: بيشجع أكتر · عادي · هادي: مابيتكلمش غير لما تكلمه</small></span><select id="sTalk" class="input sel">' + [['more', 'كتير'], ['normal', 'عادي'], ['quiet', 'هادي']].map(o => '<option value="' + o[0] + '"' + (o[0] === v ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div>');
    row.parentNode.querySelector('#sTalk').closest('.row').insertAdjacentHTML('afterend', '<button class="row tap noicon" id="sTour" style="width:100%;text-align:start"><span class="tx"><b>🧭 خلّي ' + cname() + ' يعرّفك على البرنامج</b><small>جولة سريعة بيشاورلك فيها على كل حاجة</small></span></button>');
    $('#sTour', view).onclick = () => Tour.start();
    $('#sTour', view).insertAdjacentHTML('afterend', '<div class="row noicon"><span class="tx"><b>انتظام ولا انتساب؟</b><small>عشان الأخبار والأسايمنتات اللي تخصّك</small></span><select id="sTrack" class="input sel"><option value="">مش محدد</option><option value="reg"' + (track() === 'reg' ? ' selected' : '') + '>انتظام</option><option value="ext"' + (track() === 'ext' ? ' selected' : '') + '>انتساب</option></select></div>');
    $('#sTrack', view).onchange = e => { D().track = e.target.value || null; Store.save(); toast(e.target.value ? 'تمام ✓ ' + TR[e.target.value] : 'هوريك كل الأخبار', 'check'); };
    $('#sTalk', view).onchange = e => { D().settings.palTalk = e.target.value; Store.save(); toast(e.target.value === 'quiet' ? 'تمام، هسكت ومش هتكلم غير لما تكلمني 🤐' : e.target.value === 'more' ? 'هشجعك أكتر 💪' : 'تمام 👌', 'check'); };
  }

  /* ================= الرئيسية: القايمة في الأول ================= */
  function homeExtra(view) {
    const nav = view.querySelector('.nav, header, .head'), hero = $('.hero', view);
    const on = self.Sub && Sub.on(), info = on && Sub.info(), un = News.unseen().length, aw = Object.keys(D().awards || {}).length;
    const tiles = [
      ['📚', 'المواد', '#subjects', ''],
      on ? ['💎', 'مشترك ✓', '#subscribe', info && info.label ? esc(info.label) : 'كل حاجة مفتوحة'] : ['⭐', 'اشتراك الترم', '#subscribe', (self.Sub ? Sub.PRICE : 99) + ' ج بس'],
      ['📰', 'آخر الأخبار', '#news', un ? '<span class="tbadge">' + un + '</span>' : ''],
      ['🏆', 'جوايزي', '#awards', aw ? aw + ' جايزة' : ''],
      ['💬', 'كلّم ' + cname(), '#chat', ''],
      ['📅', 'الجدول', '#plan', '']
    ];
    const h = '<nav class="mtiles" aria-label="القايمة">' + tiles.map(t => '<a class="mtile' + (t[2] === '#subscribe' && !on ? ' hot' : '') + '" href="' + t[2] + '"><span class="mt-ic">' + t[0] + '</span><b>' + t[1] + '</b>' + (t[3] ? '<small>' + t[3] + '</small>' : '') + '</a>').join('') + '</nav>';
    if (hero) hero.insertAdjacentHTML('beforebegin', h); else if (nav) nav.insertAdjacentHTML('afterend', h); else view.insertAdjacentHTML('afterbegin', h);
    if (!track()) { $('.mtiles', view).insertAdjacentHTML('afterend', trackAskHTML(true)); bindTrack(view); }
    const nw = News.unseen()[0];
    if (nw) {
      const at = $('.trask', view) || $('.mtiles', view);
      at.insertAdjacentHTML('afterend', '<a class="card tap newsbar mb" href="#news/' + esc(nw.id) + '">' + Char.html('', 48) + '<span style="flex:1"><span class="nb-k">🎤 آخر الأخبار</span><b>' + esc(nw.title) + '</b><span class="note" style="display:block">' + esc(nw.short) + '</span></span>' + icon('chev', 'chev') + '</a>');
      setTimeout(() => { const c = $('.newsbar .char', view); if (c) { Props.put(c, 'mic'); Char.act(c, 'happy'); } }, 300);
      if (self.Pal && Pal.on() && !sessionStorage.getItem('mz:newsSaid:' + nw.id)) { sessionStorage.setItem('mz:newsSaid:' + nw.id, 1); setTimeout(() => { if (!Pal.on() || !Router.cur || Router.cur.name !== 'home') return; Props.pal('mic', 6000); Pal.say('🎤 ' + esc(nw.say || nw.title), 'happy', 5500, true); }, 2600); }
    }
  }

  /* ================= المواد: الجاية قريب ================= */
  const SOON = App.YEAR === '1' ? [['🧾', 'مبادئ المحاسبة'], ['🔤', 'دراسات تجارية بلغة أجنبية']] : [['🏭', 'إدارة الإنتاج'], ['⚖️', 'القانون التجاري'], ['🧾', 'محاسبة الشركات'], ['📊', 'الإحصاء']];
  function subjectsExtra(view) {
    const sub = $('.subjects', view); if (!sub) return;
    const on = self.Sub && Sub.on(), have = new Set(App.SUBJ.map(x => x.name)), soon = SOON.filter(x => !have.has(x[1]));
    if (!soon.length) return;
    sub.insertAdjacentHTML('afterend', '<div class="group-h">قريبًا ⏳</div><div class="subjects soon">' + soon.map(s => '<div class="subj soon-c"><span class="ic soon-ic">' + s[0] + '</span><b>' + s[1] + '</b><small>قادم قريبًا' + (on ? ' · هتنزلك أوتوماتيك ✓' : ' · داخلة في الاشتراك') + '</small></div>').join('') + '</div>');
  }

  /* ================= وضع فاطمة: الشخصية (اللي هي شكل محمد) بتدلّعها ================= */
  /* تحيات كتير لكل وقت في اليوم، ومابتتكررش ورا بعض */
  const FG = {
    night: ['لسه صاحية يا قمري؟ 🌙 ذاكري حتة صغيرة ونامي، صحتك عندي أهم من أي امتحان 🤍', 'السهر ده مش عشانك يا فطومة 🥺 خمس دقايق وعلى السرير، اتفقنا؟', 'القمر طالع بره، بس اللي قدامي أحلى منه 🌙🤍 يلا حتة صغيرة ونامي', 'نامي بدري يا حبيبتي، دماغك الحلوة دي محتاجة ترتاح عشان تحفظ 😴💕'],
    morning: ['صباح الورد على أحلى ورد 🌸☀️', 'صباح الخير يا أجمل حاجة في يومي ☀️🤍 فطرتي؟', 'صحيتي يا قمر؟ الصبح بقى أحلى عشان إنتي فيه 🌼', 'صباح الفل يا فطومة، النهارده يومك وهتذاكري حلو 💪🌸', 'صباح السكر 🍯 اشربي حاجة سخنة وتعالي نبدأ بهدوء'],
    noon: ['أهلًا يا أحلى فاطمة في الدنيا 🤍 وحشتيني من الصبح', 'نوّرتي البرنامج يا قمر 🌟 يلا حتة حلوة سوا؟', 'أخيرًا جيتي 🥹 كنت مستنيكي', 'يا هلا بأشطر بنت 🌸 عاملة إيه النهارده؟', 'الضحكة دي كفاية تفتح أي فصل مقفول 😄🤍'],
    evening: ['مساء الفل يا قمري 🌙 أنا هنا جنبك، نذاكر شوية؟', 'مساء الورد يا فطومة 🌹 يومك كان عامل إيه؟', 'تعبتي النهارده؟ تعالي نذاكر حاجة خفيفة مع بعض 🤍', 'المسا حلو بس إنتي أحلى 🌙✨ يلا نقفل حتة صغيرة', 'وحشتيني طول اليوم 🥺🤍 يلا قعدة مذاكرة حلوة']
  };
  const deck = (key, pool) => { // كل مرة جملة جديدة لحد ما الكل يخلص، وبعدين يتلخبطوا من جديد
    let st = {}; try { st = JSON.parse(localStorage.getItem('mz:deck:' + key) || '{}'); } catch (e) {}
    if (!Array.isArray(st.o) || st.n !== pool.length || st.i >= st.o.length) { const o = pool.map((_, i) => i).sort(() => Math.random() - 0.5); if (st.last != null && o[0] === st.last && o.length > 1) o.push(o.shift()); st = { o, i: 0, n: pool.length }; }
    const k = st.o[st.i++]; st.last = k; localStorage.setItem('mz:deck:' + key, JSON.stringify(st)); return pool[k];
  };
  const slot = () => { const h = new Date().getHours(); return h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'noon' : h < 23 ? 'evening' : 'night'; };
  const FGREET = () => deck('fg-' + slot(), FG[slot()]);

  /* دلّعني: كلام حلو من محمد */
  const DALAA = [
    'إنتي أحلى حاجة حصلتلي يا فطومة 🤍', 'لو الجمال مادة، كنتي واخدة فيه امتياز من غير ما تذاكري 😌💕', 'ضحكتك دي بتنوّر الشاشة أكتر من الـ brightness 😄✨',
    'أنا عملت البرنامج ده كله عشان أبقى جنبك وإنتي بتذاكري 🥹', 'إنتي القمر، والنجوم بتغير منك 🌙⭐', 'كل حاجة فيكي حلوة، حتى وإنتي زهقانة من المذاكرة 😂🤍',
    'يا بختي بيكي والله 🥰', 'لو تعرفي أنا فخور بيكي قد إيه، هتتكسفي 🙈', 'إنتي مش محتاجة فلتر، إنتي الفلتر 😌📸',
    'قلبي بيعمل «صح ✅» كل ما بشوفك', 'إنتي السبب إن اليوم بيحلو 🌸', 'يا أجمل فاطمة في الكون، وده مش رأيي بس، ده رأي الكون كله 🌍💕',
    'حتى البرنامج بيحبك، اسأليه 😂🤍', 'وجودك في حياتي هو أحلى «سؤال متوقع» جالي ⭐', 'لو هختار من الدنيا كلها، هختارك إنتي كل مرة 🤍',
    'إنتي سكر، والسكر بيغير منك 🍬', 'عيونك دي محتاجة فصل لوحدها في المنهج 😍', 'يا ست البنات 👑',
    'إنتي مش بس شاطرة، إنتي شاطرة وحلوة وطيبة، حظي حلو أوي 🥹', 'كل ما أتعب بفتكرك فأفرح 🤍', 'الورد لو شافك هيسأل: إنتي بتعملي إيه عشان تبقي حلوة كده؟ 🌹',
    'إنتي «المضاعف» بتاع سعادتي، كل حاجة بتتضاعف معاكي 😂💕', 'بعيدًا عن الاقتصاد والتسويق… إنتي أهم حاجة عندي 🤍', 'الدنيا كلها نقطة توازن، وإنتي نقطة توازني 😌⚖️',
    'نفسي أشوف ضحكتك دلوقتي 🥺', 'إنتي الكود الوحيد اللي مفتوح في قلبي من غير اشتراك 🔓🤍', 'يا فطومتي يا جميلة 🌸',
    'لو زعلانة من حاجة، قوليلي، وأنا أصالحك عليها 🤗', 'إنتي تستاهلي الدنيا وما فيها، وأنا بحاول أجيبهالك حتة حتة 🤍', 'إنتي النور اللي في الأوضة دي حرفيًا ✨',
    'بحبك قد عدد أسئلة البنك كله… وأكتر 😂🤍', 'صوتك في دماغي أحلى من أي شرح 🎶', 'إنتي كتير عليا والله 🥹',
    'لو فيه جايزة لأحلى بنت، الرف بتاعها هيبقى بتاعك لوحدك 🏆💕', 'مفيش فلتر في الدنيا يعرف يحلّيكي أكتر من كده 😌', 'خليكي فاكرة إن فيه حد شايفك أحلى واحدة في الدنيا 🤍',
    'كل حاجة بتعمليها بتبقى حلوة عشان إنتي اللي عملاها 🌸', 'إنتي مش هتصدقي أنا بفكر فيكي قد إيه 🙈', 'يا حلوة يا ست الحلوين 🍓',
    'لو ينفع أبعتلك ورد من الشاشة، كنت بعتلك جنينة 💐', 'إنتي أحلى من الدرجة النهائية نفسها 😂', 'قلبي اختارك من غير ما يسأل حد 🤍',
    'مهما يحصل، أنا في صفّك دايمًا 🤝🤍', 'ابتسمي عشان خاطري 😊', 'إنتي البطلة في القصة دي كلها 👑',
    'يا رب يديمك ليا 🤲🤍', 'إنتي الحاجة اللي بتخلّي أي يوم تقيل يعدي 🌈', 'لو الحب بالدرجات، إنتي واخدة 100 من 100 ومعاها بونص 💯💕',
    'شكلك حلو حتى وإنتي مركزة وزمّة بوقك 😂🤍', 'أنا محظوظ إنك في حياتي، وهفضل أقولها كل يوم 🥹', 'إنتي حلم وأنا مش عايز أصحى منه 🌙'
  ];
  /* شجّعني: تحفيز من محمد */
  const SHAGA3 = [
    'إنتي قدها وقدود يا فطومة 💪🤍', 'أنا واثق فيكي أكتر من ثقتي في نفسي 🥹', 'خطوة صغيرة كل يوم، وهتلاقي نفسك خلّصتي المنهج 🌱',
    'مفيش حاجة صعبة على دماغك الحلوة دي 🧠✨', 'الامتحان هيتكسف منك 😌', 'إنتي مش بتذاكري عشان الدرجة بس، إنتي بتبني مستقبلك، وأنا فخور بيكي 🤍',
    'كل سؤال بتحليه دلوقتي هو درجة في جيبك 💰', 'تعبك ده مش هيروح على الفاضي، أوعدك 🤞', 'لو وقعتي في سؤال، قومي وجربي اللي بعده، ده كل الموضوع 💪',
    'إنتي أشطر بكتير مما إنتي فاكرة 🌟', 'يلا يا بطلة، خمس أسئلة بس وبعدين استراحة 🍫', 'أنا شايفك في الامتياز من دلوقتي 🎓',
    'المذاكرة صعبة، بس إنتي أصعب منها 😎', 'افتكري ليه بدأتي، وكمّلي عشان نفسك 🤍', 'ركّزي ربع ساعة بس، وأنا مستنيكي بكلمة حلوة في الآخر 😌',
    'كل فصل بتقفليه، بفرح كأني أنا اللي قفلته 🥹', 'مش لازم تبقي perfect، كفاية إنك بتحاولي، وده بيكفيني 🤍', 'إنتي عملتيها قبل كده، وهتعمليها تاني 💪',
    'الخوف ده طبيعي، بس إنتي أقوى منه بكتير 🦁', 'نفس عميق… كوباية مية… وقومي نخلّص حتة صغيرة 💧', 'الدكتور هيشوف ورقتك ويقول: إيه الشطارة دي 😂',
    'كل دقيقة بتذاكريها دلوقتي، هتريحك ليلة الامتحان 🌙', 'إنتي مش لوحدك، أنا معاكي في كل سؤال 🤝', 'يلا نجيب الامتياز ونحتفل سوا 🎉',
    'الشطارة مش إنك ماتغلطيش، الشطارة إنك تتعلمي من الغلط، وإنتي بتعملي كده 👏', 'المنهج كله فصول قليلة، وإنتي قدهم وزيادة 📚', 'دماغك شغالة حلو النهارده، استغليها 🔥',
    'لو زهقتي، اقفلي وتعالي بعد عشر دقايق، أنا مش رايح في حتة 🤍', 'إنتي النجمة ⭐ والباقي كومبارس 😂', 'هتنجحي، وهتنجحي حلو، وأنا هبقى أول واحد يباركلك 🥳',
    'كمّلي يا قمري، فاضل شوية صغيرين 🏁', 'المجهود اللي بتعمليه دلوقتي، هتحمدي ربنا عليه بعدين 🤲', 'إنتي بطلة الحكاية دي، وأنا بشجّع من المدرجات 📣',
    'مافيش حاجة اسمها «مش هعرف»، فيه «هعرف بس محتاجة وقت» 💪', 'خلّي الهدف قدام عينك، والباقي سيبيه عليا وعلى سَنَد 😄', 'ورقة الامتحان هتبقى سهلة عشان إنتي مستعدة 📝',
    'ابدئي بالأسهل، وكل صح هيشجعك على اللي بعده ✅', 'التعب ده هيتحول فرحة يوم النتيجة 🎊', 'أنا عارف إنك تقدري، فخلّيكي إنتي كمان عارفة 🤍',
    'يلا نخلّي النهارده يوم حلو في المذاكرة 🌸', 'فاكرة أول مرة ماكنتيش فاهمة؟ شوفي دلوقتي بقيتي فين 🥹', 'كل ما تخلّصي جزء، اكافئي نفسك بحاجة حلوة 🍰'
  ];
  /* كلام حسب اللي عملته النهارده */
  function fctx(kind) {
    const d = D(), mins = ((d.days || {})[App.today()] || {}).min || 0, q = ((d.days || {})[App.today()] || {}).q || 0, st = App.streakNow(), out = [];
    if (kind === 'sh') {
      if (q >= 10) out.push('حلّيتي ' + q + ' سؤال النهارده! 🔥 إنتي مش طبيعية والله');
      if (mins >= 30) out.push(mins + ' دقيقة مذاكرة النهارده 🥹 أنا فخور بيكي جدًا');
      if (st >= 2) out.push(st + ' أيام ورا بعض يا فطومة 🔥 ماتقطعيهاش عشان خاطري');
      const ex = App.upcomingExams()[0]; if (ex) { const l = E.daysBetween(new Date(), new Date(ex.date)); if (l > 0 && l <= 14) out.push('فاضل ' + l + ' يوم على الامتحان، وإنتي مستعدة أكتر مما تتخيلي 💪'); }
    } else {
      const h = new Date().getHours();
      if (h < 5 || h >= 23) out.push('الساعة اتأخرت يا قمري 🌙 نامي وإنتي مبسوطة، وبكرة نكمّل سوا 🤍');
      if (mins >= 20) out.push('ذاكرتي ' + mins + ' دقيقة؟ تعالي بقى أدلّعك شوية 🥰');
    }
    return out;
  }
  const sweet = kind => { const c = fctx(kind); return c.length && Math.random() < 0.3 ? c[Math.floor(Math.random() * c.length)] : deck(kind === 'sh' ? 'sh' : 'da', kind === 'sh' ? SHAGA3 : DALAA); };
  /* قلوب طايرة */
  function hearts(el, n, set) {
    if (!el || document.documentElement.dataset.motion === 'reduce' || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    for (let i = 0; i < (n || 7); i++) { const h = document.createElement('span'); h.className = 'hfly'; h.textContent = (set || ['💕', '🤍', '💗', '🌸', '✨'])[i % (set || [1, 2, 3, 4, 5]).length]; h.style.setProperty('--x', (Math.random() * 80 - 40) + 'px'); h.style.setProperty('--d', (0.9 + Math.random() * 0.9) + 's'); h.style.animationDelay = (i * 0.08) + 's'; h.style.left = (30 + Math.random() * 40) + '%'; el.appendChild(h); setTimeout(() => h.remove(), 2200); }
  }
  App.fatmaSay = kind => {
    if (!self.Pal || !Pal.el) return;
    const line = sweet(kind);
    Props.pal(kind === 'sh' ? 'thumbs' : 'heart', 6000);
    Pal.say(line, kind === 'sh' ? 'cheer' : 'happy', 6500, true);
    hearts(Pal.el.querySelector('.pal-c'), kind === 'sh' ? 6 : 9, kind === 'sh' ? ['💪', '⭐', '🔥', '🤍', '✨'] : null);
    haptic('success');
  };
  if (self.Pal) {
    const P = self.Pal, tf = P.tap.bind(P);
    P.tap = function () {
      tf();
      if (!isF()) return;
      const m = this.el && this.el.querySelector('.pal-menu'); if (!m || m.hidden) return;
      $$('button', m).forEach(b => { if (/شجعني/.test(b.textContent) && !b.dataset.fz) b.remove(); });
      const hd = m.querySelector('.pal-mh'), fz = '<button data-fz="da" class="fz">💗 دلّعني</button><button data-fz="sh" class="fz">💪 شجّعني</button>';
      if (hd) hd.insertAdjacentHTML('afterend', fz); else m.insertAdjacentHTML('afterbegin', fz);
      // (3) القايمة بصيغة المؤنث
      $$('button:not([data-fz])', m).forEach(b => { b.textContent = b.textContent.replace('ذاكر «', 'ذاكري «').replace(/^👉 راجع /, '👉 راجعي ').replace(/^👉 كمّل /, '👉 كمّلي ').replace(/^👉 ضيف /, '👉 ضيفي '); });
      $$('[data-fz]', m).forEach(b => b.onclick = e => { e.stopPropagation(); this.hideMenu(); App.fatmaSay(b.dataset.fz); });
      const h = m.querySelector('.pal-mh'); if (h) h.textContent = 'محمد معاكي يا قمر، عايزة إيه؟ 🤍';
    };
  }
  function fatmaHome(view) {
    const b = $('#homeBubble', view); if (!b) return;
    const d = D(), st = App.streakNow(), mins = ((d.days || {})[App.today()] || {}).min || 0;
    b.innerHTML = FGREET() + (mins >= 20 ? '<br>ذاكرتي ' + mins + ' دقيقة النهارده، أنا فخور بيكي 🥹' : st >= 2 ? '<br>' + st + ' أيام ورا بعض 🔥 ماتقطعيهاش عشان خاطري' : '');
    b.insertAdjacentHTML('beforeend', '<div class="fzrow"><button class="chip fz" data-hz="da">💗 دلّعني</button><button class="chip fz" data-hz="sh">💪 شجّعني</button></div>');
    const c = $('.hero .char', view); if (c) { Props.put(c, 'heart'); setTimeout(() => Char.act(c, 'happy'), 500); }
    $$('[data-hz]', b).forEach(x => x.onclick = () => {
      const k = x.dataset.hz, row = $('.fzrow', b); b.innerHTML = sweet(k); b.appendChild(row);
      if (c) { Props.put(c, k === 'sh' ? 'thumbs' : 'heart'); Char.act(c, k === 'sh' ? 'cheer' : 'happy'); hearts(c, k === 'sh' ? 6 : 9, k === 'sh' ? ['💪', '⭐', '🔥', '🤍', '✨'] : null); }
      haptic('success');
    });
  }
  App.fatma = isF;

  /* ================= وضع البيست فريندو (چني): محمد بيدعمها وبيناديها مرة «چني» ومرة «بيستو فريندو» ================= */
  const isB = () => !!(self.Sub && Sub.who() === 'bff');
  App.bff = isB;
  const BN = ['چني', 'بيستو فريندو', 'چني', 'يا بيست'];
  let bnI = Math.floor(Math.random() * BN.length);
  const bn = () => { bnI = (bnI + 1) % BN.length; return BN[bnI]; };
  const fillN = t => t.replace(/\{n\}/g, () => bn().replace(/^يا /, ''));
  const BG = {
    night: ['لسه صاحية يا {n}؟ 🌙 ذاكري حتة صغيرة ونامي، الدماغ محتاجة ترتاح 💜', 'السهر ده مش حلو يا {n} 😅 خمس دقايق وعلى النوم', 'نامي بدري يا {n}، بكرة نكمّل سوا 💜'],
    morning: ['صباح الخير يا {n} ☀️💜 جاهزة نكسّر الدنيا النهارده؟', 'صباح الفل يا {n} 🌼 فطرتي؟ يلا نبدأ بهدوء', 'صحيتي يا {n}؟ النهارده يومك 💪'],
    noon: ['أهلًا يا {n} 💜 وحشتيني، يلا حتة مذاكرة سوا؟', 'نوّرتي يا {n} 🌟 عاملة إيه النهارده؟', 'يا هلا بـ{n} 😄 جاهزة؟'],
    evening: ['مساء الفل يا {n} 🌙 يلا نذاكر شوية ونرتاح؟', 'مساء الورد يا {n} 💜 يومك كان عامل إيه؟', 'تعبتي النهارده يا {n}؟ تعالي نعمل حاجة خفيفة سوا']
  };
  const BDA = [
    'إنتي أجدع صاحبة في الدنيا يا {n} 💜', 'أنا في ضهرك دايمًا يا {n}، مهما يحصل 🤝', 'يا {n}، إنتي مش لوحدك أبدًا، أنا هنا 💜',
    'وجودك في حياتي نعمة يا {n} 🌟', 'أي حاجة تضايقك قوليلي يا {n}، وأنا أحلّها معاكي 🤗', 'يا {n} إنتي أكتر حد بيفهمني 😂💜',
    'البيست فريندو بتاعتي أحسن من أي حد 💜', 'محدش يقدر يزعّلك وأنا موجود يا {n} 😤💜', 'إنتي قوية أكتر ما إنتي متخيلة يا {n} 💪',
    'لو الدنيا قفلت، اضحكي وأنا أفتحها 😄', 'يا {n} إنتي ماشاء الله عليكي في كل حاجة 🌸', 'صحابتك دي أحلى حاجة حصلتلي 🤝💜',
    'يا {n}، خدي نفس… كل حاجة هتبقى تمام، وعد 🤞', 'ابتسمي يا {n} 😄 الضحكة دي بتفرق', 'أنا فخور إنك صاحبتي يا {n} 🥹💜',
    'مهما تغيبي، مكانك محفوظ يا {n} 💜', 'يا {n} إنتي الضحكة اللي في اليوم الوحش 😂', 'دايمًا جنبك يا {n}، في المذاكرة وفي غيرها 💜',
    'لو زعلانة من حاجة، أنا جاهز أسمعك يا {n} 👂💜', 'يا {n}، ماحدش زيك والله 🌟', 'البيستو فريندو تستاهل كل حاجة حلوة 💜',
    'يا {n} إنتي بطلة، حتى في الأيام التقيلة 🦸‍♀️', 'هنعدّي الترم ده سوا يا {n} 🤝', 'إنتي مش محتاجة حد يقولك إنك جامدة… بس هقولها برضه: جامدة 😎💜',
    'يا {n} لو تعبتي، قوليلي وأنا أذاكرلك الحتة الصعبة 😄', 'الصحاب اللي زيك قليلين يا {n} 💜', 'كل ما أشوفك بتذاكري بفرح بيكي يا {n} 🥹',
    'يا {n} إنتي دايمًا بتعرفي تطلّعي من أي حاجة 💪', 'صاحبتي الجدعة 💜 ربنا يخليكي', 'يا {n}، النهارده هيعدي حلو، أنا متأكد 🌈'
  ];
  const BSH = [
    'يلا يا {n}، إنتي قدها وقدود 💪', 'كمّلي يا {n}، فاضل شوية صغيرين 🏁', 'يا {n} دماغك ألماظ، يلا نخلّص الفصل ده 💎',
    'خطوة صغيرة كل يوم يا {n} وهتلاقي نفسك خلصتي المنهج 🌱', 'الامتحان هيتكسف منك يا {n} 😎', 'يلا يا {n}، 5 أسئلة بس وبعدين استراحة 🍫',
    'شطورة يا {n} 👏 كمّلي', 'إنتي بتعملي حاجة صعبة وبتعمليها حلو يا {n}', 'يا {n} لو غلطتي، عادي، المهم تتعلمي 💜',
    'أنا شايفك في الامتياز يا {n} 🎓', 'ركّزي ربع ساعة بس يا {n}، وأنا مستنيكي بكلمة حلوة 😄', 'يا {n} التعب ده هيتحول فرحة يوم النتيجة 🎊',
    'يلا نجيب الامتياز ونحتفل سوا يا {n} 🎉', 'يا {n} إنتي عملتيها قبل كده، وهتعمليها تاني 💪', 'نفس عميق… كوباية مية… وقومي يا {n} 💧',
    'يا {n} الخوف ده طبيعي، بس إنتي أقوى منه 🦁', 'كل فصل بتقفليه بفرح كأني أنا اللي قفلته يا {n} 🥹', 'يا {n} ابدئي بالأسهل، وكل صح هيشجعك 👌'
  ];
  const BBAD = ['ولا يهمك يا {n} 😂 كلنا بنغلط', 'عادي يا {n}، الغلط هنا ببلاش 💜', 'دي بسيطة يا {n}، اقري الشرح وهتفتكريها', 'ماتزعليش يا {n}، المرة الجاية صح 💪'];
  const bLine = k => fillN(deck('b-' + k, k === 'da' ? BDA : k === 'sh' ? BSH : BBAD));
  const BGREET = () => fillN(deck('bg-' + slot(), BG[slot()]));
  const BSET = ['💜', '🤝', '✨', '🌟', '💫'];
  App.bffSay = kind => {
    if (!self.Pal || !Pal.el) return;
    Props.pal(kind === 'sh' ? 'thumbs' : 'wave', 6000);
    Pal.say(bLine(kind), kind === 'sh' ? 'cheer' : 'happy', 6500, true);
    hearts(Pal.el.querySelector('.pal-c'), 8, kind === 'sh' ? ['💪', '⭐', '🔥', '💜', '✨'] : BSET);
    haptic('success');
  };
  if (self.Pal) {
    const P = self.Pal, tb = P.tap.bind(P);
    P.tap = function () {
      tb();
      if (!isB()) return;
      const m = this.el && this.el.querySelector('.pal-menu'); if (!m || m.hidden) return;
      $$('button', m).forEach(b => { if (/شجعني/.test(b.textContent) && !b.dataset.bf) b.remove(); });
      const hd = m.querySelector('.pal-mh'), bf = '<button data-bf="da" class="fz bf">💜 دعم البيست فريندو</button><button data-bf="sh" class="fz bf">💪 شجّعني</button>';
      if (hd) { hd.insertAdjacentHTML('afterend', bf); hd.textContent = fillN('محمد معاكي يا {n}، عايزة إيه؟ 💜'); } else m.insertAdjacentHTML('afterbegin', bf);
      $$('button:not([data-bf])', m).forEach(b => { b.textContent = b.textContent.replace('ذاكر «', 'ذاكري «').replace(/^👉 راجع /, '👉 راجعي ').replace(/^👉 كمّل /, '👉 كمّلي ').replace(/^👉 ضيف /, '👉 ضيفي '); });
      $$('[data-bf]', m).forEach(b => b.onclick = e => { e.stopPropagation(); this.hideMenu(); App.bffSay(b.dataset.bf); });
    };
  }
  function bffHome(view) {
    const b = $('#homeBubble', view); if (!b) return;
    const d = D(), st = App.streakNow(), mins = ((d.days || {})[App.today()] || {}).min || 0;
    b.innerHTML = BGREET() + (mins >= 20 ? '<br>' + fillN('ذاكرتي ' + mins + ' دقيقة النهارده يا {n}، جامدة 👏') : st >= 2 ? '<br>' + fillN(st + ' أيام ورا بعض يا {n} 🔥 ماتقطعيهاش') : '');
    b.insertAdjacentHTML('beforeend', '<div class="fzrow"><button class="chip fz bf" data-hb="da">💜 دعم البيست فريندو</button><button class="chip fz" data-hb="sh">💪 شجّعني</button></div>');
    const c = $('.hero .char', view); if (c) { Props.put(c, 'wave'); setTimeout(() => Char.act(c, 'happy'), 500); }
    $$('[data-hb]', b).forEach(x => x.onclick = () => {
      const k = x.dataset.hb, row = $('.fzrow', b); b.innerHTML = bLine(k); b.appendChild(row);
      if (c) { Props.put(c, k === 'sh' ? 'thumbs' : 'wave'); Char.act(c, k === 'sh' ? 'cheer' : 'happy'); hearts(c, 8, k === 'sh' ? ['💪', '⭐', '🔥', '💜', '✨'] : BSET); }
      haptic('success');
    });
  }

  /* ================= بعد كل صفحة ================= */
  App.afterRender = (view, r) => {
    try {
      if (!Store.data) return;
      if (r.name === 'home' && $('.hero', view)) { homeExtra(view); if (isF()) fatmaHome(view); else if (isB()) bffHome(view); }
      else if (r.name === 'subjects') subjectsExtra(view);
      else if (r.name === 'settings') settingsExtra(view);
      if (r.name === 'lesson' || r.name === 'teach') setTimeout(() => watchImportant(view), 800); else if (io) { io.disconnect(); io = null; }
      if (self.Pal && Pal.el) { if (!Pal.el.querySelector('.prop')) Pal.base(); }
    } catch (e) { console.error(e); }
  };

  /* ================= ترحيب بعد التفعيل ================= */
  function welcome() {
    const w = sessionStorage.getItem('mz:welcome'); if (!w) return; sessionStorage.removeItem('mz:welcome');
    const T = {
      owner: ['👑', 'أهلًا يا مخترع!', 'النسخة الكاملة مفتوحة كلها ليك. يلا نكسّر الدنيا 😎'],
      bff: ['💜', 'أهلًا يا بيستو فريندو!', 'النسخة دي VIP هدية من محمد لچني 💜 كل المواد والفصول مفتوحة، وأنا هفضل أشجعك وأدعمك طول الترم. يلا بينا!'],
      fatma: ['🤍', 'أهلًا يا فاطمة', 'النسخة دي هدية من محمد 🤍 كل المواد والفصول مفتوحة ليكي، وأنا معاكي في كل خطوة.'],
      hagar: ['🎉', 'اشتراكك اتفعّل!', 'وابسطي يا ستي، باقة الـ 200 ⭐ VIP عشان صورة بروفايلك حلوة 😂 كل المواد والفصول مفتوحة ليكي لحد آخر الترم.'],
      aya: ['👑', 'أهلًا يا فتكات 😂', 'إنتي VIP يا يويو ⭐ كل المواد والفصول والبورد والامتحانات مفتوحة ليكي لحد آخر الترم. يلا نذاكر!'],
      basmala: ['🎉', 'أهلًا يا بسملة! اشتراكك اتفعّل', 'كل المواد والفصول والبورد والامتحانات مفتوحة ليكي لحد آخر الترم. يلا بينا!'],
      mennam: ['🎉', 'أهلًا يا منه! اشتراكك اتفعّل', 'كل المواد والفصول والبورد والامتحانات مفتوحة ليكي لحد آخر الترم. يلا بينا!'],
      menna: ['🎉', 'أهلًا يا منه!', 'إنتي VIP ⭐ كل المواد والفصول والبورد والامتحانات مفتوحة ليكي لحد آخر الترم. يلا بينا!'],
      sub: ['🎉', 'اشتراكك اتفعّل!', 'كل الفصول والبورد والماراثون والمراجعة النهائية بقوا مفتوحين. يلا بينا!']
    }[w] || ['🎉', 'اشتراكك اتفعّل!', 'كل حاجة بقت مفتوحة.'];
    const el = document.createElement('div'); el.className = 'award-pop welcome';
    el.innerHTML = '<div class="ap-in">' + Char.html('', 96) + '<div class="ap-ic">' + T[0] + '</div><b>' + esc(T[1]) + '</b><small>' + esc(T[2]) + '</small><div class="btns"><button class="btn" data-x>يلا بينا</button></div></div>';
    document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on'));
    const c = $('.char', el); Props.put(c, w === 'owner' ? 'crown' : w === 'fatma' ? 'heart' : w === 'bff' ? 'wave' : 'trophy'); setTimeout(() => Char.act(c, 'cheer'), 300);
    beep('ok'); haptic('success');
    el.onclick = e => { if (e.target === el || e.target.closest('[data-x]')) { el.classList.remove('on'); setTimeout(() => el.remove(), 300); Awards.check(); } };
  }

  /* ================= سَنَد بيقدّم البرنامج: جولة بيتمشى فيها ويشاور بالعصاية ================= */
  Object.assign(PROP_SVG, {
    wave: '<g class="pp-wave"><path d="M232 288 L262 196" stroke="#5b6b3a" stroke-width="22" stroke-linecap="round"/><circle cx="266" cy="184" r="17" fill="#f2c39b" stroke="#6b3f22" stroke-width="3"/><path d="M292 160q12 14 0 30M304 150q18 22 0 48" fill="none" stroke="#ffb300" stroke-width="5" stroke-linecap="round"/></g>',
    thumbs: '<g class="pp-th"><circle cx="222" cy="290" r="13" fill="#f2c39b" stroke="#6b3f22" stroke-width="3"/><text x="250" y="270" font-size="70" text-anchor="middle">👍</text></g>',
    think: '<g class="pp-tk"><circle cx="200" cy="200" r="13" fill="#f2c39b" stroke="#6b3f22" stroke-width="3"/><path d="M222 288 Q215 240 200 210" stroke="#5b6b3a" stroke-width="18" fill="none" stroke-linecap="round"/><text x="250" y="70" font-size="64" text-anchor="middle">💭</text></g>'
  });
  const TOUR = [
    { mood: 'cheer', prop: 'wave', t: d => isF() ? 'أهلًا يا فطومة 👋🤍 أنا <b>محمد</b>، وعملتلك البرنامج ده مخصوص. تعالي أفرّجك عليه في دقيقة!' : isB() ? 'أهلًا يا بيستو فريندو 👋💜 أنا <b>محمد</b>، تعالي أفرّجك على البرنامج في دقيقة!' : 'أهلًا يا ' + esc((App.nick ? App.nick(d) : d.name) || 'بطل') + '! 👋 أنا <b>' + cname() + '</b>، هعرّفك على <b>مذاكِر</b> في أقل من دقيقة. يلا بينا!' },
    { sel: '.mtile[href="#subjects"]', mood: 'happy', prop: 'stick', t: () => 'هنا <b>المواد</b> 📚 دوس هنا وتلاقي الاقتصاد والتسويق بكل فصولهم.' },
    { sel: '.mtile[href="#subscribe"]', mood: 'nod', prop: 'stick', t: () => '<b>الفصل الأول في الاقتصاد والتسويق والقانون مجاني</b> 🎁 جرّبه براحتك. ولو عجبك، دوس هنا تشترك <b>' + (self.Sub ? Sub.PRICE : 99) + ' ج للترم كله</b> وكل الفصول تتفتح.' },
    { sel: '#askForm', mood: 'think', prop: 'think', t: () => 'اكتبلي هنا أي حاجة <b>بالعامية</b> ✍️ زي «امتحني 10 أسئلة» أو «يعني إيه المضاعف؟» وأنا أفهمك.' },
    { sel: '.mtile[href="#news"]', mood: 'happy', prop: 'mic', t: () => 'وهنا <b>آخر الأخبار</b> 🎤 زي الأسايمنت ومواعيد التسليم. أول ما ينزل خبر جديد هقولك.' },
    { sel: '.mtile[href="#awards"]', mood: 'cheer', prop: 'trophy', t: () => 'وكل ما تذاكر تكسب <b>جوايز</b> 🏆 وتترص على الرف بتاعك.' },
    { sel: () => { const tb = $('.tabbar'); return tb && getComputedStyle(tb).display !== 'none' ? tb : $('.side'); }, mood: 'nod', prop: 'stick', t: () => 'ومن هنا تتنقّل بين <b>المواد والمراجعة والامتحانات والجدول</b>.' },
    { mood: 'cheer', prop: 'thumbs', t: () => 'وأنا هفضل معاك على الشاشة 😄 دوس عليّا في أي وقت يطلعلك قايمة. يلا نبدأ بالفصل الأول في الاقتصاد؟', last: 1 }
  ];
  const Tour = {
    on: false, i: 0,
    start() {
      if (this.on || !Store.data) return;
      if (!Router.cur || Router.cur.name !== 'home') { Router.go('home'); setTimeout(() => this.start(), 700); return; }
      this.on = true; this.i = 0;
      if (self.Pal) Pal.sync(); const bd = $('#buddy'); if (bd) bd.classList.remove('on');
      const w = this.w = document.createElement('div'); w.className = 'tour'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'جولة في البرنامج');
      w.innerHTML = '<div class="tour-hole"></div><div class="tour-c"><div class="tour-fl">' + Char.html('', 84) + '</div></div><div class="tour-b"><div class="tour-t" aria-live="polite"></div><div class="tour-f"><span class="tour-dots"></span><button class="btn gray sm" data-tskip>تخطّي</button><button class="btn sm" data-tnext>التالي</button></div></div>';
      document.body.appendChild(w);
      $('[data-tskip]', w).onclick = () => this.end();
      $('[data-tnext]', w).onclick = () => this.next();
      w.addEventListener('click', e => { if (e.target === w || e.target.classList.contains('tour-hole')) this.next(); });
      this.kh = e => { if (e.key === 'Escape') this.end(); else if (e.key === 'Enter' || e.key === 'ArrowLeft') this.next(); };
      document.addEventListener('keydown', this.kh);
      this.rh = () => this.show(true); addEventListener('resize', this.rh);
      requestAnimationFrame(() => { w.classList.add('in'); this.show(); });
    },
    target(st) { if (!st.sel) return null; const el = typeof st.sel === 'function' ? st.sel() : $(st.sel); return el && el.getClientRects().length ? el : null; },
    async show(quick) {
      const st = TOUR[this.i], w = this.w; if (!w) return;
      const el = this.target(st), c = $('.tour-c', w), ch = $('.char', c), hole = $('.tour-hole', w), b = $('.tour-b', w);
      if (el && !quick) { const r0 = el.getBoundingClientRect(); if (r0.top < 70 || r0.bottom > innerHeight - 160) { el.scrollIntoView({ block: 'center', behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' }); await new Promise(r => setTimeout(r, 120)); } }
      const W = 84, H = W * 360 / 268, vw = innerWidth, vh = innerHeight;
      let x, y, flip = false;
      if (el) {
        const r = el.getBoundingClientRect(), pad = 6;
        Object.assign(hole.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px', borderRadius: '16px' });
        // طرف العصاية: (1.24W, 0.41H) من ركن الشخصية — ولو اتقلبت يبقى (-0.24W)
        const wide = r.width > vw * 0.6, py = wide ? r.bottom - 4 : r.top + r.height / 2;
        let px = wide ? r.left + r.width * 0.3 : r.left + Math.min(26, r.width / 3);
        x = px - 1.24 * W; y = py - 0.41 * H;
        if (x < 4) { flip = true; px = wide ? r.right - r.width * 0.3 : r.right - Math.min(26, r.width / 3); x = px + 0.24 * W; }
        x = Math.max(4, Math.min(vw - W - 4, x)); y = Math.max(60, Math.min(vh - H - 8, y));
        b.classList.toggle('top', r.top + r.height / 2 > vh * 0.5);
      } else {
        Object.assign(hole.style, { left: vw / 2 + 'px', top: vh * 0.42 + 'px', width: '0px', height: '0px', borderRadius: '50%' });
        x = vw / 2 - W / 2; y = vh * 0.42 - H / 2 - 30; b.classList.remove('top');
      }
      const moved = Math.hypot((this.x || x) - x, (this.y || y) - y) > 10;
      c.classList.toggle('walk', moved && !quick); c.classList.toggle('flip', flip);
      c.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)'; this.x = x; this.y = y;
      clearTimeout(this.wt); this.wt = setTimeout(() => c.classList.remove('walk'), moved ? 750 : 0);
      if (quick) return;
      Props.clear(ch); setTimeout(() => { Props.put(ch, st.prop); Char.act(ch, st.mood); }, moved ? 650 : 120);
      $('.tour-t', w).innerHTML = st.t(D());
      $('.tour-dots', w).innerHTML = TOUR.map((_, k) => '<i' + (k === this.i ? ' class="on"' : '') + '></i>').join('');
      const nx = $('[data-tnext]', w); nx.textContent = st.last ? 'افتح الفصل الأول 🚀' : 'التالي'; $('[data-tskip]', w).hidden = !!st.last;
      haptic();
    },
    next() { if (TOUR[this.i].last) { this.end(); Router.go(App.LESSONS.ec1 ? 'lesson/ec1' : 'subjects'); return; } this.i++; this.show(); },
    end() {
      if (!this.on) return; this.on = false; const d = D(); if (d) { d.tourDone = now(); Store.save(); }
      document.removeEventListener('keydown', this.kh); removeEventListener('resize', this.rh);
      const w = this.w; this.w = null; this.x = this.y = null; if (w) { w.classList.remove('in'); setTimeout(() => w.remove(), 300); }
      scrollTo(0, 0); if (self.Pal) Pal.sync();
    }
  };
  App.Tour = Tour;
  if (self.Pal) {
    const P = self.Pal, s0 = P.sync.bind(P);
    P.sync = function () { s0(); if (Tour.on && this.el) { this.off = true; this.el.classList.add('off'); this.hush(); } };
    const t0 = P.tap.bind(P);
    P.tap = function () { t0(); const m = this.el && this.el.querySelector('.pal-menu'); if (!m || m.hidden) return; m.insertAdjacentHTML('beforeend', '<button data-tour>🧭 عرّفني على البرنامج</button>'); $('[data-tour]', m).onclick = e => { e.stopPropagation(); this.hideMenu(); Tour.start(); }; };
  }

  /* ================= تشغيل ================= */
  function start() {
    if (!Store.data) return;
    if (self.Sub) Sub.check();
    welcome();
    Awards.check(true);
    if (self.Pal && Pal.el) Pal.base();
    // فاطمة: الشخصية اسمها «محمد»
    if ((isF() || isB()) && D().charName === 'سَنَد') { D().charName = 'محمد'; Store.save(); }
    if (isB() && Store.data && !sessionStorage.getItem('mz:bhi')) { sessionStorage.setItem('mz:bhi', 1); setTimeout(() => { if (self.Pal && Pal.on() && !Tour.on) { Props.pal('wave', 5000); Pal.say(BGREET(), 'happy', 5200, true); } }, 3500); }
    if (isF() && Store.data && !sessionStorage.getItem('mz:fhi')) { sessionStorage.setItem('mz:fhi', 1); setTimeout(() => { if (self.Pal && Pal.on() && !Tour.on) { Props.pal('heart', 5000); Pal.say(FGREET(), 'happy', 5200, true); } }, 3500); }
    if (!D().tourDone && !sessionStorage.getItem('mz:welcome')) setTimeout(() => { if (!Tour.on && !$('.award-pop') && !$('.lock') && Router.cur && Router.cur.name === 'home' && !D().tourDone) Tour.start(); }, 1400);
  }
  const prevAfter = App.after;
  App.after = fresh => { prevAfter(fresh); start(); };
  News.load();
  if (Store.data) { start(); if (Router.cur) Router.render(); }
})();
