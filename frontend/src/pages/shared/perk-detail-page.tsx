import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getBenefit } from "@/api/benefits"
import type { UserRole } from "@/types/auth"
import { getRoleBasePath } from "@/lib/role-path"
import { RoleContentLayout } from "@/components/layout/role-content-layout"

export function PerkDetailPage({ role }: { role: UserRole }) {
  const { id } = useParams<{ id: string }>()
  const benefitId = Number(id)
  const basePath = getRoleBasePath(role)
  const { data, isLoading } = useQuery({
    queryKey: [role, "perk", benefitId],
    queryFn: () => getBenefit(benefitId),
    enabled: Number.isFinite(benefitId),
  })

  return (
    <RoleContentLayout role={role} title="Perk Detail">
      <section className="space-y-4 rounded-2xl border border-[#ececec] bg-white p-5">
        <Link to={`${basePath}/perks`} className="text-xs font-bold uppercase tracking-[0.12em] text-[#af0f24]">
          Back to Perks
        </Link>
        {isLoading ? (
          <div className="h-60 animate-pulse rounded-xl bg-[#ececec]" />
        ) : data ? (
          <>
            {data.image_url ? <img src={data.image_url} alt={data.title} className="h-64 w-full rounded-xl object-cover" /> : null}
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#af0f24]">{data.category?.name || "General"}</p>
            <h1 className="text-3xl font-extrabold text-[#1a1c1c]">{data.title}</h1>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">{data.partner || "IT&B Partner"}</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-[#3b3b3b]">{data.description}</p>
          </>
        ) : (
          <p className="text-sm text-[#5f5e5e]">Perk not found.</p>
        )}
      </section>
    </RoleContentLayout>
  )
}

