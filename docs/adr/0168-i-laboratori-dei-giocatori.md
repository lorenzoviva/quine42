# ADR-0168 — I laboratori dei giocatori: serviti con l'interruttore, fork, bozza, salvataggio, carte nel sito

Data: 2026-11-07 · Stato: accettato (task T294 del backlog, step 41) · Riferimenti: ADR-0161 (le carte fatte a mano), ADR-0102 (chi chiede e cosa può), ADR-0109 (ciò che esce è un elenco), ADR-0111 (la CSP), ADR-0112 (il server di produzione), ADR-0131 (`site/beta.json`), ADR-0145 (le vesti del sito)

## Contesto

T293 ha dato la forma, l'archivio e le rotte delle carte fatte a mano, e l'interruttore `laboratori`. Le tre pagine dei laboratori (`lab/3d/`,
`lab/editor/`, `lab/suono/`) erano strumenti dello sviluppatore: senza account, con Gemini (la sandbox scolpiva dal vivo), le prove e i
modelli ufficiali da confrontare, l'apertura e il salvataggio su disco; il server di produzione non le serviva (`NOT_SERVED`). Il giocatore deve
poter forkare un modello o un suono di un universo che legge (o una propria carta), cambiarlo nel laboratorio giusto, salvarlo come carta con
i motivi di un rifiuto, non perdere il lavoro, vedere le carte di tutti nel sito, senza mai chiamare i modelli.

## Decisione

1. **Serviti solo con l'interruttore**: `buildFile(dist, url, labs)` del server di produzione serve sotto `/lab` solo le pagine dei tre laboratori
   (`/lab/3d/`, `/lab/editor/`, `/lab/suono/`, anche `index.html`; senza la barra finale un 301 alla cartella) e solo con `labs` acceso; il banco
   degli indossati e tutto il resto di `/lab` restano fuori, come ogni cosa con l'interruttore spento. I loro script stanno in `/assets` come
   quelli del sito, sotto la stessa CSP (niente script scritti nella pagina, worker da `'self'`).
2. **La build è dei giocatori**: gli strumenti degli sviluppatori esistono solo fuori da una build, con `import.meta.env.MODE !== 'production'`
   (non `DEV`: segue `NODE_ENV`, e sulla macchina dell'autore `NODE_ENV=development` lo accende anche in build). Lo Scultore con Gemini sta in
   `lab/3d/sculpt.ts`, importato solo così: in `dist/` non ci sono né lui né `GeminiAiModels` nelle pagine dei laboratori (controllato sulla
   build, seguendo gli import di ogni pagina). Fuori anche le prove di Gemini, i modelli ufficiali di MarkovJunior e quelli dell'editor (gruppi
   e file, `DEV_TOOLS` in `lab/3d/catalog.ts`), l'apertura di un file e il salvataggio dell'XML su disco del SoundLab. I programmi girano tutti
   nel browser: per un giocatore i laboratori non costano crediti.
3. **La barra delle carte** (`lab/handmade/bar.ts`), la stessa nell'editor e nel SoundLab: l'indirizzo dice da dove nasce la copia,
   `?fork=<universo>/<modello>` (si legge `/api/universe/<nome>`, cioè per chi non è il master solo `publicFiles`: i modelli e il loro indice,
   `forkables`) o `?card=<id>`. Un modello si cambia nell'editor, un suono nel SoundLab (`labOf`); la sandbox 3D mostra i modelli fatti a mano
   di tutti nel mondo e apre `?card=` davanti al viandante. «Salva» crea la carta (`createBody`, con `from` che il server risolve dal disco) o
   aggiorna la propria con ciò che è cambiato (`updateBody`: il programma col contratto, la taglia tolta con `null`); «Salva come nuova» fa una
   carta nata dalla propria (`from: {card}`). Ogni motivo del server si vede nella barra (`reasonsOf`: la ragione e tutti gli errori del
   controllo). La carta di un altro si apre per provarla, mai per salvarla. Dopo il primo salvataggio l'indirizzo diventa `?card=<id>`. Un
   modello senza la sua `size` si disegna nella scatola che il gioco gli dà (`boxFor`).
