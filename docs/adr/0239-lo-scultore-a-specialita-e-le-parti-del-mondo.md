# ADR-0239 — Lo Scultore a specialità e le parti del mondo

Data: 2026-11-21 · Stato: accettato (task T468 del backlog, S2 dello studio T458, [`docs/design/scultori-specializzati.md`](../design/scultori-specializzati.md)
§ 2, § 3, § 4 e § 6.1; approvato dall'autore il 21/11 con le quattro domande del § 6.2) · Sostituisce in parte ADR-0170 (punto 7: «lo Scultore
impara prima dai programmi scritti a mano, poi da quelli portati»; da T467 un modello portato è un esempio per il voto che porta, non perché
portato) · Riferimenti: ADR-0042 (lo Scultore), ADR-0044 (le azioni come regole), ADR-0165 (i prompt in inglese, il blocco «Lingua»), ADR-0171
(`<import>`), ADR-0182 (le parti del seme), ADR-0183 (le strutture a blocchi), ADR-0193 (l'adattatore OpenRouter), ADR-0205 (Opus Scultore delle
strutture, il sistema in cache), ADR-0228 (le navi), ADR-0136 (la versione del kernel)

## Contesto

Lo studio T458 (§ 1) ha misurato che ogni richiesta dello Scultore per una cosa che non cresce a regole portava tutto il prompt generale (5 207
token), e un terzo non le serviva: le righe delle altre classi, le cose indossate, le navi, una vetrina di tre programmi che lo Scultore non
riceve, i nodi che leggono file che il seme non ha, la tinta. Un'azione («Altro…») ne usava 2 045. In dollari è poco (0,03-0,05 $ per ora di
gioco), ma un mestiere non poteva avere istruzioni sue senza farle pagare a tutti. Gli esempi della libreria erano scelti per ordine
dell'indice: li ha corretti T467 (S1). Le parti del seme si includono con `<import>` (ADR-0171, ADR-0182), ma solo il seme le scrive.

L'autore, il 21/11: i nomi delle specialità vanno bene, anche nello studio; «parte del mondo» invece di «pezzo», perché **pezzo** è già della
griglia a pezzi (`<pieces>`, ADR-0178); la soglia del voto per un esempio o una parte dall'universo è **6** (l'Artista è severo e i modelli
generativi di oggi limitano la qualità: voti bassi sono normali ora); la prova pagata (S7) dopo S2-S4.

## Decisione

1. **Un agente, otto specialità.** Lo Scultore resta `sculptor`: una riga del censimento (`model.sculpt`, `model.action`, la manopola
   `models`), la sezione «Scultore e Artista» delle direttive del master (ADR-0191), una postazione nello studio, un registro. Le specialità
   (`SculptorSpecialty`, `SPECIALTIES`, `SPECIALTY_NAMES`, `SPECIALTY_CLASSES` in `src/kernel/agents/sculptor.ts`): **Paesaggista**
   (`landscaper`: alberi, cespugli, rocce, sassi), **Mobiliere** (`joiner`: mobili e oggetti), **Sarto** (`tailor`: ciò che si indossa),
   **Figurinista** (`figurist`: persone, animali, bestie), **Capomastro** (`mason`: edifici, monumenti, strutture sotto la Grande),
   **Architetto** (`architect`: le strutture che crescono a regole, dalla Grande in su), **Carrozziere** (`coachbuilder`: le navi, e i veicoli
   di terra e del vuoto quando avranno una classe) e **le azioni** (`actions`: le `<action>` di «Altro…», per un modello di qualunque mestiere).
   Le decide il kernel, `specialtyOf(cls, req)`: l'Architetto dalla taglia (`procedural`), il Sarto da `worn`, gli altri dalla classe; la
   specialità va con la chiamata (`CallOptions.specialty`, `TextCall.specialty`). Il registro del Concilio dice il mestiere col suo nome
   italiano («Baule (mobile o contenitore, Mobiliere, …)»): i banchi dei mestieri nella casa dello Scultore, se l'autore li vorrà, sono solo
   aspetto e un altro task.

2. **Il prompt è un nucleo e una sezione per mestiere.** `prompts/agents/sculptor.md` è il **nucleo**, ciò che ogni mestiere legge (chi sei,
   le coordinate, il programma, la palette e i colori, i pattern, i nodi, `field` e `observe`, come si scolpisce bene, le trappole), uguale
   per tutti; la nota `<!-- core: … -->` lo dice (`CORE_MARK`, `hasCore`). La **sezione** di ogni mestiere è
   `prompts/agents/sculptor/<specialità>.md` (`sectionPath`, `sculptorSection`): le righe delle sue classi (`@@CLASSES@@`), le taglie di D&D
   per il Capomastro (`@@SIZES@@`), «Worn things» per il Sarto, «The colour of the thing» per il Mobiliere e per il Sarto (il cappello delle
   forme comuni è tinto), gli arti e le persone per il Figurinista, «Vessels» per il Carrozziere. L'**Architetto** non ha nucleo: il suo
   prompt è `architect.md`, il testo che stava dopo `<!-- strutture -->`, carattere per carattere (il suo sistema non cambia, 5 603 token
   prima e dopo; con T397 Opus vi è passato 11 volte su 12). Qui si sposta ciò che c'era; le istruzioni nuove dei mestieri sono di T470 (S4),
   i cicli, `<pieces>`, `wfc` e le cantine dell'Architetto di T469 (S3). **La vetrina esce** (`schermo-scritte`, `schermo-struttura`,
   `circuito-3D`: tre programmi dello studio che lo Scultore non riceve, T467); i colori traslucidi che solo lei nominava tornano con T469.

