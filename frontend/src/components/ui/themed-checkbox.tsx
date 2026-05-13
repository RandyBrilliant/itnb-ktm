import type { InputHTMLAttributes } from "react"
import { forwardRef } from "react"

interface ThemedCheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string
  labelClassName?: string
  containerClassName?: string
}

export const ThemedCheckbox = forwardRef<HTMLInputElement, ThemedCheckboxProps>(
  (
    { label, className, labelClassName, containerClassName, id, disabled, ...props },
    ref
  ) => {
    const checkboxId = id ?? label?.toLowerCase().replace(/\s+/g, "-")

    return (
      <label
        htmlFor={checkboxId}
        className={`flex items-center gap-2 ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        } ${containerClassName ?? ""}`.trim()}
      >
        <span className="relative inline-flex items-center justify-center">
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className={`peer sr-only ${className ?? ""}`.trim()}
            {...props}
          />
          <span className="h-4 w-4 rounded-sm border border-[#8f6f6c] bg-white transition-colors peer-checked:border-[#af0f24] peer-checked:bg-[#af0f24] peer-focus-visible:ring-2 peer-focus-visible:ring-[#af0f24] peer-focus-visible:ring-offset-1" />
          <span className="pointer-events-none absolute text-[10px] font-black leading-none text-white opacity-0 transition-opacity peer-checked:opacity-100">
            ✓
          </span>
        </span>

        {label && (
          <span
            className={`font-[var(--font-body)] text-sm text-[#1a1c1c] ${
              labelClassName ?? ""
            }`.trim()}
          >
            {label}
          </span>
        )}
      </label>
    )
  }
)

ThemedCheckbox.displayName = "ThemedCheckbox"
