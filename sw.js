// 只求「可安裝成APP＋離線斷網時還能開」，資料本來就每月會更新（尤其 seed-history.js
// 之前就踩過強快取吃到舊資料的雷），所以策略一律「先連網、連得到就用新的並順便更新快取；
// 連不到才退回快取」，絕不會在有網路時刻意給舊版本。
const CACHE = 'tenchener-shell-v1';

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;   // Firebase/CDN 等外站請求不攔截，交給瀏覽器正常處理

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
