// 鍛錬記録 service worker
// 画面（index.html）は「まず網から、届かなければ控えから」で取りに行く。
// こうしておけば、改修した時に名札を書き換えなくても新しい画面が届く。
// 記録そのもの（localStorage）は、ここで消しても触れられない。

const CACHE_NAME = 'tanren-kiroku-v2-20261105';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// 古い名札（health-journal-cache-v1 など）の控えを片付ける
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isPage = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isPage) {
    // 画面：網から取り、控えも新しくしておく。圏外なら控えを出す
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 絵（アイコン）や manifest：控えにあればそれを使う
  event.respondWith(
    caches.match(req).then((res) => res || fetch(req))
  );
});