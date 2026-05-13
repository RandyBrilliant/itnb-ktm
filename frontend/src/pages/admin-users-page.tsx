import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useUsersQuery } from "@/hooks/use-users-query"
import {
  activateUser,
  deactivateUser,
  downloadStudentImportTemplate,
  importStudentsFromExcel,
} from "@/api/users"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"
import { Search, Check, X, Download, Upload, Pencil } from "lucide-react"

/**
 * Admin users management page
 */
/** Student Records lists students and alumni only (not admin/staff/lecturer). */
type RecordRoleScope = "both" | "STUDENT" | "ALUMNI"

export function AdminUsersPage() {
  const [search, setSearch] = useState("")
  const [recordRoleScope, setRecordRoleScope] = useState<RecordRoleScope>("both")
  const [page, setPage] = useState(1)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [defaultImportPassword, setDefaultImportPassword] = useState("")
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: usersData, isLoading, refetch } = useUsersQuery({
    search: search || undefined,
    ...(recordRoleScope === "both"
      ? { roles: "STUDENT,ALUMNI" }
      : { role: recordRoleScope }),
    page,
    page_size: 20,
  })

  const handleStatusToggle = async (userId: number, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateUser(userId)
        toast.success("User deactivated")
      } else {
        await activateUser(userId)
        toast.success("User activated")
      }
      refetch()
    } catch (error) {
      toast.error("Failed to update user status", getUserFriendlyError(error, "user-status"))
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadStudentImportTemplate()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "student_import_template.xlsx"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Template downloaded")
    } catch (error) {
      toast.error("Download failed", getUserFriendlyError(error, "generic"))
    }
  }

  const handleStudentImport = async () => {
    if (!importFile) {
      toast.warning("No file selected", "Choose an Excel (.xlsx) file first.")
      return
    }
    try {
      setImporting(true)
      const result = await importStudentsFromExcel(
        importFile,
        defaultImportPassword.trim() || undefined
      )
      const summary = `Created ${result.created}. Skipped ${result.skipped}.`
      toast.success("Import finished", summary)
      if (result.errors?.length) {
        const hint = result.errors
          .slice(0, 6)
          .map((e) => (e.row ? `Row ${e.row}: ${e.message}` : e.message))
          .join(" · ")
        toast.warning("Row notes", hint.length > 280 ? `${hint.slice(0, 280)}…` : hint)
      }
      setImportFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      await refetch()
    } catch (error) {
      toast.error("Import failed", getUserFriendlyError(error, "generic"))
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Administration</p>
          <h1 className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">Student Records</h1>
          <p className="mt-1 text-sm text-[#5f5e5e]">
            Student and alumni accounts only. Portal staff and admins are managed under their own records in the
            sidebar.
          </p>
        </div>
        <div className="flex max-w-md flex-col items-end gap-3 text-right">
          <Link
            to="/admin/users/record/new"
            className="inline-flex items-center justify-center bg-[#af0f24] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#930019]"
          >
            New record
          </Link>
          <p className="text-sm text-[#5f5e5e]">
            To add administrators, staff, or lecturers, use Administrator Records, Staff Records, or Lecturer Records in
            the sidebar.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-sm border border-[#e2e2e2] bg-white p-4 shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-3 text-[#5f5e5e]"
            />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full border border-[#d5d5d5] bg-white py-2 pl-10 pr-4 text-[#1a1c1c] outline-none transition focus:border-[#af0f24]"
            />
          </div>

          <select
            value={recordRoleScope}
            onChange={(e) => {
              setRecordRoleScope(e.target.value as RecordRoleScope)
              setPage(1)
            }}
            className="border border-[#d5d5d5] bg-white px-4 py-2 text-[#1a1c1c] outline-none transition focus:border-[#af0f24]"
          >
            <option value="both">Students &amp; alumni</option>
            <option value="STUDENT">Students only</option>
            <option value="ALUMNI">Alumni only</option>
          </select>
          <div></div>
        </div>

        <div className="border-t border-[#ececec] pt-4 md:col-span-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">
            Import student records
          </p>
          <p className="mt-1 text-sm text-[#5f5e5e]">
            Upload an Excel (.xlsx) file with columns Email and Full name (see template). Optional: Institutional ID,
            Department, Password. If the Password column is empty, provide a default password below (must meet password
            rules).
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 border border-[#d5d5d5] bg-white px-4 py-2 text-sm font-semibold text-[#1a1c1c] transition hover:bg-[#ececec]"
            >
              <Download size={18} />
              Download template
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 border border-[#d5d5d5] bg-white px-4 py-2 text-sm font-semibold text-[#1a1c1c] transition hover:bg-[#ececec]"
            >
              <Upload size={18} />
              {importFile ? importFile.name : "Choose file"}
            </button>
            <label className="flex min-w-[200px] flex-1 flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">
                Default password (optional)
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={defaultImportPassword}
                onChange={(e) => setDefaultImportPassword(e.target.value)}
                placeholder="If rows omit Password"
                className="border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
              />
            </label>
            <button
              type="button"
              disabled={importing}
              onClick={handleStudentImport}
              className="inline-flex items-center gap-2 bg-[#af0f24] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#930019] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {importing ? "Importing…" : "Import students"}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-[#e2e2e2] bg-white shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
        {isLoading ? (
          <div className="p-8 text-center text-[#5f5e5e]">
            Loading users...
          </div>
        ) : !usersData?.results.length ? (
          <div className="p-8 text-center text-[#5f5e5e]">
            No records found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#ececec] bg-[#f3f3f3]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">
                    Inst. ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">
                    Email Verified
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-[#1a1c1c]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {usersData.results.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-[#f9f9f9]">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-[#1a1c1c]">
                          {user.full_name || "N/A"}
                        </p>
                        <p className="text-sm text-[#5f5e5e]">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-[#af0f24]/10 px-3 py-1 text-sm font-medium text-[#af0f24]">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1a1c1c]">
                      {user.department || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1a1c1c]">
                      {user.institutional_id || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusToggle(user.id, user.is_active)
                        }
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          user.is_active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-[#ececec] text-[#5f5e5e] hover:bg-[#e2e2e2]"
                        }`}
                      >
                        {user.is_active ? (
                          <>
                            <Check size={16} />
                            Active
                          </>
                        ) : (
                          <>
                            <X size={16} />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.email_verified ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20">
                          <Check size={16} className="text-green-600" />
                        </span>
                      ) : (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ececec]">
                          <X size={16} className="text-[#5f5e5e]" />
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        to={`/admin/users/record/${user.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-semibold text-[#af0f24] transition-colors hover:bg-[#af0f24]/10"
                        title="Edit record"
                      >
                        <Pencil size={16} />
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {usersData && usersData.count > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#5f5e5e]">
            Showing {(page - 1) * 20 + 1} to{" "}
            {Math.min(page * 20, usersData.count)} of {usersData.count} records
          </p>
          <div className="flex gap-2">
            <button
              disabled={!usersData.previous}
              onClick={() => setPage(page - 1)}
              className="border border-[#d5d5d5] px-4 py-2 hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={!usersData.next}
              onClick={() => setPage(page + 1)}
              className="border border-[#d5d5d5] px-4 py-2 hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
