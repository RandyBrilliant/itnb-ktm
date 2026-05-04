import type { UserRole } from "@/types/auth"

export function getRoleBasePath(role: UserRole): string {
  if (role === "STUDENT") return "/student"
  if (role === "STAFF") return "/staff"
  if (role === "LECTURER") return "/lecturer"
  return "/"
}

