import { api } from "@/lib/api"
import type { ApiSuccessResponse } from "@/types/api"
import { unwrapApiData } from "@/lib/api-response"
import type { CertificateItem } from "@/api/certificates"

export type CertificateProgramBatchStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"

export interface CertificateProgramSummary {
  matched?: number
  skipped_no_user?: number
  total_rows?: number
  sheet_errors?: string[]
  generation_errors?: string[]
  fatal?: string
}

export interface CertificateProgramItem {
  id: number
  title: string
  description: string
  template_image: string | null
  layout: Record<string, unknown>
  issued_date: string
  valid_until: string | null
  issued_by: { id: number; email: string; full_name: string } | null
  recipients_file: string | null
  batch_status: CertificateProgramBatchStatus
  batch_status_display?: string
  batch_summary: CertificateProgramSummary
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  count: number
  next?: string
  previous?: string
  results: T[]
}

export async function getCertificateProgram(id: number): Promise<CertificateProgramItem> {
  const { data } = await api.get<ApiSuccessResponse<CertificateProgramItem> | CertificateProgramItem>(
    `/api/certificate-programs/${id}/`
  )
  return unwrapApiData(data, "Failed to load certificate program")
}

export async function listCertificatePrograms(page = 1): Promise<PaginatedResponse<CertificateProgramItem>> {
  const { data } = await api.get<
    ApiSuccessResponse<PaginatedResponse<CertificateProgramItem>> | PaginatedResponse<CertificateProgramItem>
  >(`/api/certificate-programs/?page=${page}`)
  return unwrapApiData(data, "Failed to load certificate programs")
}

export interface CreateCertificateProgramInput {
  title: string
  description: string
  issuedDate: string
  validUntil: string | null
  templateImage: File
  recipientsFile: File
  /** Optional JSON string of layout overrides (name_y_ratio, id_y_ratio, font ratios, text_color). */
  layoutJson?: string
}

export async function createCertificateProgram(input: CreateCertificateProgramInput): Promise<CertificateProgramItem> {
  const fd = new FormData()
  fd.append("title", input.title)
  fd.append("description", input.description)
  fd.append("issued_date", input.issuedDate)
  if (input.validUntil) {
    fd.append("valid_until", input.validUntil)
  }
  fd.append("template_image", input.templateImage)
  fd.append("recipients_file", input.recipientsFile)
  if (input.layoutJson?.trim()) {
    fd.append("layout", input.layoutJson.trim())
  }
  const { data } = await api.post<ApiSuccessResponse<CertificateProgramItem> | CertificateProgramItem>(
    "/api/certificate-programs/",
    fd
  )
  return unwrapApiData(data, "Failed to create certificate batch")
}

export async function retryCertificateProgram(id: number): Promise<CertificateProgramItem> {
  const { data } = await api.post<ApiSuccessResponse<CertificateProgramItem> | CertificateProgramItem>(
    `/api/certificate-programs/${id}/retry/`
  )
  return unwrapApiData(data, "Failed to retry certificate batch")
}

export async function deleteCertificateProgram(id: number): Promise<void> {
  await api.delete(`/api/certificate-programs/${id}/`)
}

export async function addCertificateProgramRecipient(
  programId: number,
  payload: { display_name: string; id_raw: string }
): Promise<CertificateItem> {
  const { data } = await api.post<ApiSuccessResponse<CertificateItem> | CertificateItem>(
    `/api/certificate-programs/${programId}/add_recipient/`,
    payload
  )
  return unwrapApiData(data, "Failed to add recipient")
}
