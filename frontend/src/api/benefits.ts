import { api } from "@/lib/api"
import type { ApiSuccessResponse } from "@/types/api"
import type { PaginatedResponse } from "@/api/certificates"
import type { UserRole } from "@/types/auth"
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
  image?: string | null
  image_url?: string | null
  partner: string
  category: BenefitCategory | null
  eligible_roles: string[]
  is_active: boolean
  created_at: string
  updated_at?: string
}

export type BenefitListResponse = PaginatedResponse<Benefit>

export interface BenefitAdminFilters {
  page?: number
  page_size?: number
  search?: string
  category?: number
  is_active?: boolean
  ordering?: string
}

export interface BenefitPayload {
  title: string
  description: string
  description_short?: string
  partner?: string
  image_url?: string
  category: number | null
  eligible_roles: UserRole[]
  is_active: boolean
  /** Uploaded cover image (multipart). Omit when using image_url only. */
  imageFile?: File | null
}

function appendBenefitFormData(fd: FormData, payload: Omit<BenefitPayload, "imageFile">): void {
  fd.append("title", payload.title)
  fd.append("description", payload.description)
  fd.append("description_short", payload.description_short ?? "")
  fd.append("partner", payload.partner ?? "")
  if (payload.image_url !== undefined) {
    fd.append("image_url", payload.image_url)
  }
  if (payload.category != null) fd.append("category", String(payload.category))
  else fd.append("category", "")
  fd.append("eligible_roles", JSON.stringify(payload.eligible_roles))
  fd.append("is_active", String(payload.is_active))
}

function buildQuery(filters?: Record<string, string | number | boolean | undefined>): string {
  const params = Object.entries(filters || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&")
  return params ? `?${params}` : ""
}

/**
 * GET /api/benefits/ — paginated list for the current user (role-filtered).
 */
export async function listBenefits(page?: number): Promise<BenefitListResponse> {
  const query = page ? `?page=${page}` : ""
  const { data } = await api.get<ApiSuccessResponse<BenefitListResponse> | BenefitListResponse>(
    `/api/benefits/${query}`
  )
  return unwrapApiData(data, "Failed to fetch benefits")
}

/**
 * GET /api/benefits/ — full directory for benefit managers (Admin / authorized Staff).
 */
export async function listBenefitsAdmin(filters?: BenefitAdminFilters): Promise<BenefitListResponse> {
  const query = buildQuery(filters as Record<string, string | number | boolean | undefined>)
  const { data } = await api.get<ApiSuccessResponse<BenefitListResponse> | BenefitListResponse>(
    `/api/benefits/${query}`
  )
  return unwrapApiData(data, "Failed to fetch benefits")
}

/**
 * GET /api/benefits/{id}/
 */
export async function getBenefit(id: number): Promise<Benefit> {
  const { data } = await api.get<ApiSuccessResponse<Benefit> | Benefit>(`/api/benefits/${id}/`)
  return unwrapApiData(data, "Failed to fetch benefit")
}

/**
 * POST /api/benefits/
 */
export async function createBenefit(payload: BenefitPayload): Promise<Benefit> {
  const { imageFile, ...rest } = payload
  if (imageFile) {
    const fd = new FormData()
    appendBenefitFormData(fd, rest)
    fd.append("image", imageFile)
    const { data } = await api.post<ApiSuccessResponse<Benefit> | Benefit>("/api/benefits/", fd)
    return unwrapApiData(data, "Failed to create benefit")
  }
  const { data } = await api.post<ApiSuccessResponse<Benefit> | Benefit>("/api/benefits/", rest)
  return unwrapApiData(data, "Failed to create benefit")
}

/**
 * PATCH /api/benefits/{id}/
 */
export async function updateBenefit(id: number, payload: BenefitPayload): Promise<Benefit> {
  const { imageFile, ...rest } = payload
  if (imageFile) {
    const fd = new FormData()
    appendBenefitFormData(fd, rest)
    fd.append("image", imageFile)
    const { data } = await api.patch<ApiSuccessResponse<Benefit> | Benefit>(`/api/benefits/${id}/`, fd)
    return unwrapApiData(data, "Failed to update benefit")
  }
  const { data } = await api.patch<ApiSuccessResponse<Benefit> | Benefit>(`/api/benefits/${id}/`, rest)
  return unwrapApiData(data, "Failed to update benefit")
}

/**
 * DELETE /api/benefits/{id}/
 */
export async function deleteBenefit(id: number): Promise<void> {
  await api.delete(`/api/benefits/${id}/`)
}

type CategoriesPayload = BenefitCategory[] | PaginatedResponse<BenefitCategory>

function normalizeCategoryList(payload: CategoriesPayload): BenefitCategory[] {
  if (Array.isArray(payload)) return payload
  return payload.results ?? []
}

/**
 * GET /api/benefit-categories/ — supports paginated API responses.
 */
export async function listBenefitCategories(): Promise<BenefitCategory[]> {
  const { data } = await api.get<ApiSuccessResponse<CategoriesPayload> | CategoriesPayload>(
    "/api/benefit-categories/?page_size=100"
  )
  const raw = unwrapApiData(data, "Failed to fetch benefit categories")
  return normalizeCategoryList(raw)
}

/**
 * POST /api/benefit-categories/ — staff/admin with manage permission
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
