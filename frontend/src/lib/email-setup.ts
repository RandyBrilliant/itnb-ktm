import type { User, UserRole } from "@/types/auth"
import { getDashboardRouteForRole } from "@/types/auth"

const PLACEHOLDER_EMAIL_DOMAIN = "import.student.itnb.ac.id"

export function requiresEmailSetup(user: User | null | undefined): boolean {
  if (!user) return false
  if (typeof user.requires_email_setup === "boolean") {
    return user.requires_email_setup
  }
  return user.email.trim().toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`)
}

export function getEmailSetupRoute(role: UserRole): string | null {
  if (role === "STUDENT") return "/student/setup-email"
  if (role === "ALUMNI") return "/alumni/setup-email"
  return null
}

export function getPostLoginRoute(user: User): string {
  if (requiresEmailSetup(user)) {
    const setupRoute = getEmailSetupRoute(user.role)
    if (setupRoute) return setupRoute
  }
  return getDashboardRouteForRole(user.role)
}

export function formatUserEmailLabel(user: User): string {
  if (requiresEmailSetup(user)) {
    return "Not set up yet"
  }
  return user.email
}
