// src/features/auth/useAuthStore.ts
import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { isSameAuthIdentity } from '@/lib/auth'
import { type AuthUser } from '../features/auth/types'

interface AuthState {
  // estado
  user: AuthUser | null // usuario de dominio (mapeado)
  session: Session | null // sesión de Supabase (tokens)
  isLoading: boolean // inicializando / revalidando
  error?: string | null

  // setters simples (útiles para componentes)
  setUser: (u: AuthUser | null) => void
  setSession: (s: Session | null) => void
  setIsLoading: (v: boolean) => void
  setError: (msg: string | null) => void

  // acciones compuestas / idempotentes
  /**
   * setAuth: establece user+session de forma compuesta.
   * - evita sobrescribir con respuestas antiguas (simple idempotencia)
   * - usa comparaciones basadas en session.access_token y user.id
   */
  setAuth: (payload: {
    user?: AuthUser | null
    session?: Session | null
  }) => void

  // fast path: update only session (useful for token refreshes)
  setSessionOnly: (s: Session | null) => void

  // handle a session-change event: return true if handled (session-only), false otherwise
  handleSessionChange: (s: Session | null) => boolean

  // limpiar todo (logout)
  clearAuth: () => void
  logout: () => void
}

export const useMyAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,

  // setters sencillos
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (msg) => set({ error: msg ?? null }),

  // acción compuesta e idempotente
  setAuth: ({ user, session }) => {
    console.log('[useMyAuthStore] setAuth called', { user, session })
    const prev = get()
    const prevSession = prev.session
    const prevUser = prev.user

    const sameSession =
      !!prevSession?.access_token &&
      !!session?.access_token &&
      prevSession.access_token === session?.access_token

    const sameUser = isSameAuthIdentity(prevUser, user)

    if (sameSession && sameUser) {
      console.log(
        '[useMyAuthStore] setAuth: no changes detected, skipping update'
      )
      return
    }

    console.log('[useMyAuthStore] setAuth: updating auth state')
    set({
      user: user ?? null,
      session: session ?? null,
      isLoading: false,
      error: null,
    })
  },

  // fast path to update only session tokens (used on token refresh)
  setSessionOnly: (session) => {
    const prev = get()
    const prevSession = prev.session
    if (
      !!prevSession?.access_token &&
      !!session?.access_token &&
      prevSession.access_token === session?.access_token
    ) {
      console.log('[useMyAuthStore] setSessionOnly: No change')
      // no change
      return
    }
    console.log('[useMyAuthStore] setSessionOnly: updating session only')
    set({ session: session ?? null })
  },

  /**
   * Handle a session change event coming from the auth provider.
   * - If the new session belongs to the same auth identity already in the store,
   *   update the session only and return true (handled).
   * - Otherwise return false so the caller can revalidate the full profile.
   */
  handleSessionChange: (session: Session | null) => {
    const prev = get()
    const prevUser = prev.user
    const newAuthUserId = session?.user?.id as string | undefined

    const handled = isSameAuthIdentity(prevUser, newAuthUserId)

    if (handled) {
      console.log(
        '[useMyAuthStore] handleSessionChange: same identity detected, delegating to setSessionOnly'
      )
      // reuse the fast-path helper to keep session-update logic in one place
      try {
        get().setSessionOnly(session)
      } catch (e) {
        // fallback: if helper fails, set directly
        console.error(
          '[useMyAuthStore] handleSessionChange: setSessionOnly failed',
          e
        )
        set({ session: session ?? null })
      }
      return true
    }

    // For debugging: why was fast-path skipped?
    if (!prevUser) {
      console.log(
        '[useMyAuthStore] handleSessionChange: no prevUser in store, will revalidate'
      )
    } else if (!newAuthUserId) {
      console.log(
        '[useMyAuthStore] handleSessionChange: session has no user id, will revalidate'
      )
    } else {
      console.log('[useMyAuthStore] handleSessionChange: auth_id mismatch', {
        prevAuthId: (prevUser as { auth_id?: string })?.auth_id,
        sessionUserId: newAuthUserId,
      })
    }

    return false
  },

  clearAuth: () =>
    set({ user: null, session: null, isLoading: false, error: null }),

  logout: () =>
    set({ user: null, session: null, isLoading: false, error: null }),
}))
