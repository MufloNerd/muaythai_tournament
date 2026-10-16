import { useMemo, useState, type CSSProperties } from 'react'
import {
  canUndo,
  decisionLabel,
  drawStage,
  formatDuration,
  MAX_DRAWS,
  podium,
  resolve,
  roundsSummary,
} from '../tournament/engine'
import type { Corner, ResolvedMatch, Tournament } from '../tournament/types'
import { buildView } from '../tournament/view'
import { CertificatesPanel } from './CertificatesPanel'
import { ConfirmDialog } from './ConfirmDialog'
import { UndoDialog } from './UndoDialog'

interface Props {
  tournament: Tournament
  onWinner: (matchId: string, corner: Corner) => void
  onUndo: (matchId: string) => void
  onDraw: (matchId: string) => void
  onCancelDraw: (matchId: string) => void
}

const CORNER_LABEL: Record<Corner, string> = { red: 'angolo rosso', blue: 'angolo blu' }

/** 1–3 rings side by side; 4 rings as a 2×2 grid. */
const ringColumns = (count: number) => (count === 4 ? 2 : count)

export function RingView({ tournament: t, onWinner, onUndo, onDraw, onCancelDraw }: Props) {
  const resolved = useMemo(() => resolve(t), [t])
  const view = useMemo(() => buildView(t, resolved), [t, resolved])
  const result = useMemo(() => podium(t), [t])
  const [pendingWin, setPendingWin] = useState<{ match: ResolvedMatch; corner: Corner } | null>(null)
  const [pendingUndo, setPendingUndo] = useState<ResolvedMatch | null>(null)
  const [pendingDraw, setPendingDraw] = useState<ResolvedMatch | null>(null)
  const extra = formatDuration(t.extraRoundSeconds)

  const upcoming = resolved.filter(
    (m) => m.ring === null && (m.status === 'ready' || (m.status === 'pending' && m.number !== null)),
  )
  const recent = resolved
    .filter((m) => m.status === 'done')
    .sort((a, b) => t.results[b.def.id].at - t.results[a.def.id].at)
    .slice(0, 6)

  const cornerName = (m: ResolvedMatch, corner: Corner) => {
    const slot = corner === 'red' ? m.red : m.blue
    return slot.state === 'filled' ? view.name(slot.fighterId) : ''
  }

  return (
    <main className="ring-view">
      {result.finished && (
        <section className="podium panel">
          <h2>🏆 Torneo concluso</h2>
          <ol>
            <li className="gold">
              <span className="medal">1°</span> {view.name(result.first)}
            </li>
            <li className="silver">
              <span className="medal">2°</span> {view.name(result.second)}
            </li>
            {result.third.map((id) => (
              <li key={id} className="bronze">
                <span className="medal">3°</span> {view.name(id)}
              </li>
            ))}
          </ol>
        </section>
      )}

      {result.finished && <CertificatesPanel tournament={t} />}

      {!result.finished && (
        <div className="rings" style={{ '--ring-cols': ringColumns(t.rings.length) } as CSSProperties}>
          {t.rings.map((matchId, ringIndex) => {
            const match = matchId ? view.byId.get(matchId) : undefined
            return (
              <section key={ringIndex} className="ring-card">
                <header>
                  <span className="ring-name">Ring {ringIndex + 1}</span>
                  {match && (
                    <span className="ring-meta">
                      {view.title(match)} · Incontro {match.number}
                    </span>
                  )}
                </header>
                {match ? (
                  <>
                    {drawStage(t, match.def.id) > 0 && (
                      <div className={`draw-banner stage-${drawStage(t, match.def.id)}`}>
                        <span>
                          {drawStage(t, match.def.id) === 1
                            ? `⚖️ Pareggio · ripresa supplementare da ${extra}`
                            : '⚖️ Ancora pari · decidono i giudici'}
                        </span>
                        <button type="button" className="btn btn-ghost btn-small" onClick={() => onCancelDraw(match.def.id)}>
                          ↶ Annulla pareggio
                        </button>
                      </div>
                    )}
                    <div className="bout">
                      {(['red', 'blue'] as const).map((corner, i) => (
                        <div key={corner} className="bout-side">
                          {i === 1 && <div className="vs">VS</div>}
                          <button
                            type="button"
                            className={`fighter-btn fighter-${corner}`}
                            onClick={() => setPendingWin({ match, corner })}
                          >
                            <small>{CORNER_LABEL[corner]}</small>
                            <strong>{cornerName(match, corner)}</strong>
                          </button>
                        </div>
                      ))}
                    </div>
                    {drawStage(t, match.def.id) < MAX_DRAWS && (
                      <button type="button" className="btn btn-ghost draw-btn" onClick={() => setPendingDraw(match)}>
                        {drawStage(t, match.def.id) === 0 ? 'Pareggio' : 'Ancora pari'}
                      </button>
                    )}
                    <p className="hint">
                      {drawStage(t, match.def.id) === 0
                        ? `${roundsSummary(t)} — tocca il vincitore`
                        : drawStage(t, match.def.id) === 1
                          ? `Ripresa supplementare da ${extra} — tocca il vincitore`
                          : 'Decisione obbligatoria dei giudici — tocca il vincitore'}
                    </p>
                  </>
                ) : (
                  <p className="ring-idle">In attesa che si concludano gli incontri in corso…</p>
                )}
              </section>
            )
          })}
        </div>
      )}

      <div className="lists">
        {upcoming.length > 0 && (
          <section className="panel">
            <h2>Prossimi incontri</h2>
            <ul className="match-list">
              {upcoming.map((m) => (
                <li key={m.def.id} className={m.status === 'ready' ? 'is-ready' : ''}>
                  <span className="num">{m.number}</span>
                  <span className="round">{view.title(m)}</span>
                  <span className="red-text">{view.slotLabel(m.def.red, m.red)}</span>
                  <span className="vs-small">vs</span>
                  <span className="blue-text">{view.slotLabel(m.def.blue, m.blue)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {recent.length > 0 && (
          <section className="panel">
            <h2>Ultimi risultati</h2>
            <ul className="match-list">
              {recent.map((m) => (
                <li key={m.def.id}>
                  <span className="num">{m.number}</span>
                  <span className="round">{view.title(m)}</span>
                  <span className="winner">🏅 {view.name(m.winnerId)}</span>
                  <span className="muted">
                    batte {view.name(m.loserId)}
                    {decisionLabel(t.results[m.def.id].decision) && ` · ${decisionLabel(t.results[m.def.id].decision)}`}
                  </span>
                  {canUndo(t, m.def.id) && (
                    <button type="button" className="btn btn-ghost btn-small" onClick={() => setPendingUndo(m)}>
                      ↶ Annulla
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {pendingWin && (
        <ConfirmDialog
          title={`Vince ${cornerName(pendingWin.match, pendingWin.corner)}?`}
          confirmLabel="Conferma vincitore"
          tone={pendingWin.corner}
          onCancel={() => setPendingWin(null)}
          onConfirm={() => {
            onWinner(pendingWin.match.def.id, pendingWin.corner)
            setPendingWin(null)
          }}
        >
          <p>
            {view.title(pendingWin.match)} · Incontro {pendingWin.match.number} · Ring{' '}
            {(pendingWin.match.ring ?? 0) + 1}
            <br />
            Vincitore all'<strong>{CORNER_LABEL[pendingWin.corner]}</strong> contro{' '}
            {cornerName(pendingWin.match, pendingWin.corner === 'red' ? 'blue' : 'red')}
            {drawStage(t, pendingWin.match.def.id) === 1 && ' dopo la ripresa supplementare'}
            {drawStage(t, pendingWin.match.def.id) === 2 && ' per decisione dei giudici'}.
          </p>
        </ConfirmDialog>
      )}

      {pendingDraw && (
        <ConfirmDialog
          title={drawStage(t, pendingDraw.def.id) === 0 ? 'Pareggio?' : 'Ancora pari?'}
          confirmLabel={drawStage(t, pendingDraw.def.id) === 0 ? 'Ripresa supplementare' : 'Decidono i giudici'}
          onCancel={() => setPendingDraw(null)}
          onConfirm={() => {
            onDraw(pendingDraw.def.id)
            setPendingDraw(null)
          }}
        >
          <p>
            {cornerName(pendingDraw, 'red')} vs {cornerName(pendingDraw, 'blue')} · Incontro {pendingDraw.number}
            <br />
            {drawStage(t, pendingDraw.def.id) === 0
              ? `Si combatte una ripresa supplementare da ${extra} sullo stesso ring. Se è ancora pari, i giudici devono scegliere un vincitore.`
              : 'I giudici devono scegliere un vincitore: nel tabellone a eliminazione diretta qualcuno deve passare il turno.'}
          </p>
        </ConfirmDialog>
      )}

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
