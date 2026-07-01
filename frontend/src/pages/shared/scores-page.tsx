import { useMemo, useState } from "react"
import { isAxiosError } from "axios"
import type { ScoreRow } from "@/api/academic"
import { formatGpa, useMyAcademicQuery } from "@/hooks/use-academic-query"
import { RoleContentLayout } from "@/components/layout/role-content-layout"
import { normalizeSemester, semesterDisplayLabel, sortSemesters } from "@/lib/semester"
import type { UserRole } from "@/types/auth"

type SemesterFilter = "all" | number

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === "string" && detail.trim()) {
      return detail
    }
    if (error.response?.status === 503) {
      return "Scores are temporarily unavailable. Please try again later."
    }
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return "Unable to load scores right now."
}

function gradeTone(grade: string): string {
  const g = grade.trim().toUpperCase()
  if (g.startsWith("A")) return "bg-emerald-50 text-emerald-700 ring-emerald-200/80"
  if (g.startsWith("B")) return "bg-sky-50 text-sky-700 ring-sky-200/80"
  if (g.startsWith("C")) return "bg-amber-50 text-amber-800 ring-amber-200/80"
  if (g.startsWith("D") || g.startsWith("E")) return "bg-orange-50 text-orange-800 ring-orange-200/80"
  return "bg-[#af0f24]/8 text-[#af0f24] ring-[#af0f24]/15"
}

function groupBySemester(scores: ScoreRow[]): Map<number, ScoreRow[]> {
  const grouped = new Map<number, ScoreRow[]>()
  for (const row of scores) {
    const sem = normalizeSemester(row.semester)
    if (sem == null) continue
    const list = grouped.get(sem) ?? []
    list.push({ ...row, semester: sem })
    grouped.set(sem, list)
  }
  return grouped
}

