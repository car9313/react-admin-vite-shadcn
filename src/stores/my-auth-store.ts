import { type User, type Session } from '@supabase/supabase-js'
import { create } from 'zustand'

export interface Profile {
  id: string
  full_name?: string
  role?: string
  auth_id?: string
  created_by?: number | null
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

export const useMyAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setIsLoading: (isLoading) => set({ isLoading }),
  logout: () => {},
}))
