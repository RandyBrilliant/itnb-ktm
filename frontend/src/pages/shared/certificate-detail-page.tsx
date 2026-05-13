import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getCertificate } from "@/api/certificates"
import type { UserRole } from "@/types/auth"
import { getRoleBasePath } from "@/lib/role-path"
import { RoleContentLayout } from "@/components/layout/role-content-layout"

function formatDate(value?: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
}

export function CertificateDetailPage({ role }: { role: UserRole }) {
  const { id } = useParams<{ id: string }>()
  const certId = Number(id)
  const basePath = getRoleBasePath(role)
  const { data, isLoading } = useQuery({
    queryKey: [role, "certificate", certId],
    queryFn: () => getCertificate(certId),
    enabled: Number.isFinite(certId),
  })

  return (
    <RoleContentLayout role={role} title="Certificate Detail">
      <section className="space-y-4 rounded-2xl border border-[#ececec] bg-white p-5">
        <Link to={`${basePath}/certificates`} className="text-xs font-bold uppercase tracking-[0.12em] text-[#af0f24]">
          Back to Certificates
        </Link>
        {isLoading ? (
          <div className="h-60 animate-pulse rounded-xl bg-[#ececec]" />
        ) : data ? (
          <>
            {data.image_url ? <img src={data.image_url} alt={data.title} className="h-64 w-full rounded-xl object-cover" /> : null}
            <h1 className="text-3xl font-extrabold text-[#1a1c1c]">{data.title}</h1>
            {(data.recipient_name || data.recipient_id_display) && (
              <div className="rounded-xl border border-[#ececec] bg-[#fafafa] px-4 py-3 text-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a8a8a]">Awarded to</p>
                <p className="mt-1 text-lg font-bold text-[#1a1c1c]">{data.recipient_name || "—"}</p>
                {data.recipient_id_display ? (
                  <p className="mt-0.5 font-mono text-sm text-[#5f5e5e]">{data.recipient_id_display}</p>
                ) : null}
              </div>
            )}
            <p className="whitespace-pre-line text-sm leading-relaxed text-[#3b3b3b]">{data.description || "No description available."}</p>
            <div className="grid grid-cols-1 gap-2 text-sm text-[#5f5e5e] sm:grid-cols-2">
              <p>Issued: {formatDate(data.issued_date)}</p>
              <p>Valid Until: {formatDate(data.valid_until)}</p>
              <p>Status: {data.status_display || data.status}</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#5f5e5e]">Certificate not found.</p>
        )}
      </section>
    </RoleContentLayout>
  )
}

