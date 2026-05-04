import { useState } from "react"
import { useUsersQuery } from "@/hooks/use-users-query"
import { activateUser, deactivateUser } from "@/api/users"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"
import { Search, UserPlus, MoreVertical, Check, X } from "lucide-react"

/**
 * Admin users management page
 */
export function AdminUsersPage() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [page, setPage] = useState(1)

  const { data: usersData, isLoading, refetch } = useUsersQuery({
    search: search || undefined,
    role: roleFilter || undefined,
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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Administration</p>
          <h1 className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">Student Records</h1>
          <p className="mt-1 text-sm text-[#5f5e5e]">Manage ITNB Hub user accounts by role and status.</p>
        </div>
        <button className="flex items-center gap-2 bg-[#af0f24] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#930019]">
          <UserPlus size={20} />
          Create User
        </button>
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
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            className="border border-[#d5d5d5] bg-white px-4 py-2 text-[#1a1c1c] outline-none transition focus:border-[#af0f24]"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
            <option value="LECTURER">Lecturer</option>
            <option value="STUDENT">Student</option>
            <option value="ALUMNI">Alumni</option>
          </select>
          <div></div>
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-[#e2e2e2] bg-white shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
        {isLoading ? (
          <div className="p-8 text-center text-[#5f5e5e]">
            Loading users...
          </div>
        ) : !usersData?.results.length ? (
          <div className="p-8 text-center text-[#5f5e5e]">
            No users found
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
                    <td className="px-6 py-4">
                      <button
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
                      <button className="inline-flex rounded-sm p-2 transition-colors hover:bg-[#ececec]">
                        <MoreVertical size={18} className="text-[#5f5e5e]" />
                      </button>
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
            {Math.min(page * 20, usersData.count)} of {usersData.count} users
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
