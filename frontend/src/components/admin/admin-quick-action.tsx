import { Link } from "react-router-dom"

type AdminQuickActionProps = {
  title: string
  icon: string
  href?: string
  onClick?: () => void
}

const cardClass =
  "group flex w-full items-center justify-between rounded-lg border border-transparent bg-[#f7f7f6] p-5 text-left transition hover:border-[#af0f24]/15 hover:bg-white hover:shadow-[0_8px_24px_rgba(175,15,36,0.06)]"

export function AdminQuickAction({ title, icon, href, onClick }: AdminQuickActionProps) {
  const inner = (
    <>
      <span className="flex items-center gap-4">
        <span className="material-symbols-outlined text-[#af0f24]">{icon}</span>
        <span className="font-semibold text-[#1a1c1c]">{title}</span>
      </span>
      <span className="material-symbols-outlined text-[#5f5e5e] transition-transform group-hover:translate-x-1">
        chevron_right
      </span>
    </>
  )

  if (href) {
    return (
      <Link to={href} className={cardClass}>
        {inner}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={cardClass}>
      {inner}
    </button>
  )
}
