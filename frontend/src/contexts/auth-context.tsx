import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { login as loginApi, logout as logoutApi } from "@/api/auth"
import { useMeQuery, authKeys } from "@/hooks/use-auth-query"
import type { User } from "@/types/auth"
import { getPostLoginRoute } from "@/lib/email-setup"

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface AuthContextValue extends AuthState {
  login: (
    email: string,
    password: string,
    options?: { redirect?: boolean }
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
        })
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    }
  }, [user, isLoading])

  const login = useCallback(
    async (
      email: string,
      password: string,
      options: { redirect?: boolean } = {}
    ) => {
      setState((prev) => ({ ...prev, isLoading: true }))
      try {
        const loggedInUser = await loginApi({ email, password })

        // Update query cache
        queryClient.setQueryData(authKeys.me(), loggedInUser)

        setState({
          user: loggedInUser,
          isAuthenticated: true,
          isLoading: false,
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
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })

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
