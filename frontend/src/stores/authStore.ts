import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isHydrated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: User) => void
  setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,
      login: (user, token) => {
        // Also store in localStorage for axios interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(user))
        }
        set({
          user,
          token,
          isAuthenticated: true
        })
      },
      logout: () => {
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('auth-storage')
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false
        })
      },
      updateUser: (user) => set((state) => ({ ...state, user })),
      setHydrated: () => {
        const currentState = get()
        if (!currentState.isHydrated) {
          set({ isHydrated: true })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated()
        }
      }
    }
  )
)
