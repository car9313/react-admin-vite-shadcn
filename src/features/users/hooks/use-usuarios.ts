// hooks/use-usuarios.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useMyAuthStore } from '../../../stores/my-auth-store'
import {
  type CreateUsuarioInput,
  createUsuarioSchema,
  type Usuario,
} from '../data/schema'

// POST - Crear usuario POR ADMIN
export const useCreateUsuario = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (usuarioData: CreateUsuarioInput) => {
      const { user: currentUser } = useMyAuthStore.getState()
      if (!currentUser) throw new Error('No autenticado')

      // Validar datos
      const validatedData = createUsuarioSchema.parse(usuarioData)

      // 1. Crear usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No se pudo crear el usuario')

      // 2. Obtener el ID del admin que está creando el usuario
      const { data: adminUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('auth_id', currentUser.id)
        .single()

      if (!adminUser) throw new Error('Usuario admin no encontrado')

      // 3. Crear perfil en tabla usuarios con NUEVA estructura
      const { error: usuarioError } = await supabase.from('usuarios').insert([
        {
          auth_id: authData.user.id, // ← ID de autenticación
          email: validatedData.email,
          full_name: validatedData.full_name,
          role: validatedData.role,
          created_by: adminUser.id, // ← ID del admin que lo creó
        },
      ])

      if (usuarioError) {
        // Rollback: eliminar usuario de auth
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw usuarioError
      }

      return authData.user
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    },
  })
}

// GET - Obtener todos los usuarios
export const useUsuarios = () => {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async (): Promise<Usuario[]> => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })
}
