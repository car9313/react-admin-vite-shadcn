// src/features/auth/adapters/supabaseAuthAdapter.ts
import type {
  User as SupabaseUser,
  Session as SupabaseSession,
} from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import {
  type LoginInput,
  type RegisterInput,
} from '../../../schemas/auth-schema'
import type {
  AuthRepository,
  AuthUser,
  AuthError as DomainAuthError,
  Profile,
} from '../types'

/** Guardas de tipo útiles (evitan usar `any`) */
const isErrorLike = (v: unknown): v is { message?: unknown; name?: unknown } =>
  typeof v === 'object' && v !== null && ('message' in v || 'name' in v)

const getErrorName = (v: unknown): string | undefined =>
  isErrorLike(v) && typeof v.name === 'string' ? v.name : undefined

const getErrorMessage = (v: unknown): string | undefined =>
  isErrorLike(v) && typeof v.message === 'string' ? v.message : undefined

/** Extrae un mensaje legible desde distintos tipos de error */
const extractMessage = (err: unknown): string => {
  if (!err) return 'Error desconocido'
  if (err instanceof Error) return err.message
  const m = getErrorMessage(err)
  if (m) return m
  try {
    return String(err)
  } catch {
    return 'Error desconocido'
  }
}

/**
 * Mapper estricto (Opción B)
 * - exige id y auth_id (si faltan -> lanza)
 * - devuelve strings/fallbacks que tu DTO requiere
 */
export const mapDbUsuarioToAuthUser = (
  row: Profile | null,
  supabaseUser?: SupabaseUser
): AuthUser => {
  if (!row && !supabaseUser) {
    throw new Error(
      'No se puede crear AuthUser: ni fila usuarios ni supabaseUser disponibles'
    )
  }

  const resolvedId = row?.id
  const resolvedAuthId = row?.auth_id ?? supabaseUser?.id

  if (resolvedId === undefined || resolvedId === null) {
    throw new Error('No se puede crear AuthUser: id de usuarios ausente')
  }

  if (!resolvedAuthId) {
    throw new Error('No se puede crear AuthUser: auth_id ausente')
  }

  // Email obligatorio: debe venir de row o supabaseUser
  const email = supabaseUser?.email
  if (!email) {
    throw new Error('No se puede crear AuthUser: email ausente')
  }

  // full_name obligatorio: preferimos row, si no tomamos metadata de Supabase
  const full_name = row?.full_name ?? supabaseUser?.user_metadata?.fullName
  if (!full_name) {
    throw new Error('No se puede crear AuthUser: full_name ausente')
  }

  // role obligatorio: debe venir de la DB (row), no se toma de Supabase
  const role = row?.role
  if (!role) {
    throw new Error('No se puede crear AuthUser: role ausente')
  }

  const created_by = row?.created_by ?? null

  return {
    id: resolvedId,
    auth_id: resolvedAuthId,
    email,
    full_name,
    role,
    created_by,
  }
}

/**
 * Factory del repositorio de autenticación usando Supabase (compatible v2)
 */
