const CACHE_NAME = "unihub-cache-v7";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo.png"
];

// ---------- Firebase Cloud Messaging (background push) ----------
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBHLPAkr8NEhbPyg01v6amBXePPtiLr6X0",
  authDomain: "unihub-a6bb3.firebaseapp.com",
  projectId: "unihub-a6bb3",
  storageBucket: "unihub-a6bb3.firebasestorage.app",
  messagingSenderId: "792185108114",
  appId: "1:792185108114:web:b26c1f28e9df1eb994184b"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  self.registration.showNotification(n.title || "اتحاد التمريض", {
    body: n.body || "",
    icon: "./logo.png",
    badge: "./logo.png"
  });
});

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
