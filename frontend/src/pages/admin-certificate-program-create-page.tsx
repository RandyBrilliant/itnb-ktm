import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createCertificateProgram } from "@/api/certificate-programs"
import { DatePickerField } from "@/components/ui/date-picker-field"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"

export function AdminCertificateProgramCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [issuedDate, setIssuedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [validUntil, setValidUntil] = useState("")
  const [templateImage, setTemplateImage] = useState<File | null>(null)
  const [recipientsFile, setRecipientsFile] = useState<File | null>(null)
  const [layoutJson, setLayoutJson] = useState("")

  const mutation = useMutation({
    mutationFn: () =>
      createCertificateProgram({
        title,
        description,
        issuedDate,
        validUntil: validUntil.trim() ? validUntil : null,
        templateImage: templateImage!,
        recipientsFile: recipientsFile!,
        layoutJson: layoutJson.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Batch created", "Recipients are being processed in the background.")
      queryClient.invalidateQueries({ queryKey: ["admin-certificate-programs"] })
      navigate("/admin/certificates")
    },
    onError: (error) => {
      toast.error("Could not create batch", getUserFriendlyError(error, "generic"))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateImage || !recipientsFile) {
      toast.error("Missing files", "Upload both the certificate template image and the Excel file.")
      return
    }
    if (layoutJson.trim()) {
      try {
        JSON.parse(layoutJson)
      } catch {
        toast.error("Invalid layout JSON", "Fix the optional layout JSON or leave it empty.")
        return
      }
    }
    mutation.mutate()
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Administration</p>
        <h1 className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">New certificate batch</h1>
        <p className="mt-1 max-w-3xl text-sm text-[#5f5e5e]">
          Upload an A4-sized JPG or PNG template and an Excel file with <strong>Name</strong> and <strong>ID</strong>{" "}
          columns. Each row is matched to a portal user by official ID (or email / digital card number when applicable).
          Celery workers overlay the name and ID and attach the PDF to each user&apos;s certificate list.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-sm border border-[#e2e2e2] bg-white p-6 shadow-[32px_0_32px_rgba(175,15,36,0.04)]"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Title</span>
            <input
              required
              className="w-full rounded-sm border border-[#ddd] px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. IT&B Annual Accounting Competition 2025"
            />
          </label>
          <DatePickerField
            label="Issued date"
            value={issuedDate}
            onChange={setIssuedDate}
            required
          />
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Description</span>
          <textarea
            className="min-h-[88px] w-full rounded-sm border border-[#ddd] px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description shown in the portal certificate list."
          />
        </label>

        <DatePickerField
          label="Valid until (optional)"
          value={validUntil}
          onChange={setValidUntil}
          placeholder="No expiry"
          className="md:max-w-xs"
        />

        <div className="grid gap-6 md:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Template image (JPG/PNG)</span>
            <input
              required
              type="file"
              accept="image/jpeg,image/png"
              className="text-sm file:mr-3 file:rounded-sm file:border file:border-[#ddd] file:bg-white file:px-3 file:py-2"
              onChange={(e) => setTemplateImage(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Recipients (.xlsx)</span>
            <input
              required
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="text-sm file:mr-3 file:rounded-sm file:border file:border-[#ddd] file:bg-white file:px-3 file:py-2"
              onChange={(e) => setRecipientsFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">
            Layout overrides (optional JSON)
          </span>
          <textarea
            className="min-h-[100px] w-full rounded-sm border border-[#ddd] px-3 py-2 font-mono text-xs"
            value={layoutJson}
            onChange={(e) => setLayoutJson(e.target.value)}
            placeholder={`{\n  "name_y_ratio": 0.42,\n  "id_y_ratio": 0.48,\n  "name_font_ratio": 0.038,\n  "id_font_ratio": 0.024,\n  "text_color": "#1a1a1a"\n}`}
          />
          <span className="text-xs text-[#8a8a8a]">
            Ratios are relative to image height (0–1). Tune these if text does not align with your artwork.
          </span>
        </label>

        <div className="flex flex-wrap gap-3 border-t border-[#ececec] pt-4">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-sm bg-[#af0f24] px-6 py-3 text-sm font-bold text-white hover:bg-[#930019] disabled:opacity-60"
          >
            {mutation.isPending ? "Uploading…" : "Create batch"}
          </button>
          <Link
            to="/admin/certificates"
            className="rounded-sm border border-[#ddd] px-6 py-3 text-sm font-bold text-[#1a1c1c] hover:bg-[#f5f5f5]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

export default AdminCertificateProgramCreatePage
