import { Check, X } from "lucide-react"

export function ActiveStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-medium ${
        isActive ? "bg-green-100 text-green-700" : "bg-[#ececec] text-[#5f5e5e]"
      }`}
    >
      {isActive ? (
        <>
          <Check size={16} />
          Active
        </>
      ) : (
        <>
          <X size={16} />
          Inactive
        </>
      )}
    </span>
  )
}
