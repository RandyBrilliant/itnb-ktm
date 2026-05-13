import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getBenefit } from "@/api/benefits"
import { benefitCoverUrl } from "@/lib/benefit-cover"
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

  const coverUrl = data ? benefitCoverUrl(data) : ""

  return (
    <RoleContentLayout role={role} title="Benefit detail" subtitle="Student benefits" maxWidthClassName="max-w-3xl">
      <article className="overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-sm">
        <Link
          to={`${basePath}/perks`}
          className="inline-flex px-5 pt-5 text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24] transition hover:text-[#930019]"
        >
          ← Back to Student Benefits
        </Link>

        {isLoading ? (
          <div className="px-5 pb-5">
            <div className="mt-4 aspect-video animate-pulse rounded-xl bg-[#ececec]" />
          </div>
        ) : data ? (
          <>
            <div className="relative mt-4 px-5">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#f0f0f0]">
                {coverUrl ? (
                  <img src={coverUrl} alt={data.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f7f7f7] to-[#ececec]">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#b5b5b5]">No cover image</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 px-5 py-6 sm:px-8 sm:py-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#af0f24]">
                {data.category?.name || "General"}
              </p>
              <h1 className="font-[var(--font-heading)] text-3xl font-extrabold leading-tight tracking-tight text-[#1a1c1c] sm:text-4xl">
                {data.title}
              </h1>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#8a8989]">
                {data.partner || "IT&B Partner"}
              </p>
              <div className="border-t border-[#f0f0f0] pt-6">
                <p className="whitespace-pre-line text-base leading-relaxed text-[#3b3b3b]">{data.description}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-[#5f5e5e]">This benefit could not be found.</p>
            <Link to={`${basePath}/perks`} className="mt-3 inline-block text-sm font-semibold text-[#af0f24]">
              Return to benefits
            </Link>
          </div>
        )}
      </article>
    </RoleContentLayout>
  )
}
