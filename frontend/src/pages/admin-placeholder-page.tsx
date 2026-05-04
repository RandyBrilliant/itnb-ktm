type AdminPlaceholderPageProps = {
  title: string
  description: string
}

export function AdminPlaceholderPage({ title, description }: AdminPlaceholderPageProps) {
  return (
    <div className="rounded-sm border border-[#e2e2e2] bg-white p-10 shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Admin Module</p>
      <h1 className="mt-2 font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-[#5f5e5e]">{description}</p>
      <div className="mt-8 rounded-sm border border-dashed border-[#d5d5d5] bg-[#f9f9f9] p-6">
        <p className="text-sm text-[#5f5e5e]">
          This module is staged next. The admin shell, navigation, and design system are already prepared for this page.
        </p>
      </div>
    </div>
  )
}
