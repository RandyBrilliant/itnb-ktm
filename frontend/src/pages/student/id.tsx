import { useEffect, useState } from "react"
import { StudentLayout } from "@/components/layout/student-layout"
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

export function StudentIDPage() {
  const [flipped, setFlipped] = useState(false)
  const [frontBackgroundFailed, setFrontBackgroundFailed] = useState(false)
  const [backBackgroundFailed, setBackBackgroundFailed] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)
  const { data: me } = useMeQuery()
  const { data: card } = useQuery({
    queryKey: ["student", "id-card"],
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
    degree: "Bachelor Degree",
    validThru: card?.valid_until ? formatAppMonthYear(card.valid_until) : FALLBACK.validThru,
    photoUrl:
      resolveMediaUrl(me?.photo) ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        me?.full_name || FALLBACK.name
      )}&background=b11324&color=ffffff&size=512`,
    qrImageUrl: resolveMediaUrl(card?.qr_code) || FALLBACK.qrImageUrl,
  }

  return (
    <StudentLayout title="Digital ID Card" activeTab="id">
      <div className="mx-auto w-full max-w-[340px]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24]">
              Student Credential
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1c1c]">
              ID Card
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setFlipped((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#af0f24] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white"
          >
            <span className="material-symbols-outlined text-sm">sync</span>
            {flipped ? "Front" : "Back"}
          </button>
        </div>

        <div className="[perspective:1200px]">
          <DigitalIdCard
            flipped={flipped}
            onFlip={() => setFlipped((prev) => !prev)}
            frontBackgroundUrl={frontBackgroundUrl}
            backBackgroundUrl={backBackgroundUrl}
            data={model}
            frontBackgroundFailed={frontBackgroundFailed}
            backBackgroundFailed={backBackgroundFailed}
            photoFailed={photoFailed}
            onFrontBackgroundError={() => setFrontBackgroundFailed(true)}
            onBackBackgroundError={() => setBackBackgroundFailed(true)}
            onPhotoError={() => setPhotoFailed(true)}
          />
        </div>

        <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-[#5f5e5e]">
          Tap the card to view the {flipped ? "front" : "back"} side
        </p>
      </div>
    </StudentLayout>
  )
}

export default StudentIDPage
