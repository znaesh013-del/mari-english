/* Service worker: кэширует оболочку приложения для офлайна.
   Аудио и метки уроков хранятся отдельно в IndexedDB (их качает само приложение). */
const CACHE = "mari-shell-v2";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Оболочку отдаём cache-first; всё остальное (в т.ч. аудио с облака) — network-first.
  const isShell = url.origin === location.origin;
  if (isShell) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        const cp = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return resp;
      }).catch(() => caches.match("./index.html")))
    );
  }
});
