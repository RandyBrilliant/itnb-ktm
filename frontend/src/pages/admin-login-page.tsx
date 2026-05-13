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
    <div className="relative min-h-screen overflow-hidden bg-[#f9f9f9]">
      <div className="pointer-events-none absolute inset-0">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCuGojv2buPiRCfbP63G6MUQ_DKaKCNj4MIwWesMDWVXbWhfMYQAJVH7JvOLTgZg_TepVyMfP0n6aWEZK_PXWHAy7KgS9Xxz7zLUXxSVibK0e5rAP7O1-horoXzQh_4zQGNOap4MM14sTs6ul6b6U9jlgIslEjW-upcIIovL65lpOyMjeq6QIP0iXuOwQwr_JUrTSByQgRYP8qPkoCkpMrZxagurxF5BOnlh5WEZYwAuPCC_gkj4daW35Qrajgw2vuFB6r8H8JLpiYr"
          alt="University library background"
          className="h-full w-full object-cover opacity-20 grayscale"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#f9f9f9]/95 via-[#f9f9f9]/88 to-[#af0f24]/10" />

      <AnimatedPage className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-center justify-center px-4 py-8 sm:px-6 lg:justify-between lg:px-12">
        <section className="hidden lg:flex lg:max-w-xl lg:flex-col lg:justify-center lg:pr-14">
          <img
            src="/img/logo-single.png"
            alt="IT&B crest logo"
            className="mb-6 h-24 w-24 object-contain"
          />
          <h1 className="font-[var(--font-heading)] text-5xl font-extrabold leading-tight tracking-tight text-[#1a1c1c]">
            IT&amp;B
            <br />
            <span className="text-[#af0f24]">Admin</span>
            <br />
            Command.
          </h1>

          <p className="mt-8 max-w-lg font-[var(--font-body)] text-lg leading-relaxed text-[#5f5e5e]">
            Secure access for administrators to manage records, user operations, and institutional updates from one central dashboard.
          </p>

          <div className="mt-12 flex items-center">
            <div className="border-l-2 border-[#af0f24] pl-4">
              <p className="font-[var(--font-body)] text-xs font-bold tracking-[0.2em] text-[#af0f24]">
                AUTHORIZED
              </p>
              <p className="font-[var(--font-heading)] text-4xl font-extrabold text-[#1a1c1c]">
                ACCESS
              </p>
            </div>
          </div>
        </section>

        <section className="relative w-full max-w-md border border-white/40 bg-white/80 p-6 backdrop-blur-2xl sm:p-10">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-[#af0f24]" />

          <div className="mb-8 pl-2 sm:mb-10">
            <img
              src="/img/logo-single.png"
              alt="IT&B crest logo"
              className="mb-4 h-14 w-14 object-contain"
            />
            <h2 className="font-[var(--font-heading)] text-3xl font-black uppercase tracking-tight text-[#1a1c1c]">
              Admin Portal
            </h2>
            <p className="mt-2 font-[var(--font-body)] text-xs font-semibold tracking-[0.12em] text-[#5f5e5e] sm:text-sm">
              SIGN IN TO ACCESS THE ADMIN DASHBOARD
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 pl-2 sm:space-y-8">
            {error && (
              <div className="rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block font-[var(--font-body)] text-xs font-bold uppercase tracking-[0.12em] text-[#af0f24] sm:text-sm"
                >
                  Admin Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-[#5f5e5e]">
                    mail
                  </span>
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    placeholder="admin@itnb.local"
                    className="w-full border-0 border-b border-[#e4beba] bg-transparent pb-2 pl-8 font-[var(--font-body)] text-base text-[#1a1c1c] outline-none placeholder:text-[#8f6f6c] focus:border-[#af0f24] disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-2 block font-[var(--font-body)] text-xs font-bold uppercase tracking-[0.12em] text-[#af0f24] sm:text-sm"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-[#5f5e5e]">
                    lock
                  </span>
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="••••••••"
                    className="w-full border-0 border-b border-[#e4beba] bg-transparent pb-2 pl-8 pr-8 font-[var(--font-body)] text-base text-[#1a1c1c] outline-none placeholder:text-[#8f6f6c] focus:border-[#af0f24] disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[#5f5e5e] transition-colors hover:text-[#af0f24]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 bg-gradient-to-br from-[#af0f24] to-[#d32f39] px-5 py-3 font-[var(--font-heading)] text-lg font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{isLoading ? "Signing In..." : "Sign In as Admin"}</span>
              {!isLoading && (
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  arrow_forward
                </span>
              )}
            </button>
          </form>
        </section>
      </AnimatedPage>
    </div>
  )
}
