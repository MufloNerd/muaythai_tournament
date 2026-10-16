import { describe, expect, it } from 'vitest'
import {
  balancedByeMatches,
  declareDraw,
  decisionLabel,
  drawStage,
  undoDraw,
  formatDuration,
  matchSeconds,
  roundsSummary,
  bracketSize,
  canUndo,
  createTournament,
  podium,
  recordWinner,
  resolve,
  roundName,
  undoableResults,
  undoResult,
} from './engine'
import type { Fighter, Tournament } from './types'

const fighters = (n: number): Fighter[] =>
  Array.from({ length: n }, (_, i) => ({ id: `f${i}`, firstName: `Nome${i}`, lastName: `Cognome${i}` }))

const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

const make = (n: number, seed = 1, ringCount?: number, thirdPlaceMatch?: boolean) =>
  createTournament({
    name: 'Test',
    roundsPerMatch: 3,
    fighters: fighters(n),
    ringCount,
    thirdPlaceMatch,
    rng: seeded(seed),
    now: 0,
  })

/** Plays every bout on the rings (red always wins) until nothing is left. */
function playAll(t: Tournament): Tournament {
  let clock = 1
  for (let guard = 0; guard < 200; guard++) {
    const onRing = t.rings.find((id) => id !== null)
    if (!onRing) return t
    t = recordWinner(t, onRing, 'red', clock++)
  }
  throw new Error('loop')
}

describe('createTournament', () => {
  it('rejects fewer than 2 fighters', () => {
    expect(() => make(1)).toThrow()
  })

  it.each([2, 3, 4, 5, 6, 7, 8, 9, 13, 16, 17, 32])('places every fighter exactly once with %i fighters', (n) => {
    for (let seed = 1; seed < 20; seed++) {
      const t = make(n, seed)
      const ids = t.matches
        .filter((m) => m.round === 0)
        .flatMap((m) => [m.red, m.blue])
        .filter((s) => s.type === 'fighter')
        .map((s) => (s.type === 'fighter' ? s.fighterId : ''))
      expect(new Set(ids).size).toBe(n)
      expect(ids.length).toBe(n)
      const firstRound = resolve(t).filter((m) => m.def.round === 0 && m.def.kind === 'main')
      expect(firstRound.every((m) => m.status !== 'void')).toBe(true)
    }
  })

  it('adds a third-place match only when there are semifinals', () => {
    expect(make(2).matches.some((m) => m.kind === 'third')).toBe(false)
    expect(make(4).matches.some((m) => m.kind === 'third')).toBe(true)
    expect(make(8).matches.filter((m) => m.kind === 'third')).toHaveLength(1)
  })

  it('assigns the first two ready bouts to the two rings', () => {
    const t = make(8)
    expect(t.rings).toEqual(['r0-m0', 'r0-m1'])
  })

  it.each([3, 5, 7, 9, 13])('with %i fighters puts byes only in the first round', (n) => {
    for (let seed = 1; seed < 20; seed++) {
      const t = make(n, seed)
      const resolved = resolve(t)
      const byes = resolved.filter((m) => m.status === 'bye' && m.def.kind === 'main')
      expect(byes).toHaveLength(bracketSize(n) - n)
      expect(byes.every((m) => m.def.round === 0)).toBe(true)
    }
  })

  it('numbers only real bouts', () => {
    const resolved = resolve(make(5))
    const numbered = resolved.filter((m) => m.number !== null)
    // 5 fighters: 1 real first-round bout + 2 semis + third place + final
    expect(numbered).toHaveLength(5)
    expect(numbered.map((m) => m.number)).toEqual([1, 2, 3, 4, 5])
  })
})

