// src/app/providers/AuthProvider.tsx
import { useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { createSupabaseAuthRepository } from '@/features/auth/adapters/supabaseAuthAdapter'
import { useMyAuthStore } from '../stores/my-auth-store'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setAuth = useMyAuthStore((s) => s.setAuth)
  const clearAuth = useMyAuthStore((s) => s.clearAuth ?? s.logout)
  const setIsLoading = useMyAuthStore((s) => s.setIsLoading)
  const isLoading = useMyAuthStore((s) => s.isLoading)
  const handleSessionChange = useMyAuthStore((s) => s.handleSessionChange)

  useEffect(() => {
    const repo = createSupabaseAuthRepository()
    let mounted = true

    const normalize = (sess?: Session | null) => sess ?? null

    const fetchAndSetAuth = async (allowClear = true) => {
      setIsLoading(true)
      try {
        if (!mounted) return
        const res = await repo.getSessionUser()
        if (!mounted) return
        if (res.user) {
          setAuth({ user: res.user, session: normalize(res.session) })
        } else if (allowClear) {
          clearAuth()
        }
      } catch (e) {
        console.error('[AuthProvider] fetchAndSetAuth error', e)
        clearAuth()
      } finally {
        setIsLoading(false)
      }
    }

    const rehydrate = async () => {
      console.log('[AuthProvider] rehydrating auth state')
      await fetchAndSetAuth(true)
    }

    rehydrate()

    const onAuthStateChange = async (
      event: string,
      session: Session | null
    ) => {
      const newSession = normalize(session)

      // If there's no session (signed out / deleted) clear the store and exit.
      // NOTE: when session === null we must NOT try the fast-path nor refetch.
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED' || !newSession) {
        clearAuth()
        return
      }

      // Delegate session-change handling to the store. The store knows the
      // current user snapshot and can decide whether the incoming session
      // belongs to the same identity (fast path: update tokens only). If the
      // store returns true the session was applied and we can avoid a network
      // revalidation; otherwise we call fetchAndSetAuth() to obtain the
      // authoritative user+session from the backend.
      try {
        const handled = handleSessionChange?.(newSession)
        if (handled) return
      } catch (e) {
        // If store handler throws for any reason, fall back to revalidation
        console.error('[AuthProvider] handleSessionChange error', e)
      }

      await fetchAndSetAuth(true)
    }

    const sub = repo.onAuthStateChange(onAuthStateChange)

    return () => {
      mounted = false
      try {
        sub?.unsubscribe?.()
      } catch {
        // noop
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  console.log('AuthProvider render, isLoading:', isLoading)
  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <span>Loading...</span>
      </div>
    )
  }
  return <>{children}</>
}
