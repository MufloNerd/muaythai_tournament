import { fighterName, podium } from '../tournament/engine'
import type { Tournament } from '../tournament/types'

export type Place = 1 | 2 | 3
export type Metal = 'gold' | 'silver' | 'bronze'

interface BaseEntry {
  fighterId: string
  fighterName: string
  tournamentName: string
  /** Date of the last recorded result, i.e. when the tournament ended. */
  date: Date
}

export interface WinnerEntry extends BaseEntry {
  kind: 'winner'
  place: Place
}

export interface ParticipantEntry extends BaseEntry {
  kind: 'participant'
}

export type CertificateEntry = WinnerEntry | ParticipantEntry

export const PLACE_INFO: Record<Place, { badge: string; plate: string; line: string; metal: Metal }> = {
  1: { badge: '1°', plate: 'CAMPIONE', line: '1° classificato · Campione del torneo', metal: 'gold' },
  2: { badge: '2°', plate: 'VICECAMPIONE', line: '2° classificato', metal: 'silver' },
  3: { badge: '3°', plate: 'TERZO POSTO', line: '3° classificato', metal: 'bronze' },
}

export const PARTICIPANT_LINE = 'per aver partecipato con impegno, coraggio e rispetto'

export const certificateTitle = (entry: CertificateEntry) =>
  entry.kind === 'winner' ? 'CERTIFICATO DI VITTORIA' : 'ATTESTATO DI PARTECIPAZIONE'

/**
 * Podium certificates first (two for third place when bronzes are shared), then one participation
 * certificate for every other athlete, sorted by surname. Empty until the tournament is over.
 */
export function certificateEntries(t: Tournament): CertificateEntry[] {
  const p = podium(t)
  if (!p.finished) return []
  const fighters = new Map(t.fighters.map((f) => [f.id, f]))
  const lastResult = Math.max(...Object.values(t.results).map((r) => r.at))
  const date = new Date(Number.isFinite(lastResult) ? lastResult : Date.now())
  const base = (fighterId: string): BaseEntry => ({
    fighterId,
    fighterName: fighterName(fighters.get(fighterId)),
    tournamentName: t.name,
    date,
  })

  const ranked: [string | null, Place][] = [[p.first, 1], [p.second, 2], ...p.third.map((id): [string, Place] => [id, 3])]
  const winners: WinnerEntry[] = ranked
    .filter((r): r is [string, Place] => r[0] !== null)
    .map(([id, place]) => ({ ...base(id), kind: 'winner', place }))

  const onPodium = new Set(winners.map((w) => w.fighterId))
  const participants: ParticipantEntry[] = [...t.fighters]
    .filter((f) => !onPodium.has(f.id))
    .sort((a, b) => a.lastName.localeCompare(b.lastName, 'it') || a.firstName.localeCompare(b.firstName, 'it'))
    .map((f) => ({ ...base(f.id), kind: 'participant' }))

  return [...winners, ...participants]
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

export function certificateFileName(entry: CertificateEntry): string {
  const name = slug(entry.fighterName) || 'atleta'
  return entry.kind === 'winner'
    ? `Certificato-${entry.place}-posto-${name}.pdf`
    : `Attestato-partecipazione-${name}.pdf`
}
