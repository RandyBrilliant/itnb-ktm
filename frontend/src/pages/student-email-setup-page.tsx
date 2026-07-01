import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { StudentEmailSetupForm } from "@/components/auth/student-email-setup-form"
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel"
import { AnimatedPage } from "@/components/animation/animated-page"
import { getPostLoginRoute } from "@/lib/email-setup"

export function StudentEmailSetupPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f9f9f9]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#f9f9f9]/95 via-[#f9f9f9]/88 to-[#af0f24]/10" />

      <AnimatedPage className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-center justify-center px-4 py-8 sm:px-6 lg:justify-between lg:px-12">
        <AuthBrandPanel />

        <section className="w-full max-w-md rounded-sm border border-[#e2e2e2] bg-white p-6 shadow-[32px_0_32px_rgba(175,15,36,0.06)] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">Account setup</p>
          <h1 className="mt-2 font-[var(--font-heading)] text-3xl font-extrabold text-[#1a1c1c]">
            Add your email
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5f5e5e]">
            Your account was created from a campus import. Before using the portal, add a personal
            email address and verify it with the code we send you.
          </p>

          <div className="mt-8">
            <StudentEmailSetupForm
              pendingEmail={user?.pending_email_change}
              onComplete={(updatedUser) => {
                navigate(getPostLoginRoute(updatedUser), { replace: true })
              }}
            />
          </div>
        </section>
      </AnimatedPage>
    </div>
  )
}
