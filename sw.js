// Keep this query version in sync with MathMysteryPWA.CACHE_NAME so an installed
// worker itself changes whenever a release needs a fresh offline asset set.
importScripts("./js/pwa-config.js?v=14");

const PWA = self.MathMysteryPWA;
const CACHE_NAME = PWA.CACHE_NAME;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(PWA.PRECACHE_URLS.map((url) => {
        const separator = url.includes("?") ? "&" : "?";
        const freshUrl = `${url}${separator}release=${encodeURIComponent(CACHE_NAME)}`;
        return fetch(freshUrl, { cache: "reload" }).then((response) => {
          if (!response.ok) throw new Error(`Unable to precache ${url}`);
          return cache.put(url, response);
        });
      })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((name) => name.startsWith("math-mystery-") && name !== CACHE_NAME)
        .map((name) => caches.delete(name))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const update = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
        }
        return response;
      });
      if (cached) {
        event.waitUntil(update.catch(() => undefined));
        return cached;
      }
      return update.catch(() => request.mode === "navigate"
        ? caches.match("./index.html")
        : new Response("Offline", { status: 503, statusText: "Offline" }));
    })
  );
});