3. **Le note del prompt e le sue sezioni segnate.** Una riga che è solo un commento HTML, fuori da un blocco di codice, è una nota per chi
   modifica il prompt e non arriva al modello (`withoutNotes`; i commenti dentro i pezzi di programma restano). Sotto un titolo del nucleo,
   la nota `<!-- sculpting: … -->` (`SCULPTING_MARK`) toglie la sezione a un'azione, la nota `<!-- files: … -->` (`FILES_MARK`) la dà solo
   dove `models/` ha tileset, campioni o regole da leggere (`libraryResources`): i nodi che leggono file (`wfc`, `convchain`, `<import>`) non
   vanno più a chi non può usarli. Il nucleo lo modifica il master come ogni prompt; i segni sono parole del formato, in inglese.

4. **L'ordine del sistema tiene la cache.** Il sistema è il nucleo (o il prompt dell'Architetto), i principi del Concilio, il blocco
   «Lingua», la guida di stile, poi la sezione del mestiere, poi gli esempi (`systemOf` in `src/kernel/agents/council.ts`: lo stesso testo
   di prima, le parti unite da una riga vuota). Due mestieri sullo stesso modello leggono dalla cache lo stesso prefisso (il nucleo e ciò che
   lo segue, circa 3 600 token); dentro un mestiere anche la sezione. La chiamata dice dove finisce ogni parte stabile (`TextCall.cacheBreaks`):
   **su OpenRouter**, dove i modelli di Anthropic mettono in cache solo ciò che è segnato (`cacheSystem`), il sistema va in parti di testo con
   `cache_control` alla fine di ognuna (`systemParts`: il comune, la sezione, gli esempi; al più `MAX_CACHE_MARKS`, quattro, i primi tre e
   l'ultimo tenuti; una parte di soli spazi va con la seguente; ciò che segue l'ultima parte stabile, un focus, senza segno), invece di un
   segno solo in fondo. Lo studio ne proponeva due (il comune, la specialità): sono tre perché gli esempi cambiano con la classe dentro un
   mestiere, e la sezione resta in cache anche quando cambiano. Gemini ha la cache
   implicita e ignora i segni; il varco passa `messages` com'è. **Il direttore** (`ModelDirector.missing()`) mette in fila per specialità ciò
   che manca (`bySpecialty`): dopo le case comuni, prima il mestiere scolpito per ultimo, poi gli altri a gruppi, ognuno dove compare la sua
   prima richiesta; la generazione differita segue la stessa fila.

5. **L'azione** legge il nucleo senza le sezioni per scolpire (la palette, i nodi che guardano avanti, come scolpire bene: usa le lettere del
   modello finito) e la sezione del mestiere del suo modello, che il kernel sa dalla classe e dalla taglia della voce (`ActionRequest.taglia`);
   per una struttura che cresce a regole la sezione del Capomastro, non il metodo di una composizione intera.

6. **Il ripiego per gli universi di prima.** Un universo il cui `prompts/agents/sculptor.md` non ha il segno del nucleo (uno che l'ha
   riscritto, o uno a cui il seme non è arrivato) lo riceve com'era: il prompt intero con ogni classe e le taglie per ogni mestiere e per le
   azioni, la parte dopo `<!-- strutture -->` per l'Architetto, nessuna sezione (le sezioni arrivano dal seme come file nuovi e nessuno le
   legge). Uno che non l'ha toccato riceve il nucleo e le sezioni dal seme (`upgradeFromSeed`). Una sezione che l'universo non ha manca e basta;
   l'Architetto senza il suo file legge il nucleo.

7. **La specialità nel registro dei consumi.** Ogni chiamata che la dice la porta nel registro (`CallRecord.specialty`: Gemini, OpenRouter,
   la coda degli abbonamenti), e `world/usage.json` conta ogni specialità a parte (`specialties`: giorno → specialità → conteggio,
   `UsageLog.specialties`; solo dove una chiamata l'ha detta, così ogni altro file resta com'era): T473 (S7) misura i mestieri con questo.

