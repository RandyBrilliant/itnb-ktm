import { useQuery } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { getMyAcademic } from "@/api/academic"

/** Academic scores/GPA change monthly — avoid refetching on every visit. */
export const ACADEMIC_STALE_TIME_MS = 1000 * 60 * 60 * 24 * 7 // 7 days
export const ACADEMIC_GC_TIME_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

export const academicKeys = {
  all: ["academic"] as const,
  me: () => [...academicKeys.all, "me"] as const,
}

export function formatGpa(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—"
  return value.toFixed(2)
}

export function useMyAcademicQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: academicKeys.me(),
    queryFn: getMyAcademic,
    enabled: options?.enabled ?? true,
    staleTime: ACADEMIC_STALE_TIME_MS,
    gcTime: ACADEMIC_GC_TIME_MS,
    refetchOnWindowFocus: false,
    retry: (failureCount, err) => {
      if (isAxiosError(err) && err.response?.status && err.response.status < 500) {
        return false
      }
      return failureCount < 1
    },
  })
}
