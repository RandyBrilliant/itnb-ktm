import { useCallback, useEffect, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import Cropper, { type Area } from "react-easy-crop"
import { blobToJpegFile, getCroppedImageBlob } from "@/lib/canvas-crop"

export interface ImageCropModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Object URL or remote URL of the image to crop */
  imageSrc: string | null
  /** Width ÷ height (e.g. 16/9). Omit for free-form crop. */
  aspect?: number
  /** Called with the cropped JPEG file when the user confirms */
  onApply: (file: File) => void | Promise<void>
  /** Base filename hint (extension replaced with .jpg) */
  filenameHint?: string
}

export function ImageCropModal({
  open,
  onOpenChange,
  imageSrc,
  aspect,
  onApply,
  filenameHint = "cover",
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (!open) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    }
  }, [open])

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    try {
      setApplying(true)
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, {
        mimeType: "image/jpeg",
        quality: 0.9,
      })
      const file = blobToJpegFile(blob, filenameHint)
      await onApply(file)
      onOpenChange(false)
    } finally {
      setApplying(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/60" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[101] w-[min(96vw,560px)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-[#e2e2e2] bg-white p-0 shadow-xl outline-none"
          onPointerDownOutside={(e) => {
            if (applying) e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            if (applying) e.preventDefault()
          }}
        >
          <div className="border-b border-[#ececec] px-5 py-4">
            <Dialog.Title className="font-[var(--font-heading)] text-lg font-bold text-[#1a1c1c]">
              Crop image
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-[#5f5e5e]">
              Drag to reposition, use the slider to zoom, then apply.
            </Dialog.Description>
          </div>

          {imageSrc ? (
            <div className="relative h-[min(50vh,280px)] w-full bg-[#1a1a1a]">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                {...(aspect !== undefined ? { aspect } : {})}
                cropShape="rect"
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
          ) : null}

          <div className="space-y-2 px-5 py-3">
            <label className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">
              Zoom
              <span className="tabular-nums text-[#1a1c1c]">{zoom.toFixed(2)}×</span>
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={!imageSrc || applying}
              className="w-full accent-[#af0f24]"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-[#ececec] px-5 py-4">
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={applying}
                className="rounded-sm border border-[#d5d5d5] px-4 py-2 text-sm font-semibold text-[#1a1c1c] transition hover:bg-[#f5f5f5] disabled:opacity-60"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleApply}
              disabled={!imageSrc || !croppedAreaPixels || applying}
              className="rounded-sm bg-[#af0f24] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#930019] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {applying ? "Applying…" : "Apply crop"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
