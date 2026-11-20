/* مذاكِر — الموقع مقفول للكل ما عدا محمد الشيخ وفاطمة وچني وكريم.
   الصفحة بتقول «تم إزالة الموقع» بس. ولو حد منهم على جهاز جديد: 5 لمسات على الكلام تفتح خانة الاسم والكود،
   والكود بيتأكد هنا الأول (الخاص أو كود چني الموقّع)، وبعدها البرنامج بيفتح ويتفعّل لوحده. */
(function () {
  'use strict';
  const ALLOW = ['owner', 'fatma', 'bff', 'karim'], BFF_SERIAL = 65001;
  const box = document.getElementById('gone'); if (!box) return;
  let taps = 0, t0 = 0, open = false;
  const load = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  const css = 'width:100%;box-sizing:border-box;margin:6px 0;padding:10px 12px;border:1px solid #ddd;border-radius:10px;font:15px system-ui,Tahoma,sans-serif;background:#fff;color:#111';
  function form() {
    open = true;
    const f = document.createElement('form');
    f.style.cssText = 'position:fixed;left:50%;top:58%;transform:translateX(-50%);width:min(320px,86vw);direction:rtl;text-align:right';
    f.innerHTML = '<input id="gN" placeholder="الاسم" autocomplete="name" style="' + css + '"><input id="gC" placeholder="الكود" dir="ltr" autocomplete="off" style="' + css + '"><button style="' + css + ';background:#111;color:#fff;border:0;cursor:pointer">دخول</button><div id="gM" style="color:#c33;font-size:13px;min-height:18px;margin-top:4px"></div>';
    document.body.appendChild(f);
    f.querySelector('#gN').focus();
    f.onsubmit = async e => {
      e.preventDefault();
      const name = f.querySelector('#gN').value.trim(), code = f.querySelector('#gC').value.trim(), msg = f.querySelector('#gM'), btn = f.querySelector('button');
      if (!name || !code) return;
      btn.disabled = true; btn.textContent = '…'; msg.textContent = '';
      let ok = false;
      try {
        if (!self.License) await load('js/license.js');
        if (!self.MZ_KEYS) await load('js/keys.js');
        const L = self.License, K = self.MZ_KEYS;
        if (L.extract(code)) {
          let dev = null; try { dev = JSON.parse(localStorage.getItem('mz:dev') || 'null'); } catch (x) {}
          if (!dev) { dev = L.newDevice(); localStorage.setItem('mz:dev', JSON.stringify(dev)); }
          const r = await L.verify(code, { pubJwk: K.pub, device: dev, name });
          ok = !!(r && r.ok && r.serial === BFF_SERIAL);
        } else {
          const v = await L.tryVanity(code, name, K.vanity, K.vsalt);
          ok = !!(v && ALLOW.includes(v.who));
        }
      } catch (x) { ok = false; }
      if (!ok) { btn.disabled = false; btn.textContent = 'دخول'; msg.textContent = 'مش صح'; return; }
      try {
        sessionStorage.setItem('mz:let', '1');
        sessionStorage.setItem('mz:gate', JSON.stringify({ name, code }));
      } catch (x) {}
      location.replace(location.pathname + '#home'); location.reload();
    };
  }
  box.addEventListener('click', () => {
    if (open) return;
    const now = Date.now(); if (now - t0 > 3000) taps = 0; t0 = now;
    if (++taps >= 5) form();
  });
})();
