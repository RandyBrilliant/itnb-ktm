import { useEffect } from "react"

export interface ConfirmLogoutModalProps {
  open: boolean
  isLoading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmLogoutModal({
  open,
  isLoading = false,
  onCancel,
  onConfirm,
}: ConfirmLogoutModalProps) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onCancel()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, isLoading, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      onClick={() => {
        if (!isLoading) onCancel()
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[#ececec] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="logout-confirm-title"
          className="font-[var(--font-heading)] text-xl font-bold text-[#1a1c1c]"
        >
          Confirm logout
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#5f5e5e]">
          Are you sure you want to log out of your current session?
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-[#ddd] px-4 py-2 text-sm font-semibold text-[#1a1c1c] transition hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg bg-[#af0f24] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#930019] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Logging out…" : "Yes, log out"}
          </button>
        </div>
      </div>
    </div>
  )
}
