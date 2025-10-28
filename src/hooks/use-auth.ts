import { supabase } from "@/lib/supabase"
import { useQuery } from "@tanstack/react-query"

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