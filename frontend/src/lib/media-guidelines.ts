/**
 * Shared copy for admin uploads and in-app display.
 * Campus news and student benefits use a 16∶9 cover (see ImageUploadField + crop).
 */

export const COVER_IMAGE_SPEC = {
  aspectRatio: "16∶9",
  recommendedPixels: "1920 × 1080 px",
  minimumPixels: "1280 × 720 px",
  formats: "JPG, PNG, WEBP, GIF",
  maxFileSizeMb: 5,
  compositionHint:
    "Keep titles, faces, and logos toward the centre; the crop tool uses a widescreen frame.",
  workflowHint:
    "After upload, use the crop dialog to frame the cover; the portal saves a sharpened JPEG.",
} as const
