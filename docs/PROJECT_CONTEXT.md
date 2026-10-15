# Torneo Muay Thai — Contesto di progetto, decisioni e requisiti

Questo documento raccoglie **tutte le decisioni prese e i requisiti** del progetto, così da poter ricostruire
il contesto completo in una sessione futura (anche da parte di un assistente AI) senza rileggere la cronologia.

> Ultimo aggiornamento: 2026-10-15 — stato: **v0.7.0 — durata di ripresa e pausa configurabili; MVP verificato; ring configurabili; regole IFMA/IBA; versione nell'header; certificati di vittoria e attestati di partecipazione PDF in stile Sak Yant; layout verificato su iPhone 17** (vedi [§ 8](#8-stato-attuale)).

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
| D3 | Formato torneo | **Eliminazione diretta** con 3° posto configurabile (vedi D16) | Scelta iniziale: finale 3° posto tra i perdenti delle semifinali. |
| D4 | Accoppiamenti 1° turno | **Sorteggio casuale automatico, bye sorteggiati e bilanciati** (vedi D17) | Se i partecipanti non sono una potenza di 2, alcuni passano il turno (bye). |
| D5 | Durata incontri | **Numero di riprese configurabile** nelle impostazioni | Default 3, intervallo 1–12. Dato solo informativo. Durata di ripresa e pausa: vedi D24. |
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
| D16 | 3° posto | **Opzione nel setup**: "Finale 3° posto" (default) oppure "Due bronzi (IFMA)", cioè entrambi i perdenti delle semifinali 3° ex aequo senza incontro | Ai mondiali IFMA (e nel pugilato olimpico) non si disputa la finale per il 3° posto. |
| D17 | Distribuzione bye | **Bilanciata** tra le due metà di ogni sotto-tabellone (differenza massima di 1 bye); la metà che riceve il bye dispari è sorteggiata | Allineamento alle procedure di sorteggio IBA/IFMA; evita che una metà arrivi in semifinale tutta "riposata". |
| D18 | Versione visibile | **Nell'header**, sotto il titolo: `v<versione> · build <n> · <commit> · <data build>` | Per capire quale commit è installato sul tablet. `build` = numero di commit (cresce a ogni commit); se la build contiene modifiche non committate compare "modifiche non committate". |
| D19 | Invio email automatico dei certificati | **Scartato** | Senza backend non si può fare gratis: EmailJS gratuito non supporta allegati; Resend/Cloudflare richiedono server, dominio verificato e chiavi segrete; `mailto:` non allega file. L'utente ha chiesto di non fare nulla in questo caso. |
| D20 | Certificati di vittoria | **PDF "stile cintura" per il podio, generati sul tablet a fine torneo e condivisi con il pannello di condivisione di sistema (WhatsApp, Telegram, Mail…)**, con pulsante "Scarica" come alternativa | Gratis, offline, nessun dato inviato a terzi dall'app. Un certificato per 1° e 2°, uno per ogni 3° (due con "due bronzi"). |
| D21 | Supporto smartphone | **Layout verificato e ottimizzato per iPhone 17** (402×874 pt, verticale e orizzontale) oltre che per tablet | Richiesto dall'utente. Su telefono: header su due righe (titolo+versione, poi schede e "Nuovo torneo"), ring compatti per vederne due senza scorrere, colonne del tabellone più strette. |
| D22 | Attestati di partecipazione | **Un attestato PDF per ogni partecipante non sul podio**, oltre ai certificati di vittoria | Richiesto dall'utente: nessuno torna a casa a mani vuote. |
| D23 | Stile dei certificati | **Pergamena con inchiostro marrone scuro e Sak Yant**, come la locandina dell'evento. Pannello sinistro: **Suea Koo** (due tigri gemelle rampanti a strisce che si fronteggiano, Unalom e piccola yant al centro, colonne e archi di scrittura). Pannello destro: **testa di elefante Erawan frontale e ornata** (aureola di foglie kranok, mandala sulla fronte, catene di perle, pendenti, zanne, proboscide arricciata con gioielli). Unalom e righe di scrittura in stile Khom in entrambi | Scelta dell'utente tra 3 opzioni, poi affinata su immagini di riferimento fornite dall'utente (v0.6.1). Le figure sono reinterpretazioni vettoriali originali, non copie dei riferimenti né ritagli della locandina: restano nitide in stampa e si possono pubblicare nel repository. Vincitori: cintura oro/argento/bronzo al centro. Partecipanti: Mongkhon rosso e bianco con "มวยไทย" e nastro "PARTECIPANTE". |
| D24 | Durata di ripresa e pausa | **Configurabili nel setup a scatti di 30"**: ripresa da 30" a 5' (default 2'), pausa da 30" a 3' (default 1'); fissate all'avvio del torneo | Richiesto dall'utente. Formato "2'", "1'30"", "30"". Solo informative (nessun timer, D6): appaiono nel setup con la durata stimata dell'incontro e sotto ogni ring ("3 riprese da 2' · 1' di pausa"; con una sola ripresa la pausa non viene mostrata). |

