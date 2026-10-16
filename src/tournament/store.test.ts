import { describe, expect, it } from 'vitest'
import { parseState } from './store'

describe('parseState', () => {
  it('returns defaults when nothing is saved or data is corrupt', () => {
    for (const raw of [null, '', '{not json']) {
      const s = parseState(raw)
      expect(s.tournament).toBeNull()
      expect(s.draft).toMatchObject({ roundsPerMatch: 3, roundSeconds: 120, pauseSeconds: 60, ringCount: 2 })
    }
  })

  it("migrates drafts and tournaments saved before durations were configurable to 2' / 1'", () => {
    const old = {
      draft: { name: 'Vecchio', roundsPerMatch: 5, ringCount: 3, thirdPlaceMatch: false, fighters: [] },
      tournament: { name: 'Vecchio', roundsPerMatch: 5, fighters: [], matches: [], results: {}, rings: [null], startedAt: 1 },
    }
    const s = parseState(JSON.stringify(old))
    expect(s.draft).toMatchObject({ name: 'Vecchio', roundsPerMatch: 5, roundSeconds: 120, pauseSeconds: 60 })
    expect(s.tournament).toMatchObject({ roundsPerMatch: 5, roundSeconds: 120, pauseSeconds: 60 })
  })

  it('migrates tournaments saved before draws were handled', () => {
    const old = { tournament: { roundsPerMatch: 3, roundSeconds: 90, pauseSeconds: 30, results: {} } }
    const s = parseState(JSON.stringify(old))
    expect(s.tournament).toMatchObject({ extraRoundSeconds: 90, draws: {} })
    expect(s.draft.extraRoundSeconds).toBe(120)
  })

  it('keeps saved draws and extra round length', () => {
    const saved = { tournament: { roundSeconds: 120, extraRoundSeconds: 60, draws: { 'r0-m0': 1 } } }
    expect(parseState(JSON.stringify(saved)).tournament).toMatchObject({ extraRoundSeconds: 60, draws: { 'r0-m0': 1 } })
  })

  it('keeps saved durations', () => {
    const saved = {
      draft: { roundSeconds: 90, pauseSeconds: 30 },
      tournament: { roundSeconds: 180, pauseSeconds: 90, roundsPerMatch: 3 },
    }
    const s = parseState(JSON.stringify(saved))
    expect(s.draft).toMatchObject({ roundSeconds: 90, pauseSeconds: 30 })
    expect(s.tournament).toMatchObject({ roundSeconds: 180, pauseSeconds: 90 })
  })
})
