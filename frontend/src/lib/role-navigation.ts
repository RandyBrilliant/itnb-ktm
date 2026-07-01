import type { UserRole } from "@/types/auth"

export interface RoleNavItem {
  id: string
  label: string
  icon: string
  href: string
}

const studentItems: RoleNavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/student" },
  { id: "id", label: "ID", icon: "badge", href: "/student/id" },
  {
    id: "certificates",
    label: "Certificates",
    icon: "verified",
    href: "/student/certificates",
  },
  { id: "scores", label: "Scores", icon: "school", href: "/student/scores" },
  { id: "webinars", label: "Webinars", icon: "co_present", href: "/student/webinars" },
  { id: "news", label: "News", icon: "newspaper", href: "/student/news" },
]

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
      return studentItems
    case "STAFF":
      return staffItems
    case "LECTURER":
      return lecturerItems
    default:
      return []
  }
}
