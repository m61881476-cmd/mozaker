#!/usr/bin/env node
/* أداة المحتوى والاشتراك:
   node tools/mz.cjs init      ← (مرة واحدة) يطلّع المفاتيح وكلمة سر الأدمن ويكتب js/keys.js و .mz-secret
   node tools/mz.cjs build     ← يقرا content-src/ ويطلّع js/content/free.js (المجاني) و content/paid.mz (المتشفّر) و content/src.mz (المصادر متشفّرة)
   node tools/mz.cjs unpack    ← يفك content/src.mz لـ content-src/ (محتاج كلمة سر الأدمن)
   node tools/mz.cjs issue "الاسم" ABCD-EFGH [term|vip] [YYYY-MM-DD]  ← يطلّع كود
   كلمة السر من MZ_PASS أو من ملف .mz-secret (مش بيترفع على GitHub) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const L = require('../js/license.js');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, 'content-src');
const FREE = { eco: ['ec1'], mkt: ['mk0', 'mk1'], law: ['lw1'], /* سنة أولى: الأسبوع الأول ببلاش (للتجربة) */ y1bus: ['yb1'], y1pol: ['yp1'], y1law: ['yl1', 'yl2'], y1eco: ['ye1'], y1math: ['ym1'] };
const SRC_ORDER = ['mkt.js', 'mkt-b.js', 'mkt-q1.js', 'mkt-q2.js', 'mkt-kb.js', 'mkt-bd.js', 'eco.js', 'eco-b1.js', 'eco-q.js', 'eco-rev.js', 'eco-islm.js', 'law.js', 'law-b1.js', 'law-q.js', 'stat.js', 'prod.js', 'y1.js'];

const pass = () => process.env.MZ_PASS || (fs.existsSync(path.join(ROOT, '.mz-secret')) ? fs.readFileSync(path.join(ROOT, '.mz-secret'), 'utf8').match(/ADMIN_PASSWORD=(\S+)/)[1] : null);
function readKeysJs() {
  const ctx = { self: {} }; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/keys.js'), 'utf8'), ctx);
  return ctx.self.MZ_KEYS;
}
const ADMIN_FILE = path.join(ROOT, 'tools/admin.bundle.json');
function readAdmin() { return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8')); }
function writeKeysJs(k) {
  const pub = { pub: k.pub, vsalt: k.vsalt, vanity: k.vanity }; // العام بس: مفيش أي حاجة سرية بتنزل على الموبايل
  fs.writeFileSync(path.join(ROOT, 'js/keys.js'), '/* مفاتيح الاشتراك العامة — اتولّدت بـ tools/mz.cjs. مفيهاش أي مفتاح سري. */\nself.MZ_KEYS = ' + JSON.stringify(pub, null, 1) + ';\n');
}
async function secrets() {
  const p = pass(); if (!p) throw new Error('محتاج كلمة سر الأدمن: MZ_PASS أو .mz-secret');
  const keys = readKeysJs(); const a = await L.openAdminBundle(p, readAdmin());
  return { privJwk: a.privJwk, K: L.b64u.dec(a.K), pubJwk: keys.pub, keys };
}

async function init() {
  if (fs.existsSync(ADMIN_FILE) && !process.argv.includes('--force')) throw new Error('js/keys.js موجود. استخدم --force لو متأكد (هيلغي كل الأكواد القديمة)');
  const { privJwk, pubJwk, K } = await L.genKeys();
  const word = () => L.b32enc(L.rand(3)).slice(0, 4);
  const password = 'MZK-' + [word(), word(), word(), word()].join('-');
  const admin = await L.makeAdminBundle(password, { privJwk, K: L.b64u.enc(K) });
  const vsalt = L.b64u.enc(L.rand(16));
  const Kb = L.b64u.enc(K);
  const vanity = await makeVanities(Kb, vsalt);
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(admin) + '\n');
  writeKeysJs({ pub: { kty: pubJwk.kty, crv: pubJwk.crv, x: pubJwk.x, y: pubJwk.y }, vsalt, vanity });
  fs.writeFileSync(path.join(ROOT, '.mz-secret'), 'ADMIN_PASSWORD=' + password + '\n');
  console.log('اتعمل. كلمة سر الأدمن في .mz-secret');
}

