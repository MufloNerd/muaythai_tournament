export type Corner = 'red' | 'blue'

export interface Fighter {
  id: string
  firstName: string
  lastName: string
}

export type SlotSource =
  | { type: 'fighter'; fighterId: string }
  | { type: 'none' }
  | { type: 'winner'; matchId: string }
  | { type: 'loser'; matchId: string }

export interface MatchDef {
  id: string
  /** 0-based main bracket round; the third-place match uses the final's round. */
  round: number
  index: number
  kind: 'main' | 'third'
  red: SlotSource
  blue: SlotSource
}

export interface MatchResult {
  winner: Corner
  ring: number | null
  at: number
}

export interface Tournament {
  name: string
  roundsPerMatch: number
  fighters: Fighter[]
  matches: MatchDef[]
  results: Record<string, MatchResult>
  /** Match id currently assigned to each ring (index 0 = Ring 1). */
  rings: (string | null)[]
  startedAt: number
}

export type SlotState =
  | { state: 'filled'; fighterId: string }
  | { state: 'pending' }
  | { state: 'empty' }

export type MatchStatus = 'pending' | 'ready' | 'done' | 'bye' | 'void'

export interface ResolvedMatch {
  def: MatchDef
  red: SlotState
  blue: SlotState
  status: MatchStatus
  winnerId: string | null
  loserId: string | null
  /** Progressive number among real (non-bye) bouts, in order of play. */
  number: number | null
  ring: number | null
}
