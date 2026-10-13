import { PLACE_INFO, certificateFileName, type CertificateEntry } from './content'
import { CERT_HEIGHT, CERT_WIDTH, drawCertificate } from './draw'
import { jpegToPdf } from './pdf'

export interface RenderedCertificate {
  entry: CertificateEntry
  file: File
  /** Object URL of the JPEG, for the on-screen preview. Revoke when no longer needed. */
  previewUrl: string
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Impossibile generare l’immagine'))), type, quality),
  )

export async function renderCertificate(entry: CertificateEntry): Promise<RenderedCertificate> {
  const canvas = document.createElement('canvas')
  canvas.width = CERT_WIDTH
  canvas.height = CERT_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas non supportato')
  drawCertificate(ctx, entry)

  const jpegBlob = await toBlob(canvas, 'image/jpeg', 0.9)
  const jpeg = new Uint8Array(await jpegBlob.arrayBuffer())
  const pdf = jpegToPdf(jpeg, CERT_WIDTH, CERT_HEIGHT, {
    title: `Certificato di vittoria – ${entry.fighterName} – ${PLACE_INFO[entry.place].line}`,
  })
  const file = new File([pdf as BlobPart], certificateFileName(entry), { type: 'application/pdf' })
  return { entry, file, previewUrl: URL.createObjectURL(jpegBlob) }
}

export function canShareFiles(files: File[]): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && navigator.canShare({ files })
}

/** Opens the system share sheet (WhatsApp, Telegram, Mail…). Returns false if the user cancelled. */
export async function shareFiles(files: File[], title: string): Promise<boolean> {
  try {
    await navigator.share({ files, title })
    return true
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return false
    throw e
  }
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
