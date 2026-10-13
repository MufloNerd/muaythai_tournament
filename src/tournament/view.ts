import { fighterName, mainRoundCount, roundName } from './engine'
import type { ResolvedMatch, SlotSource, SlotState, Tournament } from './types'

/** Convenience lookups built from a resolved tournament, shared by the views. */
export function buildView(t: Tournament, resolved: ResolvedMatch[]) {
  const fighters = new Map(t.fighters.map((f) => [f.id, f]))
  const byId = new Map(resolved.map((m) => [m.def.id, m]))
  const totalRounds = mainRoundCount(t)

  const name = (fighterId: string | null) => (fighterId ? fighterName(fighters.get(fighterId)) : '')

  const slotLabel = (source: SlotSource, slot: SlotState): string => {
    if (slot.state === 'filled') return name(slot.fighterId)
    if (slot.state === 'empty') return '—'
    if (source.type === 'winner' || source.type === 'loser') {
      const feeder = byId.get(source.matchId)
      const ref = feeder?.number ? `inc. ${feeder.number}` : roundName(feeder!.def.round, totalRounds)
      return source.type === 'winner' ? `Vincente ${ref}` : `Perdente ${ref}`
    }
    return 'Da definire'
  }

  const title = (m: ResolvedMatch) => roundName(m.def.round, totalRounds, m.def.kind)

  return { name, slotLabel, title, byId, totalRounds }
}
