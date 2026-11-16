/* مذاكِر — الاشتراك من غير سيرفر.
   كود التفعيل موقّع رقميًا (ECDSA P-256) ومربوط باسم المشترك ورقم جهازه، فمايشتغلش على جهاز تاني ولا باسم تاني.
   المحتوى المدفوع متشفّر (AES-GCM)، ومفتاحه جوه الكود نفسه ملفوف بالاسم والجهاز.
   المفتاح الخاص اللي بيطلّع الأكواد متشفّر بكلمة سر الأدمن، ومحدش يقدر يطلّع كود من غيرها. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.License = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const C = (typeof crypto !== 'undefined' && crypto.subtle) ? crypto : require('crypto').webcrypto;
  const SUB = C.subtle;
  const te = new TextEncoder(), td = new TextDecoder();
  const VER = 1, PREFIX = 'MZ1.', EPOCH = Date.UTC(2025, 0, 1), NEVER = 0xffff;
  const ADMIN_ITER = 600000, VANITY_ITER = 250000;
  const PLANS = { 1: 'term', 2: 'vip' }, PLAN_ID = { term: 1, vip: 2 };

  /* ---------- ترميز ---------- */
  const b64u = {
    enc(u8) { let s = ''; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
    dec(str) { str = String(str).replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; const s = atob(str); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  };
  const CROCK = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  function b32enc(u8) { let bits = 0, val = 0, out = ''; for (const b of u8) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += CROCK[(val >>> (bits - 5)) & 31]; bits -= 5; } } if (bits > 0) out += CROCK[(val << (5 - bits)) & 31]; return out; }
  function b32dec(str) {
    const s = String(str).toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V');
    let bits = 0, val = 0; const out = [];
    for (const ch of s) { const v = CROCK.indexOf(ch); if (v < 0) return null; val = (val << 5) | v; bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } }
    return new Uint8Array(out);
  }
  const cat = (...a) => { const n = a.reduce((s, x) => s + x.length, 0), o = new Uint8Array(n); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; };
  const rand = n => C.getRandomValues(new Uint8Array(n));

  /* ---------- الاسم ورقم الجهاز ---------- */
  function normName(s) {
    return String(s || '').normalize('NFKC').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[ً-ٰٟـ]/g, '')
      .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .toLowerCase().replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
  }
  const normPhrase = s => normName(s).replace(/ /g, '');
  const firstName = s => normName(s).split(' ')[0] || '';
  const newDevice = () => b32enc(rand(5));
  const prettyDevice = id => { const s = String(id || '').toUpperCase().replace(/[^0-9A-Z]/g, ''); return s.length === 8 ? s.slice(0, 4) + '-' + s.slice(4) : s; };
  const cleanDevice = id => String(id || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  const dayOf = d => Math.floor((new Date(d).getTime() - EPOCH) / 864e5);
  const dateOf = n => n === NEVER ? null : new Date(EPOCH + n * 864e5);

  /* ---------- أدوات التشفير ---------- */
  async function sha256(u8) { return new Uint8Array(await SUB.digest('SHA-256', u8)); }
  async function nameHash(name) { return (await sha256(te.encode(normName(name)))).slice(0, 4); }
  async function hkdf(ikm, salt, info, len = 32) {
    const k = await SUB.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
    return new Uint8Array(await SUB.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: te.encode(salt), info: te.encode(info) }, k, len * 8));
  }
  async function pbkdf(pass, salt, iter) {
    const k = await SUB.importKey('raw', te.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return SUB.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  const aesKey = raw => SUB.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
  async function seal(key, u8) { const iv = rand(12); const ct = new Uint8Array(await SUB.encrypt({ name: 'AES-GCM', iv }, key, u8)); return cat(iv, ct); }
  async function open(key, u8) { return new Uint8Array(await SUB.decrypt({ name: 'AES-GCM', iv: u8.slice(0, 12) }, key, u8.slice(12))); }
  const xor = (a, b) => a.map((x, i) => x ^ b[i]);

  /* ---------- المحتوى المدفوع ---------- */
  async function encryptJSON(K, obj) { return seal(await aesKey(K), te.encode(JSON.stringify(obj))); }
  async function decryptJSON(K, u8) { return JSON.parse(td.decode(await open(await aesKey(K), u8))); }

  /* ---------- كود التفعيل ----------
     [0] الإصدار · [1] النوع · [2-3] آخر يوم · [4-5] رقم مسلسل · [6-10] الجهاز · [11-14] بصمة الاسم · [15-46] مفتاح المحتوى ملفوف · ثم توقيع 64 بايت */
  const HEAD = 15, BODY = 47, SIG = 64;
  async function wrapKeyFor(head) { return hkdf(head, 'mozaker/wrap/1', 'content-key'); }
  async function importPriv(jwk) { return SUB.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']); }
  async function importPub(jwk) { return SUB.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']); }
  /** بيطلّع كود (للأدمن بس: محتاج المفتاح الخاص ومفتاح المحتوى) */
  async function issue({ privJwk, K, name, device, plan = 'term', exp = null, serial = 0 }) {
    const dev = b32dec(cleanDevice(device)); if (!dev || dev.length !== 5) throw new Error('رقم الجهاز غلط');
    if (!normName(name)) throw new Error('الاسم فاضي');
    const head = new Uint8Array(HEAD); const dv = new DataView(head.buffer);
    head[0] = VER; head[1] = PLAN_ID[plan] || 1;
    dv.setUint16(2, exp ? Math.max(0, Math.min(NEVER - 1, dayOf(exp))) : NEVER); dv.setUint16(4, serial & 0xffff);
    head.set(dev, 6); head.set(await nameHash(name), 11);
    const body = cat(head, xor(K, await wrapKeyFor(head)));
    const sig = new Uint8Array(await SUB.sign({ name: 'ECDSA', hash: 'SHA-256' }, await importPriv(privJwk), body));
    return PREFIX + b64u.enc(cat(body, sig));
  }
  /** بيطلّع الكود من أي كلام ملصوق (رسالة واتساب كاملة أو لينك) */
  function extract(text) { const m = String(text || '').match(/MZ1\.[A-Za-z0-9_-]{100,}/); return m ? m[0] : null; }
  function parse(code) {
    const c = extract(code); if (!c) return null;
    let u; try { u = b64u.dec(c.slice(PREFIX.length)); } catch (e) { return null; }
    if (u.length !== BODY + SIG || u[0] !== VER) return null;
    const dv = new DataView(u.buffer, u.byteOffset);
    const e = dv.getUint16(2);
    return { code: c, plan: PLANS[u[1]] || 'term', exp: dateOf(e), expDay: e, serial: dv.getUint16(4), device: b32enc(u.slice(6, 11)), nh: u.slice(11, 15), head: u.slice(0, HEAD), body: u.slice(0, BODY), wk: u.slice(HEAD, BODY), sig: u.slice(BODY) };
  }
  /** بيتأكد إن الكود سليم وبتاع الجهاز والاسم دول، ويرجّع مفتاح المحتوى */
  async function verify(code, { pubJwk, device, name, now = Date.now() }) {
    const p = parse(code); if (!p) return { ok: false, reason: 'format' };
    let good = false;
    try { good = await SUB.verify({ name: 'ECDSA', hash: 'SHA-256' }, await importPub(pubJwk), p.sig, p.body); } catch (e) { good = false; }
    if (!good) return { ok: false, reason: 'sig' };
    if (cleanDevice(device) !== p.device) return { ok: false, reason: 'device', p };
    const nh = await nameHash(name); if (nh.some((x, i) => x !== p.nh[i])) return { ok: false, reason: 'name', p };
    if (p.exp && now > p.exp.getTime() + 864e5) return { ok: false, reason: 'expired', p };
    const K = xor(p.wk, await wrapKeyFor(p.head));
    return { ok: true, plan: p.plan, exp: p.exp, serial: p.serial, K, p };
  }

  /* ---------- حزمة الأدمن (متشفّرة بكلمة السر) ---------- */
  async function makeAdminBundle(password, data) {
    const salt = rand(16);
    const ct = await seal(await pbkdf(password, salt, ADMIN_ITER), te.encode(JSON.stringify(data)));
    return b64u.enc(salt) + '.' + b64u.enc(ct);
  }
  async function openAdminBundle(password, bundle) {
    const [s, c] = String(bundle).split('.');
    const plain = await open(await pbkdf(password, b64u.dec(s), ADMIN_ITER), b64u.dec(c));
    return JSON.parse(td.decode(plain));
  }

  /* ---------- الأكواد الخاصة (عبارة + الاسم الأول) ---------- */
  async function vanityKey(phrase, name, salt) { return pbkdf(normPhrase(phrase) + '|' + firstName(name), b64u.dec(salt), VANITY_ITER); }
  async function makeVanity(phrase, name, payload, salt) { return b64u.enc(await seal(await vanityKey(phrase, name, salt), te.encode(JSON.stringify(payload)))); }
  async function tryVanity(phrase, name, entries, salt) {
    if (!normPhrase(phrase) || !firstName(name) || !entries || !entries.length) return null;
    const key = await vanityKey(phrase, name, salt);
    for (const e of entries) { try { return JSON.parse(td.decode(await open(key, b64u.dec(e)))); } catch (err) { /* مش ده */ } }
    return null;
  }

  async function genKeys() {
    const kp = await SUB.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    return { privJwk: await SUB.exportKey('jwk', kp.privateKey), pubJwk: await SUB.exportKey('jwk', kp.publicKey), K: rand(32) };
  }

  return { VER, PREFIX, EPOCH, b64u, b32enc, b32dec, normName, normPhrase, firstName, newDevice, prettyDevice, cleanDevice, dayOf, dateOf, sha256, rand,
    encryptJSON, decryptJSON, issue, extract, parse, verify, makeAdminBundle, openAdminBundle, makeVanity, tryVanity, genKeys, seal, open, aesKey };
});
