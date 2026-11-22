/* مذاكِر — البوابة: «قولّي اسمك» لأي حد يفتح الموقع، والاسم هو اللي بيقرر:
   - محمد الشيخ وكريم وفاطمة وجنى: البرنامج يفتح VIP (من الكود الخاص اللي بيتفك بالاسم).
   - «هاجر عادل» بالعربي بالظبط: مشتركة في باقة الترم (99)، وجوه البرنامج اسمها «هاجر».
   - نادية وهاجر وخلود وميار: البرنامج يفتح عادي (مجاني، من غير VIP).
   - معاذ ومعاذ حجاج ويوسف ويوسف زلابيا (عربي وإنجليزي): «تم إزالة الموقع» على طول، ومابيشوفوش خانة الاسم تاني أبدًا على الجهاز ده.
   - أي اسم تاني: «تم إزالة الموقع»، ولو عمل ريفرش يرجع يشوف «قولّي اسمك». */
(function () {
  'use strict';
  const VIP = ['owner', 'fatma', 'bff', 'karim'], PHRASE = 'mz-gate';
  const NORMAL = ['ناديه', 'nadia', 'nadya', 'nadiya', 'هاجر', 'hagar', 'hajar', 'hager', 'hagger', 'haggar', 'خلود', 'kholoud', 'kholod', 'kholood', 'kholud', 'khlood', 'khloud', 'khulood', 'ميار', 'mayar', 'mayyar', 'myar', 'mayaar'];
  const BAN = ['معاذ', 'يوسف', 'moaz', 'moaaz', 'muaz', 'muaaz', 'mouaz', 'maaz', 'mo3az', 'yousef', 'youssef', 'yosef', 'yousif', 'youssif', 'yusuf', 'yussuf', 'yusif', 'yossef'];
  const box = document.getElementById('gone'); if (!box) return;
  const gone = () => { box.className = 'g-gone'; box.innerHTML = 'تم إزالة الموقع'; };
  try { localStorage.removeItem('mz:gone'); if (localStorage.getItem('mz:ban') === '1') return gone(); } catch (e) {}
  /** أول كلمة في الاسم بعد التوحيد (من غير تشكيل، أ/إ/آ = ا، ى = ي، ة = ه، والإنجليزي حروف صغيرة) */
  const first = s => String(s || '').trim().toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^a-z0-9ء-ي\s]/g, ' ').trim().split(/\s+/)[0] || '';
  const load = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  box.className = 'g-ob';
  box.innerHTML = '<img src="icons/char.png" alt="" class="g-ch"><h2>أهلًا بيك في مذاكِر 👋</h2><p>أنا <b>سَنَد</b>، هكون معاك طول الترم. قولّي اسمك عشان نبدأ.</p>'
    + '<input id="gN" placeholder="اسمك" autocomplete="name" enterkeyhint="go"><button id="gGo">يلا بينا</button>';
  const inp = document.getElementById('gN'), btn = document.getElementById('gGo');
  setTimeout(() => inp.focus(), 100);
  const enter = (name, vip, shown) => {
    try {
      localStorage.setItem('mz:pass', '1');
      sessionStorage.setItem('mz:gname', shown || name);
      if (vip) sessionStorage.setItem('mz:gate', JSON.stringify({ name, code: PHRASE }));
    } catch (e) {}
    location.replace(location.pathname + '#home'); location.reload();
  };
  const go = async () => {
    const name = inp.value.trim(); if (!name) { inp.focus(); return; }
    const f = first(name);
    if (BAN.includes(f)) { try { localStorage.setItem('mz:ban', '1'); localStorage.removeItem('mz:pass'); } catch (e) {} return gone(); }
    btn.disabled = true; btn.textContent = '…';
    const ar = !/[a-z]/i.test(name), full = name.trim().replace(/[ً-ْـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/\s+/g, ' ');
    if (ar && full === 'هاجر عادل') { // مشتركة (باقة الترم)
      try {
        if (!self.License) await load('js/license.js');
        if (!self.MZ_KEYS) await load('js/keys.js');
        const v = await self.License.tryVanity(PHRASE, name, self.MZ_KEYS.vanity, self.MZ_KEYS.vsalt);
        if (v && v.who === 'hagar') return enter(name, true, 'هاجر');
      } catch (e) { /* يكمّل عادي */ }
    }
    if (NORMAL.includes(f)) return enter(name, false);
    let vip = false;
    try {
      if (!self.License) await load('js/license.js');
      if (!self.MZ_KEYS) await load('js/keys.js');
      const v = await self.License.tryVanity(PHRASE, name, self.MZ_KEYS.vanity, self.MZ_KEYS.vsalt);
      vip = !!(v && VIP.includes(v.who));
    } catch (e) { vip = false; }
    if (vip) return enter(name, true);
    gone(); // مش من الأسامي: يرجع يشوف «قولّي اسمك» بعد الريفرش
  };
  btn.onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
})();
