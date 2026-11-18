/* مذاكِر مقفول مؤقتًا: الـ service worker ده بيمسح النسخة المتخزّنة ويشيل نفسه، عشان البرنامج المتثبّت يقفل هو كمان */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k)));
    await self.registration.unregister();
    const list = await self.clients.matchAll({ type: 'window' });
    list.forEach(c => c.navigate(c.url.split('#')[0]).catch(() => {}));
  })());
});
