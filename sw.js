/* Monazzam offline shell. Never cache API responses or authenticated requests. */
const CACHE_NAME = 'monazzam-shell-v2';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(['./index.html','./manifest.json'])));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(n=>n.startsWith('monazzam-')&&n!==CACHE_NAME).map(n=>caches.delete(n)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req=event.request,url=new URL(req.url);
  // Cross-origin includes Firebase and the Worker. Let the browser use network only.
  if(req.method!=='GET'||url.origin!==self.location.origin||req.headers.has('Authorization'))return;
  const isShell=req.mode==='navigate'||/\/(index\.html|manifest\.json)$/.test(url.pathname);
  if(!isShell)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    try {const response=await fetch(req);if(response.ok&&response.type==='basic')await cache.put(req,response.clone());return response;}
    catch(e){const saved=await cache.match(req)||(req.mode==='navigate'?await cache.match('./index.html'):null);if(saved)return saved;throw e;}
  })());
});
