import { describe, expect, it } from 'vitest'
import { createTournament, recordWinner } from '../tournament/engine'
import type { Fighter, Tournament } from '../tournament/types'
import { certificateEntries, certificateFileName, formatCertificateDate } from './content'
import { jpegToPdf } from './pdf'

const fighters = (n: number): Fighter[] =>
  Array.from({ length: n }, (_, i) => ({ id: `f${i}`, firstName: `Nome${i}`, lastName: `Cognome${i}` }))

function playAll(t: Tournament): Tournament {
  let clock = 1_000
  while (t.rings.some((id) => id !== null)) t = recordWinner(t, t.rings.find((id) => id !== null)!, 'red', clock++)
  return t
}

const make = (n: number, thirdPlaceMatch = true) =>
  createTournament({ name: 'Coppa', roundsPerMatch: 3, fighters: fighters(n), thirdPlaceMatch, now: 0 })

describe('certificateEntries', () => {
  it('is empty until the tournament is finished', () => {
    expect(certificateEntries(make(8))).toEqual([])
  })

  it('returns first, second and third place', () => {
    const entries = certificateEntries(playAll(make(8)))
    expect(entries.map((e) => e.place)).toEqual([1, 2, 3])
    expect(new Set(entries.map((e) => e.fighterId)).size).toBe(3)
    expect(entries[0].fighterName).toMatch(/^Nome\d+ Cognome\d+$/)
    expect(entries[0].tournamentName).toBe('Coppa')
  })

  it('returns two third places with shared bronzes', () => {
    expect(certificateEntries(playAll(make(8, false))).map((e) => e.place)).toEqual([1, 2, 3, 3])
  })

  it('uses the time of the last result as date', () => {
    const t = playAll(make(4))
    const last = Math.max(...Object.values(t.results).map((r) => r.at))
    expect(certificateEntries(t)[0].date.getTime()).toBe(last)
  })

  it('has no third place with 2 fighters', () => {
    expect(certificateEntries(playAll(make(2))).map((e) => e.place)).toEqual([1, 2])
  })
})

describe('certificate helpers', () => {
  it('builds safe file names', () => {
    expect(certificateFileName({ place: 1, fighterName: "Niccolò D'Amico" })).toBe(
      'Certificato-1-posto-Niccolo-D-Amico.pdf',
    )
    expect(certificateFileName({ place: 3, fighterName: '  ' })).toBe('Certificato-3-posto-atleta.pdf')
  })

  it('formats the date in Italian', () => {
    expect(formatCertificateDate(new Date(2026, 9, 13))).toBe('13 ottobre 2026')
  })
})

describe('jpegToPdf', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9])
  const pdf = jpegToPdf(jpeg, 2480, 1754, { title: 'Certificato – Niccolò' })
  const text = new TextDecoder('latin1').decode(pdf)

  it('has a valid header and trailer', () => {
    expect(text.startsWith('%PDF-1.4\n')).toBe(true)
    expect(text.endsWith('%%EOF\n')).toBe(true)
    expect(text).toContain('/Width 2480 /Height 1754')
    expect(text).toContain(`/Filter /DCTDecode /Length ${jpeg.length}`)
  })

  it('points startxref and every xref entry at the right byte offsets', () => {
    const startxref = Number(/startxref\n(\d+)\n%%EOF\n$/.exec(text)![1])
    expect(text.slice(startxref, startxref + 4)).toBe('xref')
    const entries = [...text.slice(startxref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]))
    expect(entries).toHaveLength(6)
    entries.forEach((offset, i) => expect(text.slice(offset).startsWith(`${i + 1} 0 obj`)).toBe(true))
  })

  it('embeds the image bytes unchanged', () => {
    const start = text.indexOf('stream\n') + 'stream\n'.length
    expect([...pdf.slice(start, start + jpeg.length)]).toEqual([...jpeg])
  })

  it('encodes the title as UTF-16BE', () => {
    expect(text).toContain('/Title <FEFF')
    expect(text).toContain('00F2') // ò
  })
})
