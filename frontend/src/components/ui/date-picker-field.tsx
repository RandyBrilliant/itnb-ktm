import { format, isValid, parse } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const API_DATE_FORMAT = "yyyy-MM-dd"
const DISPLAY_DATE_FORMAT = "dd MMM yyyy"

function parseApiDate(value: string): Date | undefined {
  if (!value.trim()) return undefined
  const parsed = parse(value, API_DATE_FORMAT, new Date())
  return isValid(parsed) ? parsed : undefined
}

function formatApiDate(date: Date | undefined): string {
  if (!date || !isValid(date)) return ""
  return format(date, API_DATE_FORMAT)
}

export type DatePickerFieldProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  id?: string
}

export function DatePickerField({
  value,
  onChange,
  label,
  placeholder = "Pick a date",
  disabled = false,
  required = false,
  className,
  id,
}: DatePickerFieldProps) {
  const selectedDate = parseApiDate(value)
  const displayValue = selectedDate ? format(selectedDate, DISPLAY_DATE_FORMAT) : placeholder

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
              "h-auto w-full justify-start border-[#d5d5d5] px-3 py-2 text-left text-sm font-normal",
              "hover:bg-[#fafafa] focus-visible:ring-2 focus-visible:ring-[#af0f24]/30",
              !selectedDate && "text-[#8a8a8a]"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-[#5f5e5e]" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => onChange(formatApiDate(date))}
            defaultMonth={selectedDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
