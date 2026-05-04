type AdminStatCardProps = {
  title: string
  value: string
  icon: string
  hint: string
  accent?: "success" | "warning" | "neutral"
}

export function AdminStatCard({ title, value, icon, hint, accent = "neutral" }: AdminStatCardProps) {
  const accentClass =
    accent === "success"
      ? "text-green-700"
      : accent === "warning"
        ? "text-[#af0f24]"
        : "text-[#5f5e5e]"

  return (
    <div className="rounded-sm bg-white p-8 shadow-[32px_0_32px_rgba(175,15,36,0.04)] transition-transform duration-300 hover:-translate-y-1">
      <div className="mb-6 flex items-start justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#af0f24]">{title}</span>
        <span className="material-symbols-outlined text-[#af0f24]/25">{icon}</span>
      </div>
      <p className="font-[var(--font-heading)] text-5xl font-extrabold text-[#1a1c1c]">{value}</p>
      <p className={`mt-4 text-xs font-medium ${accentClass}`}>{hint}</p>
    </div>
  )
}
