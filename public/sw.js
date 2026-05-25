// ═══════════════════════════════════════════════════════════
// QuestStar service worker — offline shell + runtime caching
// ═══════════════════════════════════════════════════════════
// Runtime caching (not build-time precache) so it works with Vite's hashed
// asset names without a generated manifest:
//   • navigations → network-first, fall back to the cached app shell (offline)
//   • same-origin GET assets → stale-while-revalidate
//   • cross-origin (Supabase, fonts, CDNs) → passthrough (not cached)

const CACHE = "queststar-v1";
const SHELL = "/index.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([SHELL, "/"])).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let cross-origin pass through

  // App navigations → network first, offline fallback to cached shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put(SHELL, res.clone())).catch(() => {});
          return res;
        })
        .catch(() => caches.match(SHELL).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Static assets → stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
