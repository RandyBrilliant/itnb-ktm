import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarDays, MapPin, Video } from "lucide-react"
import {
  cancelWebinarRegistration,
  checkInWebinar,
  checkOutWebinar,
  listWebinars,
  registerWebinar,
  type WebinarItem,
} from "@/api/webinars"
import type { UserRole } from "@/types/auth"
import { getRoleBasePath } from "@/lib/role-path"
import { resolveMediaUrl } from "@/lib/media-url"
import { RoleContentLayout } from "@/components/layout/role-content-layout"
import { PaginationControls } from "@/components/content/pagination-controls"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"

function formatRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const dateStr = s.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit", year: "numeric" })
  const timeOpts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
  return `${dateStr} · ${s.toLocaleTimeString("en-US", timeOpts)} – ${e.toLocaleTimeString("en-US", timeOpts)}`
}

function WebinarCard({ webinar, role }: { webinar: WebinarItem; role: UserRole }) {
  const queryClient = useQueryClient()
  const [code, setCode] = useState("")
  const [showCheckIn, setShowCheckIn] = useState(false)
  const basePath = getRoleBasePath(role)
  const image = resolveMediaUrl(webinar.post.image) || webinar.post.image_url || ""

  const reg = webinar.my_registration
  const isRegistered = reg != null && reg.status !== "CANCELLED"
  const isOnline = webinar.mode === "ONLINE" || webinar.mode === "HYBRID"

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [role, "webinars"] })

  const registerMutation = useMutation({
    mutationFn: () => registerWebinar(webinar.id),
    onSuccess: () => {
      toast.success("Registered")
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

  const checkInMutation = useMutation({
    mutationFn: (token?: string) => checkInWebinar(webinar.id, token),
    onSuccess: () => {
      toast.success("Checked in", "Your certificate will appear shortly if one is offered.")
      setShowCheckIn(false)
      setCode("")
      invalidate()
    },
    onError: (error) => toast.error("Check-in failed", getUserFriendlyError(error, "generic")),
  })

  const checkOutMutation = useMutation({
    mutationFn: (token?: string) => checkOutWebinar(webinar.id, token),
    onSuccess: () => {
      toast.success("Checked out")
      invalidate()
    },
    onError: (error) => toast.error("Check-out failed", getUserFriendlyError(error, "generic")),
  })

  return (
    <article className="overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-sm">
      {image ? (
        <div className="aspect-video w-full overflow-hidden bg-[#f0f0f0]">
          <img src={image} alt={webinar.post.title} className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#af0f24]/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#af0f24]">
            {webinar.mode_display || webinar.mode}
          </span>
          {webinar.certificate_program ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-green-700">
              Certificate
            </span>
          ) : null}
        </div>

        <div>
          <h2 className="font-[var(--font-heading)] text-xl font-extrabold tracking-tight text-[#1a1c1c] sm:text-2xl">
            {webinar.post.title}
          </h2>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#5f5e5e]">{webinar.post.body}</p>
        </div>

        <div className="space-y-1.5 text-sm text-[#5f5e5e]">
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
          {isOnline && webinar.online_url ? (
            <p className="flex items-center gap-2">
              <Video size={16} className="text-[#af0f24]" />
              <a href={webinar.online_url} target="_blank" rel="noopener noreferrer" className="text-[#af0f24] underline">
                Join link
              </a>
            </p>
          ) : null}
        </div>

        {reg?.attended ? (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
            You attended this webinar.
            {reg.certificate_id ? (
              <>
                {" "}
                <Link to={`${basePath}/certificates`} className="font-bold underline">
                  View your certificate
                </Link>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
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
              {!reg?.attended ? (
                <button
                  type="button"
                  onClick={() => setShowCheckIn((prev) => !prev)}
                  className="rounded-lg bg-[#af0f24] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#930019]"
                >
                  Check in
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => checkOutMutation.mutate(undefined)}
                  disabled={checkOutMutation.isPending || !!reg?.checked_out_at}
                  className="rounded-lg border border-[#d5d5d5] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[#1a1c1c] transition hover:bg-[#f3f3f3] disabled:opacity-50"
                >
                  {reg?.checked_out_at ? "Checked out" : "Check out"}
                </button>
              )}
              {!reg?.attended ? (
                <button
                  type="button"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="rounded-lg border border-[#f2b6b6] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24] transition hover:bg-[#fff2f2] disabled:opacity-50"
                >
                  Cancel
                </button>
              ) : null}
            </>
          )}
        </div>

        {showCheckIn ? (
          <div className="space-y-3 rounded-lg border border-[#ececec] bg-[#fafafa] p-4">
            <p className="text-xs font-semibold text-[#1a1c1c]">
              Enter the code shown on the attendance screen (or scan the QR).
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CODE"
                className="flex-1 border border-[#d5d5d5] px-3 py-2 text-sm font-mono tracking-[0.2em] outline-none focus:border-[#af0f24]"
              />
              <button
                type="button"
                onClick={() => checkInMutation.mutate(code.trim())}
                disabled={!code.trim() || checkInMutation.isPending}
                className="rounded-lg bg-[#af0f24] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#930019] disabled:opacity-50"
              >
                Submit
              </button>
            </div>
            {isOnline ? (
              <button
                type="button"
                onClick={() => checkInMutation.mutate(undefined)}
                disabled={checkInMutation.isPending}
                className="text-xs font-bold uppercase tracking-[0.12em] text-[#af0f24] underline"
              >
                Check in online (no code)
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  )
}

export function WebinarsPage({ role }: { role: UserRole }) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: [role, "webinars", page],
    queryFn: () => listWebinars({ page }),
  })

  const webinars = data?.results ?? []

  return (
    <RoleContentLayout
      role={role}
      title="Webinars"
      subtitle="Register, attend, and earn certificates"
      maxWidthClassName="max-w-3xl"
    >
      <section className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="aspect-video animate-pulse rounded-2xl bg-[#ececec]" />
          </div>
        ) : webinars.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e4beba] bg-white px-6 py-12 text-center">
            <p className="font-[var(--font-heading)] text-lg font-bold text-[#1a1c1c]">No webinars yet</p>
            <p className="mt-2 text-sm text-[#5f5e5e]">Check back soon for upcoming sessions.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {webinars.map((webinar) => (
              <WebinarCard key={webinar.id} webinar={webinar} role={role} />
            ))}
            <PaginationControls page={page} count={data?.count ?? 0} onChange={setPage} />
          </div>
        )}
      </section>
    </RoleContentLayout>
  )
}
