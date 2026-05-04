import { api } from "@/lib/api"
import type { ApiSuccessResponse } from "@/types/api"
import { unwrapApiData } from "@/lib/api-response"

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
}

export interface PaginatedResponse<T> {
  count: number
  next?: string
  previous?: string
  results: T[]
}

export async function listCertificates(page = 1): Promise<PaginatedResponse<CertificateItem>> {
  const { data } = await api.get<
    ApiSuccessResponse<PaginatedResponse<CertificateItem>> | PaginatedResponse<CertificateItem>
  >(
    `/api/certificates/?page=${page}`
  )
  return unwrapApiData(data, "Failed to fetch certificates")
}

export async function getCertificate(id: number): Promise<CertificateItem> {
  const { data } = await api.get<ApiSuccessResponse<CertificateItem> | CertificateItem>(
    `/api/certificates/${id}/`
  )
  return unwrapApiData(data, "Failed to fetch certificate")
}

export async function getCertificateDownloadUrl(id: number): Promise<string | null> {
  const { data } = await api.get<
    ApiSuccessResponse<{ download_url?: string }> | { download_url?: string }
  >(
    `/api/certificates/${id}/download/`
  )
  return unwrapApiData(data, "Failed to fetch certificate download URL").download_url ?? null
}
