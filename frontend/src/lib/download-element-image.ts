import { toPng } from "html-to-image"

import { inlineImagesForCapture, restoreInlinedImages } from "@/lib/inline-capture-images"

export async function downloadElementAsPng(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const restores = await inlineImagesForCapture(element)

  try {
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      onImageErrorHandler: () => undefined,
    })

    const link = document.createElement("a")
    link.download = filename
    link.href = dataUrl
    link.click()
  } finally {
    restoreInlinedImages(restores)
  }
}
