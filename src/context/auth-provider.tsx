import React, { useEffect } from 'react'
// tu cliente supabase
import { useMyAuthStore } from '@/stores/my-auth-store'
import { supabase } from '@/lib/supabase'

// zustand (setUser, setSession, setIsLoading)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, isLoading, setIsLoading } = useMyAuthStore()

  // Inicializa inmediatamente la sesión actual al montar
  useEffect(() => {
    let mounted = true

    async function init() {
      console.log('AuthProvider - iniciando sesión inicial')
      try {
        setIsLoading(true)
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          // opcional: manejar/loggear error
        } else if (mounted) {
          console.log('AuthProvider - sesión inicial obtenida:', data)
          const session = data?.session ?? null
          setSession(session)
          setUser(session?.user ?? null)
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [setSession, setUser, setIsLoading])

  // Luego suscribimos para cambios en tiempo real
  useEffect(() => {
    console.log('AuthProvider - suscribiéndose a cambios de auth state')
    // La API de supabase puede retornar { data: { subscription } } o un objeto directo según versiones
    const res = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthProvider - evento de auth state change:', event, session)
      // Actualizamos store basado en el evento
      setSession(session)
      setUser(session?.user ?? null)

      // Puedes tomar acciones según event:
      // if (event === 'SIGNED_IN') fetchProfile(session.user.id)
      // if (event === 'SIGNED_OUT') cleanup()
    })

    // Normaliza la suscripción para soportar distintas versiones del SDK
    const subscription = res?.data?.subscription ?? res

    return () => {
      try {
        subscription?.unsubscribe?.()
      } catch (err) {
        // safe cleanup
      }
    }
  }, [setSession, setUser])

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        {/* spinner accesible */}
        <span>Loading...</span>
      </div>
    )
  }

  return <>{children}</>
}
