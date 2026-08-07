// ===== Service Worker للتطبيق =====
const CACHE_NAME = 'expense-tracker-v4';
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
    const request = event.request;

    // ===== تجاهل طلبات API (لا نخزنها مؤقتاً) =====
    if (request.url.includes('/api/')) {
        console.log('[SW] API request, skipping cache:', request.url);
        return event.respondWith(fetch(request));
    }

    // ===== تجاهل طلبات التحليلات والإحصائيات =====
    if (request.url.includes('analytics') || request.url.includes('gtag')) {
        return event.respondWith(fetch(request));
    }

    // ===== تجاهل طلبات الأيقونات الخارجية =====
    if (request.url.includes('cdn') || request.url.includes('font')) {
        return event.respondWith(fetch(request));
    }

    // ===== تجاهل طلبات POST (لا يمكن تخزينها مؤقتاً) =====
    if (request.method !== 'GET') {
        console.log('[SW] Skipping non-GET request:', request.method, request.url);
        return event.respondWith(fetch(request));
    }

    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[SW] Returning cached:', request.url);
                    return cachedResponse;
                }

                console.log('[SW] Fetching from network:', request.url);
                return fetch(request)
                    .then((networkResponse) => {
                        // لا نخزن استجابات غير ناجحة
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }

                        // نسخ الاستجابة وتخزينها مؤقتاً (فقط للـ GET)
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseClone);
                                console.log('[SW] Cached new resource:', request.url);
                            })
                            .catch((error) => {
                                console.error('[SW] Cache put failed:', error);
                            });

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[SW] Fetch failed:', error);
                        // محاولة إرجاع صفحة الخطأ إذا كانت الصفحة الرئيسية
                        if (request.url.includes('/index.html') || request.url === '/') {
                            return caches.match('/offline.html');
                        }
                        return new Response('Network error', { status: 503 });
                    });
            })
    );
});

// ===== التخزين المؤقت للطلبات (للعمل دون اتصال) =====
const DB_NAME = 'expense-tracker-offline';
const STORE_NAME = 'pending-requests';
let db = null;

// فتح قاعدة البيانات
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

// حفظ طلب للتنفيذ لاحقاً
async function savePendingRequest(url, options) {
    try {
        if (!db) db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        await store.add({ url, options, timestamp: Date.now() });
        console.log('📥 Pending request saved');
    } catch (error) {
        console.error('❌ Save pending request failed:', error);
    }
}

// مزامنة الطلبات المعلقة
async function syncPendingRequests() {
    try {
        if (!db) db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const requests = await new Promise((resolve) => {
            const result = [];
            const cursor = store.openCursor();
            cursor.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    result.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(result);
                }
            };
        });
        
        console.log(`🔄 Syncing ${requests.length} pending requests`);
        
        for (const req of requests) {
            try {
                const response = await fetch(req.url, req.options);
                if (response.ok) {
                    // حذف الطلب بعد نجاحه
                    const deleteTx = db.transaction(STORE_NAME, 'readwrite');
                    const deleteStore = deleteTx.objectStore(STORE_NAME);
                    await deleteStore.delete(req.id);
                    console.log(`✅ Synced request ${req.id}`);
                }
            } catch (error) {
                console.error(`❌ Sync failed for request ${req.id}:`, error);
            }
        }
    } catch (error) {
        console.error('❌ Sync error:', error);
    }
}

// الاستماع لحالة الشبكة
self.addEventListener('online', () => {
    console.log('🔄 Network is back online - syncing...');
    syncPendingRequests();
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
