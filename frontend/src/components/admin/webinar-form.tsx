import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import type { WebinarMode, WebinarPayload } from "@/api/webinars"
import { CertificateLayoutEditor } from "@/components/certificates/certificate-layout-editor"
import { DatePickerField } from "@/components/ui/date-picker-field"
import { DateRangePickerField, type DateRangeValue } from "@/components/ui/date-range-picker-field"
import { ImageUploadField } from "@/components/ui/image-upload-field"
import { TimePickerField } from "@/components/ui/time-picker-field"
import { type CertificateLayout, defaultCertificateLayout, normalizeCertificateLayout } from "@/lib/certificate-layout"
import { toast } from "@/lib/toast"
import {
  combineAppDateAndTime,
  compareApiDates,
  registrationDayEnd,
  registrationDayStart,
} from "@/lib/datetime"

const MODE_OPTIONS: { value: WebinarMode; label: string }[] = [
  { value: "OFFLINE", label: "In-person" },
  { value: "ONLINE", label: "Online" },
  { value: "HYBRID", label: "Hybrid" },
]

export interface WebinarFormValues {
  title: string
  body: string
  mode: WebinarMode
  schedule_date: string
  schedule_time: string
  location: string
  online_url: string
  capacity: string
  registration_range: DateRangeValue
  certificate_valid_until: string
  auto_issue_certificate: boolean
  is_published: boolean
}

const EMPTY: WebinarFormValues = {
  title: "",
  body: "",
  mode: "OFFLINE",
  schedule_date: "",
  schedule_time: "",
  location: "",
  online_url: "",
  capacity: "",
  registration_range: { from: "", to: "" },
  certificate_valid_until: "",
  auto_issue_certificate: true,
  is_published: true,
}

interface WebinarFormProps {
  initial?: Partial<WebinarFormValues>
  existingImageUrl?: string
  existingCertificateTemplateUrl?: string
  initialCertificateLayout?: CertificateLayout | Record<string, unknown> | null
  submitLabel: string
  onSubmit: (payload: WebinarPayload) => Promise<void>
}

const labelClass = "text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]"
const inputClass =
  "w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"

