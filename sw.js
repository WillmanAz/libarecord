// Service worker ringan: gambar/CSS/font lokal di-cache; HTML & JS selalu coba jaringan dulu (aman saat update).
const V = "liba-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  if (/\.(png|jpe?g|webp|svg|css|woff2?)$/i.test(u.pathname)) {
    e.respondWith(caches.open(V).then(async (c) => {
      const hit = await c.match(r);
      const net = fetch(r).then((res) => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
  } else if (!/\.mp4$/i.test(u.pathname)) {
    e.respondWith(fetch(r).then((res) => { if (res.ok && r.mode === "navigate") { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); } return res; })
      .catch(() => caches.match(r).then((h) => h || caches.match("index.html"))));
  }
});
