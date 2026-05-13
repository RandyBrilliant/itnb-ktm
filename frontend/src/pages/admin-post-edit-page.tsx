import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getPost, updatePost, type PostCategory } from "@/api/posts"
import { ImageUploadField } from "@/components/ui/image-upload-field"
import { resolveMediaUrl } from "@/lib/media-url"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"

const CATEGORY_OPTIONS: PostCategory[] = ["ANNOUNCEMENT", "NEWS", "EVENT", "ACADEMIC"]

function formatDate(value?: string) {
  if (!value) return "—"
  return new Date(value).toLocaleString()
}

export function AdminPostEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const postId = Number(id)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [category, setCategory] = useState<PostCategory>("ANNOUNCEMENT")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [coverRemoved, setCoverRemoved] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: post, isLoading } = useQuery({
    queryKey: ["admin-post", postId],
    queryFn: () => getPost(postId),
    enabled: Number.isFinite(postId),
  })

  useEffect(() => {
    if (!post) return
    setTitle(post.title)
    setBody(post.body)
    setCategory(post.category)
    setImageFile(null)
    setCoverRemoved(false)
    setIsPublished(post.is_published)
  }, [post])

  useEffect(() => {
    if (imageFile) setCoverRemoved(false)
  }, [imageFile])

  const handleSubmit = async () => {
    if (!post) return
    if (!title.trim() || !body.trim()) {
      toast.warning("Missing required fields", "Title and content are required.")
      return
    }

    try {
      setIsSubmitting(true)
      await updatePost(post.id, {
        title: title.trim(),
        body: body.trim(),
        category,
        image_url: coverRemoved ? "" : undefined,
        imageFile,
        is_published: isPublished,
      })
      toast.success("Post updated")
      navigate("/admin/posts", { replace: true })
    } catch (error) {
      toast.error("Failed to update post", getUserFriendlyError(error, "generic"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-sm border border-[#e2e2e2] bg-white p-8 text-center text-[#5f5e5e]">
        Loading post...
      </div>
    )
  }

  const existingCoverUrl =
    post && !coverRemoved ? resolveMediaUrl(post.image) || post.image_url || "" : ""

  if (!post) {
    return (
      <div className="rounded-sm border border-[#e2e2e2] bg-white p-8 text-center">
        <p className="text-[#5f5e5e]">Post not found.</p>
        <Link to="/admin/posts" className="mt-3 inline-block text-sm font-semibold text-[#af0f24]">
          Back to Campus News
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Administration</p>
        <h1 className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">Edit Campus News</h1>
        <p className="mt-1 text-sm text-[#5f5e5e]">Update post content and publishing details.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-sm border border-[#e2e2e2] bg-white p-6 shadow-[32px_0_32px_rgba(175,15,36,0.04)] lg:col-span-3">
          <div className="grid grid-cols-1 gap-4">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PostCategory)}
                className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
              >
                {CATEGORY_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <ImageUploadField
              label="Cover Image"
              file={imageFile}
              existingImageUrl={existingCoverUrl}
              enableCrop
              cropAspect={16 / 9}
              onFileChange={setImageFile}
              onCoverRemoved={() => setCoverRemoved(true)}
              onValidationError={(message) => toast.warning("Invalid image", message)}
            />

            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Content</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"
              />
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded-sm border border-[#8f6f6c] text-[#af0f24] focus:ring-[#af0f24]"
              />
              <span className="text-sm text-[#1a1c1c]">Published</span>
            </label>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-sm bg-[#af0f24] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#930019] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
            <Link
              to="/admin/posts"
              className="rounded-sm border border-[#d5d5d5] px-4 py-2 text-sm font-semibold text-[#1a1c1c] transition hover:bg-[#f5f5f5]"
            >
              Cancel
            </Link>
          </div>
        </div>

        <div className="rounded-sm border border-[#e2e2e2] bg-white p-5 shadow-[32px_0_32px_rgba(175,15,36,0.04)] lg:col-span-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24]">Post</p>
          <h2 className="mt-1 text-lg font-bold text-[#1a1c1c]">Post Details</h2>
          <div className="mt-4 space-y-2 text-sm text-[#1a1c1c]">
            <p><span className="font-semibold text-[#5f5e5e]">Post ID:</span> {post.id}</p>
            <p><span className="font-semibold text-[#5f5e5e]">Status:</span> {post.is_published ? "Published" : "Draft"}</p>
            <p><span className="font-semibold text-[#5f5e5e]">Category:</span> {post.category_display || post.category}</p>
            <p><span className="font-semibold text-[#5f5e5e]">Author:</span> {post.author?.full_name || post.author?.email || "—"}</p>
            <p><span className="font-semibold text-[#5f5e5e]">Published At:</span> {formatDate(post.published_at)}</p>
            <p><span className="font-semibold text-[#5f5e5e]">Created At:</span> {formatDate(post.created_at)}</p>
            <p><span className="font-semibold text-[#5f5e5e]">Updated At:</span> {formatDate(post.updated_at)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
