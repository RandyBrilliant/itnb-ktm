import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Edit2, Plus, Search, Trash2 } from "lucide-react"
import {
  deleteBenefit,
  listBenefitsAdmin,
  listBenefitCategories,
  type Benefit,
} from "@/api/benefits"
import { ConfirmActionModal } from "@/components/ui/confirm-action-modal"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"

function formatDate(value?: string) {
  if (!value) return "—"
  return new Date(value).toLocaleString()
}

export function AdminBenefitsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [activeFilter, setActiveFilter] = useState<string>("")
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Benefit | null>(null)

  const queryFilters = useMemo(
    () => ({
      page,
      page_size: 20,
      search: search || undefined,
      category: categoryFilter ? Number(categoryFilter) : undefined,
      is_active: activeFilter === "" ? undefined : activeFilter === "active",
      ordering: "-updated_at",
    }),
    [activeFilter, categoryFilter, page, search]
  )

  const { data: categories = [] } = useQuery({
    queryKey: ["benefit-categories"],
    queryFn: listBenefitCategories,
    staleTime: 60_000,
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-benefits", queryFilters],
    queryFn: () => listBenefitsAdmin(queryFilters),
  })

  const handleDelete = async () => {
    if (!pendingDelete) return

    try {
      setDeletingId(pendingDelete.id)
      await deleteBenefit(pendingDelete.id)
      toast.success("Benefit deleted")
      await queryClient.invalidateQueries({ queryKey: ["admin-benefits"] })
      await queryClient.invalidateQueries({ queryKey: ["benefit-categories"] })
      refetch()
      setPendingDelete(null)
    } catch (error) {
      toast.error("Failed to delete benefit", getUserFriendlyError(error, "generic"))
    } finally {
      setDeletingId(null)
    }
  }

  const pageSize = 20

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Administration</p>
          <h1 className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">Student Benefits</h1>
          <p className="mt-1 text-sm text-[#5f5e5e]">
            Manage perks, partner offers, and eligibility for the benefits directory.
          </p>
        </div>
        <Link
          to="/admin/benefits/new"
          className="flex items-center gap-2 bg-[#af0f24] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#930019]"
        >
          <Plus size={20} />
          New Benefit
        </Link>
      </div>

      <div className="space-y-4 rounded-sm border border-[#e2e2e2] bg-white p-4 shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search size={18} className="absolute left-3 top-3 text-[#5f5e5e]" />
            <input
              type="text"
              placeholder="Search title, partner, or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full border border-[#d5d5d5] bg-white py-2 pl-10 pr-4 text-[#1a1c1c] outline-none transition focus:border-[#af0f24]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
            className="border border-[#d5d5d5] bg-white px-4 py-2 text-[#1a1c1c] outline-none transition focus:border-[#af0f24]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value)
              setPage(1)
            }}
            className="border border-[#d5d5d5] bg-white px-4 py-2 text-[#1a1c1c] outline-none transition focus:border-[#af0f24]"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-[#e2e2e2] bg-white shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
        {isLoading ? (
          <div className="p-8 text-center text-[#5f5e5e]">Loading benefits...</div>
        ) : !data?.results.length ? (
          <div className="p-8 text-center text-[#5f5e5e]">No benefits found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#ececec] bg-[#f3f3f3]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Partner</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Roles</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Updated</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-[#1a1c1c]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {data.results.map((benefit) => (
                  <tr key={benefit.id} className="transition-colors hover:bg-[#f9f9f9]">
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#1a1c1c]">{benefit.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-[#5f5e5e]">
                        {benefit.description_short || benefit.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1a1c1c]">{benefit.category?.name || "—"}</td>
                    <td className="px-6 py-4 text-sm text-[#1a1c1c]">{benefit.partner || "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {benefit.eligible_roles.map((role) => (
                          <span
                            key={role}
                            className="rounded-full bg-[#f3f3f3] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5f5e5e]"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          benefit.is_active ? "bg-green-100 text-green-700" : "bg-[#ececec] text-[#5f5e5e]"
                        }`}
                      >
                        {benefit.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#5f5e5e]">{formatDate(benefit.updated_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/benefits/${benefit.id}/edit`}
                          className="inline-flex items-center gap-1 rounded-sm border border-[#d5d5d5] px-3 py-1.5 text-xs font-semibold text-[#1a1c1c] transition hover:bg-[#f3f3f3]"
                        >
                          <Edit2 size={14} />
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(benefit)}
                          disabled={deletingId === benefit.id}
                          className="inline-flex items-center gap-1 rounded-sm border border-[#f2b6b6] px-3 py-1.5 text-xs font-semibold text-[#af0f24] transition hover:bg-[#fff2f2] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <Trash2 size={14} />
                          {deletingId === benefit.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.count > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#5f5e5e]">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.count)} of {data.count}{" "}
            benefits
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!data.previous}
              onClick={() => setPage((prev) => prev - 1)}
              className="border border-[#d5d5d5] px-4 py-2 hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!data.next}
              onClick={() => setPage((prev) => prev + 1)}
              className="border border-[#d5d5d5] px-4 py-2 hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
      <ConfirmActionModal
        open={pendingDelete !== null}
        isLoading={deletingId === pendingDelete?.id}
        title="Delete benefit"
        description={
          pendingDelete
            ? `Delete "${pendingDelete.title}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onCancel={() => {
          if (deletingId === null) setPendingDelete(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}
