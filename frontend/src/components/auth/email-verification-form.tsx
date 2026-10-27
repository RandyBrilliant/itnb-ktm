import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { requestEmailVerification, verifyEmailCode } from "@/api/auth"
import { authKeys } from "@/hooks/use-auth-query"
import { getUserFriendlyError } from "@/lib/error-message"
import { toast } from "@/lib/toast"
import type { User } from "@/types/auth"

export interface EmailVerificationFormProps {
  email: string
  onComplete?: (user: User) => void
}

const AUTO_SENT_KEY_PREFIX = "email-verification-auto-sent:"

export function EmailVerificationForm({ email, onComplete }: EmailVerificationFormProps) {
  const queryClient = useQueryClient()
  const [verificationCode, setVerificationCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const isSubmitting = isSending || isVerifying
  const autoSendStarted = useRef(false)

  const handleSendCode = async () => {
    try {
      setIsSending(true)
      const detail = await requestEmailVerification()
      setCodeSent(true)
      setVerificationCode("")
      toast.success("Verification code sent", detail)
    } catch (error) {
      toast.error("Could not send code", getUserFriendlyError(error, "generic"))
    } finally {
      setIsSending(false)
    }
  }

  // Send the first code automatically; only once per browser session so a refresh doesn't invalidate it.
  useEffect(() => {
    if (!email || autoSendStarted.current) return
    autoSendStarted.current = true
    const key = `${AUTO_SENT_KEY_PREFIX}${email.toLowerCase()}`
    try {
      if (sessionStorage.getItem(key)) {
        setCodeSent(true)
        return
      }
      sessionStorage.setItem(key, "1")
    } catch {
      // Storage unavailable — still send once for this mount.
    }
    void handleSendCode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  const handleVerify = async () => {
    const code = verificationCode.trim()
    if (!/^\d{6}$/.test(code)) {
      toast.warning("Invalid code", "Enter the 6-digit code from your email.")
      return
    }

    try {
      setIsVerifying(true)
      const updatedUser = await verifyEmailCode(code)
      queryClient.setQueryData(authKeys.me(), updatedUser)
      toast.success("Email verified", "Your email address is now verified.")
      onComplete?.(updatedUser)
    } catch (error) {
      toast.error("Verification failed", getUserFriendlyError(error, "generic"))
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-[#5f5e5e]">
        {codeSent ? "Enter the 6-digit code sent to " : "Sending a 6-digit code to "}
        <span className="font-semibold text-[#1a1c1c]">{email}</span>.
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
          {isVerifying ? "Verifying…" : "Confirm email"}
        </button>
        <button
          type="button"
          onClick={handleSendCode}
          disabled={isSubmitting}
          className="rounded-lg border border-[#ddd] bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#1a1c1c] disabled:opacity-60"
        >
          {isSending ? "Sending…" : codeSent ? "Resend code" : "Send code"}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-[#5f5e5e]">
        Codes expire after 10 minutes. If this email address is wrong, contact campus administration.
      </p>
    </div>
  )
}
