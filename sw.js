// Sparar spelet på enheten så att det startar även utan nät.
const CACHE = 'kaninhem-v1';
const FILES = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('kaninhem-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Visa sparad version direkt, hämta ny version i bakgrunden när det finns nät.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isPage = req.mode === 'navigate';
  const sameOrigin = url.origin === location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const key = isPage ? './index.html' : req;
    const cached = await c.match(key, { ignoreSearch: isPage });
    const fresh = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) c.put(key, res.clone());
      return res;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
