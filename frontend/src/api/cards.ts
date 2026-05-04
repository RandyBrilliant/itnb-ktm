import { api } from "@/lib/api"
import type { ApiSuccessResponse } from "@/types/api"

export interface DigitalCardData {
  id: number
  card_number: string
  card_type: string
  qr_code?: string
  card_image?: string
  valid_until: string
  is_active: boolean
}

export interface CardTemplateData {
  front_url: string
  back_url: string
}

export async function getMyCard(): Promise<DigitalCardData | null> {
  try {
    const { data } = await api.get<ApiSuccessResponse<DigitalCardData>>(
      "/api/cards/my_card/"
    )
    return data.data ?? null
  } catch {
    return null
  }
}

export async function getCardTemplates(): Promise<CardTemplateData | null> {
  try {
    const { data } = await api.get<ApiSuccessResponse<CardTemplateData>>(
      "/api/cards/templates/"
    )
    return data.data ?? null
  } catch {
    return null
  }
}
