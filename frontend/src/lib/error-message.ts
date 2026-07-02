type ErrorContext =
  | "login"
  | "admin-login"
  | "forgot-password"
  | "reset-password"
  | "change-password"
  | "logout"
  | "user-status"
  | "scores"
  | "generic"

interface ApiErrorShape {
  response?: {
    status?: number
    data?: {
      detail?: string
      code?: string
      errors?: Record<string, string[]>
    } & Record<string, unknown>
  }
  message?: string
}

function pickFirstErrorMessage(value: unknown): string | null {
  if (typeof value === "string") return value
  if (Array.isArray(value)) {
    const first = value[0]
    return typeof first === "string" ? first : null
  }
  return null
}

function getFieldError(data?: ApiErrorShape["response"]["data"]): string | null {
  if (!data) return null

  const fromErrors = data.errors
  if (fromErrors) {
    const nestedFirst = Object.values(fromErrors)[0]
    const nestedMessage = pickFirstErrorMessage(nestedFirst)
    if (nestedMessage) return nestedMessage
  }

  // Support raw DRF field errors shape, e.g. { current_password: ["..."] }.
  for (const [key, value] of Object.entries(data)) {
    if (key === "detail" || key === "code" || key === "errors") continue
    const message = pickFirstErrorMessage(value)
    if (message) return message
  }

  return null
}

export function getUserFriendlyError(
  err: unknown,
  context: ErrorContext = "generic"
): string {
  const error = err as ApiErrorShape
  const status = error.response?.status
  const code = error.response?.data?.code
  const detail = error.response?.data?.detail
  const fieldError = getFieldError(error.response?.data)
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

  if (context === "change-password" && status === 400) {
    return (
      fieldError ||
      "Unable to change password. Please verify your current password and confirm the new password."
    )
  }

  if (context === "logout") {
    return "Unable to log out right now. Please try again."
  }

  if (context === "user-status") {
    return "Unable to update user status right now. Please try again."
  }

  if (context === "scores") {
    if (status === 503) {
      return "Scores are temporarily unavailable. Please try again later."
    }
    if (status === 404) {
      return "Academic records were not found for your account."
    }
  }

  if (code === "unauthorized" || normalized.includes("authentication required")) {
    return "Your session has expired. Please log in again."
  }

  return rawMessage || "Something went wrong. Please try again."
}

