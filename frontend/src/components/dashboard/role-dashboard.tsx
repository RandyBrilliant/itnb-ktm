import { Link } from "react-router-dom"
import type { UserRole } from "@/types/auth"
import { useRoleDashboard } from "@/hooks/use-role-dashboard"
import { RoleShell } from "@/components/navigation/role-shell"
import { AnimatedPage } from "@/components/animation/animated-page"
import { motion } from "framer-motion"
import { resolveMediaUrl } from "@/lib/media-url"
import { getRoleBasePath } from "@/lib/role-path"
import { formatAcademicYearSubtitle } from "@/lib/academic-year"
import { formatAppDate } from "@/lib/datetime"
import type { PostItem } from "@/api/posts"

const ROLE_TITLE: Record<UserRole, string> = {
  STUDENT: "Dashboard",
  STAFF: "Operations",
  LECTURER: "Teaching Hub",
  ADMIN: "Admin",
  ALUMNI: "Alumni",
}

function formatAnnouncementDate(value?: string) {
  if (!value) return "Recently"
  return formatAppDate(value)
}

function announcementExcerpt(body: string, max = 100) {
  const plain = body.replace(/<[^>]+>/g, "").trim()
  if (!plain) return ""
  return plain.length > max ? `${plain.slice(0, max)}…` : plain
}

function sortLatestPosts(posts: PostItem[]) {
  return [...posts]
    .filter((post) => post.is_published)
    .sort((a, b) => {
      const aTime = new Date(a.published_at || a.created_at || 0).getTime()
      const bTime = new Date(b.published_at || b.created_at || 0).getTime()
      return bTime - aTime
    })
}

export function RoleDashboard({ role }: { role: UserRole }) {
  const { isBootLoading, isDataLoading, me, posts, stats } = useRoleDashboard(role)
  const basePath = getRoleBasePath(role)

  if (isBootLoading) {
    return (
      <div className="mx-auto max-w-md px-4 pt-4 pb-10">
        <div className="h-20 animate-pulse bg-[#e8e8e8]" />
        <div className="mt-6 h-72 animate-pulse bg-[#e8e8e8]" />
      </div>
    )
  }

  const photo = resolveMediaUrl(me?.photo) || undefined
  const latestAnnouncements = sortLatestPosts(posts).slice(0, 3)
  const academicYearLabel = formatAcademicYearSubtitle(me?.institutional_id)

  return (
    <RoleShell
      role={role}
      title={`${ROLE_TITLE[role]}`}
      avatarUrl={photo}
    >
      <AnimatedPage className="mx-auto max-w-md text-[#1a1c1c] lg:max-w-4xl">
        <div className="mb-8 flex items-end justify-between pt-2">
          <div className="flex">
            <div className="mr-4 h-16 w-2 bg-[#af0f24]" />
            <div>
              {academicYearLabel ? (
                <p className="text-xs font-bold tracking-[0.2em] text-[#af0f24]">
                  {academicYearLabel.toUpperCase()}
                </p>
              ) : null}
              <h1 className="text-4xl font-extrabold tracking-tight">{ROLE_TITLE[role]}</h1>
            </div>
          </div>
          <div className="text-right">
            <span
              className="material-symbols-outlined text-[#af0f24]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            <p className="text-[10px] font-bold uppercase text-[#5f5e5e]">Status: Active</p>
          </div>
        </div>

        <section className="mb-8 grid grid-cols-2 gap-4">
          <motion.div
            className="rounded-2xl bg-white p-6 shadow-[0px_6px_28px_rgba(175,15,36,0.05)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.05 }}
          >
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#af0f24]">
              {stats.leftLabel}
            </p>
            <h3 className="text-5xl font-extrabold">{isDataLoading ? "..." : stats.leftValue}</h3>
            <p className="mt-2 text-[10px] font-bold text-[#5f5e5e]">
              {isDataLoading ? "Updating data..." : stats.leftHint}
            </p>
          </motion.div>
          <motion.div
            className="rounded-2xl bg-white p-6 shadow-[0px_6px_28px_rgba(175,15,36,0.05)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.09 }}
          >
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#af0f24]">
              {stats.rightLabel}
            </p>
            <h3 className="text-5xl font-extrabold">{isDataLoading ? "..." : stats.rightValue}</h3>
            <p className="mt-2 text-[10px] font-bold text-[#5f5e5e]">
              {isDataLoading ? "Updating data..." : stats.rightHint}
            </p>
          </motion.div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 bg-[#af0f24]" />
              <h2 className="text-sm font-black uppercase tracking-tight">Latest Announcements</h2>
            </div>
            <Link
              to={`${basePath}/news`}
              className="text-[10px] font-bold uppercase text-[#af0f24] hover:underline"
            >
              View all news
            </Link>
          </div>
          <div className="space-y-3">
            {isDataLoading ? (
              <div className="rounded-xl bg-[#f3f3f3] p-4 text-sm text-[#5f5e5e]">Loading announcements…</div>
            ) : latestAnnouncements.length === 0 ? (
              <div className="rounded-xl bg-[#f3f3f3] p-4 text-sm text-[#5f5e5e]">
                No announcements yet. Check back soon for campus updates.
              </div>
            ) : (
              latestAnnouncements.map((post) => {
                const image = resolveMediaUrl(post.image) || post.image_url || ""
                const excerpt = announcementExcerpt(post.body)
                return (
                  <motion.div
                    key={post.id}
                    className="overflow-hidden rounded-xl border border-[#ececec] bg-white"
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.16 }}
                  >
                    <Link to={`${basePath}/news/${post.id}`} className="flex gap-4 p-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#f0f0f0]">
                        {image ? (
                          <img src={image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#af0f24]">
                            <span className="material-symbols-outlined text-2xl">campaign</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#af0f24]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#af0f24]">
                            {post.category_display || post.category}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                            {formatAnnouncementDate(post.published_at || post.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm font-bold text-[#1a1c1c]">{post.title}</p>
                        {excerpt ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#5f5e5e]">{excerpt}</p>
                        ) : null}
                      </div>
                      <span className="material-symbols-outlined shrink-0 self-center text-[#af0f24]/40">
                        arrow_forward_ios
                      </span>
                    </Link>
                  </motion.div>
                )
              })
            )}
          </div>
        </section>

      </AnimatedPage>
    </RoleShell>
  )
}
