// Self-unregistering service worker
// This file exists to kill any stale service workers from previous sessions.
// When an old SW fetches /sw.js for an update, it gets this file which unregisters itself.
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    self.registration.unregister().then(() => self.clients.claim())
  );
});
