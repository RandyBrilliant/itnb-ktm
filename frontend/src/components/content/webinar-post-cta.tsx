import { Link } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarDays, MapPin } from "lucide-react"
import { cancelWebinarRegistration, registerWebinar } from "@/api/webinars"
import type { PostWebinarSummary } from "@/api/posts"
import type { UserRole } from "@/types/auth"
import { getRoleBasePath } from "@/lib/role-path"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"

function formatRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const dateStr = s.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
  const timeOpts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
  return `${dateStr} · ${s.toLocaleTimeString("en-US", timeOpts)} – ${e.toLocaleTimeString("en-US", timeOpts)}`
}

interface WebinarPostCtaProps {
  webinar: PostWebinarSummary
  role: UserRole
  postId: number
}

export function WebinarPostCta({ webinar, role, postId }: WebinarPostCtaProps) {
  const queryClient = useQueryClient()
  const basePath = getRoleBasePath(role)
  const reg = webinar.my_registration
  const isRegistered = reg != null && reg.status !== "CANCELLED"
  const showStudentActions = role === "STUDENT"

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [role, "news", postId] })
    queryClient.invalidateQueries({ queryKey: [role, "webinars"] })
  }

  const registerMutation = useMutation({
    mutationFn: () => registerWebinar(webinar.id),
    onSuccess: () => {
      toast.success("Registered for webinar")
      invalidate()
    },
    onError: (error) => toast.error("Failed to register", getUserFriendlyError(error, "generic")),
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelWebinarRegistration(webinar.id),
    onSuccess: () => {
      toast.success("Registration cancelled")
      invalidate()
    },
    onError: (error) => toast.error("Failed to cancel", getUserFriendlyError(error, "generic")),
  })

  return (
    <div className="mt-6 rounded-xl border border-[#e8d5d3] bg-[#fdf8f8] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Webinar</p>
      <p className="mt-1 font-[var(--font-heading)] text-lg font-extrabold text-[#1a1c1c]">
        {webinar.certificate_program ? "Register & earn a certificate" : "Register to attend"}
      </p>

      <div className="mt-3 space-y-1.5 text-sm text-[#5f5e5e]">
        <p className="flex items-center gap-2">
          <CalendarDays size={16} className="text-[#af0f24]" />
          {formatRange(webinar.starts_at, webinar.ends_at)}
        </p>
        {webinar.location ? (
          <p className="flex items-center gap-2">
            <MapPin size={16} className="text-[#af0f24]" />
            {webinar.location}
          </p>
        ) : null}
      </div>

      {reg?.attended ? (
        <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          You attended this webinar.
          {reg.certificate_id ? (
            <>
              {" "}
              <Link to={`${basePath}/certificates`} className="font-bold underline">
                View certificate
              </Link>
            </>
          ) : null}
        </div>
      ) : showStudentActions ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!isRegistered ? (
            <button
              type="button"
              onClick={() => registerMutation.mutate()}
              disabled={!webinar.is_registration_open || registerMutation.isPending}
              className="rounded-lg bg-[#af0f24] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#930019] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {webinar.is_full ? "Join waitlist" : webinar.is_registration_open ? "Register" : "Registration closed"}
            </button>
          ) : (
            <>
              <span className="rounded-lg bg-[#ececec] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">
                {reg?.status_display || "Registered"}
              </span>
              <Link
                to={`${basePath}/webinars`}
                className="rounded-lg border border-[#d5d5d5] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[#1a1c1c] transition hover:bg-[#f3f3f3]"
              >
                Check in on Webinars
              </Link>
              <button
                type="button"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="rounded-lg border border-[#f2b6b6] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24] transition hover:bg-[#fff2f2] disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#5f5e5e]">
          Students can register and check in from the Webinars section in their portal.
        </p>
      )}
    </div>
  )
}
