interface PaginationControlsProps {
  page: number
  count: number
  pageSize?: number
  onChange: (page: number) => void
}

export function PaginationControls({
  page,
  count,
  pageSize = 20,
  onChange,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div className="flex items-center justify-between rounded-xl border border-[#ececec] bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => canPrev && onChange(page - 1)}
          disabled={!canPrev}
          className="rounded-lg border border-[#ddd] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#1a1c1c] disabled:opacity-50"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => canNext && onChange(page + 1)}
          disabled={!canNext}
          className="rounded-lg bg-[#af0f24] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

