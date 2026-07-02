import type { UserRole } from "@/types/auth"

export interface RoleNavItem {
  id: string
  label: string
  icon: string
  href: string
}

function buildMemberNav(
  basePath: string,
  options: { includeScores: boolean; includePerks: boolean }
): RoleNavItem[] {
  const items: RoleNavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard", href: basePath },
    { id: "id", label: "ID", icon: "badge", href: `${basePath}/id` },
    {
      id: "credentials",
      label: "Certificates",
      icon: "verified",
      href: `${basePath}/certificates`,
    },
  ]

  if (options.includeScores) {
    items.push({ id: "scores", label: "Scores", icon: "school", href: `${basePath}/scores` })
  }

  if (options.includePerks) {
    items.push({ id: "perks", label: "Perks", icon: "loyalty", href: `${basePath}/perks` })
  }

  items.push({ id: "news", label: "News", icon: "newspaper", href: `${basePath}/news` })

  return items
}

const staffItems: RoleNavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/staff" },
  { id: "news", label: "News", icon: "newspaper", href: "/staff/news" },
]

const lecturerItems: RoleNavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/lecturer" },
  {
    id: "news",
    label: "News",
    icon: "newspaper",
    href: "/lecturer/news",
  },
]

export function getRoleNavigation(role: UserRole): RoleNavItem[] {
  switch (role) {
    case "STUDENT":
      return buildMemberNav("/student", { includeScores: true, includePerks: false })
    case "ALUMNI":
      return buildMemberNav("/alumni", { includeScores: false, includePerks: true })
    case "STAFF":
      return staffItems
    case "LECTURER":
      return lecturerItems
    default:
      return []
  }
}
