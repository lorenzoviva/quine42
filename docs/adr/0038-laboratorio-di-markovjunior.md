# ADR-0038 — MarkovJunior nel gioco (`src/mj`), il laboratorio diventa il laboratorio di MarkovJunior

Data: 2026-10-22 · Stato: accettato (step 9, fase F1) · Sostituisce, per il laboratorio: ADR-0031…0035
(sprite fotografati, strutture a blocchi, protocollo dei blocchi, WFC, architetto, commissione).

## Contesto
ADR-0037 porta il gioco in 3D con gli asset come programmi MarkovJunior. Il motore e il front-end XML
stavano in `lab/` (costruito in tre sessioni, con strade poi abbandonate: blocchi, WFC, architetto, sprite
fotografati, programmi JSON). L'autore chiede di togliere il laboratorio o di tenerlo come laboratorio di
MarkovJunior, per analizzare e correggere i programmi che il Concilio non riesce a generare.

## Decisione
1. **MarkovJunior è codice del gioco**, in `src/mj/`, puro (niente DOM né three.js): `engine.ts` (il motore
   3D), `xml.ts` e `model.ts` (l'XML letto alla lettera, ADR-0036), `palette.ts`, `run.ts` (esecuzione,
   fotogrammi, azioni), `rig.ts` (gli arti di una figura), `mesh.ts` (voxel → triangoli, impronte, pavimenti),
   `classes.ts` (le classi e le loro scatole), `photo.ts` (le quattro foto in 3/4, per l'Artista), `check.ts`
   (le misure di un modello: vuoto, galleggia, in pezzi, troppo basso). Lo usano kernel, worker, renderer e
   laboratorio; `src/` non importa mai da `lab/`.
2. **Il laboratorio resta, come laboratorio di MarkovJunior**: la sandbox 3D (`lab/3d`), i modelli ufficiali e
   i test di conformità (invariati: cambiano solo i percorsi degli import), gli esempi e i programmi delle prove,
   gli script per affettare, fotografare, misurare e provare con Gemini. Motivo: quando lo Scultore non riesce
   un modello serve poterlo leggere passo per passo, correggerlo e provarlo in un mondo, e rifare le prove dei
   modelli Gemini con i contatori; rifare questi strumenti al bisogno costerebbe di più che tenerli.
3. **Via ciò che è superato**: la pagina `/lab/` (blocchi, sprite), strutture a blocchi, commissione, WFC,
   architetto, Scultore JSON e i suoi esempi, programmi dei castelli e delle cripte, conversione JSON → XML (già
   fatta), script e test relativi. Restano nella storia di git (fino a `2832382`) e negli ADR 0031-0036.
4. I test del motore stesso passano in `tests/mj.test.ts` (nodi, forme, `map`, unioni, `path`, misure, foto,
   classi, scheletro), scritti sull'XML o su programmi minimi, senza gli esempi JSON.

## Conseguenze
- Il gioco può eseguire modelli in Node (test) e nei worker (browser) con lo stesso codice.
- Il laboratorio non è più allineato agli step 8A-8E: chi cerca quei risultati li trova negli ADR e in git.
- Prezzi e contatori del laboratorio (`lab/mj3d/prices.ts`, `meter.ts`) passano al kernel nella fase F2.
