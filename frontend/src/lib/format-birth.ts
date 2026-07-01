import { formatAppDateLong } from "@/lib/datetime"

export function formatBirthDate(value?: string | null): string {
  return formatAppDateLong(value)
}

export function formatBirthPlaceDate(
  place?: string | null,
  dateOfBirth?: string | null
): string {
  const datePart = formatBirthDate(dateOfBirth)
  const hasPlace = Boolean(place?.trim())
  const hasDate = datePart !== "—"

  if (hasPlace && hasDate) return `${place!.trim()}, ${datePart}`
  if (hasPlace) return place!.trim()
  if (hasDate) return datePart
  return "—"
}
