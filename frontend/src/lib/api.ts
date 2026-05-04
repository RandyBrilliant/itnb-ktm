import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import { env } from "@/lib/env"

/**
 * Axios instance for API requests.
 * Includes automatic token refresh interceptor.
 */
export const api = axios.create({
  baseURL: env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// ---------------------------------------------------------------------------
// Automatic token refresh interceptor
// ---------------------------------------------------------------------------
let isRefreshing = false
let failedQueue: {
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}[] = []

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve()
    }
  })
  failedQueue = []
  isRefreshing = false
}

// Response interceptor for handling 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }
    const requestUrl = originalRequest?.url || ""
    const isAuthEndpoint =
      requestUrl.includes("/api/auth/token/") ||
      requestUrl.includes("/api/token/") ||
      requestUrl.includes("/api/auth/token/refresh/") ||
      requestUrl.includes("/api/token/refresh/")

    // Do not refresh when the failing request is itself a login/refresh call.
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => api(originalRequest))
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem("refresh_token")
        if (!refreshToken) {
          throw new Error("No refresh token")
        }

        const { data } = await axios.post<
          { access: string } | { data?: { access?: string } }
        >(`${env.VITE_API_URL}/api/auth/token/refresh/`, {
          refresh: refreshToken,
        })
        const newAccessToken =
          "data" in data
            ? data.data?.access
            : "access" in data
              ? data.access
              : undefined
        if (!newAccessToken) {
          throw new Error("Invalid refresh response")
        }
        localStorage.setItem("access_token", newAccessToken)

        processQueue(null)
        return api(originalRequest)
      } catch (err) {
        processQueue(err as AxiosError)
        // Token refresh failed - clear auth and redirect to login
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        window.location.href = "/login"
        return Promise.reject(err)
      }
    }

    return Promise.reject(error)
  }
)

// Request interceptor to add token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
