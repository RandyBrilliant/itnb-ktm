import { Link } from "react-router-dom"
import { ArrowRight, Plus } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { AdminQuickAction } from "@/components/admin/admin-quick-action"
import { formatAppDate } from "@/lib/datetime"
import { useAdminDashboardStats, useAdminRecentPosts } from "@/hooks/use-admin-dashboard-stats"

function previewText(raw: string, max = 140) {
  const plain = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  if (plain.length <= max) return plain
  return `${plain.slice(0, max)}…`
}

export function AdminDashboardPage() {
  const { user } = useAuth()
  const {
    studentCount,
    postsCount,
    benefitsCount,
    programsCount,
    isLoading: statsLoading,
    hasError,
  } = useAdminDashboardStats()
  const { data: recentPosts, isLoading: postsLoading } = useAdminRecentPosts()

  const displayCount = (n: number | null) => {
    if (statsLoading && n === null) return "…"
    if (hasError && n === null) return "—"
    return String(n ?? 0)
  }

  const featured = recentPosts?.results?.[0]
  const rows = recentPosts?.results ?? []

  const greeting = user?.full_name?.trim() || user?.email || "there"

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#af0f24]">Institutional dashboard</span>
          <h1 className="font-[var(--font-heading)] text-4xl font-extrabold tracking-tight text-[#1a1c1c] md:text-5xl">
            Welcome back, {greeting.split(" ")[0]}.
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[#5f5e5e]">
            Real-time overview of student records, campus news, active benefits, and certificate programs.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/posts/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#af0f24] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(175,15,36,0.25)] transition hover:bg-[#930019]"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
            New post
          </Link>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 rounded-lg border border-[#d5d5d5] bg-white px-6 py-3 text-sm font-bold text-[#1a1c1c] transition hover:bg-[#f5f5f5]"
          >
            Student records
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          title="Student records"
          icon="school"
          value={displayCount(studentCount)}
          hint="Accounts with role Student"
          accent="success"
        />
        <AdminStatCard
          title="Campus news"
          icon="newspaper"
          value={displayCount(postsCount)}
          hint="Posts in the news module"
          accent="neutral"
        />
        <AdminStatCard
          title="Active benefits"
          icon="sell"
          value={displayCount(benefitsCount)}
          hint="Benefits marked active"
          accent="neutral"
        />
        <AdminStatCard
          title="Certificate programs"
          icon="verified_user"
          value={displayCount(programsCount)}
          hint="Programs configured for issuance"
          accent="neutral"
        />
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-4">
          <div className="border-l-4 border-[#af0f24] pl-4">
            <h2 className="font-[var(--font-heading)] text-xl font-bold uppercase tracking-tight">Quick links</h2>
            <p className="text-sm text-[#5f5e5e]">Jump to common admin tasks</p>
          </div>

          <div className="space-y-3">
            <AdminQuickAction title="Student Records & import" icon="person_book" href="/admin/users" />
            <AdminQuickAction title="Campus News" icon="newspaper" href="/admin/posts" />
            <AdminQuickAction title="Student Benefits" icon="sell" href="/admin/benefits" />
            <AdminQuickAction title="Certificates" icon="workspace_premium" href="/admin/certificates" />
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#af0f24] to-[#8b0c22] p-8 text-white shadow-[0_16px_40px_rgba(175,15,36,0.35)]">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">Spotlight</span>
            {featured ? (
              <>
                <h3 className="mt-3 font-[var(--font-heading)] text-lg font-bold leading-snug">{featured.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-white/85">{previewText(featured.body)}</p>
                <Link
                  to={`/admin/posts/${featured.id}/edit`}
                  className="mt-5 inline-flex items-center gap-1 border-b border-white/70 pb-0.5 text-xs font-bold uppercase tracking-wider text-white transition hover:border-white"
                >
                  Edit post
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <>
                <h3 className="mt-3 font-[var(--font-heading)] text-lg font-bold leading-snug">Publish campus news</h3>
                <p className="mt-2 text-sm text-white/85">
                  No posts yet or still loading. Share announcements with students from one place.
                </p>
                <Link
                  to="/admin/posts/new"
                  className="mt-5 inline-flex items-center gap-1 border-b border-white/70 pb-0.5 text-xs font-bold uppercase tracking-wider text-white"
                >
                  Create first post
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
            <span className="material-symbols-outlined pointer-events-none absolute -bottom-6 -right-4 text-[100px] text-white/10">
              campaign
            </span>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-xl border border-[#ececec] bg-white shadow-[0_24px_48px_rgba(0,0,0,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ececec] bg-[#fafafa] px-6 py-5 sm:px-8">
              <div>
                <h2 className="font-[var(--font-heading)] text-xl font-bold text-[#1a1c1c]">Latest campus news</h2>
                <p className="text-sm text-[#5f5e5e]">Most recently updated posts</p>
              </div>
              <Link
                to="/admin/posts"
                className="text-xs font-bold uppercase tracking-[0.12em] text-[#af0f24] transition hover:underline"
              >
                View all
              </Link>
            </div>

            {postsLoading ? (
              <div className="p-12 text-center text-sm text-[#5f5e5e]">Loading posts…</div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-[#5f5e5e]">No posts yet.</p>
                <Link to="/admin/posts/new" className="mt-4 inline-block text-sm font-bold text-[#af0f24]">
                  Create a post
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#ececec] bg-[#f9f9f9]">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-[#1a1c1c] sm:px-8">Title</th>
                      <th className="hidden py-3 font-semibold text-[#1a1c1c] md:table-cell">Category</th>
                      <th className="hidden py-3 font-semibold text-[#1a1c1c] lg:table-cell">Updated</th>
                      <th className="px-6 py-3 text-right font-semibold text-[#1a1c1c] sm:px-8"> </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {rows.map((post) => (
                      <tr key={post.id} className="transition-colors hover:bg-[#fafafa]">
                        <td className="max-w-[240px] px-6 py-4 sm:max-w-none sm:px-8">
                          <p className="font-semibold text-[#1a1c1c]">{post.title}</p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-[#7a736f] md:hidden">
                            {post.category_display ?? post.category}
                          </p>
                        </td>
                        <td className="hidden py-4 md:table-cell">
                          <span className="inline-flex rounded-full bg-[#af0f24]/10 px-2.5 py-0.5 text-xs font-semibold text-[#af0f24]">
                            {post.category_display ?? post.category}
                          </span>
                        </td>
                        <td className="hidden py-4 text-[#5f5e5e] lg:table-cell">
                          {formatAppDate(post.updated_at ?? post.published_at)}
                        </td>
                        <td className="px-6 py-4 text-right sm:px-8">
                          <Link
                            to={`/admin/posts/${post.id}/edit`}
                            className="text-xs font-bold uppercase tracking-wide text-[#af0f24] hover:underline"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
