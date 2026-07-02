import { env } from "@/lib/env"

/**
 * Paths served from the Vite public folder (e.g. /img/...) — keep on the frontend origin.
 */
export function resolvePublicAssetUrl(url: string | undefined | null): string {
  if (url == null) return ""
  const trimmed = String(url).trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith("/")) return trimmed
  return `/${trimmed}`
}

/**
 * Turn API-relative media paths into absolute URLs the browser can load.
 * Django/DRF often returns `/media/...` which must not be resolved against the frontend origin.
 */
export function resolveMediaUrl(url: string | undefined | null): string {
  if (url == null) return ""
  const trimmed = String(url).trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("data:image/")) return trimmed

  // Ignore token-like garbage values that can trigger ORB/CORB when used as img src.
  const tokenLike =
    trimmed.length > 120 &&
    /^[A-Za-z0-9\-_]+$/.test(trimmed) &&
    !trimmed.includes(".") &&
    !trimmed.includes("/")
  if (tokenLike) return ""

  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const base = env.VITE_API_URL.replace(/\/$/, "")
  if (trimmed.startsWith("/")) return `${base}${trimmed}`
  if (!trimmed.includes("/")) return ""
  return `${base}/${trimmed}`
}

/** Allow only http(s) links for user-facing href attributes. */
export function sanitizeExternalUrl(url: string | undefined | null): string {
  if (url == null) return ""
  const trimmed = String(url).trim()
  if (!trimmed) return ""
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href
    }
  } catch {
    return ""
  }
  return ""
}
