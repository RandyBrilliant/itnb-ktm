import { env } from "@/lib/env"

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