8. **Gli esempi** (T467, S1): un modello scritto a mano della classe e, se c'è, il migliore dell'universo della stessa classe, taglia e densità
   con voto dell'Artista ≥ **6** (`EXAMPLE_SCORE`, la soglia dell'autore del 21/11), scelti senza chiamate e sempre gli stessi per la stessa
   libreria; mai dello studio, della vetrina, una parte del seme, un programma che cresce a regole a una classe a scatola sola; all'Architetto
   idiomi e mai programmi interi. **Un modello portato con le carte (ADR-0170) vale per il voto che porta da dove è nato**, non più secondo
   perché portato: questo cambia il punto 7 di ADR-0170.

9. **Le parti del mondo** (T471 e T472, S5 e S6): programmi `models/part-<nome>.xml` di una specialità, col contratto nel primo commento come le
   parti del seme, che i modelli della stessa specialità includono con `<import>` invece di riscriverli. Prima scritte a mano nel seme (la
   ruota, la finestra, l'anta), poi estratte dallo Scultore da un suo modello buono (voto ≥ 6) e prese solo se il modello riscritto con
   l'`<import>` dà la stessa griglia, voxel per voxel, su tre semi. Non includono niente, non cambiano e non si cancellano finché qualcuno le
   include (una versione nuova è un nome nuovo), viaggiano con le carte che le includono; `partResources` le offrirà per specialità. Questo
   ADR dice il nome e le regole; il codice è di quei task.

## Conseguenze

- Kernel **0.10.16**: il contratto non cambia (nessun formato si rilegge diverso; `specialties` in `world/usage.json` è un campo in più che
  si scrive solo dove serve). Cose nuove in `src/kernel/agents/sculptor.ts` (`SculptorSpecialty`, `SPECIALTIES`, `SPECIALTY_NAMES`,
  `SPECIALTY_CLASSES`, `specialtyOf`, `requestSpecialty`, `sculptorRole(files, specialità)`, `sculptorSection`, `sectionPath`, `hasCore`,
  `CORE_MARK`, `SCULPTING_MARK`, `FILES_MARK`, `promptSections`, `withoutNotes`), `systemOf` in `council.ts`, `TextCall.cacheBreaks` e
  `specialty`, `systemParts` e `MAX_CACHE_MARKS` in `openrouter.ts`, `CallRecord.specialty` e `UsageFile.specialties`, `bySpecialty` nel
  direttore; i file `universe/prompts/agents/sculptor/{landscaper,joiner,tailor,figurist,mason,architect,coachbuilder}.md`;
  `tests/sculptor-specialties.test.ts`.
- La misura (`prompt-tokens.ts -- --scultore --conta --universi … --prima misure-s1.json`, `docs/design/scultori-specializzati/misure-s2.md`):
  il nucleo è 2 856 token (il nucleo delle azioni 1 473), le sezioni 172-646; il sistema di ogni richiesta che non cresce a regole scende di
  1 705-2 179 token (1 755 in media pesata), quello di un'azione di 3 563, quello dell'Architetto resta 5 603; ciò che non serve ancora è
  0-173 token a richiesta (le righe delle altre classi dello stesso mestiere, le taglie a chi ha quella della classe, la tinta a chi non è
  tinto). In dollari: 0,035 $ in meno per ora di gioco oggi, 0,052 $ dall'1/12, come lo studio prevedeva; meno di un centesimo per Genesi.
- Lo spazio liberato è per T470 (S4: fino a 400-800 token di istruzioni per mestiere, che costerebbero ancora meno di prima) e T469 (S3).
  Non è provato che le specialità facciano programmi migliori: è la prova pagata T473 (S7).
- Ogni prompt in più file: il nucleo e le sezioni stanno nell'edificio del Concilio dello studio, come gli altri prompt.
- Sicurezza: nessuna superficie nuova. I prompt sono file di `prompts/` dell'universo come prima (`allowedPath`), che il Concilio non scrive
  (`councilMayWrite`); i segni della cache passano nel corpo che il varco già lasciava passare (ADR-0205); il campo nuovo del registro dei
  consumi non va ai client (`world/usage.json` non è in `playerFiles` né in `publicFiles`).

## Alternative scartate

- **Otto agenti**: otto righe di `CENSUS`, otto voci di `AGENTS`, otto gerboa, otto manopole e otto sezioni delle direttive per un prompt che
  cambia e niente altro.
- **Un prompt per classe**: tredici prompt quasi uguali; le classi di un mestiere si somigliano, e la cache avrebbe tredici prefissi.
- **Il nucleo anche all'Architetto**: 2 856 token in più a ogni blocco di una struttura (tre chiamate su Opus) e un prompt diverso da quello
  con cui Opus è passato 11 volte su 12; l'elenco dei nodi che gli manca lo porta T469, compatto.
- **Le sezioni dei file come file a parte**: una nota sotto il titolo del nucleo tiene il nucleo in un file solo e nello stesso ordine.
- **Il forte intero come esempio** (10 354 token, la copia di T337, i merli di T434) e **parti generate senza il controllo della stessa
  griglia** (una parte che nessuno ha provato in un modello), come proponeva lo studio.
