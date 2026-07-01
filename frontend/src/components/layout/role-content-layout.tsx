import type { ReactNode } from "react"
import { AnimatedPage } from "@/components/animation/animated-page"
import { RoleShell } from "@/components/navigation/role-shell"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types/auth"

interface RoleContentLayoutProps {
  role: UserRole
  title: string
  /** Shown under the page title in the shell header */
  subtitle?: string
  /** Max width of the main column (Tailwind classes). */
  maxWidthClassName?: string
  children: ReactNode
}

export function RoleContentLayout({
  role,
  title,
  subtitle,
  maxWidthClassName = "max-w-2xl",
  children,
}: RoleContentLayoutProps) {
  return (
    <RoleShell role={role} title={title} subtitle={subtitle}>
      <AnimatedPage className={cn("mx-auto", maxWidthClassName)}>{children}</AnimatedPage>
    </RoleShell>
  )
}

