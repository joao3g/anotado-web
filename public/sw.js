// Service worker: lets the app be installed on phones and open fast.
// It caches ONLY this site's own static files (the HTML shell and the Vite JS/CSS bundles).
// API calls go to another origin (VITE_API_BASE_URL) and are never handled here,
// so money data and the login token never go into this cache.
const CACHE = "expense-tracker-v1";
const MAX_ASSETS = 40; // Old bundles from past deploys are removed after this many

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => cache.add("/index.html"))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

async function trimAssets(cache) {
    // cache.keys() keeps insertion order: the oldest bundles come first.
    const assets = (await cache.keys()).filter((request) => new URL(request.url).pathname.startsWith("/assets/"));

    for (const request of assets.slice(0, Math.max(0, assets.length - MAX_ASSETS))) {
        await cache.delete(request);
    }
}

self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only GET requests to this site. Everything else (the API, Google Fonts, POST...) goes straight to the network.
    if (request.method !== "GET" || url.origin !== self.location.origin) return;

    // Page loads: network first, so a new deploy shows at once. The cached shell is only used offline.
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        event.waitUntil(caches.open(CACHE).then((cache) => cache.put("/index.html", copy)));
                    }
                    return response;
                })
                .catch(() => caches.match("/index.html"))
        );
        return;
    }

    // Vite bundles have a content hash in the file name and never change: cache first.
    if (url.pathname.startsWith("/assets/")) {
        event.respondWith(
            caches.match(request).then((cached) => cached || fetch(request).then((response) => {
                if (response.ok) {
                    const copy = response.clone();
                    event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy).then(() => trimAssets(cache))));
                }
                return response;
            }))
        );
    }

    // Other files (icons, manifest, logo) use the normal network and browser cache.
});
