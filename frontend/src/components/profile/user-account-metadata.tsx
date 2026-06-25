import type { ReactNode } from "react"
import { Check, X } from "lucide-react"
import type { User } from "@/types/auth"

function renderDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
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

export interface UserAccountMetadataProps {
  user: User | null | undefined
  title?: string
}

export function UserAccountMetadata({ user, title = "Account Details" }: UserAccountMetadataProps) {
  if (!user) {
    return (
      <div className="rounded-2xl border border-[#ececec] bg-white p-5">
        <p className="text-sm text-[#5f5e5e]">Loading account details…</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#ececec] bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24]">Account</p>
      <h2 className="mt-1 text-lg font-bold text-[#1a1c1c]">{title}</h2>
      <div className="mt-4 text-sm">
        <MetadataRow label="Institutional ID" value={user.institutional_id || "—"} />
        <MetadataRow label="Role" value={user.role_display ?? user.role} />
        <MetadataRow
          label="Account Verification"
          value={
            <StatusIndicator
              positive={user.email_verified}
              positiveLabel="Verified"
              negativeLabel="Not verified"
            />
          }
        />
        <MetadataRow
          label="Active Status"
          value={
            <StatusIndicator
              positive={user.is_active}
              positiveLabel="Active"
              negativeLabel="Inactive"
            />
          }
        />
        {user.role === "ADMIN" ? (
          <>
            <MetadataRow
              label="Staff access"
              value={
                <StatusIndicator positive={!!user.is_staff} positiveLabel="Yes" negativeLabel="No" />
              }
            />
            <MetadataRow
              label="Superuser"
              value={
                <StatusIndicator positive={!!user.is_superuser} positiveLabel="Yes" negativeLabel="No" />
              }
            />
          </>
        ) : null}
        {user.department ? <MetadataRow label="Department" value={user.department} /> : null}
        {user.role === "ALUMNI" && user.alumni_year != null ? (
          <MetadataRow label="Graduation year" value={user.alumni_year} />
        ) : null}
        {user.role === "LECTURER" && user.lecturer_profile ? (
          <>
            {user.lecturer_profile.contact_phone ? (
              <MetadataRow label="Contact phone" value={user.lecturer_profile.contact_phone} />
            ) : null}
            {user.lecturer_profile.address ? (
              <MetadataRow label="Address" value={user.lecturer_profile.address} />
            ) : null}
          </>
        ) : null}
        <MetadataRow label="Last login" value={renderDate(user.last_login)} />
        <MetadataRow label="Date joined" value={renderDate(user.date_joined)} />
        <MetadataRow label="Updated at" value={renderDate(user.updated_at)} />
      </div>
    </div>
  )
}
