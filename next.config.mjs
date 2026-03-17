/** @type {import('next').NextConfig} */

// Build allowed origins from env — supports localhost in dev + real domain in prod
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const allowedOrigins = ['localhost:3000']

try {
  const { hostname, port } = new URL(siteUrl)
  const origin = port ? `${hostname}:${port}` : hostname
  if (!allowedOrigins.includes(origin)) allowedOrigins.push(origin)
} catch {
  // invalid URL — keep defaults
}

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
  async headers() {
    return [
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
    ]
  },
}

export default nextConfig
