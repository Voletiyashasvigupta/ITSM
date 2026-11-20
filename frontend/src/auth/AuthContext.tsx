import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type PortalRole = 'EMPLOYEE' | 'MANAGER_ADMIN'
export type EmployeeDepartment = 'IT' | 'SOFTWARE_ENGINEERING' | 'SALES' | 'ADMINISTRATION' | 'HUMAN_RESOURCES' | 'FINANCE' | 'FACILITIES' | 'OPERATIONS' | 'CUSTOMER_SUPPORT' | 'LEGAL' | 'OTHER'
export type PortalUser = { id: string; fullName: string; email: string; role: PortalRole; department?: EmployeeDepartment | null; roles: PortalRole[]; active?: boolean }
type LoginResponse = { accessToken: string; user: PortalUser }
type RegistrationResponse = { status: string }
type ImpersonationSession = { accessToken: string; user: PortalUser }
type AuthValue = {
  user: PortalUser | null
  isImpersonating: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string) => Promise<RegistrationResponse>
  logout: () => void
  impersonate: (userId: string) => Promise<void>
  stopImpersonating: () => void
  apiFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
}

const TOKEN_KEY = 'northstar.access-token'
const IMPERSONATION_KEY = 'northstar.impersonation.original-session'
const AuthContext = createContext<AuthValue | null>(null)

async function errorMessage(response: Response) {
  try {
    const body = await response.json() as { detail?: string; message?: string; error?: string }
    return body.detail || body.message || body.error || `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [originalSession, setOriginalSession] = useState<ImpersonationSession | null>(() => {
    try { const saved = sessionStorage.getItem(IMPERSONATION_KEY); return saved ? JSON.parse(saved) as ImpersonationSession : null } catch { return null }
  })

  const apiFetch = useCallback(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const headers = new Headers(init.headers)
    const token = sessionStorage.getItem(TOKEN_KEY)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    const response = await fetch(input, { ...init, headers })
    if (response.status === 401 && token) {
      sessionStorage.removeItem(TOKEN_KEY)
      setUser(null)
    }
    return response
  }, [])

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    if (!token) { setLoading(false); return }
    apiFetch('/api/auth/me')
      .then(async (response) => {
        if (!response.ok) throw new Error(await errorMessage(response))
        setUser(await response.json() as PortalUser)
      })
      .catch(() => { sessionStorage.removeItem(TOKEN_KEY); setUser(null) })
      .finally(() => setLoading(false))
  }, [apiFetch])

  const value = useMemo<AuthValue>(() => ({
    user,
    isImpersonating: Boolean(originalSession),
    loading,
    apiFetch,
    login: async (email, password) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) throw new Error(await errorMessage(response))
      const result = await response.json() as LoginResponse
      sessionStorage.removeItem(IMPERSONATION_KEY)
      setOriginalSession(null)
      sessionStorage.setItem(TOKEN_KEY, result.accessToken)
      setUser(result.user)
    },
    register: async (fullName, email, password) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      })
      if (!response.ok) throw new Error(await errorMessage(response))
      return await response.json() as RegistrationResponse
    },
    logout: () => { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(IMPERSONATION_KEY); setOriginalSession(null); setUser(null) },
    impersonate: async (userId) => {
      if (!user || user.role !== 'MANAGER_ADMIN' || originalSession) throw new Error('Only a signed-in manager or administrator can start user testing.')
      const currentToken = sessionStorage.getItem(TOKEN_KEY)
      if (!currentToken) throw new Error('Your sign-in has expired. Sign in again.')
      const response = await apiFetch(`/api/auth/admin/users/${encodeURIComponent(userId)}/impersonate`, { method: 'POST' })
      if (!response.ok) throw new Error(await errorMessage(response))
      const result = await response.json() as LoginResponse
      const saved = { accessToken: currentToken, user }
      sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify(saved))
      sessionStorage.setItem(TOKEN_KEY, result.accessToken)
      setOriginalSession(saved)
      setUser(result.user)
    },
    stopImpersonating: () => {
      const saved = originalSession ?? (() => { try { const value = sessionStorage.getItem(IMPERSONATION_KEY); return value ? JSON.parse(value) as ImpersonationSession : null } catch { return null } })()
      if (!saved) return
      sessionStorage.setItem(TOKEN_KEY, saved.accessToken)
      sessionStorage.removeItem(IMPERSONATION_KEY)
      setOriginalSession(null)
      setUser(saved.user)
    },
  }), [apiFetch, loading, originalSession, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
