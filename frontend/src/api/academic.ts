import { api } from "@/lib/api"
import type { ApiSuccessResponse } from "@/types/api"
import { unwrapApiData } from "@/lib/api-response"

export interface GpaSummary {
  student_name: string | null
  student_class: string | null
  student_major: string | null
  student_year: number | null
  student_gpa: number | null
}

export interface ScoreRow {
  subject: string
  semester: number | null
  grade: string
  score: number | null
}

export interface AcademicProfile {
  summary: GpaSummary | null
  scores: ScoreRow[]
  /** True when served from a cached snapshot because the live SIS was unreachable. */
  stale?: boolean
  /** ISO timestamp of the cached snapshot (only set when stale). */
  synced_at?: string | null
}

export async function getMyAcademic(): Promise<AcademicProfile> {
  const { data } = await api.get<ApiSuccessResponse<AcademicProfile> | AcademicProfile>(
    "/api/academic/me/"
  )
  return unwrapApiData(data, "Failed to fetch academic scores")
}
