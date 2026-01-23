// Minimal no-op service worker kept only to replace previous worker during dev.
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Attempt to unregister ourselves so older offline behavior is cleared.
  e.waitUntil(
    (async () => {
      try {
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        for (const c of clients) {
          try { c.navigate(c.url); } catch {}
        }
      } catch (err) {
        // ignore
      }
    })()
  );
});
