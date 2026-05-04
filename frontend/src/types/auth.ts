/**
 * Authentication types and role definitions
 */

export type UserRole = "ADMIN" | "STAFF" | "LECTURER" | "STUDENT" | "ALUMNI"

export interface User {
  id: number
  email: string
  full_name?: string
  role: UserRole
  photo?: string
  department?: string
  alumni_year?: number
  email_verified: boolean
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface LoginResponseData {
  user: User
}

/**
 * Get the dashboard route for a role
 */
export const getDashboardRouteForRole = (role: UserRole): string => {
  const routes: Record<UserRole, string> = {
    ADMIN: "/admin/dashboard",
    STAFF: "/staff",
    LECTURER: "/lecturer",
    STUDENT: "/student",
    ALUMNI: "/alumni",
  }
  return routes[role] || "/login"
}
