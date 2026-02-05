/* 우리노동조합 PWA Service Worker (push + basic cache) */

const CACHE_NAME = 'ourunion-cache-v6';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192-any-v6.png',
  '/icons/icon-512-any-v6.png'
];

const BYPASS_CACHE_PREFIXES = ['/api/', '/auth', '/login', '/supabase'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // old cache cleanup
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Network-first for navigation, cache-first for others
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // ✅ 로그인/인증/API 요청은 캐시를 타지 않도록 예외 처리
  if (BYPASS_CACHE_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put('/index.html', copy));
        return res;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then((c) => c.put(req, copy));
      return res;
    }))
  );
});

// Push message handler
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: '우리노동조합', body: '새 게시글이 등록되었습니다.' };
  }

  const title = payload.title || '우리노동조합';
  const body = payload.body || '새 게시글이 등록되었습니다.';
  const url = payload.url || '/#tab=home';
  const tag = payload.tag || 'ourunion-new-post';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      renotify: true,
      data: { url },
      icon: '/icons/icon-192-any-v6.png',
      badge: '/icons/icon-192-any-v6.png'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/#tab=home';

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of allClients) {
        // If we already have a window open, focus and navigate
        if ('focus' in c) {
          await c.focus();
          try { c.navigate(url); } catch {}
          return;
        }
      }
      if (clients.openWindow) {
        await clients.openWindow(url);
      }
    })()
  );
});
