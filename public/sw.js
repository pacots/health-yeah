// Health Yeah Service Worker - Offline-First Implementation
// Priority: Emergency-critical routes must work offline without network dependency

const CACHE_VERSION = 'hw-v1';
const RUNTIME_CACHE = 'hw-runtime';
const ASSETS_CACHE = 'hw-assets';
const OFFLINE_FALLBACK = '/offline.html';

// Emergency-critical routes that MUST work offline
const CRITICAL_ROUTES = [
  '/',
  '/summary/emergency',
  '/records/allergies',
  '/records/medications',
  '/records/conditions',
  '/profile',
];

// Install: precache critical routes to ensure offline access
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Health Yeah service worker');

  event.waitUntil(
    caches.open(RUNTIME_CACHE).then((cache) => {
      console.log('[SW] Precaching critical routes');
      // Prefetch critical routes - these MUST be available offline
      return Promise.all(
        CRITICAL_ROUTES.map((route) => {
          return fetch(route, { credentials: 'same-origin' })
            .then((response) => {
              if (response && response.status === 200) {
                cache.put(route, response);
                console.log('[SW] Cached:', route);
              }
            })
            .catch((err) => {
              console.warn('[SW] Failed to precache:', route, err.message);
              // Continue anyway - cache will be populated on first visit
            });
        })
      );
    }).then(() => {
      self.skipWaiting(); // Activate immediately
    })
  );
});

// Activate: claim all clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Health Yeah service worker');
  event.waitUntil(
    // Clean up old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION && name !== RUNTIME_CACHE && name !== ASSETS_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: Intelligent caching with offline support
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip API routes that require network
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/documents')) {
    return;
  }

  // HTML navigation requests - CRITICAL for offline support
  if (request.mode === 'navigate' || request.destination === 'document') {
    // Check if this is a critical route that MUST work offline
    const isCriticalRoute = CRITICAL_ROUTES.some((route) =>
      url.pathname === route || url.pathname.startsWith(route + '/')
    );

    if (isCriticalRoute) {
      // CACHE-FIRST for critical emergency routes
      // Load from cache immediately, update from network in background
      event.respondWith(
        caches.match(request, { cacheName: RUNTIME_CACHE })
          .then((cachedResponse) => {
            // If cached, return immediately (instant offline access)
            if (cachedResponse) {
              console.log('[SW] Serving cached (critical):', request.url);

              // Update cache in background (don't wait for it)
              fetch(request)
                .then((response) => {
                  if (response && response.status === 200) {
                    const clonedResponse = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => {
                      cache.put(request, clonedResponse);
                      console.log('[SW] Updated cache:', request.url);
                    });
                  }
                })
                .catch(() => {
                  // Network failed, but we already served cache, so OK
                });

              return cachedResponse;
            }

            // Not in cache, fetch from network
            return fetch(request)
              .then((response) => {
                if (response && response.status === 200) {
                  const clonedResponse = response.clone();
                  caches.open(RUNTIME_CACHE).then((cache) => {
                    cache.put(request, clonedResponse);
                    console.log('[SW] Cached new:', request.url);
                  });
                }
                return response;
              })
              .catch(() => {
                // Network failed and not in cache
                console.log('[SW] Showing offline fallback for:', request.url);
                return caches.match(OFFLINE_FALLBACK)
                  .then((fallback) => {
                    if (fallback) return fallback;
                    return new Response(
                      'App offline and cache unavailable',
                      { status: 503, statusText: 'Service Unavailable' }
                    );
                  });
              });
          })
      );
      return;
    }

    // Non-critical routes use network-first (original behavior)
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request, { cacheName: RUNTIME_CACHE })
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('[SW] Serving fallback cache:', request.url);
                return cachedResponse;
              }
              console.log('[SW] Showing offline fallback for:', request.url);
              return caches.match(OFFLINE_FALLBACK)
                .then((fallback) => {
                  if (fallback) return fallback;
                  return new Response(
                    'App offline and cache unavailable',
                    { status: 503, statusText: 'Service Unavailable' }
                  );
                });
            });
        })
    );
    return;
  }

  // CSS requests - cache-first
  if (request.destination === 'style') {
    event.respondWith(
      caches.match(request, { cacheName: ASSETS_CACHE })
        .then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          return fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                const clonedResponse = response.clone();
                caches.open(ASSETS_CACHE).then((cache) => {
                  cache.put(request, clonedResponse);
                });
              }
              return response;
            })
            .catch(() => {
              return new Response('', { status: 204 });
            });
        })
    );
    return;
  }

  // JavaScript requests - cache-first with network update
  if (request.destination === 'script') {
    event.respondWith(
      caches.match(request, { cacheName: ASSETS_CACHE })
        .then((cachedResponse) => {
          if (cachedResponse) {
            fetch(request)
              .then((response) => {
                if (response && response.status === 200) {
                  caches.open(ASSETS_CACHE).then((cache) => {
                    cache.put(request, response);
                  });
                }
              })
              .catch(() => {});
            return cachedResponse;
          }

          return fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                const clonedResponse = response.clone();
                caches.open(ASSETS_CACHE).then((cache) => {
                  cache.put(request, clonedResponse);
                });
              }
              return response;
            })
            .catch(() => {
              return new Response('', { status: 204 });
            });
        })
    );
    return;
  }

  // Image requests - cache-first with network fallback
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request, { cacheName: ASSETS_CACHE })
        .then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          return fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                const clonedResponse = response.clone();
                caches.open(ASSETS_CACHE).then((cache) => {
                  cache.put(request, clonedResponse);
                });
              }
              return response;
            })
            .catch(() => {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect fill="#f3f4f6"/></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' }, status: 200 }
              );
            });
        })
    );
    return;
  }

  // Font requests - cache-first (immutable)
  if (request.destination === 'font') {
    event.respondWith(
      caches.match(request, { cacheName: ASSETS_CACHE })
        .then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          return fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                const clonedResponse = response.clone();
                caches.open(ASSETS_CACHE).then((cache) => {
                  cache.put(request, clonedResponse);
                });
              }
              return response;
            })
            .catch(() => {
              return new Response('', { status: 204 });
            });
        })
    );
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clonedResponse = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, clonedResponse);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request, { cacheName: RUNTIME_CACHE });
      })
  );
});

// Handle messages from client (skip waiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
