// src/features/auth/useAuthListener.ts
import { useEffect, useRef, useCallback } from 'react'
import type { Session as SupabaseSession } from '@supabase/supabase-js'
import { useMyAuthStore } from '../../stores/my-auth-store'
import type { AuthRepository } from './types'

export type AuthEvent =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'
  | string

// src/features/auth/useAuthListener.ts
export const useAuthListener = (authRepo: AuthRepository, autoStart = true) => {
  const lastRequestId = useRef(0)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const initializedRef = useRef(false) // ← Nueva referencia para tracking

  const initialize = useCallback(
    async (showLoader = true) => {
      // ✅ Evitar inicialización múltiple si ya tenemos datos
      const currentState = useMyAuthStore.getState()
      if (initializedRef.current && currentState.user && currentState.session) {
        // Ya estamos inicializados y tenemos datos, no mostrar loader
        if (showLoader) {
          useMyAuthStore.setState({ isLoading: false })
        }
        return
      }
      console.log(
        initializedRef.current,
        currentState.user,
        currentState.session
      )
      lastRequestId.current += 1
      const rid = lastRequestId.current

      if (showLoader) {
        console.log('Mostrando loader de inicialización de auth')
        useMyAuthStore.setState({ isLoading: true, error: null })
      } else {
        useMyAuthStore.setState({ error: null })
      }

      try {
        const res = await authRepo.getSessionUser()
        if (rid !== lastRequestId.current) return

        if (res.error) {
          const state = useMyAuthStore.getState()
          if (typeof state.clearAuth === 'function') state.clearAuth()
          else
            useMyAuthStore.setState({
              user: null,
              session: null,
              isLoading: false,
              error: res.error.message ?? 'Error al obtener sesión',
            })
          return
        }

        if (!res.user) {
          const state = useMyAuthStore.getState()
          if (typeof state.clearAuth === 'function') state.clearAuth()
          else
            useMyAuthStore.setState({
              user: null,
              session: null,
              isLoading: false,
            })
          return
        }

        // ✅ Marcar como inicializado exitosamente
        initializedRef.current = true

        const state = useMyAuthStore.getState()
        if (typeof state.setAuth === 'function') {
          state.setAuth({ user: res.user, session: res.session ?? null })
        } else {
          useMyAuthStore.setState({
            user: res.user,
            session: res.session ?? null,
            isLoading: false,
            error: null,
          })
        }
      } catch (err) {
        if (rid !== lastRequestId.current) return
        const state = useMyAuthStore.getState()
        if (typeof state.clearAuth === 'function') state.clearAuth()
        else
          useMyAuthStore.setState({
            isLoading: false,
            error: err instanceof Error ? err.message : String(err),
          })
      }
    },
    [authRepo]
  )

  useEffect(() => {
    if (!autoStart || initializedRef.current) return // ← No reinicializar si ya está listo

    initialize().catch(() => {})

    const sub = authRepo.onAuthStateChange(
      (event: AuthEvent, session: SupabaseSession | null) => {
        if (!session) {
          initializedRef.current = false // ← Resetear tracking al cerrar sesión
          const state = useMyAuthStore.getState()
          if (typeof state.clearAuth === 'function') state.clearAuth()
          else
            useMyAuthStore.setState({
              user: null,
              session: null,
              isLoading: false,
            })
          return
        }

        const sUser = session.user ?? undefined
        if (!sUser || !sUser.id) {
          initializedRef.current = false
          const state = useMyAuthStore.getState()
          if (typeof state.clearAuth === 'function') state.clearAuth()
          else
            useMyAuthStore.setState({
              user: null,
              session: null,
              isLoading: false,
            })
          return
        }

        if (event === 'TOKEN_REFRESHED') {
          // ✅ Para token refresh, solo actualizar silenciosamente
          lastRequestId.current += 1
          const rid = lastRequestId.current

          authRepo
            .getSessionUser()
            .then((res) => {
              if (rid !== lastRequestId.current) return
              if (res.user && res.session) {
                const state = useMyAuthStore.getState()
                if (typeof state.setAuth === 'function') {
                  state.setAuth({ user: res.user, session: res.session })
                } else {
                  useMyAuthStore.setState({
                    user: res.user,
                    session: res.session,
                    error: null,
                  })
                }
              }
            })
            .catch(() => {})
          return
        }

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          initializedRef.current = true
          lastRequestId.current += 1
          initialize().catch(() => {})
          return
        }

        if (event === 'SIGNED_OUT') {
          initializedRef.current = false
          const state = useMyAuthStore.getState()
          if (typeof state.clearAuth === 'function') state.clearAuth()
          else
            useMyAuthStore.setState({
              user: null,
              session: null,
              isLoading: false,
            })
        }
      }
    )

    unsubscribeRef.current = sub?.unsubscribe ?? (() => {})

    return () => {
      lastRequestId.current += 1
      try {
        const unsub = unsubscribeRef.current
        if (typeof unsub === 'function') unsub()
      } catch {
        // noop
      }
    }
  }, [authRepo, autoStart, initialize])

  const revalidate = useCallback(() => {
    lastRequestId.current += 1
    initialize().catch(() => {})
  }, [initialize])

  return { revalidate }
}
