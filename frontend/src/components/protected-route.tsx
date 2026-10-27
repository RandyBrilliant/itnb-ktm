import { useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import type { UserRole } from "@/types/auth"
import { getDashboardRouteForRole } from "@/types/auth"
import { getRequiredOnboardingRoute, isOnboardingRoute } from "@/lib/email-setup"
import { logout as logoutApi } from "@/api/auth"

interface ProtectedRouteProps {
  children: React.ReactNode
  loginPath?: string
  allowedRoles?: UserRole[]
}

/**
 * Route guard that redirects unauthenticated users to login
 */
export function ProtectedRoute({
  children,
  loginPath = "/login",
  allowedRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()
  const hasAccessToken = !!localStorage.getItem("access_token")

  useEffect(() => {
    if (user && !user.is_active) {
      void logoutApi()
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (user && !user.is_active) {
    return <Navigate to={loginPath} replace />
  }

  if (!hasAccessToken || !isAuthenticated) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    const separator = loginPath.includes("?") ? "&" : "?"
    return <Navigate to={`${loginPath}${separator}next=${next}`} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardRouteForRole(user.role)} replace />
  }

  if (user) {
    const onboardingRoute = getRequiredOnboardingRoute(user)

    if (onboardingRoute && location.pathname !== onboardingRoute) {
      return <Navigate to={onboardingRoute} replace />
    }

    if (!onboardingRoute && isOnboardingRoute(user.role, location.pathname)) {
      return <Navigate to={getDashboardRouteForRole(user.role)} replace />
    }
  }

  return children
}
