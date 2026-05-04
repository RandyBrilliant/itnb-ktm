import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import type { UserRole } from "@/types/auth"
import { useAuth } from "@/hooks/use-auth"
import { updateMe } from "@/api/auth"
import { getUserFriendlyError } from "@/lib/error-message"
import { getRoleBasePath } from "@/lib/role-path"
import { RoleContentLayout } from "@/components/layout/role-content-layout"
import { toast } from "@/lib/toast"

export function ProfilePage({ role }: { role: UserRole }) {
  const { user } = useAuth()
  const [fullName, setFullName] = useState("")
  const [department, setDepartment] = useState("")
  const [saving, setSaving] = useState(false)
  const basePath = getRoleBasePath(role)

  useEffect(() => {
    setFullName(user?.full_name || "")
    setDepartment(user?.department || "")
  }, [user?.full_name, user?.department])

  const handleSave = async () => {
    try {
      setSaving(true)
      await updateMe({
        full_name: fullName.trim(),
        department: department.trim(),
      })
      toast.success("Profile updated")
    } catch (error) {
      toast.error("Update failed", getUserFriendlyError(error, "generic"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <RoleContentLayout role={role} title="My Profile">
      <section className="space-y-4">
        <div className="rounded-2xl border border-[#ececec] bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24]">Account</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#1a1c1c]">Profile Settings</h1>
          <p className="mt-1 text-sm text-[#5f5e5e]">Manage your basic account information.</p>
        </div>

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
      </section>
    </RoleContentLayout>
  )
}