/** الأكواد الخاصة: «Muhammad 2007» لمحمد الشيخ بس، و«I love you» لفاطمة، و«Karim 5343» لكريم (من غير أي صلاحية أدمن) */
async function makeVanities(Kb, vsalt) {
  const vanity = [];
  const owner = [];
  for (const f of ['محمد', 'muhammad', 'mohamed', 'mohammed', 'mohammad', 'mohamad']) for (const l of ['الشيخ', 'elsheikh', 'alsheikh', 'elshaikh', 'alshaikh', 'sheikh', 'elshiekh']) owner.push(f + l);
  for (const n of owner) vanity.push(await L.makeVanity('Muhammad 2007', n, { K: Kb, plan: 'vip', who: 'owner', label: 'المخترع' }, vsalt));
  for (const n of ['فاطمة', 'fatma', 'fatima', 'fatema', 'fatmah']) vanity.push(await L.makeVanity('I love you', n, { K: Kb, plan: 'vip', who: 'fatma', label: 'فاطمة 🤍' }, vsalt));
  for (const n of ['كريم', 'karim', 'kareem', 'karem']) vanity.push(await L.makeVanity('Karim 5343', n, { K: Kb, plan: 'vip', who: 'karim', label: 'كريم ⭐' }, vsalt));
  /* البوابة: الاسم لوحده بيفتح الموقع VIP للأربعة دول بس (العبارة عامة في js/gate.js) */
  const G = 'mz-gate', GATE = [[owner, { who: 'owner', label: 'المخترع' }], [['فاطمة', 'fatma', 'fatima', 'fatema', 'fatmah'], { who: 'fatma', label: 'فاطمة 🤍' }],
    [['كريم', 'karim', 'kareem', 'karem'], { who: 'karim', label: 'كريم ⭐' }], [['جني', 'jana', 'janna', 'jannah', 'jenny', 'gana', 'genny'], { who: 'bff', label: 'بيستو فريندو 💜' }]];
  for (const [names, p] of GATE) for (const n of names) vanity.push(await L.makeVanity(G, n, Object.assign({ K: Kb, plan: 'vip' }, p), vsalt));
  /* هاجر عادل (عربي أو إنجليزي): باقة VIP (200) لحد آخر الترم */
  const HA = ['هاجرعادل']; for (const f of ['hagar', 'hajar', 'hager', 'hagger', 'haggar']) for (const l of ['adel', 'adl', 'adil', 'aadel', 'adeel']) HA.push(f + l);
  for (const n of HA) vanity.push(await L.makeVanity(G, n, { K: Kb, plan: 'vip', who: 'hagar', label: 'هاجر ⭐', exp: '2027-02-28' }, vsalt));
  /* كود هاجر الخاص «Hagar 7319»: بيفتح VIP (200) لحد آخر الترم، بالاسم «هاجر» أو «هاجر عادل» (عربي أو إنجليزي) */
  for (const n of HA.concat(['هاجر', 'hagar', 'hajar', 'hager'])) vanity.push(await L.makeVanity('Hagar 7319', n, { K: Kb, plan: 'vip', who: 'hagar', label: 'هاجر ⭐', exp: '2027-02-28' }, vsalt));
  return vanity.sort(() => Math.random() - 0.5); // ترتيب عشوائي
}
async function vanityCmd() {
  const s = await secrets(), k = s.keys;
  k.vanity = await makeVanities(L.b64u.enc(s.K), k.vsalt);
  writeKeysJs(k);
  console.log('اتعمل ' + k.vanity.length + ' كود خاص');
}

function loadSources() {
  const ctx = { self: {} }; ctx.self.self = ctx.self;
  for (const f of SRC_ORDER) vm.runInNewContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx.self, { filename: f });
  return ctx.self.MZ_CONTENT;
}
const figRefs = txt => (String(txt).match(/\[\[fig:([\w-]+)\]\]/g) || []).map(m => m.slice(6, -2));

