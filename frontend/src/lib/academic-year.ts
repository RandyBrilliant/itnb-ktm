/**
 * Derive intake (cohort) year from institutional ID (NIM).
 * First two digits are the year suffix: 180060002 → 2018.
 */
export function getIntakeYearFromInstitutionalId(
  institutionalId?: string | null
): number | null {
  const id = (institutionalId ?? "").trim()
  if (id.length < 2) return null
  const prefix = id.slice(0, 2)
  if (!/^\d{2}$/.test(prefix)) return null
  return 2000 + Number.parseInt(prefix, 10)
}

/** e.g. 2018/19 for NIM starting with 18 */
export function formatAcademicYearRange(institutionalId?: string | null): string | null {
  const year = getIntakeYearFromInstitutionalId(institutionalId)
  if (year == null) return null
  const nextShort = String(year + 1).slice(-2)
  return `${year}/${nextShort}`
}

/** Shell subtitle, e.g. "Academic Year 2018/19" */
export function formatAcademicYearSubtitle(institutionalId?: string | null): string | null {
  const range = formatAcademicYearRange(institutionalId)
  if (!range) return null
  return `Academic Year ${range}`
}
