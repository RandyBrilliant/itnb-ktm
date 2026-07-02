import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { type UserRole } from "@/types/auth"
import { type CertificateItem, listCertificates, openCertificatePdfInNewTab } from "@/api/certificates"
import { DigitalCertificateCard } from "@/components/certificates/digital-certificate-card"
import { toast } from "@/lib/toast"
import { getRoleBasePath } from "@/lib/role-path"
import { formatAppDate } from "@/lib/datetime"
import { resolveMediaUrl } from "@/lib/media-url"
import { RoleContentLayout } from "@/components/layout/role-content-layout"
import { PaginationControls } from "@/components/content/pagination-controls"

function formatDate(value?: string | null) {
  if (!value) return "-"
  return formatAppDate(value)
}

function statusLabel(item: CertificateItem) {
  return item.status_display || item.status
}

export function CertificatesListSection({ role }: { role: UserRole }) {
  const [page, setPage] = useState(1)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: [role, "certificates", page],
    queryFn: () => listCertificates(page),
  })

  const certificates = data?.results ?? []
  const basePath = getRoleBasePath(role)

  const handleDownload = async (cert: CertificateItem) => {
    try {
      setDownloadingId(cert.id)
      await openCertificatePdfInNewTab(cert.id)
    } catch (error) {
      const msg = error instanceof Error && error.message === "Popup blocked" ? "Allow pop-ups for this site." : "Unable to open certificate right now."
      toast.error("Download failed", msg)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
      <section className="space-y-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-28 animate-pulse rounded-2xl bg-[#ececec]" />
            <div className="h-28 animate-pulse rounded-2xl bg-[#ececec]" />
          </div>
        ) : certificates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e4beba] bg-white p-8 text-center">
            <p className="text-lg font-bold text-[#1a1c1c]">No certificates yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert) => {
              const templateUrl = resolveMediaUrl(cert.program?.template_image ?? null)
              const hasCard = Boolean(templateUrl)

              return (
                <article key={cert.id} className="overflow-hidden rounded-2xl border border-[#ececec] bg-white">
                  {hasCard ? (
                    <div className="border-b border-[#ececec] bg-[#fafafa] p-4">
                      <DigitalCertificateCard
                        className="max-w-md"
                        templateUrl={templateUrl}
                        layout={cert.program?.layout}
                        name={cert.recipient_name || cert.user?.full_name || "—"}
                        studentId={cert.recipient_id_display || cert.user?.institutional_id || ""}
                      />
                    </div>
                  ) : resolveMediaUrl(cert.image_url) ? (
                    <img src={resolveMediaUrl(cert.image_url)} alt={cert.title} className="h-44 w-full object-cover" />
                  ) : null}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-[#1a1c1c]">{cert.title}</p>
                        {cert.recipient_name ? (
                          <p className="mt-0.5 text-sm font-semibold text-[#3b3b3b]">{cert.recipient_name}</p>
                        ) : null}
                        <p className="mt-1 text-sm text-[#5f5e5e]">{cert.description || "Official academic certificate"}</p>
                      </div>
                      <span className="rounded-full bg-[#af0f24]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#af0f24]">
                        {statusLabel(cert)}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#ececec] pt-3">
                      <div className="flex flex-wrap items-center gap-5 text-xs font-semibold uppercase tracking-[0.1em] text-[#5f5e5e]">
                        <span>Issued: {formatDate(cert.issued_date)}</span>
                        <span>Valid Until: {formatDate(cert.valid_until)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`${basePath}/certificates/${cert.id}`}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#af0f24] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDownload(cert)}
                          disabled={downloadingId === cert.id}
                          className="inline-flex items-center gap-2 rounded-lg border border-[#ddd] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#1a1c1c] disabled:opacity-60"
                        >
                          {downloadingId === cert.id ? "Preparing..." : "PDF"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
            <PaginationControls page={page} count={data?.count ?? 0} onChange={setPage} />
          </div>
        )}
      </section>
  )
}

export function CertificatesPage({ role }: { role: UserRole }) {
  return (
    <RoleContentLayout role={role} title="Certificates">
      <CertificatesListSection role={role} />
    </RoleContentLayout>
  )
}
