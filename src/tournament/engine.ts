import type {
  Corner,
  Decision,
  Fighter,
  MatchDef,
  ResolvedMatch,
  SlotSource,
  SlotState,
  Tournament,
} from './types'

export const RING_COUNT = 2
export const MIN_RINGS = 1
export const MAX_RINGS = 4

export const DEFAULT_ROUND_SECONDS = 120
export const DEFAULT_PAUSE_SECONDS = 60
export const DURATION_STEP_SECONDS = 30
export const ROUND_SECONDS_RANGE = [30, 300] as const
export const PAUSE_SECONDS_RANGE = [30, 180] as const

/** 120 → 2', 90 → 1'30", 30 → 30" */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}"`
  return s === 0 ? `${m}'` : `${m}'${String(s).padStart(2, '0')}"`
}

/** Total length of one bout: all rounds plus the rests between them. */
export function matchSeconds(t: Pick<Tournament, 'roundsPerMatch' | 'roundSeconds' | 'pauseSeconds'>): number {
  return t.roundsPerMatch * t.roundSeconds + Math.max(0, t.roundsPerMatch - 1) * t.pauseSeconds
}

/** e.g. "3 riprese da 2' · 1' di pausa" (no rest mentioned for single-round bouts). */
export function roundsSummary(t: Pick<Tournament, 'roundsPerMatch' | 'roundSeconds' | 'pauseSeconds'>): string {
  const rounds = `${t.roundsPerMatch} ${t.roundsPerMatch === 1 ? 'ripresa' : 'riprese'} da ${formatDuration(t.roundSeconds)}`
  return t.roundsPerMatch > 1 ? `${rounds} · ${formatDuration(t.pauseSeconds)} di pausa` : rounds
}

export type Rng = () => number

export function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function bracketSize(fighterCount: number): number {
  let size = 1
  while (size < fighterCount) size *= 2
  return size
}

export function mainRoundCount(t: Pick<Tournament, 'matches'>): number {
  return t.matches.reduce((max, m) => (m.kind === 'main' ? Math.max(max, m.round + 1) : max), 0)
}

export function fighterName(f: Fighter | undefined): string {
  return f ? `${f.firstName} ${f.lastName}`.trim() : ''
}

export function roundName(round: number, totalRounds: number, kind: MatchDef['kind'] = 'main'): string {
  if (kind === 'third') return 'Finale 3° posto'
  const matchesInRound = 2 ** (totalRounds - round - 1)
  switch (matchesInRound) {
    case 1:
      return 'Finale'
    case 2:
      return 'Semifinali'
    case 4:
      return 'Quarti di finale'
    case 8:
      return 'Ottavi di finale'
    case 16:
      return 'Sedicesimi di finale'
    default:
      return `${round + 1}° turno`
  }
}

/**
 * Picks which first-round matches get a bye, balancing them between the two halves of every
 * sub-bracket (as in IBA/IFMA draws). When a split is odd, the half receiving the extra bye is random.
 */
export function balancedByeMatches(matchCount: number, byeCount: number, rng: Rng = Math.random): Set<number> {
  if (byeCount > matchCount) throw new Error('Troppi bye')
  const out = new Set<number>()
  const place = (start: number, count: number, byes: number) => {
    if (byes === 0) return
    if (count === 1) {
      out.add(start)
      return
    }
    const half = count / 2
    const extraOnTop = byes % 2 === 1 && rng() < 0.5
    const top = Math.floor(byes / 2) + (extraOnTop ? 1 : 0)
    place(start, half, top)
    place(start + half, half, byes - top)
  }
  place(0, matchCount, byeCount)
  return out
}

/**
 * Builds a single-elimination bracket with random draw and balanced random bye placement.
 * Byes never face each other, so every first-round match has at least one fighter.
 * When the bracket has semifinals, either a third-place match is added or both semifinal
 * losers share third place (two bronzes, IFMA style).
 */