### Decisioni implementative prese in autonomia (coerenti con le scelte sopra)

| # | Decisione | Motivazione |
|---|-----------|-------------|
| I1 | Storage in **`localStorage`** (chiave `muaythai-tournament:v1`) anziché IndexedDB | Dati piccoli, API sincrona, più semplice. La chiave è versionata per migrazioni future. |
| I2 | **Stato derivato**: si salvano solo struttura del tabellone + risultati + assegnazione ring; tutto il resto (chi avanza, bye, stati) è calcolato da `resolve()` | Annullare un risultato = rimuoverlo; nessun rischio di stati incoerenti. |
| I3 | I bye **non si affrontano mai tra loro** al 1° turno e sono distribuiti con `balancedByeMatches` (divisione ricorsiva metà alta/bassa); l'atleta con il bye è messo a caso in angolo rosso o blu | Ogni incontro del 1° turno ha almeno un atleta; tabellone equilibrato. |
| I4 | Ordine di gioco: per turno, poi per posizione; **la finale 3° posto precede la finale** | Con 2 o più ring, finale 3° posto e finale si disputano in contemporanea. |
| I5 | Numerazione progressiva ("Incontro N") **solo per gli incontri reali**, escludendo i bye | Il numero è usato nei riferimenti "Vincente inc. N" / "Perdente inc. N". |
| I6 | Con 3 partecipanti il 3° posto è assegnato **automaticamente** (unico perdente di semifinale); con "due bronzi" c'è un solo bronzo | La semifinale con bye non produce un perdente. |
| I7 | Con 2 partecipanti: solo la finale, **nessun 3° posto** | |
| I8 | Annullando un risultato, l'incontro **torna sul ring dove era** (se libero) e l'incontro successivo dipendente viene tolto dal ring | Comportamento atteso dall'operatore. |
| I9 | "Nuovo torneo" elimina tabellone e risultati ma **mantiene l'elenco partecipanti** | Utile per ripetere o correggere rapidamente. |
| I10 | **Screen Wake Lock** attivo durante il torneo (dove supportato) | Il tablet non va in standby tra un incontro e l'altro. |
| I11 | Interfaccia **in italiano**, tema scuro ad alto contrasto, angoli rosso/blu | Leggibilità in palestra. |
| I12 | Generatore ID senza `crypto.randomUUID` | Funziona anche in contesti non HTTPS (es. accesso via IP in LAN). |
| I13 | Icone PWA generate con `@vite-pwa/assets-generator` da `public/favicon.svg` | Strumento ufficiale dell'ecosistema. |
| I14 | Deploy con **GitHub Actions → GitHub Pages**, base path impostato con la variabile `BASE_PATH` | Il workflow imposta `/<nome-repo>/`. In locale la base è `/`. |
| I15 | **Partecipanti non potenza di 2 (es. dispari)**: tabellone alla potenza di 2 successiva (N→P); P−N bye sorteggiati tutti nel 1° turno, mai bye contro bye; dal 2° turno ogni incontro ha sempre 2 atleti | Esempi: 7→8 (1 bye), 5→8 (3 bye), 6→8 (2 bye), 9→16 (7 bye, 1 solo incontro reale al 1° turno), 12→16 (4 bye). |
| I16 | Se gli incontri pronti sono meno dei ring, i ring in eccesso restano **in attesa** | Es. semifinali con 4 ring: 2 ring occupati, 2 in attesa. |
| I17 | PDF scritto **senza librerie**: il certificato è disegnato su canvas (2480×1754 px, JPEG q=0.9) e incapsulato in un PDF 1.4 di una pagina A4 orizzontale (`jpegToPdf`) | Evita ~300 KB+ di dipendenze (jsPDF + html2canvas) nella cache offline; struttura PDF coperta da test (offset xref). File di circa 300–350 KB. |
| I18 | I PDF vengono **pre-generati** quando compare il podio; il tocco su "Condividi" chiama subito `navigator.share` | Safari blocca la condivisione se passa troppo tempo dal tocco (user activation). |
| I19 | Condivisione con **solo file + titolo**, senza testo | Su alcune app (es. WhatsApp iOS) file + testo insieme fanno perdere l'allegato. |
| I20 | Placca della cintura oro (1°), argento (2°), bronzo (3°) su cinturone rosso; data = data dell'ultimo risultato registrato; partecipanti ordinati per cognome e poi nome | |
| I21 | Lo sfondo comune (pergamena, cornice, pannelli Sak Yant) viene disegnato **una sola volta** e copiato in ogni certificato; i certificati compaiono **uno alla volta** (prima il podio) e il canvas viene liberato subito dopo l'esportazione | Prestazioni e memoria su iPhone/iPad con 30+ atleti. Misurato: 10 PDF in ~0,35 s su WebKit desktop. |
| I22 | Il testo "มวยไทย" (Muay Thai in thai) usa i font di sistema Thonburi (Apple) o Noto Sans Thai / Leelawadee (Android/Windows) | Nessun font da scaricare; resta leggibile offline. |
| I23 | **Migrazione dei dati salvati** in `parseState` (store.ts): tornei e bozze salvati prima della v0.7.0 senza durate ricevono 2' / 1' | Il torneo in corso sul tablet non si rompe con l'aggiornamento. Coperto da test. |

