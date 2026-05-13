import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { addCertificateProgramRecipient, getCertificateProgram } from "@/api/certificate-programs"
import {
  listCertificates,
  openCertificatePdfInNewTab,
  suspendCertificate,
  unsuspendCertificate,
  type CertificateItem,
} from "@/api/certificates"
import { getUserFriendlyError } from "@/lib/error-message"
import { toast } from "@/lib/toast"
import { PaginationControls } from "@/components/content/pagination-controls"

export function AdminCertificateProgramDetailPage() {
  const { programId } = useParams<{ programId: string }>()
  const id = Number(programId)
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [displayName, setDisplayName] = useState("")
  const [idRaw, setIdRaw] = useState("")
  const [viewingId, setViewingId] = useState<number | null>(null)

  const { data: program, isLoading: programLoading } = useQuery({
    queryKey: ["certificate-program", id],
    queryFn: () => getCertificateProgram(id),
    enabled: Number.isFinite(id),
  })

  const { data: certData, isLoading: certsLoading } = useQuery({
    queryKey: ["certificate-program-certs", id, page],
    queryFn: () => listCertificates(page, { programId: id }),
    enabled: Number.isFinite(id),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["certificate-program-certs", id] })
    queryClient.invalidateQueries({ queryKey: ["certificate-program", id] })
  }

  const addMutation = useMutation({
    mutationFn: () => addCertificateProgramRecipient(id, { display_name: displayName.trim(), id_raw: idRaw.trim() }),
    onSuccess: () => {
      toast.success("Recipient added", "Certificate generated and linked to the user’s account.")
      setDisplayName("")
      setIdRaw("")
      invalidate()
    },
    onError: (e) => toast.error("Could not add recipient", getUserFriendlyError(e, "generic")),
  })

  const suspendMut = useMutation({
    mutationFn: suspendCertificate,
    onSuccess: () => {
      toast.success("Certificate hidden", "It will not appear in the student’s portal list.")
      invalidate()
    },
    onError: (e) => toast.error("Action failed", getUserFriendlyError(e, "generic")),
  })

  const unsuspendMut = useMutation({
    mutationFn: unsuspendCertificate,
    onSuccess: () => {
      toast.success("Certificate restored", "The recipient can see it again in their portal.")
      invalidate()
    },
    onError: (e) => toast.error("Action failed", getUserFriendlyError(e, "generic")),
  })

  const handleViewCertificate = async (cert: CertificateItem) => {
    const label = cert.recipient_name?.trim() || cert.user?.full_name || cert.user?.email || "Certificate"
    try {
      setViewingId(cert.id)
      await openCertificatePdfInNewTab(cert.id)
    } catch (error) {
      const msg =
        error instanceof Error && error.message === "Popup blocked"
          ? "Allow pop-ups for this site."
          : `Unable to load PDF for ${label}.`
      toast.error("Could not open certificate", msg)
    } finally {
      setViewingId(null)
    }
  }

  if (!Number.isFinite(id)) {
    return (
      <div className="p-6 text-sm text-red-700">
        Invalid program. <Link to="/admin/certificates" className="font-bold text-[#af0f24]">Back</Link>
      </div>
    )
  }

  const certs = certData?.results ?? []

  return (
    <div className="space-y-8">
      <div>
        <Link to="/admin/certificates" className="text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24]">
          ← All batches
        </Link>
        {programLoading ? (
          <div className="mt-4 h-10 w-2/3 animate-pulse rounded bg-[#ececec]" />
        ) : program ? (
          <>
            <h1 className="font-[var(--font-heading)] mt-2 text-4xl font-extrabold text-[#1a1c1c]">{program.title}</h1>
            <p className="mt-1 text-sm text-[#5f5e5e]">
              Issued {program.issued_date}
              {program.valid_until ? ` · Valid until ${program.valid_until}` : ""}
              {program.batch_status ? (
                <span className="ml-2 rounded-full bg-[#ececec] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  {program.batch_status_display || program.batch_status}
                </span>
              ) : null}
            </p>
            {program.description ? (
              <p className="mt-3 max-w-3xl text-sm text-[#3b3b3b]">{program.description}</p>
            ) : null}
          </>
        ) : (
          <p className="mt-4 text-sm text-[#5f5e5e]">Program not found.</p>
        )}
      </div>

      <section className="rounded-sm border border-[#e2e2e2] bg-white p-6 shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
        <h2 className="text-lg font-bold text-[#1a1c1c]">Add recipient manually</h2>
        <p className="mt-1 text-sm text-[#5f5e5e]">
          Same rules as Excel: name appears on the PDF; ID is used only to find the portal account.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="block space-y-1 md:col-span-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Display name</span>
            <input
              className="w-full rounded-sm border border-[#ddd] px-3 py-2 text-sm"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="As printed on certificate"
            />
          </label>
          <label className="block space-y-1 md:col-span-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">ID (match user)</span>
            <input
              className="w-full rounded-sm border border-[#ddd] px-3 py-2 text-sm font-mono"
              value={idRaw}
              onChange={(e) => setIdRaw(e.target.value)}
              placeholder="Institutional ID, email, or card number"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              disabled={addMutation.isPending || !displayName.trim() || !idRaw.trim()}
              onClick={() => addMutation.mutate()}
              className="rounded-sm bg-[#af0f24] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#930019] disabled:opacity-50"
            >
              {addMutation.isPending ? "Adding…" : "Add & issue"}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[#1a1c1c]">Recipients ({certData?.count ?? 0})</h2>
        {certsLoading ? (
          <div className="h-40 animate-pulse rounded-xl bg-[#ececec]" />
        ) : certs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#e4beba] bg-white py-10 text-center text-sm text-[#5f5e5e]">
            No issued certificates for this batch yet. Wait for processing to finish or add a recipient above.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-[#ececec] bg-white">
              <table className="min-w-full divide-y divide-[#ececec] text-sm">
                <thead className="bg-[#fafafa] text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a8a8a]">
                  <tr>
                    <th className="px-4 py-3">Certificate name</th>
                    <th className="px-4 py-3">ID on PDF</th>
                    <th className="px-4 py-3">Portal user</th>
                    <th className="px-4 py-3">Inst. ID</th>
                    <th className="px-4 py-3">Portal</th>
                    <th className="px-4 py-3 text-right">Certificate & actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec]">
                  {certs.map((c: CertificateItem) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-semibold text-[#1a1c1c]">{c.recipient_name || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#5f5e5e]">{c.recipient_id_display || "—"}</td>
                      <td className="px-4 py-3 text-[#3b3b3b]">
                        <span className="block truncate max-w-[200px]" title={c.user?.email}>
                          {c.user?.full_name || c.user?.email || "—"}
                        </span>
                        <span className="text-xs text-[#8a8a8a]">{c.user?.email}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{c.user?.institutional_id || "—"}</td>
                      <td className="px-4 py-3">
                        {c.is_suspended ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                            Hidden
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
                            Visible
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={viewingId === c.id}
                            onClick={() => handleViewCertificate(c)}
                            className="rounded-lg bg-[#af0f24] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-white hover:bg-[#930019] disabled:opacity-60"
                            title={`Open PDF — ${c.recipient_name || c.user?.full_name || ""}`}
                          >
                            {viewingId === c.id ? "Opening…" : "View certificate"}
                          </button>
                          {c.is_suspended ? (
                            <button
                              type="button"
                              disabled={unsuspendMut.isPending}
                              onClick={() => unsuspendMut.mutate(c.id)}
                              className="rounded-lg border border-[#ddd] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#1a1c1c] hover:bg-[#f9f9f9] disabled:opacity-50"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={suspendMut.isPending}
                              onClick={() => suspendMut.mutate(c.id)}
                              className="rounded-lg border border-[#e8bcbc] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#af0f24] hover:bg-red-50 disabled:opacity-50"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls page={page} count={certData?.count ?? 0} onChange={setPage} />
          </>
        )}
      </section>
    </div>
  )
}

export default AdminCertificateProgramDetailPage
