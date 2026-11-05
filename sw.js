/* مذاكِر — service worker: نسخة كاملة من البرنامج للشغل من غير نت + كاش للخطوط */
const VERSION = 'mozaker-1.2.0';
const RUNTIME = 'mozaker-runtime-v1';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './favicon.ico', './css/app.css',
  './js/engine.js', './js/ui.js', './js/tools.js', './js/app.js', './js/share.js', './js/app2.js',
  './js/content/acc.js', './js/content/stats.js', './js/content/prod.js', './js/content/econ.js', './js/content/mkt.js', './js/content/law.js',
  './js/content/acc-plus.js', './js/content/stats-plus.js', './js/content/prod-plus.js', './js/content/econ-plus.js', './js/content/mkt-plus.js', './js/content/law-plus.js',
  './icons/char.png', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png', './icons/badge-96.png'
];
const CDN = /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\//;
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION && k !== RUNTIME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') { e.respondWith((async () => (await caches.match('./index.html')) || fetch(req))()); return; }
    e.respondWith((async () => {
      const hit = await caches.match(req, { ignoreSearch: true }); if (hit) return hit;
      const res = await fetch(req); if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res;
    })());
    return;
  }
  if (CDN.test(req.url)) {
    e.respondWith((async () => {
      const cache = await caches.open(RUNTIME); const hit = await cache.match(req); if (hit) return hit;
      try { const res = await fetch(req); if (res.ok || res.type === 'opaque') cache.put(req, res.clone()).catch(() => {}); return res; } catch (err) { return new Response('', { status: 504 }); }
    })());
  }
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => { const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true }); if (all.length) return all[0].focus(); return self.clients.openWindow('./#plan?tab=timer'); })());
});
