import { STUDENT_DEPARTMENTS } from "@/lib/student-departments"
import { cn } from "@/lib/utils"

const selectClassName =
  "w-full border border-[#d5d5d5] bg-white px-3 py-2 text-sm outline-none focus:border-[#af0f24]"

export type StudentDepartmentSelectProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  id?: string
  allowEmpty?: boolean
  emptyLabel?: string
}

export function StudentDepartmentSelect({
  value,
  onChange,
  disabled = false,
  className,
  id,
  allowEmpty = true,
  emptyLabel = "Select department",
}: StudentDepartmentSelectProps) {
  const hasLegacyValue = Boolean(value) && !STUDENT_DEPARTMENTS.includes(value as (typeof STUDENT_DEPARTMENTS)[number])

  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(selectClassName, className)}
    >
      {allowEmpty ? <option value="">{emptyLabel}</option> : null}
      {hasLegacyValue ? <option value={value}>{value}</option> : null}
      {STUDENT_DEPARTMENTS.map((department) => (
        <option key={department} value={department}>
          {department}
        </option>
      ))}
    </select>
  )
}
