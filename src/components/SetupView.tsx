import { useRef, useState, type FormEvent } from 'react'
import type { Draft } from '../tournament/store'
import { bracketSize, fighterName, MAX_RINGS, MIN_RINGS } from '../tournament/engine'
import { ConfirmDialog } from './ConfirmDialog'
import { Stepper } from './Stepper'

interface Props {
  draft: Draft
  onChange: (patch: Partial<Draft>) => void
  onAdd: (firstName: string, lastName: string) => void
  onRemove: (id: string) => void
  onStart: () => void
}

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
            hint="da 2' con 1' di pausa"
            onChange={(roundsPerMatch) => onChange({ roundsPerMatch })}
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
            {count >= 3 && ' · con finale 3° posto'}
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
