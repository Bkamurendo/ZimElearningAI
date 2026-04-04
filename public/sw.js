// =============================================================================
// ZimLearn Service Worker — Offline-first PWA
// Version: zimlearn-v2
// =============================================================================
// Cache strategy summary:
//   /_next/static/**            → Cache First (content-hashed, immutable)
//   Images                      → Cache First, network fallback, 7-day TTL
//   Fonts (Google / local)      → Cache First, very long TTL
//   /api/student/subjects       → Stale While Revalidate (1-hour max-age)
//   /api/announcements          → Stale While Revalidate (1-hour max-age)
//   /api/documents/study-content → Network First, 1-hour cache
//   /api/ai-* (AI endpoints)    → Network Only (responses are unique)
//   /api/auth/** + /auth/**     → Network Only (never cache auth tokens)
//   All other /api/**           → Network Only
//   /student/** + /teacher/**  → Network First, DYNAMIC_CACHE fallback
//   All navigation pages        → Network First, cache fallback, then /offline
//   Background Sync             → Replay offline quiz answers + notes
// =============================================================================

const CACHE_VERSION   = 'zimlearn-v2'
const STATIC_CACHE    = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE   = `${CACHE_VERSION}-dynamic`
const DOCUMENT_CACHE  = `${CACHE_VERSION}-documents`
const API_CACHE       = `${CACHE_VERSION}-api`
const IMAGE_CACHE     = `${CACHE_VERSION}-images`
const FONT_CACHE      = `${CACHE_VERSION}-fonts`

const ALL_CACHES = [STATIC_CACHE, DYNAMIC_CACHE, DOCUMENT_CACHE, API_CACHE, IMAGE_CACHE, FONT_CACHE]

// Pages pre-cached during install. Only include publicly accessible routes.
const PRECACHE_PAGES = [
  '/offline',
  '/login',
  '/register',
]

const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// ─── Helper: classify requests ───────────────────────────────────────────────

function isAuthRoute(url) {
  const { pathname, hostname } = new URL(url)
  return (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth/') ||
    pathname.includes('supabase') ||
    pathname.includes('callback') ||
    pathname.includes('token') ||
    pathname.includes('session') ||
    hostname.includes('supabase.co')
  )
}

function isAIRoute(url) {
  return new URL(url).pathname.startsWith('/api/ai-')
}

function isStaleWhileRevalidateAPI(url) {
  const { pathname } = new URL(url)
  return (
    pathname.startsWith('/api/student/subjects') ||
    pathname.startsWith('/api/announcements') ||
    pathname.startsWith('/api/student/resources')
  )
}

function isStudyContentAPI(url) {
  return new URL(url).pathname.startsWith('/api/documents/study-content')
}

function isStaticAsset(url) {
  const { pathname } = new URL(url)
  return pathname.startsWith('/_next/static/') || pathname.startsWith('/_next/image')
}

function isImage(url) {
  return /\.(png|jpg|jpeg|gif|svg|ico|webp|avif)(\?.*)?$/.test(new URL(url).pathname)
}

function isFontRequest(url) {
  const { hostname, pathname } = new URL(url)
  return (
    hostname === 'fonts.googleapis.com' ||
    hostname === 'fonts.gstatic.com' ||
    /\.(woff2?|ttf|otf|eot)(\?.*)?$/.test(pathname)
  )
}

function isNavigation(request) {
  return request.mode === 'navigate'
}

function isDashboardPage(url) {
  const { pathname } = new URL(url)
  return pathname.startsWith('/student/') || pathname.startsWith('/teacher/')
}

// ─── Helper: cache I/O ───────────────────────────────────────────────────────

/**
 * Store a cloned copy of response in the named cache.
 * Only caches 200-range responses to avoid poisoning with errors.
 */
async function putInCache(cacheName, request, response) {
  if (!response || !response.ok) return response
  const cache = await caches.open(cacheName)
  cache.put(request, response.clone())
  return response
}

/**
 * Delete cached entries older than maxAgeMs using the Date response header.
 */
async function evictStale(cacheName, maxAgeMs) {
  try {
    const cache = await caches.open(cacheName)
    const keys  = await cache.keys()
    const now   = Date.now()
    await Promise.all(
      keys.map(async (req) => {
        const res = await cache.match(req)
        if (!res) return
        const date = res.headers.get('date')
        if (date && now - new Date(date).getTime() > maxAgeMs) {
          await cache.delete(req)
        }
      })
    )
  } catch {
    // eviction is best-effort — ignore errors
  }
}

// ─── Strategy: Cache First ───────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const networkRes = await fetch(request)
    await putInCache(cacheName, request, networkRes.clone())
    return networkRes
  } catch {
    return new Response('', { status: 503 })
  }
}

// ─── Strategy: Network First ─────────────────────────────────────────────────

async function networkFirst(request, cacheName) {
  try {
    const networkRes = await fetch(request)
    if (networkRes.ok) {
      await putInCache(cacheName, request, networkRes.clone())
    }
    return networkRes
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached

    // Navigation fallback — serve /offline page
    if (isNavigation(request)) {
      const offlinePage = await caches.match('/offline')
      if (offlinePage) return offlinePage
      return minimalOfflinePage()
    }

    return new Response('', { status: 503 })
  }
}

