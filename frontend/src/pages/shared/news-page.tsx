import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { listPosts } from "@/api/posts"
import type { UserRole } from "@/types/auth"
import { getRoleBasePath } from "@/lib/role-path"
import { resolveMediaUrl } from "@/lib/media-url"
import { RoleContentLayout } from "@/components/layout/role-content-layout"
import { PaginationControls } from "@/components/content/pagination-controls"

function formatDate(value?: string) {
  if (!value) return "Unpublished"
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
}

export function NewsPage({ role }: { role: UserRole }) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: [role, "news-posts", page],
    queryFn: () => listPosts(page),
  })

  const posts = data?.results ?? []
  const basePath = getRoleBasePath(role)

  return (
    <RoleContentLayout role={role} title="Campus News">
      <section className="space-y-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-48 animate-pulse rounded-2xl bg-[#ececec]" />
            <div className="h-28 animate-pulse rounded-2xl bg-[#ececec]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e4beba] bg-white p-8 text-center">
            <p className="text-lg font-bold text-[#1a1c1c]">No news yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const image = resolveMediaUrl(post.image) || post.image_url || ""
              return (
                <article key={post.id} className="overflow-hidden rounded-2xl border border-[#ececec] bg-white">
                  {image ? <img src={image} alt={post.title} className="h-52 w-full object-cover" /> : null}
                  <div className="p-5">
                    <span className="rounded-full bg-[#af0f24]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#af0f24]">
                      {post.category_display || post.category}
                    </span>
                    <h2 className="mt-3 text-2xl font-extrabold text-[#1a1c1c]">{post.title}</h2>
                    <p className="mt-2 line-clamp-3 text-sm text-[#5f5e5e]">{post.body}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#af0f24]">
                        {formatDate(post.published_at)}
                      </p>
                      <Link
                        to={`${basePath}/news/${post.id}`}
                        className="rounded-lg border border-[#ddd] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#1a1c1c]"
                      >
                        Read More
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

