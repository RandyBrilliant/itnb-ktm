import { useMemo } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { SemesterGpa } from "@/api/academic"
import { formatGpa } from "@/hooks/use-academic-query"
import { semesterChartLabel, semesterDisplayLabel, sortSemesters } from "@/lib/semester"

type GpaTrendChartProps = {
  data: SemesterGpa[]
  compact?: boolean
  className?: string
}

type ChartPoint = {
  semester: number
  shortLabel: string
  label: string
  gpa: number
  credits: number | null
}

function GpaTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ChartPoint }>
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div className="rounded-xl border border-[#ececec] bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-bold text-[#1a1c1c]">{point.label}</p>
      <p className="mt-1 text-sm font-bold tabular-nums text-[#af0f24]">GPA {formatGpa(point.gpa)}</p>
      {point.credits != null ? (
        <p className="mt-0.5 text-[10px] font-semibold text-[#9a9a9a]">
          {point.credits} credit{point.credits === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  )
}

export function GpaTrendChart({ data, compact = false, className = "" }: GpaTrendChartProps) {
  const chartData = useMemo<ChartPoint[]>(() => {
    const bySemester = new Map<number, SemesterGpa>()
    for (const row of data) {
      if (row.gpa == null || Number.isNaN(row.gpa)) continue
      bySemester.set(row.semester, row)
    }
    return sortSemesters(bySemester.keys()).map((semester) => {
      const row = bySemester.get(semester)!
      return {
        semester,
        shortLabel: semesterChartLabel(semester),
        label: semesterDisplayLabel(semester),
        gpa: row.gpa as number,
        credits: row.credits,
      }
    })
  }, [data])

  if (chartData.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-dashed border-[#e4beba] bg-[#fafafa] px-4 text-center text-sm text-[#5f5e5e] ${compact ? "h-36" : "h-48"} ${className}`}
      >
        No semester GPA data yet.
      </div>
    )
  }

  const height = compact ? 180 : 240
  const denseAxis = chartData.length > 6

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 8, bottom: denseAxis ? 4 : 0 }}
        >
          <CartesianGrid stroke="#f0f0f0" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="shortLabel"
            tick={{ fill: "#9a9a9a", fontSize: denseAxis ? 9 : 11, fontWeight: 600 }}
            axisLine={{ stroke: "#ececec" }}
            tickLine={false}
            minTickGap={denseAxis ? 16 : 8}
            height={28}
          />
          <YAxis
            domain={[0, 4]}
            ticks={[0, 1, 2, 3, 4]}
            tick={{ fill: "#9a9a9a", fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => Number(value).toFixed(1)}
            width={36}
          />
          <Tooltip content={<GpaTooltip />} cursor={{ stroke: "#af0f24", strokeWidth: 1, strokeDasharray: "4 4" }} />
          <Line
            type="monotone"
            dataKey="gpa"
            stroke="#af0f24"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#af0f24", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#af0f24", stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
