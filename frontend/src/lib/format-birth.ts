export function formatBirthDate(value?: string | null): string {
  if (!value) return "—"
  const parts = value.split("-").map(Number)
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return value
  const [year, month, day] = parts
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
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
