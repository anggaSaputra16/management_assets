import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { toast } from '@/hooks/useToast'

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
          // Map the backend user shape to include a 'name' for UI usage
          const uu = user as unknown as Record<string, unknown>
          const firstName = typeof uu['firstName'] === 'string' ? (uu['firstName'] as string) : ''
          const lastName = typeof uu['lastName'] === 'string' ? (uu['lastName'] as string) : ''
          const username = typeof uu['username'] === 'string' ? (uu['username'] as string) : ''
          const email = typeof uu['email'] === 'string' ? (uu['email'] as string) : ''
          const nameFromParts = `${firstName} ${lastName}`.trim()
          const name = typeof uu['name'] === 'string' ? (uu['name'] as string) : (nameFromParts || username || email)
          const mappedUser = { ...uu, name }
          localStorage.setItem('user', JSON.stringify(mappedUser))
        }
        // Keep the typed `user` in state as provided by backend
        set({ user, token, isAuthenticated: true })
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
        toast.info('Logged out successfully')
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
