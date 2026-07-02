import { useEffect, useRef, useState } from "react"
import { ImagePlus, Upload, X } from "lucide-react"
import { ImageSpecGuidelines } from "@/components/content/image-spec-guidelines"
import { COVER_IMAGE_SPEC, type CoverImageSpec } from "@/lib/media-guidelines"
import { ImageCropModal } from "@/components/ui/image-crop-modal"

export interface ImageUploadFieldProps {
  label?: string
  file: File | null
  /** Shown when no new file is selected (e.g. current server image on edit). */
  existingImageUrl?: string
  disabled?: boolean
  onFileChange: (file: File | null) => void
  /** Called when the user clicks Remove (clear upload and optional existing preview). */
  onCoverRemoved?: () => void
  onValidationError?: (message: string) => void
  /** After choosing a file, open crop UI (exports JPEG). Ignored when disabled. */
  enableCrop?: boolean
  /** Crop frame aspect (width ÷ height). Default 16∶9 when cropping. */
  cropAspect?: number
  /** Show pixel/aspect guidelines for admins (defaults to true when enableCrop is on). */
  showCoverGuidelines?: boolean
  /** Guidelines copy shown when showCoverGuidelines is on (defaults to 16∶9 news/benefits spec). */
  imageSpec?: CoverImageSpec
  /** Optional class for the preview image element. */
  previewClassName?: string
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024

export function ImageUploadField({
  label = "Cover Image",
  file,
  existingImageUrl,
  disabled,
  onFileChange,
  onCoverRemoved,
  onValidationError,
  enableCrop = false,
  cropAspect,
  showCoverGuidelines: showCoverGuidelinesProp,
  imageSpec = COVER_IMAGE_SPEC,
  previewClassName = "h-40 w-full rounded-sm border border-[#e2e2e2] object-cover",
}: ImageUploadFieldProps) {
  const showCoverGuidelines = showCoverGuidelinesProp ?? enableCrop
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [objectPreview, setObjectPreview] = useState("")
  const [cropOpen, setCropOpen] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropFilenameHint, setCropFilenameHint] = useState("cover")

  useEffect(() => {
    if (!file) {
      setObjectPreview("")
      return
    }
    const url = URL.createObjectURL(file)
    setObjectPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc)
    }
  }, [cropSrc])

  const previewUrl = objectPreview || existingImageUrl || ""

  const resolvedCropAspect = enableCrop ? (cropAspect ?? 16 / 9) : undefined

  const validateAndSetFile = (nextFile: File | null) => {
    if (!nextFile) {
      onFileChange(null)
      return
    }
    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      onValidationError?.("Unsupported file type. Use PNG, JPG, WEBP, or GIF.")
      return
    }
    if (nextFile.size > MAX_SIZE_BYTES) {
      onValidationError?.("Image must be 5MB or smaller.")
      return
    }

    if (enableCrop && !disabled) {
      if (cropSrc) URL.revokeObjectURL(cropSrc)
      const url = URL.createObjectURL(nextFile)
      setCropSrc(url)
      setCropFilenameHint(nextFile.name.replace(/\.[^.]+$/, "") || "cover")
      setCropOpen(true)
      return
    }

    onFileChange(nextFile)
  }

  const handleCropApply = (croppedFile: File) => {
    onFileChange(croppedFile)
  }

  const handleCropOpenChange = (open: boolean) => {
    setCropOpen(open)
    if (!open) {
      setCropSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }

  const clearImage = () => {
    onFileChange(null)
    onCoverRemoved?.()
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">{label}</span>
      {showCoverGuidelines ? <ImageSpecGuidelines spec={imageSpec} /> : null}

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          if (disabled) return
          validateAndSetFile(event.dataTransfer.files?.[0] || null)
        }}
        className="rounded-sm border border-dashed border-[#d5d5d5] bg-[#fafafa] p-4"
      >
        {previewUrl ? (
          <div className="space-y-3">
            <img src={previewUrl} alt="Selected preview" className={previewClassName} />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="inline-flex items-center gap-2 rounded-sm border border-[#d5d5d5] px-3 py-1.5 text-xs font-semibold text-[#1a1c1c] transition hover:bg-[#f3f3f3] disabled:opacity-60"
              >
                <Upload size={14} />
                Replace
              </button>
              <button
                type="button"
                onClick={clearImage}
                disabled={disabled}
                className="inline-flex items-center gap-2 rounded-sm border border-[#f2b6b6] px-3 py-1.5 text-xs font-semibold text-[#af0f24] transition hover:bg-[#fff2f2] disabled:opacity-60"
              >
                <X size={14} />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <ImagePlus size={26} className="text-[#8f6f6c]" />
            <p className="mt-2 text-sm font-semibold text-[#1a1c1c]">Drag and drop an image, or click upload</p>
            <p className="mt-1 text-xs text-[#5f5e5e]">
              PNG, JPG, WEBP, GIF up to 5MB
              {enableCrop ? " · cropped to cover after upload" : ""}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="mt-3 inline-flex items-center gap-2 rounded-sm bg-[#af0f24] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#930019] disabled:opacity-60"
            >
              <Upload size={14} />
              Upload Image
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => validateAndSetFile(event.target.files?.[0] || null)}
      />

      {enableCrop ? (
        <ImageCropModal
          open={cropOpen}
          onOpenChange={handleCropOpenChange}
          imageSrc={cropSrc}
          aspect={resolvedCropAspect}
          filenameHint={cropFilenameHint}
          onApply={handleCropApply}
        />
      ) : null}
    </div>
  )
}
