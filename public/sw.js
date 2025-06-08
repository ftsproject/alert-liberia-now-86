const CACHE_NAME = 'api-cache-v1-LTC';
const API_URL_PREFIX = 'https://sturdy-broccoli-x647p9gqjxrhvqrp-5000.app.github.dev/api/';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only cache GET requests to your API
  if (
    request.method === 'GET' &&
    request.url.startsWith(API_URL_PREFIX)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          // Try network first
          const response = await fetch(request);
          // Clone and store in cache
          cache.put(request, response.clone());
          return response;
        } catch (err) {
          // If network fails, try cache
          const cached = await cache.match(request);
          if (cached) return cached;
          // Optionally, return a fallback response here
          return new Response(JSON.stringify({ error: "Offline and no cached data." }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })
    );
  }
});