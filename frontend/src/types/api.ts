/**
 * Backend API response shapes.
 * Matches account.api_responses success_response / error_response.
 */

/** Success response wrapper */
export interface ApiSuccessResponse<T = unknown> {
  code: string
  detail?: string
  data?: T
}

/** Error response wrapper */
export interface ApiErrorResponse {
  code: string
  detail: string
  errors?: Record<string, string[]>
}

/** Login response data */
export interface LoginResponseData {
  access: string
  refresh?: string
}
