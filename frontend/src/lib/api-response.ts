import type { ApiSuccessResponse } from "@/types/api"

type MaybeWrapped<T> = ApiSuccessResponse<T> | T

function isWrappedResponse<T>(value: MaybeWrapped<T>): value is ApiSuccessResponse<T> {
  return typeof value === "object" && value !== null && "data" in value && "code" in value
}

/**
 * Accept both wrapped API responses ({ data: ... }) and plain payloads.
 * Some backend endpoints still return DRF default JSON.
 */
export function unwrapApiData<T>(payload: MaybeWrapped<T>, errorMessage: string): T {
  if (isWrappedResponse(payload)) {
    if (payload.data === undefined || payload.data === null) {
      throw new Error(errorMessage)
    }
    return payload.data
  }

  if (payload === undefined || payload === null) {
    throw new Error(errorMessage)
  }

  return payload as T
}