async function build() {
  const { K } = await secrets();
  const subjects = loadSources(), free = [], paid = {};
  for (const S of subjects) {
    const fr = new Set(FREE[S.id] || []), isFree = l => fr.has(l);
    S.questions = S.questions.map((q, i) => Object.assign({}, q, { k: typeof q.k === 'string' ? q.k : 'q' + i, kw: Array.isArray(q.k) ? q.k : q.kw }));
    S.cards = S.cards.map((c, i) => [c[0], c[1], c[2], 'c' + i]);
    const freeFigs = new Set(); S.lessons.filter(l => isFree(l.id)).forEach(l => figRefs(l.summary).forEach(f => freeFigs.add(f)));
    const pick = (o, keep) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => keep(k)));
    const F = {
      id: S.id, year: S.year, name: S.name, short: S.short, icon: S.icon, color: S.color, kind: S.kind, tools: S.tools || [], keys: S.keys, final: S.final, partial: S.partial, rewrite: S.rewrite,
      lessons: S.lessons.map(l => isFree(l.id) ? Object.assign({}, l) : { id: l.id, title: l.title, source: l.source, exam: l.exam, summary: '', locked: true }),
      questions: S.questions.filter(q => isFree(q.l)), cards: S.cards.filter(c => isFree(c[2])), concepts: (S.concepts || []).filter(c => isFree(c.l)),
      figs: pick(S.figs, k => freeFigs.has(k)), boards: pick(S.boards, k => isFree(k)),
      lockedConcepts: (S.concepts || []).filter(c => !isFree(c.l)).map(c => ({ k: c.k, alt: c.alt, l: c.l })),
      paid: true
    };
    free.push(F);
    paid[S.id] = {
      lessons: Object.fromEntries(S.lessons.filter(l => !isFree(l.id)).map(l => [l.id, l.summary])),
      questions: S.questions.filter(q => !isFree(q.l)), cards: S.cards.filter(c => !isFree(c[2])), concepts: (S.concepts || []).filter(c => !isFree(c.l)),
      figs: pick(S.figs, k => !freeFigs.has(k)), boards: pick(S.boards, k => !isFree(k)), must: S.must, howto: S.howto
    };
  }
  const plain = JSON.stringify(paid), ver = L.b64u.enc((await L.sha256(new TextEncoder().encode(plain))).slice(0, 6));
  fs.mkdirSync(path.join(ROOT, 'content'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'content/paid.mz'), Buffer.from(await L.encryptJSON(K, { ver, subjects: paid })));
  const files = Object.fromEntries(SRC_ORDER.map(f => [f, fs.readFileSync(path.join(SRC, f), 'utf8')]));
  // مولّدات حلول الأسايمنت (content-src/sol) بتتحفظ متشفّرة برضه
  const solDir = path.join(SRC, 'sol'); if (fs.existsSync(solDir)) for (const f of fs.readdirSync(solDir).filter(x => /\.(py|js|cjs)$/.test(x))) files['sol/' + f] = fs.readFileSync(path.join(solDir, f), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'content/src.mz'), Buffer.from(await L.encryptJSON(K, { files })));
  fs.writeFileSync(path.join(ROOT, 'js/content/free.js'), '/* المحتوى المجاني (اتولّد بـ tools/mz.cjs build — ماتعدّلش هنا، عدّل في content-src) */\nself.MZ_PAID_VER = ' + JSON.stringify(ver) + ';\n(self.MZ_CONTENT = self.MZ_CONTENT || []).push(...' + JSON.stringify(free) + ');\n');
  const kb = n => (fs.statSync(path.join(ROOT, n)).size / 1024).toFixed(0) + 'KB';
  await assets(K);
  console.log('free.js ' + kb('js/content/free.js') + ' · paid.mz ' + kb('content/paid.mz') + ' · src.mz ' + kb('content/src.mz') + ' · ver ' + ver);
}

/** ملفات مدفوعة كبيرة (زي صفحات حل الأسايمنت): content-src/assets/<اسم>/*.jpg ← content/<اسم>.mz متشفّر بمفتاح المحتوى.
   الشكل: [4 بايت طول الهيدر][هيدر JSON][الصور ورا بعض] */
async function assets(Kin) {
  const K = Kin || (await secrets()).K, base = path.join(SRC, 'assets'); if (!fs.existsSync(base)) return;
  for (const name of fs.readdirSync(base)) {
    const dir = path.join(base, name); if (!fs.statSync(dir).isDirectory()) continue;
    const files = fs.readdirSync(dir).filter(f => /\.jpe?g$/i.test(f)).sort((a, b) => (+a.replace(/\D/g, '')) - (+b.replace(/\D/g, '')));
    const bufs = files.map(f => fs.readFileSync(path.join(dir, f)));
    const head = Buffer.from(JSON.stringify({ v: 1, pages: bufs.map(b => b.length) }));
    const len = Buffer.alloc(4); len.writeUInt32BE(head.length);
    const plain = Buffer.concat([len, head, ...bufs]);
    const key = await L.aesKey(K);
    fs.writeFileSync(path.join(ROOT, 'content', name + '.mz'), Buffer.from(await L.seal(key, new Uint8Array(plain))));
    console.log('asset ' + name + ': ' + files.length + ' صفحة · ' + (plain.length / 1024).toFixed(0) + 'KB');
  }
}

async function unpack() {
  const { K } = await secrets();
  const { files } = await L.decryptJSON(K, new Uint8Array(fs.readFileSync(path.join(ROOT, 'content/src.mz'))));
  fs.mkdirSync(SRC, { recursive: true });
  for (const [f, t] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(SRC, f)), { recursive: true }); fs.writeFileSync(path.join(SRC, f), t); }
  console.log('اتفك ' + Object.keys(files).length + ' ملف في content-src/');
}

async function issue() {
  const [, , , name, device, plan = 'term', exp] = process.argv;
  const s = await secrets();
  const code = await L.issue({ privJwk: s.privJwk, K: s.K, name, device, plan, exp: exp ? new Date(exp + 'T00:00:00Z') : (process.env.MZ_FOREVER ? null : new Date('2027-02-28T00:00:00Z')), serial: process.env.MZ_SERIAL ? +process.env.MZ_SERIAL : Math.floor(Math.random() * 60000) });
  console.log(code);
}

