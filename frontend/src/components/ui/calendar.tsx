import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

const defaultClassNames = getDefaultClassNames()

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        ...defaultClassNames,
        months: cn(defaultClassNames.months, "flex flex-col sm:flex-row gap-4"),
        month: cn(defaultClassNames.month, "space-y-4"),
        month_caption: cn(
          defaultClassNames.month_caption,
          "relative flex items-center justify-center pt-1"
        ),
        caption_label: cn(defaultClassNames.caption_label, "text-sm font-semibold text-[#1a1c1c]"),
        nav: cn(defaultClassNames.nav, "flex items-center gap-1"),
        button_previous: cn(
          defaultClassNames.button_previous,
          "absolute left-1 inline-flex h-7 w-7 items-center justify-center p-0 opacity-80 transition hover:opacity-100"
        ),
        button_next: cn(
          defaultClassNames.button_next,
          "absolute right-1 inline-flex h-7 w-7 items-center justify-center p-0 opacity-80 transition hover:opacity-100"
        ),
        month_grid: cn(defaultClassNames.month_grid, "w-full border-collapse"),
        weekdays: cn(defaultClassNames.weekdays, "flex"),
        weekday: cn(defaultClassNames.weekday, "w-9 text-[0.8rem] font-medium text-[#5f5e5e]"),
        week: cn(defaultClassNames.week, "mt-2 flex w-full"),
        day: cn(
          defaultClassNames.day,
          "relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20"
        ),
        day_button: cn(
          defaultClassNames.day_button,
          "inline-flex h-9 w-9 items-center justify-center p-0 text-sm font-normal text-[#1a1c1c] transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#af0f24] focus-visible:ring-offset-1"
        ),
        disabled: cn(defaultClassNames.disabled, "opacity-40"),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
