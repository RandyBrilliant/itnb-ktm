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

/** Staff and lecturer accounts are created by an admin with a real email that still needs verifying. */
export function requiresEmailVerification(user: User | null | undefined): boolean {
  if (!user) return false
  if (user.role !== "STAFF" && user.role !== "LECTURER") return false
  return !user.email_verified && !requiresEmailSetup(user)
}

export function getEmailVerificationRoute(role: UserRole): string | null {
  if (role === "STAFF") return "/staff/verify-email"
  if (role === "LECTURER") return "/lecturer/verify-email"
  return null
}

/** The onboarding route the user must complete before using the portal, if any. */
export function getRequiredOnboardingRoute(user: User | null | undefined): string | null {
  if (!user) return null
  if (requiresEmailSetup(user)) return getEmailSetupRoute(user.role)
  if (requiresEmailVerification(user)) return getEmailVerificationRoute(user.role)
  return null
}

export function isOnboardingRoute(role: UserRole, pathname: string): boolean {
  return pathname === getEmailSetupRoute(role) || pathname === getEmailVerificationRoute(role)
}

export function getPostLoginRoute(user: User): string {
  return getRequiredOnboardingRoute(user) ?? getDashboardRouteForRole(user.role)
}

export function formatUserEmailLabel(user: User): string {
  if (requiresEmailSetup(user)) {
    return "Not set up yet"
  }
  return user.email
}
