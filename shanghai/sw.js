// Shanghai itinerary — offline service worker
// Bump CACHE_VERSION to force clients to refetch the shell on next load.
const CACHE_VERSION = 'sh26-v53';
const SHELL = './';               // the itinerary page (index.html)
const WEATHER_HOST = 'api.open-meteo.com';
// Fonts are served from this repo now (Google Fonts is blocked in mainland
// China), so they precache like any other same-origin asset. The Catalogue
// type system: Bricolage Grotesque, IBM Plex Mono (two weights), Newsreader.
const FONTS = ['../fonts/bricolage.woff2', '../fonts/plex-mono.woff2',
               '../fonts/plex-mono-500.woff2', '../fonts/newsreader.woff2'];

const PRECACHE = [SHELL, './index.html', './manifest.json', './icon-192.png',
                 './icon-512.png', './events.json', '../site.css', '../site.js',
                 '../gate.js'].concat(FONTS);

// Deliberately not cache.addAll(): addAll is atomic, so a single asset that
// 404s or is intercepted by a captive portal throws the whole precache away
// and the itinerary silently has no offline copy at all -- discovered only
// once offline, which is the one moment it cannot be fixed. Fetch each entry
// on its own instead and keep whatever succeeded; a missing font is worth far
// less than a missing itinerary.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => Promise.allSettled(
      PRECACHE.map(path => fetch(new Request(path, { cache: 'reload' })).then(res => {
        if (!storable(res, new URL(res.url, self.location.href))) throw new Error('unstorable');
        return cache.put(path, res);
      }))
    )).catch(() => {})
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

// A captive portal (hotel wifi, airport wifi) or an auth gate in front of the
// site answers EVERY request with its own 200 HTML login page. Cached blindly,
// that replaces the itinerary, the engine and the events feed with a login
// screen for as long as the cache lives -- which is exactly when the itinerary
// is needed offline and least fixable. So: never store a redirect, an error,
// a cross-origin opaque response, or a body whose content-type is not what the
// URL asked for.
function storable(res, url) {
  if (!res || !res.ok || res.status !== 200 || res.redirected) return false;
  if (res.type !== 'basic' && res.type !== 'default' && res.type !== 'cors') return false;
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  const p = url.pathname.toLowerCase();
  if (p.endsWith('.json')) return ct.includes('json');
  if (p.endsWith('.js')) return ct.includes('javascript') || ct.includes('ecmascript');
  if (p.endsWith('.css')) return ct.includes('css');
  if (p.endsWith('.woff2')) return ct.includes('font') || ct.includes('woff');
  if (p.endsWith('.png')) return ct.includes('image');
  return true;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Weather: network-first, fall back to cache.
  if (url.hostname === WEATHER_HOST) {
    event.respondWith(
      fetch(req).then(res => {
        if (storable(res, url)) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
        }
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
        if (storable(res, url)) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
        }
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
          if (storable(res, url)) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
});
