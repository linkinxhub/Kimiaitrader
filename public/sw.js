/**
 * Service Worker - XTrendAI Pro PWA
 * Offline support, cache des assets, push notifications
 */

const CACHE_NAME = 'xtrendai-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
];

// Install - cache core assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - network first, cache fallback for navigation
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls
  if (request.url.includes('/api/') || request.url.includes('/trpc/')) return;

  // Skip WebSockets
  if (request.url.startsWith('wss://') || request.url.startsWith('ws://')) return;

  // Navigation requests - network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets - cache first
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Default - network only
  event.respondWith(fetch(request));
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'XTrendAI Pro';
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: data.tag || 'default',
    requireInteraction: false,
    data: data.data || {},
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { action, data } = event.notification;

  if (action === 'close') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      const url = data?.url || '/';
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Background sync for offline alerts
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-alerts') {
    event.waitUntil(syncAlerts());
  }
});

async function syncAlerts() {
  // Placeholder for alert sync
  console.log('[SW] Syncing alerts...');
}

// Periodic background sync for price updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'price-update') {
    event.waitUntil(updatePrices());
  }
});

async function updatePrices() {
  console.log('[SW] Background price update');
}

console.log('[SW] XTrendAI Service Worker loaded');
