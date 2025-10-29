// schemas/usuario-schema.ts
import { z } from 'zod'

// Schema para CREAR usuario (incluye password)
/* export const createUsuarioSchema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
    full_name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
    role: z.enum(['admin', 'gerente', 'vendedor', 'almacenista', 'auditor']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  }) */

export const createUsuarioSchema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
    full_name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
    role: z.enum(['vendedor', 'almacenista', 'auditor']), // ❌ SIN 'admin' y 'gerente'
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

// Schema para ACTUALIZAR usuario (sin password)
export const updateUsuarioSchema = z.object({
  full_name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  role: z.enum(['admin', 'gerente', 'vendedor', 'almacenista', 'auditor']),
})

// Schema para el USUARIO en la base de datos
/* export const usuarioSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string(),
  role: z.enum(['admin', 'gerente', 'vendedor', 'almacenista', 'auditor']),
  created_at: z.string().datetime(),
}) */
export const usuarioSchema = z.object({
  id: z.number(),
  auth_id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string(),
  role: z.enum(['admin', 'gerente', 'vendedor', 'almacenista', 'auditor']),
  created_by: z.number().nullable(),
  created_at: z.string().datetime(),
})

// Inferir tipos TypeScript desde los schemas Zod
export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>
export type Usuario = z.infer<typeof usuarioSchema>

/* import { z } from 'zod'

const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('invited'),
  z.literal('suspended'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

const userRoleSchema = z.union([
  z.literal('superadmin'),
  z.literal('admin'),
  z.literal('cashier'),
  z.literal('manager'),
])

const userSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  status: userStatusSchema,
  role: userRoleSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)
 */ /* 
import { z } from 'zod'

const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('invited'),
  z.literal('suspended'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

const userRoleSchema = z.union([
  z.literal('superadmin'),
  z.literal('admin'),
  z.literal('cashier'),
  z.literal('manager'),
])
export type UserRole = z.infer<typeof userRoleSchema>

const userSchema = z.object({
  id: z.string().uuid(), // ✅ UUID validation
  first_name: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  username: z.string().min(1, 'El usuario es requerido'),
  email: z.string().email('Email inválido'),
  phoneNumber: z.string().optional(),
  status: userStatusSchema.default('active'),
  role: userRoleSchema.default('cashier'),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type User = z.infer<typeof userSchema>

// Schema para crear usuario (sin id y fechas)
const createUserSchema = userSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

// Schema para actualizar usuario
const updateUserSchema = userSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial()

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const userListSchema = z.array(userSchema)

export {
  userSchema,
  createUserSchema,
  updateUserSchema,
  userStatusSchema,
  userRoleSchema,
}
 */