// ─── Strategy: Stale While Revalidate ────────────────────────────────────────

async function staleWhileRevalidate(request, cacheName, maxAgeSeconds) {
  const cache  = await caches.open(cacheName)
  const cached = await cache.match(request)

  // Check if cached copy is still fresh enough
  if (cached) {
    const date = cached.headers.get('date')
    const ageMs = date ? Date.now() - new Date(date).getTime() : Infinity
    const isFresh = ageMs < maxAgeSeconds * 1000

    // Revalidate in the background regardless of freshness
    const revalidate = fetch(request)
      .then((networkRes) => {
        if (networkRes.ok) cache.put(request, networkRes.clone())
        return networkRes
      })
      .catch(() => null)

    // Return stale if still within max-age, otherwise wait for network
    if (isFresh) {
      return cached
    }
    // Stale but not fresh — wait for network, fall back to stale
    const networkRes = await revalidate
    return networkRes && networkRes.ok ? networkRes : cached
  }

  // Nothing cached — fetch and store
  try {
    const networkRes = await fetch(request)
    if (networkRes.ok) {
      cache.put(request, networkRes.clone())
    }
    return networkRes
  } catch {
    return new Response(
      JSON.stringify({ error: 'You are offline — data unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// ─── Minimal offline fallback HTML ───────────────────────────────────────────

function minimalOfflinePage() {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ZimLearn — Offline</title>
  <style>
    body{background:#0f172a;color:#f1f5f9;font-family:system-ui,sans-serif;display:flex;
    align-items:center;justify-content:center;height:100vh;margin:0;padding:1rem}
    .card{text-align:center;max-width:400px}
    h1{color:#10b981;font-size:2rem;margin-bottom:.5rem}
    p{color:#94a3b8;margin-bottom:1.5rem}
    button{background:#10b981;color:#fff;border:none;padding:.75rem 2rem;
    border-radius:.5rem;cursor:pointer;font-size:1rem;font-weight:600}
    button:hover{background:#059669}
  </style>
</head>
<body>
  <div class="card">
    <h1>ZimLearn</h1>
    <p>You're offline — please check your connection and try again.</p>
    <button onclick="location.reload()">Try Again</button>
  </div>
</body>
</html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  )
}

// ─── Install ─────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      const urls  = [...PRECACHE_PAGES, ...PRECACHE_ASSETS]
      // Use allSettled so one missing asset doesn't abort the whole install
      await Promise.allSettled(
        urls.map(url =>
          fetch(url, { credentials: 'omit' })
            .then(res => { if (res.ok) cache.put(url, res) })
            .catch(() => { /* asset may not exist yet — skip */ })
        )
      )
      // Activate new SW immediately without waiting for old tabs to close
      await self.skipWaiting()
    })()
  )
})

// ─── Activate ────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const existing = await caches.keys()
      // Delete caches from previous SW versions
      await Promise.all(
        existing
          .filter(key => key.startsWith('zimlearn-') && !ALL_CACHES.includes(key))
          .map(key => caches.delete(key))
      )
      // Take control of all open clients immediately
      await self.clients.claim()
    })()
  )
})

// ─── Fetch ───────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = request.url

  // Only handle HTTP(S) GET/HEAD; let mutations reach the network directly
  if (!url.startsWith('http')) return
  if (request.method !== 'GET' && request.method !== 'HEAD') return

  // ── 1. Auth / Supabase — Network Only ────────────────────────────────────
  if (isAuthRoute(url)) {
    event.respondWith(fetch(request))
    return
  }

  // ── 2. AI endpoints — Network Only (responses are unique per query) ───────
  if (isAIRoute(url)) {
    event.respondWith(fetch(request))
    return
  }

  // ── 3. Subject / announcement APIs — Stale While Revalidate (1 hour) ─────
  if (isStaleWhileRevalidateAPI(url)) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE, 3600))
    return
  }

  // ── 4. Study-content API — Network First, 1-hour cache ───────────────────
  if (isStudyContentAPI(url)) {
    event.respondWith(
      (async () => {
        try {
          const networkRes = await fetch(request)
          if (networkRes.ok) {
            await putInCache(API_CACHE, request, networkRes.clone())
            evictStale(API_CACHE, 60 * 60 * 1000) // 1 hour, non-blocking
          }
          return networkRes
        } catch {
          const cached = await caches.match(request)
          return cached || new Response(
            JSON.stringify({ error: 'You are offline — content unavailable' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          )
        }
      })()
    )
    return
  }

  // ── 5. All other API routes — Network Only ───────────────────────────────
  if (new URL(url).pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ error: 'You are offline' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    )
    return
  }

  // ── 6. Next.js static bundles — Cache First (content-hashed, immutable) ──
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // ── 7. Font requests — Cache First, very long TTL ─────────────────────────
  if (isFontRequest(url)) {
    event.respondWith(cacheFirst(request, FONT_CACHE))
    return
  }

  // ── 8. Images — Cache First, network fallback, 7-day TTL ─────────────────
  if (isImage(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        try {
          const networkRes = await fetch(request)
          if (networkRes.ok) {
            await putInCache(IMAGE_CACHE, request, networkRes.clone())
            evictStale(IMAGE_CACHE, 7 * 24 * 60 * 60 * 1000) // 7 days, non-blocking
          }
          return networkRes
        } catch {
          // Return a transparent 1×1 SVG so layouts don't break
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          )
        }
      })()
    )
    return
  }

  // ── 9. Student / Teacher dashboard pages — Network First, DYNAMIC_CACHE ──
  if (isDashboardPage(url)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
    return
  }

  // ── 10. All other navigations — Network First, /offline fallback ──────────
  if (isNavigation(request)) {
    event.respondWith(networkFirst(request, DOCUMENT_CACHE))
    return
  }

  // ── 11. Everything else — Network First, generic cache fallback ───────────
  event.respondWith(networkFirst(request, DYNAMIC_CACHE))
})

