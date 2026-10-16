import { useState } from 'react'
import { AppVersion } from './components/AppVersion'
import { BracketView } from './components/BracketView'
import { ConfirmDialog } from './components/ConfirmDialog'
import { RingView } from './components/RingView'
import { SetupView } from './components/SetupView'
import { useAppState } from './tournament/store'
import { useWakeLock } from './useWakeLock'

type Tab = 'ring' | 'bracket'

export default function App() {
  const { state, updateDraft, addFighter, removeFighter, start, setWinner, undo, draw, cancelDraw, reset } =
    useAppState()
  const [tab, setTab] = useState<Tab>('ring')
  const [confirmReset, setConfirmReset] = useState(false)
  const t = state.tournament
  useWakeLock(t !== null)

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>
            <span aria-hidden="true">🥊</span> {t?.name || state.draft.name || 'Torneo Muay Thai'}
          </h1>
          <AppVersion />
        </div>
        {t && (
          <>
            <nav className="tabs" aria-label="Viste">
              <button type="button" className={tab === 'ring' ? 'active' : ''} onClick={() => setTab('ring')}>
                Ring
              </button>
              <button type="button" className={tab === 'bracket' ? 'active' : ''} onClick={() => setTab('bracket')}>
                Tabellone
              </button>
            </nav>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setConfirmReset(true)}>
              Nuovo torneo
            </button>
          </>
        )}
      </header>

      {!t && (
        <SetupView
          draft={state.draft}
          onChange={updateDraft}
          onAdd={addFighter}
          onRemove={removeFighter}
          onStart={() => {
            start()
            setTab('ring')
          }}
        />
      )}
      {t && tab === 'ring' && (
        <RingView tournament={t} onWinner={setWinner} onUndo={undo} onDraw={draw} onCancelDraw={cancelDraw} />
      )}
      {t && tab === 'bracket' && <BracketView tournament={t} onUndo={undo} />}

      {confirmReset && (
        <ConfirmDialog
          title="Iniziare un nuovo torneo?"
          confirmLabel="Elimina torneo"
          tone="danger"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            reset()
            setConfirmReset(false)
          }}
        >
          <p>
            Il tabellone e tutti i risultati del torneo attuale verranno eliminati. L'elenco dei partecipanti resta
            disponibile.
          </p>
        </ConfirmDialog>
      )}
    </div>
  )
}
