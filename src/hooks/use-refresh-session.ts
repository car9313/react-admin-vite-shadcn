import { useMutation, useQueryClient } from '@tanstack/react-query'
import { error } from 'console'
import { supabase } from '../lib/supabase'

export const useRefreshSession = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession()
      if (error) throw error
      return session
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] })
    },
  })
  return null
}
