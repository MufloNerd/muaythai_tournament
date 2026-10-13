import { describe, expect, it } from 'vitest'
import {
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

const make = (n: number, seed = 1) =>
  createTournament({ name: 'Test', roundsPerMatch: 3, fighters: fighters(n), rng: seeded(seed), now: 0 })

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
    if (n >= 4) expect(p.third).not.toBeNull()
    if (n === 2) expect(p.third).toBeNull()
    expect(new Set([p.first, p.second, p.third].filter(Boolean)).size).toBe(n === 2 ? 2 : 3)
    expect(t.rings).toEqual([null, null])
  })

  it('awards third place automatically with 3 fighters', () => {
    const t = playAll(make(3))
    const p = podium(t)
    expect(p.finished).toBe(true)
    expect(p.third).not.toBeNull()
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