export function ScoresPage({ role }: { role: UserRole }) {
  const [semesterFilter, setSemesterFilter] = useState<SemesterFilter>("all")

  const { data, isLoading, isError, error } = useMyAcademicQuery()

  const summary = data?.summary
  const scores = data?.scores ?? []
  const isStale = data?.stale === true
  const syncedAtLabel = data?.synced_at
    ? new Date(data.synced_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  const groupedScores = useMemo(() => groupBySemester(scores), [scores])
  const semesterOptions = useMemo(() => sortSemesters(groupedScores.keys()), [groupedScores])

  const visibleSemesters = useMemo(() => {
    if (semesterFilter === "all") return semesterOptions
    return semesterOptions.filter((s) => s === semesterFilter)
  }, [semesterFilter, semesterOptions])

  const filteredCourseCount = useMemo(
    () => visibleSemesters.reduce((n, sem) => n + (groupedScores.get(sem)?.length ?? 0), 0),
    [visibleSemesters, groupedScores]
  )

  return (
    <RoleContentLayout role={role} title="Scores" maxWidthClassName="max-w-3xl">
      <section className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-3xl bg-gradient-to-br from-[#ececec] to-[#f5f5f5]" />
            <div className="h-12 animate-pulse rounded-full bg-[#ececec]" />
            <div className="h-56 animate-pulse rounded-3xl bg-[#ececec]" />
          </div>
        ) : isError ? (
          <div className="rounded-3xl border border-dashed border-[#e4beba] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#af0f24]/10">
              <span className="material-symbols-outlined text-3xl text-[#af0f24]/60">school</span>
            </div>
            <p className="text-lg font-bold text-[#1a1c1c]">Scores unavailable</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#5f5e5e]">{getErrorMessage(error)}</p>
          </div>
        ) : (
          <>
            {isStale ? (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <span className="material-symbols-outlined mt-0.5 text-amber-600">cloud_off</span>
                <div>
                  <p className="text-sm font-bold text-amber-800">Showing your last synced records</p>
                  <p className="mt-0.5 text-xs text-amber-700">
                    The academic system is temporarily unreachable.
                    {syncedAtLabel ? ` Last updated ${syncedAtLabel}.` : ""}
                  </p>
                </div>
              </div>
            ) : null}

            {/* GPA summary hero */}
            <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#af0f24] via-[#9a0d20] to-[#7a0a18] text-white shadow-lg shadow-[#af0f24]/20">
              <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
              <div className="relative p-6 sm:p-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                  Academic record
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-[1.65rem]">
                  {summary?.student_name || "Student"}
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">Class</p>
                      <p className="mt-1 text-sm font-semibold">{summary?.student_class || "—"}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">Major</p>
                      <p className="mt-1 text-sm font-semibold leading-snug">
                        {summary?.student_major || "—"}
                        {summary?.student_year ? ` · ${summary.student_year}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-md sm:min-w-[7.5rem]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9a9a9a]">GPA</p>
                    <p className="mt-0.5 text-4xl font-bold tabular-nums text-[#af0f24]">
                      {formatGpa(summary?.student_gpa)}
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {scores.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#e4beba] bg-white p-10 text-center">
                <p className="text-lg font-bold text-[#1a1c1c]">No scores published yet</p>
                <p className="mt-2 text-sm text-[#5f5e5e]">
                  Published grades from the academic system will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Semester filter */}
                <div className="flex flex-col gap-3 rounded-2xl border border-[#ececec] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#1a1c1c]">Semester</p>
                    <p className="mt-0.5 text-xs text-[#9a9a9a]">
                      {filteredCourseCount} course{filteredCourseCount === 1 ? "" : "s"} shown
                    </p>
                  </div>
                  <select
                    value={semesterFilter === "all" ? "all" : String(semesterFilter)}
                    onChange={(e) => {
                      const value = e.target.value
                      setSemesterFilter(value === "all" ? "all" : Number(value))
                    }}
                    className="w-full rounded-xl border border-[#d5d5d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#1a1c1c] outline-none transition focus:border-[#af0f24] focus:ring-2 focus:ring-[#af0f24]/15 sm:w-auto sm:min-w-[11rem]"
                    aria-label="Filter by semester"
                  >
                    <option value="all">All semesters</option>
                    {semesterOptions.map((sem) => (
                      <option key={sem} value={String(sem)}>
                        {semesterDisplayLabel(sem)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Score tables */}
                <div className="space-y-5">
                  {visibleSemesters.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-[#e4beba] bg-white p-8 text-center text-sm text-[#5f5e5e]">
                      No courses for this semester.
                    </div>
                  ) : (
                    visibleSemesters.map((sem) => {
                      const rows = groupedScores.get(sem) ?? []
                      return (
                        <article
                          key={sem}
                          className="overflow-hidden rounded-3xl border border-[#ececec]/80 bg-white shadow-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f0f0] bg-gradient-to-r from-[#fafafa] to-white px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#af0f24]/10 text-sm font-bold text-[#af0f24]">
                                {sem}
                              </span>
                              <div>
                                <h3 className="font-bold text-[#1a1c1c]">{semesterDisplayLabel(sem)}</h3>
                                <p className="text-xs text-[#9a9a9a]">
                                  {rows.length} subject{rows.length === 1 ? "" : "s"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="divide-y divide-[#f5f5f5]">
                            {rows.map((row, index) => (
                              <div
                                key={`${sem}-${row.subject}-${index}`}
                                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[#fafafa]/80"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium text-[#1a1c1c]">{row.subject}</p>
                                </div>
                                <span
                                  className={`inline-flex min-w-[2.25rem] shrink-0 items-center justify-center rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ${gradeTone(row.grade)}`}
                                >
                                  {row.grade || "—"}
                                </span>
                                <span className="w-10 shrink-0 text-right text-sm font-bold tabular-nums text-[#3b3b3b]">
                                  {row.score ?? "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </article>
                      )
                    })
                  )}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </RoleContentLayout>
  )
}

export default ScoresPage
