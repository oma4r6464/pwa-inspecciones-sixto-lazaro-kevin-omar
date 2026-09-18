const SW_VERSION = "v1";
const CACHE_NAME = `inspecciones-cache-${SW_VERSION}`;

// Shell mínimo necesario para que la app arranque sin red.
const PRECACHE_URLS = ["/", "/manifest.webmanifest", "/icon.svg"];


const OFFLINE_FALLBACK_URL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((error) => {
        console.error("[sw] Falló el precache inicial", error);
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});


self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isSameOriginGet(request) {
  return request.method === "GET" && new URL(request.url).origin === self.location.origin;
}


async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const fallback = await cache.match(OFFLINE_FALLBACK_URL);
    if (fallback) return fallback;
    return Response.error();
  }
}


async function handleAssetRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    networkFetch.catch(() => undefined);
    return cached;
  }

  const networkResponse = await networkFetch;
  if (networkResponse) return networkResponse;

  return Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!isSameOriginGet(request)) return; // deja pasar cross-origin y no-GET sin intervenir

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  event.respondWith(handleAssetRequest(request));
});