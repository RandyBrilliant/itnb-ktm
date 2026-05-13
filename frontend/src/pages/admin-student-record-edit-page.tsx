import { useEffect, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getUser, updateUser } from "@/api/users"
import { ThemedCheckbox } from "@/components/ui/themed-checkbox"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"
import { userKeys } from "@/hooks/use-users-query"

type RecordRole = "STUDENT" | "ALUMNI"

export function AdminStudentRecordEditPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)

  const [recordRole, setRecordRole] = useState<RecordRole>("STUDENT")
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [department, setDepartment] = useState("")
  const [institutionalId, setInstitutionalId] = useState("")
  const [alumniYear, setAlumniYear] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!Number.isFinite(userId)) {
    return <Navigate to="/admin/users" replace />
  }

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["admin-student-record-edit", userId],
    queryFn: () => getUser(userId),
    enabled: Number.isFinite(userId),
  })

  useEffect(() => {
    if (!user) return
    if (user.role !== "STUDENT" && user.role !== "ALUMNI") {
      toast.warning("Wrong directory", "This account is managed under Administrator, Staff, or Lecturer records.")
      navigate("/admin/users", { replace: true })
      return
    }
    setRecordRole(user.role)
    setEmail(user.email)
    setFullName(user.full_name ?? "")
    setDepartment(user.department ?? "")
    setInstitutionalId(user.institutional_id ?? "")
    setIsActive(user.is_active)
    setAlumniYear(user.alumni_year != null ? String(user.alumni_year) : "")
  }, [user, navigate])

  const handleSubmit = async () => {
    if (!user) return
    if (!email.trim() || !fullName.trim()) {
      toast.warning("Missing fields", "Email and full name are required.")
      return
    }

    let alumni_year: number | null
    if (recordRole === "STUDENT") {
      alumni_year = null
    } else if (alumniYear.trim()) {
      const y = Number.parseInt(alumniYear.trim(), 10)
      if (!Number.isFinite(y)) {
        toast.warning("Graduation year", "Enter a valid year or leave empty to clear.")
        return
      }
      alumni_year = y
    } else {
      alumni_year = null
    }

    try {
      setIsSubmitting(true)
      await updateUser(user.id, {
        email: email.trim(),
        full_name: fullName.trim(),
        department: department.trim() || undefined,
        institutional_id: institutionalId.trim() || null,
        is_active: isActive,
        role: recordRole,
        alumni_year,
      })
      await queryClient.invalidateQueries({ queryKey: userKeys.all })
      await queryClient.invalidateQueries({ queryKey: ["admin-student-record-edit", userId] })
      toast.success("Record updated")
      navigate("/admin/users", { replace: true })
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
        <Link to="/admin/users" className="text-sm font-semibold text-[#af0f24]">
          Back to Student Records
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Administration</p>
        <h1 className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">
          Edit student record
        </h1>
        <p className="mt-1 text-sm text-[#5f5e5e]">
          {user.email} · <span className="font-semibold text-[#1a1c1c]">{user.role}</span>
        </p>
      </div>

      <div className="rounded-sm border border-[#e2e2e2] bg-white p-6 shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
        <div className="grid max-w-xl grid-cols-1 gap-4">
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Record type</span>
            <select
              value={recordRole}
              onChange={(e) => setRecordRole(e.target.value as RecordRole)}
              className="w-full border border-[#d5d5d5] bg-white px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
            >
              <option value="STUDENT">Student</option>
              <option value="ALUMNI">Alumni</option>
            </select>
          </label>

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
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Department</span>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
            />
          </label>

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

          {recordRole === "ALUMNI" ? (
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">
                Graduation year
              </span>
              <input
                type="number"
                min={1950}
                max={2100}
                value={alumniYear}
                onChange={(e) => setAlumniYear(e.target.value)}
                placeholder="e.g. 2024"
                className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
              />
            </label>
          ) : null}

          <ThemedCheckbox
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            label="Active account"
          />

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
              to="/admin/users"
              className="border border-[#d5d5d5] px-6 py-3 text-sm font-semibold text-[#1a1c1c] transition hover:bg-[#ececec]"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
