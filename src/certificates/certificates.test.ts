import { describe, expect, it } from 'vitest'
import { createTournament, recordWinner } from '../tournament/engine'
import type { Fighter, Tournament } from '../tournament/types'
import { certificateEntries, certificateFileName, certificateTitle, formatCertificateDate } from './content'
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
  const places = (t: Tournament) =>
    certificateEntries(t).map((e) => (e.kind === 'winner' ? e.place : 'p'))

  it('is empty until the tournament is finished', () => {
    expect(certificateEntries(make(8))).toEqual([])
  })

  it('returns the podium first, then one participation certificate for everyone else', () => {
    const entries = certificateEntries(playAll(make(8)))
    expect(places(playAll(make(8)))).toEqual([1, 2, 3, 'p', 'p', 'p', 'p', 'p'])
    expect(new Set(entries.map((e) => e.fighterId)).size).toBe(8)
    expect(entries[0].fighterName).toMatch(/^Nome\d+ Cognome\d+$/)
    expect(entries[0].tournamentName).toBe('Coppa')
  })

  it('sorts participants by surname, then name', () => {
    const t = playAll(
      createTournament({
        name: 'Coppa',
        roundsPerMatch: 3,
        now: 0,
        fighters: [
          { id: 'a', firstName: 'Zeno', lastName: 'Rossi' },
          { id: 'b', firstName: 'Anna', lastName: 'Rossi' },
          { id: 'c', firstName: 'Luca', lastName: 'Bianchi' },
          { id: 'd', firstName: 'Ugo', lastName: 'Verdi' },
          { id: 'e', firstName: 'Ida', lastName: 'Neri' },
          { id: 'f', firstName: 'Eva', lastName: 'Conti' },
        ],
      }),
    )
    const names = certificateEntries(t)
      .filter((e) => e.kind === 'participant')
      .map((e) => e.fighterName)
    const sorted = [...names].sort((x, y) => {
      const [fx, lx] = x.split(' ')
      const [fy, ly] = y.split(' ')
      return lx.localeCompare(ly, 'it') || fx.localeCompare(fy, 'it')
    })
    expect(names).toEqual(sorted)
  })

  it('returns two third places with shared bronzes', () => {
    expect(places(playAll(make(8, false)))).toEqual([1, 2, 3, 3, 'p', 'p', 'p', 'p'])
  })

  it('uses the time of the last result as date', () => {
    const t = playAll(make(4))
    const last = Math.max(...Object.values(t.results).map((r) => r.at))
    expect(certificateEntries(t)[0].date.getTime()).toBe(last)
  })

  it('has no third place and no participants with 2 fighters', () => {
    expect(places(playAll(make(2)))).toEqual([1, 2])
  })
})

describe('certificate helpers', () => {
  const base = { fighterId: 'x', tournamentName: 'T', date: new Date(0) }

  it('builds safe file names', () => {
    expect(certificateFileName({ ...base, kind: 'winner', place: 1, fighterName: "Niccolò D'Amico" })).toBe(
      'Certificato-1-posto-Niccolo-D-Amico.pdf',
    )
    expect(certificateFileName({ ...base, kind: 'winner', place: 3, fighterName: '  ' })).toBe(
      'Certificato-3-posto-atleta.pdf',
    )
    expect(certificateFileName({ ...base, kind: 'participant', fighterName: 'Anna Rossi' })).toBe(
      'Attestato-partecipazione-Anna-Rossi.pdf',
    )
  })

  it('titles winner and participant certificates', () => {
    expect(certificateTitle({ ...base, kind: 'winner', place: 2, fighterName: 'A' })).toBe('CERTIFICATO DI VITTORIA')
    expect(certificateTitle({ ...base, kind: 'participant', fighterName: 'A' })).toBe('ATTESTATO DI PARTECIPAZIONE')
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
