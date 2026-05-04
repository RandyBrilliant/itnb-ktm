type ErrorContext =
  | "login"
  | "admin-login"
  | "forgot-password"
  | "reset-password"
  | "logout"
  | "user-status"
  | "generic"

interface ApiErrorShape {
  response?: {
    status?: number
    data?: {
      detail?: string
      code?: string
      errors?: Record<string, string[]>
    }
  }
  message?: string
}

function getFieldError(errors?: Record<string, string[]>): string | null {
  if (!errors) return null
  const first = Object.values(errors)[0]?.[0]
  return first || null
}

export function getUserFriendlyError(
  err: unknown,
  context: ErrorContext = "generic"
): string {
  const error = err as ApiErrorShape
  const status = error.response?.status
  const code = error.response?.data?.code
  const detail = error.response?.data?.detail
  const fieldError = getFieldError(error.response?.data?.errors)
  const rawMessage = detail || fieldError || error.message || ""
  const normalized = rawMessage.toLowerCase()

  if (status == null || normalized.includes("network error")) {
    return "Unable to connect to the server. Please check your internet connection and try again."
  }

  if (status >= 500) {
    return "Server is currently unavailable. Please try again in a moment."
  }

  if (status === 429) {
    return "Too many attempts. Please wait a moment and try again."
  }

  if (context === "login" || context === "admin-login") {
    if (status === 401 || normalized.includes("token_not_valid")) {
      return "Incorrect username/email or password. Please try again."
    }
    if (status === 403) {
      return "Your account does not have access to this portal."
    }
  }

  if (context === "forgot-password") {
    if (status === 400) {
      return "Please enter a valid email address."
    }
  }

  if (context === "reset-password") {
    if (status === 400 && normalized.includes("token")) {
      return "This reset link is invalid or expired. Please request a new reset link."
    }
    if (status === 400) {
      return fieldError || "Please check your password requirements and try again."
    }
  }

  if (context === "logout") {
    return "Unable to log out right now. Please try again."
  }

  if (context === "user-status") {
    return "Unable to update user status right now. Please try again."
  }

  if (code === "unauthorized" || normalized.includes("authentication required")) {
    return "Your session has expired. Please log in again."
  }

  return rawMessage || "Something went wrong. Please try again."
}

