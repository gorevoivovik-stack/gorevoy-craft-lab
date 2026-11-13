const CACHE_NAME = 'gorevoy-craft-lab-v14';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// Network-first for HTML navigation, fallback to cache; Cache-first for icons/assets
self.addEventListener('fetch', event => {
  const isHtml = event.request.mode === 'navigate' ||
    (event.request.method === 'GET' && event.request.headers.get('accept')?.includes('text/html'));

  if (isHtml) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(netRes => {
        if (netRes && netRes.status === 200) {
          const clone = netRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return netRes;
      });
    })
  );
});
