import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getPost } from "@/api/posts"
import type { UserRole } from "@/types/auth"
import { resolveMediaUrl } from "@/lib/media-url"
import { getRoleBasePath } from "@/lib/role-path"
import { formatAppDateFull } from "@/lib/datetime"
import { RoleContentLayout } from "@/components/layout/role-content-layout"
import { WebinarPostCta } from "@/components/content/webinar-post-cta"

function formatDate(value?: string) {
  if (!value) return ""
  return formatAppDateFull(value)
}

export function NewsDetailPage({ role }: { role: UserRole }) {
  const { id } = useParams<{ id: string }>()
  const postId = Number(id)
  const basePath = getRoleBasePath(role)
  const { data, isLoading } = useQuery({
    queryKey: [role, "news", postId],
    queryFn: () => getPost(postId),
    enabled: Number.isFinite(postId),
  })

  const image = resolveMediaUrl(data?.image) || data?.image_url || ""

  return (
    <RoleContentLayout role={role} title="Article" subtitle="Campus news" maxWidthClassName="max-w-3xl">
      <article className="overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-sm">
        <Link
          to={`${basePath}/news`}
          className="inline-flex px-5 pt-5 text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24] transition hover:text-[#930019]"
        >
          ← Back to Campus News
        </Link>

        {isLoading ? (
          <div className="px-5 pb-5">
            <div className="mt-4 aspect-video animate-pulse rounded-xl bg-[#ececec]" />
          </div>
        ) : data ? (
          <>
            <div className="relative mt-4 px-5">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#f0f0f0]">
                {image ? (
                  <img src={image} alt={data.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f7f7f7] to-[#ececec]">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#b5b5b5]">No cover image</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 px-5 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8989]">
                <span className="rounded-full bg-[#af0f24]/12 px-3 py-1 text-[#af0f24]">
                  {data.category_display || data.category}
                </span>
                {data.published_at ? <span>{formatDate(data.published_at)}</span> : null}
              </div>
              <h1 className="font-[var(--font-heading)] text-3xl font-extrabold leading-tight tracking-tight text-[#1a1c1c] sm:text-4xl">
                {data.title}
              </h1>
              <div className="border-t border-[#f0f0f0] pt-6">
                <p className="whitespace-pre-line text-base leading-relaxed text-[#3b3b3b]">{data.body}</p>
              </div>
              {data.webinar ? (
                <WebinarPostCta webinar={data.webinar} role={role} postId={data.id} />
              ) : null}
            </div>
          </>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-[#5f5e5e]">This article could not be found.</p>
            <Link to={`${basePath}/news`} className="mt-3 inline-block text-sm font-semibold text-[#af0f24]">
              Return to news
            </Link>
          </div>
        )}
      </article>
    </RoleContentLayout>
  )
}
