import { api } from "@/lib/api"
import type { User, UserRole } from "@/types/auth"
import type { ApiSuccessResponse } from "@/types/api"
import { unwrapApiData } from "@/lib/api-response"

export type CreateUserPayload = {
  email: string
  full_name: string
  password: string
  password_confirm: string
  role: UserRole
  department?: string
  institutional_id?: string | null
  is_active?: boolean
  alumni_year?: number | null
  staff_role?: string
  can_issue_certificates?: boolean
  can_manage_benefits?: boolean
  contact_phone?: string
  address?: string
}

/** PATCH body for admin directory user updates (matches backend UserAdminUpdateSerializer). */
export type AdminUpdateUserPayload = {
  email?: string
  full_name?: string
  department?: string
  institutional_id?: string | null
  is_active?: boolean
  /** Only student ↔ alumni switching on student-record edits (backend validates). */
  role?: "STUDENT" | "ALUMNI"
  alumni_year?: number | null
  staff_role?: string
  can_issue_certificates?: boolean
  can_manage_benefits?: boolean
  contact_phone?: string
  address?: string
  photoFile?: File | null
  photoRemoved?: boolean
}

function appendAdminUserFormFields(fd: FormData, payload: Omit<AdminUpdateUserPayload, "photoFile" | "photoRemoved">): void {
  if (payload.email !== undefined) fd.append("email", payload.email)
  if (payload.full_name !== undefined) fd.append("full_name", payload.full_name)
  if (payload.department !== undefined) fd.append("department", payload.department)
  if (payload.institutional_id !== undefined) {
    fd.append("institutional_id", payload.institutional_id ?? "")
  }
  if (payload.is_active !== undefined) fd.append("is_active", String(payload.is_active))
  if (payload.role !== undefined) fd.append("role", payload.role)
  if (payload.alumni_year !== undefined) {
    fd.append("alumni_year", payload.alumni_year == null ? "" : String(payload.alumni_year))
  }
  if (payload.contact_phone !== undefined) fd.append("contact_phone", payload.contact_phone)
  if (payload.address !== undefined) fd.append("address", payload.address)
}

export interface UserFilters {
  role?: string
  /** Comma-separated roles (e.g. STUDENT,ALUMNI). Backend filters with role__in. */
  roles?: string
  is_active?: boolean
  search?: string
  page?: number
  page_size?: number
}

export interface UserListResponse {
  count: number
  next?: string
  previous?: string
  results: User[]
}

/**
 * GET /api/users/ - List users
 */
export async function listUsers(filters?: UserFilters): Promise<UserListResponse> {
  const params = Object.entries(filters || {})
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&")

  const url = `/api/users/${params ? "?" + params : ""}`
  const { data } = await api.get<ApiSuccessResponse<UserListResponse> | UserListResponse>(url)
  return unwrapApiData(data, "Failed to fetch users")
}

/**
 * GET /api/users/{id}/ - Get user by ID
 */
export async function getUser(id: number): Promise<User> {
  const { data } = await api.get<ApiSuccessResponse<User> | User>(`/api/users/${id}/`)
  return unwrapApiData(data, "Failed to fetch user")
}

/**
 * POST /api/users/ - Create new user
 */
export async function createUser(userData: CreateUserPayload): Promise<User> {
  const { data } = await api.post<ApiSuccessResponse<User> | User>("/api/users/", userData)
  return unwrapApiData(data, "Failed to create user")
}

/**
 * PATCH /api/users/{id}/ - Update user
 */
export async function updateUser(id: number, userData: AdminUpdateUserPayload): Promise<User> {
  const { photoFile, photoRemoved, ...rest } = userData

  if (photoFile) {
    const fd = new FormData()
    appendAdminUserFormFields(fd, rest)
    fd.append("photo", photoFile)
    const { data } = await api.patch<ApiSuccessResponse<User> | User>(`/api/users/${id}/`, fd)
    return unwrapApiData(data, "Failed to update user")
  }

  const body: Record<string, unknown> = { ...rest }
  if (photoRemoved) body.photo = null

  const { data } = await api.patch<ApiSuccessResponse<User> | User>(`/api/users/${id}/`, body)
  return unwrapApiData(data, "Failed to update user")
}

/**
 * DELETE /api/users/{id}/ - Delete user
 */
export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/api/users/${id}/`)
}

/**
 * POST /api/users/{id}/activate/ - Activate user
 */
export async function activateUser(id: number): Promise<User> {
  const { data } = await api.post<ApiSuccessResponse<User> | User>(
    `/api/users/${id}/activate/`
  )
  return unwrapApiData(data, "Failed to activate user")
}

/**
 * POST /api/users/{id}/deactivate/ - Deactivate user
 */
export async function deactivateUser(id: number): Promise<User> {
  const { data } = await api.post<ApiSuccessResponse<User> | User>(
    `/api/users/${id}/deactivate/`
  )
  return unwrapApiData(data, "Failed to deactivate user")
}

export interface StudentImportResult {
  created: number
  skipped: number
  errors: Array<{ row?: number; email?: string; message: string }>
}

/**
 * GET /api/users/import-students/ — download Excel template (blob).
 */
export async function downloadStudentImportTemplate(): Promise<Blob> {
  const { data } = await api.get("/api/users/import-students/", { responseType: "blob" })
  return data as Blob
}

/**
 * POST /api/users/import-students/ — bulk-create student accounts from .xlsx.
 */
export async function importStudentsFromExcel(
  file: File,
  defaultPassword?: string
): Promise<StudentImportResult> {
  const formData = new FormData()
  formData.append("file", file)
  if (defaultPassword?.trim()) {
    formData.append("default_password", defaultPassword.trim())
  }
  const { data } = await api.post<ApiSuccessResponse<StudentImportResult> | StudentImportResult>(
    "/api/users/import-students/",
    formData
  )
  return unwrapApiData(data, "Import failed")
}
