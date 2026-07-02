import { cn } from "@/lib/utils"
import type { UserRole } from "@/types/auth"

const INSTITUTIONAL_ID_ROLES: UserRole[] = ["STUDENT", "ALUMNI"]

export function roleShowsInstitutionalId(role?: UserRole | string | null): boolean {
  return role != null && INSTITUTIONAL_ID_ROLES.includes(role as UserRole)
}

export interface PersonNameBlockProps {
  name: string
  institutionalId?: string | null
  role?: UserRole | string | null
  subtitle?: string | null
  nameClassName?: string
  institutionalIdClassName?: string
  subtitleClassName?: string
  className?: string
}

export function PersonNameBlock({
  name,
  institutionalId,
  role,
  subtitle,
  nameClassName = "font-medium text-[#1a1c1c]",
  institutionalIdClassName = "text-xs font-mono text-[#5f5e5e]",
  subtitleClassName = "text-sm text-[#5f5e5e]",
  className,
}: PersonNameBlockProps) {
  const showInstitutionalId =
    roleShowsInstitutionalId(role) || Boolean(institutionalId?.trim())

  return (
    <div className={cn("min-w-0", className)}>
      <p className={cn(nameClassName, "truncate")}>{name}</p>
      {showInstitutionalId ? (
        <p className={cn(institutionalIdClassName, "mt-0.5 truncate")}>
          {institutionalId?.trim() || "—"}
        </p>
      ) : null}
      {subtitle ? (
        <p
          className={cn(
            subtitleClassName,
            showInstitutionalId ? "mt-0.5" : "",
            "truncate"
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
