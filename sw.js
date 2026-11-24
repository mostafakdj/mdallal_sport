const CACHE_NAME = "mdallal-sports-v1";

const FILES = [
  "./",
  "./index.html",
  "./logo.png",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith("mdallal-sports-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {

  const url = new URL(event.request.url);

  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  if (event.request.mode === "navigate") {

    event.respondWith(
      fetch(event.request)
        .catch(() =>
          caches.match("./index.html")
        )
    );

    return;
  }

  const allowed = FILES.some(file =>
    new URL(file, self.registration.scope).href
      === url.href
  );

  if (!allowed) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {

        if (response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache =>
              cache.put(event.request, copy)
            );
        }

        return response;
      })
      .catch(() => caches.match(event.request))
  );

});
