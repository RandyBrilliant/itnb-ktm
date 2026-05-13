type AdminFooterInfoPageProps = {
  title: string
  description: string
  sections: Array<{ heading: string; body: string }>
}

export function AdminFooterInfoPage({
  title,
  description,
  sections,
}: AdminFooterInfoPageProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-sm border border-[#e2e2e2] bg-white p-6 shadow-[32px_0_32px_rgba(175,15,36,0.04)]">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Administration</p>
        <h1 className="mt-2 font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">{title}</h1>
        <p className="mt-2 text-sm text-[#5f5e5e]">{description}</p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <section
            key={section.heading}
            className="rounded-sm border border-[#e2e2e2] bg-white p-6 shadow-[32px_0_32px_rgba(175,15,36,0.04)]"
          >
            <h2 className="text-lg font-bold text-[#1a1c1c]">{section.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#3b3b3b]">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
