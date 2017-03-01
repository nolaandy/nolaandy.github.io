let cahceTimestamp = '1486086904919'
let cacheName = 'mopho-shell-v' + cahceTimestamp
var dataCacheName = 'mopho-data-v' + cahceTimestamp
let filesToCache = [
  '/',
  '/index.html',
  '/js/*.js',
  '/js/*.map',
  '/css/*.css',
  '/css/*.map',
]

self.addEventListener('activate', (e) => {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== cacheName && key !== dataCacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }))
    })
  )
  return self.clients.claim()
})

self.addEventListener('fetch', function(e) {
  // console.log('[Service Worker] Fetch', e.request.url)
  let dataUrl = '/wp-json/wp/v2'
  if (e.request.url.indexOf(dataUrl) > -1) {
    /*
     * When the request URL contains dataUrl, the app is asking for fresh
     * weather data. In this case, the service worker always goes to the
     * network and then caches the response. This is called the "Cache then
     * network" strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
     */
    e.respondWith(
      caches.open(dataCacheName).then((cache) => {
        return fetch(e.request).then((response) => {
          cache.put(e.request.url, response.clone())
          return response
        })
      })
    )
  } else {
    /*
     * The app is asking for app shell files. In this scenario the app uses the
     * "Cache, falling back to the network" offline strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
     */
    e.respondWith(
      caches.match(e.request).then((response) => {
        return response || fetch(e.request).then(function(response) {
            if ((e.request.url.indexOf('.js') > -1) || (e.request.url.indexOf('.css') > -1)) {
              return caches.open(cacheName).then(function(cache) {
                cache.put(e.request, response.clone());
                return response;
              });
            }else{
              return response;
            }
          });
      })
    );
  }
});

self.addEventListener('install', (e) => {
  console.log('[ServiceWorker] Install')
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      console.log('[ServiceWorker] Caching app shell')
      return cache.addAll(filesToCache)
    })
  )
})
