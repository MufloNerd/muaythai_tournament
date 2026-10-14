import { useEffect, useMemo, useState } from 'react'
import { PLACE_INFO, certificateEntries, type CertificateEntry } from '../certificates/content'
import { canShareFiles, downloadFile, renderCertificate, shareFiles, type RenderedCertificate } from '../certificates/render'
import type { Tournament } from '../tournament/types'

interface Props {
  tournament: Tournament
}

const entryKey = (e: CertificateEntry) => `${e.kind === 'winner' ? e.place : 'p'}:${e.fighterId}`

export function CertificatesPanel({ tournament }: Props) {
  const entries = useMemo(() => certificateEntries(tournament), [tournament])
  const key = entries.map((e) => `${entryKey(e)}:${e.date.getTime()}`).join('|') + tournament.name
  const [generated, setGenerated] = useState<{ key: string; certs: RenderedCertificate[] } | null>(null)
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)
  const certs = generated?.key === key ? generated.certs : []
  const error = (failure?.key === key ? failure.message : null) ?? shareError

  useEffect(() => {
    let cancelled = false
    const created: RenderedCertificate[] = []
    ;(async () => {
      try {
        // Podium first; each certificate appears as soon as it is ready.
        for (const entry of entries) {
          if (cancelled) return
          created.push(await renderCertificate(entry))
          if (!cancelled) setGenerated({ key, certs: [...created] })
          await new Promise((r) => setTimeout(r, 0))
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Errore nella generazione dei certificati'
        if (!cancelled) setFailure({ key, message })
      }
    })()
    return () => {
      cancelled = true
      created.forEach((c) => URL.revokeObjectURL(c.previewUrl))
    }
    // `key` changes exactly when `entries` does.
  }, [key]) // oxlint-disable-line react/exhaustive-deps

  if (entries.length === 0) return null

  const share = async (files: File[], title: string) => {
    setShareError(null)
    try {
      await shareFiles(files, title)
    } catch {
      setShareError('Condivisione non riuscita: usa "Scarica" e invia il file dall’app di messaggi.')
    }
  }

  const winners = certs.filter((c) => c.entry.kind === 'winner')
  const participants = certs.filter((c) => c.entry.kind === 'participant')
  const totalWinners = entries.filter((e) => e.kind === 'winner').length
  const totalParticipants = entries.length - totalWinners
  const pending = entries.length - certs.length

  const group = (title: string, items: RenderedCertificate[], total: number, shareTitle: string) => {
    if (total === 0) return null
    const files = items.map((c) => c.file)
    const complete = items.length === total
    return (
      <div className="certificate-group">
        <div className="certificate-group-head">
          <h3>
            {title} <span className="muted">({total})</span>
          </h3>
          {complete && files.length > 1 && canShareFiles(files) && (
            <button type="button" className="btn btn-neutral" onClick={() => void share(files, shareTitle)}>
              Condividi tutti
            </button>
          )}
        </div>
        <ul className="certificate-list">
          {items.map((c) => (
            <li key={entryKey(c.entry)}>
              <img src={c.previewUrl} alt={`Attestato di ${c.entry.fighterName}`} loading="lazy" />
              <div className="certificate-info">
                <strong>{c.entry.fighterName}</strong>
                <span className="muted">
                  {c.entry.kind === 'winner' ? PLACE_INFO[c.entry.place].line : 'Attestato di partecipazione'}
                </span>
              </div>
              <div className="certificate-actions">
                {canShareFiles([c.file]) && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => void share([c.file], c.file.name.replace(/\.pdf$/, ''))}
                  >
                    Condividi
                  </button>
                )}
                <button type="button" className="btn btn-ghost" onClick={() => downloadFile(c.file)}>
                  Scarica
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <section className="panel certificates">
      <div className="certificates-head">
        <h2>📜 Certificati e attestati</h2>
        <p className="muted">PDF in stile Sak Yant da inviare su WhatsApp, Telegram o email.</p>
      </div>

      {error && <p className="error">{error}</p>}
      {pending > 0 && !error && (
        <p className="muted">
          Preparazione in corso… {certs.length}/{entries.length}
        </p>
      )}

      {group('🏆 Vincitori', winners, totalWinners, `Certificati di vittoria – ${tournament.name}`)}
      {group('🥋 Partecipanti', participants, totalParticipants, `Attestati di partecipazione – ${tournament.name}`)}
    </section>
  )
}
