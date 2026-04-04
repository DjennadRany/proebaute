// LocBeaute Service Worker — Web Push & Cache
const CACHE_NAME = 'locbeaute-v1';

// Installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification reçue depuis le serveur
self.addEventListener('push', (event) => {
  let data = { title: 'LocBeaute', body: 'Nouvelle notification' };
  try {
    data = event.data ? event.data.json() : data;
  } catch (_) {}

  const options = {
    body: data.body ?? '',
    icon: data.icon ?? '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url ?? '/' },
    actions: data.actions ?? [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'LocBeaute', options)
  );
});

// Clic sur une notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Fetch : stratégie network-first pour les API, cache-first pour les assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Pas de cache pour les requêtes Supabase / API
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api')) return;
  // Pas de cache pour les POST/PUT/DELETE
  if (event.request.method !== 'GET') return;
});
