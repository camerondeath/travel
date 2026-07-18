// Shanghai itinerary — offline service worker
// Bump CACHE_VERSION to force clients to refetch the shell on next load.
const CACHE_VERSION = 'sh26-v1';
const SHELL = './';               // the itinerary page (index.html)
const WEATHER_HOST = 'api.open-meteo.com';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll([SHELL, './index.html', './manifest.json']))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Weather: network-first, fall back to cache.
  if (url.hostname === WEATHER_HOST) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Fonts (cross-origin, opaque): cache-first, revalidate in background.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(req).then(cached => {
        const network = fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Everything same-origin (the page shell): stale-while-revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        const network = fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
});
