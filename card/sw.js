const CACHE = 'digirune-card-v1';
const SHELL = ['/card/', '/card/index.html', '/card/manifest.json', '/card/icon-192.png', '/card/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('/card/', copy)); return res; })
                .catch(() => caches.match('/card/').then(r => r || caches.match('/card/index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok && (req.url.includes('medallion') || req.url.includes('fonts.g'))) {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => r))
  );
});
