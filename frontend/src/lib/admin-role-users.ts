import type { UserRole } from "@/types/auth"

/** Portal directory roles managed under `/admin/users/{segment}`. */
export type DirectoryRole = Extract<UserRole, "ADMIN" | "STAFF" | "LECTURER">

export type DirectoryRoleSegment = "admins" | "staff" | "lecturers"

const SEGMENT_TO_ROLE: Record<DirectoryRoleSegment, DirectoryRole> = {
  admins: "ADMIN",
  staff: "STAFF",
  lecturers: "LECTURER",
}

const ROLE_TO_SEGMENT: Record<DirectoryRole, DirectoryRoleSegment> = {
  ADMIN: "admins",
  STAFF: "staff",
  LECTURER: "lecturers",
}

export function directorySegmentToRole(segment: string | undefined): DirectoryRole | null {
  if (!segment) return null
  return SEGMENT_TO_ROLE[segment as DirectoryRoleSegment] ?? null
}

export function directoryRoleToSegment(role: DirectoryRole): DirectoryRoleSegment {
  return ROLE_TO_SEGMENT[role]
}

export const DIRECTORY_ROLE_LABELS: Record<
  DirectoryRole,
  { listTitle: string; listSubtitle: string; createTitle: string; editTitle: string }
> = {
  ADMIN: {
    listTitle: "Administrator Records",
    listSubtitle: "Portal administrators with full access to student records and configuration.",
    createTitle: "New administrator record",
    editTitle: "Edit administrator record",
  },
  STAFF: {
    listTitle: "Staff Records",
    listSubtitle: "Operational staff sign-ins. Elevated permissions are managed under administrator accounts.",
    createTitle: "New staff record",
    editTitle: "Edit staff record",
  },
  LECTURER: {
    listTitle: "Lecturer Records",
    listSubtitle: "Teaching staff directory entries and contact details.",
    createTitle: "New lecturer record",
    editTitle: "Edit lecturer record",
  },
}