describe('progression', () => {
  it.each([2, 3, 4, 5, 6, 7, 8, 11, 16, 23])('completes a tournament with %i fighters', (n) => {
    const t = playAll(make(n, n))
    const p = podium(t)
    expect(p.finished).toBe(true)
    expect(p.first).not.toBeNull()
    expect(p.second).not.toBeNull()
    expect(p.third).toHaveLength(n === 2 ? 0 : 1)
    expect(new Set([p.first, p.second, ...p.third].filter(Boolean)).size).toBe(n === 2 ? 2 : 3)
    expect(t.rings.every((r) => r === null)).toBe(true)
  })

  it('awards third place automatically with 3 fighters', () => {
    const t = playAll(make(3))
    const p = podium(t)
    expect(p.finished).toBe(true)
    expect(p.third).toHaveLength(1)
  })

  it('moves the winner forward and the losers of semifinals to the third-place match', () => {
    let t = make(4)
    const [semi0, semi1] = resolve(t).filter((m) => m.def.round === 0)
    t = recordWinner(t, semi0.def.id, 'red')
    t = recordWinner(t, semi1.def.id, 'blue')
    const byId = new Map(resolve(t).map((m) => [m.def.id, m]))
    const final = byId.get('r1-m0')!
    const third = byId.get('third')!
    expect(final.red).toEqual({ state: 'filled', fighterId: (semi0.red as { fighterId: string }).fighterId })
    expect(final.blue).toEqual({ state: 'filled', fighterId: (semi1.blue as { fighterId: string }).fighterId })
    expect(third.red).toEqual({ state: 'filled', fighterId: (semi0.blue as { fighterId: string }).fighterId })
    expect(third.status).toBe('ready')
    expect(t.rings).toEqual(['third', 'r1-m0'])
  })

  it('refuses to record a result for a match that is not ready', () => {
    const t = make(8)
    expect(() => recordWinner(t, 'r1-m0', 'red')).toThrow()
  })

  it('frees the ring and assigns the next bout in order of play', () => {
    let t = make(8)
    t = recordWinner(t, 'r0-m1', 'red')
    expect(t.rings).toEqual(['r0-m0', 'r0-m2'])
  })
})

describe('balancedByeMatches', () => {
  /** Byes in the two halves of every sub-bracket differ by at most one. */
  const isBalanced = (byes: Set<number>, start: number, count: number): boolean => {
    if (count === 1) return true
    const half = count / 2
    const top = [...byes].filter((i) => i >= start && i < start + half).length
    const bottom = [...byes].filter((i) => i >= start + half && i < start + count).length
    return Math.abs(top - bottom) <= 1 && isBalanced(byes, start, half) && isBalanced(byes, start + half, half)
  }

  it.each([
    [4, 1],
    [4, 3],
    [8, 3],
    [8, 7],
    [16, 5],
    [16, 11],
  ])('balances %i matches with %i byes', (matches, byeCount) => {
    for (let seed = 1; seed < 30; seed++) {
      const byes = balancedByeMatches(matches, byeCount, seeded(seed))
      expect(byes.size).toBe(byeCount)
      expect([...byes].every((i) => i >= 0 && i < matches)).toBe(true)
      expect(isBalanced(byes, 0, matches)).toBe(true)
    }
  })

  it('randomizes which half receives the extra bye', () => {
    const halves = new Set<string>()
    for (let seed = 1; seed < 30; seed++) {
      const [only] = balancedByeMatches(8, 1, seeded(seed * 7_919_000))
      halves.add(only < 4 ? 'top' : 'bottom')
    }
    expect(halves).toEqual(new Set(['top', 'bottom']))
  })
})

describe('two bronzes (no third-place match)', () => {
  it('does not create a third-place match', () => {
    expect(make(8, 1, 2, false).matches.some((m) => m.kind === 'third')).toBe(false)
  })

  it.each([4, 6, 8, 13])('awards third place to both semifinal losers with %i fighters', (n) => {
    const t = playAll(make(n, n, 2, false))
    const p = podium(t)
    expect(p.finished).toBe(true)
    expect(p.third).toHaveLength(2)
    expect(new Set([p.first, p.second, ...p.third]).size).toBe(4)
  })

  it('shows only the bronzes already decided while semifinals are in progress', () => {
    let t = make(4, 1, 2, false)
    t = recordWinner(t, 'r0-m0', 'red')
    expect(podium(t).third).toHaveLength(1)
    expect(podium(t).finished).toBe(false)
  })

  it('awards a single bronze with 3 fighters', () => {
    expect(podium(playAll(make(3, 1, 2, false))).third).toHaveLength(1)
  })
})

describe('ring count', () => {
  it('defaults to 2 rings', () => {
    expect(make(8).rings).toHaveLength(2)
  })

  it.each([1, 3, 4])('fills %i rings with the first ready bouts', (rings) => {
    const t = make(16, 1, rings)
    expect(t.rings).toEqual(Array.from({ length: rings }, (_, i) => `r0-m${i}`))
  })

  it('leaves extra rings idle when fewer bouts are ready', () => {
    const t = make(4, 1, 4)
    expect(t.rings).toEqual(['r0-m0', 'r0-m1', null, null])
  })

  it('completes a tournament with a single ring', () => {
    const p = podium(playAll(make(11, 3, 1)))
    expect(p.finished).toBe(true)
  })

  it.each([0, 5, 1.5])('rejects %s rings', (rings) => {
    expect(() => make(8, 1, rings)).toThrow()
  })
})

