import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getUserFriendlyError } from "@/lib/error-message"
import { toast } from "@/lib/toast"
import { isAdminSectionActive } from "@/lib/admin-nav-active"
import { ConfirmLogoutModal } from "@/components/auth/confirm-logout-modal"

type MenuItem = {
  title: string
  href: string
  icon: string
  /** Only highlight on exact path (e.g. dashboard). Omit to include /new, /:id/edit under the same section. */
  exact?: boolean
}

const primaryMenuItems: MenuItem[] = [
  { title: "Dashboard", href: "/admin/dashboard", icon: "dashboard", exact: true },
  { title: "Student Records", href: "/admin/users", icon: "person_book", exact: true },
  { title: "Administrator Records", href: "/admin/users/admins", icon: "shield_person" },
  { title: "Staff Records", href: "/admin/users/staff", icon: "badge" },
  { title: "Lecturer Records", href: "/admin/users/lecturers", icon: "school" },
  { title: "Certificates", href: "/admin/certificates", icon: "verified_user" },
  { title: "Student Benefits", href: "/admin/benefits", icon: "sell" },
  { title: "Campus News", href: "/admin/posts", icon: "newspaper" },
]

export function AdminSidebar() {
  const { logout } = useAuth()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout({ redirectTo: "/admin/login" })
      toast.success("Signed out", "You have safely logged out.")
    } catch (error) {
      toast.error("Logout failed", getUserFriendlyError(error, "logout"))
    } finally {
      setIsLoggingOut(false)
      setShowLogoutModal(false)
    }
  }

  const isProfileActive =
    location.pathname === "/admin/profile" || location.pathname === "/admin/change-password"

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed left-4 top-4 z-[70] rounded-sm bg-[#af0f24] p-2 text-white shadow-lg lg:hidden"
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen ? (
        <button
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close sidebar overlay"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-[#af0f24] py-8 text-sm font-medium text-white shadow-[32px_0px_32px_rgba(175,15,36,0.08)] transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-12 flex flex-col items-center gap-4 px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-white/10 backdrop-blur-md">
            <img src="/img/logo-single.png" alt="IT&B logo" className="h-11 w-11 object-contain" />
          </div>
          <div className="text-center">
            <h1 className="font-[var(--font-heading)] text-2xl font-black uppercase tracking-wider">IT&B</h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/70">Admin Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {primaryMenuItems.map((item) => {
            const isActive = isAdminSectionActive(location.pathname, item.href, item.exact)
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-sm px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? "bg-[#d32f39] font-bold text-white"
                    : "text-white/80 hover:bg-[#d32f39]/50 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto space-y-1 px-4 pt-8">
          <Link
            to="/admin/profile"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 rounded-sm px-4 py-3 transition-all duration-200 ${
              isProfileActive
                ? "bg-[#d32f39] font-bold text-white"
                : "text-white/80 hover:bg-[#d32f39]/50 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
            <span>Profile</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-sm px-4 py-3 text-white/80 transition-all duration-200 hover:bg-[#d32f39]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {showLogoutModal ? (
        <ConfirmLogoutModal
          open={showLogoutModal}
          isLoading={isLoggingOut}
          onCancel={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
        />
      ) : null}
    </>
  )
}
