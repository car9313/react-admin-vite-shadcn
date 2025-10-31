// SignOutDialog.tsx - Versión mejorada
import { useNavigate } from '@tanstack/react-router'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useLogout } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate()
  const { mutate: logout, isPending } = useLogout()

  const handleSignOut = () => {
    logout(undefined, {
      onSuccess: () => {
      toast.success("Has cerrado sesión exitosamente")
      // Pequeño delay para que el usuario vea el toast
      setTimeout(() => {
        navigate({ to: '/sign-in' })
      }, 500)
      },
      onError: () => {
        toast.error(
           "No se pudo cerrar la sesión",
          )
        // Puedes mostrar un toast de error aquí si quieres
      },
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sign out'
      desc='Are you sure you want to sign out? You will need to sign in again to access your account.'
      confirmText={isPending ? 'Signing out...' : 'Sign out'} // ← Feedback visual
      destructive
      handleConfirm={handleSignOut}
      disabled={isPending} // ← Deshabilitar durante el logout
      className='sm:max-w-sm'
    />
  )
}