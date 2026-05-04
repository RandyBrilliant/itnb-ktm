import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { requestPasswordReset } from "@/api/auth"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"
import { AnimatedPage } from "@/components/animation/animated-page"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Missing email", "Please enter your email address.")
      return
    }

    setIsSubmitting(true)
    try {
      await requestPasswordReset({ email })
      toast.success(
        "Request received",
        "If this account exists, a reset link has been sent."
      )
    } catch (err: unknown) {
      toast.error("Request failed", getUserFriendlyError(err, "forgot-password"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f9f9f9]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#f9f9f9]/95 via-[#f9f9f9]/88 to-[#af0f24]/10" />
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <AnimatedPage className="relative w-full max-w-md border border-white/40 bg-white/80 p-6 backdrop-blur-2xl sm:p-10">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-[#af0f24]" />
          <div className="pl-2">
            <h1 className="font-[var(--font-heading)] text-3xl font-black uppercase tracking-tight text-[#1a1c1c]">
              Forgot Password
            </h1>
            <p className="mt-2 font-[var(--font-body)] text-sm text-[#5f5e5e]">
              Enter your email and we will send a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6 pl-2">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block font-[var(--font-body)] text-xs font-bold uppercase tracking-[0.12em] text-[#af0f24] sm:text-sm"
              >
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-[#5f5e5e]">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="you@example.com"
                  className="w-full border-0 border-b border-[#e4beba] bg-transparent pb-2 pl-8 font-[var(--font-body)] text-base text-[#1a1c1c] outline-none placeholder:text-[#8f6f6c] focus:border-[#af0f24] disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-br from-[#af0f24] to-[#d32f39] px-5 py-3 font-[var(--font-heading)] text-lg font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Send Reset Link"}
            </button>
          </form>

          <Link
            to="/login"
            className="mt-6 inline-block pl-2 font-[var(--font-body)] text-sm font-semibold text-[#5f5e5e] hover:text-[#af0f24]"
          >
            Back to Login
          </Link>
        </AnimatedPage>
      </div>
    </div>
  )
}
