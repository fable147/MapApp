const CACHE_NAME = 'mapapp-v1'

// Offline'da da çalışsın diye cache'lenecek dosyalar
const STATIC_ASSETS = [
  '/',
  '/index.html',
]

// Install — statik dosyaları cache'le
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate — eski cache'leri temizle
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — önce network, hata alırsa cache
self.addEventListener('fetch', (e) => {
  // Harita tile'ları ve OSRM isteklerini cache'leme (dinamik veri)
  const url = new URL(e.request.url)
  const isExternal =
    url.hostname.includes('openfreemap.org') ||
    url.hostname.includes('nominatim.openstreetmap.org') ||
    url.hostname.includes('osrm.org') ||
    url.hostname.includes('openstreetmap.de')

  if (isExternal) {
    // Dış API'ler: sadece network
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })))
    return
  }

  // Uygulama dosyaları: network-first, fallback cache
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone))
        return res
      })
      .catch(() => caches.match(e.request))
  )
})
