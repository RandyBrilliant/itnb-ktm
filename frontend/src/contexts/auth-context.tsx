import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { getMe, login as loginApi, logout as logoutApi } from "@/api/auth"
import { useMeQuery, authKeys } from "@/hooks/use-auth-query"
import type { User, UserRole } from "@/types/auth"
import { getPostLoginRoute } from "@/lib/email-setup"
import { RoleNotAllowedError } from "@/lib/auth-errors"

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  /** True only while the session stored at page load is being resolved. */
  isInitializing: boolean
}

const SIGNED_OUT = { user: null, isAuthenticated: false, isLoading: false } as const

export interface AuthContextValue extends AuthState {
  login: (
    email: string,
    password: string,
    options?: { redirect?: boolean; allowedRoles?: UserRole[] }
  ) => Promise<User>
  logout: (options?: { redirectTo?: string; callApi?: boolean }) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isInitializing: true,
  })

  // Fetch current user on mount
  const { data: user, isLoading } = useMeQuery({
    enabled: !!localStorage.getItem("access_token"),
  })

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          isInitializing: false,
        })
      } else {
        setState({ ...SIGNED_OUT, isInitializing: false })
      }
    }
  }, [user, isLoading])

  // Keep tabs in sync: signing out (or in) in one tab updates the others.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "access_token" && event.key !== null) return

      if (!localStorage.getItem("access_token")) {
        void queryClient.cancelQueries()
        queryClient.clear()
        // ProtectedRoute sends the user to the login page once this state lands.
        setState({ ...SIGNED_OUT, isInitializing: false })
        return
      }

      if (event.oldValue === null) {
        void queryClient
          .fetchQuery({ queryKey: authKeys.me(), queryFn: getMe, staleTime: 0 })
          .then((freshUser) =>
            setState({ user: freshUser, isAuthenticated: true, isLoading: false, isInitializing: false })
          )
          .catch(() => {
            // The 401 interceptor handles an invalid session.
          })
      }
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [queryClient])

  const login = useCallback(
    async (
      email: string,
      password: string,
      options: { redirect?: boolean; allowedRoles?: UserRole[] } = {}
    ) => {
      setState((prev) => ({ ...prev, isLoading: true }))
      try {
        const loggedInUser = await loginApi({ email, password })

        // Reject wrong-portal logins before the app ever treats them as signed in,
        // and revoke the tokens that were just issued.
        if (options.allowedRoles && !options.allowedRoles.includes(loggedInUser.role)) {
          await logoutApi()
          throw new RoleNotAllowedError(loggedInUser.role)
        }

        // Update query cache
        queryClient.setQueryData(authKeys.me(), loggedInUser)

        setState({
          user: loggedInUser,
          isAuthenticated: true,
          isLoading: false,
          isInitializing: false,
        })

        if (options.redirect !== false) {
          navigate(getPostLoginRoute(loggedInUser))
        }
        return loggedInUser
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }))
        throw error
      }
    },
    [navigate, queryClient]
  )

  const logout = useCallback(async (options?: { redirectTo?: string; callApi?: boolean }) => {
    const redirectTo = options?.redirectTo ?? "/login"
    const callApi = options?.callApi ?? true
    try {
      if (callApi) {
        await logoutApi()
      } else {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear all cached data
      await queryClient.cancelQueries()
      queryClient.clear()

      // Clear state
      setState({ ...SIGNED_OUT, isInitializing: false })

      // Navigate to login
      navigate(redirectTo, { replace: true })
    }
  }, [navigate, queryClient])

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