export function createTournament(params: {
  name: string
  roundsPerMatch: number
  roundSeconds?: number
  pauseSeconds?: number
  extraRoundSeconds?: number
  fighters: Fighter[]
  ringCount?: number
  thirdPlaceMatch?: boolean
  rng?: Rng
  now?: number
}): Tournament {
  const {
    name,
    roundsPerMatch,
    roundSeconds = DEFAULT_ROUND_SECONDS,
    pauseSeconds = DEFAULT_PAUSE_SECONDS,
    extraRoundSeconds = roundSeconds,
    fighters,
    ringCount = RING_COUNT,
    thirdPlaceMatch = true,
    rng = Math.random,
    now = Date.now(),
  } = params
  if (fighters.length < 2) throw new Error('Servono almeno 2 partecipanti')
  if (!Number.isInteger(ringCount) || ringCount < MIN_RINGS || ringCount > MAX_RINGS) {
    throw new Error(`Il numero di ring deve essere tra ${MIN_RINGS} e ${MAX_RINGS}`)
  }
  const validDuration = (s: number, [min, max]: readonly [number, number]) =>
    Number.isInteger(s) && s >= min && s <= max && s % DURATION_STEP_SECONDS === 0
  if (!validDuration(roundSeconds, ROUND_SECONDS_RANGE)) throw new Error('Durata della ripresa non valida')
  if (!validDuration(pauseSeconds, PAUSE_SECONDS_RANGE)) throw new Error('Durata della pausa non valida')
  if (!validDuration(extraRoundSeconds, ROUND_SECONDS_RANGE)) {
    throw new Error('Durata della ripresa supplementare non valida')
  }

  const size = bracketSize(fighters.length)
  const firstRoundMatches = size / 2
  const byeCount = size - fighters.length
  const byeMatches = balancedByeMatches(firstRoundMatches, byeCount, rng)
  const drawn = shuffle(fighters, rng)

  const matches: MatchDef[] = []
  let next = 0
  for (let i = 0; i < firstRoundMatches; i++) {
    const a: SlotSource = { type: 'fighter', fighterId: drawn[next++].id }
    let b: SlotSource = { type: 'none' }
    if (!byeMatches.has(i)) b = { type: 'fighter', fighterId: drawn[next++].id }
    const [red, blue] = rng() < 0.5 ? [a, b] : [b, a]
    matches.push({ id: `r0-m${i}`, round: 0, index: i, kind: 'main', red, blue })
  }

  const totalRounds = Math.log2(size)
  for (let r = 1; r < totalRounds; r++) {
    const count = size / 2 ** (r + 1)
    if (count === 1 && thirdPlaceMatch) {
      matches.push({
        id: 'third',
        round: r,
        index: 0,
        kind: 'third',
        red: { type: 'loser', matchId: `r${r - 1}-m0` },
        blue: { type: 'loser', matchId: `r${r - 1}-m1` },
      })
    }
    for (let i = 0; i < count; i++) {
      matches.push({
        id: `r${r}-m${i}`,
        round: r,
        index: i,
        kind: 'main',
        red: { type: 'winner', matchId: `r${r - 1}-m${2 * i}` },
        blue: { type: 'winner', matchId: `r${r - 1}-m${2 * i + 1}` },
      })
    }
  }

  return fillRings({
    name: name.trim() || 'Torneo Muay Thai',
    roundsPerMatch,
    roundSeconds,
    pauseSeconds,
    extraRoundSeconds,
    fighters,
    matches,
    results: {},
    draws: {},
    rings: Array(ringCount).fill(null),
    startedAt: now,
  })
}

