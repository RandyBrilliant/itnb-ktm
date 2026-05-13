import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import type { UserRole } from "@/types/auth"
import { useAuth } from "@/hooks/use-auth"
import { updateMe } from "@/api/auth"
import { getUserFriendlyError } from "@/lib/error-message"
import { getRoleBasePath } from "@/lib/role-path"
import { RoleContentLayout } from "@/components/layout/role-content-layout"
import { toast } from "@/lib/toast"
import { authKeys } from "@/hooks/use-auth-query"

export function ProfilePage({ role }: { role: UserRole }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState("")
  const [department, setDepartment] = useState("")
  const [institutionalId, setInstitutionalId] = useState("")
  const [saving, setSaving] = useState(false)
  const basePath = getRoleBasePath(role)
  const isAdminView = role === "ADMIN"

  useEffect(() => {
    setFullName(user?.full_name || "")
    setDepartment(user?.department || "")
    setInstitutionalId(user?.institutional_id || "")
  }, [user?.full_name, user?.department, user?.institutional_id])

  const handleSave = async () => {
    try {
      setSaving(true)
      const updatedUser = await updateMe({
        full_name: fullName.trim(),
        ...(role === "ADMIN"
          ? { department: "" }
          : { department: department.trim() }),
        institutional_id: institutionalId.trim() || null,
      })
      queryClient.setQueryData(authKeys.me(), updatedUser)
      toast.success("Profile updated")
    } catch (error) {
      toast.error("Update failed", getUserFriendlyError(error, "generic"))
    } finally {
      setSaving(false)
    }
  }

  const renderDate = (value?: string | null) => {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "—"
    return date.toLocaleString()
  }

  const content = (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[#ececec] bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24]">Account</p>
        <h1 className="mt-1 text-2xl font-extrabold text-[#1a1c1c]">Profile Settings</h1>
        <p className="mt-1 text-sm text-[#5f5e5e]">Manage your basic account information.</p>
      </div>

      {isAdminView ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#ececec] bg-white p-5 lg:col-span-3">
            <div className="grid grid-cols-1 gap-4">
              <label className="space-y-1">
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
              <label className="space-y-1">
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

            <div className="mt-4 flex items-center gap-2">
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

          <div className="rounded-2xl border border-[#ececec] bg-white p-5 lg:col-span-1">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24]">Account</p>
            <h2 className="mt-1 text-lg font-bold text-[#1a1c1c]">Account Details</h2>
            <div className="mt-4 space-y-2 text-sm text-[#1a1c1c]">
              <p><span className="font-semibold text-[#5f5e5e]">User ID:</span> {user?.id ?? "—"}</p>
              <p><span className="font-semibold text-[#5f5e5e]">Role:</span> {user?.role_display ?? user?.role ?? "—"}</p>
              <p><span className="font-semibold text-[#5f5e5e]">Is Active:</span> {user?.is_active ? "Yes" : "No"}</p>
              <p><span className="font-semibold text-[#5f5e5e]">Email Verified:</span> {user?.email_verified ? "Yes" : "No"}</p>
              <p><span className="font-semibold text-[#5f5e5e]">Staff Access:</span> {user?.is_staff ? "Yes" : "No"}</p>
              <p><span className="font-semibold text-[#5f5e5e]">Superuser:</span> {user?.is_superuser ? "Yes" : "No"}</p>
              <p><span className="font-semibold text-[#5f5e5e]">Last Login:</span> {renderDate(user?.last_login)}</p>
              <p><span className="font-semibold text-[#5f5e5e]">Date Joined:</span> {renderDate(user?.date_joined)}</p>
              <p><span className="font-semibold text-[#5f5e5e]">Updated At:</span> {renderDate(user?.updated_at)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#ececec] bg-white p-5">
          <div className="grid grid-cols-1 gap-4">
            <label className="space-y-1">
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
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Department</span>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-[#ddd] px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
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

          <div className="mt-4 flex items-center gap-2">
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
      )}
    </section>
  )

  if (isAdminView) {
    return <div className="w-full">{content}</div>
  }

  return <RoleContentLayout role={role} title="My Profile">{content}</RoleContentLayout>
}

