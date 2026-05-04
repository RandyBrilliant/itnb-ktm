import { api } from "@/lib/api"
import type { ApiSuccessResponse } from "@/types/api"
import { unwrapApiData } from "@/lib/api-response"

export interface BenefitCategory {
  id: number
  name: string
  description: string
  icon?: string
  created_at: string
}

export interface Benefit {
  id: number
  title: string
  description: string
  description_short: string
  image_url?: string | null
  partner: string
  category: BenefitCategory
  eligible_roles: string[]
  is_active: boolean
  created_at: string
}

export interface BenefitListResponse {
  count: number
  next?: string
  previous?: string
  results: Benefit[]
}

/**
 * GET /api/benefits/ - List benefits for authenticated user
 */
export async function listBenefits(page?: number): Promise<BenefitListResponse> {
  const url = `/api/benefits/${page ? "?page=" + page : ""}`
  const { data } = await api.get<ApiSuccessResponse<BenefitListResponse> | BenefitListResponse>(url)
  return unwrapApiData(data, "Failed to fetch benefits")
}

/**
 * GET /api/benefits/{id}/ - Get benefit by ID
 */
export async function getBenefit(id: number): Promise<Benefit> {
  const { data } = await api.get<ApiSuccessResponse<Benefit> | Benefit>(`/api/benefits/${id}/`)
  return unwrapApiData(data, "Failed to fetch benefit")
}

/**
 * GET /api/benefit-categories/ - List benefit categories
 */
export async function listBenefitCategories(): Promise<BenefitCategory[]> {
  const { data } = await api.get<ApiSuccessResponse<BenefitCategory[]> | BenefitCategory[]>(
    "/api/benefit-categories/"
  )
  return unwrapApiData(data, "Failed to fetch benefit categories")
}

/**
 * POST /api/benefit-categories/ - Create benefit category (staff only)
 */
export async function createBenefitCategory(
  categoryData: Partial<BenefitCategory>
): Promise<BenefitCategory> {
  const { data } = await api.post<ApiSuccessResponse<BenefitCategory> | BenefitCategory>(
    "/api/benefit-categories/",
    categoryData
  )
  return unwrapApiData(data, "Failed to create benefit category")
}
