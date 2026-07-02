import { Link } from "react-router-dom"
import { Outlet } from "react-router-dom"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <AdminSidebar />
      <div className="flex min-h-screen flex-col lg:ml-64">
        <AdminHeader />
        <main className="flex-1 px-4 pb-8 pt-6 sm:px-8 sm:pt-8 xl:px-12">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-[#e2e2e2] bg-white px-6 py-8 sm:px-8 xl:px-12">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-4">
              <img src="/img/logo-single.png" alt="IT&B logo" className="h-8 w-8 object-contain" />
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#5f5e5e]">
                © Institut Bisnis IT&amp;B, Where Your Future Begins
              </p>
            </div>
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5f5e5e]">
              <Link to="/admin/privacy-policy" className="transition-colors hover:text-[#af0f24]">
                Privacy Policy
              </Link>
              <Link to="/admin/institutional-standards" className="transition-colors hover:text-[#af0f24]">
                Institutional Standards
              </Link>
              <Link to="/admin/staff-support" className="transition-colors hover:text-[#af0f24]">
                Staff Support
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