// ─── Background Sync ─────────────────────────────────────────────────────────
// When the browser comes back online, replay any actions queued while offline.

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-quiz') {
    event.waitUntil(syncOfflineQuiz())
  }
  if (event.tag === 'sync-offline-notes') {
    event.waitUntil(syncOfflineNotes())
  }
  if (event.tag === 'zimlearn-sync-answers') {
    event.waitUntil(syncOfflineQuiz())
  }
})

/**
 * Read queued quiz answers from IndexedDB and POST them to the server.
 * The client is responsible for populating the 'offline-quiz-queue' store.
 */
async function syncOfflineQuiz() {
  try {
    const db = await openOfflineDB()
    const tx = db.transaction('quiz-queue', 'readwrite')
    const store = tx.objectStore('quiz-queue')
    const entries = await idbGetAll(store)

    for (const entry of entries) {
      try {
        const res = await fetch('/api/student/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry.payload),
          credentials: 'include',
        })
        if (res.ok) {
          await idbDelete(store, entry.id)
        }
      } catch {
        // Network still unavailable — leave in queue, sync will retry
        break
      }
    }

    await tx.done?.catch(() => {})
    db.close()

    // Notify open tabs that sync is complete
    const clients = await self.clients.matchAll()
    clients.forEach(c => c.postMessage({ type: 'SYNC_QUIZ_COMPLETE' }))
  } catch {
    // IndexedDB may not be set up yet — skip silently
  }
}

/**
 * Read queued note saves from IndexedDB and POST them to the server.
 */
async function syncOfflineNotes() {
  try {
    const db = await openOfflineDB()
    const tx = db.transaction('notes-queue', 'readwrite')
    const store = tx.objectStore('notes-queue')
    const entries = await idbGetAll(store)

    for (const entry of entries) {
      try {
        const res = await fetch('/api/student/notes/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry.payload),
          credentials: 'include',
        })
        if (res.ok) {
          await idbDelete(store, entry.id)
        }
      } catch {
        break
      }
    }

    await tx.done?.catch(() => {})
    db.close()

    const clients = await self.clients.matchAll()
    clients.forEach(c => c.postMessage({ type: 'SYNC_NOTES_COMPLETE' }))
  } catch {
    // IndexedDB may not be set up yet — skip silently
  }
}

// ─── IndexedDB helpers (minimal, no external dependency) ─────────────────────

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('zimlearn-offline', 1)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('quiz-queue')) {
        db.createObjectStore('quiz-queue', { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('notes-queue')) {
        db.createObjectStore('notes-queue', { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

function idbGetAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror   = () => reject(req.error)
  })
}

function idbDelete(store, key) {
  return new Promise((resolve, reject) => {
    const req = store.delete(key)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

// ─── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'ZimLearn', {
      body:    data.body  || 'You have a new notification',
      icon:    '/icon-192.png',
      badge:   '/icon-192.png',
      data:    { url: data.url || '/student/dashboard' },
      actions: [
        { action: 'open',    title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'dismiss') return

  const targetUrl = event.notification.data?.url || '/student/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(targetUrl)
    })
  )
})

// ─── Message Handler ──────────────────────────────────────────────────────────
// Allows the React app to communicate directly with the SW.

self.addEventListener('message', (event) => {
  // Client-driven SW update (sent when update banner is clicked)
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  // Client can request that the SW pre-cache a specific list of study URLs
  if (event.data?.type === 'CACHE_URLS') {
    const urls = Array.isArray(event.data.urls) ? event.data.urls : []
    caches.open(DYNAMIC_CACHE).then(cache => {
      urls.forEach(url =>
        fetch(url, { credentials: 'include' })
          .then(res => { if (res.ok) cache.put(url, res) })
          .catch(() => {})
      )
    })
  }

  // Client can explicitly clear a specific cache
  if (event.data?.type === 'CLEAR_CACHE') {
    const name = event.data.cacheName
    if (name && ALL_CACHES.includes(name)) {
      caches.delete(name)
    }
  }
})
