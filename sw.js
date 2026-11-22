// FIT TRIBE apps offline layer (23 Nov 2026). Pages: network first (new builds show at once), the last copy when there is no signal.
// Icons and manifests: cached copy first, refreshed in the background. ver.txt, Apps Script calls and other sites are never touched.
var C = 'ft-pages-v1';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('ft-pages-') === 0 && k !== C; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin || /ver\.txt$|sw\.js$/.test(u.pathname)) return;
  var key = u.origin + u.pathname;
  if (r.mode === 'navigate' || /\.html$/.test(u.pathname)) {
    e.respondWith(new Promise(function (res) {
      var done = false;
      var net = fetch(r).then(function (x) {
        if (x.ok) { var cl = x.clone(); caches.open(C).then(function (c) { c.put(key, cl); }); }
        if (!done) { done = true; res(x); }
        return x;
      });
      var fallback = function () {
        return caches.open(C).then(function (c) { return c.match(key); }).then(function (m) {
          if (m && !done) { done = true; res(m); } return m;
        });
      };
      net.catch(function () { fallback().then(function (m) { if (!m && !done) { done = true; res(Response.error()); } }); });
      setTimeout(function () { if (!done) fallback(); }, 4000); // very slow signal: show the saved copy
    }));
    return;
  }
  e.respondWith(caches.open(C).then(function (c) {
    return c.match(key).then(function (m) {
      var n = fetch(r).then(function (x) { if (x.ok) c.put(key, x.clone()); return x; });
      if (m) { n.catch(function () {}); return m; }
      return n;
    });
  }));
});
