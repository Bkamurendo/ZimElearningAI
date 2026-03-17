// Validates required env vars at startup and exports typed constants
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'ANTHROPIC_API_KEY',
] as const

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[env] Missing env var: ${key}`)
  }
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  paynowIntegrationId: process.env.PAYNOW_INTEGRATION_ID,
  paynowIntegrationKey: process.env.PAYNOW_INTEGRATION_KEY,
  flutterwaveSecretKey: process.env.FLUTTERWAVE_SECRET_KEY,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
  vapidEmail: process.env.VAPID_EMAIL ?? 'admin@zimelearn.co.zw',
} as const
