import { createClient } from '@supabase/supabase-js'
import { appConfig } from '../config'

export const supabase = appConfig.cloudEnabled
  ? createClient(appConfig.supabaseUrl, appConfig.supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.')
  return supabase
}
