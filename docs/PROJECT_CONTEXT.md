# Torneo Muay Thai — Contesto di progetto, decisioni e requisiti

Questo documento raccoglie **tutte le decisioni prese e i requisiti** del progetto, così da poter ricostruire
il contesto completo in una sessione futura (anche da parte di un assistente AI) senza rileggere la cronologia.

> Ultimo aggiornamento: 2026-10-13 — stato: **MVP implementato e verificato, numero di ring configurabile** (vedi [§ 8](#8-stato-attuale)).

---

## 1. Obiettivo

Applicazione per **generare e gestire un torneo di Muay Thai a eliminazione diretta** fino alla finale:

1. inserire i partecipanti;
2. generare il tabellone tramite sorteggio;
3. durante il torneo, selezionare in modo semplice il **vincitore dell'incontro in corso** su ciascuno dei
   **più ring che combattono contemporaneamente** (default 2, configurabile da 1 a 4).

Contesto d'uso: palestra, gestita da un operatore con un **tablet** (anche smartphone), connessione internet
non garantita.

---

## 2. Decisioni prese (log)

Le domande sono state poste all'utente una alla volta; qui la risposta scelta e la motivazione.

| # | Tema | Decisione | Motivazione / note |
|---|------|-----------|--------------------|
| D1 | Tipo di applicazione | **PWA (Progressive Web App) offline-first** | Installabile da browser su iPad/Android ("Aggiungi a schermata Home"), si apre a schermo intero, funziona senza internet, nessuno store, nessun server. Eventuale futuro wrapping nativo con Capacitor senza riscrittura. |
| D2 | Numero di dispositivi | **Un solo tablet gestisce tutti i ring** | Nessuna sincronizzazione né backend necessari. |
| D3 | Formato torneo | **Eliminazione diretta + finale per il 3° posto** | La finale 3° posto è tra i perdenti delle semifinali. |
| D4 | Accoppiamenti 1° turno | **Sorteggio casuale automatico, bye assegnati a caso** | Se i partecipanti non sono una potenza di 2, alcuni passano il turno (bye). |
| D5 | Durata incontri | **Numero di riprese configurabile** nelle impostazioni (riprese da 2' con 1' di pausa) | Default 3, intervallo 1–12. Dato solo informativo. |
| D6 | Timer | **Nessun timer integrato** | Il tempo è gestito con un cronometro esterno. |
| D7 | Dati partecipante | **Solo nome e cognome** | Niente palestra/peso/età/categorie. |
| D8 | Assegnazione ai ring | **Automatica**: il prossimo incontro pronto va al primo ring libero | Nessuno spostamento manuale tra ring. |
| D9 | Registrazione vincitore | **Tocco sul nome (angolo rosso/blu) + conferma** | Nessun metodo di vittoria (KO, punti, ecc.). |
| D10 | Correzione errori | **Annullare un risultato** solo se l'incontro successivo che ne dipende non è ancora stato deciso | Nessun ricalcolo a cascata. |
| D11 | Schermate | **Vista "Ring"** con i 2 incontri in corso in grande + **tabellone completo** consultabile | Al termine viene mostrato anche il podio (1°, 2°, 3°) nella vista Ring. |
| D12 | Persistenza | **Un torneo alla volta**, salvato sul dispositivo e ripreso automaticamente se l'app si chiude | Niente storico né export/import. |
| D13 | Tecnologia | **React + Vite + TypeScript come PWA, pubblicata gratis su GitHub Pages** | L'utente ha chiesto "la miglior soluzione gratis". |
| D14 | Workspace | `/Users/muflonerd/Projects/muaythai-tournament`, repo git, nessun worktree isolato | |
| D15 | Numero di ring | **Configurabile nel setup iniziale** (default 2, da 1 a 4), fissato all'avvio del torneo | Richiesto dopo il primo rilascio. Con 1–3 ring sono affiancati; con 4 ring in griglia 2×2; su schermi stretti uno sotto l'altro. |

### Decisioni implementative prese in autonomia (coerenti con le scelte sopra)

| # | Decisione | Motivazione |
|---|-----------|-------------|
| I1 | Storage in **`localStorage`** (chiave `muaythai-tournament:v1`) anziché IndexedDB | Dati piccoli, API sincrona, più semplice. La chiave è versionata per migrazioni future. |
| I2 | **Stato derivato**: si salvano solo struttura del tabellone + risultati + assegnazione ring; tutto il resto (chi avanza, bye, stati) è calcolato da `resolve()` | Annullare un risultato = rimuoverlo; nessun rischio di stati incoerenti. |
| I3 | I bye **non si affrontano mai tra loro** al 1° turno; il fighter in bye è messo a caso in angolo rosso o blu | Ogni incontro del 1° turno ha almeno un atleta. |
| I4 | Ordine di gioco: per turno, poi per posizione; **la finale 3° posto precede la finale** | Con 2 o più ring, finale 3° posto e finale si disputano in contemporanea. |
| I5 | Numerazione progressiva ("Incontro N") **solo per gli incontri reali**, escludendo i bye | Il numero è usato nei riferimenti "Vincente inc. N" / "Perdente inc. N". |
| I6 | Con 3 partecipanti il 3° posto è assegnato **automaticamente** (unico perdente di semifinale) | La semifinale con bye non produce un perdente. |
| I7 | Con 2 partecipanti: solo la finale, **nessuna finale 3° posto** | |
| I8 | Annullando un risultato, l'incontro **torna sul ring dove era** (se libero) e l'incontro successivo dipendente viene tolto dal ring | Comportamento atteso dall'operatore. |
| I9 | "Nuovo torneo" elimina tabellone e risultati ma **mantiene l'elenco partecipanti** | Utile per ripetere o correggere rapidamente. |
| I10 | **Screen Wake Lock** attivo durante il torneo (dove supportato) | Il tablet non va in standby tra un incontro e l'altro. |
| I11 | Interfaccia **in italiano**, tema scuro ad alto contrasto, angoli rosso/blu | Leggibilità in palestra. |
| I12 | Generatore ID senza `crypto.randomUUID` | Funziona anche in contesti non HTTPS (es. accesso via IP in LAN). |
| I13 | Icone PWA generate con `@vite-pwa/assets-generator` da `public/favicon.svg` | Strumento ufficiale dell'ecosistema. |
| I14 | Deploy con **GitHub Actions → GitHub Pages**, base path impostato con la variabile `BASE_PATH` | Il workflow imposta `/<nome-repo>/`. In locale la base è `/`. |
| I15 | **Partecipanti non potenza di 2 (es. dispari)**: tabellone alla potenza di 2 successiva (N→P); P−N bye sorteggiati tutti nel 1° turno, mai bye contro bye; dal 2° turno ogni incontro ha sempre 2 atleti | Esempi: 7→8 (1 bye), 5→8 (3 bye), 6→8 (2 bye), 9→16 (7 bye, 1 solo incontro reale al 1° turno), 12→16 (4 bye). |
| I16 | Se gli incontri pronti sono meno dei ring, i ring in eccesso restano **in attesa** | Es. semifinali con 4 ring: 2 ring occupati, 2 in attesa. |

---

## 3. Requisiti funzionali

### Configurazione torneo
- **RF-01** Inserire il nome del torneo (facoltativo; default "Torneo Muay Thai").
- **RF-02** Impostare il numero di riprese per incontro (default 3, min 1, max 12), mostrato come "N riprese da 2' · 1' di pausa".
- **RF-02b** Impostare il numero di ring (default 2, min 1, max 4); non modificabile dopo l'avvio.
- **RF-03** Aggiungere partecipanti indicando nome e cognome (Invio da tastiera per aggiungere velocemente).
- **RF-04** Rimuovere un partecipante prima dell'avvio.
- **RF-05** Vedere un'anteprima della dimensione del tabellone, del numero di bye, della presenza della finale 3° posto e del numero di ring.
- **RF-06** Avviare il torneo (minimo 2 partecipanti) con conferma; dopo l'avvio l'elenco non è modificabile.

### Sorteggio e tabellone
- **RF-07** Sorteggio casuale degli accoppiamenti del 1° turno.
- **RF-08** Tabellone dimensionato alla potenza di 2 successiva; i bye sono assegnati casualmente e chi ha il bye avanza automaticamente.
- **RF-09** Eliminazione diretta: il vincitore avanza al turno successivo.
- **RF-10** Finale 3° posto tra i perdenti delle semifinali (se esistono semifinali).
- **RF-11** Nomi dei turni: 1° turno / Sedicesimi / Ottavi / Quarti di finale / Semifinali / Finale / Finale 3° posto.

### Gestione ring e incontri
- **RF-12** N ring (1–4) gestiti contemporaneamente.
- **RF-13** Assegnazione automatica del prossimo incontro pronto (entrambi gli atleti noti) al primo ring libero, in ordine di gioco.
- **RF-14** Per ogni ring: turno, numero incontro, atleta all'angolo rosso e all'angolo blu, in grande.
- **RF-15** Selezione del vincitore con un tocco sul nome e dialog di conferma.
- **RF-16** Ring senza incontro: messaggio di attesa che si concludano gli incontri in corso.
- **RF-17** Elenco "Prossimi incontri" con riferimenti ancora da definire ("Vincente inc. N", "Perdente inc. N").
- **RF-18** Elenco "Ultimi risultati" (ultimi 6) con il pulsante "Annulla" dove consentito.

### Correzione
- **RF-19** Annullare un risultato solo se nessun incontro che dipende da esso (successivo o finale 3° posto) ha già un risultato; con conferma.
- **RF-20** L'annullamento è disponibile anche dal tabellone, toccando un incontro concluso.

### Tabellone e conclusione
- **RF-21** Tabellone completo per colonne/turni, scorrevole in orizzontale, con vincitori evidenziati, perdenti barrati, bye ("passa il turno") e badge del ring per gli incontri in corso.
- **RF-22** A torneo concluso: podio con 1°, 2° e 3° classificato.
- **RF-23** "Nuovo torneo" con conferma: elimina il torneo corrente e mantiene i partecipanti.

---

## 4. Requisiti non funzionali

- **RNF-01 Installabilità**: PWA con manifest (`standalone`, icone 64/192/512 + maskable, apple-touch-icon), installabile su iOS/iPadOS e Android.
- **RNF-02 Offline**: service worker (Workbox, `generateSW`, `autoUpdate`) che mette in cache tutti gli asset; dopo il primo caricamento funziona senza rete.
- **RNF-03 Persistenza**: lo stato è salvato in `localStorage` a ogni modifica e ripristinato all'apertura; sopravvive a chiusura e ricarica.
- **RNF-04 Nessun backend** e nessun costo di esercizio (hosting gratuito su GitHub Pages).
- **RNF-05 Usabilità touch**: aree di tocco ≥ 48px, pulsanti degli atleti ≥ 110px, ring affiancati (1–3 colonne, 2×2 con 4 ring) e in una colonna su schermi ≤ 760px, safe-area per i dispositivi con notch.
- **RNF-06 Leggibilità**: tema scuro ad alto contrasto, nomi grandi, codifica colore rosso/blu coerente.
- **RNF-07 Prevenzione errori**: ogni azione rilevante o distruttiva (avvio, vincitore, annullamento, nuovo torneo) richiede conferma.
- **RNF-08 Schermo sempre acceso** durante il torneo tramite Wake Lock API (se supportata; altrimenti degrada senza errori).
- **RNF-09 Lingua**: interfaccia interamente in italiano (`lang="it"`).
- **RNF-10 Qualità**: logica del torneo isolata in funzioni pure e coperta da test unitari (Vitest); type-check TypeScript nella build; lint con oxlint.
- **RNF-11 Deploy riproducibile**: GitHub Actions esegue test e build e pubblica su Pages a ogni push su `main`.

### Fuori ambito (esplicitamente escluso)
- Timer o cronometro delle riprese, suoni.
- Più dispositivi sincronizzati o schermo pubblico separato.
- Categorie (peso/età/sesso), palestra/team, metodo di vittoria, punteggi dei giudici.
- Storico dei tornei, export/import, stampa.
- Accoppiamenti manuali o spostamento manuale degli incontri tra ring.
- Correzione a cascata di risultati già "consumati" da incontri successivi.

---

## 5. Architettura

```
src/
├── main.tsx                  # bootstrap React
├── App.tsx                   # topbar, tab Ring/Tabellone, "Nuovo torneo"
├── index.css                 # stile (tema scuro, touch-first)
├── useWakeLock.ts            # Screen Wake Lock durante il torneo
├── tournament/
│   ├── types.ts              # modello dati
│   ├── engine.ts             # logica pura: sorteggio, resolve, ring, vincitore, undo, podio
│   ├── engine.test.ts        # test unitari (Vitest)
│   ├── store.ts              # hook useAppState + persistenza localStorage
│   └── view.ts               # helper di presentazione (nomi, etichette slot, titoli turno)
└── components/
    ├── SetupView.tsx         # impostazioni + partecipanti + avvio
    ├── RingView.tsx          # ring in corso, prossimi incontri, ultimi risultati, podio
    ├── Stepper.tsx           # selettore numerico −/+ (riprese, ring)
    ├── BracketView.tsx       # tabellone completo
    ├── ConfirmDialog.tsx     # dialog di conferma generico
    └── UndoDialog.tsx        # conferma di annullamento risultato
```

### Modello dati (sintesi di [types.ts](../src/tournament/types.ts))
- `Tournament`: `name`, `roundsPerMatch`, `fighters[]`, `matches: MatchDef[]` (struttura fissa creata al sorteggio),
  `results: Record<matchId, { winner: 'red'|'blue', ring, at }>`, `rings: (matchId|null)[]` (lunghezza = numero di ring), `startedAt`.
- `MatchDef`: `id` (`r{turno}-m{indice}` oppure `third`), `round`, `index`, `kind: 'main'|'third'`,
  `red`/`blue: SlotSource` = `fighter` | `none` (bye) | `winner` di un incontro | `loser` di un incontro.
- `resolve(t)` calcola per ogni incontro: slot (`filled`/`pending`/`empty`), stato
  (`pending`/`ready`/`done`/`bye`/`void`), vincitore/perdente, numero progressivo, ring.

### Flussi chiave ([engine.ts](../src/tournament/engine.ts))
- `createTournament({ …, ringCount })` → sorteggio + struttura + `fillRings`.
- `recordWinner(t, matchId, corner)` → salva il risultato, libera il ring e chiama `fillRings`.
- `canUndo` / `undoResult` → controllo sui dipendenti, rimozione del risultato, ripristino del ring, `fillRings`.
- `fillRings` → invalida le assegnazioni non più `ready` e riempie i ring liberi con i prossimi `ready` in ordine.
- `podium` → 1°/2° dalla finale, 3° dalla finale 3° posto.

---

## 6. Stack e comandi

| Elemento | Versione / strumento |
|----------|----------------------|
| Runtime | Node 20, npm 10 |
| Framework | React 19, TypeScript ~6.0, Vite 8 |
| PWA | vite-plugin-pwa 2 (Workbox), @vite-pwa/assets-generator |
| Test | Vitest 4 |
| Lint | oxlint |

```bash
npm install                  # dipendenze
npm run dev                  # sviluppo (aggiungi -- --host per provarlo dal tablet in LAN)
npm test                     # test unitari
npm run lint                 # lint
npm run build                # type-check + build di produzione in dist/
npm run preview              # serve la build (con service worker)
npm run generate-pwa-assets  # rigenera le icone da public/favicon.svg
```

Nota: il service worker (e quindi l'offline e l'installazione) richiede **HTTPS** oppure `localhost`. In LAN via
`http://IP` l'app funziona, ma non è installabile come PWA: per il tablet usare l'URL di GitHub Pages.

---

## 7. Deploy e installazione sul tablet

Repository: <https://github.com/MufloNerd/muaythai_tournament> —
indirizzo pubblicato: **<https://muflonerd.github.io/muaythai_tournament/>**
(visibile anche in Settings → Pages dopo il primo deploy riuscito, e nella tab Actions).

1. Fare push del branch `main` sul repository GitHub.
2. In **Settings → Pages → Build and deployment** selezionare **Source: GitHub Actions**.
3. Il workflow [deploy.yml](../.github/workflows/deploy.yml) esegue test e build (con `BASE_PATH=/<repo>/`) e
   pubblica su `https://<utente>.github.io/<repo>/`.
4. Sul tablet aprire l'URL una volta con connessione:
   - **iPad/iPhone (Safari)**: Condividi → "Aggiungi alla schermata Home";
   - **Android (Chrome)**: menu ⋮ → "Installa app" / "Aggiungi a schermata Home".
5. Da quel momento l'app si avvia dall'icona e funziona anche offline.

---

## 8. Stato attuale

- ✅ Motore del torneo implementato con 48 test unitari verdi (da 2 a 32 partecipanti, bye solo al 1° turno, finale 3° posto, 1–4 ring, annullamento).
- ✅ Numero di ring configurabile (1–4) verificato nel browser con 7 partecipanti e 3 ring.
- ✅ UI: impostazioni/partecipanti, vista Ring, tabellone, podio, dialog di conferma.
- ✅ PWA: manifest, icone, service worker; verificata la build con il base path di GitHub Pages.
- ✅ Verifica end-to-end nel browser (viewport tablet 1180×820): inserimento di 6 atleti, sorteggio con 2 bye,
  vincitore con conferma, avanzamento automatico ai ring, annullamento con ritorno sul ring originale,
  ripristino dopo ricarica, torneo completo fino al podio, tabellone.
- ✅ Workflow GitHub Actions per GitHub Pages.
- ✅ Codice caricato e pubblicato su <https://github.com/MufloNerd/muaythai_tournament>, Pages con sorgente "GitHub Actions".

### Possibili evoluzioni future (non richieste)
- Export/import JSON di backup; storico tornei.
- Categorie con più tabelloni.
- Timer integrato con segnale acustico.
- Schermo pubblico sincronizzato (richiederebbe un backend, es. Firebase/Supabase gratuiti).
- Wrapping nativo con Capacitor per la pubblicazione sugli store.
