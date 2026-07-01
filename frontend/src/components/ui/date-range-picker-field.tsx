import { format, isValid, parse } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange as DayPickerRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const API_DATE_FORMAT = "yyyy-MM-dd"
const DISPLAY_DATE_FORMAT = "dd MMM yyyy"

export type DateRangeValue = {
  from: string
  to: string
}

function parseApiDate(value: string): Date | undefined {
  if (!value.trim()) return undefined
  const parsed = parse(value, API_DATE_FORMAT, new Date())
  return isValid(parsed) ? parsed : undefined
}

function formatApiDate(date: Date | undefined): string {
  if (!date || !isValid(date)) return ""
  return format(date, API_DATE_FORMAT)
}

function formatDisplayRange(value: DateRangeValue, placeholder: string): string {
  const fromDate = parseApiDate(value.from)
  const toDate = parseApiDate(value.to)

  if (fromDate && toDate) {
    return `${format(fromDate, DISPLAY_DATE_FORMAT)} – ${format(toDate, DISPLAY_DATE_FORMAT)}`
  }
  if (fromDate) return format(fromDate, DISPLAY_DATE_FORMAT)
  return placeholder
}

export type DateRangePickerFieldProps = {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  id?: string
  hint?: string
}

export function DateRangePickerField({
  value,
  onChange,
  label,
  placeholder = "Pick registration dates",
  disabled = false,
  required = false,
  className,
  id,
  hint,
}: DateRangePickerFieldProps) {
  const fromDate = parseApiDate(value.from)
  const toDate = parseApiDate(value.to)
  const selected: DayPickerRange | undefined =
    fromDate || toDate ? { from: fromDate, to: toDate } : undefined
  const displayValue = formatDisplayRange(value, placeholder)

  return (
    <div className={cn("space-y-1", className)}>
      {label ? (
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">
          {label}
          {required ? " *" : null}
        </span>
      ) : null}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-auto w-full justify-start border-[#d5d5d5] px-3 py-2 text-left text-sm font-normal hover:bg-white",
              !fromDate && "text-[#8a8a8a]"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-[#5f5e5e]" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={selected}
            onSelect={(range) =>
              onChange({
                from: formatApiDate(range?.from),
                to: formatApiDate(range?.to),
              })
            }
            defaultMonth={fromDate ?? toDate}
            numberOfMonths={2}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {hint ? <p className="text-xs text-[#8a8989]">{hint}</p> : null}
    </div>
  )
}
