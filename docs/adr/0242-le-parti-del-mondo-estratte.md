# ADR-0242 — Le parti del mondo estratte da un modello buono: la stessa griglia, il nome del programma, il viaggio con le carte

Data: 2026-11-22 · Stato: accettato (task T472 del backlog, S6 dello studio T458, step 44) · Riferimenti: ADR-0239 (lo Scultore a specialità e
le parti del mondo, punto 9), ADR-0241 (le parti dei mestieri, la via A), ADR-0171 (`<import>`), ADR-0176 (i tetti del mondo), ADR-0142 (il
motore deterministico), ADR-0056 e ADR-0195 (le carte e il loro costo), ADR-0170 (le carte portate), ADR-0172 (le carte guaste), ADR-0068
(il clone), ADR-0216 (la rigenerazione dei modelli), ADR-0161 (le carte fatte a mano), ADR-0110 (il mondo che non tace), ADR-0136 (la versione
del kernel), lo studio [`docs/design/scultori-specializzati.md`](../design/scultori-specializzati.md) § 4.3-4.4 e § 6 (S6)

## Contesto

ADR-0239 (punto 9) ha dato il nome e le regole alle **parti del mondo**: programmi `models/part-*.xml` di una specialità che i modelli dello
stesso mestiere includono con `<import>` invece di riscriverli. T471 (ADR-0241) ne ha scritte tre a mano nel seme, uguali in ogni universo. Lo
studio (§ 4.3, via B) proponeva che lo Scultore ne **estraesse** una da un suo modello buono, presa solo se il modello riscritto con
l'`<import>` desse la stessa griglia su tre semi, con la soglia del voto dell'autore (6, come gli esempi di T467). Restavano da decidere la
forma della risposta, il nome di una parte, che cosa vuol dire «la stessa griglia», l'immutabilità, la carta, il viaggio con le carte portate.

Due misure prima del codice: un `<import>` al posto di un tratto di nodi di una `<sequence>` compila lo stesso albero nel suo posto e consuma
lo stesso caso: 54 programmi del seme, un tratto finale e uno di mezzo, con i `values` nell'ordine di prima o rovesciati, con e senza la
simmetria della radice, danno la stessa griglia voxel per voxel su sei semi; dentro un `<markov>` no: 9 prove su 32 (16 tratti di nodi, con una `<sequence>` o un `<markov>` attorno) cambiano la
griglia (il ciclo riparte dal primo figlio, T469). E il controllo delle carte portate (`handmadeProgramErrors`) compilava senza i file che un modello
include: una struttura con `part-door` non si poteva portare.

## Decisione

1. **Il compito `model.part`** (lo Scultore, nel censimento con la manopola `models`, una carta del mondo: `CARD_MAKERS`, `COMMON_TASK`;
   lento come `model.sculpt` per la coda degli abbonamenti). Lo Scultore **non riscrive** il programma: riceve il modello con le righe
   numerate (`numberedLines`) e risponde con poche righe di XML, `<part name="…" lines="A-B" reads="…" writes="…">il contratto</part>` o
   `<none/>` se niente vale la pena (`readPartAnswer`); il **kernel** scrive la parte e il modello (`composePart`, `src/kernel/worldparts.ts`):
   le righe A-B così come sono, intere e nodi uno dopo l'altro, in una radice (`<markov>` se stavano in uno, altrimenti `<sequence>`) coi
   `values` della griglia su cui scrivono e i colori del modello delle sue lettere e le unioni delle griglie attorno; il contratto in cima,
   con «Reads: … Writes: …», poi da dove viene; il modello con `<import file="<id>"/>` al loro posto. Mai le righe di un'animazione, di
   un'azione o di una sezione indossata, niente che includa o legga un file, nessuna delle lettere che le parti del seme tengono (`S`,
   `#90`-`#97`), le lettere scritte disegnate nella griglia. Così la risposta costa poche centinaia di token invece di un programma intero, e
   niente si ricopia male. La richiesta (`partPrompt`, in inglese) va sul modello che ha scolpito la cosa, col nucleo e la sezione del suo
   mestiere nel sistema (lo stesso prefisso che la cache tiene per le sue sculture) e le parti che il mestiere ha già; ciò che non passa torna
   una volta col motivo (`extractPart`, `src/kernel/agents/parts.ts`).

