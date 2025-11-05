import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useMyAuthStore } from '../stores/my-auth-store'

export const useInitialSession = () => {
  console.log('useInitialSession')
  const { setUser, setSession, setIsLoading } = useMyAuthStore()
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) throw error
      if (!session) throw new Error('No hay sesion inicial')
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
      return session
    },
    retry: false,
    refetchOnWindowFocus: false,
  })
}
