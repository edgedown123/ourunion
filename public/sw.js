/* 우리노동조합 PWA Service Worker */
const CACHE_NAME = 'ourunion-cache-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
      await self.clients.claim();
    })()
  );
});

// 네트워크 우선, 실패 시 캐시
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        const cached = await caches.match(req);
        if (cached) return cached;
        // fallback to index for SPA routing
        const url = new URL(req.url);
        if (req.mode === 'navigate' || url.pathname.startsWith('/')) {
          const idx = await caches.match('/index.html');
          if (idx) return idx;
        }
        throw err;
      }
    })()
  );
});

// Web Push 수신
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: '우리노동조합', body: event.data ? event.data.text() : '새 소식이 있습니다.' };
  }

  const title = payload.title || '우리노동조합';
  const body = payload.body || '새 게시글이 등록되었습니다.';
  const url = payload.url || '/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if ('focus' in client) {
          client.focus();
          try { client.navigate(url); } catch {}
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })()
  );
});
