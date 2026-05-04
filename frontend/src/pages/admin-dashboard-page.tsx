import { useUsersQuery } from "@/hooks/use-users-query"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { AdminQuickAction } from "@/components/admin/admin-quick-action"
import { AdminScheduleTable, type AdminScheduleItem } from "@/components/admin/admin-schedule-table"
import { toast } from "@/lib/toast"

export function AdminDashboardPage() {
  const { data: usersData } = useUsersQuery({
    page: 1,
    page_size: 1,
  })

  const scheduleItems: AdminScheduleItem[] = [
    {
      time: "09:00 - 11:30",
      session: "Morning Session",
      module: "Advanced Corporate Finance",
      batch: "Semester 4 • Batch A",
      venue: "Room 402, Block B",
      status: "COMPLETED",
    },
    {
      time: "13:00 - 15:30",
      session: "Current Session",
      module: "Strategic Risk Management",
      batch: "Masters • Executive",
      venue: "Main Auditorium",
      status: "IN PROGRESS",
    },
    {
      time: "16:00 - 18:00",
      session: "Evening Session",
      module: "Digital Marketing Ethics",
      batch: "Semester 2 • Batch C",
      venue: "Seminar Room 1",
      status: "SCHEDULED",
    },
  ]

  return (
    <div className="space-y-10">
      <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#af0f24]">
            Institutional Dashboard
          </span>
          <h1 className="font-[var(--font-heading)] text-4xl font-extrabold tracking-tight text-[#1a1c1c] md:text-5xl">
            At a Glance.
          </h1>
        </div>
        <button className="flex items-center gap-2 self-start bg-[#af0f24] px-8 py-3 font-bold text-white shadow-lg transition hover:bg-[#930019] md:self-auto">
          <span className="material-symbols-outlined text-base">add</span>
          CREATE RECORD
        </button>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <AdminStatCard
          title="Active Enrollment"
          icon="groups"
          value={String(usersData?.count ?? 0)}
          hint="+12% from last semester"
          accent="success"
        />
        <AdminStatCard
          title="Pending Approval"
          icon="task_alt"
          value="24"
          hint="Priority high • certificates awaiting signature"
          accent="warning"
        />
        <AdminStatCard
          title="Upcoming Classes"
          icon="schedule"
          value="03"
          hint="Next session in 45 mins"
        />
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <div className="border-l-4 border-[#af0f24] pl-4">
            <h2 className="font-[var(--font-heading)] text-xl font-bold uppercase tracking-tight">Quick Actions</h2>
            <p className="text-sm text-[#5f5e5e]">Operational shortcuts</p>
          </div>

          <div className="space-y-3">
            <AdminQuickAction title="Verify Student ID" icon="id_card" onClick={() => toast.info("Open Verify Student ID module")} />
            <AdminQuickAction title="Issue Certificate" icon="workspace_premium" onClick={() => toast.info("Open Issue Certificate flow")} />
            <AdminQuickAction title="Post News Update" icon="campaign" onClick={() => toast.info("Open News composer")} />
          </div>

          <div className="relative overflow-hidden rounded-sm bg-[#af0f24] p-8 text-white">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">Institutional Note</span>
            <h3 className="mt-2 font-[var(--font-heading)] text-xl font-bold leading-tight">
              Faculty Meeting: Curriculum Review 2024
            </h3>
            <p className="mt-3 text-sm text-white/80">
              Attendance is mandatory for all senior lecturers regarding the new digital transformation syllabus.
            </p>
            <button className="mt-5 border-b border-white/60 pb-1 text-xs font-bold">READ MORE</button>
            <span className="material-symbols-outlined absolute -bottom-8 -right-8 text-[120px] text-white/10">
              school
            </span>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-sm bg-white shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
            <div className="flex items-center justify-between border-b border-[#ececec] bg-[#f9f9f9] px-8 py-6">
              <div className="flex items-center gap-4">
                <h2 className="font-[var(--font-heading)] text-2xl font-bold">Today's Schedule</h2>
                <span className="rounded-full bg-[#af0f24]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#af0f24]">
                  Oct 24, 2023
                </span>
              </div>
              <div className="flex gap-2">
                <button className="rounded-full p-1.5 transition hover:bg-[#ececec]">
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                </button>
                <button className="rounded-full p-1.5 transition hover:bg-[#ececec]">
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
              </div>
            </div>
            <AdminScheduleTable items={scheduleItems} />
            <div className="bg-[#f9f9f9] p-6 text-center">
              <button className="text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24] transition hover:underline">
                View Weekly Calendar
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
