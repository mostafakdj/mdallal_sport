
const CACHE_NAME = "mdallal-sports-auto-v2";

const SCOPE = self.registration.scope;

self.addEventListener("install", event => {

  event.waitUntil(self.skipWaiting());

});

self.addEventListener("activate", event => {

  event.waitUntil((async () => {

    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith("mdallal-sports-") &&
          key !== CACHE_NAME
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();

  })());

});

self.addEventListener("message", event => {

  if (event.data?.type === "SKIP_WAITING") {

    self.skipWaiting();

  }

});

self.addEventListener("fetch", event => {

  const request = event.request;

  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !url.href.startsWith(SCOPE)
  ) {
    return;
  }

  event.respondWith((async () => {

    const cache = await caches.open(CACHE_NAME);

    try {

      const response = await fetch(request, {
        cache: "no-store"
      });

      if (response.ok) {

        try {

          await cache.put(
            request,
            response.clone()
          );

        } catch (error) {

          console.warn("Cache update failed", error);

        }

      }

      return response;

    } catch (error) {

      const cached = await cache.match(request);

      if (cached) {

        return cached;

      }

      if (request.mode === "navigate") {

        return new Response(
          "لا يوجد اتصال بالإنترنت. يرجى إعادة المحاولة.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=UTF-8"
            }
          }
        );

      }

      return Response.error();

    }

  })());

});
