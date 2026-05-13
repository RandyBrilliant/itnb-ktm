import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { listBenefits } from "@/api/benefits"
import { benefitCoverUrl } from "@/lib/benefit-cover"
import { COVER_IMAGE_SPEC } from "@/lib/media-guidelines"
import type { UserRole } from "@/types/auth"
import { getRoleBasePath } from "@/lib/role-path"
import { RoleContentLayout } from "@/components/layout/role-content-layout"
import { PaginationControls } from "@/components/content/pagination-controls"

export function PerksPage({ role }: { role: UserRole }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: [role, "benefits", page],
    queryFn: () => listBenefits(page),
  })

  const benefits = data?.results ?? []
  const basePath = getRoleBasePath(role)
  const categories = useMemo(
    () =>
      Array.from(new Map(benefits.filter((item) => item.category).map((item) => [item.category!.id, item.category!])).values()),
    [benefits]
  )
  const filtered = useMemo(
    () => (selectedCategoryId == null ? benefits : benefits.filter((item) => item.category?.id === selectedCategoryId)),
    [benefits, selectedCategoryId]
  )

  return (
    <RoleContentLayout
      role={role}
      title="Student Benefits"
      subtitle="Partner perks and institutional offers"
      maxWidthClassName="max-w-5xl"
    >
      <section className="space-y-6">
        <div className="rounded-2xl border border-[#ececec] bg-gradient-to-br from-white to-[#fafafa] px-5 py-4 shadow-[0_1px_0_rgba(175,15,36,0.06)]">
          <p className="text-sm leading-relaxed text-[#5f5e5e]">
            Browse discounts, tools, and programmes aligned with your role. Listing tiles use{" "}
            <span className="font-semibold text-[#1a1c1c]">{COVER_IMAGE_SPEC.aspectRatio}</span> imagery (
            {COVER_IMAGE_SPEC.recommendedPixels} recommended) for a uniform grid on every screen size.
          </p>
        </div>

        <div className="rounded-2xl border border-[#ececec] bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a8989]">Filter by category</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategoryId(null)}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                selectedCategoryId == null
                  ? "bg-[#af0f24] text-white shadow-sm"
                  : "bg-[#f3f3f3] text-[#5f5e5e] hover:bg-[#ebebeb]"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                  selectedCategoryId === cat.id
                    ? "bg-[#af0f24] text-white shadow-sm"
                    : "bg-[#f3f3f3] text-[#5f5e5e] hover:bg-[#ebebeb]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="aspect-video animate-pulse rounded-2xl bg-[#ececec]" />
            <div className="aspect-video animate-pulse rounded-2xl bg-[#ececec]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e4beba] bg-white px-6 py-12 text-center">
            <p className="font-[var(--font-heading)] text-lg font-bold text-[#1a1c1c]">No benefits in this view</p>
            <p className="mt-2 text-sm text-[#5f5e5e]">Try another category or check back later.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {filtered.map((benefit) => {
                const coverUrl = benefitCoverUrl(benefit)
                return (
                  <article
                    key={benefit.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-sm transition hover:border-[#e0d5d3] hover:shadow-md"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-[#f0f0f0]">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={benefit.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f7f7f7] to-[#ececec]">
                          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#b5b5b5]">Benefit</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#af0f24]">
                        {benefit.category?.name || "General"}
                      </p>
                      <h2 className="font-[var(--font-heading)] mt-2 text-lg font-extrabold leading-snug text-[#1a1c1c]">
                        {benefit.title}
                      </h2>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8989]">
                        {benefit.partner || "IT&B Partner"}
                      </p>
                      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-[#5f5e5e]">
                        {benefit.description_short || benefit.description}
                      </p>
                      <div className="mt-4">
                        <Link
                          to={`${basePath}/perks/${benefit.id}`}
                          className="inline-flex w-full items-center justify-center rounded-lg border border-[#af0f24] bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24] transition hover:bg-[#af0f24] hover:text-white sm:w-auto"
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
            <PaginationControls page={page} count={data?.count ?? 0} onChange={setPage} />
          </>
        )}
      </section>
    </RoleContentLayout>
  )
}