---

## 3. Requisiti funzionali

### Configurazione torneo
- **RF-01** Inserire il nome del torneo (facoltativo; default "Torneo Muay Thai").
- **RF-02** Impostare il numero di riprese per incontro (default 3, min 1, max 12), con la durata stimata dell'incontro.
- **RF-02a** Impostare la durata della ripresa (30"–5', default 2') e della pausa (30"–3', default 1') a scatti di 30"; mostrate come "N riprese da 2' · 1' di pausa" sotto ogni ring.
- **RF-02b** Impostare il numero di ring (default 2, min 1, max 4); non modificabile dopo l'avvio.
- **RF-03** Aggiungere partecipanti indicando nome e cognome (Invio da tastiera per aggiungere velocemente).
- **RF-04** Rimuovere un partecipante prima dell'avvio.
- **RF-05** Vedere un'anteprima della dimensione del tabellone, del numero di bye, della presenza della finale 3° posto e del numero di ring.
- **RF-06** Avviare il torneo (minimo 2 partecipanti) con conferma; dopo l'avvio l'elenco non è modificabile.

### Sorteggio e tabellone
- **RF-07** Sorteggio casuale degli accoppiamenti del 1° turno.
- **RF-08** Tabellone dimensionato alla potenza di 2 successiva; i bye sono sorteggiati, bilanciati tra le metà del tabellone, e chi ha il bye avanza automaticamente.
- **RF-09** Eliminazione diretta: il vincitore avanza al turno successivo.
- **RF-10** 3° posto configurabile: finale 3° posto tra i perdenti delle semifinali, oppure due bronzi ex aequo senza incontro (se esistono semifinali).
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
- **RF-22** A torneo concluso: podio con 1°, 2° e 3° classificato (due 3° in modalità "due bronzi").
- **RF-23** "Nuovo torneo" con conferma: elimina il torneo corrente e mantiene i partecipanti.

