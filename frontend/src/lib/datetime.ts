/**
 * Application timezone — Indonesia Western Time (WIB, UTC+7).
 * All user-facing datetimes and datetime-local inputs use this zone.
 */

export const APP_TIMEZONE = "Asia/Jakarta"
export const APP_TIMEZONE_OFFSET = "+07:00"
export const APP_TIMEZONE_LABEL = "WIB"

type DateTimeParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function parseInstant(value?: string | Date | null): Date | null {
  if (value == null || value === "") return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getZonedParts(date: Date, timeZone = APP_TIMEZONE): DateTimeParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
  const parts = formatter.formatToParts(date)
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0)

  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour") % 24,
    minute: pick("minute"),
  }
}

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

function formatWithOptions(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions,
  fallback = "—"
): string {
  const date = parseInstant(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat("en-GB", { timeZone: APP_TIMEZONE, ...options }).format(date)
}

/** e.g. 1 Jul 2026, 14:30 WIB */
export function formatAppDateTime(value?: string | Date | null): string {
  const formatted = formatWithOptions(
    value,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
    ""
  )
  return formatted ? `${formatted} ${APP_TIMEZONE_LABEL}` : "—"
}

/** e.g. 1 Jul 2026 */
export function formatAppDate(value?: string | Date | null): string {
  return formatWithOptions(value, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** e.g. Mon, 1 Jul 2026 */
export function formatAppDateWithWeekday(value?: string | Date | null): string {
  return formatWithOptions(value, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

/** e.g. 1 July 2026 — for date-only fields (birth dates). */
export function formatAppDateLong(value?: string | null): string {
  if (!value) return "—"
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00${APP_TIMEZONE_OFFSET}` : value
  return formatWithOptions(normalized, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/** e.g. 14:30 */
export function formatAppTime(value?: string | Date | null): string {
  return formatWithOptions(
    value,
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
    ""
  )
}

/** e.g. July 2027 */
export function formatAppMonthYear(value?: string | null): string {
  return formatWithOptions(value, {
    month: "long",
    year: "numeric",
  })
}

/** e.g. Monday, 1 July 2026 */
export function formatAppDateFull(value?: string | null): string {
  return formatWithOptions(value, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/** Webinar schedule in WIB (date + start time). */
export function formatAppWebinarSchedule(value?: string | null): string {
  if (!value) return "—"
  const dateStr = formatAppDateWithWeekday(value)
  const time = formatAppTime(value)
  return `${dateStr} · ${time} ${APP_TIMEZONE_LABEL}`
}

/** Registration window as local dates only (closes at 23:59 WIB). */
export function formatAppRegistrationDateRange(
  opens?: string | null,
  closes?: string | null
): string {
  if (!opens && !closes) return "—"
  if (opens && closes) {
    return `${formatAppDate(opens)} – ${formatAppDate(closes)} (closes 23:59 ${APP_TIMEZONE_LABEL})`
  }
  if (opens) return `From ${formatAppDate(opens)}`
  return `Until ${formatAppDate(closes)} (23:59 ${APP_TIMEZONE_LABEL})`
}

/** API ISO datetime → separate date and time fields in WIB. */
export function splitAppDatetime(value?: string | null): { date: string; time: string } {
  const local = toDatetimeLocalValue(value)
  if (!local) return { date: "", time: "" }
  const [date, timePart] = local.split("T")
  return { date, time: timePart ?? "" }
}

/** Date + time (WIB) → ISO string for the API. */
export function combineAppDateAndTime(date?: string | null, time?: string | null): string | null {
  if (!date?.trim() || !time?.trim()) return null
  return fromDatetimeLocalValue(`${date.trim()}T${time.trim()}`)
}

/** Registration range → local date strings in WIB. */
export function splitRegistrationDateRange(
  opens?: string | null,
  closes?: string | null
): { from: string; to: string } {
  return {
    from: splitAppDatetime(opens).date,
    to: splitAppDatetime(closes).date,
  }
}

/** Registration open at 00:00 WIB on the selected date. */
export function registrationDayStart(date?: string | null): string | null {
  if (!date?.trim()) return null
  return `${date.trim()}T00:00:00${APP_TIMEZONE_OFFSET}`
}

/** Registration close at 23:59:59 WIB on the selected date. */
export function registrationDayEnd(date?: string | null): string | null {
  if (!date?.trim()) return null
  return `${date.trim()}T23:59:59${APP_TIMEZONE_OFFSET}`
}

export function compareApiDates(a: string, b: string): number {
  return a.localeCompare(b)
}

/** Webinar-style range in WIB. @deprecated Use formatAppWebinarSchedule */
export function formatAppDateTimeRange(start: string, _end?: string): string {
  return formatAppWebinarSchedule(start)
}

/** API ISO datetime → value for `<input type="datetime-local" />` in WIB. */
export function toDatetimeLocalValue(value?: string | null): string {
  const date = parseInstant(value)
  if (!date) return ""

  const parts = getZonedParts(date)
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}T${pad2(parts.hour)}:${pad2(parts.minute)}`
}

/** `<input type="datetime-local" />` value (WIB) → ISO string for the API. */
export function fromDatetimeLocalValue(value?: string | null): string | null {
  if (!value?.trim()) return null
  const normalized = value.trim().length === 16 ? `${value.trim()}:00` : value.trim()
  return `${normalized}${APP_TIMEZONE_OFFSET}`
}

export function compareDatetimeLocalValues(a: string, b: string): number {
  return new Date(fromDatetimeLocalValue(a) ?? 0).getTime() - new Date(fromDatetimeLocalValue(b) ?? 0).getTime()
}
