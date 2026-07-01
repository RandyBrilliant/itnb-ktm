import { useNavigate } from "react-router-dom"
import { createWebinar } from "@/api/webinars"
import { WebinarForm } from "@/components/admin/webinar-form"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"

export function AdminWebinarCreatePage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Administration</p>
        <h1 className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">Create Webinar</h1>
        <p className="mt-1 text-sm text-[#5f5e5e]">
          Publishing a webinar posts it to campus announcements and opens registration.
        </p>
      </div>

      <WebinarForm
        submitLabel="Create Webinar"
        onSubmit={async (payload) => {
          try {
            await createWebinar(payload)
            toast.success("Webinar created")
            navigate("/admin/webinars", { replace: true })
          } catch (error) {
            toast.error("Failed to create webinar", getUserFriendlyError(error, "generic"))
          }
        }}
      />
    </div>
  )
}
