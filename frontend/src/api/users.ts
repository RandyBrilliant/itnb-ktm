import { api } from "@/lib/api"
import type { User } from "@/types/auth"
import type { ApiSuccessResponse } from "@/types/api"
import { unwrapApiData } from "@/lib/api-response"

export interface UserFilters {
  role?: string
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
export async function createUser(userData: Partial<User>): Promise<User> {
  const { data } = await api.post<ApiSuccessResponse<User> | User>("/api/users/", userData)
  return unwrapApiData(data, "Failed to create user")
}

/**
 * PATCH /api/users/{id}/ - Update user
 */
export async function updateUser(id: number, userData: Partial<User>): Promise<User> {
  const { data } = await api.patch<ApiSuccessResponse<User> | User>(
    `/api/users/${id}/`,
    userData
  )
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
