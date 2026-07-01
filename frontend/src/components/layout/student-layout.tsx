import type { ReactNode } from "react"
import { AnimatedPage } from "@/components/animation/animated-page"
import { RoleShell } from "@/components/navigation/role-shell"

export interface StudentLayoutProps {
  children: ReactNode
  title?: string
  profileImage?: string
  activeTab?: string
}

export function StudentLayout({
  children,
  title,
  profileImage,
  activeTab: _activeTab,
}: StudentLayoutProps) {
  return (
    <RoleShell role="STUDENT" title={title || "IT&B HUB"} avatarUrl={profileImage}>
      <AnimatedPage className="mx-auto max-w-2xl">
        {children}
      </AnimatedPage>
    </RoleShell>
  )
}
