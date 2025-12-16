const CACHE_NAME = 'ai-agent-v4';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './agent.js',
    './manifest.webmanifest',
    './icon.png',
    './service-worker.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
