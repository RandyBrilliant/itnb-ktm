import { useEffect, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getUser, updateUser } from "@/api/users"
import { ProfilePhotoField } from "@/components/profile/profile-photo-field"
import { UserAccountMetadata } from "@/components/profile/user-account-metadata"
import { ThemedCheckbox } from "@/components/ui/themed-checkbox"
import { resolveMediaUrl } from "@/lib/media-url"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"
import {
  DIRECTORY_ROLE_LABELS,
  directoryRoleToSegment,
  directorySegmentToRole,
} from "@/lib/admin-role-users"
import { userKeys } from "@/hooks/use-users-query"

export function AdminRoleUsersEditPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { roleSegment, id } = useParams<{ roleSegment: string; id: string }>()
  const role = directorySegmentToRole(roleSegment)
  const userId = Number(id)

  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [department, setDepartment] = useState("")
  const [institutionalId, setInstitutionalId] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [contactPhone, setContactPhone] = useState("")
  const [address, setAddress] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!role || !Number.isFinite(userId)) {
    return <Navigate to="/admin/dashboard" replace />
  }

  const labels = DIRECTORY_ROLE_LABELS[role]
  const pathSegment = directoryRoleToSegment(role)
  const showDepartment = role === "STAFF" || role === "LECTURER"

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["admin-user-edit", userId],
    queryFn: () => getUser(userId),
    enabled: Number.isFinite(userId),
  })

  useEffect(() => {
    if (!user) return
    if (user.role !== role) {
      toast.warning("Wrong directory", "This record belongs to a different list.")
      if (user.role === "ADMIN" || user.role === "STAFF" || user.role === "LECTURER") {
        navigate(`/admin/users/${directoryRoleToSegment(user.role)}/${user.id}/edit`, { replace: true })
      } else {
        navigate("/admin/users", { replace: true })
      }
      return
    }
    setEmail(user.email)
    setFullName(user.full_name ?? "")
    setDepartment(user.department ?? "")
    setInstitutionalId(user.institutional_id ?? "")
    setIsActive(user.is_active)
    if (user.role === "LECTURER") {
      setContactPhone(user.lecturer_profile?.contact_phone ?? "")
      setAddress(user.lecturer_profile?.address ?? "")
    }
    setPhotoFile(null)
    setPhotoRemoved(false)
  }, [user, role, navigate])

  useEffect(() => {
    if (photoFile) setPhotoRemoved(false)
  }, [photoFile])

  const handleSubmit = async () => {
    if (!user) return
    if (!email.trim() || !fullName.trim()) {
      toast.warning("Missing fields", "Email and full name are required.")
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        email: email.trim(),
        full_name: fullName.trim(),
        ...(role === "ADMIN"
          ? { department: "" }
          : showDepartment
            ? { department: department.trim() || undefined }
            : {}),
        institutional_id: institutionalId.trim() || null,
        is_active: isActive,
        ...(role === "LECTURER"
          ? {
              contact_phone: contactPhone.trim(),
              address: address.trim(),
            }
          : {}),
        photoFile: photoFile ?? undefined,
        photoRemoved: photoRemoved || undefined,
      }
      await updateUser(user.id, payload)
      await queryClient.invalidateQueries({ queryKey: userKeys.all })
      await queryClient.invalidateQueries({ queryKey: ["admin-user-edit", userId] })
      toast.success("Record updated")
      navigate(`/admin/users/${pathSegment}`, { replace: true })
    } catch (error) {
      toast.error("Could not save record", getUserFriendlyError(error, "generic"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-[#5f5e5e]">Loading…</div>
  }

  if (isError || !user) {
    return (
      <div className="space-y-4">
        <p className="text-[#5f5e5e]">Could not load this record.</p>
        <Link to={`/admin/users/${pathSegment}`} className="text-sm font-semibold text-[#af0f24]">
          Back to list
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Administration</p>
        <h1 className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">{labels.editTitle}</h1>
        <p className="mt-1 text-sm text-[#5f5e5e]">
          {user.email}
          {role !== "ADMIN" ? (
            <>
              {" "}
              · <span className="font-semibold text-[#1a1c1c]">{user.role}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-sm border border-[#e2e2e2] bg-white p-6 shadow-[32px_0_32px_rgba(175,15,36,0.04)] lg:col-span-3">
        <div className="grid max-w-xl grid-cols-1 gap-4">
          <ProfilePhotoField
            file={photoFile}
            existingImageUrl={user.photo && !photoRemoved ? resolveMediaUrl(user.photo) : ""}
            disabled={isSubmitting}
            onFileChange={setPhotoFile}
            onPhotoRemoved={() => setPhotoRemoved(true)}
            onValidationError={(message) => toast.warning("Profile photo", message)}
          />

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Full name</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
            />
          </label>

          {showDepartment ? (
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Department</span>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
              />
            </label>
          ) : null}

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">
              Institutional ID (NIP/NIM)
            </span>
            <input
              type="text"
              value={institutionalId}
              onChange={(e) => setInstitutionalId(e.target.value)}
              className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
            />
          </label>

          <ThemedCheckbox
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            label="Active account"
          />

          {role === "LECTURER" ? (
            <>
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Contact phone</span>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Address</span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
                />
              </label>
            </>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="bg-[#af0f24] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#930019] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Saving…" : "Save changes"}
            </button>
            <Link
              to={`/admin/users/${pathSegment}`}
              className="border border-[#d5d5d5] px-6 py-3 text-sm font-semibold text-[#1a1c1c] transition hover:bg-[#ececec]"
            >
              Cancel
            </Link>
          </div>
        </div>
        </div>

        <div className="lg:col-span-1">
          <UserAccountMetadata user={user} title="Record Details" />
        </div>
      </div>
    </div>
  )
}
