import { useState } from "react"
import { motion } from "framer-motion"
import { StudentLayout } from "@/components/layout/student-layout"
import { useMeQuery } from "@/hooks/use-auth-query"
import { useQuery } from "@tanstack/react-query"
import { getCardTemplates, getMyCard } from "@/api/cards"
import { env } from "@/lib/env"
import { resolveMediaUrl } from "@/lib/media-url"

interface CardPresentation {
  name: string
  studentId: string
  major: string
  birthPlaceDate: string
  degree: string
  validThru: string
  photoUrl: string
  qrImageUrl: string
}

/**
 * Overlay text only—the PNG template prints the red captions. Percent `top`s
 * anchor each datum in its value band (below those baked-in labels).
 */
function CardValueOverlay({
  value,
  topPct,
  emphasis = "normal",
}: {
  value: string
  topPct: string
  emphasis?: "name" | "degree" | "normal"
}) {
  const positioning = `absolute left-[16.75%] right-[37.75%] ${topPct}`

  if (emphasis === "degree") {
    return (
      <p
        className={`${positioning} leading-[1.08] tracking-tight break-words text-[clamp(0.88rem,5.8cqw,1.52rem)] font-extrabold text-[#b11324]`}
      >
        {value}
      </p>
    )
  }

  if (emphasis === "name") {
    return (
      <p
        className={`${positioning} leading-[1.07] tracking-tight break-words text-[clamp(0.88rem,4.95cqw,1.4rem)] font-black text-[#212121]`}
      >
        {value}
      </p>
    )
  }

  return (
    <p
      className={`${positioning} leading-[1.18] tracking-tight break-words text-[clamp(0.72rem,3.75cqw,1.05rem)] font-semibold text-[#212121]`}
    >
      {value}
    </p>
  )
}

const FRONT_TEMPLATE_FALLBACK = `${env.VITE_API_URL}/media/cards/templates/front.png`
const BACK_TEMPLATE_FALLBACK = `${env.VITE_API_URL}/media/cards/templates/back.png`

const FALLBACK: CardPresentation = {
  name: "Gracelynne",
  studentId: "230010007",
  major: "Management",
  birthPlaceDate: "Medan, 28 March 2005",
  degree: "Bachelor Degree",
  validThru: "December 2027",
  photoUrl: "",
  qrImageUrl: "",
}

export function StudentIDPage() {
  const [flipped, setFlipped] = useState(false)
  const [frontTemplateFailed, setFrontTemplateFailed] = useState(false)
  const [backTemplateFailed, setBackTemplateFailed] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)
  const { data: me } = useMeQuery()
  const { data: card } = useQuery({
    queryKey: ["student", "id-card"],
    queryFn: getMyCard,
  })
  const { data: templates } = useQuery({
    queryKey: ["student", "id-card-templates"],
    queryFn: getCardTemplates,
  })

  const frontTemplateUrl = resolveMediaUrl(
    env.VITE_ID_CARD_FRONT_TEMPLATE_URL ||
      templates?.front_url ||
      card?.card_image ||
      FRONT_TEMPLATE_FALLBACK
  )
  const backTemplateUrl = resolveMediaUrl(
    env.VITE_ID_CARD_BACK_TEMPLATE_URL || templates?.back_url || BACK_TEMPLATE_FALLBACK
  )

  const model: CardPresentation = {
    name: me?.full_name || FALLBACK.name,
    studentId: card?.card_number || FALLBACK.studentId,
    major: me?.department || FALLBACK.major,
    birthPlaceDate: FALLBACK.birthPlaceDate,
    degree: "Bachelor Degree",
    validThru: card?.valid_until
      ? new Date(card.valid_until).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : FALLBACK.validThru,
    photoUrl:
      resolveMediaUrl(me?.photo) ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        me?.full_name || FALLBACK.name
      )}&background=b11324&color=ffffff&size=512`,
    qrImageUrl: resolveMediaUrl(card?.qr_code) || FALLBACK.qrImageUrl,
  }

  return (
    <StudentLayout title="Digital ID Card" activeTab="id">
      <div className="mx-auto max-w-md">
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
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="id-card-text-scope relative w-full [aspect-ratio:672/1024] [transform-style:preserve-3d]"
          >
            <div
              className="absolute inset-0 overflow-hidden rounded-2xl border border-[#d9d9d9] bg-[#f4f4f4] [backface-visibility:hidden]"
            >
              {!frontTemplateFailed ? (
                <img
                  src={frontTemplateUrl}
                  alt="ID card front template"
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={() => setFrontTemplateFailed(true)}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-[#f7f7f7] to-[#ececec]" />
              )}
              {/* Query container lives on motion.id-card-text-scope; avoid nesting @container here */}
              <div className="relative h-full text-[#212121]">
                <div className="absolute left-[36.2%] top-[11.9%] h-[33.6%] w-[39.8%] overflow-hidden">
                  {!photoFailed ? (
                    <img
                      src={model.photoUrl}
                      alt="Student portrait"
                      className="h-full w-full object-cover"
                      onError={() => setPhotoFailed(true)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#c9c9c9] text-sm font-semibold text-[#7a7a7a]">
                      PHOTO
                    </div>
                  )}
                </div>

                {/* Per-field anchors: values sit beneath template-printed labels */}
                <div aria-hidden className="pointer-events-none absolute left-[16.75%] right-[37.75%] top-[74.75%] border-t border-[#212121]/18" />
                <CardValueOverlay value={model.name} topPct="top-[49.05%]" emphasis="name" />
                <CardValueOverlay value={model.studentId} topPct="top-[56.95%]" />
                <CardValueOverlay value={model.major} topPct="top-[64.35%]" />
                <CardValueOverlay value={model.birthPlaceDate} topPct="top-[71.95%]" />
                <CardValueOverlay value={model.degree} topPct="top-[76.95%]" emphasis="degree" />
                <CardValueOverlay value={model.validThru} topPct="top-[83.95%]" />

                <div className="absolute left-[62.2%] top-[81.1%] h-[16.8%] w-[31%] overflow-hidden rounded-[10px] border-[3px] border-[#8f2634] bg-white">
                  {model.qrImageUrl ? (
                    <img src={model.qrImageUrl} alt="ID QR code" className="h-full w-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined flex h-full w-full items-center justify-center text-[72px] text-black">
                      qr_code_2
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div
              className="absolute inset-0 overflow-hidden rounded-2xl border border-[#d9d9d9] bg-[#f4f4f4] [backface-visibility:hidden] [transform:rotateY(180deg)]"
            >
              {!backTemplateFailed ? (
                <img
                  src={backTemplateUrl}
                  alt="ID card back template"
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={() => setBackTemplateFailed(true)}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-[#f5f5f5] to-[#e8e8e8]">
                  <div className="flex h-full flex-col items-center justify-center px-8 text-center text-[#8c1122]">
                    <p className="text-4xl font-black">IT&amp;B</p>
                    <p className="mt-2 text-sm font-bold tracking-[0.22em] text-[#1e1e1e]">
                      INSTITUT BISNIS
                    </p>
                    <p className="mt-8 text-lg font-semibold leading-relaxed text-[#1f1f1f]">
                      This card belongs to IT&amp;B and must be returned to campus administration if found.
                    </p>
                    <p className="mt-6 text-sm font-bold uppercase tracking-[0.14em] text-[#5f5e5e]">
                      Jl. Mahoni No.16, Medan - 20235
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-[#5f5e5e]">
          Tap flip to view {flipped ? "front" : "back"} side
        </p>
      </div>
    </StudentLayout>
  )
}

export default StudentIDPage