2. **Quando.** Il direttore dei modelli la chiede subito dopo un modello che entra con voto dell'Artista ≥ `EXAMPLE_SCORE` (6), solo mentre
   scolpisce coi modelli (i locali non scrivono parti: offline rispondono `<none/>`, `MockAiModels.parts` per i test), di un mestiere che non
   sia le azioni, con meno di `WORLD_PARTS` (4) parti, chiesto meno di `PART_TRIES` (2) volte nella sessione (un `<none/>` conta), con la
   manopola dei modelli sopra 0 e un universo che si scrive (`ModelDirector.partWanted`, `part`). Una parte non è una mancanza: ciò che va
   storto lo dice il registro del Concilio, non `world/shortfalls.json`.

3. **La stessa griglia** (`sameGridErrors`, chiamata da `Kernel.addWorldPart`): il modello com'è nella libreria e quello riscritto girano come
   li gira il mondo (`Forms.request`, senza l'interno) su ogni seme che il mondo dà loro, tre almeno (`PART_SEEDS`; `seedsOf`: le persone
   otto, le strutture i loro semi), e vogliono la stessa lettera in ogni voxel (i codici possono cambiare, le lettere no), lo stesso aspetto di
   ogni lettera (colore, nascosta, luce, trasparenza, area), le stesse azioni e, provate una volta sul primo seme, la stessa griglia ancora. Fra
   un giro e l'altro il ciclo gira (`pause`): i giri di una struttura sono secondi, e un mondo di molti non deve tacere (ADR-0110). Con la
   parte, il **validatore** la prova come parte (`worldPartModelErrors`: il testo di `worldPartErrors`, compila da sola nella scatola della sua
   classe entro i tetti del mondo e da sola finisce; ciò che disegna da sola non conta) e il modello riscritto come modello coi file che leggerà
   (`validateFile(…, { files })`); il gancio `modelPart` gli dice quali file sono parti senza che glielo si dica.

4. **Il modello riscritto entra al posto di quello di prima**, nello stesso commit del Concilio della parte: è la stessa griglia su ogni seme
   del mondo, è il primo uso della parte, e come esempio (T467) insegna allo Scultore a includerla. Una parte coi nodi di una che c'è già (le
   stesse righe di un altro modello) non si scrive due volte: il modello include quella (un commit del solo modello, nessuna carta nuova).

5. **Il nome** è del programma: `part-<parole del nome>-<hash del testo>` (`worldPartId`, `WORLD_PART_RE`; una parte del seme non finisce
   mai così), e la voce dell'indice dice `part: true`, che scrive solo il kernel, la specialità, `from` (il modello da cui viene), l'autore e il
   voto del modello (`isWorldPart`). **Una parte del mondo non cambia**: `addModel` non la riscrive (una versione nuova è un'altra parte, con
   un altro nome), la rigenerazione dei modelli non la tocca (`kernelModel`), e una portata non si toglie dalla console finché un modello la
   include (`removeCard`, `partUsers`); quando nessuno la include più resta, o si toglie come ogni carta portata. L'editor del master resta suo
   (regola 3).

6. **La carta.** Una parte è una carta del mondo (`model.part`), del pagante del modello da cui viene (il suo `payer`), col costo delle
   chiamate che l'hanno fatta (`usd`, ADR-0195); i modelli che la includono sono i suoi utilizzi: un modello usato in un luogo, in una trama, in
   una richiesta conta un uso anche per le sue parti (`Kernel.withParts`).

7. **L'offerta.** `worldPartResources(files, specialità, posto)` dà alla richiesta del mestiere le sue parti del mondo, le più votate prima,
   al più `WORLD_PARTS` e ciò che `MAX_PARTS` lascia dopo quelle del seme, una riga ciascuna col modello da cui vengono e il contratto, dopo la
   riga `WORLD_PARTS_LINE`; `partResources` resta delle parti del seme. Un universo senza parti del mondo chiede allo Scultore come prima,
   carattere per carattere.

8. **Il viaggio con le carte** (ADR-0170): lo store legge dal disco dell'universo d'origine ciò che una carta include (`includedFiles`, la
   chiusura degli `<import>`, dei file di regole, dei tileset e dei campioni, mai oltre i file e i caratteri che un programma del mondo legge,
   `WORLD_NODE_LIMITS`: oltre, la carta non entra); **viaggia solo una parte del mondo con la sua carta**, che non
   include niente e non legge file (`worldPartErrors`), con la sua voce (`broughtEntry` tiene `part`, la specialità e `from`; il titolare il
   master, un anello in più nella catena) e il suo programma; ciò che non è una parte non viaggia: ciò che la carta legge del seme si legge
   dall'universo che la riceve, e se lì non c'è la carta non entra; una carta che include un'altra carta che non è una parte non entra, una
   parte da sola nemmeno (`kinCards` non le elenca), una parte già lì con un altro programma ferma la carta. Il controllo del programma riceve
   quei file (`HandmadeProgram.files`, letti di nuovo da `programFiles`: nomi semplici di `models/`, entro i tetti del mondo), così una
   struttura con le parti del seme ora si porta. Le carte fatte a mano non leggono file (ADR-0161), come prima. **Il clone** copia tutto: le
   parti e chi le include restano, e la carta di ogni parte ha un anello in più come le altre (`inheritCards`).

