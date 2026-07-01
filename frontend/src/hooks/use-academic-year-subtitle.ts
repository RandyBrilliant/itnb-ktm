import { useAuth } from "@/hooks/use-auth"
import { formatAcademicYearSubtitle } from "@/lib/academic-year"
import type { UserRole } from "@/types/auth"

/** Academic year subtitle from the logged-in user's NIM (student / alumni). */
export function useAcademicYearSubtitle(role: UserRole): string | undefined {
  const { user } = useAuth()

  if (role !== "STUDENT" && role !== "ALUMNI") {
    return undefined
  }

  return formatAcademicYearSubtitle(user?.institutional_id) ?? undefined
}
