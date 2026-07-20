const CACHE = 'zkuis-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const { request } = e
  if (request.method !== 'GET') return
  if (request.url.includes('/api/')) return

  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
          return res
        })
        .catch(() => caches.match(request).then(c => c || caches.match('/')))
    )
    return
  }

  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(res => {
        if (res.ok && !request.url.includes('bootstrap-icons')) {
          caches.open(CACHE).then(c => c.put(request, res.clone()))
        }
        return res
      })
    })
  )
})
