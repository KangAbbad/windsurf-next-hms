import { createBrowserClient } from '@supabase/ssr'

import { supabaseConfig } from '@/lib/constants'

export function createClient() {
  const { url, anonKey } = supabaseConfig
  return createBrowserClient(url, anonKey)
}
