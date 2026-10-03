import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { appConfig } from '../config'
import { supabase } from '../lib/supabase'
import { authReturnUrl } from '../utils/requestLinks'

type AuthContextValue = {
  user: User | null
  loading: boolean
  error: boolean
  cloudEnabled: boolean
  signInWithGoogle: (returnPath?: string) => Promise<void>
  sendMagicLink: (email: string, returnPath?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(appConfig.cloudEnabled)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      setError(Boolean(error))
      setUser(data.session?.user ?? null)
      setLoading(false)
    }).catch(() => { if (active) { setError(true); setLoading(false) } })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setError(false); setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    error,
    loading,
    cloudEnabled: appConfig.cloudEnabled,
    signInWithGoogle: async returnPath => {
      if (!supabase) throw new Error('Supabase is not configured.')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: authReturnUrl(window.location.origin, returnPath) },
      })
      if (error) throw error
    },
    sendMagicLink: async (email: string, returnPath?: string) => {
      if (!supabase) throw new Error('Supabase is not configured.')
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: authReturnUrl(window.location.origin, returnPath) },
      })
      if (error) throw error
    },
    signOut: async () => {
      if (!supabase) return
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
  }), [user, loading, error])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
