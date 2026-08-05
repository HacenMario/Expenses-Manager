// ===== Service Worker للتطبيق =====
const CACHE_NAME = 'expense-tracker-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/languages.js',
  '/manifest.json',
  '/favicon.ico'
];

// ===== تثبيت Service Worker =====
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// ===== تنشيط Service Worker =====
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// ===== استراتيجية التخزين المؤقت (Cache First, ثم الشبكة) =====
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات API (لا نخزنها مؤقتاً)
  if (event.request.url.includes('/api/')) {
    console.log('[SW] API request, skipping cache:', event.request.url);
    return event.respondWith(fetch(event.request));
  }

  // تجاهل طلبات التحليلات والإحصائيات
  if (event.request.url.includes('analytics') || event.request.url.includes('gtag')) {
    return event.respondWith(fetch(event.request));
  }

  // تجاهل طلبات الأيقونات الخارجية
  if (event.request.url.includes('cdn') || event.request.url.includes('font')) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // إذا كان الملف موجوداً في الكاش، أعده
        if (cachedResponse) {
          console.log('[SW] Returning cached:', event.request.url);
          return cachedResponse;
        }

        // إذا لم يكن موجوداً، جربه من الشبكة
        console.log('[SW] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // لا نخزن استجابات غير ناجحة
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // نسخ الاستجابة وتخزينها مؤقتاً
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
                console.log('[SW] Cached new resource:', event.request.url);
              })
              .catch((error) => {
                console.error('[SW] Cache put failed:', error);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', error);
            // محاولة إرجاع صفحة الخطأ إذا كانت الصفحة الرئيسية
            if (event.request.url.includes('/index.html') || event.request.url === '/') {
              return caches.match('/offline.html');
            }
            return new Response('Network error', { status: 503 });
          });
      })
  );
});

// ===== استقبال رسائل من التطبيق =====
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);
  
  if (event.data && event.data.action === 'clearCache') {
    caches.delete(CACHE_NAME)
      .then(() => {
        console.log('[SW] Cache cleared');
        event.ports[0].postMessage({ success: true });
      })
      .catch((error) => {
        console.error('[SW] Cache clear failed:', error);
        event.ports[0].postMessage({ success: false, error: error.message });
      });
  }
});

// ===== تحديث Service Worker =====
self.addEventListener('updatefound', () => {
  console.log('[SW] Update found');
});
