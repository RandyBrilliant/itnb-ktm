import { api } from "@/lib/api"
import type { ApiSuccessResponse } from "@/types/api"
import type { PaginatedResponse } from "@/api/certificates"
import type { PostItem } from "@/api/posts"
import { unwrapApiData } from "@/lib/api-response"

export type WebinarMode = "ONLINE" | "OFFLINE" | "HYBRID"
export type WebinarStatus = "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED"
export type WebinarRegistrationStatus = "REGISTERED" | "WAITLISTED" | "CANCELLED"

export interface WebinarMyRegistration {
  id: number
  status: WebinarRegistrationStatus
  status_display?: string
  registered_at?: string
  checked_in_at?: string | null
  checked_out_at?: string | null
  attended: boolean
  certificate_id?: number | null
}

export interface WebinarItem {
  id: number
  post: PostItem
  mode: WebinarMode
  mode_display?: string
  starts_at: string
  ends_at: string
  location?: string
  online_url?: string
  capacity?: number | null
  registration_opens_at?: string | null
  registration_closes_at?: string | null
  certificate_program?: { id: number; title: string } | null
  auto_issue_certificate: boolean
  status: WebinarStatus
  status_display?: string
  is_registration_open: boolean
  is_full: boolean
  registration_count: number
  attendee_count: number
  my_registration: WebinarMyRegistration | null
  created_at?: string
  updated_at?: string
}

export interface WebinarRegistrationRow {
  id: number
  user: {
    id: number
    email: string
    full_name?: string
    role?: string
    institutional_id?: string | null
  }
  status: WebinarRegistrationStatus
  status_display?: string
  registered_at?: string
  checked_in_at?: string | null
  checked_out_at?: string | null
  check_in_method?: string
  attended: boolean
  certificate?: { id: number; title: string } | null
}

export interface AttendanceToken {
  token: string
  phase: "in" | "out"
  payload: string
  qr_data_url: string
  step_seconds: number
  expires_in: number
}

export interface WebinarFilters {
  page?: number
  page_size?: number
  search?: string
  mode?: WebinarMode
  status?: WebinarStatus
  ordering?: string
}

export interface WebinarPayload {
  title?: string
  body?: string
  image_url?: string
  imageFile?: File | null
  is_published?: boolean
  mode?: WebinarMode
  starts_at?: string
  ends_at?: string
  location?: string
  online_url?: string
  capacity?: number | null
  registration_opens_at?: string | null
  registration_closes_at?: string | null
  certificate_program?: number | null
  auto_issue_certificate?: boolean
}

function buildParams(filters?: WebinarFilters): string {
  const params = Object.entries(filters || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&")
  return params ? `?${params}` : ""
}

function toRequestBody(payload: WebinarPayload): FormData | Record<string, unknown> {
  if (!payload.imageFile) {
    const body: Record<string, unknown> = { ...payload }
    delete body.imageFile
    return body
  }
  const fd = new FormData()
  const append = (key: string, value: unknown) => {
    if (value === undefined || value === null) return
    fd.append(key, String(value))
  }
  append("title", payload.title)
  append("body", payload.body)
  append("image_url", payload.image_url)
  append("is_published", payload.is_published)
  append("mode", payload.mode)
  append("starts_at", payload.starts_at)
  append("ends_at", payload.ends_at)
  append("location", payload.location)
  append("online_url", payload.online_url)
  append("capacity", payload.capacity)
  append("registration_opens_at", payload.registration_opens_at)
  append("registration_closes_at", payload.registration_closes_at)
  append("certificate_program", payload.certificate_program)
  append("auto_issue_certificate", payload.auto_issue_certificate)
  fd.append("image", payload.imageFile)
  return fd
}

export async function listWebinars(filters?: WebinarFilters): Promise<PaginatedResponse<WebinarItem>> {
  const { data } = await api.get<
    ApiSuccessResponse<PaginatedResponse<WebinarItem>> | PaginatedResponse<WebinarItem>
  >(`/api/webinars/${buildParams(filters)}`)
  return unwrapApiData(data, "Failed to fetch webinars")
}

export async function getWebinar(id: number): Promise<WebinarItem> {
  const { data } = await api.get<ApiSuccessResponse<WebinarItem> | WebinarItem>(`/api/webinars/${id}/`)
  return unwrapApiData(data, "Failed to fetch webinar")
}

export async function createWebinar(payload: WebinarPayload): Promise<WebinarItem> {
  const { data } = await api.post<ApiSuccessResponse<WebinarItem> | WebinarItem>(
    "/api/webinars/",
    toRequestBody(payload)
  )
  return unwrapApiData(data, "Failed to create webinar")
}

export async function updateWebinar(id: number, payload: WebinarPayload): Promise<WebinarItem> {
  const { data } = await api.patch<ApiSuccessResponse<WebinarItem> | WebinarItem>(
    `/api/webinars/${id}/`,
    toRequestBody(payload)
  )
  return unwrapApiData(data, "Failed to update webinar")
}

export async function deleteWebinar(id: number): Promise<void> {
  await api.delete(`/api/webinars/${id}/`)
}

export async function registerWebinar(id: number): Promise<WebinarItem> {
  const { data } = await api.post<ApiSuccessResponse<WebinarItem> | WebinarItem>(
    `/api/webinars/${id}/register/`
  )
  return unwrapApiData(data, "Failed to register")
}

export async function cancelWebinarRegistration(id: number): Promise<WebinarItem> {
  const { data } = await api.delete<ApiSuccessResponse<WebinarItem> | WebinarItem>(
    `/api/webinars/${id}/register/`
  )
  return unwrapApiData(data, "Failed to cancel registration")
}

export async function checkInWebinar(id: number, token?: string): Promise<WebinarItem> {
  const { data } = await api.post<ApiSuccessResponse<WebinarItem> | WebinarItem>(
    `/api/webinars/${id}/check-in/`,
    { token: token ?? "" }
  )
  return unwrapApiData(data, "Failed to check in")
}

export async function checkOutWebinar(id: number, token?: string): Promise<WebinarItem> {
  const { data } = await api.post<ApiSuccessResponse<WebinarItem> | WebinarItem>(
    `/api/webinars/${id}/check-out/`,
    { token: token ?? "" }
  )
  return unwrapApiData(data, "Failed to check out")
}

export async function getAttendanceToken(id: number, phase: "in" | "out"): Promise<AttendanceToken> {
  const { data } = await api.get<ApiSuccessResponse<AttendanceToken> | AttendanceToken>(
    `/api/webinars/${id}/attendance-token/?phase=${phase}`
  )
  return unwrapApiData(data, "Failed to load attendance token")
}

export async function listWebinarRegistrations(
  id: number,
  page = 1
): Promise<PaginatedResponse<WebinarRegistrationRow>> {
  const { data } = await api.get<
    ApiSuccessResponse<PaginatedResponse<WebinarRegistrationRow>> | PaginatedResponse<WebinarRegistrationRow>
  >(`/api/webinars/${id}/registrations/?page=${page}`)
  return unwrapApiData(data, "Failed to load participants")
}

export async function downloadWebinarParticipants(id: number, title: string): Promise<void> {
  const response = await api.get(`/api/webinars/${id}/participants/`, { responseType: "blob" })
  const blob =
    response.data instanceof Blob
      ? response.data
      : new Blob([response.data as BlobPart], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  const safeTitle = title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "webinar"
  link.href = url
  link.download = `${safeTitle}-participants.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