### Certificati
- **RF-24** A torneo concluso, sezione "Certificati e attestati" con due gruppi: "Vincitori" (podio) e "Partecipanti" (tutti gli altri, ordinati per cognome), con anteprima di ogni PDF.
- **RF-25** Certificato di vittoria: pergamena con pannelli Sak Yant (tigre ed Erawan), nastro "CERTIFICATO DI VITTORIA", nome del torneo, cintura con placca oro/argento/bronzo (MUAY THAI, posizione, CAMPIONE/VICECAMPIONE/TERZO POSTO), nome dell'atleta, posizione e data.
- **RF-25b** Attestato di partecipazione: stesso stile, nastro "ATTESTATO DI PARTECIPAZIONE", Mongkhon con "มวยไทย" e nastro "PARTECIPANTE", frase "per aver partecipato con impegno, coraggio e rispetto".
- **RF-26** "Condividi" (singolo) e "Condividi tutti" per ciascun gruppo aprono il pannello di condivisione del dispositivo con i PDF allegati; visibili solo se il dispositivo supporta la condivisione di file.
- **RF-27** "Scarica" salva il PDF (`Certificato-1-posto-Nome-Cognome.pdf` oppure `Attestato-partecipazione-Nome-Cognome.pdf`, senza accenti).
- **RF-28** I certificati si rigenerano se il podio cambia (es. annullamento della finale).

---

## 4. Requisiti non funzionali

- **RNF-01 Installabilità**: PWA con manifest (`standalone`, icone 64/192/512 + maskable, apple-touch-icon), installabile su iOS/iPadOS e Android.
- **RNF-02 Offline**: service worker (Workbox, `generateSW`, `autoUpdate`) che mette in cache tutti gli asset; dopo il primo caricamento funziona senza rete.
- **RNF-03 Persistenza**: lo stato è salvato in `localStorage` a ogni modifica e ripristinato all'apertura; sopravvive a chiusura e ricarica.
- **RNF-04 Nessun backend** e nessun costo di esercizio (hosting gratuito su GitHub Pages).
- **RNF-05 Usabilità touch**: tutti i controlli ≥ 44×44 pt (linee guida Apple), pulsanti degli atleti ≥ 84 pt su telefono e ≥ 110 pt su tablet; ring affiancati (1–3 colonne, 2×2 con 4 ring) e in colonna sotto i 760 px; header su due righe sotto i 600 px; padding per le safe area (Dynamic Island in orizzontale, home indicator, notch); input ≥ 16 px per evitare lo zoom automatico di iOS.
- **RNF-06 Leggibilità**: tema scuro ad alto contrasto, nomi grandi, codifica colore rosso/blu coerente.
- **RNF-07 Prevenzione errori**: ogni azione rilevante o distruttiva (avvio, vincitore, annullamento, nuovo torneo) richiede conferma.
- **RNF-08 Schermo sempre acceso** durante il torneo tramite Wake Lock API (se supportata; altrimenti degrada senza errori).
- **RNF-09 Lingua**: interfaccia interamente in italiano (`lang="it"`).
- **RNF-10 Qualità**: logica del torneo isolata in funzioni pure e coperta da test unitari (Vitest); type-check TypeScript nella build; lint con oxlint.
- **RNF-11 Deploy riproducibile**: GitHub Actions esegue test e build e pubblica su Pages a ogni push su `main`.
- **RNF-12 Tracciabilità**: la build inietta (`define` in `vite.config.ts` → `__APP_VERSION__`) versione di `package.json`, numero di build (`git rev-list --count HEAD`), hash breve del commit, stato "dirty" e data/ora di compilazione. Il workflow fa checkout con `fetch-depth: 0` per contare tutti i commit.
- **RNF-13 Condivisione**: Web Share API Level 2 (`navigator.canShare({ files })`), supportata da Safari iOS/iPadOS 15+ e Chrome Android; richiede HTTPS (GitHub Pages). Dove non è supportata resta "Scarica".

