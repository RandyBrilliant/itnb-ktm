import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getWebinar, updateWebinar } from "@/api/webinars"
import { WebinarForm } from "@/components/admin/webinar-form"
import { resolveMediaUrl } from "@/lib/media-url"
import { splitAppDatetime, splitRegistrationDateRange } from "@/lib/datetime"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"

export function AdminWebinarEditPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
  const schedule = splitAppDatetime(webinar.starts_at)
  const registrationRange = splitRegistrationDateRange(
    webinar.registration_opens_at,
    webinar.registration_closes_at
  )

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
        existingCertificateTemplateUrl={
          resolveMediaUrl(webinar.certificate_program?.template_image ?? null) || undefined
        }
        initialCertificateLayout={webinar.certificate_program?.layout}
        initial={{
          title: webinar.post.title,
          body: webinar.post.body,
          mode: webinar.mode,
          schedule_date: schedule.date,
          schedule_time: schedule.time,
          location: webinar.location ?? "",
          online_url: webinar.online_url ?? "",
          capacity: webinar.capacity != null ? String(webinar.capacity) : "",
          registration_range: registrationRange,
          certificate_valid_until: webinar.certificate_program?.valid_until?.slice(0, 10) ?? "",
          auto_issue_certificate: webinar.auto_issue_certificate,
          is_published: webinar.post.is_published,
        }}
        onSubmit={async (payload) => {
          try {
            await updateWebinar(webinarId, payload)
            await queryClient.invalidateQueries({ queryKey: ["admin-webinars"] })
            await queryClient.invalidateQueries({ queryKey: ["admin-webinar", webinarId] })
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
