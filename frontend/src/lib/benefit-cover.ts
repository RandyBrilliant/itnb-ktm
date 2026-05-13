import type { Benefit } from "@/api/benefits"
import { resolveMediaUrl } from "@/lib/media-url"

/** Prefer uploaded cover image, then external / relative URL. */
export function benefitCoverUrl(benefit: Benefit): string {
  return resolveMediaUrl(benefit.image) || resolveMediaUrl(benefit.image_url) || ""
}
