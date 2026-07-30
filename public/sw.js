// Atelier Rembrandt — PWA Service Worker

const CACHE_NAME = 'atelier-rembrandt-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/admin-manifest.json',
  '/images/andor.jpeg'
];

// Install Event — pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate Event — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin GET requests
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // CRITICAL: Never intercept /admin or /api routes — let the server handle them
  if (url.pathname === '/admin' || url.pathname.startsWith('/admin/') || url.pathname.startsWith('/api/')) return;

  // Never cache HTML navigation requests — always go to network for fresh routing
  if (event.request.mode === 'navigate') return;

  // For static assets: cache first, then network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});

// Push Notification Event
self.addEventListener('push', (event) => {
  let data = {
    title: 'Nieuwe aanvraag!',
    body: 'U heeft een nieuwe aanvraag ontvangen.'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Nieuwe aanvraag!', {
      body: data.body || 'U heeft een nieuwe aanvraag ontvangen.',
      icon: '/images/andor.jpeg',
      badge: '/images/andor.jpeg',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/admin' },
      actions: [{ action: 'open', title: 'Bekijken' }]
    })
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/admin';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        const clientUrl = new URL(client.url, self.location.origin);
        if (clientUrl.pathname === '/admin' || clientUrl.pathname.startsWith('/admin/')) {
          client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
