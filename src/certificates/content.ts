import { fighterName, podium } from '../tournament/engine'
import type { Tournament } from '../tournament/types'

export type Place = 1 | 2 | 3
export type Metal = 'gold' | 'silver' | 'bronze'

export interface CertificateEntry {
  fighterId: string
  fighterName: string
  place: Place
  tournamentName: string
  /** Date of the last recorded result, i.e. when the tournament ended. */
  date: Date
}

export const PLACE_INFO: Record<Place, { badge: string; plate: string; line: string; metal: Metal }> = {
  1: { badge: '1°', plate: 'CAMPIONE', line: '1° classificato · Campione del torneo', metal: 'gold' },
  2: { badge: '2°', plate: 'VICECAMPIONE', line: '2° classificato', metal: 'silver' },
  3: { badge: '3°', plate: 'TERZO POSTO', line: '3° classificato', metal: 'bronze' },
}

/** One certificate per podium athlete (two for third place when bronzes are shared); empty until the end. */
export function certificateEntries(t: Tournament): CertificateEntry[] {
  const p = podium(t)
  if (!p.finished) return []
  const fighters = new Map(t.fighters.map((f) => [f.id, f]))
  const lastResult = Math.max(...Object.values(t.results).map((r) => r.at))
  const date = new Date(Number.isFinite(lastResult) ? lastResult : Date.now())
  const ranked: [string | null, Place][] = [[p.first, 1], [p.second, 2], ...p.third.map((id): [string, Place] => [id, 3])]
  return ranked
    .filter((r): r is [string, Place] => r[0] !== null)
    .map(([fighterId, place]) => ({
      fighterId,
      fighterName: fighterName(fighters.get(fighterId)),
      place,
      tournamentName: t.name,
      date,
    }))
}

export function formatCertificateDate(date: Date): string {
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function certificateFileName(entry: Pick<CertificateEntry, 'place' | 'fighterName'>): string {
  return `Certificato-${entry.place}-posto-${slug(entry.fighterName) || 'atleta'}.pdf`
}
