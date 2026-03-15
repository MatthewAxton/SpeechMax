import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { loadUserData, migrateLocalStorage } from './supabaseSync'

interface AuthContextValue {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAnonymous: boolean
  displayName: string | null
  avatarUrl: string | null
  email: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isLoading: true,
  isAnonymous: true,
  displayName: null,
  avatarUrl: null,
  email: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

function getUserInfo(user: User | null) {
  if (!user) return { isAnonymous: true, displayName: null, avatarUrl: null, email: null }

  const isAnonymous = user.is_anonymous ?? !user.email
  const meta = user.user_metadata ?? {}

  return {
    isAnonymous,
    displayName: (meta.full_name ?? meta.name ?? null) as string | null,
    avatarUrl: (meta.avatar_url ?? meta.picture ?? null) as string | null,
    email: user.email ?? null,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const hydrate = useCallback(async () => {
    try {
      await loadUserData()
    } catch (err) {
      console.error('Failed to hydrate from Supabase:', err)
    }
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)

      if (s?.user) {
        migrateLocalStorage(s.user.id).then(() => hydrate())
      } else {
        supabase.auth.signInAnonymously().then(({ error }) => {
          if (error) {
            console.error('Anonymous sign-in failed:', error)
          }
        })
      }

      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s)
        setUser(s?.user ?? null)

        if (s?.user) {
          await migrateLocalStorage(s.user.id)
          await hydrate()
        }

        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [hydrate])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/queue',
      },
    })
    if (error) console.error('Google sign-in failed:', error)
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }, [])

  const { isAnonymous, displayName, avatarUrl, email } = getUserInfo(user)

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAnonymous, displayName, avatarUrl, email, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