/** Derives the full state of every match from the bracket structure and recorded results. */
export function resolve(t: Tournament): ResolvedMatch[] {
  const byId = new Map<string, ResolvedMatch>()
  const structurallyEmpty = new Map<string, { red: boolean; blue: boolean }>()

  const isStructurallyEmpty = (src: SlotSource): boolean => {
    if (src.type === 'none') return true
    if (src.type === 'fighter') return false
    const feeder = structurallyEmpty.get(src.matchId)!
    const feederVoid = feeder.red && feeder.blue
    const feederBye = feeder.red !== feeder.blue
    return src.type === 'winner' ? feederVoid : feederVoid || feederBye
  }

  const slot = (src: SlotSource): SlotState => {
    switch (src.type) {
      case 'fighter':
        return { state: 'filled', fighterId: src.fighterId }
      case 'none':
        return { state: 'empty' }
      case 'winner': {
        const m = byId.get(src.matchId)!
        if (m.status === 'void') return { state: 'empty' }
        return m.winnerId ? { state: 'filled', fighterId: m.winnerId } : { state: 'pending' }
      }
      case 'loser': {
        const m = byId.get(src.matchId)!
        if (m.status === 'void' || m.status === 'bye') return { state: 'empty' }
        return m.loserId ? { state: 'filled', fighterId: m.loserId } : { state: 'pending' }
      }
    }
  }

  const out: ResolvedMatch[] = []
  let number = 0
  for (const def of t.matches) {
    const emptyRed = isStructurallyEmpty(def.red)
    const emptyBlue = isStructurallyEmpty(def.blue)
    structurallyEmpty.set(def.id, { red: emptyRed, blue: emptyBlue })

    const red = slot(def.red)
    const blue = slot(def.blue)
    const result = t.results[def.id]
    let status: ResolvedMatch['status'] = 'pending'
    let winnerId: string | null = null
    let loserId: string | null = null

    if (red.state === 'empty' && blue.state === 'empty') {
      status = 'void'
    } else if (red.state === 'empty' && blue.state === 'filled') {
      status = 'bye'
      winnerId = blue.fighterId
    } else if (blue.state === 'empty' && red.state === 'filled') {
      status = 'bye'
      winnerId = red.fighterId
    } else if (red.state === 'filled' && blue.state === 'filled') {
      if (result) {
        status = 'done'
        winnerId = result.winner === 'red' ? red.fighterId : blue.fighterId
        loserId = result.winner === 'red' ? blue.fighterId : red.fighterId
      } else {
        status = 'ready'
      }
    }

    const ringIndex = t.rings.indexOf(def.id)
    const resolved: ResolvedMatch = {
      def,
      red,
      blue,
      status,
      winnerId,
      loserId,
      number: emptyRed || emptyBlue ? null : ++number,
      ring: ringIndex >= 0 ? ringIndex : null,
    }
    byId.set(def.id, resolved)
    out.push(resolved)
  }
  return out
}

/** Keeps ring assignments valid and assigns the next ready bouts (in order of play) to free rings. */
export function fillRings(t: Tournament): Tournament {
  const resolved = resolve(t)
  const readyIds = new Set(resolved.filter((m) => m.status === 'ready').map((m) => m.def.id))
  const rings = t.rings.map((id) => (id && readyIds.has(id) ? id : null))
  const queue = resolved.filter((m) => m.status === 'ready' && !rings.includes(m.def.id))
  for (let i = 0; i < rings.length; i++) {
    if (rings[i] === null) rings[i] = queue.shift()?.def.id ?? null
  }
  return { ...t, rings }
}

export const MAX_DRAWS = 2

/** 0 = regular time, 1 = extra round after a draw, 2 = judges' decision after a second draw. */
export function drawStage(t: Pick<Tournament, 'draws'>, matchId: string): number {
  return t.draws?.[matchId] ?? 0
}

export const DECISIONS: Decision[] = ['regular', 'extra-round', 'judges']

export function decisionLabel(decision: Decision | undefined): string | null {
  if (decision === 'extra-round') return 'dopo ripresa supplementare'
  if (decision === 'judges') return 'decisione dei giudici'
  return null
}

function readyMatch(t: Tournament, matchId: string) {
  const match = resolve(t).find((m) => m.def.id === matchId)
  if (!match || match.status !== 'ready') throw new Error('Incontro non disponibile')
  return match
}

