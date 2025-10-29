import { Form, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../../../components/ui/button'
import { useRegister } from '../../../../hooks/use-auth'
import {
  type RegisterInput,
  registerSchema,
} from '../../../../schemas/auth-schema'

export function PublicRegisterForm() {
  const { mutate: register, isPending } = useRegister()

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      full_name: '',
    },
  })

  const onSubmit = (data: RegisterInput) => {
    register(data, {
      onSuccess: () => {
        // Mostrar mensaje de éxito
        // "Usuario creado, puede iniciar sesión"
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        {/* Campos: email, password, confirmPassword, full_name */}
        {/* ❌ SIN campo role */}
        <Button type='submit' disabled={isPending}>
          {isPending ? 'Creando cuenta...' : 'Registrarse'}
        </Button>
      </form>
    </Form>
  )
}
