// Ganti nomor versi ini setiap kali aplikasi diperbarui
const CACHE_NAME = 'presensi-guru-v4';
const urlsToCache = [
  './index.html',
  './manifest.json',
  './xlsx.bundle.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return; // Biarkan request non-GET (Firebase dll) lewat langsung

  const url = new URL(req.url);
  const isHalaman = req.mode === 'navigate' ||
    (url.origin === self.location.origin && /\/(index\.html)?$/.test(url.pathname));

  if (isHalaman) {
    // Halaman utama: ambil versi terbaru dari internet, pakai cache hanya saat offline
    event.respondWith(
      fetch(req)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // File lain: pakai cache jika ada, jika tidak ambil dari internet
  event.respondWith(
    caches.match(req)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(req);
      })
  );
});
