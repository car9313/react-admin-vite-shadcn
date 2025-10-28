import { type User, type Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface Profile {
  id: string
  username: string
  avatar_url?: string
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile) => void
  setIsLoading: (isLoading: boolean) => void
  logout: () => void
}

export const useMyAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setIsLoading: (isLoading) => set({ isLoading }),
      logout: () =>
        set({ user: null, session: null, profile: null, isLoading: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage), // más explícito
    }
  )
)
