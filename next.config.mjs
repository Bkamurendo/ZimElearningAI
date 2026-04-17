/** @type {import('next').NextConfig} */

// Build allowed origins from env — supports localhost in dev + real domain in prod
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const allowedOrigins = ['localhost:3000']

try {
  const { hostname, port } = new URL(siteUrl)
  const origin = port ? `${hostname}:${port}` : hostname
  if (!allowedOrigins.includes(origin)) allowedOrigins.push(origin)
  // Also allow the www. variant so root domain and www both work
  if (!hostname.startsWith('www.')) {
    allowedOrigins.push(`www.${hostname}`)
  } else {
    allowedOrigins.push(hostname.replace(/^www\./, ''))
  }
} catch {
  // invalid URL — keep defaults
}

const nextConfig = {
  // Transpile ESM-only packages so Next.js webpack can handle them correctly
  transpilePackages: [
    'react-markdown',
    'remark-gfm',
    'remark-math',
    'rehype-katex',
    'unified',
    'bail',
    'is-plain-obj',
    'trough',
    'vfile',
    'vfile-message',
    'unist-util-stringify-position',
    'mdast-util-from-markdown',
    'mdast-util-to-markdown',
    'mdast-util-gfm',
    'micromark',
    'micromark-core-commonmark',
    'micromark-extension-gfm',
    'hast-util-to-jsx-runtime',
    'hast-util-sanitize',
    'hast-util-from-parse5',
    'property-information',
    'space-separated-tokens',
    'comma-separated-tokens',
    'zwitch',
    'longest-streak',
    'decode-named-character-reference',
    'character-entities',
    'devlop',
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
  // Static redirect: ensures the root URL always sends users to /login
  // even if Supabase/middleware has a hiccup. Middleware then handles
  // authenticated users by redirecting them from /login to their dashboard.
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ]
  },
  async headers() {
    return [
      // Security headers for all routes
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',            value: 'DENY' },
          { key: 'X-XSS-Protection',           value: '1; mode=block' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // Service worker must never be served from cache — browsers must always
      // fetch the latest copy so they can detect SW updates on every page load.
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type',  value: 'application/javascript; charset=utf-8' },
        ],
      },
      // Web App Manifest — short cache so icon/shortcut changes propagate quickly
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
          { key: 'Content-Type',  value: 'application/manifest+json' },
        ],
      },
    ]
  },
}

export default nextConfig
