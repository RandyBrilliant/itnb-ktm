import { Outlet } from "react-router-dom"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <AdminSidebar />
      <div className="min-h-screen lg:ml-64">
        <AdminHeader />
        <main className="px-4 pb-8 pt-6 sm:px-8 sm:pt-8 xl:px-12">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
        <footer className="mt-8 border-t border-[#e2e2e2] bg-white px-6 py-8 sm:px-8 xl:px-12">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-4">
              <img src="/img/logo-single.png" alt="IT&B logo" className="h-8 w-8 object-contain" />
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#5f5e5e]">
                © IT&B University. Academic Excellence. Professional Integrity.
              </p>
            </div>
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5f5e5e]">
              <button className="transition-colors hover:text-[#af0f24]">Privacy Policy</button>
              <button className="transition-colors hover:text-[#af0f24]">Institutional Standards</button>
              <button className="transition-colors hover:text-[#af0f24]">Staff Support</button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