4. **Il lavoro non si perde**: la barra tiene in `localStorage`, ogni secondo, programma, nome, classe e taglia di ciò che non è salvato
   (`draftKey`: un posto per laboratorio e sorgente) e lo riprende alla riapertura sulla stessa base (`resume`); se la carta è cambiata altrove
   vince quella del server e la pagina lo dice. Il lavoro libero dell'editor ha la sua bozza; il SoundLab tiene la sua di sempre per il lavoro
   libero, e una carta salvata la toglie.
5. **Il sito**: `site/laboratori.html` (nel `dist/` solo con l'interruttore acceso, `labsPage`) è l'ingresso col tema condiviso: i tre
   laboratori, le proprie carte (apri, nel mondo, elimina con due pressioni, la firma, l'uso e i tetti), ciò che si forka di un universo. Il link
   «Laboratori» nella barra e nel piede di ogni pagina lo mette `site/labs-nav.ts` solo se la build l'ha visto acceso (`virtual:quine-laboratori`,
   `labsOpen`). `site/carte.html` mostra le carte fatte a mano di tutti (`site/carte-mano.ts`, caricato da `carte.ts`), riconoscibili, con la
   firma dell'autore e il link al laboratorio; con gli account le vede ogni account. Nomi e firme vanno nelle pagine come testo.
6. **Senza account** (solo questa macchina: sviluppo, anteprima), il viandante è quello del sito e del gioco: `?viandante=` o quello che il sito
   ha ricordato (`quine:sito:viandante`, anche dalla pagina dei laboratori: i link ai laboratori non lo portano), detto con `x-quine-viandante`;
   nessuno: chi gioca da solo. Così due identità si provano anche senza l'emulatore (`tools/produzione/laboratori.ts`: il server di produzione
   vero, con la build, segreti finti, un universo `prova` dal seme, in una cartella temporanea).

## Alternative scartate

- **Gli strumenti degli sviluppatori decisi da un parametro nell'indirizzo**: Gemini resterebbe nel codice servito a tutti; ciò che non c'è non
  si accende.
- **`import.meta.env.DEV`**: una build fatta con `NODE_ENV=development` porterebbe Gemini e le prove nel `dist/` dei giocatori (è successo
  nella prima build di questo task).
- **Il fork della carta di un altro**: il server lega una carta solo a un universo o a una propria carta; salvarla senza `from` ne cancellerebbe
  l'autore e la catena. Si guarda e si prova.
- **La bozza sul server**: ogni battuta sarebbe una scrittura nel ritmo delle carte; resta su questa macchina finché non si salva.

## Conseguenze

- Il SoundLab ritrova i suoi preset: il glob cercava ancora `suono-*`, che dal contratto 0.3 si chiamano `sound-*` (T307b).
- Test: `tests/handmade-labs.test.ts` (sorgente, link, ciò che si forka di `publicFiles`, la scatola, la bozza, fork → carta → riapertura con lo
  stesso XML, il cambio e la taglia, «salva come nuova», un suono, un rifiuto coi motivi, la carta di un altro); `tests/sicurezza/produzione.test.ts`
  sul server di produzione vero con l'interruttore spento e acceso (le tre pagine, la CSP, il 301, nient'altro di `/lab`); `tests/site-guide.test.ts`
  (`labsPage`, `virtual:quine-laboratori`). Nessun cambio a `src/kernel/`: la versione resta.
- Non coperto: la verifica nel browser con un account dell'emulatore (non installato su questa macchina): con gli account le rotte sono provate dai
  test con i token; nel browser le due identità sono quelle per id. Le miniature delle carte fatte a mano nella galleria (la gemma al posto della foto).
