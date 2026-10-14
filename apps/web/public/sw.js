// TTRC Store PWA Service Worker — Version 2 (Light Theme)
const CACHE_NAME = 'ttrc-pwa-v2-light';

const PRECACHE_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/brand/pwa-icon-192.png',
  '/brand/pwa-icon-512.png',
  '/brand/pwa-maskable-512.png',
  '/brand/favicon-32x32.png',
  '/brand/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass non-GET requests immediately
  if (event.request.method !== 'GET') {
    return;
  }

  // Bypass API, checkout, admin, auth, and webhooks completely from caching
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/checkout') ||
    url.pathname.startsWith('/auth')
  ) {
    return;
  }

  // Handle HTML navigation requests: Network-First with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/offline.html').then((res) => res || Response.error())
      )
    );
    return;
  }

  // Handle static brand assets: Cache-first with network fallback
  if (url.pathname.startsWith('/brand/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }
});
