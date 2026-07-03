import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  listCertificates,
  openCertificatePdfInNewTab,
  type CertificateItem,
} from "@/api/certificates"
import { PaginationControls } from "@/components/content/pagination-controls"
import { certificatePdfAvailable } from "@/lib/certificate-pdf"
import { formatAppDate } from "@/lib/datetime"
import { toast } from "@/lib/toast"

function formatDate(value?: string | null) {
  if (!value) return "—"
  return formatAppDate(value)
}

function roleFromDescription(description?: string) {
  if (!description) return ""
  for (const line of description.split("\n")) {
    if (line.startsWith("Role: ")) return line.slice(6).trim()
  }
  return ""
}

export function AdminStudentCertificatesSection({ userId }: { userId: number }) {
  const [page, setPage] = useState(1)
  const [openingId, setOpeningId] = useState<number | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-student-certificates", userId, page],
    queryFn: () => listCertificates(page, { userId, pageSize: 20 }),
    enabled: Number.isFinite(userId),
  })

  const certificates = data?.results ?? []

  const handleOpenPdf = async (cert: CertificateItem) => {
    if (!certificatePdfAvailable(cert)) return
    try {
      setOpeningId(cert.id)
      await openCertificatePdfInNewTab(cert.id)
    } catch (error) {
      const msg =
        error instanceof Error && error.message === "Popup blocked"
          ? "Allow pop-ups for this site."
          : "Unable to open certificate PDF."
      toast.error("Could not open PDF", msg)
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <section className="rounded-sm border border-[#e2e2e2] bg-white p-6 shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[#1a1c1c]">Certificates</h2>
          <p className="mt-1 text-sm text-[#5f5e5e]">
            Issued certificates linked to this student record.
          </p>
        </div>
        {!isLoading && !isError ? (
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">
            {data?.count ?? 0} total
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-lg bg-[#ececec]" />
      ) : isError ? (
        <p className="text-sm text-[#5f5e5e]">Could not load certificates.</p>
      ) : certificates.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#e4beba] bg-[#fafafa] px-4 py-8 text-center text-sm text-[#5f5e5e]">
          No certificates for this student yet.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#ececec] text-xs font-bold uppercase tracking-[0.1em] text-[#5f5e5e]">
                <tr>
                  <th className="px-3 py-3">Event / title</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Issued</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {certificates.map((cert) => {
                  const pdfReady = certificatePdfAvailable(cert)
                  return (
                    <tr key={cert.id}>
                      <td className="px-3 py-3 font-semibold text-[#1a1c1c]">{cert.title}</td>
                      <td className="px-3 py-3 text-[#3b3b3b]">
                        {roleFromDescription(cert.description) || "—"}
                      </td>
                      <td className="px-3 py-3 text-[#5f5e5e]">{formatDate(cert.issued_date)}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-[#af0f24]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#af0f24]">
                          {cert.status_display || cert.status}
                        </span>
                        {cert.is_suspended ? (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                            Hidden
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {pdfReady ? (
                          <button
                            type="button"
                            disabled={openingId === cert.id}
                            onClick={() => handleOpenPdf(cert)}
                            className="rounded-lg border border-[#ddd] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#1a1c1c] hover:bg-[#f9f9f9] disabled:opacity-60"
                          >
                            {openingId === cert.id ? "Opening…" : "View PDF"}
                          </button>
                        ) : (
                          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9a9a9a]">
                            Unavailable
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <PaginationControls page={page} count={data?.count ?? 0} onChange={setPage} />
        </>
      )}
    </section>
  )
}
