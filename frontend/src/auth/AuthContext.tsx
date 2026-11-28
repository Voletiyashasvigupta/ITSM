import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Valid portal access roles supported across Northstar ITSM.
 * - `EMPLOYEE`: Standard portal user access (self-service catalog, own tickets).
 * - `MANAGER_ADMIN`: Combined manager and administrator access (approvals, user administration, global queues).
 */
export type PortalRole = 'EMPLOYEE' | 'MANAGER_ADMIN'

/**
 * Organizational departments for employees within Northstar Bank.
 */
export type EmployeeDepartment =
  | 'IT'
  | 'SOFTWARE_ENGINEERING'
  | 'SALES'
  | 'ADMINISTRATION'
  | 'HUMAN_RESOURCES'
  | 'FINANCE'
  | 'FACILITIES'
  | 'OPERATIONS'
  | 'CUSTOMER_SUPPORT'
  | 'LEGAL'
  | 'OTHER'

/**
 * Represents the authenticated portal user's profile and assigned roles.
 */
export type PortalUser = {
  id: string
  employeeId?: string
  username: string
  fullName: string
  email: string
  role: PortalRole
  department?: EmployeeDepartment | null
  roles: PortalRole[]
  active?: boolean
}

/** Server response payload returned by POST /api/auth/login. */
type LoginResponse = { accessToken: string; user: PortalUser }

/** Server response payload returned by POST /api/auth/register. */
type RegistrationResponse = { status: string }

/** Cached session state used to restore an administrator's identity after user impersonation. */
type ImpersonationSession = { accessToken: string; user: PortalUser }

/**
 * React context interface providing authentication state, login/registration actions,
 * user impersonation, and an authenticated fetch interceptor.
 */
type AuthValue = {
  /** The currently authenticated user, or null if unauthenticated. */
  user: PortalUser | null
  /** Indicates whether an administrator is currently testing as another portal user. */
  isImpersonating: boolean
  /** Indicates whether initial session verification (/api/auth/me) is in progress. */
  loading: boolean
  /** Authenticates against /api/auth/login with corporate username, stores the JWT, and initializes user state. */
  login: (username: string, password: string) => Promise<void>
  /** Registers a new account with work email and optional chosen corporate username and employee ID, awaiting administrative role assignment. */
  register: (fullName: string, email: string, password: string, username?: string, employeeId?: string) => Promise<RegistrationResponse>
  /** Logs out by purging JWT and session data from sessionStorage. */
  logout: () => void
  /** Initiates administrative user testing/impersonation. */
  impersonate: (userId: string) => Promise<void>
  /** Restores the administrator's original session. */
  stopImpersonating: () => void
  /** Authenticated fetch wrapper that automatically injects the Authorization: Bearer token. */
  apiFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
}

/** Storage key for the active JWT access token in sessionStorage. */
const TOKEN_KEY = 'northstar.access-token'
/** Storage key for the original administrator session during user impersonation. */
const IMPERSONATION_KEY = 'northstar.impersonation.original-session'

const AuthContext = createContext<AuthValue | null>(null)

/**
 * Extracts a human-readable error message from an unsuccessful HTTP response.
 */
async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string; message?: string; error?: string }
    return body.detail || body.message || body.error || `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

/**
 * Root Authentication Provider component.
 * Manages JWT tokens in sessionStorage, exposes the authenticated `apiFetch` HTTP interceptor,
 * and maintains the current user profile state.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [originalSession, setOriginalSession] = useState<ImpersonationSession | null>(() => {
    try {
      const saved = sessionStorage.getItem(IMPERSONATION_KEY)
      return saved ? (JSON.parse(saved) as ImpersonationSession) : null
    } catch {
      return null
    }
  })

  /**
   * Authenticated HTTP Fetch Interceptor.
   * - Injects `Authorization: Bearer <token>` from sessionStorage if present.
   * - Injects `Content-Type: application/json` for requests with a body.
   * - Automatically purges expired credentials and signs the user out on 401 Unauthorized responses.
   */
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

  // On initial mount, verify existing session token via GET /api/auth/me
  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    apiFetch('/api/auth/me')
      .then(async (response) => {
        if (!response.ok) throw new Error(await errorMessage(response))
        setUser((await response.json()) as PortalUser)
      })
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [apiFetch])

  const value = useMemo<AuthValue>(
    () => ({
      user,
      isImpersonating: Boolean(originalSession),
      loading,
      apiFetch,
      login: async (username, password) => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password }),
        })
        if (!response.ok) throw new Error(await errorMessage(response))
        const result = (await response.json()) as LoginResponse
        sessionStorage.removeItem(IMPERSONATION_KEY)
        setOriginalSession(null)
        sessionStorage.setItem(TOKEN_KEY, result.accessToken)
        setUser(result.user)
      },
      register: async (fullName, email, password, username, employeeId) => {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            password,
            username: username ? username.trim().toLowerCase() : undefined,
            employeeId: employeeId ? employeeId.trim().toUpperCase() : undefined,
          }),
        })
        if (!response.ok) throw new Error(await errorMessage(response))
        return (await response.json()) as RegistrationResponse
      },
      logout: () => {
        sessionStorage.removeItem(TOKEN_KEY)
        sessionStorage.removeItem(IMPERSONATION_KEY)
        setOriginalSession(null)
        setUser(null)
      },
      impersonate: async (userId) => {
        if (!user || user.role !== 'MANAGER_ADMIN' || originalSession) {
          throw new Error('Only a signed-in manager or administrator can start user testing.')
        }
        const currentToken = sessionStorage.getItem(TOKEN_KEY)
        if (!currentToken) throw new Error('Your sign-in has expired. Sign in again.')
        const response = await apiFetch(`/api/auth/admin/users/${encodeURIComponent(userId)}/impersonate`, {
          method: 'POST',
        })
        if (!response.ok) throw new Error(await errorMessage(response))
        const result = (await response.json()) as LoginResponse
        const saved = { accessToken: currentToken, user }
        sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify(saved))
        sessionStorage.setItem(TOKEN_KEY, result.accessToken)
        setOriginalSession(saved)
        setUser(result.user)
      },
      stopImpersonating: () => {
        const saved =
          originalSession ??
          (() => {
            try {
              const value = sessionStorage.getItem(IMPERSONATION_KEY)
              return value ? (JSON.parse(value) as ImpersonationSession) : null
            } catch {
              return null
            }
          })()
        if (!saved) return
        sessionStorage.setItem(TOKEN_KEY, saved.accessToken)
        sessionStorage.removeItem(IMPERSONATION_KEY)
        setOriginalSession(null)
        setUser(saved.user)
      },
    }),
    [apiFetch, loading, originalSession, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to consume the authentication context.
 * Throws an error if invoked outside an `<AuthProvider />`.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
