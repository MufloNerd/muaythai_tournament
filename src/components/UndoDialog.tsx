import { ConfirmDialog } from './ConfirmDialog'
import type { ResolvedMatch } from '../tournament/types'
import type { buildView } from '../tournament/view'

interface Props {
  match: ResolvedMatch
  view: ReturnType<typeof buildView>
  /** Draws declared before the result: the bout goes back to that stage. */
  drawStage?: number
  onCancel: () => void
  onConfirm: () => void
}

export function UndoDialog({ match, view, drawStage = 0, onCancel, onConfirm }: Props) {
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
        {drawStage === 0 && "L'incontro tornerà da disputare."}
        {drawStage === 1 && "L'incontro tornerà alla ripresa supplementare."}
        {drawStage === 2 && "L'incontro tornerà alla decisione dei giudici."}
      </p>
    </ConfirmDialog>
  )
}
