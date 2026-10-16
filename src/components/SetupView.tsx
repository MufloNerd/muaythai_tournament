import { useRef, useState, type FormEvent } from 'react'
import type { Draft } from '../tournament/store'
import {
  bracketSize,
  DURATION_STEP_SECONDS,
  fighterName,
  formatDuration,
  matchSeconds,
  MAX_RINGS,
  MIN_RINGS,
  PAUSE_SECONDS_RANGE,
  ROUND_SECONDS_RANGE,
} from '../tournament/engine'
import { ConfirmDialog } from './ConfirmDialog'
import { Stepper } from './Stepper'

interface Props {
  draft: Draft
  onChange: (patch: Partial<Draft>) => void
  onAdd: (firstName: string, lastName: string) => void
  onRemove: (id: string) => void
  onStart: () => void
}

const THIRD_PLACE_OPTIONS = [
  { value: true, label: 'Finale 3° posto' },
  { value: false, label: 'Due bronzi (IFMA)' },
]

export function SetupView({ draft, onChange, onAdd, onRemove, onStart }: Props) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [confirming, setConfirming] = useState(false)
  const firstNameRef = useRef<HTMLInputElement>(null)

  const count = draft.fighters.length
  const byes = count >= 2 ? bracketSize(count) - count : 0
  const canAdd = firstName.trim() !== '' || lastName.trim() !== ''

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canAdd) return
    onAdd(firstName, lastName)
    setFirstName('')
    setLastName('')
    firstNameRef.current?.focus()
  }

  return (
    <main className="setup">
      <section className="panel">
        <h2>Impostazioni torneo</h2>
        <label className="field">
          <span>Nome del torneo</span>
          <input
            value={draft.name}
            placeholder="Torneo Muay Thai"
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </label>
        <div className="field">
          <span>Riprese per incontro</span>
          <Stepper
            label="riprese per incontro"
            value={draft.roundsPerMatch}
            min={1}
            max={12}
            hint={`incontro di circa ${formatDuration(matchSeconds(draft))}`}
            onChange={(roundsPerMatch) => onChange({ roundsPerMatch })}
          />
        </div>
        <div className="field">
          <span>Durata ripresa</span>
          <Stepper
            label="durata ripresa"
            value={draft.roundSeconds}
            min={ROUND_SECONDS_RANGE[0]}
            max={ROUND_SECONDS_RANGE[1]}
            step={DURATION_STEP_SECONDS}
            format={formatDuration}
            hint="minuti e secondi"
            onChange={(roundSeconds) => onChange({ roundSeconds })}
          />
        </div>
        <div className="field">
          <span>Pausa tra le riprese</span>
          <Stepper
            label="pausa tra le riprese"
            value={draft.pauseSeconds}
            min={PAUSE_SECONDS_RANGE[0]}
            max={PAUSE_SECONDS_RANGE[1]}
            step={DURATION_STEP_SECONDS}
            format={formatDuration}
            hint={draft.roundsPerMatch === 1 ? 'non usata con una sola ripresa' : 'minuti e secondi'}
            onChange={(pauseSeconds) => onChange({ pauseSeconds })}
          />
        </div>
        <div className="field">
          <span>Ripresa supplementare</span>
          <Stepper
            label="ripresa supplementare"
            value={draft.extraRoundSeconds}
            min={ROUND_SECONDS_RANGE[0]}
            max={ROUND_SECONDS_RANGE[1]}
            step={DURATION_STEP_SECONDS}
            format={formatDuration}
            hint="in caso di pareggio; se ancora pari decidono i giudici"
            onChange={(extraRoundSeconds) => onChange({ extraRoundSeconds })}
          />
        </div>
        <div className="field">
          <span>Numero di ring</span>
          <Stepper
            label="numero di ring"
            value={draft.ringCount}
            min={MIN_RINGS}
            max={MAX_RINGS}
            hint={draft.ringCount === 1 ? 'un incontro alla volta' : `${draft.ringCount} incontri in contemporanea`}
            onChange={(ringCount) => onChange({ ringCount })}
          />
        </div>
        <div className="field">
          <span>Terzo posto</span>
          <div className="segmented" role="radiogroup" aria-label="Terzo posto">
            {THIRD_PLACE_OPTIONS.map((o) => (
              <button
                key={o.label}
                type="button"
                role="radio"
                aria-checked={draft.thirdPlaceMatch === o.value}
                className={draft.thirdPlaceMatch === o.value ? 'active' : ''}
                onClick={() => onChange({ thirdPlaceMatch: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>
          <small className="muted">
            {draft.thirdPlaceMatch
              ? 'I perdenti delle semifinali si sfidano per il 3° posto.'
              : 'Come ai mondiali IFMA: i due perdenti delle semifinali sono entrambi 3° classificati, senza incontro.'}
          </small>
        </div>
      </section>

      <section className="panel">
        <h2>Partecipanti ({count})</h2>
        <form className="add-fighter" onSubmit={submit}>
          <input
            ref={firstNameRef}
            value={firstName}
            placeholder="Nome"
            autoComplete="off"
            autoCapitalize="words"
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            value={lastName}
            placeholder="Cognome"
            autoComplete="off"
            autoCapitalize="words"
            onChange={(e) => setLastName(e.target.value)}
          />
          <button type="submit" className="btn btn-neutral" disabled={!canAdd}>
            Aggiungi
          </button>
        </form>

        {count === 0 ? (
          <p className="muted">Nessun partecipante. Inserisci nome e cognome e premi Aggiungi.</p>
        ) : (
          <ol className="fighter-list">
            {draft.fighters.map((f) => (
              <li key={f.id}>
                <span>{fighterName(f)}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  aria-label={`Rimuovi ${fighterName(f)}`}
                  onClick={() => onRemove(f.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="setup-footer">
        {count >= 2 && (
          <p className="muted">
            Tabellone da {bracketSize(count)}
            {byes > 0 &&
              ` · ${byes} ${byes === 1 ? 'passaggio del turno (bye) sorteggiato' : 'passaggi del turno (bye) sorteggiati'}`}
            {count >= 3 && (draft.thirdPlaceMatch ? ' · con finale 3° posto' : ' · due bronzi')}
            {` · ${draft.ringCount} ring`}
          </p>
        )}
        <button
          type="button"
          className="btn btn-primary btn-large"
          disabled={count < 2}
          onClick={() => setConfirming(true)}
        >
          Sorteggia e inizia il torneo
        </button>
      </div>

      {confirming && (
        <ConfirmDialog
          title="Avviare il torneo?"
          confirmLabel="Sorteggia"
          tone="danger"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false)
            onStart()
          }}
        >
          <p>
            Verrà effettuato il sorteggio casuale di {count} partecipanti su {draft.ringCount} ring. Dopo l'avvio non
            sarà possibile modificare l'elenco né il numero di ring.
          </p>
        </ConfirmDialog>
      )}
    </main>
  )
}
