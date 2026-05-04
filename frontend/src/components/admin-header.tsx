import { useAuth } from "@/hooks/use-auth"
import { resolveMediaUrl } from "@/lib/media-url"

export function AdminHeader() {
  const { user } = useAuth()
  const userPhoto = resolveMediaUrl(user?.photo)
  const userName = user?.full_name || user?.email || "Admin User"
  const userRole = user?.role === "ADMIN" ? "Administrator" : user?.role || "Admin"

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-[#e8e8e8] bg-[#f3f3f3] px-6 lg:px-8">
      <div className="flex items-center gap-8">
        <span className="font-[var(--font-heading)] text-xl font-black tracking-tight text-[#af0f24]">
          IT&B University Portal
        </span>
        <nav className="hidden items-center gap-6 md:flex">
          <button className="px-2 py-1 text-sm font-semibold text-[#1a1c1c] transition-colors hover:text-[#af0f24]">
            Campus News
          </button>
          <button className="px-2 py-1 text-sm font-semibold text-[#1a1c1c] transition-colors hover:text-[#af0f24]">
            Directory
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative rounded-sm p-2 text-[#5f5e5e] transition-colors hover:text-[#af0f24]">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#af0f24]" />
        </button>
        <button className="rounded-sm p-2 text-[#5f5e5e] transition-colors hover:text-[#af0f24]">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="flex items-center gap-3 border-l border-[#d7d7d7] pl-4">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold text-[#1a1c1c]">{userName}</p>
            <p className="text-[10px] text-[#5f5e5e]">{userRole}</p>
          </div>
          {userPhoto ? (
            <img
              src={userPhoto}
              alt={userName}
              className="h-10 w-10 rounded-sm border-2 border-white object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-sm border-2 border-white bg-[#af0f24] text-xs font-bold text-white">
              {userName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="text-[10px] text-[#5f5e5e] sm:hidden">
            <p className="max-w-[90px] truncate font-semibold text-[#1a1c1c]">{userName}</p>
            <p>{userRole}</p>
          </div>
          <div className="hidden min-w-[1px] self-stretch bg-[#d7d7d7] md:block" />
          <div className="hidden text-[10px] uppercase tracking-[0.14em] text-[#af0f24] md:block">
            <p className="font-bold">Active</p>
            <p className="text-[#5f5e5e]">Session</p>
          </div>
        </div>
      </div>
    </header>
  )
}
