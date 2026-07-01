import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { listCertificatePrograms } from "@/api/certificate-programs"
import type { WebinarMode, WebinarPayload } from "@/api/webinars"
import { ImageUploadField } from "@/components/ui/image-upload-field"
import { toast } from "@/lib/toast"

const MODE_OPTIONS: { value: WebinarMode; label: string }[] = [
  { value: "OFFLINE", label: "In-person" },
  { value: "ONLINE", label: "Online" },
  { value: "HYBRID", label: "Hybrid" },
]

export interface WebinarFormValues {
  title: string
  body: string
  mode: WebinarMode
  starts_at: string
  ends_at: string
  location: string
  online_url: string
  capacity: string
  registration_opens_at: string
  registration_closes_at: string
  certificate_program: number | null
  auto_issue_certificate: boolean
  is_published: boolean
}

const EMPTY: WebinarFormValues = {
  title: "",
  body: "",
  mode: "OFFLINE",
  starts_at: "",
  ends_at: "",
  location: "",
  online_url: "",
  capacity: "",
  registration_opens_at: "",
  registration_closes_at: "",
  certificate_program: null,
  auto_issue_certificate: true,
  is_published: true,
}

interface WebinarFormProps {
  initial?: Partial<WebinarFormValues>
  existingImageUrl?: string
  submitLabel: string
  onSubmit: (payload: WebinarPayload) => Promise<void>
}

const labelClass = "text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]"
const inputClass =
  "w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"

export function WebinarForm({ initial, existingImageUrl, submitLabel, onSubmit }: WebinarFormProps) {
  const [values, setValues] = useState<WebinarFormValues>({ ...EMPTY, ...initial })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: programsData } = useQuery({
    queryKey: ["certificate-programs", "webinar-form"],
    queryFn: () => listCertificatePrograms(1),
  })
  const programs = programsData?.results ?? []

  const set = <K extends keyof WebinarFormValues>(key: K, value: WebinarFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    if (!values.title.trim()) {
      toast.warning("Missing title", "Please give the webinar a title.")
      return
    }
    if (!values.starts_at || !values.ends_at) {
      toast.warning("Missing schedule", "Start and end date/time are required.")
      return
    }
    if (new Date(values.ends_at) < new Date(values.starts_at)) {
      toast.warning("Invalid schedule", "End time must be after the start time.")
      return
    }

    const payload: WebinarPayload = {
      title: values.title.trim(),
      body: values.body.trim(),
      mode: values.mode,
      starts_at: values.starts_at,
      ends_at: values.ends_at,
      location: values.location.trim(),
      online_url: values.online_url.trim(),
      capacity: values.capacity ? Number(values.capacity) : null,
      registration_opens_at: values.registration_opens_at || null,
      registration_closes_at: values.registration_closes_at || null,
      certificate_program: values.certificate_program,
      auto_issue_certificate: values.auto_issue_certificate,
      is_published: values.is_published,
      imageFile,
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
          <label className="space-y-1">
            <span className={labelClass}>Starts at</span>
            <input
              type="datetime-local"
              value={values.starts_at}
              onChange={(e) => set("starts_at", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>Ends at</span>
            <input
              type="datetime-local"
              value={values.ends_at}
              onChange={(e) => set("ends_at", e.target.value)}
              className={inputClass}
            />
          </label>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <label className="space-y-1">
            <span className={labelClass}>Registration opens</span>
            <input
              type="datetime-local"
              value={values.registration_opens_at}
              onChange={(e) => set("registration_opens_at", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>Registration closes</span>
            <input
              type="datetime-local"
              value={values.registration_closes_at}
              onChange={(e) => set("registration_closes_at", e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="space-y-1">
          <span className={labelClass}>Certificate template (auto-issued on check-in)</span>
          <select
            value={values.certificate_program ?? ""}
            onChange={(e) => set("certificate_program", e.target.value ? Number(e.target.value) : null)}
            className={inputClass}
          >
            <option value="">No certificate</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.title}
              </option>
            ))}
          </select>
          <span className="text-xs text-[#8a8989]">
            Create templates under Certificates first. Leave empty for a webinar with no certificate.
          </span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={values.auto_issue_certificate}
            onChange={(e) => set("auto_issue_certificate", e.target.checked)}
            className="h-4 w-4 rounded-sm border border-[#8f6f6c] text-[#af0f24] focus:ring-[#af0f24]"
          />
          <span className="text-sm text-[#1a1c1c]">Auto-issue certificate when an attendee checks in</span>
        </label>

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

export function toDatetimeLocal(value?: string | null): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}