const cmd = process.argv[2];
/** سوبابيز: بيطلّع ملف SQL (الجداول + دالة التفعيل + الأكواد) وقايمة الأكواد — في content-src/supabase (مش بيترفع على جيت هب) */
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newCode() { const b = require('crypto').randomBytes(12); let s = ''; for (const x of b) s += CODE_ABC[x & 31]; return 'MZ-' + s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8, 12); }
async function supaCmd() {
  const { K } = await secrets();
  const dir = path.join(SRC, 'supabase'); fs.mkdirSync(dir, { recursive: true });
  const rows = [];
  for (let i = 1; i <= 90; i++) rows.push({ serial: i, plan: 'term', exp: '2027-02-28', note: '' });
  for (let i = 91; i <= 100; i++) rows.push({ serial: i, plan: 'vip', exp: '2027-02-28', note: 'VIP مدفوع (200 ج) لحد آخر الترم' });
  rows.push({ serial: 65001, plan: 'vip', exp: null, note: 'چني علي أنور (بيستو فريندو)' });
  rows.forEach(r => r.code = newCode());
  const q = s => s == null ? 'null' : "'" + String(s).replace(/'/g, "''") + "'";
  const sql = `-- مذاكِر: أكواد بتشتغل مرة واحدة بس. الصق الملف ده كله في Supabase ← SQL Editor ← Run
create table if not exists public.mz_codes (
  code text primary key,
  serial int unique not null,
  plan text not null check (plan in ('term','vip')),
  exp date,
  note text,
  device text,
  name text,
  used_at timestamptz,
  revoked boolean not null default false
);
create table if not exists public.mz_secret (id int primary key, k text not null);
alter table public.mz_codes enable row level security;
alter table public.mz_secret enable row level security;
-- مفيش أي policy: محدش من برّه يقدر يقرا أو يعدّل الجدولين. الدخول بس من الدالتين اللي تحت.
revoke all on public.mz_codes, public.mz_secret from anon, authenticated;

create or replace function public.mz_redeem(p_code text, p_device text, p_name text)
returns json language plpgsql security definer set search_path = public as $$
declare r public.mz_codes; k text;
begin
  if p_code is null or p_device is null or length(p_device) < 6 then return json_build_object('ok', false, 'reason', 'bad'); end if;
  select * into r from public.mz_codes where code = upper(trim(p_code)) for update;
  if not found then perform pg_sleep(0.5); return json_build_object('ok', false, 'reason', 'bad'); end if;
  if r.revoked then return json_build_object('ok', false, 'reason', 'revoked'); end if;
  if r.used_at is not null and r.device <> p_device then return json_build_object('ok', false, 'reason', 'used'); end if;
  if r.exp is not null and r.exp < current_date then return json_build_object('ok', false, 'reason', 'expired'); end if;
  if r.used_at is null then
    update public.mz_codes set used_at = now(), device = p_device, name = left(p_name, 80) where code = r.code;
  end if;
  select s.k into k from public.mz_secret s where id = 1;
  return json_build_object('ok', true, 'plan', r.plan, 'exp', r.exp, 'serial', r.serial, 'k', k);
end $$;

create or replace function public.mz_status(p_code text, p_device text)
returns json language sql security definer set search_path = public as $$
  select json_build_object('ok', coalesce((select not revoked and device = p_device from public.mz_codes where code = upper(trim(p_code))), false));
$$;

revoke all on function public.mz_redeem(text, text, text), public.mz_status(text, text) from public;
grant execute on function public.mz_redeem(text, text, text), public.mz_status(text, text) to anon, authenticated;

insert into public.mz_secret (id, k) values (1, ${q(L.b64u.enc(K))}) on conflict (id) do update set k = excluded.k;
insert into public.mz_codes (code, serial, plan, exp, note) values
${rows.map(r => '  (' + [q(r.code), r.serial, q(r.plan), q(r.exp), q(r.note || null)].join(', ') + ')').join(',\n')}
on conflict (serial) do nothing;
`;
  fs.writeFileSync(path.join(dir, 'setup.sql'), sql);
  const csv = '﻿' + [['رقم', 'النوع', 'الكود', 'ملاحظة']].concat(rows.map(r => [r.serial, r.plan === 'vip' ? 'VIP' : 'ترم', r.code, r.note])).map(x => x.join(',')).join('\n') + '\n';
  fs.writeFileSync(path.join(dir, 'codes.csv'), csv);
  console.log('اتعمل: content-src/supabase/setup.sql و codes.csv (' + rows.length + ' كود)');
}

({ init, build, unpack, issue, assets: () => assets(), vanity: vanityCmd, supa: supaCmd }[cmd] || (async () => console.log('الأوامر: init | build | unpack | issue')))().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
