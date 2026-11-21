/* مذاكِر — البوابة: الموقع مقفول للكل ما عدا محمد الشيخ وكريم وفاطمة وجنى ونادية.
   زي البرنامج الأصلي: «اكتب اسمك». لو الاسم واحد من الأربعة، البرنامج يفتح ويتفعّل VIP لوحده.
   ولو أي اسم تاني: «تم إزالة الموقع»، وبتفضل كده على الجهاز ده. */
(function () {
  'use strict';
  const ALLOW = ['owner', 'fatma', 'bff', 'karim', 'nadia'], PHRASE = 'mz-gate';
  const box = document.getElementById('gone'); if (!box) return;
  const gone = () => { box.className = 'g-gone'; box.innerHTML = 'تم إزالة الموقع'; };
  try { if (localStorage.getItem('mz:gone') === '1') return gone(); } catch (e) {}
  const load = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  box.className = 'g-ob';
  box.innerHTML = '<img src="icons/char.png" alt="" class="g-ch"><h2>أهلًا بيك في مذاكِر 👋</h2><p>أنا <b>سَنَد</b>، هكون معاك طول الترم. قولّي اسمك عشان نبدأ.</p>'
    + '<input id="gN" placeholder="اسمك" autocomplete="name" enterkeyhint="go"><button id="gGo">يلا بينا</button>';
  const inp = document.getElementById('gN'), btn = document.getElementById('gGo');
  setTimeout(() => inp.focus(), 100);
  const go = async () => {
    const name = inp.value.trim(); if (!name) { inp.focus(); return; }
    btn.disabled = true; btn.textContent = '…';
    let ok = false;
    try {
      if (!self.License) await load('js/license.js');
      if (!self.MZ_KEYS) await load('js/keys.js');
      const v = await self.License.tryVanity(PHRASE, name, self.MZ_KEYS.vanity, self.MZ_KEYS.vsalt);
      ok = !!(v && ALLOW.includes(v.who));
    } catch (e) { ok = false; }
    if (!ok) { try { localStorage.setItem('mz:gone', '1'); } catch (e) {} return gone(); }
    try {
      sessionStorage.setItem('mz:let', '1');
      sessionStorage.setItem('mz:gate', JSON.stringify({ name, code: PHRASE }));
      sessionStorage.setItem('mz:gname', name);
    } catch (e) {}
    location.replace(location.pathname + '#home'); location.reload();
  };
  btn.onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
})();
