import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient() {
  const cookieStore = cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment.')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerClient<any>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from Server Component — middleware handles refresh
          }
        },
      },
    }
  )
}
