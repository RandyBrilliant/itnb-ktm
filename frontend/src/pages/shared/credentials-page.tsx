import { useSearchParams } from "react-router-dom"
import type { UserRole } from "@/types/auth"
import { RoleContentLayout } from "@/components/layout/role-content-layout"
import { cn } from "@/lib/utils"
import { CertificatesListSection } from "@/pages/shared/certificates-page"
import { WebinarsListSection } from "@/pages/shared/webinars-page"

type CredentialsTab = "certificates" | "webinars"

const TABS: { id: CredentialsTab; label: string }[] = [
  { id: "certificates", label: "Certificates" },
  { id: "webinars", label: "Webinars" },
]

export function CredentialsPage({ role }: { role: UserRole }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab: CredentialsTab =
    searchParams.get("tab") === "webinars" ? "webinars" : "certificates"

  const setTab = (tab: CredentialsTab) => {
    if (tab === "certificates") {
      setSearchParams({}, { replace: true })
      return
    }
    setSearchParams({ tab }, { replace: true })
  }

  return (
    <RoleContentLayout
      role={role}
      title="Certificates & Webinars"
      subtitle={activeTab === "certificates" ? "Your issued certificates" : "Register, attend, and earn certificates"}
      maxWidthClassName={activeTab === "webinars" ? "max-w-3xl" : "max-w-2xl"}
    >
      <div className="mb-6 flex gap-2 rounded-2xl border border-[#ececec] bg-white p-1.5">
        {TABS.map((tab) => {
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                "flex-1 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors",
                selected
                  ? "bg-[#af0f24] text-white shadow-[0_8px_20px_rgba(175,15,36,0.22)]"
                  : "text-[#5f5e5e] hover:bg-[#f7f7f7] hover:text-[#1a1c1c]"
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === "certificates" ? (
        <CertificatesListSection role={role} />
      ) : (
        <WebinarsListSection role={role} />
      )}
    </RoleContentLayout>
  )
}
