import type { CertificateItem } from "@/api/certificates"

/** True when the API can serve a PDF (template overlay, generic layout, stored file, or legacy URL). */
export function certificatePdfAvailable(cert: Pick<CertificateItem, "pdf_available" | "pdf_file">): boolean {
  if (cert.pdf_available != null) return cert.pdf_available
  return true
}
