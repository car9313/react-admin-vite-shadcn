import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useMyAuthStore } from '../../stores/my-auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { user, isLoading } = useMyAuthStore.getState()

    // Si está cargando, esperar
    if (isLoading) {
      // Puedes mostrar un loader o simplemente esperar
      await new Promise((resolve) => setTimeout(resolve, 100))
      // Recargar el estado después de esperar
      const { user: currentUser } = useMyAuthStore.getState()
      if (!currentUser) {
        throw redirect({
          to: '/sign-in',
        })
      }
      return
    }

    // Si no hay usuario, redirigir al login
    if (!user) {
      throw redirect({
        to: '/sign-in',
      })
    }
  },
  component: AuthenticatedLayout,
})
