const CACHE_NAME = "unihub-cache-v4";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo.png"
];

// Install: pre-cache the core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for Firebase/live data, cache-first for the app shell
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Never cache Firebase/Firestore requests — always go to network
  if (url.includes("firestore.googleapis.com") || url.includes("firebaseio.com") || url.includes("googleapis.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((response) => {
            if (event.request.method === "GET" && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
            }
            return response;
          })
          .catch(() => cached)
      );
    })
  );
});
