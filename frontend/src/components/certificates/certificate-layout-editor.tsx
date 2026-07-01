import { useCallback, useEffect, useRef, useState } from "react"
import {
  type CertificateFieldLayout,
  type CertificateLayout,
  SAMPLE_CERTIFICATE_ID,
  SAMPLE_CERTIFICATE_NAME,
  defaultCertificateLayout,
  fieldFontSize,
  fieldTransform,
} from "@/lib/certificate-layout"

type FieldKey = "name" | "id"

const FIELD_LABELS: Record<FieldKey, string> = {
  name: "Student name",
  id: "Student ID",
}

const FIELD_SAMPLES: Record<FieldKey, string> = {
  name: SAMPLE_CERTIFICATE_NAME,
  id: SAMPLE_CERTIFICATE_ID,
}

interface CertificateLayoutEditorProps {
  templateUrl: string | null
  value: CertificateLayout
  onChange: (layout: CertificateLayout) => void
}

function clampRatio(value: number): number {
  return Math.max(0.02, Math.min(0.98, value))
}

export function CertificateLayoutEditor({ templateUrl, value, onChange }: CertificateLayoutEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [activeField, setActiveField] = useState<FieldKey>("name")
  const dragRef = useRef<{ field: FieldKey; pointerId: number } | null>(null)

  const updateField = useCallback(
    (field: FieldKey, patch: Partial<CertificateFieldLayout>) => {
      onChange({
        ...value,
        [field]: { ...value[field], ...patch },
      })
    },
    [onChange, value]
  )

  const positionFromPointer = useCallback(
    (clientX: number, clientY: number, field: FieldKey) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect?.width || !rect.height) return
      updateField(field, {
        x_ratio: clampRatio((clientX - rect.left) / rect.width),
        y_ratio: clampRatio((clientY - rect.top) / rect.height),
      })
    },
    [updateField]
  )

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || e.pointerId !== drag.pointerId) return
      positionFromPointer(e.clientX, e.clientY, drag.field)
    }
    const onUp = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || e.pointerId !== drag.pointerId) return
      dragRef.current = null
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [positionFromPointer])

  const startDrag = (field: FieldKey, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveField(field)
    dragRef.current = { field, pointerId: e.pointerId }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    positionFromPointer(e.clientX, e.clientY, field)
  }

  if (!templateUrl) {
    return (
      <p className="text-sm text-[#8a8a8a]">
        Upload a certificate template to position the student name and ID on the artwork.
      </p>
    )
  }

  const canvasHeight = 360

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#5f5e5e]">
        Drag each label onto the template. Use the sliders to adjust text size. Positions are saved with the webinar.
      </p>

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <div
          ref={canvasRef}
          className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-sm border border-[#ddd] bg-[#f0f0f0]"
          style={{ height: canvasHeight }}
        >
          <img
            src={templateUrl}
            alt="Certificate template"
            className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            draggable={false}
          />

          {(["name", "id"] as FieldKey[]).map((field) => {
            const layout = value[field]
            const isActive = activeField === field
            return (
              <button
                key={field}
                type="button"
                onPointerDown={(e) => startDrag(field, e)}
                className={`absolute max-w-[90%] cursor-grab touch-none select-none border px-2 py-1 text-left active:cursor-grabbing ${
                  isActive
                    ? "border-[#af0f24] bg-white/90 ring-2 ring-[#af0f24]/30"
                    : "border-[#af0f24]/40 bg-white/80"
                }`}
                style={{
                  left: `${layout.x_ratio * 100}%`,
                  top: `${layout.y_ratio * 100}%`,
                  transform: fieldTransform(layout.align),
                  color: value.text_color,
                  fontSize: fieldFontSize(layout.font_ratio, canvasHeight),
                  fontWeight: field === "name" ? 700 : 600,
                  fontFamily: "system-ui, sans-serif",
                  lineHeight: 1.2,
                }}
              >
                <span className="block text-[9px] font-bold uppercase tracking-wide text-[#af0f24]">
                  {FIELD_LABELS[field]}
                </span>
                {FIELD_SAMPLES[field]}
              </button>
            )
          })}
        </div>

        <div className="space-y-4 rounded-sm border border-[#ececec] bg-white p-3">
          {(["name", "id"] as FieldKey[]).map((field) => {
            const layout = value[field]
            const isActive = activeField === field
            return (
              <div
                key={field}
                className={`space-y-2 rounded-sm p-2 ${isActive ? "bg-[#faf5f5]" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => setActiveField(field)}
                  className="text-xs font-bold uppercase tracking-[0.1em] text-[#1a1c1c]"
                >
                  {FIELD_LABELS[field]}
                </button>
                <label className="block space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                    Size
                  </span>
                  <input
                    type="range"
                    min={0.012}
                    max={0.08}
                    step={0.001}
                    value={layout.font_ratio}
                    onChange={(e) => updateField(field, { font_ratio: Number(e.target.value) })}
                    className="w-full accent-[#af0f24]"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                    Align
                  </span>
                  <select
                    value={layout.align}
                    onChange={(e) =>
                      updateField(field, { align: e.target.value as CertificateFieldLayout["align"] })
                    }
                    className="w-full border border-[#ddd] px-2 py-1 text-xs"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>
              </div>
            )
          })}

          <label className="block space-y-1 border-t border-[#ececec] pt-3">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
              Text color
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value.text_color}
                onChange={(e) => onChange({ ...value, text_color: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded border border-[#ddd]"
              />
              <input
                type="text"
                value={value.text_color}
                onChange={(e) => onChange({ ...value, text_color: e.target.value })}
                className="flex-1 border border-[#ddd] px-2 py-1 font-mono text-xs"
              />
            </div>
          </label>

          <button
            type="button"
            onClick={() => onChange(defaultCertificateLayout())}
            className="w-full rounded-sm border border-[#ddd] px-2 py-1.5 text-xs font-semibold text-[#5f5e5e] hover:bg-[#f5f5f5]"
          >
            Reset positions
          </button>
        </div>
      </div>
    </div>
  )
}
