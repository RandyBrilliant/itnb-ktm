import { useMemo, useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { resetPassword } from "@/api/auth"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"
import { AnimatedPage } from "@/components/animation/animated-page"

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const uid = useMemo(() => params.get("uid") || "", [params])
  const token = useMemo(() => params.get("token") || "", [params])
  const hasValidParams = Boolean(uid && token)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!hasValidParams) {
      toast.error("Invalid link", "Password reset link is missing required data.")
      return
    }
    if (!password || !passwordConfirm) {
      toast.error("Missing fields", "Please fill in both password fields.")
      return
    }
    if (password !== passwordConfirm) {
      toast.error("Mismatch", "Passwords do not match.")
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword({
        uid,
        token,
        new_password: password,
        new_password_confirm: passwordConfirm,
      })
      toast.success("Password updated", "You can now sign in with your new password.")
      navigate("/login", { replace: true })
    } catch (err: unknown) {
      toast.error("Reset failed", getUserFriendlyError(err, "reset-password"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f3f3] px-4">
      <AnimatedPage className="w-full max-w-md border border-[#e2e2e2] bg-white p-8">
        <h1 className="font-[var(--font-heading)] text-3xl font-extrabold text-[#1a1c1c]">
          Reset Password
        </h1>
        <p className="mt-2 font-[var(--font-body)] text-sm text-[#5f5e5e]">
          Enter your new password to complete account recovery.
        </p>

        {!hasValidParams && (
          <div className="mt-5 rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            This reset link is invalid. Please request a new one.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="relative">
            <label
              htmlFor="new-password"
              className="mb-2 block text-sm font-semibold text-[#af0f24]"
            >
              New Password
            </label>
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting || !hasValidParams}
              className="w-full border border-[#d5d5d5] bg-white px-3 py-2 pr-10 text-[#1a1c1c] outline-none focus:border-[#af0f24] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-[38px] text-[#5f5e5e] transition-colors hover:text-[#af0f24]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <span className="material-symbols-outlined">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>

          <div className="relative">
            <label
              htmlFor="new-password-confirm"
              className="mb-2 block text-sm font-semibold text-[#af0f24]"
            >
              Confirm Password
            </label>
            <input
              id="new-password-confirm"
              type={showPasswordConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              disabled={isSubmitting || !hasValidParams}
              className="w-full border border-[#d5d5d5] bg-white px-3 py-2 pr-10 text-[#1a1c1c] outline-none focus:border-[#af0f24] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm((prev) => !prev)}
              className="absolute right-2 top-[38px] text-[#5f5e5e] transition-colors hover:text-[#af0f24]"
              aria-label={showPasswordConfirm ? "Hide password" : "Show password"}
            >
              <span className="material-symbols-outlined">
                {showPasswordConfirm ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !hasValidParams}
            className="w-full bg-[#af0f24] px-4 py-3 font-[var(--font-heading)] text-base font-bold text-white transition hover:bg-[#930019] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Updating..." : "Set New Password"}
          </button>
        </form>

        <Link
          to="/login"
          className="mt-6 inline-block font-[var(--font-body)] text-sm font-semibold text-[#5f5e5e] hover:text-[#af0f24]"
        >
          Back to Login
        </Link>
      </AnimatedPage>
    </div>
  )
}
