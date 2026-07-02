import type { CSSProperties, ReactNode, Ref } from "react"

/** Bundled blank template — no printed field labels (avoids ghosting with HTML labels). */
export const CARD_BACKGROUND_URL = "/img/card-bg.jpg"

/** Bundled back template. */
export const CARD_BACK_BACKGROUND_URL = "/img/card-bg-back.png"

/** Reference card proportions (643×1024). */
export const CARD_ASPECT = "643 / 1024"

export interface DigitalIdCardData {
  name: string
  studentId: string
  major: string
  birthPlaceDate: string
  degree: string
  validThru: string
  photoUrl: string
  qrImageUrl: string
}

interface DigitalIdCardProps {
  flipped: boolean
  frontBackgroundUrl: string
  backBackgroundUrl: string
  data: DigitalIdCardData
  onFlip?: () => void
  onFrontBackgroundError?: () => void
  onBackBackgroundError?: () => void
  onPhotoError?: () => void
  frontBackgroundFailed?: boolean
  backBackgroundFailed?: boolean
  photoFailed?: boolean
  frontCaptureRef?: Ref<HTMLDivElement>
  backCaptureRef?: Ref<HTMLDivElement>
}

/** White content band — right of the printed sidebar, below the logo. */
const CONTENT_INSET: CSSProperties = {
  top: "12.5%",
  bottom: "1.5%",
  left: "13.5%",
  right: "2.5%",
}

function CardField({
  label,
  value,
  variant = "default",
}: {
  label: string
  value: string
  variant?: "default" | "name"
}) {
  return (
    <div className="min-w-0">
      <p className="text-[clamp(0.52rem,2.65cqw,0.72rem)] font-semibold leading-none text-[#b11324]">
        {label}
      </p>
      <p
        className={
          variant === "name"
            ? "mt-[0.5cqh] break-words text-[clamp(0.78rem,4.1cqw,1.05rem)] font-black leading-snug text-[#212121]"
            : "mt-[0.5cqh] break-words text-[clamp(0.68rem,3.45cqw,0.92rem)] font-semibold leading-snug text-[#212121]"
        }
      >
        {value}
      </p>
    </div>
  )
}

function CardFace({
  backgroundUrl,
  backgroundFailed,
  onBackgroundError,
  children,
  faceTransform = "[transform:translateZ(1px)]",
  imageFit = "fill",
  captureRef,
}: {
  backgroundUrl: string
  backgroundFailed?: boolean
  onBackgroundError?: () => void
  children: ReactNode
  faceTransform?: string
  imageFit?: "fill" | "cover"
  captureRef?: Ref<HTMLDivElement>
}) {
  return (
    <div
      className={`absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] ${faceTransform}`}
    >
      <div
        ref={captureRef}
        className="id-card-text-scope relative h-full w-full overflow-hidden rounded-xl border border-[#d9d9d9] bg-white"
      >
        {!backgroundFailed && backgroundUrl ? (
          <img
            src={backgroundUrl}
            alt=""
            className={`pointer-events-none absolute inset-0 h-full w-full ${
              imageFit === "cover" ? "object-cover" : "object-fill"
            }`}
            onError={onBackgroundError}
          />
        ) : (
          <div className="absolute inset-0 bg-white" />
        )}
        {children ? <div className="relative z-[1] h-full">{children}</div> : null}
      </div>
    </div>
  )
}

