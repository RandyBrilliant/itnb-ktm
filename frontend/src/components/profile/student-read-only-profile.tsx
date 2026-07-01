import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { Check, User, X } from "lucide-react"
import type { User as AuthUser } from "@/types/auth"
import {
  requestEmailChange,
  requestEmailVerification,
  verifyEmailCode,
} from "@/api/auth"
import { authKeys } from "@/hooks/use-auth-query"
import { getUserFriendlyError } from "@/lib/error-message"
import { resolveMediaUrl } from "@/lib/media-url"
import { formatAppDateTime } from "@/lib/datetime"
import { formatBirthDate } from "@/lib/format-birth"
import { formatUserEmailLabel, requiresEmailSetup } from "@/lib/email-setup"
import { toast } from "@/lib/toast"

type EmailMode = "view" | "verify" | "change" | "change-verify"

function renderDateTime(value?: string | null) {
  if (!value) return "—"
  return formatAppDateTime(value)
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">{label}</span>
      <input
        type="text"
        value={value}
        readOnly
        disabled
        className="w-full rounded-lg border border-[#ddd] bg-[#f7f7f7] px-3 py-2 text-sm text-[#1a1c1c]"
      />
    </label>
  )
}

function MetadataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-[#f3f3f3] pb-3 last:border-b-0 last:pb-0">
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#5f5e5e]">{label}</span>
      <div className="text-sm text-[#1a1c1c]">{value}</div>
    </div>
  )
}

function StatusIndicator({
  positive,
  positiveLabel,
  negativeLabel,
}: {
  positive: boolean
  positiveLabel: string
  negativeLabel: string
}) {
  if (positive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
          <Check size={12} className="text-green-600" strokeWidth={2.5} />
        </span>
        {positiveLabel}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100">
        <X size={12} className="text-red-600" strokeWidth={2.5} />
      </span>
      {negativeLabel}
    </span>
  )
}

export interface StudentReadOnlyProfileProps {
  user: AuthUser | null | undefined
  changePasswordHref: string
}

