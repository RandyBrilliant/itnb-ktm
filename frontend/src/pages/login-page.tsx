import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel"
import { LoginCard } from "@/components/auth/login-card"
import { AnimatedPage } from "@/components/animation/animated-page"
import { getDashboardRouteForRole } from "@/types/auth"

/**
 * Login page for admin/staff/lecturer
 */
export function LoginPage() {
  const navigate = useNavigate()
  const { login, logout, isLoading } = useAuth()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    if (!identifier || !password) {
      setError("Please fill in all fields")
      return
    }

    try {
      const user = await login(identifier, password, { redirect: false })
      if (user.role === "ADMIN") {
        toast.info("Admin portal required", "Please sign in from /admin/login.")
        setError("Admin account must sign in from /admin/login.")
        await logout({ redirectTo: "/admin/login", callApi: false })
        return
      }
      localStorage.setItem("remember_login", rememberMe ? "true" : "false")

      toast.success("Login successful", "Redirecting to dashboard...")
      navigate(getDashboardRouteForRole(user.role), { replace: true })
    } catch (err: unknown) {
      const errorMessage = getUserFriendlyError(err, "login")
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
        <AuthBrandPanel />
        <LoginCard
          identifier={identifier}
          password={password}
          rememberMe={rememberMe}
          isLoading={isLoading}
          error={error}
          onIdentifierChange={setIdentifier}
          onPasswordChange={setPassword}
          onRememberChange={setRememberMe}
          onSubmit={handleSubmit}
          onForgotPassword={() => navigate("/forgot-password")}
        />
      </AnimatedPage>
    </div>
  )
}
