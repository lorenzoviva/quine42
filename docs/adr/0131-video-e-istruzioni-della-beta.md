# ADR-0131 — I video stanno sul server e si servono a pezzi; le istruzioni della beta entrano nella build solo se accese

Data: 2026-11-04 · Stato: accettato · Riferimenti: ADR-0095 (il sito), ADR-0112 (il server di produzione), ADR-0114 (i ritmi), ADR-0129 (le notizie), T244

## Contesto

La beta chiede alla home due cose nuove. La prima sono i video dell'autore: più di uno, non brevi, serviti dal nostro sito. Il server di produzione manda i file interi e non sa di `Range`: un video lungo non si salterebbe in avanti né si riprenderebbe. La seconda sono le istruzioni del test, in due parti: la seconda parla della corona e, finché non è il momento, non deve arrivare a nessun browser.

## Decisione

**I video**

- **I file stanno in una cartella del server** (`QUINE_VIDEO`), con un elenco accanto (`video.json`: `file`, `titolo`, `descrizione`, nell'ordine del file). Non vanno nel repository (`.gitignore`) né in `dist/`. L'elenco si legge a ogni richiesta: un video nuovo non chiede build né riavvio. Si vede solo ciò che è nell'elenco e ha il file.
- **Una rotta sola, `/api/video`** (`server/video.ts`), sull'elenco di `server/production.ts` e nel server di sviluppo con lo stesso gestore; passa da `gate`. Non è `buildFile` esteso: quella funzione serve la build, e qui serve un elenco.
- **Il nome chiesto non diventa mai un percorso**: la parte dell'indirizzo, senza decodificarla, si confronta con i nomi dell'elenco. Un nome dell'elenco è semplice (lettere, cifre, `._-`, solo `.mp4` e `.webm`), e il suo percorso reale deve stare nella cartella: un link che porta fuori non è un video.
- **`Range` a un solo pezzo, in byte.** Tutto il resto, unità sconosciute e più pezzi compresi, è un 416. La RFC 9110 permetterebbe di ignorarli, ma così si manderebbe il file intero a una richiesta sbagliata; più pezzi sarebbero più letture dello stesso file per una richiesta. `If-Range` con un file cambiato dà quello nuovo intero.
- **Quanto costa una visione.** `pipeline` legge solo quanto il socket prende (64 KiB alla volta) e chiude il file quando il client se ne va. Misura su un file di 4 GB, Node 22, Windows, senza contare i buffer del sistema operativo: da 115 MB di RSS a 127 MB con 50 visioni ferme, 159 MB con 200, 143 MB con 50 che leggono al massimo; circa 200 KB per visione. Non serve una cache.
- **I tetti** stanno in `FRONT_RATES`: `video` (i pezzi per indirizzo: 60, poi uno al secondo, oltre al ritmo di ogni rotta), `videosAtOnce` (24 per indirizzo, perché dietro un indirizzo possono esserci più persone) e `videosInAll` (200, circa 40 MB). Chi resta senza posto riceve un 429. Una visione che non prende nulla per 2 minuti lascia il socket: un lettore in pausa richiede da dove era.

**Le istruzioni**

- **`docs/beta/guida.md` e `docs/beta/la-corona.md`, con un interruttore: `site/beta.json`** (`{ "laCorona": true }`). Spento, o illeggibile, vale spento. Accenderlo chiede una build, come pubblicare una notizia.
- **Un plugin di Vite, non `import.meta.glob`** (`server/betaGuide.ts`): un glob porterebbe nel bundle anche ciò che la pagina poi nasconde. Il plugin legge la seconda parte solo se è accesa: se è spenta nessun modulo la contiene. Lo prova `tests/site-guide.test.ts` con una build vera.
- **La stessa trasformazione delle notizie** (`markdownToHtml`): stesso sottoinsieme, tutto escapato.
- **Senza testi la pagina non c'è**: `site/istruzioni.html` non entra tra gli ingressi di Rollup e la landing non mostra il link. La landing importa solo un booleano, non il testo.

**La home.** Solo ritocchi, il launcher resta a T232: escono i pilastri, la carta dimostrativa e la citazione nel piè di pagina; i titoli perdono contorni e ombre (`body.home`, solo qui e nelle istruzioni). Restano i programmi MarkovJunior e la striscia «coming soon». La card dei crediti non promette più Stripe, che in beta non si usa (T243).

## Alternative scartate

- **Elenco dei video nel repository, letto alla build**: un video nuovo chiederebbe build e deploy, e comunque il sito non saprebbe se il file c'è.
- **Video su un CDN o su una piattaforma esterna**: l'autore li vuole sul nostro sito. Se la banda diventa un problema, la rotta si può spostare dietro un CDN: `Range`, `ETag` e `Cache-Control` ci sono già.
- **Interruttore in una variabile d'ambiente**: una riga committata si legge e si controlla nella storia; una variabile può cambiare da una macchina all'altra e far uscire la seconda parte per sbaglio.
- **Seconda parte nascosta da un CSS o da un controllo nel client**: il testo sarebbe comunque arrivato al browser.

## Conseguenze

La banda è il costo vero, e questi tetti non la limitano per chi guarda davvero: da decidere con il primo deploy pubblico. Una rotta pubblica nuova è superficie (regola 8h): la prova `tests/site-video.test.ts`. I video sono pubblici per chiunque arrivi alla rotta. Le altre pagine del sito tengono lo stile di prima e, per ora, non hanno il link alle istruzioni.
