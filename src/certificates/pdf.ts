/**
 * Minimal PDF writer: one page showing a single JPEG image stretched to the page.
 * Enough for raster certificates and avoids shipping a full PDF library.
 */

const A4_LANDSCAPE = { width: 841.89, height: 595.28 }

/** PDF text string; UTF-16BE hex so accented names in the title work everywhere. */
function pdfText(s: string): string {
  let hex = 'FEFF'
  for (const ch of s) {
    const code = ch.codePointAt(0)!
    if (code > 0xffff) {
      const v = code - 0x10000
      hex += (0xd800 + (v >> 10)).toString(16).padStart(4, '0')
      hex += (0xdc00 + (v & 0x3ff)).toString(16).padStart(4, '0')
    } else {
      hex += code.toString(16).padStart(4, '0')
    }
  }
  return `<${hex.toUpperCase()}>`
}

export function jpegToPdf(
  jpeg: Uint8Array,
  imageWidth: number,
  imageHeight: number,
  options: { title?: string; page?: { width: number; height: number } } = {},
): Uint8Array {
  const { width: pw, height: ph } = options.page ?? A4_LANDSCAPE
  const enc = new TextEncoder()
  const chunks: Uint8Array[] = []
  const offsets: number[] = []
  let length = 0

  const push = (part: string | Uint8Array) => {
    const bytes = typeof part === 'string' ? enc.encode(part) : part
    chunks.push(bytes)
    length += bytes.length
  }
  const object = (id: number, body: string) => {
    offsets[id] = length
    push(`${id} 0 obj\n${body}\nendobj\n`)
  }

  push('%PDF-1.4\n')
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])) // binary marker comment

  object(1, '<< /Type /Catalog /Pages 2 0 R >>')
  object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  object(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] ` +
      '/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>',
  )

  offsets[4] = length
  push(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
  )
  push(jpeg)
  push('\nendstream\nendobj\n')

  const content = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`
  object(5, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`)

  const title = options.title ? ` /Title ${pdfText(options.title)}` : ''
  object(6, `<< /Producer (Torneo Muay Thai)${title} >>`)

  const xref = length
  const count = offsets.length
  push(`xref\n0 ${count}\n0000000000 65535 f \n`)
  for (let i = 1; i < count; i++) push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`)
  push(`trailer\n<< /Size ${count} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`)

  const out = new Uint8Array(length)
  let pos = 0
  for (const c of chunks) {
    out.set(c, pos)
    pos += c.length
  }
  return out
}
