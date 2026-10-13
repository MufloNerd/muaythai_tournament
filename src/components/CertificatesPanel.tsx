import { useEffect, useMemo, useState } from 'react'
import { PLACE_INFO, certificateEntries } from '../certificates/content'
import { canShareFiles, downloadFile, renderCertificate, shareFiles, type RenderedCertificate } from '../certificates/render'
import type { Tournament } from '../tournament/types'

interface Props {
  tournament: Tournament
}

export function CertificatesPanel({ tournament }: Props) {
  const entries = useMemo(() => certificateEntries(tournament), [tournament])
  const key = entries.map((e) => `${e.place}:${e.fighterId}:${e.date.getTime()}`).join('|') + tournament.name
  const [generated, setGenerated] = useState<{ key: string; certs: RenderedCertificate[] } | null>(null)
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)
  const certs = generated?.key === key ? generated.certs : null
  const error = (failure?.key === key ? failure.message : null) ?? shareError

  useEffect(() => {
    let cancelled = false
    const created: RenderedCertificate[] = []
    ;(async () => {
      try {
        for (const entry of entries) {
          if (cancelled) return
          created.push(await renderCertificate(entry))
        }
        if (!cancelled) setGenerated({ key, certs: [...created] })
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

  const allFiles = certs?.map((c) => c.file) ?? []
  const canShareAll = allFiles.length > 1 && canShareFiles(allFiles)

  const share = async (files: File[], title: string) => {
    setShareError(null)
    try {
      await shareFiles(files, title)
    } catch {
      setShareError('Condivisione non riuscita: usa "Scarica" e invia il file dall’app di messaggi.')
    }
  }

  return (
    <section className="panel certificates">
      <div className="certificates-head">
        <div>
          <h2>📜 Certificati di vittoria</h2>
          <p className="muted">PDF in stile cintura da inviare su WhatsApp, Telegram o email.</p>
        </div>
        {canShareAll && (
          <button
            type="button"
            className="btn btn-neutral"
            onClick={() => void share(allFiles, `Certificati – ${tournament.name}`)}
          >
            Condividi tutti
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {!certs && !error && <p className="muted">Preparazione dei certificati…</p>}

      {certs && (
        <ul className="certificate-list">
          {certs.map((c) => (
            <li key={`${c.entry.place}-${c.entry.fighterId}`}>
              <img src={c.previewUrl} alt={`Certificato di ${c.entry.fighterName}`} loading="lazy" />
              <div className="certificate-info">
                <strong>{c.entry.fighterName}</strong>
                <span className="muted">{PLACE_INFO[c.entry.place].line}</span>
              </div>
              <div className="certificate-actions">
                {canShareFiles([c.file]) && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => void share([c.file], `Certificato – ${c.entry.fighterName}`)}
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
      )}
    </section>
  )
}