describe('undo', () => {
  it('restores a match onto its ring and removes the follow-up bout from rings', () => {
    let t = make(4)
    t = recordWinner(t, 'r0-m0', 'red', 1)
    t = recordWinner(t, 'r0-m1', 'red', 2)
    expect(t.rings).toEqual(['third', 'r1-m0'])
    expect(canUndo(t, 'r0-m1')).toBe(true)
    t = undoResult(t, 'r0-m1')
    expect(t.results['r0-m1']).toBeUndefined()
    expect(t.rings).toEqual([null, 'r0-m1'])
    expect(resolve(t).find((m) => m.def.id === 'r1-m0')!.status).toBe('pending')
  })

  it('is blocked once a following match has a result', () => {
    let t = make(4)
    t = recordWinner(t, 'r0-m0', 'red', 1)
    t = recordWinner(t, 'r0-m1', 'red', 2)
    t = recordWinner(t, 'third', 'red', 3)
    expect(canUndo(t, 'r0-m0')).toBe(false)
    expect(() => undoResult(t, 'r0-m0')).toThrow()
    expect(undoableResults(t)).toEqual(['third'])
  })

  it('lists undoable results most recent first', () => {
    let t = make(8)
    t = recordWinner(t, 'r0-m0', 'red', 1)
    t = recordWinner(t, 'r0-m1', 'blue', 2)
    expect(undoableResults(t)).toEqual(['r0-m1', 'r0-m0'])
  })
})

describe('roundName', () => {
  it('names rounds in Italian', () => {
    expect(roundName(0, 4)).toBe('Ottavi di finale')
    expect(roundName(1, 4)).toBe('Quarti di finale')
    expect(roundName(2, 4)).toBe('Semifinali')
    expect(roundName(3, 4)).toBe('Finale')
    expect(roundName(3, 4, 'third')).toBe('Finale 3° posto')
    expect(roundName(0, 7)).toBe('1° turno')
  })
})

describe('round and rest durations', () => {
  it('defaults to 2\' rounds and 1\' rest', () => {
    expect(make(4)).toMatchObject({ roundSeconds: 120, pauseSeconds: 60 })
  })

  it('stores custom durations', () => {
    const t = createTournament({ name: 'T', roundsPerMatch: 2, roundSeconds: 90, pauseSeconds: 30, fighters: fighters(4) })
    expect(t).toMatchObject({ roundSeconds: 90, pauseSeconds: 30 })
  })

  it.each([
    [0, 60],
    [15, 60],
    [100, 60],
    [330, 60],
    [120, 0],
    [120, 210],
    [120, 45],
  ])('rejects round %is / rest %is', (roundSeconds, pauseSeconds) => {
    expect(() =>
      createTournament({ name: 'T', roundsPerMatch: 3, roundSeconds, pauseSeconds, fighters: fighters(4) }),
    ).toThrow()
  })

  it('formats durations in minutes and seconds', () => {
    expect(formatDuration(120)).toBe("2'")
    expect(formatDuration(90)).toBe('1\'30"')
    expect(formatDuration(30)).toBe('30"')
    expect(formatDuration(300)).toBe("5'")
  })

  it('computes the length of a bout', () => {
    expect(matchSeconds({ roundsPerMatch: 3, roundSeconds: 120, pauseSeconds: 60 })).toBe(480)
    expect(matchSeconds({ roundsPerMatch: 1, roundSeconds: 90, pauseSeconds: 60 })).toBe(90)
  })

  it('summarises rounds, omitting the rest for single-round bouts', () => {
    expect(roundsSummary({ roundsPerMatch: 3, roundSeconds: 120, pauseSeconds: 60 })).toBe("3 riprese da 2' · 1' di pausa")
    expect(roundsSummary({ roundsPerMatch: 2, roundSeconds: 90, pauseSeconds: 30 })).toBe('2 riprese da 1\'30" · 30" di pausa')
    expect(roundsSummary({ roundsPerMatch: 1, roundSeconds: 180, pauseSeconds: 60 })).toBe("1 ripresa da 3'")
  })
})

