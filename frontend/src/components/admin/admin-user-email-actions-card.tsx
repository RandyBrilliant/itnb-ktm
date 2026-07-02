import { useState } from "react"
import { Mail, KeyRound } from "lucide-react"
import type { User } from "@/types/auth"
import { sendUserEmailVerification, sendUserPasswordReset } from "@/api/users"
import { requiresEmailSetup } from "@/lib/email-setup"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"

export interface AdminUserEmailActionsCardProps {
  user: User | null | undefined
  onActionSuccess?: () => void
}

export function AdminUserEmailActionsCard({ user, onActionSuccess }: AdminUserEmailActionsCardProps) {
  const [sendingReset, setSendingReset] = useState(false)
  const [sendingVerification, setSendingVerification] = useState(false)

  if (!user) {
    return (
      <div className="rounded-2xl border border-[#ececec] bg-white p-5">
        <p className="text-sm text-[#5f5e5e]">Loading email actions…</p>
      </div>
    )
  }

  const needsEmailSetup = requiresEmailSetup(user)
  const emailVerified = user.email_verified
  const canSendReset = user.is_active && !needsEmailSetup
  const canSendVerification = !needsEmailSetup && !emailVerified

  const handleSendPasswordReset = async () => {
    if (!canSendReset || sendingReset) return
    setSendingReset(true)
    try {
      const detail = await sendUserPasswordReset(user.id)
      toast.success("Password reset sent", detail)
      onActionSuccess?.()
    } catch (error) {
      toast.error("Could not send password reset", getUserFriendlyError(error, "generic"))
    } finally {
      setSendingReset(false)
    }
  }

  const handleSendVerification = async () => {
    if (!canSendVerification || sendingVerification) return
    setSendingVerification(true)
    try {
      const detail = await sendUserEmailVerification(user.id)
      toast.success("Verification email sent", detail)
      onActionSuccess?.()
    } catch (error) {
      toast.error("Could not send verification email", getUserFriendlyError(error, "generic"))
    } finally {
      setSendingVerification(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[#ececec] bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24]">Email</p>
      <h2 className="mt-1 text-lg font-bold text-[#1a1c1c]">Account emails</h2>
      <p className="mt-2 text-sm text-[#5f5e5e]">
        Send password reset or verification emails to this user&apos;s inbox.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <button
          type="button"
          disabled={!canSendReset || sendingReset}
          onClick={handleSendPasswordReset}
          className="inline-flex items-center justify-center gap-2 border border-[#d5d5d5] px-4 py-2.5 text-sm font-semibold text-[#1a1c1c] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <KeyRound size={16} aria-hidden />
          {sendingReset ? "Sending…" : "Send password reset"}
        </button>
        {!user.is_active ? (
          <p className="text-xs text-[#5f5e5e]">Password reset is unavailable while the account is inactive.</p>
        ) : needsEmailSetup ? (
          <p className="text-xs text-[#5f5e5e]">Set a real email address before sending account emails.</p>
        ) : null}

        <button
          type="button"
          disabled={!canSendVerification || sendingVerification}
          onClick={handleSendVerification}
          className="inline-flex items-center justify-center gap-2 border border-[#d5d5d5] px-4 py-2.5 text-sm font-semibold text-[#1a1c1c] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Mail size={16} aria-hidden />
          {sendingVerification ? "Sending…" : emailVerified ? "Email already verified" : "Send verification email"}
        </button>
        {emailVerified ? (
          <p className="text-xs text-[#5f5e5e]">This user&apos;s email address is already verified.</p>
        ) : needsEmailSetup ? (
          <p className="text-xs text-[#5f5e5e]">Verification is unavailable until a real email address is set.</p>
        ) : null}
      </div>
    </div>
  )
}
