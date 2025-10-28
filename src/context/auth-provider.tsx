import { useEffect } from 'react'
import { useMyAuthStore } from '@/stores/my-auth-store'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/use-auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession,isLoading, setIsLoading } = useMyAuthStore()
  const { data: session } = useSession()
  useEffect(() => {
    const { data: {subscription} } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
          if (event === 'SIGNED_IN') {
        // Handle successful sign in
        console.log('User signed in:', session?.user?.email)
      } else if (event === 'SIGNED_OUT') {
        // Handle sign out
         
        console.log('User signed out')
      }
      }
    )
     return () => subscription.unsubscribe()
  }, [setUser, setSession, setIsLoading])

    // Show loading state while checking auth
  if (!session && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }
    return <>{children}</>
}
