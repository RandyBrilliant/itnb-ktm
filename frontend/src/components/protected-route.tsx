import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import type { UserRole } from "@/types/auth"
import { getDashboardRouteForRole } from "@/types/auth"
import { getEmailSetupRoute, requiresEmailSetup } from "@/lib/email-setup"

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border b-2 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!hasAccessToken || !isAuthenticated) {
    return <Navigate to={loginPath} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardRouteForRole(user.role)} replace />
  }

  const emailSetupRoute = user ? getEmailSetupRoute(user.role) : null
  const onEmailSetupRoute = emailSetupRoute ? location.pathname === emailSetupRoute : false

  if (user && emailSetupRoute && requiresEmailSetup(user) && !onEmailSetupRoute) {
    return <Navigate to={emailSetupRoute} replace />
  }

  if (user && emailSetupRoute && onEmailSetupRoute && !requiresEmailSetup(user)) {
    return <Navigate to={getDashboardRouteForRole(user.role)} replace />
  }

  return children
}
