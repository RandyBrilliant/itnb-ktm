import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getCertificate, openCertificatePdfInNewTab } from "@/api/certificates"
import { DigitalCertificateCard } from "@/components/certificates/digital-certificate-card"
import type { UserRole } from "@/types/auth"
import { getRoleBasePath } from "@/lib/role-path"
import { formatAppDate } from "@/lib/datetime"
import { resolveMediaUrl } from "@/lib/media-url"
import { RoleContentLayout } from "@/components/layout/role-content-layout"
import { PersonNameBlock } from "@/components/profile/person-name-block"
import { toast } from "@/lib/toast"

function formatDate(value?: string | null) {
  if (!value) return "-"
  return formatAppDate(value)
}

export function CertificateDetailPage({ role }: { role: UserRole }) {
  const { id } = useParams<{ id: string }>()
  const certId = Number(id)
  const basePath = getRoleBasePath(role)
  const [downloading, setDownloading] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: [role, "certificate", certId],
    queryFn: () => getCertificate(certId),
    enabled: Number.isFinite(certId),
  })

  const templateUrl = resolveMediaUrl(data?.program?.template_image ?? null)
  const canShowCard = Boolean(templateUrl && data)

  const handleDownload = async () => {
    if (!data) return
    try {
      setDownloading(true)
      await openCertificatePdfInNewTab(data.id)
    } catch {
      toast.error("Download failed", "Unable to generate PDF right now.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <RoleContentLayout role={role} title="Certificate">
      <section className="space-y-5">
        <Link to={`${basePath}/certificates`} className="text-xs font-bold uppercase tracking-[0.12em] text-[#af0f24]">
          Back to Certificates
        </Link>

        {isLoading ? (
          <div className="h-80 animate-pulse rounded-xl bg-[#ececec]" />
        ) : data ? (
          <>
            {canShowCard ? (
              <div className="space-y-4">
                <DigitalCertificateCard
                  templateUrl={templateUrl}
                  layout={data.program?.layout}
                  name={data.recipient_name || data.user?.full_name || "—"}
                  studentId={data.recipient_id_display || data.user?.institutional_id || ""}
                />
                <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-[#5f5e5e]">
                  Your personalized certificate
                </p>
              </div>
            ) : resolveMediaUrl(data.image_url) ? (
              <img src={resolveMediaUrl(data.image_url)} alt={data.title} className="mx-auto max-h-96 w-full rounded-xl object-contain" />
            ) : null}

            <div className="rounded-2xl border border-[#ececec] bg-white p-5">
              <h1 className="text-2xl font-extrabold text-[#1a1c1c]">{data.title}</h1>
              <PersonNameBlock
                className="mt-2"
                name={data.recipient_name || data.user?.full_name || "—"}
                institutionalId={data.recipient_id_display || data.user?.institutional_id}
                role={data.user?.role}
                nameClassName="text-sm font-semibold text-[#3b3b3b]"
                institutionalIdClassName="text-xs font-mono text-[#5f5e5e]"
              />
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#3b3b3b]">
                {data.description || "Official academic certificate"}
              </p>
              <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-[#5f5e5e] sm:grid-cols-2">
                <p>Issued: {formatDate(data.issued_date)}</p>
                <p>Valid until: {formatDate(data.valid_until)}</p>
                <p>Status: {data.status_display || data.status}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-[#ececec] pt-4">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#ddd] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#1a1c1c] disabled:opacity-60"
                >
                  {downloading ? "Preparing…" : "Download PDF"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#5f5e5e]">Certificate not found.</p>
        )}
      </section>
    </RoleContentLayout>
  )
}
