/**
 * Authentication types and role definitions
 */

export type UserRole = "ADMIN" | "STAFF" | "LECTURER" | "STUDENT" | "ALUMNI"

export interface StaffProfileDto {
  staff_role: string
  can_issue_certificates: boolean
  can_manage_benefits: boolean
}

export interface LecturerProfileDto {
  contact_phone: string
  address: string
}

export interface User {
  id: number
  email: string
  full_name?: string
  /** Official student/staff ID (NIM/NIP) for records and certificate matching. */
  institutional_id?: string | null
  role: UserRole
  role_display?: string
  photo?: string
  department?: string
  alumni_year?: number
  email_verified: boolean
  is_active: boolean
  is_staff?: boolean
  is_superuser?: boolean
  last_login?: string | null
  date_joined?: string
  created_at?: string
  updated_at?: string
  staff_profile?: StaffProfileDto | null
  lecturer_profile?: LecturerProfileDto | null
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
