import type { CertificateItem } from "@/api/certificates"

/** True when the API can serve a PDF (stored file, legacy URL, or program template). */
export function certificatePdfAvailable(cert: Pick<CertificateItem, "pdf_available" | "pdf_file" | "program">): boolean {
  if (cert.pdf_available != null) return cert.pdf_available
  if (cert.pdf_file) return true
  return Boolean(cert.program?.template_image)
}
