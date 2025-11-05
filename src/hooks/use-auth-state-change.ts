import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useMyAuthStore } from '../stores/my-auth-store'

export const useAuthStateChanges = () => {
  console.log('useAuthStateChanges')
  const { setUser, setSession, setProfile } = useMyAuthStore()
  useEffect(() => {
    console.log('Ejecutando el efecto')
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state Change:', event, session?.user?.email)
      if (!session) throw new Error('No se pudo cargar la sesion')
      setSession(session)
      setUser(session?.user ?? null)

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', session.user.id) // ← Buscar por auth_id
        .single()

      setProfile(usuario)
      if (event === 'SIGNED_IN') {
        // Handle successful sign in
        console.log('User signed in:', session?.user?.email)
      } else if (event === 'SIGNED_OUT') {
        // Handle sign out

        console.log('User signed out')
      }
    })
    return () => subscription.unsubscribe()
  }, [setUser, setSession, setProfile])
}
