import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { listPosts } from "@/api/posts"
import type { UserRole } from "@/types/auth"
import { getRoleBasePath } from "@/lib/role-path"
import { resolveMediaUrl } from "@/lib/media-url"
import { formatAppDate } from "@/lib/datetime"
import { RoleContentLayout } from "@/components/layout/role-content-layout"
import { PaginationControls } from "@/components/content/pagination-controls"

function formatDate(value?: string) {
  if (!value) return "Unpublished"
  return formatAppDate(value)
}

export function NewsPage({ role }: { role: UserRole }) {
  const [page, setPage] = useState(1)
  const canSeeUnpublished = role === "ADMIN" || role === "STAFF"
  const { data, isLoading } = useQuery({
    queryKey: [role, "news-posts", page],
    queryFn: () =>
      listPosts({
        page,
        ...(canSeeUnpublished ? {} : { is_published: true }),
      }),
  })

  const posts = data?.results ?? []
  const basePath = getRoleBasePath(role)

  return (
    <RoleContentLayout
      role={role}
      title="Campus News"
      subtitle="Stories, announcements, and academic updates"
      maxWidthClassName="max-w-3xl"
    >
      <section className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="aspect-video animate-pulse rounded-2xl bg-[#ececec]" />
            <div className="aspect-video animate-pulse rounded-2xl bg-[#ececec]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e4beba] bg-white px-6 py-12 text-center">
            <p className="font-[var(--font-heading)] text-lg font-bold text-[#1a1c1c]">No news yet</p>
            <p className="mt-2 text-sm text-[#5f5e5e]">Check back soon for new announcements.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((post) => {
              const image = resolveMediaUrl(post.image) || post.image_url || ""
              const imageAspectClass = post.webinar ? "aspect-[4/5]" : "aspect-video"
              return (
                <article
                  key={post.id}
                  className="group overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-sm transition hover:border-[#e0d5d3] hover:shadow-md"
                >
                  <div className={`relative ${imageAspectClass} w-full overflow-hidden bg-[#f0f0f0]`}>
                    {image ? (
                      <img
                        src={image}
                        alt={post.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f7f7f7] to-[#ececec]">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#b5b5b5]">No cover</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#af0f24]/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#af0f24]">
                        {post.category_display || post.category}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8989]">
                        {formatDate(post.published_at)}
                      </span>
                    </div>
                    <h2 className="font-[var(--font-heading)] mt-3 text-xl font-extrabold tracking-tight text-[#1a1c1c] sm:text-2xl">
                      {post.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#5f5e5e]">{post.body}</p>
                    <div className="mt-5">
                      <Link
                        to={`${basePath}/news/${post.id}`}
                        className="inline-flex items-center rounded-lg bg-[#af0f24] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#930019]"
                      >
                        Read article
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
            <PaginationControls page={page} count={data?.count ?? 0} onChange={setPage} />
          </div>
        )}
      </section>
    </RoleContentLayout>
  )
}
