import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Edit2, Plus, Search, Trash2 } from "lucide-react"
import { deletePost, listPosts, type PostCategory, type PostItem } from "@/api/posts"
import { ConfirmActionModal } from "@/components/ui/confirm-action-modal"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"

const CATEGORY_OPTIONS: PostCategory[] = ["ANNOUNCEMENT", "NEWS", "EVENT", "ACADEMIC"]

function formatDate(value?: string) {
  if (!value) return "Unpublished"
  return new Date(value).toLocaleString()
}

export function AdminPostsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [publishFilter, setPublishFilter] = useState<string>("")
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PostItem | null>(null)

  const queryFilters = useMemo(
    () => ({
      page,
      page_size: 20,
      search: search || undefined,
      category: (categoryFilter || undefined) as PostCategory | undefined,
      is_published:
        publishFilter === "" ? undefined : publishFilter === "published",
      ordering: "-published_at",
    }),
    [categoryFilter, page, publishFilter, search]
  )

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-posts", queryFilters],
    queryFn: () => listPosts(queryFilters),
  })

  const handleDelete = async () => {
    if (!pendingDelete) return

    try {
      setDeletingId(pendingDelete.id)
      await deletePost(pendingDelete.id)
      toast.success("Post deleted")
      await queryClient.invalidateQueries({ queryKey: ["admin-posts"] })
      refetch()
      setPendingDelete(null)
    } catch (error) {
      toast.error("Failed to delete post", getUserFriendlyError(error, "generic"))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Administration</p>
          <h1 className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">Campus News</h1>
          <p className="mt-1 text-sm text-[#5f5e5e]">Create, update, publish, and manage campus news content.</p>
        </div>
        <Link
          to="/admin/posts/new"
          className="flex items-center gap-2 bg-[#af0f24] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#930019]"
        >
          <Plus size={20} />
          New Post
        </Link>
      </div>

      <div className="space-y-4 rounded-sm border border-[#e2e2e2] bg-white p-4 shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search size={18} className="absolute left-3 top-3 text-[#5f5e5e]" />
            <input
              type="text"
              placeholder="Search title or content..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full border border-[#d5d5d5] bg-white py-2 pl-10 pr-4 text-[#1a1c1c] outline-none transition focus:border-[#af0f24]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
            className="border border-[#d5d5d5] bg-white px-4 py-2 text-[#1a1c1c] outline-none transition focus:border-[#af0f24]"
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={publishFilter}
            onChange={(e) => {
              setPublishFilter(e.target.value)
              setPage(1)
            }}
            className="border border-[#d5d5d5] bg-white px-4 py-2 text-[#1a1c1c] outline-none transition focus:border-[#af0f24]"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-[#e2e2e2] bg-white shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
        {isLoading ? (
          <div className="p-8 text-center text-[#5f5e5e]">Loading posts...</div>
        ) : !data?.results.length ? (
          <div className="p-8 text-center text-[#5f5e5e]">No posts found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#ececec] bg-[#f3f3f3]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Published At</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#1a1c1c]">Author</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-[#1a1c1c]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {data.results.map((post) => (
                  <tr key={post.id} className="transition-colors hover:bg-[#f9f9f9]">
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#1a1c1c]">{post.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-[#5f5e5e]">{post.body}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1a1c1c]">{post.category_display || post.category}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          post.is_published
                            ? "bg-green-100 text-green-700"
                            : "bg-[#ececec] text-[#5f5e5e]"
                        }`}
                      >
                        {post.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#5f5e5e]">{formatDate(post.published_at)}</td>
                    <td className="px-6 py-4 text-xs text-[#5f5e5e]">{post.author?.full_name || post.author?.email || "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/posts/${post.id}/edit`}
                          className="inline-flex items-center gap-1 rounded-sm border border-[#d5d5d5] px-3 py-1.5 text-xs font-semibold text-[#1a1c1c] transition hover:bg-[#f3f3f3]"
                        >
                          <Edit2 size={14} />
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(post)}
                          disabled={deletingId === post.id}
                          className="inline-flex items-center gap-1 rounded-sm border border-[#f2b6b6] px-3 py-1.5 text-xs font-semibold text-[#af0f24] transition hover:bg-[#fff2f2] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <Trash2 size={14} />
                          {deletingId === post.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.count > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#5f5e5e]">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.count)} of {data.count} posts
          </p>
          <div className="flex gap-2">
            <button
              disabled={!data.previous}
              onClick={() => setPage((prev) => prev - 1)}
              className="border border-[#d5d5d5] px-4 py-2 hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={!data.next}
              onClick={() => setPage((prev) => prev + 1)}
              className="border border-[#d5d5d5] px-4 py-2 hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
      <ConfirmActionModal
        open={pendingDelete !== null}
        isLoading={deletingId === pendingDelete?.id}
        title="Delete post"
        description={
          pendingDelete
            ? `Delete "${pendingDelete.title}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onCancel={() => {
          if (deletingId === null) setPendingDelete(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}
