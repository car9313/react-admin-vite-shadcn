import { useLogin, useLogout, useRegister, useProfile } from './use-auth'
import { useMyAuthStore } from '@/stores/my-auth-store'

export const useAuthActions = () => {
  const { user } = useMyAuthStore()
  const { data: profile } = useProfile(user?.id)
  
  const login = useLogin()
  const logout = useLogout()
  const register = useRegister()

  return {
    user,
    profile,
    isAuthenticated: !!user,
    isLoading: login.isPending || logout.isPending,
    login: login.mutate,
    logout: logout.mutate,
    register: register.mutate,
    isLoggingIn: login.isPending,
    isLoggingOut: logout.isPending,
    isRegistering: register.isPending,
  }
}