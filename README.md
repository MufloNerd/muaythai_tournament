# 🥊 Torneo Muay Thai

PWA offline-first per gestire un torneo di Muay Thai a eliminazione diretta (con finale 3° posto) su **2 ring
in contemporanea**, da un solo tablet. Si inseriscono i partecipanti, si sorteggia il tabellone e si tocca il
vincitore di ogni incontro.

📄 Decisioni, requisiti funzionali/non funzionali e architettura: [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)

## Comandi

```bash
npm install
npm run dev        # sviluppo (npm run dev -- --host per provarlo in LAN)
npm test           # test unitari della logica del torneo
npm run lint
npm run build      # build di produzione in dist/
npm run preview    # serve la build con service worker
```

## Pubblicazione e installazione

1. Push su un repository GitHub, branch `main`.
2. Settings → Pages → Source: **GitHub Actions** (il workflow è in `.github/workflows/deploy.yml`).
3. Apri https://muflonerd.github.io/muaythai_tournament/ sul tablet e scegli **Aggiungi a schermata Home**.
   Da quel momento funziona anche senza connessione.
