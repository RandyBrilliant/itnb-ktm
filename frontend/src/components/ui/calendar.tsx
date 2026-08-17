import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  navLayout = "around",
  components,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames()
  const hasDropdowns = captionLayout !== "label"

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      navLayout={navLayout}
      className={cn("p-3", className)}
      classNames={{
        ...defaultClassNames,
        months: cn(defaultClassNames.months, "relative flex flex-col sm:flex-row gap-4"),
        month: cn(defaultClassNames.month, "space-y-4"),
        month_caption: cn(
          defaultClassNames.month_caption,
          "relative flex items-center justify-center pt-1",
          hasDropdowns && "px-8"
        ),
        caption_label: cn(
          defaultClassNames.caption_label,
          "text-sm font-semibold text-[#1a1c1c]",
          hasDropdowns &&
            "pointer-events-none flex h-8 items-center gap-1 px-1 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-[#5f5e5e]"
        ),
        dropdowns: cn(
          defaultClassNames.dropdowns,
          "flex items-center justify-center gap-1.5 text-sm font-semibold text-[#1a1c1c]"
        ),
        dropdown_root: cn(
          defaultClassNames.dropdown_root,
          "relative rounded-sm border border-[#d5d5d5] hover:bg-[#ececec]"
        ),
        dropdown: cn(defaultClassNames.dropdown, "absolute inset-0 z-[2] cursor-pointer opacity-0"),
        nav: cn(defaultClassNames.nav, "pointer-events-none flex items-center gap-1"),
        button_previous: cn(
          defaultClassNames.button_previous,
          "pointer-events-auto absolute left-1 z-[3] inline-flex h-7 w-7 items-center justify-center p-0 opacity-80 transition hover:opacity-100"
        ),
        button_next: cn(
          defaultClassNames.button_next,
          "pointer-events-auto absolute right-1 z-[3] inline-flex h-7 w-7 items-center justify-center p-0 opacity-80 transition hover:opacity-100"
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
        Chevron: ({ className: chevronClassName, orientation }) => {
          const iconClassName = cn("h-4 w-4", chevronClassName)
          if (orientation === "left") {
            return <ChevronLeft className={iconClassName} />
          }
          if (orientation === "right") {
            return <ChevronRight className={iconClassName} />
          }
          return <ChevronDown className={iconClassName} />
        },
        ...components,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
