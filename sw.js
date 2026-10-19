/* 말차 오프라인 지원: 앱 파일을 기기에 저장해 두고, 인터넷이 없을 때 저장본으로 열기.
   인터넷이 있으면 항상 최신 버전을 먼저 받아옴(network-first). API 요청 등 다른 사이트 요청은 건드리지 않음. */
const CACHE = 'malcha-v1';
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./', './index.html'])).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async()=>{
    const cache = await caches.open(CACHE);
    try{
      const ctrl = new AbortController();
      const timer = setTimeout(()=>ctrl.abort(), 4000);   // 느린 네트워크면 4초 뒤 저장본 사용
      const res = await fetch(req, {signal: ctrl.signal});
      clearTimeout(timer);
      if(res.ok) cache.put(req, res.clone());
      return res;
    }catch(err){
      const hit = await cache.match(req, {ignoreSearch:true}) || (req.mode==='navigate' ? await cache.match('./index.html') : null);
      if(hit) return hit;
      throw err;
    }
  })());
});
