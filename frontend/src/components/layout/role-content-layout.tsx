import type { ReactNode } from "react"
import { AnimatedPage } from "@/components/animation/animated-page"
import { RoleShell } from "@/components/navigation/role-shell"
import type { UserRole } from "@/types/auth"

interface RoleContentLayoutProps {
  role: UserRole
  title: string
  children: ReactNode
}

export function RoleContentLayout({ role, title, children }: RoleContentLayoutProps) {
  return (
    <RoleShell role={role} title={title} subtitle="Academic Year 2023/24">
      <AnimatedPage className="mx-auto max-w-2xl">{children}</AnimatedPage>
    </RoleShell>
  )
}