export const createSupabaseAuthRepository = (opts?: {
  supabaseClient?: typeof supabase
}): AuthRepository => {
  const client = opts?.supabaseClient ?? supabase

  const login = async (dto: LoginInput) => {
    try {
      const res = await client.auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      })

      if (res.error) {
        return {
          error: {
            code: getErrorName(res.error) ?? 'AUTH_ERROR',
            message:
              getErrorMessage(res.error) ??
              res.error.message ??
              'Error de autenticación',
          } as DomainAuthError,
        }
      }

      const supUser = res.data?.user ?? null
      const session = res.data?.session ?? null

      if (!supUser) {
        return {
          error: {
            message: 'No se obtuvo el usuario de Supabase',
          } as DomainAuthError,
        }
      }

      const { data: usuarioRow, error: usuarioError } = await client
        .from('usuarios')
        .select('*')
        .eq('auth_id', supUser.id)
        .limit(1)
        .maybeSingle()

      if (usuarioError) {
        return {
          error: { message: extractMessage(usuarioError) } as DomainAuthError,
        }
      }

      if (!usuarioRow) {
        // Opción B: estricto -> error si no existe fila en `usuarios`
        return {
          error: {
            message: 'Perfil de usuario no encontrado en la tabla `usuarios`',
          } as DomainAuthError,
        }
      }

      let user: AuthUser
      try {
        user = mapDbUsuarioToAuthUser(usuarioRow, supUser)
      } catch (mErr: unknown) {
        return { error: { message: extractMessage(mErr) } as DomainAuthError }
      }

      return { user, session }
    } catch (err: unknown) {
      return { error: { message: extractMessage(err) } as DomainAuthError }
    }
  }

  const registerPublic = async (dto: RegisterInput) => {
    try {
      const res = await client.auth.signUp({
        email: dto.email,
        password: dto.password,
      })

      if (res.error) {
        return {
          error: {
            code: getErrorName(res.error) ?? 'AUTH_ERROR',
            message:
              getErrorMessage(res.error) ??
              res.error.message ??
              'Error de signUp',
          } as DomainAuthError,
        }
      }

      const supUser = res.data?.user ?? null
      const session = res.data?.session ?? undefined

      if (!supUser) {
        return {
          error: {
            message: 'No se creó el usuario en Supabase',
          } as DomainAuthError,
        }
      }

      const insertPayload: Omit<Profile, 'id'> = {
        auth_id: supUser.id,
        full_name: dto.full_name,
        role: 'admin',
        created_by: null,
      }

      const { data: createdUsuario, error: insertError } = await client
        .from('usuarios')
        .insert(insertPayload)
        .select()
        .maybeSingle()

      if (insertError) {
        return {
          error: { message: extractMessage(insertError) } as DomainAuthError,
        }
      }

      if (!createdUsuario) {
        return {
          error: {
            message: 'No se pudo crear el registro en usuarios',
          } as DomainAuthError,
        }
      }

      let user: AuthUser
      try {
        user = mapDbUsuarioToAuthUser(createdUsuario, supUser)
      } catch (mErr: unknown) {
        return { error: { message: extractMessage(mErr) } as DomainAuthError }
      }

      return { user, session }
    } catch (err: unknown) {
      return { error: { message: extractMessage(err) } as DomainAuthError }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await client.auth.signOut()
      if (error) {
        return {
          error: {
            code: getErrorName(error) ?? 'AUTH_ERROR',
            message:
              getErrorMessage(error) ??
              error.message ??
              'Error al cerrar sesión',
          } as DomainAuthError,
        }
      }
      return {}
    } catch (err: unknown) {
      return { error: { message: extractMessage(err) } as DomainAuthError }
    }
  }

  const getSessionUser = async () => {
    try {
      // Obtener la sesión completa (incluye session.user si existe)
      const { data: sessionData, error: sessionError } =
        await client.auth.getSession()
      if (sessionError) {
        return {
          error: { message: extractMessage(sessionError) } as DomainAuthError,
        }
      }

      // session será Session | undefined
      const session = sessionData?.session ?? undefined
      const supUser = session?.user ?? null

      // Si no hay usuario en la sesión, no hay sesión activa
      if (!supUser) {
        return { error: { message: 'No hay sesión activa' } as DomainAuthError }
      }

      // Buscar perfil en la tabla `usuarios` por auth_id
      const { data: usuarioRow, error: usuarioError } = await client
        .from('usuarios')
        .select('*')
        .eq('auth_id', supUser.id)
        .limit(1)
        .maybeSingle()

      if (usuarioError) {
        return {
          error: { message: extractMessage(usuarioError) } as DomainAuthError,
        }
      }

      // Flujo estricto: si no hay fila usuarios, devolvemos error
      if (!usuarioRow) {
        return {
          error: {
            message: 'Perfil de usuario no encontrado en la tabla `usuarios`',
          } as DomainAuthError,
        }
      }

      // Mapear y validar estrictamente; mapper lanzará si falta algún campo obligatorio
      let user: AuthUser
      try {
        user = mapDbUsuarioToAuthUser(usuarioRow, supUser)
      } catch (mErr: unknown) {
        return { error: { message: extractMessage(mErr) } as DomainAuthError }
      }

      // Devolvemos el user y la session (Session | undefined)
      return { user, session }
    } catch (err: unknown) {
      return { error: { message: extractMessage(err) } as DomainAuthError }
    }
  }

  const onAuthStateChange = (
    cb: (event: string, session: SupabaseSession | null) => void
  ) => {
    const subscription = client.auth.onAuthStateChange((event, session) => {
      cb(event, session ?? null)
    })

    return {
      unsubscribe: () => {
        try {
          // Manejar distintas formas de unsubscribe que pueda devolver la SDK
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const unsub = subscription?.data?.subscription?.unsubscribe
          if (typeof unsub === 'function') unsub()
        } catch {
          // noop
        }
      },
    }
  }

  return {
    login,
    registerPublic,
    signOut,
    getSessionUser,
    onAuthStateChange,
  }
}
