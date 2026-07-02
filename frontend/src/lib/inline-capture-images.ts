import { api } from "@/lib/api"
import { env } from "@/lib/env"

type ImageRestore = {
  img: HTMLImageElement
  src: string
  srcset: string | null
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Failed to read image data"))
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

async function fetchImageBlob(src: string): Promise<Blob> {
  const apiBase = env.VITE_API_URL.replace(/\/$/, "")

  if (src.startsWith(apiBase)) {
    const path = src.slice(apiBase.length) || "/"
    const { data } = await api.get<Blob>(path, { responseType: "blob" })
    return data
  }

  if (src.startsWith("/") && !src.startsWith("//")) {
    const response = await fetch(`${window.location.origin}${src}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch image (${response.status})`)
    }
    return response.blob()
  }

  if (src.startsWith(window.location.origin)) {
    const response = await fetch(src)
    if (!response.ok) {
      throw new Error(`Failed to fetch image (${response.status})`)
    }
    return response.blob()
  }

  const response = await fetch(src, { mode: "cors" })
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status})`)
  }
  return response.blob()
}

async function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return

  await new Promise<void>((resolve, reject) => {
    const onLoad = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error("Image failed to decode"))
    }
    const cleanup = () => {
      img.removeEventListener("load", onLoad)
      img.removeEventListener("error", onError)
    }
    img.addEventListener("load", onLoad)
    img.addEventListener("error", onError)
  })
}

/**
 * Convert <img> sources inside a capture root to data URLs so html-to-image
 * can export cross-origin media (API photos, QR codes, templates) reliably.
 */
export async function inlineImagesForCapture(root: HTMLElement): Promise<ImageRestore[]> {
  const images = Array.from(root.querySelectorAll("img"))
  const restores: ImageRestore[] = []

  await Promise.all(
    images.map(async (img) => {
      const src = img.currentSrc || img.src
      if (!src || src.startsWith("data:")) return

      restores.push({
        img,
        src,
        srcset: img.getAttribute("srcset"),
      })

      try {
        const blob = await fetchImageBlob(src)
        const dataUrl = await blobToDataUrl(blob)
        img.removeAttribute("srcset")
        img.src = dataUrl
        await waitForImage(img)
      } catch (error) {
        console.warn("Could not inline image for capture:", src, error)
      }
    })
  )

  return restores
}

export function restoreInlinedImages(restores: ImageRestore[]): void {
  for (const { img, src, srcset } of restores) {
    img.src = src
    if (srcset) img.setAttribute("srcset", srcset)
    else img.removeAttribute("srcset")
  }
}
