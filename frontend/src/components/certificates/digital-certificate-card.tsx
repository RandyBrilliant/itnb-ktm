import { useEffect, useRef, useState } from "react"
import {
  type CertificateLayout,
  fieldFontSize,
  fieldTransform,
  normalizeCertificateLayout,
} from "@/lib/certificate-layout"

export interface DigitalCertificateCardProps {
  templateUrl: string
  layout?: CertificateLayout | Record<string, unknown> | null
  name: string
  studentId: string
  className?: string
}

/** A4 portrait is the typical certificate proportion. */
export const CERTIFICATE_ASPECT = "210 / 297"

export function DigitalCertificateCard({
  templateUrl,
  layout: layoutProp,
  name,
  studentId,
  className = "",
}: DigitalCertificateCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(400)
  const layout = normalizeCertificateLayout(
    layoutProp as Record<string, unknown> | null | undefined
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height
      if (h) setHeight(h)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const fields = [
    { key: "name" as const, text: name, field: layout.name, weight: 700 },
    { key: "id" as const, text: studentId, field: layout.id, weight: 600 },
  ]

  return (
    <div
      ref={containerRef}
      className={`relative mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-[#d9d9d9] bg-white shadow-md ${className}`}
      style={{ aspectRatio: CERTIFICATE_ASPECT }}
    >
      <img
        src={templateUrl}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />
      {fields.map(({ key, text, field, weight }) =>
        text ? (
          <p
            key={key}
            className="pointer-events-none absolute max-w-[92%] whitespace-pre-wrap break-words leading-tight"
            style={{
              left: `${field.x_ratio * 100}%`,
              top: `${field.y_ratio * 100}%`,
              transform: fieldTransform(field.align),
              color: layout.text_color,
              fontSize: fieldFontSize(field.font_ratio, height),
              fontWeight: weight,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {text}
          </p>
        ) : null
      )}
    </div>
  )
}
