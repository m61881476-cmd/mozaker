/* اختبارات الاشتراك: الأكواد مربوطة بالاسم والجهاز، والأكواد الخاصة، وفك المحتوى */
const L = require('../js/license.js');
const fs = require('fs'), vm = require('vm'), path = require('path');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
(async () => {
  const { privJwk, pubJwk, K } = await L.genKeys();
  const dev = L.newDevice(), dev2 = L.newDevice();
  const code = await L.issue({ privJwk, K, name: 'أحمد محمد', device: L.prettyDevice(dev), plan: 'term', exp: new Date('2027-02-28'), serial: 77 });
  ok(/^MZ1\./.test(code), 'شكل الكود');
  let r = await L.verify(code, { pubJwk, device: dev, name: 'احمد  محمد' }); ok(r.ok && r.serial === 77 && r.plan === 'term', 'الكود يشتغل بنفس الاسم (همزة/مسافات مختلفة)');
  ok(r.ok && Buffer.from(r.K).equals(Buffer.from(K)), 'مفتاح المحتوى يطلع صح');
  r = await L.verify(code, { pubJwk, device: dev2, name: 'أحمد محمد' }); ok(!r.ok && r.reason === 'device', 'جهاز تاني مرفوض');
  r = await L.verify(code, { pubJwk, device: dev, name: 'محمود علي' }); ok(!r.ok && r.reason === 'name', 'اسم تاني مرفوض');
  r = await L.verify(code, { pubJwk, device: dev, name: 'أحمد محمد', now: Date.parse('2027-06-01') }); ok(!r.ok && r.reason === 'expired', 'الكود بيخلص');
  const bad = code.slice(0, 30) + (code[30] === 'A' ? 'B' : 'A') + code.slice(31);
  r = await L.verify(bad, { pubJwk, device: dev, name: 'أحمد محمد' }); ok(!r.ok, 'كود متعدّل مرفوض');
  ok(L.extract('اتفضل الكود:\n' + code + '\nشكرا') === code, 'استخراج الكود من رسالة');
  // مفتاح تاني مايقدرش يطلّع كود
  const other = await L.genKeys();
  const fake = await L.issue({ privJwk: other.privJwk, K: other.K, name: 'أحمد محمد', device: dev, serial: 1 });
  r = await L.verify(fake, { pubJwk, device: dev, name: 'أحمد محمد' }); ok(!r.ok && r.reason === 'sig', 'كود من مفتاح مزيف مرفوض');
  // حزمة الأدمن
  const b = await L.makeAdminBundle('pass-123', { privJwk, K: L.b64u.enc(K) });
  ok((await L.openAdminBundle('pass-123', b)).K === L.b64u.enc(K), 'حزمة الأدمن تتفتح بكلمة السر');
  let threw = false; try { await L.openAdminBundle('wrong', b); } catch (e) { threw = true; } ok(threw, 'كلمة سر غلط مرفوضة');
  // التشفير
  const enc = await L.encryptJSON(K, { a: 1 }); ok((await L.decryptJSON(K, enc)).a === 1, 'فك المحتوى');
  // الأكواد الخاصة في المفاتيح الحقيقية
  const ctx = { self: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/keys.js'), 'utf8'), ctx); const KEYS = ctx.self.MZ_KEYS;
  const v1 = await L.tryVanity('Muhammad 2007', 'محمد الشيخ', KEYS.vanity, KEYS.vsalt); ok(v1 && v1.who === 'owner' && !v1.admin && !v1.ap, 'كود محمد الشيخ (من غير أي سر أدمن جوّاه)');
  ok(!KEYS.admin && !/privJwk|"d"\s*:/.test(fs.readFileSync(path.join(__dirname, '../js/keys.js'), 'utf8')), 'js/keys.js مفيهوش حزمة الأدمن ولا مفتاح خاص');
  const v1b = await L.tryVanity('muhammad2007', 'Mohamed Elsheikh', KEYS.vanity, KEYS.vsalt); ok(v1b && v1b.who === 'owner', 'كود محمد الشيخ بالإنجليزي');
  const v1c = await L.tryVanity('Muhammad 2007', 'محمد هاني الشيخ', KEYS.vanity, KEYS.vsalt); ok(v1c && v1c.who === 'owner', 'محمد هاني الشيخ (اسم ثلاثي) شغال');
  ok(!(await L.tryVanity('Muhammad 2007', 'محمد هاني', KEYS.vanity, KEYS.vsalt)), 'محمد هاني من غير الشيخ مرفوض');
  ok(!(await L.tryVanity('Muhammad 2007', 'محمد', KEYS.vanity, KEYS.vsalt)), 'محمد لوحده مرفوض');
  ok(!(await L.tryVanity('Muhammad 2007', 'محمد احمد', KEYS.vanity, KEYS.vsalt)), 'محمد تاني مرفوض');
  const v2 = await L.tryVanity('I love you', 'فاطمة', KEYS.vanity, KEYS.vsalt); ok(v2 && v2.who === 'fatma' && !v2.admin, 'كود فاطمة');
  const v2b = await L.tryVanity('i love you', 'Fatma Ali', KEYS.vanity, KEYS.vsalt); ok(v2b && v2b.who === 'fatma', 'كود فاطمة بالإنجليزي');
  ok(!(await L.tryVanity('I love you', 'أحمد', KEYS.vanity, KEYS.vsalt)), 'كود فاطمة باسم تاني مرفوض');
  ok(!(await L.tryVanity('Muhammad 2008', 'محمد', KEYS.vanity, KEYS.vsalt)), 'عبارة غلط مرفوضة');
  // المحتوى المدفوع يتفك بمفتاح كود فاطمة
  const paid = await L.decryptJSON(L.b64u.dec(v2.K), new Uint8Array(fs.readFileSync(path.join(__dirname, '../content/paid.mz'))));
  ok(paid.subjects && paid.subjects.mkt && paid.subjects.eco && paid.subjects.mkt.questions.length > 100, 'المحتوى المدفوع يتفك');
  // المجاني مافيهوش ملخصات الدروس المقفولة
  const fc = { self: {} }; fc.self.self = fc.self; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/content/free.js'), 'utf8'), fc.self);
  const free = fc.self.MZ_CONTENT; ok(free.every(s => s.lessons.filter(l => l.locked).every(l => !l.summary)), 'الدروس المقفولة فاضية في المجاني');
  ok(free.find(s => s.id === 'eco').lessons.find(l => l.id === 'ec1').summary.length > 200, 'الفصل الأول اقتصاد مجاني');
  ok(free.find(s => s.id === 'mkt').lessons.filter(l => !l.locked).map(l => l.id).join() === 'mk0,mk1', 'التسويق: المقدمة والفصل الأول بس مفتوحين');
  ok(free.reduce((n, s) => n + s.lessons.filter(l => !l.locked).length, 0) === 3, 'المجاني 3 دروس بس (ec1 و mk0 و mk1)');
  ok(fc.self.MZ_PAID_VER === paid.ver, 'رقم نسخة المحتوى متطابق');
  console.log('license: ' + pass + ' ✓  ' + fail + ' ✗'); process.exit(fail ? 1 : 0);
})();
