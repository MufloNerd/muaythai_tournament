import { useCallback, useEffect, useState } from 'react'
import { createTournament, makeId, RING_COUNT, recordWinner, undoResult } from './engine'
import type { Corner, Fighter, Tournament } from './types'

const STORAGE_KEY = 'muaythai-tournament:v1'

export interface Draft {
  name: string
  roundsPerMatch: number
  ringCount: number
  fighters: Fighter[]
}

export interface AppState {
  draft: Draft
  tournament: Tournament | null
}

const initialState: AppState = {
  draft: { name: '', roundsPerMatch: 3, ringCount: RING_COUNT, fighters: [] },
  tournament: null,
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      draft: { ...initialState.draft, ...parsed.draft },
      tournament: parsed.tournament ?? null,
    }
  } catch {
    return initialState
  }
}

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
        ringCount: s.draft.ringCount,
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

  /** Discards the current tournament and goes back to setup, keeping the participant list. */
  const reset = useCallback(() => {
    setState((s) => ({ ...s, tournament: null }))
  }, [])

  return { state, updateDraft, addFighter, removeFighter, start, setWinner, undo, reset }
}
