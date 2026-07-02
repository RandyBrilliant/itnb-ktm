/**
 * Shared copy for admin uploads and in-app display.
 * Campus news and student benefits use a 16∶9 cover (see ImageUploadField + crop).
 * Webinars use a 4∶5 portrait cover (Instagram-style).
 */

export const COVER_IMAGE_SPEC = {
  aspectRatio: "16∶9",
  orientationHint: "widescreen",
  recommendedPixels: "1920 × 1080 px",
  minimumPixels: "1280 × 720 px",
  formats: "JPG, PNG, WEBP, GIF",
  maxFileSizeMb: 5,
  compositionHint:
    "Keep titles, faces, and logos toward the centre; the crop tool uses a widescreen frame.",
  workflowHint:
    "After upload, use the crop dialog to frame the cover; the portal saves a sharpened JPEG.",
} as const

export const WEBINAR_COVER_IMAGE_SPEC = {
  aspectRatio: "4∶5",
  orientationHint: "portrait (Instagram-style)",
  recommendedPixels: "1080 × 1350 px",
  minimumPixels: "800 × 1000 px",
  formats: "JPG, PNG, WEBP, GIF",
  maxFileSizeMb: 5,
  compositionHint:
    "Keep titles, faces, and logos toward the centre; the crop tool uses a tall portrait frame.",
  workflowHint:
    "After upload, use the crop dialog to frame the cover; the portal saves a sharpened JPEG.",
} as const

export type CoverImageSpec = typeof COVER_IMAGE_SPEC | typeof WEBINAR_COVER_IMAGE_SPEC
