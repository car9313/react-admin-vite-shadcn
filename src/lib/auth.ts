import type { AuthUser } from '@/features/auth/types'

/**
 * Comprueba si la identidad de autenticación es la misma.
 * - `other` puede ser un `AuthUser` (por ejemplo, el perfil mapeado) o
 *   un string con el id del usuario proveniente de la sesión (session.user.id).
 */
export function isSameAuthIdentity(
  prevUser: AuthUser | null | undefined,
  other?: AuthUser | string | null
): boolean {
  const prevAuthId = (prevUser as { auth_id?: string })?.auth_id

  const otherAuthId =
    typeof other === 'string' ? other : (other as { auth_id?: string })?.auth_id

  if (prevAuthId && otherAuthId) return prevAuthId === otherAuthId

  const prevId = prevUser?.id
  const otherId =
    typeof other === 'string' ? other : (other as AuthUser | undefined)?.id
  if (prevId && otherId) return prevId === otherId

  return false
}

export default isSameAuthIdentity
