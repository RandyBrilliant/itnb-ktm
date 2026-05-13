import type { UserRole } from "@/types/auth"

export function getRoleBasePath(role: UserRole): string {
  if (role === "ADMIN") return "/admin"
  if (role === "STUDENT") return "/student"
  if (role === "STAFF") return "/staff"
  if (role === "LECTURER") return "/lecturer"
  if (role === "ALUMNI") return "/alumni"
  return "/"
}

