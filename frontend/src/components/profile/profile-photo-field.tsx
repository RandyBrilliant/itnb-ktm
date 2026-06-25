import { ImageUploadField } from "@/components/ui/image-upload-field"

export interface ProfilePhotoFieldProps {
  file: File | null
  existingImageUrl?: string
  disabled?: boolean
  onFileChange: (file: File | null) => void
  onPhotoRemoved?: () => void
  onValidationError?: (message: string) => void
}

export function ProfilePhotoField({
  file,
  existingImageUrl,
  disabled,
  onFileChange,
  onPhotoRemoved,
  onValidationError,
}: ProfilePhotoFieldProps) {
  return (
    <ImageUploadField
      label="Profile Photo"
      file={file}
      existingImageUrl={existingImageUrl}
      disabled={disabled}
      onFileChange={onFileChange}
      onCoverRemoved={onPhotoRemoved}
      onValidationError={onValidationError}
      enableCrop
      cropAspect={1}
      showCoverGuidelines={false}
      previewClassName="mx-auto h-36 w-36 rounded-full border border-[#e2e2e2] object-cover"
    />
  )
}
