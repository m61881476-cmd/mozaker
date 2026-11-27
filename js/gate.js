/* مذاكِر — البوابة: «قولّي اسمك» لأي حد يفتح الموقع:
   - أي اسم يدخل البرنامج عادي (مجاني).
   - محمد الشيخ وكريم وفاطمة وجنى: VIP (من الكود الخاص اللي بيتفك بالاسم).
   - «هاجر عادل» (أو Hagar Adel): VIP (200) لحد آخر الترم، وجوه البرنامج اسمها «هاجر».
   - «منه محمد» و«بسملة نصر» (عربي أو إنجليزي): الاشتراك العادي (99) لحد آخر الترم.
   - «آيه مسعد» و«منه توفيق» (عربي أو إنجليزي): VIP لحد آخر الترم. وآيه بيناديها «آيه» أو «يويو» أو «فتكات».
   - المحظورين (عربي وإنجليزي) — «تم إزالة الموقع» ومابيشوفوش خانة الاسم تاني أبدًا على الجهاز ده:
       • لو أول اسم: يوسف، بسنت، أمينة، أحمد، يحيى.
       • لو في أي حتة في الاسم: معاذ، حجاج.
   - كل دخول أو حظر بيتسجل في شيت محمد (js/track.js). */
(function () {
  'use strict';
  const VIP = ['owner', 'fatma', 'bff', 'karim', 'aya', 'menna', 'mennam', 'basmala'], TERM = ['mennam', 'basmala'], PHRASE = 'mz-gate';
  /* المحظورين: أول اسم */
  const BAN_FIRST = ['يوسف', 'yousef', 'youssef', 'yosef', 'yousif', 'youssif', 'yusuf', 'yussuf', 'yusif', 'yossef', 'youssuf', 'yousuf',
    'بسنت', 'بسنط', 'باسنت', 'basant', 'bassant', 'basent', 'bassent', 'basnt', 'bsant', 'basnet', 'basanet',
    'امينه', 'امينا', 'amina', 'ameena', 'aminah', 'amena', 'ameenah', 'amenah', 'aminaa',
    'احمد', 'ahmed', 'ahmad', 'ahmd', 'a7med', 'ahmet', 'ahmmed', 'ahmeed',
    'يحيي', 'يحيا', 'yehia', 'yahia', 'yahya', 'yehya', 'yahiya', 'yehiya', 'yahea', 'yehea', 'ya7ia', 'yhia'];
  /* المحظورين: في أي حتة في الاسم */
  const BAN_ANY = ['معاذ', 'حجاج', 'moaz', 'moaaz', 'muaz', 'muaaz', 'mouaz', 'maaz', 'mo3az', 'moaz', 'muadh', 'moaath', 'moath',
    'haggag', 'hagag', 'hajjaj', 'hajaj', 'haggaj', 'hagaag', 'hagaj', 'hajag', 'ha2gag'];
  const box = document.getElementById('gone'); if (!box) return;
  const gone = () => { box.className = 'g-gone'; box.innerHTML = 'تم إزالة الموقع'; };
  try { localStorage.removeItem('mz:gone'); if (localStorage.getItem('mz:ban') === '1') return gone(); } catch (e) {}
  /** أول كلمة في الاسم بعد التوحيد (من غير تشكيل، أ/إ/آ = ا، ى = ي، ة = ه، والإنجليزي حروف صغيرة) */
  const words = s => String(s || '').trim().toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^a-z0-9ء-ي\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
  const banned = n => { const w = words(n); return !!w.length && (BAN_FIRST.includes(w[0]) || w.some(x => BAN_ANY.includes(x))); };
  const log = (n, st) => { try { if (self.MZTrack) { self.MZTrack.send(n, st); localStorage.setItem('mz:logged', '1'); } } catch (e) { /* مفيش */ } };
  const first = s => String(s || '').trim().toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^a-z0-9ء-ي\s]/g, ' ').trim().split(/\s+/)[0] || '';
  const Y1_ON = false; /* سنة أولى مقفولة حاليًا */
  const load = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  box.className = 'g-ob';
  box.innerHTML = '<img src="icons/char.png" alt="" class="g-ch"><h2>أهلًا بيك في مذاكِر 👋</h2><p>أنا <b>سَنَد</b>، هكون معاك طول الترم. قولّي اسمك عشان نبدأ.</p>'
    + '<input id="gN" placeholder="اسمك" autocomplete="name" enterkeyhint="go">'
    + (!Y1_ON ? '' : '<div class="g-yr" role="radiogroup" aria-label="إنت في سنة كام؟"><span>إنت في سنة كام؟</span><div><button type="button" data-y="1">سنة أولى</button><button type="button" data-y="2">سنة تانية</button></div></div>')
    + '<button id="gGo">يلا بينا</button>';
  const inp = document.getElementById('gN'), btn = document.getElementById('gGo');
  let year = Y1_ON ? '' : '2'; if (Y1_ON) try { year = localStorage.getItem('mz:year') || ''; } catch (e) {}
  const yb = [...box.querySelectorAll('[data-y]')], yset = y => { year = y; yb.forEach(b => b.classList.toggle('on', b.dataset.y === y)); };
  yb.forEach(b => b.onclick = () => yset(b.dataset.y)); if (year) yset(year);
  setTimeout(() => inp.focus(), 100);
  let plan99 = false;
  const enter = (name, vip, shown) => {
    log(name, (vip ? (plan99 ? 'دخل مشترك 99' : 'دخل VIP ⭐') : 'دخل مجاني') + ' · سنة ' + (year === '1' ? 'أولى' : 'تانية'));
    try {
      localStorage.setItem('mz:pass', '1');
      localStorage.setItem('mz:year', year || '2');
      sessionStorage.setItem('mz:gname', shown || name);
      if (vip) sessionStorage.setItem('mz:gate', JSON.stringify({ name, code: PHRASE }));
    } catch (e) {}
    location.replace(location.pathname + '#home'); location.reload();
  };
  const go = async () => {
    const name = inp.value.trim(); if (!name) { inp.focus(); return; }
    if (!year) { const g = box.querySelector('.g-yr'); g.classList.remove('need'); void g.offsetWidth; g.classList.add('need'); return; }
    const f = first(name);
    if (banned(name)) { log(name, 'محظور ⛔'); try { localStorage.setItem('mz:ban', '1'); localStorage.removeItem('mz:pass'); } catch (e) {} return gone(); }
    btn.disabled = true; btn.textContent = '…';
    const full = name.trim().toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/[^a-z\u0621-\u064a\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (/^(هاجر عادل|(hagar|hajar|hager|hagger|haggar) (adel|adl|adil|aadel|adeel))$/.test(full)) { // مشتركة (VIP 200)
      try {
        if (!self.License) await load('js/license.js');
        if (!self.MZ_KEYS) await load('js/keys.js');
        const v = await self.License.tryVanity(PHRASE, name, self.MZ_KEYS.vanity, self.MZ_KEYS.vsalt);
        if (v && v.who === 'hagar') return enter(name, true, 'هاجر');
      } catch (e) { /* يكمّل عادي */ }
    }
    if (/^((اسماء|اسما) عيد|(asmaa|asma|asmae|asmaaa) (eid|eed|aid|ead|eiad))$/.test(full)) return enter(name, false); // أسماء عيد: عادي (مجاني)
    let vip = false;
    try {
      if (!self.License) await load('js/license.js');
      if (!self.MZ_KEYS) await load('js/keys.js');
      const v = await self.License.tryVanity(PHRASE, name, self.MZ_KEYS.vanity, self.MZ_KEYS.vsalt);
      vip = !!(v && VIP.includes(v.who)); plan99 = !!(vip && TERM.includes(v.who));
    } catch (e) { vip = false; }
    return enter(name, vip); // أي اسم تاني: يدخل عادي (مجاني)
  };
  btn.onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
})();
