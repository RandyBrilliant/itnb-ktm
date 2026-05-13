import { COVER_IMAGE_SPEC } from "@/lib/media-guidelines"

/**
 * Admin-facing checklist for cover images (news & benefits).
 */
export function ImageSpecGuidelines() {
  return (
    <div className="rounded-sm border border-[#e8dfd9] bg-[#fff9f9] px-3 py-3 text-xs leading-relaxed text-[#5f5e5e]">
      <p className="font-[var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.14em] text-[#af0f24]">
        Cover image guidelines
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 marker:text-[#af0f24]">
        <li>
          <span className="font-semibold text-[#1a1c1c]">Aspect ratio:</span> {COVER_IMAGE_SPEC.aspectRatio}{" "}
          widescreen
        </li>
        <li>
          <span className="font-semibold text-[#1a1c1c]">Recommended size:</span> {COVER_IMAGE_SPEC.recommendedPixels}{" "}
          (sharp on large screens)
        </li>
        <li>
          <span className="font-semibold text-[#1a1c1c]">Minimum:</span> {COVER_IMAGE_SPEC.minimumPixels}
        </li>
        <li>
          <span className="font-semibold text-[#1a1c1c]">Formats & limit:</span> {COVER_IMAGE_SPEC.formats}, up to{" "}
          {COVER_IMAGE_SPEC.maxFileSizeMb} MB each
        </li>
        <li>{COVER_IMAGE_SPEC.compositionHint}</li>
        <li>{COVER_IMAGE_SPEC.workflowHint}</li>
      </ul>
    </div>
  )
}
