import type { UserRole } from "@/types/auth"

/** Thrown by `login` when the account's role may not sign in through the current portal. */
export class RoleNotAllowedError extends Error {
  readonly role: UserRole

  constructor(role: UserRole) {
    super(`Role ${role} is not allowed to sign in here.`)
    this.name = "RoleNotAllowedError"
    this.role = role
  }
}
