/**
 * Whether the sidebar should highlight a section while on nested CRUD routes
 * (e.g. /admin/posts/new, /admin/benefits/3/edit) as well as the list route.
 */
export function isAdminSectionActive(pathname: string, sectionHref: string, exact?: boolean): boolean {
  if (exact) return pathname === sectionHref
  return pathname === sectionHref || pathname.startsWith(`${sectionHref}/`)
}
