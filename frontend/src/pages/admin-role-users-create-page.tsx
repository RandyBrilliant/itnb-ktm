import { useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { createUser } from "@/api/users"
import { EmployeeIdCardPreview } from "@/components/admin/employee-id-card-preview"
import { ThemedCheckbox } from "@/components/ui/themed-checkbox"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"
import {
  DIRECTORY_ROLE_LABELS,
  directoryRoleToSegment,
  directorySegmentToRole,
} from "@/lib/admin-role-users"
import { userKeys } from "@/hooks/use-users-query"

export function AdminRoleUsersCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { roleSegment } = useParams<{ roleSegment: string }>()
  const role = directorySegmentToRole(roleSegment)

  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [department, setDepartment] = useState("")
  const [position, setPosition] = useState("")
  const [institutionalId, setInstitutionalId] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [cardRole, setCardRole] = useState<"STAFF" | "LECTURER">(
    role === "LECTURER" ? "LECTURER" : "STAFF"
  )
  const [contactPhone, setContactPhone] = useState("")
  const [address, setAddress] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!role) {
    return <Navigate to="/admin/dashboard" replace />
  }

  const labels = DIRECTORY_ROLE_LABELS[role]
  const pathSegment = directoryRoleToSegment(role)
  const showEmployeeCard = role === "STAFF" || role === "LECTURER"
  const showDepartment = showEmployeeCard
  const savedRole = showEmployeeCard ? cardRole : role

  const handleSubmit = async () => {
    if (!email.trim() || !fullName.trim()) {
      toast.warning("Missing fields", "Email and full name are required.")
      return
    }
    if (!password || password !== passwordConfirm) {
      toast.warning("Password", "Enter matching passwords.")
      return
    }

    try {
      setIsSubmitting(true)
      await createUser({
        email: email.trim(),
        full_name: fullName.trim(),
        password,
        password_confirm: passwordConfirm,
        role: savedRole,
        ...(showDepartment
          ? { department: department.trim() || undefined, position: position.trim() }
          : {}),
        institutional_id: institutionalId.trim() || null,
        is_active: isActive,
        ...(savedRole === "LECTURER"
          ? {
              contact_phone: contactPhone.trim(),
              address: address.trim(),
            }
          : {}),
      })
      await queryClient.invalidateQueries({ queryKey: userKeys.all })
      toast.success("Record saved")
      navigate(`/admin/users/${directoryRoleToSegment(savedRole)}`, { replace: true })
    } catch (error) {
      toast.error("Could not save record", getUserFriendlyError(error, "generic"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Administration</p>
        <h1 className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">{labels.createTitle}</h1>
        <p className="mt-1 text-sm text-[#5f5e5e]">{labels.listSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,36rem)_320px]">
      <div className="rounded-sm border border-[#e2e2e2] bg-white p-6 shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
        <div className="grid max-w-xl grid-cols-1 gap-4">
          {showEmployeeCard ? (
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Role</span>
              <select
                value={cardRole}
                onChange={(e) => setCardRole(e.target.value === "LECTURER" ? "LECTURER" : "STAFF")}
                className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
              >
                <option value="STAFF">Staff</option>
                <option value="LECTURER">Lecturer</option>
              </select>
            </label>
          ) : null}
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

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
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

          {showDepartment ? (
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Position</span>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
                placeholder="e.g. Academic Administrator, Senior Lecturer"
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

          {savedRole === "LECTURER" ? (
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
              {isSubmitting ? "Saving…" : "Save record"}
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
      {showEmployeeCard ? (
        <EmployeeIdCardPreview
          cardRole={cardRole}
          name={fullName}
          institutionalId={institutionalId}
          department={department}
          position={position}
          photoUrl=""
        />
      ) : null}
      </div>
    </div>
  )
}
