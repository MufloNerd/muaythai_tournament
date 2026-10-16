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

/** How a bout was decided: in regulation, after the extra round, or by the judges after two draws. */
export type Decision = 'regular' | 'extra-round' | 'judges'

export interface MatchResult {
  winner: Corner
  ring: number | null
  at: number
  /** Missing in results saved before draws were handled (= 'regular'). */
  decision?: Decision
}

export interface Tournament {
  name: string
  roundsPerMatch: number
  /** Length of one round, in seconds. */
  roundSeconds: number
  /** Rest between rounds, in seconds. */
  pauseSeconds: number
  /** Length of the extra round played after a draw, in seconds. */
  extraRoundSeconds: number
  fighters: Fighter[]
  matches: MatchDef[]
  results: Record<string, MatchResult>
  /** Draws declared on undecided bouts: 1 = extra round in progress, 2 = judges must pick a winner. */
  draws: Record<string, number>
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
