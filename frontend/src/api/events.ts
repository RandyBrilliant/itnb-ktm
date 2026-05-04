import { api } from "@/lib/api"
import type { ApiSuccessResponse } from "@/types/api"
import type { PaginatedResponse } from "@/api/certificates"
import { unwrapApiData } from "@/lib/api-response"

export interface EventItem {
  id: number
  event_date: string
  event_location?: string
  post?: {
    title?: string
  }
}

export async function listEvents(): Promise<PaginatedResponse<EventItem>> {
  const { data } = await api.get<
    ApiSuccessResponse<PaginatedResponse<EventItem>> | PaginatedResponse<EventItem>
  >(
    "/api/events/"
  )
  return unwrapApiData(data, "Failed to fetch events")
}
