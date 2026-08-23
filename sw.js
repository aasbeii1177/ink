// Pantone Explorer — service worker
// Caches only the app shell (this site's own files). Firebase/Firestore/Google Fonts
// requests are left alone so login, sync, and fonts always go straight to the network.

const CACHE_NAME = 'pantone-explorer-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle GET requests to our own origin — everything else (Firebase auth,
  // Firestore, Google Fonts, gstatic SDK scripts) goes straight to the network.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Page navigations: try the network first (so updates show up), fall back to
  // the cached shell when offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Other same-origin assets (icons, manifest): cache-first, refresh in background.
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
