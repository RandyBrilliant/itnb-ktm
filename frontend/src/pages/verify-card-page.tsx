import { useQuery } from "@tanstack/react-query"
import { Check, ShieldAlert, X } from "lucide-react"
import { useParams } from "react-router-dom"
import { verifyCard } from "@/api/cards"
import { formatAppDate } from "@/lib/datetime"
import { getUserFriendlyError } from "@/lib/error-message"

function VerificationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#f0f0f0] py-4 last:border-b-0">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#5f5e5e]">{label}</span>
      <span className="font-[var(--font-heading)] text-xl font-bold text-[#1a1c1c]">{value}</span>
    </div>
  )
}

export function VerifyCardPage() {
  const { cardNumber = "" } = useParams<{ cardNumber: string }>()
  const decodedCardNumber = decodeURIComponent(cardNumber)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["verify-card", decodedCardNumber],
    queryFn: () => verifyCard(decodedCardNumber),
    enabled: Boolean(decodedCardNumber),
    retry: false,
  })

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f9f9f9]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#f9f9f9]/95 via-[#f9f9f9]/88 to-[#af0f24]/10" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 py-10">
        <section className="w-full rounded-sm border border-[#e2e2e2] bg-white p-6 shadow-[32px_0_32px_rgba(175,15,36,0.06)] sm:p-8">
          <div className="flex flex-col items-center text-center">
            <img
              src="/img/logo-single.png"
              alt="IT&B crest"
              className="mb-4 h-16 w-16 object-contain"
            />
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#af0f24]">
              IT&amp;B Hub
            </p>
            <h1 className="mt-2 font-[var(--font-heading)] text-2xl font-extrabold text-[#1a1c1c]">
              Digital ID Verification
            </h1>
            <p className="mt-2 text-sm text-[#5f5e5e]">
              Scan result — official student card check
            </p>
          </div>

          <div className="mt-8">
            {isLoading ? (
              <p className="text-center text-sm text-[#5f5e5e]">Verifying card…</p>
            ) : null}

            {isError ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-6 text-center">
                <ShieldAlert className="h-10 w-10 text-red-600" strokeWidth={1.75} />
                <p className="text-sm font-semibold text-red-800">Card not found</p>
                <p className="text-sm text-red-700">
                  {getUserFriendlyError(error, "generic")}
                </p>
              </div>
            ) : null}

            {data ? (
              <div>
                <div
                  className={`mb-6 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-[0.12em] ${
                    data.verified
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  {data.verified ? (
                    <Check className="h-5 w-5" strokeWidth={2.5} />
                  ) : (
                    <X className="h-5 w-5" strokeWidth={2.5} />
                  )}
                  {data.verified ? "Verified" : "Not verified"}
                </div>

                <VerificationRow
                  label="Student ID"
                  value={data.student_id || "—"}
                />
                <VerificationRow
                  label="Valid until"
                  value={formatAppDate(data.valid_until)}
                />
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  )
}
