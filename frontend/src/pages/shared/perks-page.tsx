import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { listBenefits } from "@/api/benefits"
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
    () => Array.from(new Map(benefits.filter((item) => item.category).map((item) => [item.category.id, item.category])).values()),
    [benefits]
  )
  const filtered = useMemo(
    () => (selectedCategoryId == null ? benefits : benefits.filter((item) => item.category?.id === selectedCategoryId)),
    [benefits, selectedCategoryId]
  )

  return (
    <RoleContentLayout role={role} title="Perks & Benefits">
      <section className="space-y-5">
        <div className="rounded-2xl border border-[#ececec] bg-white p-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategoryId(null)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                selectedCategoryId == null ? "bg-[#af0f24] text-white" : "bg-[#f3f3f3] text-[#5f5e5e]"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                  selectedCategoryId === cat.id ? "bg-[#af0f24] text-white" : "bg-[#f3f3f3] text-[#5f5e5e]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="h-40 animate-pulse rounded-2xl bg-[#ececec]" />
            <div className="h-40 animate-pulse rounded-2xl bg-[#ececec]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e4beba] bg-white p-8 text-center">
            <p className="text-lg font-bold text-[#1a1c1c]">No perks found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filtered.map((benefit) => (
                <article key={benefit.id} className="overflow-hidden rounded-2xl border border-[#ececec] bg-white transition-shadow hover:shadow-sm">
                  {benefit.image_url ? <img src={benefit.image_url} alt={benefit.title} className="h-40 w-full object-cover" /> : null}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#af0f24]">
                          {benefit.category?.name || "General"}
                        </p>
                        <p className="mt-1 text-lg font-bold text-[#1a1c1c]">{benefit.title}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">
                          {benefit.partner || "IT&B Partner"}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                        benefit.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
                      }`}>
                        {benefit.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm text-[#5f5e5e]">{benefit.description_short || benefit.description}</p>
                    <div className="mt-3">
                      <Link
                        to={`${basePath}/perks/${benefit.id}`}
                        className="rounded-lg border border-[#ddd] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#1a1c1c]"
                      >
                        Read More
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <PaginationControls page={page} count={data?.count ?? 0} onChange={setPage} />
          </>
        )}
      </section>
    </RoleContentLayout>
  )
}

