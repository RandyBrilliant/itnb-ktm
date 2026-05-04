import { api } from "@/lib/api"
import type { User } from "@/types/auth"
import type { ApiSuccessResponse, LoginResponseData } from "@/types/api"

export interface LoginCredentials {
  email: string
  password: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  uid: string
  token: string
  new_password: string
  new_password_confirm: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
  new_password_confirm: string
}

interface JwtTokenResponse {
  access: string
  refresh?: string
}

const extractTokenPayload = (
  payload: ApiSuccessResponse<LoginResponseData> | JwtTokenResponse
): JwtTokenResponse => {
  if ("data" in payload && payload.data) {
    return payload.data
  }

  return payload as JwtTokenResponse
}

/**
 * POST /api/auth/token/ - Login and get JWT tokens
 */
export async function login(credentials: LoginCredentials): Promise<User> {
  const { data } = await api.post<ApiSuccessResponse<LoginResponseData> | JwtTokenResponse>(
    "/api/auth/token/",
    credentials
  )
  const tokenData = extractTokenPayload(data)

  if (!tokenData.access) {
    throw new Error("Invalid response from server")
  }

  // Store token in localStorage
  localStorage.setItem("access_token", tokenData.access)
  if (tokenData.refresh) {
    localStorage.setItem("refresh_token", tokenData.refresh)
  }

  // Fetch and return the current user
  return getMe()
}

/**
 * POST /api/auth/token/refresh/ - Refresh access token
 */
export async function refreshToken(): Promise<string> {
  const refresh = localStorage.getItem("refresh_token")
  if (!refresh) {
    throw new Error("No refresh token available")
  }

  const { data } = await api.post<
    ApiSuccessResponse<{ access: string }> | { access: string }
  >("/api/auth/token/refresh/", { refresh })

  const access =
    "data" in data
      ? data.data?.access
      : "access" in data
        ? data.access
        : undefined

  if (!access) {
    throw new Error("Failed to refresh token")
  }

  localStorage.setItem("access_token", access)
  return access
}

/**
 * POST /api/auth/logout/ - Logout
 */
export async function logout(): Promise<void> {
  try {
    await api.post("/api/auth/logout/")
  } catch {
    // Some deployments do not expose logout endpoint; local cleanup still signs out.
  }
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
}

/**
 * POST /api/auth/forgot-password/ - Request password reset link
 */
export async function requestPasswordReset(
  payload: ForgotPasswordPayload
): Promise<void> {
  await api.post("/api/auth/forgot-password/", payload)
}

/**
 * POST /api/auth/reset-password/ - Apply new password from reset link
 */
export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await api.post("/api/auth/reset-password/", payload)
}

/**
 * POST /api/auth/change-password/ - Change password for authenticated user
 */
export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await api.post("/api/auth/change-password/", payload)
}

/**
 * GET /api/auth/me/ - Get current authenticated user
 */
export async function getMe(): Promise<User> {
  const { data } = await api.get<ApiSuccessResponse<User>>("/api/auth/me/")

  if (!data.data) {
    throw new Error("Failed to fetch user")
  }

  return data.data
}

/**
 * PATCH /api/auth/me/ - Update authenticated user profile fields
 */
export async function updateMe(payload: Partial<User>): Promise<User> {
  const { data } = await api.patch<ApiSuccessResponse<User>>("/api/auth/me/", payload)
  if (!data.data) {
    throw new Error("Failed to update profile")
  }
  return data.data
}