9. **Le azioni** che il viandante insegna a un modello (`sculptAction`, `checkAction`) e il tornio della galleria (`latheExecute`) leggono i
   file che il modello include: prima un modello con un `<import>` non imparava azioni.

## Conseguenze

- Kernel **0.10.19**: il contratto non cambia (i campi nuovi dell'indice, `part` e `from`, si leggono senza fidarsi e un universo di prima non
  li ha). Cose nuove: `src/kernel/worldparts.ts`, `src/kernel/agents/parts.ts`, `Kernel.addWorldPart`, `worldParts`, `withParts`,
  `ModelDirector.partWanted` e `part`, `worldPartResources`, `worldPartsOf`, `WORLD_PARTS_LINE`, `worldPartModelErrors`, `Validator.modelPart`,
  `programFiles`, `mockPart`, `GOOD_MODELS` e `PARTS_PER_HOUR` nella stima dell'ora; `tests/world-parts.test.ts`, un caso in più di V-033
  (`tests/sicurezza/carte-portate.test.ts`), `lab/scripts/parti-mondo.ts`.
- Le misure (`lab/scripts/parti-mondo.ts --conta`, [`misure-s6.md`](../design/scultori-specializzati/misure-s6.md), `countTokens`, senza
  chiamate): lo Scultore locale taglia una parte da 16 dei 54 programmi del seme che sono cose del mondo e **tutti e 16 danno la stessa griglia
  su ogni seme del mondo**; la richiesta di `model.part` è di 7 035 token in media, 4 820 di sistema (il prefisso delle sculture dello stesso
  mestiere), circa 8 millesimi di dollaro; la riga di una parte nelle richieste del suo mestiere 71 token (i contratti dello Scultore locale
  sono corti: uno vero arriva a 250). Nell'ora della lobby (al più 4 richieste, il 40 % dei modelli con voto ≥ 6): 0,034 $ oggi, 0,047 $
  dall'1/12, l'1 % dell'ora; zero quando i mestieri hanno le loro parti.
- Un universo senza parti del mondo: nessun prompt cambia; le richieste in più sono al più due per mestiere a sessione, nelle prime sessioni.
- Non provato: che lo Scultore vero scelga righe che servono ad altre cose del suo mestiere (non una sola), che le includa coi modelli veri, e
  quante parti passino il controllo coi programmi di Gemini o di Opus: è una prova pagata come T473. La rigenerazione dei modelli non estrae
  parti (le sue richieste offrono quelle che ci sono).
- Sicurezza: nessuna superficie nuova verso i client. Le parti sono file di `models/` che il Concilio scrive già (`councilMayWrite`) e passano
  dal validatore; il client dice ancora solo universo e modello di una carta, ciò che viaggia lo legge lo store dal disco (V-033, esteso), e il
  processo del controllo riceve testi del disco coi nomi e i tetti di un programma del mondo.

## Alternative scartate

- **Lo Scultore riscrive il modello intero con l'`<import>`**, come proponeva lo studio: il programma intero in uscita (3 000-12 000 token,
  su Opus fino a 0,30 $ per una struttura) e una copia che sbaglia una riga; le righe e il kernel che le sposta danno la stessa parte con la
  stessa prova.
- **Una parte con la sua scena di prova**, come quelle del seme: lo Scultore dovrebbe scrivere anche una scena da un'origine che non sia `S`;
  la prova vera è il modello da cui viene, sulla stessa griglia, e il validatore la prova da sola solo perché compili e finisca.
- **Il modello di prima resta e la parte aspetta un altro modello**: la parte nascerebbe senza un uso, non viaggerebbe con la carta del suo
  modello, e l'esempio non insegnerebbe a includerla.
- **Il nome scelto dallo Scultore**: due universi potrebbero avere due parti diverse con lo stesso nome; col testo nel nome la stessa parte ha
  lo stesso nome ovunque, e una versione nuova uno nuovo.
- **Un controllo su tre semi soli**: le persone hanno otto semi nel mondo; si provano tutti quelli che il mondo dà, tre almeno.
- **Portare ogni file che la carta legge**: le parti del seme sono in ogni universo e cambiano col seme; ciò che non è una parte del mondo si
  legge dove la carta entra, e un'altra carta inclusa resta una carta da portare da sé.
