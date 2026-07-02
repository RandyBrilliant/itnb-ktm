import type { UserRole } from "@/types/auth"
import { getDashboardRouteForRole } from "@/types/auth"
import { getRoleBasePath } from "@/lib/role-path"

/** Safe internal redirect target from ?next= after login. */
export function resolveSafeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null
  }
  return next
}

export function getWebinarsListPath(role: UserRole): string {
  const base = getRoleBasePath(role)
  if (role === "STUDENT" || role === "ALUMNI") {
    return `${base}/certificates?tab=webinars`
  }
  return getDashboardRouteForRole(role)
}
