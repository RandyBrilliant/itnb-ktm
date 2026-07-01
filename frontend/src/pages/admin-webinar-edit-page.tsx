import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getWebinar, updateWebinar } from "@/api/webinars"
import { WebinarForm, toDatetimeLocal } from "@/components/admin/webinar-form"
import { resolveMediaUrl } from "@/lib/media-url"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"

export function AdminWebinarEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const webinarId = Number(id)

  const { data: webinar, isLoading } = useQuery({
    queryKey: ["admin-webinar", webinarId],
    queryFn: () => getWebinar(webinarId),
    enabled: Number.isFinite(webinarId),
  })

  if (isLoading || !webinar) {
    return <div className="p-8 text-center text-[#5f5e5e]">Loading webinar...</div>
  }

  const existingImageUrl = resolveMediaUrl(webinar.post.image) || webinar.post.image_url || ""

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Administration</p>
        <h1 className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">Edit Webinar</h1>
        <p className="mt-1 text-sm text-[#5f5e5e]">Update the webinar details, schedule, and certificate template.</p>
      </div>

      <WebinarForm
        submitLabel="Save Changes"
        existingImageUrl={existingImageUrl}
        initial={{
          title: webinar.post.title,
          body: webinar.post.body,
          mode: webinar.mode,
          starts_at: toDatetimeLocal(webinar.starts_at),
          ends_at: toDatetimeLocal(webinar.ends_at),
          location: webinar.location ?? "",
          online_url: webinar.online_url ?? "",
          capacity: webinar.capacity != null ? String(webinar.capacity) : "",
          registration_opens_at: toDatetimeLocal(webinar.registration_opens_at),
          registration_closes_at: toDatetimeLocal(webinar.registration_closes_at),
          certificate_program: webinar.certificate_program?.id ?? null,
          auto_issue_certificate: webinar.auto_issue_certificate,
          is_published: webinar.post.is_published,
        }}
        onSubmit={async (payload) => {
          try {
            await updateWebinar(webinarId, payload)
            toast.success("Webinar updated")
            navigate("/admin/webinars", { replace: true })
          } catch (error) {
            toast.error("Failed to update webinar", getUserFriendlyError(error, "generic"))
          }
        }}
      />
    </div>
  )
}
