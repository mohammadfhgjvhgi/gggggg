import { create } from 'zustand'

// ═══════════════════════════════════════
//   حالة المصادقة
// ═══════════════════════════════════════

export type Role = 'admin' | 'manager' | 'employee' | 'viewer'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  phone?: string | null
}

interface AuthState {
  user: SessionUser | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok && data.token) {
        localStorage.setItem('auth-token', data.token)
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          loading: false,
        })
        return true
      }
      set({ loading: false })
      return false
    } catch {
      set({ loading: false })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('auth-token')
    set({ user: null, token: null, isAuthenticated: false, loading: false })
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth-token')
    if (!token) {
      set({ loading: false, isAuthenticated: false })
      return
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        set({
          user: data.user,
          token,
          isAuthenticated: true,
          loading: false,
        })
      } else {
        localStorage.removeItem('auth-token')
        set({ user: null, token: null, isAuthenticated: false, loading: false })
      }
    } catch {
      set({ loading: false })
    }
  },
}))

// ═══════════════════════════════════════
//   حالة التطبيق
// ═══════════════════════════════════════

export type AppPage = 'dashboard' | 'customers' | 'bookings' | 'billing' | 'users' | 'settings'

interface AppState {
  currentPage: AppPage
  sidebarOpen: boolean
  setCurrentPage: (page: AppPage) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  sidebarOpen: false,
  setCurrentPage: (page) => set({ currentPage: page, sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
