import { useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { Edit2, Plus, Search, Check, X } from "lucide-react"
import { useUsersQuery } from "@/hooks/use-users-query"
import { activateUser, deactivateUser } from "@/api/users"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"
import {
  DIRECTORY_ROLE_LABELS,
  directoryRoleToSegment,
  directorySegmentToRole,
} from "@/lib/admin-role-users"

export function AdminRoleUsersListPage() {
  const { roleSegment } = useParams<{ roleSegment: string }>()
  const role = directorySegmentToRole(roleSegment)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  if (!role) {
    return <Navigate to="/admin/dashboard" replace />
  }

  const labels = DIRECTORY_ROLE_LABELS[role]
  const pathSegment = directoryRoleToSegment(role)

  const { data: usersData, isLoading, refetch } = useUsersQuery({
    search: search || undefined,
    role,
    page,
    page_size: 20,
  })

  const handleStatusToggle = async (userId: number, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateUser(userId)
        toast.success("Record deactivated")
      } else {
        await activateUser(userId)
        toast.success("Record activated")
      }
      refetch()
    } catch (error) {
      toast.error("Could not update status", getUserFriendlyError(error, "user-status"))
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Administration</p>
          <h1 className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">{labels.listTitle}</h1>
          <p className="mt-1 text-sm text-[#5f5e5e]">{labels.listSubtitle}</p>
        </div>
        <Link
          to={`/admin/users/${pathSegment}/new`}
          className="flex items-center gap-2 bg-[#af0f24] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#930019]"
        >
          <Plus size={20} />
          New record
        </Link>
      </div>

      <div className="space-y-4 rounded-sm border border-[#e2e2e2] bg-white p-4 shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
        <div className="relative max-w-xl">
          <Search size={18} className="absolute left-3 top-3 text-[#5f5e5e]" />
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
      </div>

      <div className="overflow-hidden rounded-sm border border-[#e2e2e2] bg-white shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
        {isLoading ? (
          <div className="p-8 text-center text-[#5f5e5e]">Loading…</div>
        ) : !usersData?.results.length ? (
          <div className="p-8 text-center text-[#5f5e5e]">No records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#ececec] bg-[#f3f3f3]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Name</th>
                  {role !== "ADMIN" ? (
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Department</th>
                  ) : null}
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Email verified</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-[#1a1c1c]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {usersData.results.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-[#f9f9f9]">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-[#1a1c1c]">{user.full_name || "N/A"}</p>
                        <p className="text-sm text-[#5f5e5e]">{user.email}</p>
                      </div>
                    </td>
                    {role !== "ADMIN" ? (
                      <td className="px-6 py-4 text-sm text-[#1a1c1c]">{user.department || "—"}</td>
                    ) : null}
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(user.id, user.is_active)}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
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
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
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
                        to={`/admin/users/${pathSegment}/${user.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-sm px-3 py-2 text-sm font-semibold text-[#af0f24] transition hover:bg-[#ececec]"
                      >
                        <Edit2 size={16} />
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

      {usersData && usersData.count > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#5f5e5e]">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, usersData.count)} of {usersData.count} records
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!usersData.previous}
              onClick={() => setPage(page - 1)}
              className="border border-[#d5d5d5] px-4 py-2 hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
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