export function WebinarForm({
  initial,
  existingImageUrl,
  existingCertificateTemplateUrl,
  initialCertificateLayout,
  submitLabel,
  onSubmit,
}: WebinarFormProps) {
  const [values, setValues] = useState<WebinarFormValues>({ ...EMPTY, ...initial })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [certificateTemplateFile, setCertificateTemplateFile] = useState<File | null>(null)
  const [certificateLayout, setCertificateLayout] = useState<CertificateLayout>(() =>
    normalizeCertificateLayout(initialCertificateLayout as Record<string, unknown> | null | undefined)
  )
  const [localTemplateUrl, setLocalTemplateUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const certificateTemplatePreviewUrl = localTemplateUrl ?? existingCertificateTemplateUrl ?? null

  useEffect(() => {
    if (!certificateTemplateFile) {
      setLocalTemplateUrl(null)
      return
    }
    const url = URL.createObjectURL(certificateTemplateFile)
    setLocalTemplateUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [certificateTemplateFile])

  useEffect(() => {
    if (initialCertificateLayout) {
      setCertificateLayout(
        normalizeCertificateLayout(initialCertificateLayout as Record<string, unknown>)
      )
    }
  }, [initialCertificateLayout])

  const set = <K extends keyof WebinarFormValues>(key: K, value: WebinarFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    if (!values.title.trim()) {
      toast.warning("Missing title", "Please give the webinar a title.")
      return
    }
    if (!values.schedule_date || !values.schedule_time) {
      toast.warning("Missing schedule", "Webinar date and start time are required.")
      return
    }

    const { from, to } = values.registration_range
    if ((from && !to) || (!from && to)) {
      toast.warning("Incomplete registration period", "Select both the start and end registration dates.")
      return
    }
    if (from && to && compareApiDates(to, from) < 0) {
      toast.warning("Invalid registration period", "Registration end date must be on or after the start date.")
      return
    }

    const startsAt = combineAppDateAndTime(values.schedule_date, values.schedule_time)
    if (!startsAt) {
      toast.warning("Invalid schedule", "Could not build the webinar start time.")
      return
    }

    const regOpens = registrationDayStart(from)
    const regCloses = registrationDayEnd(to)
    if (regOpens && new Date(regOpens) >= new Date(startsAt)) {
      toast.warning(
        "Invalid registration period",
        "Registration open date must be before the webinar start date and time."
      )
      return
    }
    if (regCloses && new Date(regCloses) >= new Date(startsAt)) {
      toast.warning(
        "Invalid registration period",
        "Registration must close before the webinar starts. Choose an earlier end date."
      )
      return
    }

    if (
      values.auto_issue_certificate &&
      !certificateTemplateFile &&
      !existingCertificateTemplateUrl
    ) {
      toast.warning(
        "Certificate template required",
        "Upload an A4 certificate design, or disable auto-issue."
      )
      return
    }

    const hasCertificateTemplate = !!(certificateTemplateFile || existingCertificateTemplateUrl)

    const payload: WebinarPayload = {
      title: values.title.trim(),
      body: values.body.trim(),
      mode: values.mode,
      starts_at: startsAt,
      location: values.location.trim(),
      online_url: values.online_url.trim(),
      capacity: values.capacity ? Number(values.capacity) : null,
      registration_opens_at: regOpens,
      registration_closes_at: regCloses,
      certificateTemplateFile,
      certificate_valid_until: values.certificate_valid_until.trim() || null,
      auto_issue_certificate: values.auto_issue_certificate,
      is_published: values.is_published,
      imageFile,
    }

    if (values.auto_issue_certificate && hasCertificateTemplate) {
      payload.certificate_layout = certificateLayout
    }

    try {
      setIsSubmitting(true)
      await onSubmit(payload)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-sm border border-[#e2e2e2] bg-white p-6 shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
      <div className="grid grid-cols-1 gap-4">
        <label className="space-y-1">
          <span className={labelClass}>Title</span>
          <input
            type="text"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            className={inputClass}
          />
        </label>

        <ImageUploadField
          label="Cover Image"
          file={imageFile}
          existingImageUrl={existingImageUrl}
          enableCrop
          cropAspect={16 / 9}
          onFileChange={setImageFile}
          onValidationError={(message) => toast.warning("Invalid image", message)}
        />

        <label className="space-y-1">
          <span className={labelClass}>Description</span>
          <textarea
            value={values.body}
            onChange={(e) => set("body", e.target.value)}
            rows={6}
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="space-y-1">
            <span className={labelClass}>Mode</span>
            <select
              value={values.mode}
              onChange={(e) => set("mode", e.target.value as WebinarMode)}
              className={inputClass}
            >
              {MODE_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <DatePickerField
            label="Date"
            value={values.schedule_date}
            onChange={(date) => set("schedule_date", date)}
            required
          />
          <TimePickerField
            label="Start time"
            value={values.schedule_time}
            onChange={(time) => set("schedule_time", time)}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className={labelClass}>Location (in-person)</span>
            <input
              type="text"
              value={values.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Auditorium A"
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>Online meeting URL</span>
            <input
              type="url"
              value={values.online_url}
              onChange={(e) => set("online_url", e.target.value)}
              placeholder="https://meet.example.com/..."
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className={labelClass}>Capacity (optional)</span>
            <input
              type="number"
              min={1}
              value={values.capacity}
              onChange={(e) => set("capacity", e.target.value)}
              className={inputClass}
            />
          </label>
          <DateRangePickerField
            label="Registration period (optional)"
            value={values.registration_range}
            onChange={(range) => set("registration_range", range)}
            hint="Opens at 00:00 and closes at 23:59 WIB on the selected dates."
          />
        </div>

        <div className="rounded-sm border border-[#ececec] bg-[#fafafa] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#af0f24]">Certificate</p>
          <p className="mt-1 text-sm text-[#5f5e5e]">
            Upload the A4 certificate artwork and place the student name and ID. Attendees who check in
            can view their certificate in the portal — PDF download is optional.
          </p>

          <div className="mt-4 space-y-4">
            <ImageUploadField
              label="Certificate template (JPG/PNG, A4)"
              file={certificateTemplateFile}
              existingImageUrl={existingCertificateTemplateUrl}
              onFileChange={(file) => {
                setCertificateTemplateFile(file)
                if (file && !existingCertificateTemplateUrl && !initialCertificateLayout) {
                  setCertificateLayout(defaultCertificateLayout())
                }
              }}
              onValidationError={(message) => toast.warning("Invalid image", message)}
              previewClassName="mx-auto h-56 w-auto max-w-full rounded-sm border border-[#e2e2e2] object-contain"
            />

            <CertificateLayoutEditor
              templateUrl={certificateTemplatePreviewUrl}
              value={certificateLayout}
              onChange={setCertificateLayout}
            />

            <DatePickerField
              label="Certificate valid until (optional)"
              value={values.certificate_valid_until}
              onChange={(date) => set("certificate_valid_until", date)}
              placeholder="No expiry"
              className="max-w-xs"
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={values.auto_issue_certificate}
                onChange={(e) => set("auto_issue_certificate", e.target.checked)}
                className="h-4 w-4 rounded-sm border border-[#8f6f6c] text-[#af0f24] focus:ring-[#af0f24]"
              />
              <span className="text-sm text-[#1a1c1c]">
                Auto-issue certificate when an attendee checks in
              </span>
            </label>
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={values.is_published}
            onChange={(e) => set("is_published", e.target.checked)}
            className="h-4 w-4 rounded-sm border border-[#8f6f6c] text-[#af0f24] focus:ring-[#af0f24]"
          />
          <span className="text-sm text-[#1a1c1c]">Publish (show in announcements &amp; open registration)</span>
        </label>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-sm bg-[#af0f24] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#930019] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
        <Link
          to="/admin/webinars"
          className="rounded-sm border border-[#d5d5d5] px-4 py-2 text-sm font-semibold text-[#1a1c1c] transition hover:bg-[#f5f5f5]"
        >
          Cancel
        </Link>
      </div>
    </div>
  )
}
