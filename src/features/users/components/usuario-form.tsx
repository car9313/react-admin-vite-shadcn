import { Form, useForm } from 'react-hook-form'
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@radix-ui/react-select'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select } from 'react-day-picker'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form'
import {
  type CreateUsuarioInput,
  createUsuarioSchema,
  type Usuario,
} from '../data/schema'
import { useCreateUsuario } from '../hooks/use-usuarios'

interface UsuarioFormProps {
  mode: 'create' | 'edit'
  usuario?: Usuario
  onClose: () => void
  onSuccess: () => void
}

// components/usuarios/usuario-form.tsx (SOLO para admin)
export function UsuarioForm({
  mode,
  usuario,
  onClose,
  onSuccess,
}: UsuarioFormProps) {
  const { mutate: createUsuario, isPending } = useCreateUsuario()

  const form = useForm<CreateUsuarioInput>({
    resolver: zodResolver(createUsuarioSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      role: 'vendedor',
    },
  })

  const onSubmit = (data: CreateUsuarioInput) => {
    createUsuario(data, {
      onSuccess: () => {
        onSuccess()
        form.reset()
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Campos: email, password, confirmPassword, full_name, role */}
        {/* ✅ CON campo role (pero sin opción 'admin') */}
        <FormField
          control={form.control}
          name='role'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol</FormLabel>
              <Select
                onVolumeChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Selecciona un rol' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {/* ❌ SIN 'admin' - los admins solo se crean manualmente en BD */}
                  <SelectItem value='gerente'>Gerente</SelectItem>
                  <SelectItem value='almacenista'>Almacenista</SelectItem>
                  <SelectItem value='vendedor'>Vendedor</SelectItem>
                  <SelectItem value='auditor'>Auditor</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
