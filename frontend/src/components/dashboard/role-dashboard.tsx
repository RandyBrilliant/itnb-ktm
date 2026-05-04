import type { UserRole } from "@/types/auth"
import { useRoleDashboard } from "@/hooks/use-role-dashboard"
import { RoleShell } from "@/components/navigation/role-shell"
import { AnimatedPage } from "@/components/animation/animated-page"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { resolveMediaUrl } from "@/lib/media-url"

const ROLE_TITLE: Record<UserRole, string> = {
  STUDENT: "Dashboard",
  STAFF: "Operations",
  LECTURER: "Teaching Hub",
  ADMIN: "Admin",
  ALUMNI: "Alumni",
}

const ROLE_CARD_LABEL: Record<UserRole, string> = {
  STUDENT: "STUDENT ID CARD",
  STAFF: "STAFF ACCESS CARD",
  LECTURER: "LECTURER PASS",
  ADMIN: "ADMIN ACCESS",
  ALUMNI: "ALUMNI CARD",
}

const ROLE_SESSION_LABEL: Record<UserRole, string> = {
  STUDENT: "ACTIVE CAMPUS SESSION",
  STAFF: "ACTIVE OPERATIONS SESSION",
  LECTURER: "ACTIVE TEACHING SESSION",
  ADMIN: "ACTIVE ADMIN SESSION",
  ALUMNI: "ACTIVE ALUMNI SESSION",
}

export function RoleDashboard({ role }: { role: UserRole }) {
  const { isBootLoading, isDataLoading, me, card, events, stats } = useRoleDashboard(role)

  if (isBootLoading) {
    return (
      <div className="mx-auto max-w-md px-4 pt-4 pb-10">
        <div className="h-20 animate-pulse bg-[#e8e8e8]" />
        <div className="mt-6 h-72 animate-pulse bg-[#e8e8e8]" />
      </div>
    )
  }

  const photo = resolveMediaUrl(me?.photo) || undefined
  const upcoming = events.slice(0, 2)

  return (
    <RoleShell
      role={role}
      title={`${ROLE_TITLE[role]}`}
      subtitle="Academic Year 2023/24"
      avatarUrl={photo}
    >
      <AnimatedPage className="mx-auto max-w-md text-[#1a1c1c] lg:max-w-4xl">
        <div className="mb-8 flex items-end justify-between pt-2">
          <div className="flex">
            <div className="mr-4 h-16 w-2 bg-[#af0f24]" />
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-[#af0f24]">
                ACADEMIC YEAR 2023/24
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight">{ROLE_TITLE[role]}</h1>
            </div>
          </div>
          <div className="text-right">
            <span
              className="material-symbols-outlined text-[#af0f24]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            <p className="text-[10px] font-bold uppercase text-[#5f5e5e]">Status: Active</p>
          </div>
        </div>

        <section className="mb-8">
          <motion.div
            className="relative overflow-hidden rounded-2xl bg-[#af0f24] p-6 text-white shadow-[0px_10px_32px_rgba(175,15,36,0.18)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-10">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            <div className="relative z-10 flex justify-between gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] opacity-80">
                    {ROLE_CARD_LABEL[role]}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">{me?.full_name || "User"}</p>
                  <p className="text-sm opacity-90">
                    {me?.department || role.toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] opacity-80">ID NUMBER</p>
                  <p className="text-3xl font-mono font-bold tracking-wider">
                    {card?.card_number || `ITNB-${me?.id ?? "----"}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="h-24 w-20 border border-white/20 bg-white/10 p-1">
                  <div className="flex h-full w-full items-center justify-center bg-black/20 text-xs">
                    PHOTO
                  </div>
                </div>
                <div
                  className="text-[8px] font-bold tracking-[0.35em] opacity-40"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                >
                  INSTITUTE OF TECH &amp; BUSINESS
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">contactless</span>
              <span className="text-[10px] font-bold">TAP FOR DIGITAL ENTRY</span>
            </div>
            <div className="absolute bottom-4 right-6">
              <span className="material-symbols-outlined text-2xl opacity-60">qr_code_2</span>
            </div>
          </motion.div>
          {role === "STUDENT" ? (
            <div className="mt-3 text-center">
              <Link
                to="/student/id"
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#af0f24]"
              >
                <span className="material-symbols-outlined text-sm">sync</span>
                Flip To View Full Card
              </Link>
            </div>
          ) : null}
        </section>

        <section className="mb-8 grid grid-cols-2 gap-4">
          <motion.div
            className="rounded-2xl bg-white p-6 shadow-[0px_6px_28px_rgba(175,15,36,0.05)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.05 }}
          >
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#af0f24]">
              {stats.leftLabel}
            </p>
            <h3 className="text-5xl font-extrabold">{isDataLoading ? "..." : stats.leftValue}</h3>
            <p className="mt-2 text-[10px] font-bold text-[#5f5e5e]">
              {isDataLoading ? "Updating data..." : stats.leftHint}
            </p>
          </motion.div>
          <motion.div
            className="rounded-2xl bg-white p-6 shadow-[0px_6px_28px_rgba(175,15,36,0.05)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.09 }}
          >
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#af0f24]">
              {stats.rightLabel}
            </p>
            <h3 className="text-5xl font-extrabold">{isDataLoading ? "..." : stats.rightValue}</h3>
            <p className="mt-2 text-[10px] font-bold text-[#5f5e5e]">
              {isDataLoading ? "Updating data..." : stats.rightHint}
            </p>
          </motion.div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 bg-[#af0f24]" />
              <h2 className="text-sm font-black uppercase tracking-tight">
                Today's Schedule
              </h2>
            </div>
            <span className="text-[10px] font-bold text-[#af0f24]">VIEW FULL CALENDAR</span>
          </div>
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <div className="bg-[#f3f3f3] p-4 text-sm text-[#5f5e5e]">No events scheduled.</div>
            ) : (
              upcoming.map((event) => {
                const date = new Date(event.event_date)
                const hour = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                return (
                  <motion.div
                    key={event.id}
                    className="flex items-center gap-4 rounded-xl bg-[#f3f3f3] p-4"
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.16 }}
                  >
                    <div className="min-w-[56px] text-center">
                      <p className="text-lg font-black leading-none">{hour.split(":")[0]}</p>
                      <p className="text-[10px] font-bold uppercase text-[#5f5e5e]">
                        {hour.includes("PM") ? "PM" : "AM"}
                      </p>
                    </div>
                    <div className="h-8 w-px bg-[#e4beba]/40" />
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase tracking-tight text-[#af0f24]">
                        {event.event_location || "Campus"}
                      </p>
                      <p className="text-sm font-bold">
                        {event.post?.title || "Institution Event"}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-[#af0f24]/40">
                      arrow_forward_ios
                    </span>
                  </motion.div>
                )
              })
            )}
          </div>
        </section>

        <section className="mb-10 flex items-center justify-between rounded-2xl bg-[#1a1c1c] p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-[#af0f24] p-2">
              <span
                className="material-symbols-outlined text-white"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                security
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#ffb3b0]">
                {ROLE_SESSION_LABEL[role]}
              </p>
              <p className="text-xs text-[#c8c6c5]">
                Connected: ITB-Wifi-Main
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-green-400">sensors</span>
        </section>
      </AnimatedPage>
    </RoleShell>
  )
}
