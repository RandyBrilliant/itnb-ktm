import { api } from "@/lib/api"
import type { ApiSuccessResponse } from "@/types/api"
import type { PaginatedResponse } from "@/api/certificates"
import type { WebinarMyRegistration } from "@/api/webinars"
import { unwrapApiData } from "@/lib/api-response"

export type PostCategory = "ANNOUNCEMENT" | "NEWS" | "EVENT" | "ACADEMIC"

export interface PostWebinarSummary {
  id: number
  mode: string
  mode_display?: string
  starts_at: string
  ends_at: string
  location?: string
  online_url?: string
  is_registration_open: boolean
  is_full: boolean
  auto_issue_certificate: boolean
  certificate_program?: { id: number; title: string } | null
  my_registration: WebinarMyRegistration | null
}

export interface PostItem {
  id: number
  title: string
  body: string
  category: PostCategory
  category_display?: string
  image?: string | null
  image_url?: string | null
  is_published: boolean
  published_at?: string
  webinar?: PostWebinarSummary | null
  created_at?: string
  updated_at?: string
  author?: {
    id: number
    email: string
    full_name?: string
    role?: string
  }
}

export interface PostFilters {
  page?: number
  page_size?: number
  search?: string
  category?: PostCategory
  is_published?: boolean
  ordering?: string
}

export interface PostPayload {
  title: string
  body: string
  category: PostCategory
  image_url?: string
  imageFile?: File | null
  is_published?: boolean
}

function buildParams(filters?: PostFilters): string {
  const params = Object.entries(filters || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&")
  return params ? `?${params}` : ""
}

export async function listPosts(filters?: PostFilters): Promise<PaginatedResponse<PostItem>> {
  const query = buildParams(filters)
  const { data } = await api.get<
    ApiSuccessResponse<PaginatedResponse<PostItem>> | PaginatedResponse<PostItem>
  >(`/api/posts/${query}`)
  return unwrapApiData(data, "Failed to fetch posts")
}

export async function getPost(id: number): Promise<PostItem> {
  const { data } = await api.get<ApiSuccessResponse<PostItem> | PostItem>(`/api/posts/${id}/`)
  return unwrapApiData(data, "Failed to fetch post")
}

export async function createPost(payload: PostPayload): Promise<PostItem> {
  const requestBody =
    payload.imageFile
      ? (() => {
          const formData = new FormData()
          formData.append("title", payload.title)
          formData.append("body", payload.body)
          formData.append("category", payload.category)
          if (payload.image_url !== undefined) formData.append("image_url", payload.image_url)
          if (payload.is_published !== undefined) {
            formData.append("is_published", String(payload.is_published))
          }
          formData.append("image", payload.imageFile)
          return formData
        })()
      : {
          title: payload.title,
          body: payload.body,
          category: payload.category,
          image_url: payload.image_url,
          is_published: payload.is_published,
        }
  const { data } = await api.post<ApiSuccessResponse<PostItem> | PostItem>(
    "/api/posts/",
    requestBody
  )
  return unwrapApiData(data, "Failed to create post")
}

export async function updatePost(id: number, payload: PostPayload): Promise<PostItem> {
  const requestBody =
    payload.imageFile
      ? (() => {
          const formData = new FormData()
          formData.append("title", payload.title)
          formData.append("body", payload.body)
          formData.append("category", payload.category)
          if (payload.image_url !== undefined) formData.append("image_url", payload.image_url)
          if (payload.is_published !== undefined) {
            formData.append("is_published", String(payload.is_published))
          }
          formData.append("image", payload.imageFile)
          return formData
        })()
      : {
          title: payload.title,
          body: payload.body,
          category: payload.category,
          image_url: payload.image_url,
          is_published: payload.is_published,
        }
  const { data } = await api.patch<ApiSuccessResponse<PostItem> | PostItem>(
    `/api/posts/${id}/`,
    requestBody
  )
  return unwrapApiData(data, "Failed to update post")
}

export async function deletePost(id: number): Promise<void> {
  await api.delete(`/api/posts/${id}/`)
}
