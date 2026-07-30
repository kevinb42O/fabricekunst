// Atelier Rembrandt — PWA Service Worker

const CACHE_NAME = 'atelier-rembrandt-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/rblogo.png',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Cache falling back to network)
self.addEventListener('fetch', (event) => {
  // Only cache GET requests and local assets
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API routes from caching
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});

// Push Event
self.addEventListener('push', (event) => {
  let data = { title: 'Nieuwe aanvraag!', body: 'U heeft een nieuwe aanvraag ontvangen.' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Nieuwe aanvraag!', body: event.data.text() };
    }
  }

  const title = data.title || 'Nieuwe aanvraag!';
  const options = {
    body: data.body || 'U heeft een nieuwe aanvraag ontvangen.',
    icon: '/rblogo.png',
    badge: '/rblogo.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/admin#inquiries'
    },
    actions: [
      { action: 'open', title: 'Bekijken' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/admin#inquiries';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Look for a client window that is already open
      for (let client of windowClients) {
        const clientUrl = new URL(client.url, self.location.origin);
        if (clientUrl.pathname.includes('/admin') || clientUrl.hash.includes('admin')) {
          // Tell the window to navigate/refresh state if possible
          if ('focus' in client) {
            client.postMessage({ type: 'NAVIGATE', url: targetUrl });
            return client.focus();
          }
        }
      }
      
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
