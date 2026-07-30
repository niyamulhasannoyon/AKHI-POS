const CACHE_NAME = 'akhi-pos-v4';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/js/app.js',
    '/js/pos.js',
    '/js/inventory.js',
    '/js/analytics.js',
    '/js/accounting.js',
    '/js/hr.js',
    '/css/style.css',
    '/css/light-mode.css',
    '/css/invoice-print.css',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://akhipoultryfarmpos.deluxypaint.com/favicon.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Bypass Firestore connection strings
    if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('google.com/')) {
        return; // Firebase SDK handles offline
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Stale While Revalidate Strategy
            if (cachedResponse) {
                fetch(event.request).then((networkResponse) => {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }).catch(() => { });
                return cachedResponse;
            }

            // Fetch from network and cache
            return fetch(event.request).then((networkResponse) => {
                if (event.request.method === 'GET' && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Offline fallback for index page
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
