import { useState } from "react"
import {
  DigitalIdCard,
  EMPLOYEE_CARD_ART,
  EMPLOYEE_CARD_COPY,
} from "@/components/student/digital-id-card"
import { resolvePublicAssetUrl } from "@/lib/media-url"

type EmployeeCardRole = keyof typeof EMPLOYEE_CARD_COPY

export function EmployeeIdCardPreview({
  cardRole,
  name,
  institutionalId,
  department,
  position,
  photoUrl,
}: {
  cardRole: EmployeeCardRole
  name: string
  institutionalId: string
  department: string
  position: string
  photoUrl: string
}) {
  const [flipped, setFlipped] = useState(false)
  const art = EMPLOYEE_CARD_ART[cardRole]
  const copy = EMPLOYEE_CARD_COPY[cardRole]
  const portrait =
    photoUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || copy.roleLabel)}&background=b11324&color=ffffff&size=512`

  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#af0f24]">
        {copy.credential}
      </p>
      <DigitalIdCard
        key={cardRole}
        flipped={flipped}
        onFlip={() => setFlipped((prev) => !prev)}
        frontBackgroundUrl={resolvePublicAssetUrl(art.front)}
        backBackgroundUrl={resolvePublicAssetUrl(art.back)}
        data={{
          name: name.trim() || "—",
          studentId: institutionalId.trim() || "—",
          idLabel: copy.idLabel,
          majorLabel: "Department",
          major: department.trim() || "—",
          detailLabel: "Position",
          birthPlaceDate: position.trim() || "—",
          degree: copy.roleLabel,
          showValidThru: false,
          validThru: "",
          photoUrl: portrait,
          qrImageUrl: "",
        }}
      />
      <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[#5f5e5e]">
        Tap the card to view the {flipped ? "front" : "back"}
      </p>
    </div>
  )
}
