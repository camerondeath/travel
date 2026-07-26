// Shanghai itinerary — offline service worker
// Bump CACHE_VERSION to force clients to refetch the shell on next load.
const CACHE_VERSION = 'sh26-v24';
const SHELL = './';               // the itinerary page (index.html)
const WEATHER_HOST = 'api.open-meteo.com';
// Fonts are served from this repo now (Google Fonts is blocked in mainland
// China), so they precache like any other same-origin asset. The Catalogue
// type system: Bricolage Grotesque, IBM Plex Mono (two weights), Newsreader.
const FONTS = ['../fonts/bricolage.woff2', '../fonts/plex-mono.woff2',
               '../fonts/plex-mono-500.woff2', '../fonts/newsreader.woff2'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll([SHELL, './index.html', './manifest.json', './icon-192.png', './icon-512.png', './events.json', '../site.css', '../site.js'].concat(FONTS)))
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

  // The events feed is refreshed out of band, so serving it cache-first would
  // show last visit's list until the visit after. Network-first, cache fallback.
  if (url.origin === self.location.origin && url.pathname.endsWith('/events.json')) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Fonts are same-origin now, so they fall through to the handler below.

  // Everything same-origin (the page shell and fonts): stale-while-revalidate.
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
