type AdminQuickActionProps = {
  title: string
  icon: string
  onClick?: () => void
}

export function AdminQuickAction({ title, icon, onClick }: AdminQuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-sm bg-[#f3f3f3] p-6 text-left transition hover:bg-[#e8e8e8]"
    >
      <span className="flex items-center gap-4">
        <span className="material-symbols-outlined text-[#af0f24]">{icon}</span>
        <span className="font-semibold text-[#1a1c1c]">{title}</span>
      </span>
      <span className="material-symbols-outlined text-[#5f5e5e] transition-transform group-hover:translate-x-1">
        chevron_right
      </span>
    </button>
  )
}
