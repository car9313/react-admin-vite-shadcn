import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type RegisterInput,
  type LoginInput,
  loginSchema,
  registerSchema,
} from '@/schemas/auth-schema'
import { useMyAuthStore } from '@/stores/my-auth-store'
import { supabase } from '@/lib/supabase'
import { createSupabaseAuthRepository } from '../features/auth/adapters/supabaseAuthAdapter'

const authRepo = createSupabaseAuthRepository()

export const useSession = () => {
  console.log('useSession called')
  const { setUser, setSession, setIsLoading, setProfile } = useMyAuthStore()

  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) throw error

      console.log(session)
      setSession(session)
      setUser(session?.user ?? null)

      // Obtener el perfil COMPLETO del usuario desde tu tabla
      if (session?.user) {
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('*')
          .eq('auth_id', session.user.id) // ← Buscar por auth_id
          .single()
        setProfile(usuario)
      }

      setIsLoading(false)
      return session
    },
    retry: false,
    refetchOnWindowFocus: false,
  })
}
// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const validatedCredentials = loginSchema.parse(credentials)
      const data = await authRepo.login(validatedCredentials)
      if (data.error) throw data.error
      return data
    },
    onSuccess: (data) => {
      console.log('Login exitoso, sesión:', data.session)
      queryClient.invalidateQueries({ queryKey: ['session'] })
    },
    onError: (error) => {
      console.error('Error completo en useLogin:', error)
    },
  })
}

// Register mutation
export const useRegister = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userData: RegisterInput) => {
      // ✅ VALIDAR datos de registro con Zod
      const validatedData = registerSchema.parse(userData)
      const authData = await authRepo.registerPublic(validatedData)
      return authData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    },
    onError: (error) => {
      console.error('Error en registro:', error)
      // Manejar el error (mostrar toast, etc.)
    },
  })
}
// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient()
  const { logout } = useMyAuthStore()

  return useMutation({
    mutationFn: async () => {
      await authRepo.signOut()
    },
    onSuccess: () => {
      logout()
      queryClient.clear()
    },
  })
}

// Get user profile
export const useProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}
