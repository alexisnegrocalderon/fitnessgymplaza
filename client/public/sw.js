// Service worker mínimo para que /app sea instalable ("agregar a inicio").
//
// No hay una lista de assets para precachear en tiempo de build (Vite les
// pone un hash al nombre en cada build, así que no se puede listar acá a
// mano) — en cambio, cachea en caliente lo que ya se pidió con éxito
// (network-first con fallback a caché) para que la app abra más rápido en
// visitas siguientes y no quede en blanco ante un corte de red breve. No
// pretende soportar reservar clases sin conexión — eso necesita red sí o sí.

const CACHE_NAME = "plaza-fitness-v1";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const { request } = event;
  // Solo GET, y nunca las llamadas a /api — esas siempre deben ir a la red,
  // nunca servir una respuesta vieja cacheada por error.
  if (
    request.method !== "GET" ||
    new URL(request.url).pathname.startsWith("/api/")
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      })
      .catch(() =>
        caches.match(request).then(cached => cached || caches.match("/app"))
      )
  );
});
