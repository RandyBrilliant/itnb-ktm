import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import type { UserRole } from "@/types/auth"
import { useAuth } from "@/hooks/use-auth"
import { updateMe } from "@/api/auth"
import { getUserFriendlyError } from "@/lib/error-message"
import { getRoleBasePath } from "@/lib/role-path"
import { resolveMediaUrl } from "@/lib/media-url"
import { RoleContentLayout } from "@/components/layout/role-content-layout"
import { ProfilePhotoField } from "@/components/profile/profile-photo-field"
import { UserAccountMetadata } from "@/components/profile/user-account-metadata"
import { toast } from "@/lib/toast"
import { authKeys } from "@/hooks/use-auth-query"

export function ProfilePage({ role }: { role: UserRole }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState("")
  const [department, setDepartment] = useState("")
  const [institutionalId, setInstitutionalId] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [saving, setSaving] = useState(false)
  const basePath = getRoleBasePath(role)
  const isAdminView = role === "ADMIN"

  useEffect(() => {
    setFullName(user?.full_name || "")
    setDepartment(user?.department || "")
    setInstitutionalId(user?.institutional_id || "")
    setPhotoFile(null)
    setPhotoRemoved(false)
  }, [user?.full_name, user?.department, user?.institutional_id, user?.photo])

  useEffect(() => {
    if (photoFile) setPhotoRemoved(false)
  }, [photoFile])

  const existingPhotoUrl =
    user?.photo && !photoRemoved ? resolveMediaUrl(user.photo) : ""

  const handleSave = async () => {
    try {
      setSaving(true)
      const updatedUser = await updateMe({
        full_name: fullName.trim(),
        ...(role === "ADMIN"
          ? { department: "" }
          : { department: department.trim() }),
        institutional_id: institutionalId.trim() || null,
        photoFile: photoFile ?? undefined,
        photoRemoved: photoRemoved || undefined,
      })
      queryClient.setQueryData(authKeys.me(), updatedUser)
      setPhotoFile(null)
      setPhotoRemoved(false)
      toast.success("Profile updated")
    } catch (error) {
      toast.error("Update failed", getUserFriendlyError(error, "generic"))
    } finally {
      setSaving(false)
    }
  }

  const formCard = (
    <div className="rounded-2xl border border-[#ececec] bg-white p-5 sm:p-6">
      <ProfilePhotoField
        file={photoFile}
        existingImageUrl={existingPhotoUrl}
        disabled={saving}
        onFileChange={setPhotoFile}
        onPhotoRemoved={() => setPhotoRemoved(true)}
        onValidationError={(message) => toast.warning("Profile photo", message)}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="space-y-1 sm:col-span-2">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Email</span>
          <input
            type="text"
            value={user?.email || ""}
            disabled
            className="w-full rounded-lg border border-[#ddd] bg-[#f7f7f7] px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Full Name</span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-[#ddd] px-3 py-2 text-sm"
          />
        </label>
        {role !== "ADMIN" ? (
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Department</span>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-lg border border-[#ddd] px-3 py-2 text-sm"
            />
          </label>
        ) : (
          <div className="hidden sm:block" />
        )}
        <label className="space-y-1 sm:col-span-2">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">
            Official ID (NIM/NIP)
          </span>
          <input
            type="text"
            value={institutionalId}
            onChange={(e) => setInstitutionalId(e.target.value)}
            className="w-full rounded-lg border border-[#ddd] px-3 py-2 text-sm"
            placeholder="Used to match seminar certificates"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-[#af0f24] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <Link
          to={`${basePath}/change-password`}
          className="rounded-lg border border-[#ddd] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#1a1c1c]"
        >
          Change Password
        </Link>
      </div>
    </div>
  )

  const adminContent = (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[#ececec] bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24]">Account</p>
        <h1 className="mt-1 text-2xl font-extrabold text-[#1a1c1c]">Profile Settings</h1>
        <p className="mt-1 text-sm text-[#5f5e5e]">Manage your photo and account information.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">{formCard}</div>
        <div className="lg:col-span-1">
          <UserAccountMetadata user={user} />
        </div>
      </div>
    </section>
  )

  const roleContent = (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)] lg:items-start">
        {formCard}
        <UserAccountMetadata user={user} />
      </div>
    </section>
  )

  if (isAdminView) {
    return <div className="w-full">{adminContent}</div>
  }

  return (
    <RoleContentLayout
      role={role}
      title="My Profile"
      subtitle="Manage your photo and account information"
      maxWidthClassName="w-full"
    >
      {roleContent}
    </RoleContentLayout>
  )
}
