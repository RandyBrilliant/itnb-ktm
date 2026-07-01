/** Normalize semester labels (Arabic 1–12 and Roman I–XII) to a single number. */

const ROMAN_TO_INT: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
}

export function normalizeSemester(value: number | string | null | undefined): number | null {
  if (value == null) return null
  if (typeof value === "number" && !Number.isNaN(value)) return value
  const text = String(value).trim().toUpperCase()
  if (/^\d+$/.test(text)) return Number(text)
  return ROMAN_TO_INT[text] ?? null
}

export function semesterDisplayLabel(semester: number): string {
  return `Semester ${semester}`
}

export function sortSemesters(values: Iterable<number>): number[] {
  return Array.from(new Set(values)).sort((a, b) => a - b)
}
