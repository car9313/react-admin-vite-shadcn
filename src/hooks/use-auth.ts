import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type RegisterInput,
  type LoginInput,
  loginSchema,
  registerSchema,
} from '@/schemas/auth-schema'
import { useMyAuthStore } from '@/stores/my-auth-store'
import { supabase } from '@/lib/supabase'

export const useSession = () => {
  const { setUser, setSession, setIsLoading, setProfile } = useMyAuthStore()

  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) throw error

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
      // ✅ VALIDAR credenciales con Zod
      const validatedCredentials = loginSchema.parse(credentials)

      const { data, error } =
        await supabase.auth.signInWithPassword(validatedCredentials)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] })
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

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No se pudo crear el usuario')

      const { error: usuarioError } = await supabase.from('usuarios').insert([
        {
          auth_id: authData.user.id, // ← ID de autenticación
          email: validatedData.email,
          full_name: validatedData.full_name,
          role: 'vendedor', // ← Rol por defecto para registro público
          created_by: null, // ← Null porque es auto-registro
        },
      ])

      if (usuarioError) {
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw usuarioError
      }

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
      const { error } = await supabase.auth.signOut()
      if (error)
        throw new Error('Ha ocurriodo un error durante el cierre de sessión')
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
