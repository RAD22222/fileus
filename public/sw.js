/* HabitPulse service worker — offline-first app shell.
 * Stale-while-revalidate: serve cached, refresh in the background.
 * Runtime-cached only (hashed asset filenames make stale URLs unreachable anyway). */
const CACHE = 'habitpulse-v1';
const PRECACHE = ['/', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok && new URL(req.url).origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached || caches.match('/'));
      return cached || network;
    })
  );
});

/* Let the page trigger reminder notifications through the worker (works when installed). */
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, icon, badge } = data;
    self.registration.showNotification(title, {
      body,
      tag: tag || 'habitpulse-reminder',
      icon: icon || '/icons/icon-192.png',
      badge: badge || '/icons/icon-192.png',
      vibrate: [60, 40, 60],
      renotify: true,
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow('/');
    })
  );
});
