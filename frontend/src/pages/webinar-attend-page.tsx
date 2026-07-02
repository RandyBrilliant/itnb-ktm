import { useEffect, useRef, useState } from "react"
import { Check, Loader2, ShieldAlert } from "lucide-react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { checkInWebinar, checkOutWebinar } from "@/api/webinars"
import { useAuth } from "@/hooks/use-auth"
import { getUserFriendlyError } from "@/lib/error-message"
import { getWebinarsListPath } from "@/lib/webinar-attendance"

type AttendStatus = "loading" | "success" | "error"

export function WebinarAttendPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const webinarId = Number(id)
  const token = searchParams.get("token")?.trim() ?? ""
  const phase = searchParams.get("phase") === "out" ? "out" : "in"
  const { user, isLoading: authLoading } = useAuth()
  const submitted = useRef(false)
  const [status, setStatus] = useState<AttendStatus>("loading")
  const [message, setMessage] = useState("")
  const [webinarTitle, setWebinarTitle] = useState("")

  useEffect(() => {
    if (authLoading || !user) return

    if (!Number.isFinite(webinarId) || !token) {
      setStatus("error")
      setMessage("This attendance link is invalid. Scan the QR code again from the organizer's screen.")
      return
    }

    if (submitted.current) return
    submitted.current = true

    const recordAttendance = async () => {
      try {
        const webinar =
          phase === "in"
            ? await checkInWebinar(webinarId, token)
            : await checkOutWebinar(webinarId, token)
        setWebinarTitle(webinar.post?.title ?? "Webinar")
        setStatus("success")
        setMessage(phase === "in" ? "You are checked in." : "You are checked out.")
      } catch (error) {
        setStatus("error")
        setMessage(getUserFriendlyError(error, "generic"))
      }
    }

    void recordAttendance()
  }, [authLoading, user, webinarId, token, phase])

  const webinarsPath = user ? getWebinarsListPath(user.role) : "/login"
  const certificatesPath =
    user?.role === "STUDENT"
      ? "/student/certificates"
      : user?.role === "ALUMNI"
        ? "/alumni/certificates"
        : null

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f9f9f9]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#f9f9f9]/95 via-[#f9f9f9]/88 to-[#af0f24]/10" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 py-10">
        <section className="w-full rounded-sm border border-[#e2e2e2] bg-white p-6 shadow-[32px_0_32px_rgba(175,15,36,0.06)] sm:p-8">
          <div className="flex flex-col items-center text-center">
            <img src="/img/logo-single.png" alt="IT&B crest" className="mb-4 h-16 w-16 object-contain" />
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">IT&amp;B Hub</p>
            <h1 className="mt-2 font-[var(--font-heading)] text-2xl font-extrabold text-[#1a1c1c]">
              Webinar {phase === "in" ? "Check-in" : "Check-out"}
            </h1>
            {webinarTitle ? (
              <p className="mt-2 text-sm font-semibold text-[#1a1c1c]">{webinarTitle}</p>
            ) : null}
          </div>

          <div className="mt-8">
            {status === "loading" ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#af0f24]" />
                <p className="text-sm text-[#5f5e5e]">
                  {phase === "in" ? "Recording your check-in..." : "Recording your check-out..."}
                </p>
              </div>
            ) : null}

            {status === "success" ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                  <Check className="h-8 w-8 text-green-700" strokeWidth={2.5} />
                </div>
                <p className="text-sm font-semibold text-green-800">{message}</p>
                {phase === "in" ? (
                  <p className="text-xs text-[#5f5e5e]">
                    If this webinar offers a certificate, it will appear in your certificates shortly.
                  </p>
                ) : null}
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <Link
                    to={webinarsPath}
                    className="rounded-lg bg-[#af0f24] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#930019]"
                  >
                    Back to webinars
                  </Link>
                  {certificatesPath ? (
                    <Link
                      to={certificatesPath}
                      className="rounded-lg border border-[#d5d5d5] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[#1a1c1c] transition hover:bg-[#f3f3f3]"
                    >
                      View certificates
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}

            {status === "error" ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <ShieldAlert className="h-10 w-10 text-red-600" strokeWidth={1.75} />
                <p className="text-sm font-semibold text-red-800">Attendance not recorded</p>
                <p className="text-sm text-red-700">{message}</p>
                <p className="text-xs text-[#5f5e5e]">
                  The code may have expired. Scan the latest QR on the attendance screen and try again.
                </p>
                <Link
                  to={webinarsPath}
                  className="rounded-lg border border-[#d5d5d5] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[#1a1c1c] transition hover:bg-[#f3f3f3]"
                >
                  Go to webinars
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  )
}
