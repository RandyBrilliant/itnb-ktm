import { api } from "@/lib/api"
import type { ApiSuccessResponse } from "@/types/api"
import type { PaginatedResponse } from "@/api/certificates"
import { unwrapApiData } from "@/lib/api-response"

export interface PostItem {
  id: number
  title: string
  body: string
  category: string
  category_display?: string
  image?: string | null
  image_url?: string | null
  published_at?: string
}

export async function listPosts(page = 1): Promise<PaginatedResponse<PostItem>> {
  const { data } = await api.get<
    ApiSuccessResponse<PaginatedResponse<PostItem>> | PaginatedResponse<PostItem>
  >(
    `/api/posts/?page=${page}`
  )
  return unwrapApiData(data, "Failed to fetch posts")
}

export async function getPost(id: number): Promise<PostItem> {
  const { data } = await api.get<ApiSuccessResponse<PostItem> | PostItem>(`/api/posts/${id}/`)
  return unwrapApiData(data, "Failed to fetch post")
}
