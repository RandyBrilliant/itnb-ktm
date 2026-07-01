import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Download, Edit2, Plus, QrCode, Search, Trash2 } from "lucide-react"
import {
  deleteWebinar,
  downloadWebinarParticipants,
  listWebinars,
  type WebinarItem,
} from "@/api/webinars"
import { ConfirmActionModal } from "@/components/ui/confirm-action-modal"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"

function formatDateTime(value?: string) {
  if (!value) return "—"
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AdminWebinarsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<WebinarItem | null>(null)

  const queryFilters = useMemo(
    () => ({ page, page_size: 20, search: search || undefined, ordering: "-starts_at" }),
    [page, search]
  )

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-webinars", queryFilters],
    queryFn: () => listWebinars(queryFilters),
  })

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      setDeletingId(pendingDelete.id)
      await deleteWebinar(pendingDelete.id)
      toast.success("Webinar deleted")
      await queryClient.invalidateQueries({ queryKey: ["admin-webinars"] })
      refetch()
      setPendingDelete(null)
    } catch (error) {
      toast.error("Failed to delete webinar", getUserFriendlyError(error, "generic"))
    } finally {
      setDeletingId(null)
    }
  }

  const handleExport = async (webinar: WebinarItem) => {
    try {
      await downloadWebinarParticipants(webinar.id, webinar.post.title)
    } catch (error) {
      toast.error("Failed to download participants", getUserFriendlyError(error, "generic"))
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Administration</p>
          <h1 className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">Webinars</h1>
          <p className="mt-1 text-sm text-[#5f5e5e]">
            Create webinars, track attendance, and auto-issue certificates on check-in.
          </p>
        </div>
        <Link
          to="/admin/webinars/new"
          className="flex items-center gap-2 bg-[#af0f24] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#930019]"
        >
          <Plus size={20} />
          New Webinar
        </Link>
      </div>

      <div className="rounded-sm border border-[#e2e2e2] bg-white p-4 shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-[#5f5e5e]" />
          <input
            type="text"
            placeholder="Search webinars..."
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
          <div className="p-8 text-center text-[#5f5e5e]">Loading webinars...</div>
        ) : !data?.results.length ? (
          <div className="p-8 text-center text-[#5f5e5e]">No webinars yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#ececec] bg-[#f3f3f3]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Webinar</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Mode</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Starts</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Registered</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Attended</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-[#1a1c1c]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {data.results.map((webinar) => (
                  <tr key={webinar.id} className="transition-colors hover:bg-[#f9f9f9]">
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#1a1c1c]">{webinar.post.title}</p>
                      <p className="mt-1 text-xs text-[#5f5e5e]">
                        {webinar.certificate_program
                          ? `Certificate: ${webinar.certificate_program.title}`
                          : "No certificate"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1a1c1c]">{webinar.mode_display || webinar.mode}</td>
                    <td className="px-6 py-4 text-xs text-[#5f5e5e]">{formatDateTime(webinar.starts_at)}</td>
                    <td className="px-6 py-4 text-sm text-[#1a1c1c]">
                      {webinar.registration_count}
                      {webinar.capacity ? ` / ${webinar.capacity}` : ""}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1a1c1c]">{webinar.attendee_count}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          webinar.post.is_published
                            ? "bg-green-100 text-green-700"
                            : "bg-[#ececec] text-[#5f5e5e]"
                        }`}
                      >
                        {webinar.status_display || webinar.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          to={`/admin/webinars/${webinar.id}/attendance`}
                          className="inline-flex items-center gap-1 rounded-sm border border-[#d5d5d5] px-3 py-1.5 text-xs font-semibold text-[#1a1c1c] transition hover:bg-[#f3f3f3]"
                        >
                          <QrCode size={14} />
                          Attendance
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleExport(webinar)}
                          className="inline-flex items-center gap-1 rounded-sm border border-[#d5d5d5] px-3 py-1.5 text-xs font-semibold text-[#1a1c1c] transition hover:bg-[#f3f3f3]"
                        >
                          <Download size={14} />
                          Export
                        </button>
                        <Link
                          to={`/admin/webinars/${webinar.id}/edit`}
                          className="inline-flex items-center gap-1 rounded-sm border border-[#d5d5d5] px-3 py-1.5 text-xs font-semibold text-[#1a1c1c] transition hover:bg-[#f3f3f3]"
                        >
                          <Edit2 size={14} />
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(webinar)}
                          disabled={deletingId === webinar.id}
                          className="inline-flex items-center gap-1 rounded-sm border border-[#f2b6b6] px-3 py-1.5 text-xs font-semibold text-[#af0f24] transition hover:bg-[#fff2f2] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <Trash2 size={14} />
                          {deletingId === webinar.id ? "Deleting..." : "Delete"}
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

      {data && data.count > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#5f5e5e]">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.count)} of {data.count} webinars
          </p>
          <div className="flex gap-2">
            <button
              disabled={!data.previous}
              onClick={() => setPage((prev) => prev - 1)}
              className="border border-[#d5d5d5] px-4 py-2 hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
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
        title="Delete webinar"
        description={
          pendingDelete
            ? `Delete "${pendingDelete.post.title}"? This removes the announcement and all registrations. This cannot be undone.`
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