export function recordWinner(t: Tournament, matchId: string, winner: Corner, now = Date.now()): Tournament {
  readyMatch(t, matchId)
  const ringIndex = t.rings.indexOf(matchId)
  const decision = DECISIONS[drawStage(t, matchId)]
  return fillRings({
    ...t,
    results: { ...t.results, [matchId]: { winner, ring: ringIndex >= 0 ? ringIndex : null, at: now, decision } },
    rings: t.rings.map((id) => (id === matchId ? null : id)),
  })
}

/**
 * A draw sends the bout to an extra round; a second draw leaves the decision to the judges.
 * The bout keeps its ring and the bracket is unaffected: a winner is still required.
 */
export function declareDraw(t: Tournament, matchId: string): Tournament {
  readyMatch(t, matchId)
  const stage = drawStage(t, matchId)
  if (stage >= MAX_DRAWS) throw new Error('Dopo due pareggi decidono i giudici')
  return { ...t, draws: { ...t.draws, [matchId]: stage + 1 } }
}

export function undoDraw(t: Tournament, matchId: string): Tournament {
  const stage = drawStage(t, matchId)
  if (stage === 0 || t.results[matchId]) throw new Error('Nessun pareggio da annullare')
  const draws = { ...t.draws }
  if (stage === 1) delete draws[matchId]
  else draws[matchId] = stage - 1
  return { ...t, draws }
}

function dependents(t: Tournament, matchId: string): MatchDef[] {
  const feeds = (s: SlotSource) => (s.type === 'winner' || s.type === 'loser') && s.matchId === matchId
  return t.matches.filter((m) => feeds(m.red) || feeds(m.blue))
}

/** A result can be undone only while no following match fed by it has been decided. */
export function canUndo(t: Tournament, matchId: string): boolean {
  if (!t.results[matchId]) return false
  return dependents(t, matchId).every((m) => !t.results[m.id])
}

export function undoResult(t: Tournament, matchId: string): Tournament {
  if (!canUndo(t, matchId)) throw new Error('Impossibile annullare questo risultato')
  const deps = new Set(dependents(t, matchId).map((m) => m.id))
  const { [matchId]: removed, ...results } = t.results
  const rings = t.rings.map((id) => (id && deps.has(id) ? null : id))
  if (removed.ring !== null && removed.ring < rings.length && rings[removed.ring] === null) {
    rings[removed.ring] = matchId
  }
  // Draws on the following bouts referred to fighters that may no longer be there.
  const draws = Object.fromEntries(Object.entries(t.draws ?? {}).filter(([id]) => !deps.has(id)))
  return fillRings({ ...t, results, rings, draws })
}

/** Most recent undoable results first. */
export function undoableResults(t: Tournament): string[] {
  return Object.entries(t.results)
    .sort(([, a], [, b]) => b.at - a.at)
    .map(([id]) => id)
    .filter((id) => canUndo(t, id))
}

export interface Podium {
  finished: boolean
  first: string | null
  second: string | null
  /** Winner of the third-place match, or both semifinal losers when third place is shared. */
  third: string[]
}

export function podium(t: Tournament): Podium {
  const resolved = resolve(t)
  const totalRounds = mainRoundCount(t)
  const final = resolved.find((m) => m.def.kind === 'main' && m.def.round === totalRounds - 1)
  const third = resolved.find((m) => m.def.kind === 'third')
  const finalDone = final?.status === 'done' || final?.status === 'bye'
  const thirdDone = !third || third.status === 'done' || third.status === 'bye' || third.status === 'void'
  const semifinals = resolved.filter((m) => m.def.kind === 'main' && m.def.round === totalRounds - 2)
  const thirdPlace = third
    ? [third.winnerId]
    : semifinals.map((m) => (m.status === 'done' ? m.loserId : null))
  return {
    finished: !!finalDone && thirdDone,
    first: finalDone ? final!.winnerId : null,
    second: finalDone ? final!.loserId : null,
    third: thirdPlace.filter((id): id is string => id !== null),
  }
}
