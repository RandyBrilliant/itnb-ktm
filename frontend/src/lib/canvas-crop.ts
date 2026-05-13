import type { Area } from "react-easy-crop"

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (e) => reject(e))
    if (/^https?:\/\//i.test(url)) {
      image.setAttribute("crossOrigin", "anonymous")
    }
    image.src = url
  })
}

/**
 * Renders the cropped region of an image to a canvas and returns a JPEG or PNG blob.
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  options?: { mimeType?: "image/jpeg" | "image/png" | "image/webp"; quality?: number }
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement("canvas")
  const w = Math.max(1, Math.round(pixelCrop.width))
  const h = Math.max(1, Math.round(pixelCrop.height))
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get canvas context")

  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, w, h)

  const mimeType = options?.mimeType ?? "image/jpeg"
  const quality = options?.quality ?? 0.9

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Failed to export cropped image"))
      },
      mimeType,
      mimeType === "image/png" ? undefined : quality
    )
  })
}

export function blobToJpegFile(blob: Blob, basename = "cover"): File {
  const name = basename.replace(/\.[^.]+$/, "") + ".jpg"
  return new File([blob], name, { type: blob.type || "image/jpeg" })
}
