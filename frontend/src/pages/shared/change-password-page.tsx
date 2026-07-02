import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import type { UserRole } from "@/types/auth"
import { changePassword } from "@/api/auth"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"
import { getRoleBasePath } from "@/lib/role-path"
import { RoleContentLayout } from "@/components/layout/role-content-layout"

export function ChangePasswordPage({ role }: { role: UserRole }) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const basePath = getRoleBasePath(role)
  const isAdminView = role === "ADMIN"

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("Change password failed", "New password and confirmation do not match.")
      return
    }
    try {
      setSubmitting(true)
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      })
      toast.success("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast.error("Change password failed", getUserFriendlyError(error, "change-password"))
    } finally {
      setSubmitting(false)
    }
  }

  const content = (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[#ececec] bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24]">Security</p>
        <h1 className="mt-1 text-2xl font-extrabold text-[#1a1c1c]">Change Password</h1>
        <p className="mt-1 text-sm text-[#5f5e5e]">Use a strong password you do not use elsewhere.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-[#ececec] bg-white p-5">
        <div className="grid grid-cols-1 gap-4">
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Current Password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-[#ddd] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">New Password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-[#ddd] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Confirm New Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-[#ddd] px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[#af0f24] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60"
          >
            {submitting ? "Updating..." : "Update Password"}
          </button>
          <Link
            to={`${basePath}/profile`}
            className="rounded-lg border border-[#ddd] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#1a1c1c]"
          >
            Back to Profile
          </Link>
        </div>
      </form>
    </section>
  )

  if (isAdminView) {
    return <div className="mx-auto w-full max-w-4xl">{content}</div>
  }

  return <RoleContentLayout role={role} title="Security">{content}</RoleContentLayout>
}

