import { useState } from "react"
import { FileSpreadsheet } from "lucide-react"
import { exportUsersToExcel, type UserFilters } from "@/api/users"
import { toast } from "@/lib/toast"
import { getUserFriendlyError } from "@/lib/error-message"

interface ExportExcelButtonProps {
  /** Same filters as the list on screen, so the file matches what the admin sees (all pages). */
  filters: Omit<UserFilters, "page" | "page_size">
  /** Used if the server does not send a filename, e.g. "student_records". */
  fallbackFilename: string
  /** Disable when the current filter has no rows. */
  disabled?: boolean
}

export function ExportExcelButton({ filters, fallbackFilename, disabled }: ExportExcelButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const { blob, filename } = await exportUsersToExcel(filters)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename ?? `${fallbackFilename}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success("Export ready", "The Excel file has been downloaded.")
    } catch (error) {
      toast.error("Export failed", getUserFriendlyError(error, "generic"))
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exporting || disabled}
      className="inline-flex items-center justify-center gap-2 border border-[#d5d5d5] bg-white px-5 py-2.5 text-sm font-bold text-[#1a1c1c] transition hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FileSpreadsheet size={18} />
      {exporting ? "Exporting…" : "Export to Excel"}
    </button>
  )
}
