import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getPost } from "@/api/posts"
import type { UserRole } from "@/types/auth"
import { resolveMediaUrl } from "@/lib/media-url"
import { getRoleBasePath } from "@/lib/role-path"
import { RoleContentLayout } from "@/components/layout/role-content-layout"

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
    <RoleContentLayout role={role} title="News Detail">
      <section className="space-y-4 rounded-2xl border border-[#ececec] bg-white p-5">
        <Link to={`${basePath}/news`} className="text-xs font-bold uppercase tracking-[0.12em] text-[#af0f24]">
          Back to News
        </Link>
        {isLoading ? (
          <div className="h-60 animate-pulse rounded-xl bg-[#ececec]" />
        ) : data ? (
          <>
            {image ? <img src={image} alt={data.title} className="h-64 w-full rounded-xl object-cover" /> : null}
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#af0f24]">{data.category_display || data.category}</p>
            <h1 className="text-3xl font-extrabold text-[#1a1c1c]">{data.title}</h1>
            <p className="whitespace-pre-line text-sm leading-relaxed text-[#3b3b3b]">{data.body}</p>
          </>
        ) : (
          <p className="text-sm text-[#5f5e5e]">News item not found.</p>
        )}
      </section>
    </RoleContentLayout>
  )
}

