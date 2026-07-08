const CACHE = 'digirune-card-v2';
const SHELL = ['/card/', '/card/index.html', '/card/manifest.json', '/card/icon-192.png', '/card/icon-512.png', '/card/will-mccullough.vcf'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isCardPage = url.pathname === '/card/' || url.pathname === '/card/index.html';
  if (req.mode === 'navigate' && isCardPage) {
    e.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('/card/', copy)); return res; })
                .catch(() => caches.match('/card/').then(r => r || caches.match('/card/index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok && (req.url.includes('medallion') || req.url.includes('fonts.g') || req.url.endsWith('.vcf'))) {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => r))
  );
});
