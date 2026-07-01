import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Download } from "lucide-react"
import {
  downloadWebinarParticipants,
  getAttendanceToken,
  getWebinar,
  listWebinarRegistrations,
} from "@/api/webinars"
import { formatAppDateTime } from "@/lib/datetime"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"

function formatTime(value?: string | null) {
  if (!value) return "—"
  return formatAppDateTime(value)
}

export function AdminWebinarAttendancePage() {
  const { id } = useParams<{ id: string }>()
  const webinarId = Number(id)
  const [phase, setPhase] = useState<"in" | "out">("in")

  const { data: webinar } = useQuery({
    queryKey: ["admin-webinar", webinarId],
    queryFn: () => getWebinar(webinarId),
    enabled: Number.isFinite(webinarId),
    refetchInterval: 60000,
  })

  const qrAvailable = webinar?.attendance_qr_available ?? false

  const { data: token, isLoading: tokenLoading } = useQuery({
    queryKey: ["webinar-attendance-token", webinarId, phase],
    queryFn: () => getAttendanceToken(webinarId, phase),
    enabled: Number.isFinite(webinarId) && qrAvailable,
    refetchInterval: qrAvailable ? 20000 : false,
    refetchIntervalInBackground: true,
    retry: false,
  })

  const { data: participants } = useQuery({
    queryKey: ["webinar-registrations", webinarId],
    queryFn: () => listWebinarRegistrations(webinarId, 1),
    enabled: Number.isFinite(webinarId),
    refetchInterval: qrAvailable ? 10000 : false,
  })

  const handleExport = async () => {
    if (!webinar) return
    try {
      await downloadWebinarParticipants(webinar.id, webinar.post.title)
    } catch (error) {
      toast.error("Failed to download participants", getUserFriendlyError(error, "generic"))
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/admin/webinars"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#5f5e5e] transition hover:text-[#af0f24]"
        >
          <ArrowLeft size={16} />
          Back to webinars
        </Link>
        <h1 className="mt-2 font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">
          {webinar?.post.title ?? "Attendance"}
        </h1>
        <p className="mt-1 text-sm text-[#5f5e5e]">
          The attendance QR appears 30 minutes before the webinar starts. Attendees scan the rotating code to{" "}
          {phase === "in" ? "check in" : "check out"}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-sm border border-[#e2e2e2] bg-white p-6 text-center shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
          <div className="mb-4 inline-flex overflow-hidden rounded-sm border border-[#d5d5d5]">
            <button
              type="button"
              onClick={() => setPhase("in")}
              className={`px-4 py-2 text-sm font-bold transition ${
                phase === "in" ? "bg-[#af0f24] text-white" : "bg-white text-[#1a1c1c] hover:bg-[#f3f3f3]"
              }`}
            >
              Check-in
            </button>
            <button
              type="button"
              onClick={() => setPhase("out")}
              className={`px-4 py-2 text-sm font-bold transition ${
                phase === "out" ? "bg-[#af0f24] text-white" : "bg-white text-[#1a1c1c] hover:bg-[#f3f3f3]"
              }`}
            >
              Check-out
            </button>
          </div>

          {!webinar ? (
            <div className="flex h-64 items-center justify-center text-sm text-[#5f5e5e]">Loading...</div>
          ) : !qrAvailable ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 px-4 text-sm text-[#5f5e5e]">
              <p className="font-semibold text-[#1a1c1c]">QR not available yet</p>
              <p>
                Opens at{" "}
                <span className="font-medium text-[#af0f24]">
                  {formatAppDateTime(webinar.attendance_qr_opens_at)}
                </span>
              </p>
              <p className="text-xs text-[#8a8989]">This page refreshes automatically when the window opens.</p>
            </div>
          ) : token ? (
            <div className="flex flex-col items-center gap-4">
              <img
                src={token.qr_data_url}
                alt="Attendance QR code"
                className="h-64 w-64 rounded-sm border border-[#ececec]"
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5f5e5e]">
                  Or enter this code
                </p>
                <p className="mt-1 font-mono text-3xl font-black tracking-[0.3em] text-[#af0f24]">
                  {token.token}
                </p>
                <p className="mt-2 text-xs text-[#8a8989]">Rotates every {token.step_seconds}s</p>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-[#5f5e5e]">
              {tokenLoading ? "Loading code..." : "Unable to load attendance code."}
            </div>
          )}
        </div>

        <div className="rounded-sm border border-[#e2e2e2] bg-white p-6 shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#1a1c1c]">Live attendance</p>
              <p className="text-xs text-[#5f5e5e]">
                {webinar ? `${webinar.attendee_count} checked in · ${webinar.registration_count} registered` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1 rounded-sm border border-[#d5d5d5] px-3 py-1.5 text-xs font-semibold text-[#1a1c1c] transition hover:bg-[#f3f3f3]"
            >
              <Download size={14} />
              Export .xlsx
            </button>
          </div>

          <div className="mt-4 max-h-96 overflow-y-auto">
            {!participants?.results.length ? (
              <p className="py-8 text-center text-sm text-[#5f5e5e]">No registrations yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-[#ececec] text-left text-xs uppercase tracking-[0.1em] text-[#8a8989]">
                  <tr>
                    <th className="py-2">Name</th>
                    <th className="py-2">Checked in</th>
                    <th className="py-2">Cert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f2f2]">
                  {participants.results.map((reg) => (
                    <tr key={reg.id}>
                      <td className="py-2">
                        <p className="font-medium text-[#1a1c1c]">{reg.user.full_name || reg.user.email}</p>
                        <p className="text-xs text-[#8a8989]">{reg.user.institutional_id || reg.user.email}</p>
                      </td>
                      <td className="py-2 text-[#5f5e5e]">{formatTime(reg.checked_in_at)}</td>
                      <td className="py-2">
                        {reg.certificate ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                            Issued
                          </span>
                        ) : (
                          <span className="text-xs text-[#b5b5b5]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
