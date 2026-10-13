import { ConfirmDialog } from './ConfirmDialog'
import type { ResolvedMatch } from '../tournament/types'
import type { buildView } from '../tournament/view'

interface Props {
  match: ResolvedMatch
  view: ReturnType<typeof buildView>
  onCancel: () => void
  onConfirm: () => void
}

export function UndoDialog({ match, view, onCancel, onConfirm }: Props) {
  return (
    <ConfirmDialog
      title="Annullare il risultato?"
      confirmLabel="Annulla risultato"
      tone="danger"
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p>
        {view.title(match)} · Incontro {match.number}: {view.name(match.winnerId)} batte {view.name(match.loserId)}.
        <br />
        L'incontro tornerà da disputare.
      </p>
    </ConfirmDialog>
  )
}
