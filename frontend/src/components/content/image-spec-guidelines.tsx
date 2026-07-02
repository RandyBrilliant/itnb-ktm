import { COVER_IMAGE_SPEC, type CoverImageSpec } from "@/lib/media-guidelines"

/**
 * Admin-facing checklist for cover images (news, benefits, webinars).
 */
export function ImageSpecGuidelines({ spec = COVER_IMAGE_SPEC }: { spec?: CoverImageSpec }) {
  return (
    <div className="rounded-sm border border-[#e8dfd9] bg-[#fff9f9] px-3 py-3 text-xs leading-relaxed text-[#5f5e5e]">
      <p className="font-[var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.14em] text-[#af0f24]">
        Cover image guidelines
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 marker:text-[#af0f24]">
        <li>
          <span className="font-semibold text-[#1a1c1c]">Aspect ratio:</span> {spec.aspectRatio}{" "}
          {spec.orientationHint}
        </li>
        <li>
          <span className="font-semibold text-[#1a1c1c]">Recommended size:</span> {spec.recommendedPixels}{" "}
          (sharp on large screens)
        </li>
        <li>
          <span className="font-semibold text-[#1a1c1c]">Minimum:</span> {spec.minimumPixels}
        </li>
        <li>
          <span className="font-semibold text-[#1a1c1c]">Formats & limit:</span> {spec.formats}, up to{" "}
          {spec.maxFileSizeMb} MB each
        </li>
        <li>{spec.compositionHint}</li>
        <li>{spec.workflowHint}</li>
      </ul>
    </div>
  )
}
