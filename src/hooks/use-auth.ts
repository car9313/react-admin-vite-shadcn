import { supabase } from "@/lib/supabase"
import type { RegisterInput,  LoginInput } from "@/schemas/auth-schema"
import { useMyAuthStore } from "@/stores/my-auth-store"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

 export const useSession = () => {
  return useQuery({
    queryKey: ['session'],                    // 🎯 CLAVE ÚNICA
    queryFn: async () => {                    // 🎯 FUNCIÓN QUE FETCHEA
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    },
    retry: false,                            // 🎯 NO REINTENTAR SI FALLA
    refetchOnWindowFocus: false,             // 🎯 NO REFETCHEAR AL CAMBIAR DE VENTANA
  })
} 
// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const { data, error } = await supabase.auth.signInWithPassword(credentials)
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
  return useMutation({
    mutationFn: async (userData: RegisterInput) => {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
          },
        },
      })
      if (error) throw error
      return data
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
      if (error) throw error
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