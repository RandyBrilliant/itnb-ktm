import { useEffect, useRef, useState } from "react"
import { Download } from "lucide-react"
import type { UserRole } from "@/types/auth"
import {
  CARD_BACKGROUND_URL,
  CARD_BACK_BACKGROUND_URL,
  DigitalIdCard,
  type DigitalIdCardData,
} from "@/components/student/digital-id-card"
import { useMeQuery } from "@/hooks/use-auth-query"
import { useQuery } from "@tanstack/react-query"
import { getMyCard } from "@/api/cards"
import { env } from "@/lib/env"
import { resolveMediaUrl, resolvePublicAssetUrl } from "@/lib/media-url"
import { formatAppMonthYear } from "@/lib/datetime"
import { formatBirthPlaceDate } from "@/lib/format-birth"
import { downloadElementAsPng } from "@/lib/download-element-image"
import { getUserFriendlyError } from "@/lib/error-message"
import { toast } from "@/lib/toast"
import { RoleContentLayout } from "@/components/layout/role-content-layout"

const FALLBACK = {
  name: "Gracelynne",
  studentId: "230010007",
  major: "Management",
  birthPlaceDate: "—",
  degree: "Bachelor Degree",
  validThru: "December 2027",
  photoUrl: "",
  qrImageUrl: "",
}

export function MemberIdPage({ role }: { role: UserRole }) {
  const [flipped, setFlipped] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [frontBackgroundFailed, setFrontBackgroundFailed] = useState(false)
  const [backBackgroundFailed, setBackBackgroundFailed] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)
  const frontCaptureRef = useRef<HTMLDivElement>(null)
  const backCaptureRef = useRef<HTMLDivElement>(null)
  const { data: me } = useMeQuery()
  const { data: card } = useQuery({
    queryKey: [role, "id-card"],
    queryFn: getMyCard,
  })

  const frontBackgroundUrl =
    resolveMediaUrl(env.VITE_ID_CARD_FRONT_TEMPLATE_URL) ||
    resolvePublicAssetUrl(CARD_BACKGROUND_URL)
  const backBackgroundUrl =
    resolveMediaUrl(env.VITE_ID_CARD_BACK_TEMPLATE_URL) ||
    resolvePublicAssetUrl(CARD_BACK_BACKGROUND_URL)

  useEffect(() => {
    setFrontBackgroundFailed(false)
  }, [frontBackgroundUrl])

  useEffect(() => {
    setBackBackgroundFailed(false)
  }, [backBackgroundUrl])

  const model: DigitalIdCardData = {
    name: me?.full_name || FALLBACK.name,
    studentId: me?.institutional_id || card?.card_number || FALLBACK.studentId,
    major: me?.department || FALLBACK.major,
    birthPlaceDate: formatBirthPlaceDate(me?.place_of_birth, me?.date_of_birth) || FALLBACK.birthPlaceDate,
    degree: role === "ALUMNI" ? "Alumni" : "Bachelor Degree",
    validThru: card?.valid_until ? formatAppMonthYear(card.valid_until) : FALLBACK.validThru,
    photoUrl:
      resolveMediaUrl(me?.photo) ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        me?.full_name || FALLBACK.name
      )}&background=b11324&color=ffffff&size=512`,
    qrImageUrl: resolveMediaUrl(card?.qr_code) || FALLBACK.qrImageUrl,
  }

  const credentialLabel = role === "ALUMNI" ? "Alumni Credential" : "Student Credential"
  const studentId = model.studentId.replace(/[^\w-]+/g, "-")

  const handleDownload = async () => {
    const element = flipped ? backCaptureRef.current : frontCaptureRef.current
    if (!element) return

    try {
      setDownloading(true)
      const side = flipped ? "back" : "front"
      await downloadElementAsPng(element, `itnb-id-card-${side}-${studentId}.png`)
      toast.success("ID card saved", `Downloaded the ${side} side as PNG.`)
    } catch (error) {
      toast.error("Download failed", getUserFriendlyError(error, "generic"))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <RoleContentLayout role={role} title="Digital ID Card">
      <div className="mx-auto w-full max-w-[340px]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24]">
              {credentialLabel}
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1c1c]">
              ID Card
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-xl border border-[#ddd] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1a1c1c] disabled:opacity-60"
            >
              <Download size={14} strokeWidth={2.5} />
              {downloading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setFlipped((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#af0f24] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white"
            >
              <span className="material-symbols-outlined text-sm">sync</span>
              {flipped ? "Front" : "Back"}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl [perspective:1200px]">
          <DigitalIdCard
            flipped={flipped}
            onFlip={() => setFlipped((prev) => !prev)}
            frontBackgroundUrl={frontBackgroundUrl}
            backBackgroundUrl={backBackgroundUrl}
            data={model}
            frontBackgroundFailed={frontBackgroundFailed}
            backBackgroundFailed={backBackgroundFailed}
            photoFailed={photoFailed}
            frontCaptureRef={frontCaptureRef}
            backCaptureRef={backCaptureRef}
            onFrontBackgroundError={() => setFrontBackgroundFailed(true)}
            onBackBackgroundError={() => setBackBackgroundFailed(true)}
            onPhotoError={() => setPhotoFailed(true)}
          />
        </div>

        <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-[#5f5e5e]">
          Tap the card to view the {flipped ? "front" : "back"} side
        </p>
      </div>
    </RoleContentLayout>
  )
}
