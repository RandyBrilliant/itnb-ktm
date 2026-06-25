import type { UserRole } from "@/types/auth"
import { useRoleDashboard } from "@/hooks/use-role-dashboard"
import { RoleShell } from "@/components/navigation/role-shell"
import { AnimatedPage } from "@/components/animation/animated-page"
import { motion } from "framer-motion"
import { resolveMediaUrl } from "@/lib/media-url"

const ROLE_TITLE: Record<UserRole, string> = {
  STUDENT: "Dashboard",
  STAFF: "Operations",
  LECTURER: "Teaching Hub",
  ADMIN: "Admin",
  ALUMNI: "Alumni",
}

export function RoleDashboard({ role }: { role: UserRole }) {
  const { isBootLoading, isDataLoading, me, events, stats } = useRoleDashboard(role)

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

      </AnimatedPage>
    </RoleShell>
  )
}
