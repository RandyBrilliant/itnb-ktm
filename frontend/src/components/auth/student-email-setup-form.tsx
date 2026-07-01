import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { requestEmailChange, verifyEmailCode } from "@/api/auth"
import { authKeys } from "@/hooks/use-auth-query"
import { getUserFriendlyError } from "@/lib/error-message"
import { toast } from "@/lib/toast"
import type { User } from "@/types/auth"

type SetupStep = "enter-email" | "verify-code"

export interface StudentEmailSetupFormProps {
  pendingEmail?: string | null
  onComplete?: (user: User) => void
}

export function StudentEmailSetupForm({ pendingEmail, onComplete }: StudentEmailSetupFormProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<SetupStep>("enter-email")
  const [newEmail, setNewEmail] = useState("")
  const [codeTargetEmail, setCodeTargetEmail] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (pendingEmail) {
      setStep("verify-code")
      setCodeTargetEmail(pendingEmail)
    }
  }, [pendingEmail])

  const handleSendCode = async () => {
    const trimmed = newEmail.trim()
    if (!trimmed) {
      toast.warning("Email required", "Enter the email address you want to use.")
      return
    }

    try {
      setIsSubmitting(true)
      const detail = await requestEmailChange(trimmed)
      setStep("verify-code")
      setCodeTargetEmail(trimmed)
      setVerificationCode("")
      toast.success("Verification code sent", detail)
    } catch (error) {
      toast.error("Could not send code", getUserFriendlyError(error, "generic"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerify = async () => {
    const code = verificationCode.trim()
    if (!/^\d{6}$/.test(code)) {
      toast.warning("Invalid code", "Enter the 6-digit code from your email.")
      return
    }

    try {
      setIsSubmitting(true)
      const updatedUser = await verifyEmailCode(code)
      queryClient.setQueryData(authKeys.me(), updatedUser)
      toast.success("Email verified", "Your personal email address is now active.")
      onComplete?.(updatedUser)
    } catch (error) {
      toast.error("Verification failed", getUserFriendlyError(error, "generic"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!codeTargetEmail) return
    try {
      setIsSubmitting(true)
      const detail = await requestEmailChange(codeTargetEmail)
      toast.success("Code resent", detail)
    } catch (error) {
      toast.error("Could not resend code", getUserFriendlyError(error, "generic"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === "verify-code") {
    return (
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-[#5f5e5e]">
          Enter the 6-digit code sent to{" "}
          <span className="font-semibold text-[#1a1c1c]">{codeTargetEmail}</span>.
        </p>
        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">
            Verification code
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
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleVerify}
            disabled={isSubmitting}
            className="rounded-lg bg-[#af0f24] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60"
          >
            {isSubmitting ? "Verifying…" : "Confirm email"}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={isSubmitting}
            className="rounded-lg border border-[#ddd] bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#1a1c1c] disabled:opacity-60"
          >
            Resend code
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("enter-email")
              setVerificationCode("")
              setCodeTargetEmail(null)
            }}
            disabled={isSubmitting}
            className="rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]"
          >
            Use different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <label className="block space-y-2">
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f5e5e]">
          Personal email address
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
      <button
        type="button"
        onClick={handleSendCode}
        disabled={isSubmitting}
        className="rounded-lg bg-[#af0f24] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60"
      >
        {isSubmitting ? "Sending…" : "Send verification code"}
      </button>
    </div>
  )
}
