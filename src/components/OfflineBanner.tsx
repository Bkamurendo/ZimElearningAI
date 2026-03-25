'use client'

import { useEffect, useState } from 'react'
import { useOnlineStatus } from './ServiceWorkerRegistration'

// ─── OfflineBanner ────────────────────────────────────────────────────────────
// Renders a subtle amber banner pinned to the top of the viewport while the
// user is offline. Auto-hides (with a short confirmation flash) when the
// connection is restored.

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  // "justRestored" gives the user a brief "Back online" confirmation before
  // the banner slides away entirely.
  const [justRestored, setJustRestored] = useState(false)
  // Controls CSS visibility — lets us animate out before removing from DOM.
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setJustRestored(false)
      setVisible(true)
    } else if (visible) {
      // Was visible and is now online — show "Back online" briefly.
      setJustRestored(true)
      const timer = setTimeout(() => setVisible(false), 2500)
      return () => clearTimeout(timer)
    }
    // If isOnline and never was visible, do nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline])

  if (!visible) return null

  const isOffline = !isOnline

  return (
    <>
      <style>{`
        @keyframes bannerSlideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes bannerSlideUp {
          from { transform: translateY(0);    opacity: 1; }
          to   { transform: translateY(-100%); opacity: 0; }
        }
        .offline-banner-enter { animation: bannerSlideDown 0.3s ease forwards; }
        .offline-banner-exit  { animation: bannerSlideUp   0.35s ease forwards; }
      `}</style>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={isOffline ? 'offline-banner-enter' : 'offline-banner-exit'}
        style={{
          position:        'fixed',
          top:             0,
          left:            0,
          right:           0,
          zIndex:          1000,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          gap:             '0.6rem',
          padding:         '0.55rem 1rem',
          background:      isOffline
            ? 'linear-gradient(90deg, #92400e, #78350f)'
            : 'linear-gradient(90deg, #065f46, #064e3b)',
          color:           '#fff',
          fontSize:        '0.875rem',
          fontWeight:      500,
          lineHeight:      1.4,
          boxShadow:       '0 2px 8px rgba(0,0,0,.25)',
          // Slightly translucent so the page title is still hinted behind it.
          backdropFilter:  'blur(4px)',
        }}
      >
        {/* Status dot */}
        <span
          aria-hidden="true"
          style={{
            width:        '0.5rem',
            height:       '0.5rem',
            borderRadius: '50%',
            background:   isOffline ? '#fbbf24' : '#34d399',
            flexShrink:   0,
            boxShadow:    isOffline
              ? '0 0 0 3px rgba(251,191,36,.25)'
              : '0 0 0 3px rgba(52,211,153,.25)',
          }}
        />

        <span>
          {isOffline
            ? "You're offline — some features may be unavailable"
            : 'Back online — content refreshed'}
        </span>

        {isOffline && (
          <a
            href="/offline"
            style={{
              marginLeft:     '0.25rem',
              color:          '#fde68a',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              fontSize:       '0.82rem',
              whiteSpace:     'nowrap',
            }}
          >
            See cached pages
          </a>
        )}
      </div>

      {/* Spacer so fixed banner doesn't overlap page content */}
      {isOffline && (
        <div style={{ height: '2.25rem', flexShrink: 0 }} aria-hidden="true" />
      )}
    </>
  )
}
