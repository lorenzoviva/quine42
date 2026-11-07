# Catture della verifica nel browser di T296 (ADR-0172)

Le carte guaste. Build di produzione (`npm run build`), `npx vite preview` su una porta libera, `?universo=t296-carte&skip&offline` (con
`&dev` per aprire la console senza essere usciti dalla simulazione), Chrome con la scheda di Claude in Chrome.

Preparazione: l'universo `t296-carte` nasce dallo store (la radice del contratto 0.5); dalla console della pagina tre carte portate, scritte
come le scriverebbe la rotta `bring` di ADR-0170 (la voce con `brought: "t296-alfa"` e la carta del master, un commit del kernel), perché il
controllo del server una carta così non la lascerebbe passare: una carta che si guasta qui è proprio una che è passata altrove.

- `botte-di-anna`, «Botte di Anna», `furniture`: un programma con `<import file="doghe"/>`, un file che questo universo non ha (T333);
- `barile-di-bruno`, «Barile di Bruno»: il programma del barile del seme, una carta che funziona;
- `sound-music-silenzio`, «Il silenzio del villaggio»: un brano per l'ambiente `village` con la sola traccia a volume zero.

Due moduli solidi (`obj.botte`, `obj.barile`) le indossano; dopo ogni caricamento la console della pagina ne mette uno ciascuno davanti al
viandante (`spawnModuleEntity`), poi un clic sulla pagina apre l'audio.

- **01** (`01-il-mondo-gira-con-due-carte-isolate.jpg`): il mondo gira. Il worker vero risponde alla botte con l'errore del motore («riga 1,
  `<import>`: manca il file models/doghe.xml»): la carta si isola e la botte, al centro, veste il mobile generico; il barile, a destra sul
  terreno battuto, veste la sua carta. Aperto l'audio, il direttore sceglie il brano portato per il villaggio, il worker del suono lo rende,
  è muto: «non suona nulla». In alto a destra le due anomalie (`card:botte-di-anna`, `card:sound-music-silenzio`) col motivo; in basso a
  destra il registro del Concilio: «Chi la usava veste il modello generico» per la botte, «Il suono tace» per il brano, «il master può
  toglierla dalla console, scheda Universo».
- **02** (`02-la-console-mostra-le-carte-e-il-motivo.jpg`): la console (F2), scheda «Universo», «Le carte portate (3)»: il barile «funziona»,
  la botte e il brano «⚠ non funziona» col motivo, ognuna col suo «Togli».
- **03** (`03-la-carta-e-tolta-con-un-commit.jpg`): «Togli» e poi «Sicuro? Togli «Botte di Anna»» (due clic, niente finestre del browser):
  «✓ «Botte di Anna» è tolta (commit 23c96fc): i modelli sono locali: lo Scultore non scrive; resta il modello generico» (il testo di
  allora diceva «:» al posto di «;»: corretto dopo, ADR-0172), le anomalie scendono a una. Sul disco, in `universes/t296-carte/`: un commit di
  `Kernel` «il master toglie la carta «Botte di Anna» (botte-di-anna): il programma si guasta (seme 1): riga 1, <import>: manca il file
  models/doghe.xml», che toglie `models/botte-di-anna.xml` e la sua voce di `models/index.json` e scrive la mancanza in
  `world/shortfalls.json` («il modello di «Botte di Anna»», `sculptor`, `fault`). Poi lo stesso per il brano: «suona la musica del momento»,
  e il direttore torna a `sound-music-pastoral`; la seconda mancanza è «la musica di village», `musician`.
- **04** (`04-dopo-la-ricarica-il-mondo-senza-la-carta.jpg`): ricaricata la pagina, le due carte non ci sono più (né i file né le voci),
  nessuna anomalia; la botte rimessa davanti al viandante veste il mobile generico e aspetta il suo modello (`wanted: botte-di-anna`,
  `sculpting.missing()` lo elenca: offline nessuno lo scrive), il barile tiene la sua carta.
- **05** (`05-dopo-la-ricarica-la-console.jpg`): la scheda «Universo» dopo la ricarica: «Le carte portate (1): funzionano tutte in questo
  mondo», il barile.

Poi, con la build finale (dopo le ultime correzioni: la punteggiatura del testo, il terreno, il ritorno), un secondo giro sullo stesso
universo: una carta portata `lanterna-spenta`, «Lanterna spenta», con un programma che finisce senza un voxel visibile.

- **06** (`06-build-finale-la-lanterna-tolta.jpg`): la lanterna si isola («il programma non produce niente (seme 2): nessun voxel
  visibile»), la cosa che la indossava veste il mobile generico; dalla scheda «Universo» «✓ «Lanterna spenta» è tolta (commit 37d86e4): i
  modelli sono locali: lo Scultore non scrive; resta il modello generico.», resta il barile che funziona. Poi, dalla scheda «Commit», il
  ritorno al commit che l'aveva portata («ritorno a 430edcc»): la carta torna nei file, si riprova, si ritrova guasta (`empty`), il guasto
  `card:lanterna-spenta` si riapre e la cosa resta col generico (`wanted: lanterna-spenta`).

Nella console della pagina nessun errore del gioco nei due giri (solo messaggi del canale dell'estensione di Chrome). Non fatto nel browser:
la partita di molti (serve il server di sviluppo; lo provano `tests/carte-guaste.test.ts`, «in una partita di molti»), una forma senza
impronta e un worker che non risponde (anche loro nei test).
