import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ZimLearn — ZIMSEC E-Learning Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Background pattern dots */}
        <div style={{ position: 'absolute', top: 40, left: 60, width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 80, left: 120, width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 50, right: 80, width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 100, right: 140, width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 60, left: 80, width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 100, right: 100, width: 14, height: 14, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex' }} />

        {/* Logo box */}
        <div style={{
          width: 120,
          height: 120,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
          border: '2px solid rgba(255,255,255,0.3)',
        }}>
          {/* Graduation cap icon */}
          <div style={{ fontSize: 64, display: 'flex' }}>🎓</div>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 72,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-2px',
          marginBottom: 16,
          display: 'flex',
        }}>
          ZimLearn
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 28,
          color: 'rgba(255,255,255,0.85)',
          fontWeight: 500,
          marginBottom: 40,
          display: 'flex',
        }}>
          ZIMSEC E-Learning Platform
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 16 }}>
          {['AI Teacher', 'O-Level', 'A-Level', 'Primary'].map((label) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: 100,
              padding: '10px 24px',
              fontSize: 20,
              color: '#ffffff',
              fontWeight: 600,
              display: 'flex',
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <div style={{
          position: 'absolute',
          bottom: 36,
          fontSize: 18,
          color: 'rgba(255,255,255,0.6)',
          display: 'flex',
        }}>
          zimlearn.vercel.app
        </div>
      </div>
    ),
    { ...size }
  )
}
