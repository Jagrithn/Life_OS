const VERSION = "ordo-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

const STATIC = /\.(js|css|png|ico|webmanifest|woff2?|svg)$/;

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(
            "<!doctype html><meta charset=utf-8><title>Offline</title><body style='font-family:system-ui;padding:2rem;text-align:center'>You're offline. Reconnect to use Ordo.</body>",
            { headers: { "content-type": "text/html; charset=utf-8" } },
          ),
      ),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const hit = await caches.match(request);
      if (hit) return hit;
      const res = await fetch(request);
      if (res && res.ok && STATIC.test(url.pathname)) {
        const copy = res.clone();
        const cache = await caches.open(VERSION);
        cache.put(request, copy);
      }
      return res;
    })(),
  );
});
