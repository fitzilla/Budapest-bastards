// Offline support: app shell is network-first (so updates land straight away), map tiles,
// fonts and photos are cached as you browse so the map still works with patchy roaming.
const VERSION = 'bb-v2';
const SHELL = [
  './', './index.html', './styles.css', './app.js', './data.js',
  './vendor/maplibre-gl.js', './vendor/maplibre-gl.css', './vendor/fonts.css',
  './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png',
];
const RUNTIME = 'bb-runtime-v1';
const RUNTIME_MAX = 1500;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION && k !== RUNTIME) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - RUNTIME_MAX; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // our own files: network first, fall back to cache
  if (url.origin === self.location.origin) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(VERSION)).put(req, res.clone());
        return res;
      } catch {
        return (await caches.match(req, { ignoreSearch: true })) || (await caches.match('./index.html'));
      }
    })());
    return;
  }

  // weather: network first, cached copy when offline
  if (url.hostname === 'api.open-meteo.com') {
    e.respondWith(fetch(req).then(async (res) => {
      if (res.ok) (await caches.open(RUNTIME)).put(req, res.clone());
      return res;
    }).catch(() => caches.match(req)));
    return;
  }

  // tiles, glyphs, fonts, photos: cache first
  const cacheFirst = /(^|\.)openfreemap\.org$|basemaps\.cartocdn\.com$|arcgisonline\.com$|opentopomap\.org$|elevation-tiles-prod|fonts\.(googleapis|gstatic)\.com$|wikimedia\.org$/;
  if (cacheFirst.test(url.hostname) || cacheFirst.test(url.pathname)) {
    e.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') {
        const c = await caches.open(RUNTIME);
        c.put(req, res.clone()).then(() => trim(c));
      }
      return res;
    })());
  }
});
