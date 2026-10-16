import { useCallback, useEffect, useState } from 'react'
import {
  createTournament,
  declareDraw,
  DEFAULT_PAUSE_SECONDS,
  DEFAULT_ROUND_SECONDS,
  makeId,
  RING_COUNT,
  recordWinner,
  undoDraw,
  undoResult,
} from './engine'
import type { Corner, Fighter, Tournament } from './types'

const STORAGE_KEY = 'muaythai-tournament:v1'

export interface Draft {
  name: string
  roundsPerMatch: number
  roundSeconds: number
  pauseSeconds: number
  extraRoundSeconds: number
  ringCount: number
  /** false = two bronzes (both semifinal losers share third place). */
  thirdPlaceMatch: boolean
  fighters: Fighter[]
}

export interface AppState {
  draft: Draft
  tournament: Tournament | null
}

const initialState: AppState = {
  draft: {
    name: '',
    roundsPerMatch: 3,
    roundSeconds: DEFAULT_ROUND_SECONDS,
    pauseSeconds: DEFAULT_PAUSE_SECONDS,
    extraRoundSeconds: DEFAULT_ROUND_SECONDS,
    ringCount: RING_COUNT,
    thirdPlaceMatch: true,
    fighters: [],
  },
  tournament: null,
}

/** Restores saved state, filling in fields added by later versions. */
export function parseState(raw: string | null): AppState {
  try {
    if (!raw) return initialState
    // Data from older versions may lack fields that are now required.
    const parsed = JSON.parse(raw) as { draft?: Partial<Draft>; tournament?: Partial<Tournament> | null }
    // Tournaments saved before durations were configurable used 2' rounds and 1' rests;
    // before draws were handled there was no extra round and no draw record.
    let tournament: Tournament | null = null
    if (parsed.tournament) {
      const roundSeconds = parsed.tournament.roundSeconds ?? DEFAULT_ROUND_SECONDS
      tournament = {
        pauseSeconds: DEFAULT_PAUSE_SECONDS,
        extraRoundSeconds: roundSeconds,
        draws: {},
        ...parsed.tournament,
        roundSeconds,
      } as Tournament
    }
    return {
      draft: { ...initialState.draft, ...parsed.draft },
      tournament,
    }
  } catch {
    return initialState
  }
}

const load = () => parseState(localStorage.getItem(STORAGE_KEY))

export function useAppState() {
  const [state, setState] = useState<AppState>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const updateDraft = useCallback((patch: Partial<Draft>) => {
    setState((s) => ({ ...s, draft: { ...s.draft, ...patch } }))
  }, [])

  const addFighter = useCallback((firstName: string, lastName: string) => {
    setState((s) => ({
      ...s,
      draft: {
        ...s.draft,
        fighters: [...s.draft.fighters, { id: makeId(), firstName: firstName.trim(), lastName: lastName.trim() }],
      },
    }))
  }, [])

  const removeFighter = useCallback((id: string) => {
    setState((s) => ({ ...s, draft: { ...s.draft, fighters: s.draft.fighters.filter((f) => f.id !== id) } }))
  }, [])

  const start = useCallback(() => {
    setState((s) => ({
      ...s,
      tournament: createTournament({
        name: s.draft.name,
        roundsPerMatch: s.draft.roundsPerMatch,
        roundSeconds: s.draft.roundSeconds,
        pauseSeconds: s.draft.pauseSeconds,
        extraRoundSeconds: s.draft.extraRoundSeconds,
        ringCount: s.draft.ringCount,
        thirdPlaceMatch: s.draft.thirdPlaceMatch,
        fighters: s.draft.fighters,
      }),
    }))
  }, [])

  const setWinner = useCallback((matchId: string, corner: Corner) => {
    setState((s) => (s.tournament ? { ...s, tournament: recordWinner(s.tournament, matchId, corner) } : s))
  }, [])

  const undo = useCallback((matchId: string) => {
    setState((s) => (s.tournament ? { ...s, tournament: undoResult(s.tournament, matchId) } : s))
  }, [])

  const draw = useCallback((matchId: string) => {
    setState((s) => (s.tournament ? { ...s, tournament: declareDraw(s.tournament, matchId) } : s))
  }, [])

  const cancelDraw = useCallback((matchId: string) => {
    setState((s) => (s.tournament ? { ...s, tournament: undoDraw(s.tournament, matchId) } : s))
  }, [])

  /** Discards the current tournament and goes back to setup, keeping the participant list. */
  const reset = useCallback(() => {
    setState((s) => ({ ...s, tournament: null }))
  }, [])

  return { state, updateDraft, addFighter, removeFighter, start, setWinner, undo, draw, cancelDraw, reset }
}
