/* مذاكِر — سجل الدخول: كل حد بيكتب اسمه (أو بيتحظر) بيتسجل صف في شيت جوجل عند محمد، عن طريق جوجل فورم.
   الفورم فيها 4 أسئلة نصية: الاسم، الحالة، رقم الجهاز، الجهاز. لما CFG.form يبقى فاضي، الملف ده مابيعملش حاجة. */
(function () {
  'use strict';
  const CFG = { form: '', name: '', status: '', dev: '', kind: '' };
  const dev = () => { try { let d = localStorage.getItem('mz:tid'); if (!d) { d = Math.random().toString(36).slice(2, 10).toUpperCase(); localStorage.setItem('mz:tid', d); } return d; } catch (e) { return '?'; } };
  const kind = () => { const u = navigator.userAgent; return /iPhone|iPad/.test(u) ? 'آيفون' : /Android/.test(u) ? 'أندرويد' : /Windows/.test(u) ? 'ويندوز' : /Mac/.test(u) ? 'ماك' : 'تاني'; };
  /** يبعت صف واحد للشيت (بيكمّل حتى لو الصفحة اتقفلت أو عملت ريفرش) */
  function send(name, status) {
    if (!CFG.form || !CFG.name) return false;
    const p = new URLSearchParams();
    p.append(CFG.name, String(name || '').trim().slice(0, 80) || '؟');
    if (CFG.status) p.append(CFG.status, String(status || ''));
    if (CFG.dev) p.append(CFG.dev, dev());
    if (CFG.kind) p.append(CFG.kind, kind());
    const body = p.toString();
    try { if (navigator.sendBeacon && navigator.sendBeacon(CFG.form, new Blob([body], { type: 'application/x-www-form-urlencoded' }))) return true; } catch (e) { /* نجرب fetch */ }
    try { fetch(CFG.form, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }); return true; } catch (e) { return false; }
  }
  /** مرة واحدة بس لكل جهاز */
  function once(name, status) { try { if (localStorage.getItem('mz:logged') === '1') return; if (send(name, status)) localStorage.setItem('mz:logged', '1'); } catch (e) { /* مفيش */ } }
  self.MZTrack = { send, once, dev, on: () => !!CFG.form };
})();
