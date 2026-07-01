import { api } from "@/lib/api"
import type { ApiSuccessResponse } from "@/types/api"
import { unwrapApiData } from "@/lib/api-response"

import type { CertificateLayout } from "@/lib/certificate-layout"

export interface CertificateUserSummary {
  id: number
  email: string
  full_name?: string
  role?: string
  institutional_id?: string | null
}

export interface CertificateItem {
  id: number
  title: string
  description?: string
  image_url?: string | null
  status: string
  status_display?: string
  issued_date: string
  valid_until?: string | null
  pdf_file?: string | null
  recipient_name?: string
  recipient_id_display?: string
  program?: {
    id: number
    title: string
    template_image?: string | null
    layout?: CertificateLayout | Record<string, unknown>
  } | null
  user?: CertificateUserSummary
  is_suspended?: boolean
}

export interface PaginatedResponse<T> {
  count: number
  next?: string
  previous?: string
  results: T[]
}

export async function listCertificates(
  page = 1,
  options?: { programId?: number }
): Promise<PaginatedResponse<CertificateItem>> {
  const params = new URLSearchParams()
  params.set("page", String(page))
  if (options?.programId != null) {
    params.set("program", String(options.programId))
  }
  const { data } = await api.get<
    ApiSuccessResponse<PaginatedResponse<CertificateItem>> | PaginatedResponse<CertificateItem>
  >(`/api/certificates/?${params.toString()}`)
  return unwrapApiData(data, "Failed to fetch certificates")
}

export async function getCertificate(id: number): Promise<CertificateItem> {
  const { data } = await api.get<ApiSuccessResponse<CertificateItem> | CertificateItem>(
    `/api/certificates/${id}/`
  )
  return unwrapApiData(data, "Failed to fetch certificate")
}

/**
 * Opens the certificate PDF in a new browser tab.
 * The backend renders PDF on demand (no stored file for program-based certificates).
 */
export async function openCertificatePdfInNewTab(id: number): Promise<void> {
  const response = await api.get(`/api/certificates/${id}/pdf/`, { responseType: "blob" })
  const blob =
    response.data instanceof Blob
      ? response.data
      : new Blob([response.data as BlobPart], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, "_blank", "noopener,noreferrer")
  if (!win) {
    URL.revokeObjectURL(url)
    throw new Error("Popup blocked")
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000)
}

/** @deprecated Prefer openCertificatePdfInNewTab — legacy rows may still return a media URL. */
export async function getCertificateDownloadUrl(id: number): Promise<string | null> {
  const { data } = await api.get<
    ApiSuccessResponse<{ download_url?: string }> | { download_url?: string }
  >(`/api/certificates/${id}/download/`)
  const payload = unwrapApiData(data, "Failed to fetch certificate download URL") as {
    download_url?: string | null
  }
  return payload.download_url ?? null
}

export async function suspendCertificate(id: number): Promise<CertificateItem> {
  const { data } = await api.post<ApiSuccessResponse<CertificateItem> | CertificateItem>(
    `/api/certificates/${id}/suspend/`
  )
  return unwrapApiData(data, "Failed to suspend certificate")
}

export async function unsuspendCertificate(id: number): Promise<CertificateItem> {
  const { data } = await api.post<ApiSuccessResponse<CertificateItem> | CertificateItem>(
    `/api/certificates/${id}/unsuspend/`
  )
  return unwrapApiData(data, "Failed to restore certificate")
}
