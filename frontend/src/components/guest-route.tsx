import { Navigate, useSearchParams } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { getPostLoginRoute } from "@/lib/email-setup"
import { resolveSafeNextPath } from "@/lib/webinar-attendance"

interface GuestRouteProps {
  children: React.ReactNode
}

/**
 * Route guard for pages that only make sense when signed out (login, forgot password).
 * A signed-in user is sent to the `next` path if one was given, otherwise to their dashboard.
 */
export function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, isInitializing, user } = useAuth()
  const [searchParams] = useSearchParams()

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f9] text-sm font-semibold text-[#5f5e5e]">
        Loading...
      </div>
    )
  }

  if (isAuthenticated && user?.is_active) {
    const nextPath = resolveSafeNextPath(searchParams.get("next"))
    return <Navigate to={nextPath ?? getPostLoginRoute(user)} replace />
  }

  return children
}
