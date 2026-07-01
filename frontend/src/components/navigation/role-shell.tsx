import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types/auth"
import { getRoleNavigation } from "@/lib/role-navigation"
import { useAuth } from "@/hooks/use-auth"
import { getRoleBasePath } from "@/lib/role-path"
import { resolveMediaUrl } from "@/lib/media-url"
import { useAcademicYearSubtitle } from "@/hooks/use-academic-year-subtitle"
import { ConfirmLogoutModal } from "@/components/auth/confirm-logout-modal"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"

interface RoleShellProps {
  role: UserRole
  title: string
  subtitle?: string
  avatarUrl?: string
  children: ReactNode
}

const ROLE_PORTAL_LABEL: Record<UserRole, string> = {
  STUDENT: "Student Portal",
  STAFF: "Staff Portal",
  LECTURER: "Lecturer Portal",
  ADMIN: "Admin Portal",
  ALUMNI: "Alumni Portal",
}

interface SidebarNavProps {
  role: UserRole
  navItems: ReturnType<typeof getRoleNavigation>
  basePath: string
  avatarUrl?: string
  isActive: (href: string) => boolean
  onNavigate?: () => void
  onRequestLogout: () => void
  showClose?: boolean
  onClose?: () => void
}

function SidebarNav({
  role,
  navItems,
  basePath,
  avatarUrl,
  isActive,
  onNavigate,
  onRequestLogout,
  showClose,
  onClose,
}: SidebarNavProps) {
  const { user } = useAuth()
  const displayName = user?.full_name || role.charAt(0) + role.slice(1).toLowerCase()
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#f0f0f0] px-5 pb-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col items-center text-center">
            <img
              src="/img/logo-full.png"
              alt="IT&B"
              className="h-auto w-full max-w-[168px] object-contain"
            />
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#af0f24]">
              {ROLE_PORTAL_LABEL[role]}
            </p>
          </div>
          {showClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="rounded-lg p-1.5 text-[#5f5e5e] hover:bg-[#f5f5f5]"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b0b0b0]">
          Menu
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <li key={item.id}>
                <Link
                  to={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "bg-[#af0f24] text-white shadow-[0_8px_20px_rgba(175,15,36,0.22)]"
                      : "text-[#5f5e5e] hover:bg-[#f7f7f7] hover:text-[#1a1c1c]"
                  )}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined text-[20px]",
                      active ? "text-white" : "text-[#9a9a9a] group-hover:text-[#af0f24]"
                    )}
                    style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-[#f0f0f0] p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#fafafa] p-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#ececec] bg-[#e8e8e8]">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#af0f24]">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#1a1c1c]">{displayName}</p>
            <p className="truncate text-[11px] font-medium text-[#8a8a8a]">
              {user?.department || user?.email || role.toLowerCase()}
            </p>
          </div>
        </div>

        <div className="space-y-0.5">
          <Link
            to={`${basePath}/profile`}
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#5f5e5e] transition-colors hover:bg-[#f7f7f7] hover:text-[#1a1c1c]"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            Profile
          </Link>
          <Link
            to={`${basePath}/change-password`}
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#5f5e5e] transition-colors hover:bg-[#f7f7f7] hover:text-[#1a1c1c]"
          >
            <span className="material-symbols-outlined text-[18px]">lock</span>
            Security
          </Link>
          <button
            type="button"
            onClick={onRequestLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#af0f24] transition-colors hover:bg-[#fff4f4]"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export function RoleShell({
  role,
  title,
  subtitle,
  avatarUrl,
  children,
}: RoleShellProps) {
  const location = useLocation()
  const academicYearSubtitle = useAcademicYearSubtitle(role)
  const displaySubtitle = subtitle ?? academicYearSubtitle
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuContainerRef = useRef<HTMLDivElement | null>(null)
  const { user, logout } = useAuth()
  const navItems = useMemo(() => getRoleNavigation(role), [role])
  const mobileNavItems = useMemo(() => {
    const idItem = navItems.find((item) => item.id === "id")
    if (!idItem || navItems.length <= 2) {
      return navItems
    }

    const others = navItems.filter((item) => item.id !== "id")
    const middleIndex = Math.floor(others.length / 2)
    return [...others.slice(0, middleIndex), idItem, ...others.slice(middleIndex)]
  }, [navItems])
  const basePath = getRoleBasePath(role)
  const displayName = user?.full_name || role.charAt(0) + role.slice(1).toLowerCase()
  const userInitials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const resolvedAvatarUrl =
    avatarUrl ?? (user?.photo ? resolveMediaUrl(user.photo) : undefined)

  const isActive = (href: string): boolean => {
    if (href === "/student" || href === "/staff" || href === "/lecturer") {
      return location.pathname === href || location.pathname === `${href}/dashboard`
    }
    return location.pathname.startsWith(href)
  }

  const handleLogout = async () => {
    if (isLoggingOut) return
    try {
      setIsLoggingOut(true)
      await logout({ redirectTo: "/login", callApi: true })
      toast.success("Logged out successfully")
    } catch (error) {
      toast.error("Logout failed", getUserFriendlyError(error, "logout"))
    } finally {
      setIsLoggingOut(false)
      setShowLogoutModal(false)
      setMenuOpen(false)
      setDrawerOpen(false)
    }
  }

  const requestLogout = () => {
    setMenuOpen(false)
    setShowLogoutModal(true)
  }

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (!menuContainerRef.current) return
      if (!menuContainerRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [menuOpen])

  const sidebarProps = {
    role,
    navItems,
    basePath,
    avatarUrl: resolvedAvatarUrl,
    isActive,
    onRequestLogout: requestLogout,
  }

  return (
    <>
    <div className="min-h-screen bg-[#f9f9f9]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-[#ececec] bg-white shadow-[4px_0_24px_rgba(0,0,0,0.04)] lg:flex">
        <div className="absolute inset-y-0 left-0 w-1 bg-[#af0f24]" aria-hidden />
        <SidebarNav {...sidebarProps} />
      </aside>

      <header className="fixed top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#ececec]/80 bg-[#f9f9f9]/80 px-4 backdrop-blur-md lg:pl-[304px] lg:pr-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-1.5 text-[#af0f24] hover:bg-[#af0f24]/10 lg:hidden"
            aria-label="Open navigation"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-[#1a1c1c]">{title}</p>
            {displaySubtitle ? (
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
                {displaySubtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div ref={menuContainerRef} className="relative flex items-center gap-2">
          <div className="hidden rounded-full border border-[#e4beba]/40 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#af0f24] md:block">
            Active
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="h-9 w-9 overflow-hidden rounded-full border border-[#e4beba]/30 bg-[#e8e8e8]"
            aria-label="Open account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {resolvedAvatarUrl ? (
              <img src={resolvedAvatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#af0f24]">
                {userInitials}
              </div>
            )}
          </button>
          {menuOpen ? (
            <div
              className="absolute right-0 top-12 w-52 rounded-xl border border-[#ececec] bg-white p-2 shadow-lg"
              role="menu"
              aria-label="Account menu"
            >
              <Link
                to={`${basePath}/profile`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#1a1c1c] hover:bg-[#f7f7f7]"
              >
                <span className="material-symbols-outlined text-base">person</span>
                My Profile
              </Link>
              <Link
                to={`${basePath}/change-password`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#1a1c1c] hover:bg-[#f7f7f7]"
              >
                <span className="material-symbols-outlined text-base">lock</span>
                Change Password
              </Link>
              <button
                type="button"
                onClick={requestLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#af0f24] hover:bg-[#fff4f4]"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation overlay"
              className="fixed inset-0 z-40 bg-black/35 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 overflow-hidden border-r border-[#ececec] bg-white shadow-xl lg:hidden"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "tween", duration: 0.22 }}
            >
              <div className="absolute inset-y-0 left-0 w-1 bg-[#af0f24]" aria-hidden />
              <SidebarNav
                {...sidebarProps}
                showClose
                onClose={() => setDrawerOpen(false)}
                onNavigate={() => setDrawerOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-20 lg:pl-[304px] lg:pr-8 lg:pb-8">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] lg:hidden">
        <div className="mx-auto max-w-md rounded-t-3xl border border-white/70 bg-white/90 px-3 pt-2 shadow-[0px_-6px_28px_rgba(175,15,36,0.1)] backdrop-blur-xl">
          <div className="flex items-end justify-between gap-1">
            {mobileNavItems.map((item) => {
              const active = isActive(item.href)
              const isPrimary = item.id === "id"
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className={cn(
                    "relative flex min-w-0 flex-1 flex-col items-center justify-end rounded-xl pb-2 transition-all duration-250",
                    isPrimary ? "-mt-6" : "pt-2",
                    active ? "text-[#af0f24]" : "text-[#8f8f8f] hover:text-[#5f5e5e]"
                  )}
                >
                  {isPrimary ? (
                    <motion.span
                      animate={{ scale: active ? 1.06 : 1.03 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={cn(
                        "relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white shadow-lg",
                        "bg-[#af0f24] text-white shadow-[0px_10px_24px_rgba(175,15,36,0.35)]"
                      )}
                    >
                      <span
                        className="material-symbols-outlined text-2xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {item.icon}
                      </span>
                    </motion.span>
                  ) : (
                    <>
                      {active ? (
                        <motion.span
                          layoutId="mobile-nav-active-indicator"
                          className="absolute inset-x-1 top-0 bottom-1 rounded-xl bg-[#af0f24]/10"
                          transition={{ type: "spring", stiffness: 380, damping: 28 }}
                        />
                      ) : null}
                      <motion.span
                        className={cn(
                          "material-symbols-outlined relative z-10 text-[22px]",
                          active ? "text-[#af0f24]" : "text-[#8f8f8f]"
                        )}
                        animate={{ y: active ? -1 : 0, scale: active ? 1.08 : 1 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {item.icon}
                      </motion.span>
                    </>
                  )}

                  <motion.span
                    className={cn(
                      "relative z-10 mt-1 truncate text-[10px] font-bold tracking-tight",
                      isPrimary ? "text-[#af0f24]" : active ? "text-[#af0f24]" : "text-[#8f8f8f]"
                    )}
                    animate={{ opacity: active ? 1 : 0.82 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>

    <ConfirmLogoutModal
      open={showLogoutModal}
      isLoading={isLoggingOut}
      onCancel={() => setShowLogoutModal(false)}
      onConfirm={handleLogout}
    />
    </>
  )
}