describe('draws', () => {
  it('sends the bout to an extra round, keeping it on the same ring', () => {
    let t = make(4)
    t = declareDraw(t, 'r0-m0')
    expect(drawStage(t, 'r0-m0')).toBe(1)
    expect(t.rings).toEqual(['r0-m0', 'r0-m1'])
    expect(resolve(t).find((m) => m.def.id === 'r0-m0')!.status).toBe('ready')
  })

  it('leaves the decision to the judges after a second draw, and allows no third', () => {
    let t = declareDraw(declareDraw(make(4), 'r0-m0'), 'r0-m0')
    expect(drawStage(t, 'r0-m0')).toBe(2)
    expect(() => declareDraw(t, 'r0-m0')).toThrow()
  })

  it('records how the bout was decided', () => {
    let t = make(8)
    t = recordWinner(t, 'r0-m0', 'red', 1)
    t = recordWinner(declareDraw(t, 'r0-m1'), 'r0-m1', 'blue', 2)
    t = recordWinner(declareDraw(declareDraw(t, 'r0-m2'), 'r0-m2'), 'r0-m2', 'red', 3)
    expect(t.results['r0-m0'].decision).toBe('regular')
    expect(t.results['r0-m1'].decision).toBe('extra-round')
    expect(t.results['r0-m2'].decision).toBe('judges')
    expect(decisionLabel('regular')).toBeNull()
    expect(decisionLabel(undefined)).toBeNull()
    expect(decisionLabel('extra-round')).toBe('dopo ripresa supplementare')
    expect(decisionLabel('judges')).toBe('decisione dei giudici')
  })

  it('advances the winner normally after a draw', () => {
    let t = make(4)
    t = recordWinner(declareDraw(t, 'r0-m0'), 'r0-m0', 'blue', 1)
    t = recordWinner(t, 'r0-m1', 'red', 2)
    const final = resolve(t).find((m) => m.def.id === 'r1-m0')!
    expect(final.status).toBe('ready')
    expect(podium(playAll(t)).finished).toBe(true)
  })

  it('cancels a draw step by step, only while the bout is undecided', () => {
    let t = declareDraw(declareDraw(make(4), 'r0-m0'), 'r0-m0')
    t = undoDraw(t, 'r0-m0')
    expect(drawStage(t, 'r0-m0')).toBe(1)
    t = undoDraw(t, 'r0-m0')
    expect(drawStage(t, 'r0-m0')).toBe(0)
    expect(t.draws).toEqual({})
    expect(() => undoDraw(t, 'r0-m0')).toThrow()
    const decided = recordWinner(declareDraw(t, 'r0-m0'), 'r0-m0', 'red')
    expect(() => undoDraw(decided, 'r0-m0')).toThrow()
  })

  it('refuses draws on bouts that are not ready', () => {
    expect(() => declareDraw(make(8), 'r1-m0')).toThrow()
  })

  it('undoing a result brings the bout back to its draw stage', () => {
    let t = recordWinner(declareDraw(make(4), 'r0-m0'), 'r0-m0', 'red', 1)
    t = undoResult(t, 'r0-m0')
    expect(drawStage(t, 'r0-m0')).toBe(1)
    expect(t.rings).toContain('r0-m0')
  })

  it('clears draws of following bouts when a result feeding them is undone', () => {
    let t = make(4)
    t = recordWinner(t, 'r0-m0', 'red', 1)
    t = recordWinner(t, 'r0-m1', 'red', 2)
    t = declareDraw(t, 'r1-m0')
    t = undoResult(t, 'r0-m1')
    expect(drawStage(t, 'r1-m0')).toBe(0)
  })

  it('uses the round length for the extra round unless configured', () => {
    expect(make(4).extraRoundSeconds).toBe(120)
    const t = createTournament({ name: 'T', roundsPerMatch: 3, roundSeconds: 90, fighters: fighters(4) })
    expect(t.extraRoundSeconds).toBe(90)
    const u = createTournament({ name: 'T', roundsPerMatch: 3, extraRoundSeconds: 60, fighters: fighters(4) })
    expect(u.extraRoundSeconds).toBe(60)
    expect(() => createTournament({ name: 'T', roundsPerMatch: 3, extraRoundSeconds: 45, fighters: fighters(4) })).toThrow()
  })
})
