import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types/auth"
import { getRoleNavigation } from "@/lib/role-navigation"
import { useAuth } from "@/hooks/use-auth"
import { getRoleBasePath } from "@/lib/role-path"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"

interface RoleShellProps {
  role: UserRole
  title: string
  subtitle?: string
  avatarUrl?: string
  children: ReactNode
}

export function RoleShell({
  role,
  title,
  subtitle,
  avatarUrl,
  children,
}: RoleShellProps) {
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuContainerRef = useRef<HTMLDivElement | null>(null)
  const { logout } = useAuth()
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
  const initials = role.slice(0, 1)

  const isActive = (href: string): boolean => {
    if (href === "/student" || href === "/staff" || href === "/lecturer") {
      return location.pathname === href || location.pathname === `${href}/dashboard`
    }
    return location.pathname.startsWith(href)
  }

  const handleLogout = async () => {
    try {
      await logout({ redirectTo: "/login", callApi: true })
      toast.success("Logged out successfully")
    } catch (error) {
      toast.error("Logout failed", getUserFriendlyError(error, "logout"))
    }
  }

  useEffect(() => {
    // Close user menu when route changes.
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

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-[#ececec] bg-white lg:block">
        <div className="m-4 rounded-2xl bg-gradient-to-br from-[#af0f24] to-[#d32f39] px-5 py-4 text-white">
          <img
            src="/img/logo-full.png"
            alt="IT&B full logo"
            className="h-12 w-auto max-w-full object-contain"
          />
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/80">
            {role.toLowerCase()} workspace
          </p>
        </div>
        <nav className="space-y-1 px-3 py-2">
          {navItems.map((item, index) => {
            const active = isActive(item.href)
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.18 }}
              >
                <Link
                  to={item.href}
                  className={cn(
                    "relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    active ? "text-[#af0f24]" : "text-[#5f5e5e] hover:bg-[#f7f7f7]"
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="desktop-nav-active-indicator"
                      className="absolute inset-0 rounded-xl bg-[#af0f24]/10"
                      transition={{ type: "spring", stiffness: 360, damping: 30 }}
                    />
                  ) : null}
                  <span className="material-symbols-outlined relative z-10 text-base">
                    {item.icon}
                  </span>
                  <span className="relative z-10">{item.label}</span>
                </Link>
              </motion.div>
            )
          })}
        </nav>
        <div className="absolute bottom-4 left-3 right-3 space-y-1 border-t border-[#f1f1f1] pt-3">
          <Link
            to={`${basePath}/profile`}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#5f5e5e] hover:bg-[#f7f7f7]"
          >
            <span className="material-symbols-outlined text-base">person</span>
            Profile
          </Link>
          <Link
            to={`${basePath}/change-password`}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#5f5e5e] hover:bg-[#f7f7f7]"
          >
            <span className="material-symbols-outlined text-base">lock</span>
            Security
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#af0f24] hover:bg-[#fff4f4]"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Logout
          </button>
        </div>
      </aside>

      <header className="fixed top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#ececec]/80 bg-[#f9f9f9]/80 px-4 backdrop-blur-md lg:pl-[304px] lg:pr-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden"
            aria-label="Open navigation"
          >
            <span className="material-symbols-outlined text-[#af0f24]">menu</span>
          </button>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-[#1a1c1c]">{title}</p>
            {subtitle ? (
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
                {subtitle}
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
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#af0f24]">
                {initials}
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
                onClick={handleLogout}
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
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white p-4 lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.22 }}
            >
              <div className="mb-4 rounded-2xl bg-gradient-to-br from-[#af0f24] to-[#d32f39] px-4 py-4 text-white">
                <div className="mb-3 flex items-center justify-between">
                  <img
                    src="/img/logo-full.png"
                    alt="IT&B full logo"
                    className="h-9 w-auto max-w-[180px] object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close navigation"
                    className="rounded-md bg-white/20 p-1"
                  >
                    <span className="material-symbols-outlined text-white">close</span>
                  </button>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                  {role.toLowerCase()} workspace
                </p>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        "relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                        active
                          ? "bg-[#af0f24]/10 text-[#af0f24]"
                          : "text-[#5f5e5e] hover:bg-[#f3f3f3]"
                      )}
                    >
                      <span className="material-symbols-outlined text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
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
  )
}
