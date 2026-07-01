import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, RefreshCw, Trash2 } from "lucide-react"
import {
  deleteCertificateProgram,
  listCertificatePrograms,
  retryCertificateProgram,
  type CertificateProgramItem,
} from "@/api/certificate-programs"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"
import { resolveMediaUrl } from "@/lib/media-url"
import { ConfirmActionModal } from "@/components/ui/confirm-action-modal"
import { PaginationControls } from "@/components/content/pagination-controls"

function statusBadge(status: CertificateProgramItem["batch_status"]) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-900",
    PROCESSING: "bg-blue-100 text-blue-900",
    COMPLETED: "bg-emerald-100 text-emerald-900",
    FAILED: "bg-red-100 text-red-900",
  }
  return map[status] ?? "bg-[#ececec] text-[#1a1c1c]"
}

export function AdminCertificatesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<CertificateProgramItem | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-certificate-programs", page],
    queryFn: () => listCertificatePrograms(page),
    refetchInterval: (query) => {
      const results = (query.state.data as { results?: CertificateProgramItem[] } | undefined)?.results ?? []
      const busy = results.some((r) => r.batch_status === "PENDING" || r.batch_status === "PROCESSING")
      return busy ? 5000 : false
    },
  })

  const retryMutation = useMutation({
    mutationFn: retryCertificateProgram,
    onSuccess: () => {
      toast.success("Batch queued", "Processing will continue in the background.")
      queryClient.invalidateQueries({ queryKey: ["admin-certificate-programs"] })
      refetch()
    },
    onError: (error) => toast.error("Retry failed", getUserFriendlyError(error, "generic")),
  })

  const programs = data?.results ?? []

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      setDeletingId(pendingDelete.id)
      await deleteCertificateProgram(pendingDelete.id)
      toast.success("Batch deleted")
      await queryClient.invalidateQueries({ queryKey: ["admin-certificate-programs"] })
      refetch()
      setPendingDelete(null)
    } catch (error) {
      toast.error("Delete failed", getUserFriendlyError(error, "generic"))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Administration</p>
          <h1 className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">Certificates</h1>
          <p className="mt-1 text-sm text-[#5f5e5e]">
            Upload templates and Excel lists to issue certificates at scale. Matching uses each user&apos;s official ID
            on their profile (with safe fallbacks).
          </p>
        </div>
        <Link
          to="/admin/certificates/new"
          className="flex items-center gap-2 bg-[#af0f24] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#930019]"
        >
          <Plus size={20} />
          New batch
        </Link>
      </div>

      <div className="space-y-4 rounded-sm border border-[#e2e2e2] bg-white p-4 shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-xl bg-[#ececec]" />
            <div className="h-24 animate-pulse rounded-xl bg-[#ececec]" />
          </div>
        ) : programs.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#5f5e5e]">
            No batches yet. Create one to upload a template and recipient list.
          </p>
        ) : (
          <div className="space-y-3">
            {programs.map((p) => {
              const sum = p.batch_summary || {}
              const matched = typeof sum.matched === "number" ? sum.matched : undefined
              const skipped = typeof sum.skipped_no_user === "number" ? sum.skipped_no_user : undefined
              const thumb = resolveMediaUrl(p.template_image)
              return (
                <article
                  key={p.id}
                  className="flex flex-col gap-4 rounded-xl border border-[#ececec] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 gap-4">
                    {thumb ? (
                      <img src={thumb} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="h-20 w-28 shrink-0 rounded-lg bg-[#f3f3f3]" />
                    )}
                    <div className="min-w-0">
                      <Link
                        to={`/admin/certificates/${p.id}`}
                        className="truncate text-lg font-bold text-[#1a1c1c] hover:text-[#af0f24]"
                      >
                        {p.title}
                      </Link>
                      <p className="mt-1 text-xs text-[#5f5e5e]">
                        Issued: {p.issued_date}
                        {p.valid_until ? ` · Valid until ${p.valid_until}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadge(p.batch_status)}`}
                        >
                          {p.batch_status_display || p.batch_status}
                        </span>
                        {matched !== undefined ? (
                          <span className="text-xs text-[#5f5e5e]">
                            Matched {matched}
                            {skipped !== undefined ? ` · No portal user ${skipped}` : ""}
                          </span>
                        ) : null}
                      </div>
                      {p.batch_status === "FAILED" && sum.fatal ? (
                        <p className="mt-2 truncate text-xs text-red-700">{sum.fatal}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      to={`/admin/certificates/${p.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#af0f24]/40 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#af0f24] hover:bg-red-50"
                    >
                      Details
                    </Link>
                    {p.batch_status !== "PROCESSING" ? (
                      <button
                        type="button"
                        disabled={retryMutation.isPending}
                        onClick={() => retryMutation.mutate(p.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#ddd] px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#1a1c1c] hover:bg-[#f9f9f9] disabled:opacity-50"
                      >
                        <RefreshCw size={14} />
                        Re-run
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={deletingId === p.id}
                      onClick={() => setPendingDelete(p)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#e8bcbc] px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#af0f24] hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </article>
              )
            })}
            <PaginationControls page={page} count={data?.count ?? 0} onChange={setPage} />
          </div>
        )}
      </div>
      <ConfirmActionModal
        open={pendingDelete !== null}
        isLoading={deletingId === pendingDelete?.id}
        title="Delete batch"
        description={
          pendingDelete
            ? `Delete batch "${pendingDelete.title}"? Issued certificates from this batch will be removed.`
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

export default AdminCertificatesPage
