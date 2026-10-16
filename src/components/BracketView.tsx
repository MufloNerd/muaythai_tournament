import { useMemo, useState } from 'react'
import { canUndo, drawStage, resolve } from '../tournament/engine'
import type { ResolvedMatch, Tournament } from '../tournament/types'
import { buildView } from '../tournament/view'
import { UndoDialog } from './UndoDialog'

interface Props {
  tournament: Tournament
  onUndo: (matchId: string) => void
}

export function BracketView({ tournament: t, onUndo }: Props) {
  const resolved = useMemo(() => resolve(t), [t])
  const view = useMemo(() => buildView(t, resolved), [t, resolved])
  const [pendingUndo, setPendingUndo] = useState<ResolvedMatch | null>(null)

  const rounds = Array.from({ length: view.totalRounds }, (_, r) =>
    resolved.filter((m) => m.def.kind === 'main' && m.def.round === r),
  )
  const third = resolved.find((m) => m.def.kind === 'third')

  const card = (m: ResolvedMatch) => {
    if (m.status === 'void') return <div key={m.def.id} className="bracket-match is-void" />
    const undoable = m.status === 'done' && canUndo(t, m.def.id)
    const side = (corner: 'red' | 'blue') => {
      const slot = corner === 'red' ? m.red : m.blue
      const src = corner === 'red' ? m.def.red : m.def.blue
      const isWinner = slot.state === 'filled' && m.winnerId === slot.fighterId
      const isLoser = slot.state === 'filled' && m.loserId === slot.fighterId
      return (
        <div className={`slot slot-${corner} ${isWinner ? 'is-winner' : ''} ${isLoser ? 'is-loser' : ''}`}>
          <span>{view.slotLabel(src, slot)}</span>
          {isWinner && <span aria-label="vincitore">✓</span>}
        </div>
      )
    }
    return (
      <button
        type="button"
        key={m.def.id}
        className={`bracket-match status-${m.status} ${m.ring !== null ? 'on-ring' : ''}`}
        disabled={!undoable}
        onClick={() => setPendingUndo(m)}
        title={undoable ? 'Tocca per annullare il risultato' : undefined}
      >
        <div className="bracket-match-head">
          <span>{m.number ? `Inc. ${m.number}` : 'Bye'}</span>
          {m.ring !== null && <span className="badge">Ring {m.ring + 1}</span>}
          {m.status === 'bye' && <span className="muted">passa il turno</span>}
          {m.status === 'ready' && drawStage(t, m.def.id) === 1 && <span className="badge-draw">suppl.</span>}
          {m.status === 'ready' && drawStage(t, m.def.id) === 2 && <span className="badge-draw">giudici</span>}
          {m.status === 'done' && t.results[m.def.id].decision === 'extra-round' && (
            <span className="badge-draw" title="Deciso dopo la ripresa supplementare">suppl.</span>
          )}
          {m.status === 'done' && t.results[m.def.id].decision === 'judges' && (
            <span className="badge-draw" title="Decisione dei giudici">giudici</span>
          )}
          {undoable && <span className="muted">↶</span>}
        </div>
        {side('red')}
        {side('blue')}
      </button>
    )
  }

  return (
    <main className="bracket-view">
      <p className="muted bracket-help">
        Scorri orizzontalmente per vedere tutto il tabellone. Tocca un incontro concluso per annullarne il risultato.
      </p>
      <div className="bracket">
        {rounds.map((matches, r) => (
          <div key={r} className="bracket-round">
            <h3>{view.title(matches[0])}</h3>
            <div className="bracket-round-matches">{matches.map(card)}</div>
          </div>
        ))}
        {third && (
          <div className="bracket-round">
            <h3>{view.title(third)}</h3>
            <div className="bracket-round-matches">{card(third)}</div>
          </div>
        )}
      </div>

      {pendingUndo && (
        <UndoDialog
          match={pendingUndo}
          view={view}
          drawStage={drawStage(t, pendingUndo.def.id)}
          onCancel={() => setPendingUndo(null)}
          onConfirm={() => {
            onUndo(pendingUndo.def.id)
            setPendingUndo(null)
          }}
        />
      )}
    </main>
  )
}
