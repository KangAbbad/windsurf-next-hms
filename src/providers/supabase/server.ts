import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { supabaseConfig } from '@/lib/constants'

export async function createClient() {
  const cookieStore = await cookies()
  const { getToken } = await auth()
  const { url, anonKey } = supabaseConfig

  return createServerClient(url, anonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const clerkToken = await getToken({ template: 'supabase' })
        const headers = new Headers(options?.headers)
        headers.set('Authorization', `Bearer ${clerkToken}`)
        return await fetch(url, { ...options, headers })
      },
    },
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
