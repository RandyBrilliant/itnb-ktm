import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"
import { AnimatedPage } from "@/components/animation/animated-page"

export function AdminLoginPage() {
  const navigate = useNavigate()
  const { login, logout, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    try {
      const user = await login(email, password, { redirect: false })
      if (user.role !== "ADMIN") {
        toast.info("Public portal required", "Please sign in from /login.")
        setError("This portal is only for admin accounts.")
        await logout({ redirectTo: "/login", callApi: false })
        return
      }
      toast.success("Admin login successful", "Redirecting to dashboard...")
      navigate("/admin/dashboard", { replace: true })
    } catch (err: unknown) {
      const errorMessage = getUserFriendlyError(err, "admin-login")
      setError(errorMessage)
      toast.error("Login failed", errorMessage)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f3f3f3]">
      <div className="hidden min-h-screen w-[40%] flex-col justify-between bg-[#af0f24] p-10 text-white lg:flex">
        <div>
          <img src="/img/logo-single.png" alt="IT&B logo" className="mb-8 h-14 w-14 object-contain" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Institutional Access</p>
          <h1 className="mt-4 font-[var(--font-heading)] text-5xl font-extrabold leading-tight">
            Admin Command Center.
          </h1>
          <p className="mt-4 max-w-sm text-sm text-white/80">
            Manage records, staff operations, institutional updates, and daily execution in one secured control panel.
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/70">
          IT&B University Portal • Authorized Personnel Only
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <AnimatedPage className="w-full max-w-md rounded-sm border border-[#e2e2e2] bg-white p-8 shadow-[32px_0_32px_rgba(175,15,36,0.08)]">
          <div className="mb-8">
            <img src="/img/logo-single.png" alt="IT&B crest logo" className="mb-4 h-14 w-14 object-contain lg:hidden" />
            <p className="text-xs font-semibold tracking-[0.14em] text-[#5f5e5e]">ADMIN PORTAL</p>
            <h2 className="mt-2 font-[var(--font-heading)] text-3xl font-extrabold text-[#1a1c1c]">
              Dashboard Access
            </h2>
            <p className="mt-2 text-sm text-[#5f5e5e]">Sign in with your administrator account credentials.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            ) : null}

            <div>
              <label htmlFor="admin-email" className="mb-2 block text-sm font-semibold text-[#af0f24]">
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="admin@itnb.local"
                className="w-full border border-[#d5d5d5] bg-white px-3 py-2 text-[#1a1c1c] outline-none transition focus:border-[#af0f24] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-[#af0f24]">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="w-full border border-[#d5d5d5] bg-white px-3 py-2 pr-10 text-[#1a1c1c] outline-none transition focus:border-[#af0f24] disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5f5e5e] transition-colors hover:text-[#af0f24]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#af0f24] px-4 py-3 font-[var(--font-heading)] text-base font-bold text-white transition hover:bg-[#930019] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign In as Admin"}
            </button>
          </form>
        </AnimatedPage>
      </div>
    </div>
  )
}