### Riferimenti ai regolamenti ufficiali
- **IFMA** — [Rules & Regulations for International Competition](https://muaythai.sport/wp-content/uploads/2023/04/IFMA-Rules-and-Regulations-v2.04-1.pdf): i bye si sorteggiano nel 1° turno per ridurre il 2° turno a 4, 8, 16 o 32 atleti; chi ha avuto il bye combatte per primo nel 2° turno.
- **IFMA World Championships**: nessuna finale per il 3° posto, due bronzi ai perdenti delle semifinali ([resoconto USA Muaythai 2023](https://usamuaythai.sport/2023-ifma-world-championships-recap/)).
- **IBA (pugilato)** — [Technical & Competition Rules](https://www.iba.sport/wp-content/uploads/2023/04/20230513-IBA-Technical-Competition-Rules29.pdf): bye nel 1° turno distribuiti in modo bilanciato tra metà alta e metà bassa del tabellone.
- Fonti individuate tramite ricerca web; i PDF non sono stati consultati direttamente.

### Fuori ambito (esplicitamente escluso)
- Timer o cronometro delle riprese, suoni.
- Più dispositivi sincronizzati o schermo pubblico separato.
- Categorie (peso/età/sesso) e teste di serie, palestra/team, metodo di vittoria, punteggi dei giudici.
- Storico dei tornei, export/import, stampa.
- Invio automatico di email (vedi D19).
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
├── globals.d.ts              # tipo di __APP_VERSION__ (iniettato in build)
├── tournament/
│   ├── types.ts              # modello dati
│   ├── engine.ts             # logica pura: sorteggio, resolve, ring, vincitore, undo, podio
│   ├── engine.test.ts        # test unitari (Vitest)
│   ├── store.ts              # hook useAppState + persistenza localStorage
│   └── view.ts               # helper di presentazione (nomi, etichette slot, titoli turno)
├── certificates/
│   ├── content.ts            # dati del certificato dal podio, testi per posizione, nome file, data
│   ├── draw.ts               # layout del certificato: pergamena, cornice, nastro, cintura o Mongkhon
│   ├── sakyant.ts            # disegni vettoriali Sak Yant: Suea Koo, Erawan, Unalom, scrittura, ornamenti
│   ├── pdf.ts                # writer PDF minimale (JPEG → PDF A4 orizzontale)
│   ├── render.ts             # canvas → JPEG → PDF File (sfondo in cache); share/download
│   └── certificates.test.ts  # test contenuti, nomi file, struttura PDF
└── components/
    ├── SetupView.tsx         # impostazioni + partecipanti + avvio
    ├── RingView.tsx          # ring in corso, prossimi incontri, ultimi risultati, podio
    ├── Stepper.tsx           # selettore numerico −/+ (riprese, ring)
    ├── AppVersion.tsx        # versione/build/commit nell'header
    ├── CertificatesPanel.tsx # anteprime + Condividi/Scarica dei certificati
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
npm version minor --no-git-tag-version  # incrementa la versione mostrata (opzionale: il numero di build cresce da solo)
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

- ✅ Motore del torneo implementato con 62 test unitari verdi (da 2 a 32 partecipanti, bye solo al 1° turno e bilanciati, finale 3° posto o due bronzi, 1–4 ring, annullamento).
- ✅ Opzione "Due bronzi (IFMA)" verificata nel browser con 7 partecipanti fino al podio.
- ✅ Versione/build/commit visibili nell'header (v0.4.0).
- ✅ Certificati PDF stile cintura (v0.5.0): 73 test verdi; PDF validati aprendoli con macOS (PDFKit); condivisione verificata simulando la Web Share API; da provare sul tablet reale con WhatsApp/Telegram.
- ✅ Verifica mobile iPhone 17 (v0.5.1) con Playwright **WebKit** (402×874, DPR 3, touch) su tutte le schermate, in verticale e in orizzontale: nessun overflow orizzontale, nessun controllo sotto 44 pt, nessun testo sotto 12 px; tablet 1180×820 invariato. Le safe area reali (Dynamic Island) non sono emulabili: da confermare sul dispositivo.
- ✅ Attestati di partecipazione e stile Sak Yant (v0.6.0): 75 test verdi; verificato in WebKit su iPhone 17 e tablet con 10 atleti (3 certificati + 7 attestati, condivisione per gruppo, nessun overflow).
- ✅ Suea Koo ed Erawan ridisegnati secondo i riferimenti dell'utente (v0.6.1): 16 PDF generati in ~0,4 s in WebKit su iPhone 17, senza errori.
- ✅ Durata di ripresa e pausa configurabili (v0.7.0): 90 test verdi (validazione, formato, migrazione dei dati salvati); verificato in WebKit su iPhone 17 e tablet, compresa la riapertura di un torneo salvato dalla v0.6.1.
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
