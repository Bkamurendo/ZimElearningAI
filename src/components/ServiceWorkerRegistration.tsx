'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

// ─── useOnlineStatus hook ─────────────────────────────────────────────────────
// Returns the current navigator.onLine value and updates reactively when the
// browser fires online/offline events.

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    // Safe default for SSR — navigator is not available on the server.
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    // Sync with real state in case events fired before mount.
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// ─── Connectivity banner ──────────────────────────────────────────────────────
// Shows a non-intrusive top banner when the user goes offline or comes back.

type ConnectivityState = 'offline' | 'back-online' | null

function ConnectivityBanner({ state }: { state: ConnectivityState }) {
  if (!state) return null

  const isOffline = state === 'offline'

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position:        'fixed',
        top:             0,
        left:            0,
        right:           0,
        zIndex:          99999,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             '0.5rem',
        padding:         '0.6rem 1rem',
        background:      isOffline ? '#1e293b' : '#052e16',
        borderBottom:    isOffline ? '2px solid #f59e0b' : '2px solid #10b981',
        color:           isOffline ? '#fbbf24' : '#34d399',
        fontSize:        '0.875rem',
        fontWeight:      600,
        fontFamily:      'system-ui, sans-serif',
        animation:       'zimBannerIn 0.25s ease',
      }}
    >
      <style>{`
        @keyframes zimBannerIn {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
      {isOffline ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none"/>
          </svg>
          You&apos;re offline — some features unavailable. Downloaded content is still accessible.
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          Back online!
        </>
      )}
    </div>
  )
}

// ─── ServiceWorkerRegistration component ─────────────────────────────────────
// Mount once in the root layout. Handles:
//   - /sw.js registration with periodic update checks
//   - "New version available" bottom-right toast
//   - Offline / back-online top banner
//   - SW message handler for background-sync completion events

export function ServiceWorkerRegistration() {
  const [updateReady,       setUpdateReady]       = useState(false)
  const [waitingSW,         setWaitingSW]          = useState<ServiceWorker | null>(null)
  const [connectivityState, setConnectivityState]  = useState<ConnectivityState>(null)
  const onlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Tell the waiting SW to skip waiting and activate immediately.
  const applyUpdate = useCallback(() => {
    if (!waitingSW) return
    waitingSW.postMessage({ type: 'SKIP_WAITING' })
    setUpdateReady(false)
  }, [waitingSW])

  // Dismiss the update toast without applying.
  const dismissUpdate = useCallback(() => setUpdateReady(false), [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // ── SW registration ────────────────────────────────────────────────────
    const onControllerChange = () => {
      // The new SW has taken control — reload to get fresh assets.
      window.location.reload()
    }

    const trackInstalling = (sw: ServiceWorker) => {
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
          setWaitingSW(sw)
          setUpdateReady(true)
        }
      })
    }

    let intervalId: ReturnType<typeof setInterval> | undefined

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Already a waiting SW from a previous page load?
        if (reg.waiting && navigator.serviceWorker.controller) {
          setWaitingSW(reg.waiting)
          setUpdateReady(true)
        }

        reg.addEventListener('updatefound', () => {
          if (reg.installing) trackInstalling(reg.installing)
        })

        // Check for SW updates every 60 s
        intervalId = setInterval(() => reg.update(), 60_000)
      })
      .catch((err) => {
        console.warn('[ZimLearn SW] Registration failed:', err)
      })

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    // ── SW message handler (background sync events) ────────────────────────
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_QUIZ_COMPLETE') {
        console.info('[ZimLearn SW] Offline quiz answers synced successfully.')
      }
      if (event.data?.type === 'SYNC_NOTES_COMPLETE') {
        console.info('[ZimLearn SW] Offline notes synced successfully.')
      }
    }

    navigator.serviceWorker.addEventListener('message', handleSWMessage)

    // ── Online / offline events ────────────────────────────────────────────
    const handleOffline = () => {
      if (onlineTimerRef.current) clearTimeout(onlineTimerRef.current)
      setConnectivityState('offline')
    }

    const handleOnline = () => {
      if (onlineTimerRef.current) clearTimeout(onlineTimerRef.current)
      setConnectivityState('back-online')
      // Auto-clear the "back online" banner after 3 s
      onlineTimerRef.current = setTimeout(() => setConnectivityState(null), 3000)
    }

    // Show immediately if already offline on mount
    if (!navigator.onLine) {
      setConnectivityState('offline')
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online',  handleOnline)

    return () => {
      clearInterval(intervalId)
      if (onlineTimerRef.current) clearTimeout(onlineTimerRef.current)
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      navigator.serviceWorker.removeEventListener('message', handleSWMessage)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online',  handleOnline)
    }
  }, [])

  return (
    <>
      {/* ── Connectivity banner (top of page) ── */}
      <ConnectivityBanner state={connectivityState} />

      {/* ── Update toast (bottom-right) ── */}
      {updateReady && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            position:        'fixed',
            bottom:          '1.25rem',
            right:           '1.25rem',
            zIndex:          9999,
            display:         'flex',
            alignItems:      'center',
            gap:             '0.75rem',
            padding:         '0.875rem 1.125rem',
            background:      '#1e293b',
            border:          '1px solid #334155',
            borderRadius:    '0.75rem',
            boxShadow:       '0 10px 40px rgba(0,0,0,.4)',
            color:           '#f1f5f9',
            fontSize:        '0.9rem',
            maxWidth:        '22rem',
            animation:       'swToastIn 0.25s ease',
          }}
        >
          <style>{`
            @keyframes swToastIn {
              from { opacity: 0; transform: translateY(0.5rem); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          <span style={{ flexShrink: 0, color: '#10b981', fontSize: '1.25rem' }}>↑</span>

          <span style={{ flex: 1, lineHeight: 1.4 }}>
            <strong style={{ display: 'block', marginBottom: '0.15rem' }}>
              New version available
            </strong>
            <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
              Refresh to get the latest updates.
            </span>
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
            <button
              onClick={applyUpdate}
              style={{
                background:   '#10b981',
                color:        '#fff',
                border:       'none',
                padding:      '0.4rem 0.9rem',
                borderRadius: '0.5rem',
                fontWeight:   600,
                fontSize:     '0.82rem',
                cursor:       'pointer',
                whiteSpace:   'nowrap',
              }}
            >
              Refresh
            </button>
            <button
              onClick={dismissUpdate}
              style={{
                background:   'transparent',
                color:        '#94a3b8',
                border:       '1px solid #334155',
                padding:      '0.4rem 0.9rem',
                borderRadius: '0.5rem',
                fontWeight:   500,
                fontSize:     '0.82rem',
                cursor:       'pointer',
              }}
            >
              Later
            </button>
          </div>
        </div>
      )}
    </>
  )
}