export function StudentReadOnlyProfile({ user, changePasswordHref }: StudentReadOnlyProfileProps) {
  const queryClient = useQueryClient()
  const [emailMode, setEmailMode] = useState<EmailMode>("view")
  const [newEmail, setNewEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [codeTargetEmail, setCodeTargetEmail] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    if (user.pending_email_change) {
      setEmailMode("change-verify")
      setCodeTargetEmail(user.pending_email_change)
      return
    }
    setEmailMode("view")
    setCodeTargetEmail(null)
    setVerificationCode("")
    setNewEmail("")
  }, [user?.email, user?.email_verified, user?.pending_email_change])

  const handleRequestVerification = async () => {
    if (!user) return
    try {
      setIsSubmitting(true)
      const detail = await requestEmailVerification()
      setEmailMode("verify")
      setCodeTargetEmail(user.email)
      setVerificationCode("")
      toast.success("Verification code sent", detail)
    } catch (error) {
      toast.error("Could not send code", getUserFriendlyError(error, "generic"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestEmailChange = async (overrideEmail?: string) => {
    const trimmed = (overrideEmail ?? newEmail).trim()
    if (!trimmed) {
      toast.warning("Email required", "Enter the new email address you want to use.")
      return
    }

    try {
      setIsSubmitting(true)
      const detail = await requestEmailChange(trimmed)
      setEmailMode("change-verify")
      setCodeTargetEmail(trimmed)
      setVerificationCode("")
      toast.success("Verification code sent", detail)
    } catch (error) {
      toast.error("Could not send code", getUserFriendlyError(error, "generic"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyCode = async () => {
    const code = verificationCode.trim()
    if (!/^\d{6}$/.test(code)) {
      toast.warning("Invalid code", "Enter the 6-digit code from your email.")
      return
    }

    const isEmailChange = emailMode === "change-verify"

    try {
      setIsSubmitting(true)
      const updatedUser = await verifyEmailCode(code)
      queryClient.setQueryData(authKeys.me(), updatedUser)
      setEmailMode("view")
      setCodeTargetEmail(null)
      setVerificationCode("")
      setNewEmail("")
      toast.success(
        isEmailChange ? "Email updated" : "Email verified",
        isEmailChange
          ? "Your email address has been updated."
          : "Your email address is now verified."
      )
    } catch (error) {
      toast.error("Verification failed", getUserFriendlyError(error, "generic"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-[#ececec] bg-white p-5 sm:p-6">
        <p className="text-sm text-[#5f5e5e]">Loading profile…</p>
      </div>
    )
  }

  const photoUrl = user.photo ? resolveMediaUrl(user.photo) : ""

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#ececec] bg-white p-5 sm:p-6">
        <div className="flex flex-col items-center">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">Profile Photo</p>
          <div className="relative mt-3 h-36 w-36 overflow-hidden rounded-full border border-[#e2e2e2] bg-[#f7f7f7]">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[#9a9a9a]">
                <User size={48} strokeWidth={1.5} />
              </div>
            )}
          </div>
          <p className="mt-3 max-w-sm text-center text-xs text-[#5f5e5e]">
            Your photo is uploaded and updated by campus administration.
          </p>
        </div>

        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24]">Personal Information</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadOnlyField label="Full Name" value={user.full_name || "—"} />
            <ReadOnlyField label="Official ID (NIM)" value={user.institutional_id || "—"} />
            <ReadOnlyField label="Department" value={user.department || "—"} />
            <ReadOnlyField label="Place of Birth" value={user.place_of_birth || "—"} />
            <ReadOnlyField label="Date of Birth" value={formatBirthDate(user.date_of_birth)} />
          </div>
        </div>

        <div className="mt-8 border-t border-[#f3f3f3] pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24]">Email Address</p>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#5f5e5e]">
                Email changes require verification before they take effect.
              </p>
            </div>
            <StatusIndicator
              positive={user.email_verified && !requiresEmailSetup(user)}
              positiveLabel="Verified"
              negativeLabel={requiresEmailSetup(user) ? "Setup required" : "Not verified"}
            />
          </div>

          <div className="mt-4 rounded-xl border border-[#ececec] bg-[#fafafa] p-4 sm:p-5">
            {emailMode === "view" ? (
              <div className="space-y-4">
                <ReadOnlyField label="Current Email" value={formatUserEmailLabel(user)} />
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {!user.email_verified && !requiresEmailSetup(user) ? (
                    <button
                      type="button"
                      onClick={handleRequestVerification}
                      disabled={isSubmitting}
                      className="rounded-lg bg-[#af0f24] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60"
                    >
                      {isSubmitting ? "Sending…" : "Verify Email"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode("change")
                      setNewEmail("")
                      setVerificationCode("")
                    }}
                    disabled={isSubmitting}
                    className="rounded-lg border border-[#ddd] bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#1a1c1c] disabled:opacity-60"
                  >
                    Change Email
                  </button>
                </div>
              </div>
            ) : null}

            {emailMode === "verify" || emailMode === "change-verify" ? (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-[#1a1c1c]">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-semibold">{codeTargetEmail || user.email}</span>.
                </p>
                <label className="block max-w-sm space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">
                    Verification Code
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full rounded-lg border border-[#ddd] bg-white px-4 py-3 text-center text-lg tracking-[0.35em] text-[#1a1c1c]"
                    placeholder="000000"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={isSubmitting}
                    className="rounded-lg bg-[#af0f24] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60"
                  >
                    {isSubmitting ? "Verifying…" : "Confirm"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (emailMode === "verify") {
                        void handleRequestVerification()
                      } else {
                        void handleRequestEmailChange(codeTargetEmail ?? undefined)
                      }
                    }}
                    disabled={isSubmitting}
                    className="rounded-lg border border-[#ddd] bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#1a1c1c] disabled:opacity-60"
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode("view")
                      setVerificationCode("")
                      setCodeTargetEmail(null)
                    }}
                    disabled={isSubmitting}
                    className="rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {emailMode === "change" ? (
              <div className="space-y-4">
                <label className="block max-w-md space-y-2">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">
                    New Email Address
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-lg border border-[#ddd] bg-white px-4 py-3 text-sm text-[#1a1c1c]"
                    placeholder="you@example.com"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleRequestEmailChange()}
                    disabled={isSubmitting}
                    className="rounded-lg bg-[#af0f24] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60"
                  >
                    {isSubmitting ? "Sending…" : "Send Verification Code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailMode("view")}
                    disabled={isSubmitting}
                    className="rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-8 border-t border-[#f3f3f3] pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24]">Account Details</p>
          <div className="mt-4 text-sm">
            <MetadataRow label="Role" value={user.role_display ?? user.role} />
            <MetadataRow
              label="Account Status"
              value={
                <StatusIndicator
                  positive={user.is_active}
                  positiveLabel="Active"
                  negativeLabel="Inactive"
                />
              }
            />
            <MetadataRow label="Last Login" value={renderDateTime(user.last_login)} />
            <MetadataRow label="Last Updated" value={renderDateTime(user.updated_at)} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-[#f3f3f3] pt-6">
          <Link
            to={changePasswordHref}
            className="rounded-lg border border-[#ddd] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#1a1c1c]"
          >
            Change Password
          </Link>
        </div>
      </div>

      <p className="text-center text-xs text-[#5f5e5e]">
        Profile details are read-only except email. Contact campus administration to update other information.
      </p>
    </div>
  )
}
