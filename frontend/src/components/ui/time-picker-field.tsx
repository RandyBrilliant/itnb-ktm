import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"

export type TimePickerFieldProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  disabled?: boolean
  required?: boolean
  className?: string
  id?: string
}

const labelClass = "text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]"
const inputClass =
  "w-full border border-[#d5d5d5] px-3 py-2 text-sm outline-none focus:border-[#af0f24]"

export function TimePickerField({
  value,
  onChange,
  label,
  disabled = false,
  required = false,
  className,
  id,
}: TimePickerFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {label ? (
        <span className={labelClass}>
          {label}
          {required ? " *" : null}
        </span>
      ) : null}
      <div className="relative">
        <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f5e5e]" />
        <input
          id={id}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          className={cn(inputClass, "pl-9")}
        />
      </div>
    </div>
  )
}
