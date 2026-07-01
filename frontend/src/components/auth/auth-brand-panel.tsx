export function AuthBrandPanel() {
  return (
    <section className="hidden lg:flex lg:max-w-xl lg:flex-col lg:justify-center lg:pr-14">
      <img
        src="/img/logo-single.png"
        alt="IT&B crest logo"
        className="mb-6 h-24 w-24 object-contain"
      />
      <h1 className="font-[var(--font-heading)] text-5xl font-extrabold leading-tight tracking-tight text-[#1a1c1c]">
        IT&amp;B
        <br />
        <span className="text-[#af0f24]">Institutional</span>
        <br />
        Prestige.
      </h1>

      <p className="mt-8 max-w-lg font-[var(--font-body)] text-lg leading-relaxed text-[#5f5e5e]">
        Welcome to the unified digital experience for students and staff. Access
        your academic records, library resources, and institutional support
        securely.
      </p>

      <div className="mt-12 flex items-center">
        <div className="border-l-2 border-[#af0f24] pl-4">
          <p className="font-[var(--font-body)] text-xs font-bold tracking-[0.2em] text-[#af0f24]">
            EST
          </p>
          <p className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">
            2006
          </p>
        </div>
      </div>
    </section>
  )
}
