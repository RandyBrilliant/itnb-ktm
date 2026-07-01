export type CertificateFieldAlign = "left" | "center" | "right"

export interface CertificateFieldLayout {
  x_ratio: number
  y_ratio: number
  font_ratio: number
  align: CertificateFieldAlign
}

export interface CertificateLayout {
  name: CertificateFieldLayout
  id: CertificateFieldLayout
  text_color: string
}

export const SAMPLE_CERTIFICATE_NAME = "John Doe"
export const SAMPLE_CERTIFICATE_ID = "2024001234"

export function defaultCertificateLayout(): CertificateLayout {
  return {
    name: { x_ratio: 0.5, y_ratio: 0.42, font_ratio: 0.038, align: "center" },
    id: { x_ratio: 0.5, y_ratio: 0.48, font_ratio: 0.024, align: "center" },
    text_color: "#1a1a1a",
  }
}

function clampRatio(value: number, low = 0.02, high = 0.98): number {
  return Math.max(low, Math.min(high, value))
}

function normalizeField(raw: unknown, defaults: CertificateFieldLayout): CertificateFieldLayout {
  const field = { ...defaults }
  if (!raw || typeof raw !== "object") return field
  const obj = raw as Record<string, unknown>
  if (typeof obj.x_ratio === "number") field.x_ratio = clampRatio(obj.x_ratio)
  if (typeof obj.y_ratio === "number") field.y_ratio = clampRatio(obj.y_ratio)
  if (typeof obj.font_ratio === "number") field.font_ratio = Math.max(0.01, Math.min(0.12, obj.font_ratio))
  if (obj.align === "left" || obj.align === "center" || obj.align === "right") field.align = obj.align
  return field
}

/** Merge API / legacy flat keys into the canonical nested layout shape. */
export function normalizeCertificateLayout(raw?: Record<string, unknown> | null): CertificateLayout {
  const base = defaultCertificateLayout()
  if (!raw) return base

  const result: CertificateLayout = {
    name: normalizeField(raw.name, base.name),
    id: normalizeField(raw.id, base.id),
    text_color: typeof raw.text_color === "string" && raw.text_color ? raw.text_color : base.text_color,
  }

  if (typeof raw.name_y_ratio === "number") result.name.y_ratio = clampRatio(raw.name_y_ratio)
  if (typeof raw.name_font_ratio === "number") result.name.font_ratio = Math.max(0.01, Math.min(0.12, raw.name_font_ratio))
  if (typeof raw.name_x_ratio === "number") result.name.x_ratio = clampRatio(raw.name_x_ratio)

  if (typeof raw.id_y_ratio === "number") result.id.y_ratio = clampRatio(raw.id_y_ratio)
  if (typeof raw.id_font_ratio === "number") result.id.font_ratio = Math.max(0.01, Math.min(0.12, raw.id_font_ratio))
  if (typeof raw.id_x_ratio === "number") result.id.x_ratio = clampRatio(raw.id_x_ratio)

  return result
}

export function fieldTransform(align: CertificateFieldAlign): string {
  if (align === "left") return "translate(0, -50%)"
  if (align === "right") return "translate(-100%, -50%)"
  return "translate(-50%, -50%)"
}

export function fieldFontSize(fontRatio: number, containerHeight: number): string {
  const px = Math.max(10, Math.round(containerHeight * fontRatio))
  return `${px}px`
}
