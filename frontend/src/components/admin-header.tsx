import { useEffect, useRef, useState } from "react"
import { Link, NavLink } from "react-router-dom"
import { Bell } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getUserFriendlyError } from "@/lib/error-message"
import { resolveMediaUrl } from "@/lib/media-url"
import { toast } from "@/lib/toast"

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
    isActive ? "bg-[#af0f24]/10 text-[#af0f24]" : "text-[#1a1c1c] hover:bg-black/[0.04] hover:text-[#af0f24]",
  ].join(" ")
}

export function AdminHeader() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const userPhoto = resolveMediaUrl(user?.photo)
  const userName = user?.full_name || user?.email || "Admin User"
  const userRole =
    user?.role_display ||
    (user?.role === "ADMIN"
      ? "Administrator"
      : user?.role === "STAFF"
        ? "Staff"
        : user?.role === "LECTURER"
          ? "Lecturer"
          : user?.role || "User")

  useEffect(() => {
    if (!menuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    if (isLoggingOut) return
    try {
      setIsLoggingOut(true)
      await logout({ redirectTo: "/admin/login" })
      toast.success("Signed out", "You have safely logged out.")
    } catch (error) {
      toast.error("Logout failed", getUserFriendlyError(error, "logout"))
    } finally {
      setIsLoggingOut(false)
      setMenuOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#e8e6e4] bg-white/95 shadow-[0_1px_0_rgba(175,15,36,0.06)] backdrop-blur-md">
      <div className="flex h-[4.25rem] items-center justify-between gap-4 pl-2 pr-4 sm:pr-6 lg:pr-8">
        <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-8">
          <div
            className="hidden h-full w-1 shrink-0 rounded-full bg-gradient-to-b from-[#af0f24] to-[#7a0b1c] sm:block"
            aria-hidden
          />
          <Link to="/admin/dashboard" className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-90">
            <img src="/img/logo-single.png" alt="" className="h-9 w-9 shrink-0 object-contain" />
            <span className="font-[var(--font-heading)] text-lg font-black leading-tight tracking-tight text-[#af0f24] sm:text-xl">
              IT&amp;B University Portal
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Portal shortcuts">
            <NavLink to="/admin/posts" className={navLinkClass}>
              Campus News
            </NavLink>
            <NavLink to="/admin/users" className={navLinkClass}>
              Directory
            </NavLink>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <Link
            to="/admin/posts"
            title="Campus news & announcements"
            className="relative rounded-lg p-2.5 text-[#5f5e5e] transition-colors hover:bg-[#f5f5f5] hover:text-[#af0f24]"
          >
            <Bell className="h-[22px] w-[22px]" strokeWidth={2} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#af0f24] ring-2 ring-white" aria-hidden />
          </Link>

          <div ref={menuRef} className="relative flex items-center gap-3 border-l border-[#e8e6e4] pl-3 sm:pl-4">
            <div className="hidden text-right sm:block">
              <p className="max-w-[160px] truncate text-sm font-bold leading-tight text-[#1a1c1c]">{userName}</p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#7a736f]">{userRole}</p>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex shrink-0 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-2 ring-white transition hover:ring-[#af0f24]/30"
              aria-label="Toggle account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt=""
                  className="h-10 w-10 rounded-lg border border-[#ececec] object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#af0f24] text-sm font-bold text-white">
                  {userName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </button>

            <div className="text-[11px] text-[#5f5e5e] sm:hidden">
              <p className="max-w-[72px] truncate font-semibold text-[#1a1c1c]">{userName}</p>
              <p className="truncate">{userRole}</p>
            </div>

            {menuOpen && (
              <div
                className="absolute right-0 top-[52px] z-50 min-w-[200px] rounded-lg border border-[#e8e6e4] bg-white py-1.5 shadow-xl"
                role="menu"
                aria-label="Admin account menu"
              >
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f8f8f8] md:hidden"
                  role="menuitem"
                >
                  <span className="material-symbols-outlined text-base text-[#af0f24]">dashboard</span>
                  Dashboard
                </Link>
                <Link
                  to="/admin/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f8f8f8]"
                  role="menuitem"
                >
                  <span className="material-symbols-outlined text-base">person</span>
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-[#af0f24] transition-colors hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-70"
                  role="menuitem"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="flex gap-2 border-t border-[#f0eeec] bg-[#fafafa] px-4 py-2 md:hidden" aria-label="Mobile shortcuts">
        <NavLink to="/admin/posts" className={navLinkClass}>
          Campus News
        </NavLink>
        <NavLink to="/admin/users" className={navLinkClass}>
          Directory
        </NavLink>
      </nav>
    </header>
  )
}
