import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { createBenefit, listBenefitCategories } from "@/api/benefits"
import { ImageUploadField } from "@/components/ui/image-upload-field"
import { ThemedCheckbox } from "@/components/ui/themed-checkbox"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"
import type { UserRole } from "@/types/auth"

const ELIGIBLE_ROLE_OPTIONS: UserRole[] = ["STUDENT", "LECTURER", "STAFF", "ALUMNI", "ADMIN"]

export function AdminBenefitCreatePage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [descriptionShort, setDescriptionShort] = useState("")
  const [partner, setPartner] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [categoryId, setCategoryId] = useState<string>("")
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(["STUDENT"])
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["benefit-categories"],
    queryFn: listBenefitCategories,
    staleTime: 60_000,
  })

  const toggleRole = (role: UserRole, checked: boolean) => {
    setSelectedRoles((prev) => {
      if (checked) return prev.includes(role) ? prev : [...prev, role]
      return prev.filter((r) => r !== role)
    })
  }

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.warning("Missing required fields", "Title and description are required.")
      return
    }
    if (selectedRoles.length === 0) {
      toast.warning("Eligible roles", "Select at least one role.")
      return
    }

    try {
      setIsSubmitting(true)
      await createBenefit({
        title: title.trim(),
        description: description.trim(),
        description_short: descriptionShort.trim(),
        partner: partner.trim(),
        imageFile: imageFile ?? undefined,
        category: categoryId ? Number(categoryId) : null,
        eligible_roles: selectedRoles,
        is_active: isActive,
      })
      toast.success("Benefit created")
      navigate("/admin/benefits", { replace: true })
    } catch (error) {
      toast.error("Failed to create benefit", getUserFriendlyError(error, "generic"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Administration</p>
        <h1 className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">Create Student Benefit</h1>
        <p className="mt-1 text-sm text-[#5f5e5e]">Add a perk or partner offer to the benefits directory.</p>
      </div>

      <div className="rounded-sm border border-[#e2e2e2] bg-white p-6 shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
        <div className="grid grid-cols-1 gap-4">
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Category</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={categoriesLoading}
              className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24] disabled:opacity-60"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Partner</span>
            <input
              type="text"
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              placeholder="Partner or sponsor name"
              className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
            />
          </label>

          <ImageUploadField
            label="Cover image"
            file={imageFile}
            enableCrop
            cropAspect={16 / 9}
            onFileChange={setImageFile}
            onValidationError={(message) => toast.warning("Invalid image", message)}
          />

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Short description</span>
            <input
              type="text"
              value={descriptionShort}
              onChange={(e) => setDescriptionShort(e.target.value)}
              maxLength={200}
              placeholder="Shown in cards and listings"
              className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Full description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
            />
          </label>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Eligible roles</span>
            <div className="flex flex-wrap gap-4">
              {ELIGIBLE_ROLE_OPTIONS.map((role) => (
                <ThemedCheckbox
                  key={role}
                  label={role}
                  checked={selectedRoles.includes(role)}
                  onChange={(e) => toggleRole(role, e.target.checked)}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded-sm border border-[#8f6f6c] text-[#af0f24] focus:ring-[#af0f24]"
            />
            <span className="text-sm text-[#1a1c1c]">Active (visible to eligible roles)</span>
          </label>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-sm bg-[#af0f24] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#930019] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating..." : "Create benefit"}
          </button>
          <Link
            to="/admin/benefits"
            className="rounded-sm border border-[#d5d5d5] px-4 py-2 text-sm font-semibold text-[#1a1c1c] transition hover:bg-[#f5f5f5]"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}
