import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { createPost, type PostCategory } from "@/api/posts"
import { ImageUploadField } from "@/components/ui/image-upload-field"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"

const CATEGORY_OPTIONS: PostCategory[] = ["ANNOUNCEMENT", "NEWS", "EVENT", "ACADEMIC"]

export function AdminPostCreatePage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [category, setCategory] = useState<PostCategory>("ANNOUNCEMENT")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isPublished, setIsPublished] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      toast.warning("Missing required fields", "Title and content are required.")
      return
    }

    try {
      setIsSubmitting(true)
      await createPost({
        title: title.trim(),
        body: body.trim(),
        category,
        imageFile,
        is_published: isPublished,
      })
      toast.success("Post created")
      navigate("/admin/posts", { replace: true })
    } catch (error) {
      toast.error("Failed to create post", getUserFriendlyError(error, "generic"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Administration</p>
        <h1 className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">Create Campus News</h1>
        <p className="mt-1 text-sm text-[#5f5e5e]">Add a new news post and publish it when ready.</p>
      </div>

      <div className="rounded-sm border border-[#e2e2e2] bg-white p-6 shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
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
            enableCrop
            cropAspect={16 / 9}
            onFileChange={setImageFile}
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
            <span className="text-sm text-[#1a1c1c]">Publish immediately</span>
          </label>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-sm bg-[#af0f24] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#930019] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating..." : "Create Post"}
          </button>
          <Link
            to="/admin/posts"
            className="rounded-sm border border-[#d5d5d5] px-4 py-2 text-sm font-semibold text-[#1a1c1c] transition hover:bg-[#f5f5f5]"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}