function CardFrontContent({
  data,
  photoFailed,
  onPhotoError,
}: {
  data: DigitalIdCardData
  photoFailed?: boolean
  onPhotoError?: () => void
}) {
  return (
    <div className="absolute flex min-h-0 flex-col pt-[3cqh]" style={CONTENT_INSET}>
      <div className="mx-auto aspect-[3/4] w-[42cqw] max-w-[72%] shrink-0 overflow-hidden bg-[#b11324]">
        {!photoFailed && data.photoUrl ? (
          <img
            src={data.photoUrl}
            alt="Student portrait"
            className="h-full w-full object-cover"
            onError={onPhotoError}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[clamp(0.6rem,2.8cqw,0.8rem)] font-semibold text-white/80">
            PHOTO
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-evenly px-[4.5cqw] py-[1.5cqh]">
        <CardField label="Name" value={data.name} variant="name" />
        <CardField label="Student ID" value={data.studentId} />
        <CardField label="Major" value={data.major} />
        <CardField label="Place, Date of Birth" value={data.birthPlaceDate} />
      </div>

      <div className="shrink-0">
        <div className="mx-[4.5cqw] border-t border-[#212121]/25" aria-hidden />
        <div className="flex items-end justify-between gap-[2cqw] px-[4.5cqw] pt-[0.45cqh]">
          <div className="min-w-0 flex-1">
            <p className="break-words text-[clamp(0.8rem,4.6cqw,1.12rem)] font-extrabold leading-tight text-[#b11324]">
              {data.degree}
            </p>
            <div className="mt-[1cqh]">
              <p className="text-[clamp(0.52rem,2.65cqw,0.72rem)] font-semibold leading-none text-[#b11324]">
                Valid Thru
              </p>
              <p className="mt-[0.5cqh] text-[clamp(0.68rem,3.45cqw,0.92rem)] font-semibold leading-snug text-[#212121]">
                {data.validThru}
              </p>
            </div>
          </div>

          <div className="aspect-square h-[18.5cqh] shrink-0 overflow-hidden rounded-[10px] border-[3px] border-[#8f2634] bg-white">
            {data.qrImageUrl ? (
              <img
                src={data.qrImageUrl}
                alt="ID QR code"
                className="h-full w-full object-contain p-[2px]"
              />
            ) : (
              <span className="material-symbols-outlined flex h-full w-full items-center justify-center text-[clamp(1.2rem,7cqw,2.1rem)] text-black">
                qr_code_2
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CardBackContent() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-[10%] text-center text-[#8c1122]">
      <p className="text-[clamp(1.5rem,8.5cqw,2.2rem)] font-black">IT&amp;B</p>
      <p className="mt-[1cqh] text-[clamp(0.55rem,2.8cqw,0.8rem)] font-bold tracking-[0.22em] text-[#1e1e1e]">
        INSTITUT BISNIS
      </p>
      <p className="mt-[2.5cqh] text-[clamp(0.7rem,3.5cqw,0.95rem)] font-semibold leading-relaxed text-[#1f1f1f]">
        This card belongs to IT&amp;B and must be returned to campus administration if found.
      </p>
      <p className="mt-[1.8cqh] text-[clamp(0.55rem,2.6cqw,0.75rem)] font-bold uppercase tracking-[0.14em] text-[#5f5e5e]">
        Jl. Mahoni No.16, Medan - 20235
      </p>
    </div>
  )
}

export function DigitalIdCard({
  flipped,
  frontBackgroundUrl,
  backBackgroundUrl,
  data,
  onFlip,
  onFrontBackgroundError,
  onBackBackgroundError,
  onPhotoError,
  frontBackgroundFailed,
  backBackgroundFailed,
  photoFailed,
  frontCaptureRef,
  backCaptureRef,
}: DigitalIdCardProps) {
  return (
    <div
      role={onFlip ? "button" : undefined}
      tabIndex={onFlip ? 0 : undefined}
      aria-label={onFlip ? (flipped ? "Show front of ID card" : "Show back of ID card") : undefined}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (!onFlip) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onFlip()
        }
      }}
      className={`relative mx-auto w-full max-w-[340px] transition-transform duration-500 ease-in-out [transform-style:preserve-3d] [-webkit-transform-style:preserve-3d] ${
        onFlip ? "cursor-pointer select-none" : ""
      } ${flipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"}`}
      style={{ aspectRatio: CARD_ASPECT }}
    >
      <CardFace
        backgroundUrl={frontBackgroundUrl}
        backgroundFailed={frontBackgroundFailed}
        onBackgroundError={onFrontBackgroundError}
        captureRef={frontCaptureRef}
      >
        <CardFrontContent data={data} photoFailed={photoFailed} onPhotoError={onPhotoError} />
      </CardFace>

      <CardFace
        backgroundUrl={backBackgroundUrl}
        backgroundFailed={backBackgroundFailed}
        onBackgroundError={onBackBackgroundError}
        faceTransform="[transform:rotateY(180deg)_translateZ(1px)]"
        imageFit="cover"
        captureRef={backCaptureRef}
      >
        {backBackgroundFailed || !backBackgroundUrl ? <CardBackContent /> : null}
      </CardFace>
    </div>
  )
}
