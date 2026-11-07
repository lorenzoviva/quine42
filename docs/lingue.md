# Il gioco in quattro lingue: il progetto (T239, Step 36)

> Stato: **proposta**, decisa in parte dall'autore il 05/11 (D34): la **C** del §2, l'**inglese come lingua interna** subito (§3, ADR-0153,
> [`lingua-interna.md`](lingua-interna.md), step 42), le **rune in latino**, i **prompt in inglese** (P2, §4), il filtro della quarta parete su
> mondo + italiano + inglese. Il resto (§5-§10) è il piano di T239, in Fase III. I numeri vengono da
> [`lingue-censimento.md`](lingue-censimento.md), generato da `npx vite-node lab/scripts/censimento-lingue.ts`.
> L'autore (04/11): è l'ultima operazione della Fase III, perché obbliga a quadruplicare ogni modifica che tocca la lingua.
> Questo documento serve a farla una volta sola e a farla costare il meno possibile dopo.

Lingue: **italiano** (oggi l'unica lingua dei mondi; la lingua interna diventa l'inglese, ADR-0153), **inglese** (la versione di punta sui social), **francese**, **spagnolo**.
Sono le quattro che l'autore sa verificare: la verifica umana è il collo di bottiglia, non la traduzione.

## 1. Ciò che c'è da tradurre, in cifre

| cosa | parole (una lingua) | dove | si traduce? |
|---|---:|---|---|
| UI del gioco (`src/ui/`, `src/master.ts`, `index.html`) | ≈ 3.400 | `src/ui/*.ts`, `index.html` | sì, a dizionario |
| Sito (`site/`, notizie comprese) | ≈ 2.400 | `site/*.html`, `site/*.ts` | sì, a pagina per lingua |
| Messaggi del kernel (feed, giudizi, errori verso il viandante) | ≈ 5.900 | `src/kernel/*.ts` | in parte: quelli che il viandante legge |
| Frammenti di prompt nel codice degli agenti | ≈ 6.500 + 1.200 di template | `src/kernel/agents/*.ts`, `fourthwall.ts`, `themes.ts` | **no** (vedi §4) |
| Prompt degli agenti del seme | 6.076 | `universe/prompts/agents/*.md` | **no** (vedi §4) |
| Seme del mondo: canone, lessico, bibbia, tema, manifest, Lua | ≈ 3.600 | `universe/world/`, `universe/modules/` | sì, una volta, come seme per lingua |
| Modelli e suoni: nomi in `models/index.json` | ≈ 2.800 | `universe/models/` | solo i nomi mostrati; i commenti no |
| Risposte dei modelli offline (`MockAiModels`) | ≈ 1.400 | `src/kernel/ai/mock.ts` | sì: offline il mondo deve parlare la sua lingua |
| Server (messaggi d'errore, configurazione) | ≈ 800 | `server/` | solo ciò che arriva a una pagina |

Totale del censimento: **34.064 parole per lingua** (26.773 di testi, 7.291 di prompt), **102.192** per le tre lingue nuove.
Ciò che **non** si traduce per lingua: **3.849 identificatori italiani** che il codice confronta per nome, **212 nomi di campo** su disco,
**28.049 parole di commenti** (Lua e XML). Con D34 passano **una volta** all'inglese, la lingua interna, uguale in ogni universo (T307a-T309,
[`lingua-interna.md`](lingua-interna.md)): non si moltiplicano con le lingue. Se si tolgono i prompt (§4) e i commenti, il giocatore legge
≈ 21.000 parole: la cifra che conta per la verifica dell'autore.

Il dato nuovo del censimento, il più importante: **83 espressioni regolari** leggono parole italiane in testi scritti dai modelli o dal
giocatore (le attività dalle routine, i legami di parentela, il filtro della quarta parete, le classi dei modelli dall'aspetto, le
missioni). In un'altra lingua non danno errore: **tacciono**, e il mondo perde coerenza senza che un test se ne accorga. Sono la parte
difficile del lavoro (§5).

## 2. Lingua per universo o per viandante

| alternativa | come | pro | contro |
|---|---|---|---|
| **A. Lingua per universo** | `universe.json → lingua` scelta alla Genesi e fissa, come `partita` | un solo testo per ogni cosa del mondo; il Concilio scrive in una lingua; costo dei modelli invariato; nessun conflitto nel grafo, nei nomi, nel lessico | in multigiocatore un francese in un mondo italiano legge l'italiano |
| B. Lingua per viandante | ogni testo del mondo generato in 4 lingue, o tradotto al volo per chi lo legge | ognuno legge la sua lingua | ×4 i token d'uscita del Concilio, o una chiamata in più per ogni battuta; nomi e dialoghi che divergono tra le lingue; il filtro della quarta parete su 4 testi; la regola 0 da verificare 4 volte |
| C. Misto (proposta) | **A per il mondo, la lingua del viandante per l'interfaccia** | il menu, l'HUD, il sito, la lobby sono nella lingua di chi gioca; il mondo nella sua | due lingue a schermo per chi sceglie un mondo straniero (è anche il fascino di un mondo straniero) |

**Decisa: C** (D34). La lingua del mondo è una proprietà dell'universo come il seme e il tema: la sceglie il master alla Genesi, non cambia
più (cambiarla vorrebbe dire riscrivere bibbia, persone, trame, ricordi: un altro universo, cioè un clone). La lingua dell'interfaccia
è del viandante: dal browser (`navigator.language`) al primo avvio, poi dal profilo; non va mai al server se non come preferenza del
profilo del sito. Le sessioni del sito mostrano la lingua di ogni universo, con una bandierina, così chi entra sa cosa leggerà.

Facoltativo, dopo: l'**Attore** (ADR-0116) può rispondere nella lingua del viandante quando il master lo permette (`ai.lingueOspiti`):
costa solo ciò che l'Attore costa già, ma i ricordi dell'individuo restano nella lingua del mondo. Da non fare al lancio.

## 3. Identificatori invarianti, etichette localizzate

**Decisa (D34, ADR-0153):** la **lingua interna è l'inglese**, non l'italiano come proponeva questa pagina. Ogni identificatore che il
codice, Lua, i manifest o il protocollo confrontano per nome è inglese e uguale in ogni lingua; ciò che si mostra passa da un'etichetta.
Il passaggio dall'italiano di oggi si fa **una volta**, prima della beta, con le migrazioni di ADR-0117 (un contratto per passo, T307a-T308b):
la tabella completa, dominio per dominio, è [`lingua-interna.md`](lingua-interna.md).

I domini letti dal codice (tabella completa nel censimento): 12 classi, 6 taglie, 19 tipi di effetto, 4 momenti, 4 «dove», 14 attività,
specie e generi, 2 usi dei suoni, 20 ambienti, 21 nomi di terreno, le azioni dei manifest, i token delle rune. In tutto ≈ 130 etichette
fisse: un file per lingua, `src/i18n/<lingua>/ids.ts`, con un test che le chiavi siano le stesse nelle quattro; le chiavi sono i nomi
interni (inglesi) di `src/kernel/internalNames.ts`, l'etichetta italiana è quella di oggi.

Casi particolari:
- **Token delle rune**: sono codice Lua che si esegue (regola 1 e il tappeto). I token di codice (`x`, `speed`) restano Lua; i token delle
  **rune magiche** diventano **latini** (D34): `lux`, `ignis`, `aqua`, `terra`, `vita`, `scutum`, `ventus`, uguali in ogni lingua. Il nome
  della runa (`Sowilo`) e la sua descrizione sono testo del mondo e seguono la lingua dell'universo. Un giocatore inglese scrive `ignis`
  come uno italiano: una parola del codice e della magia, non della sua lingua. Va detto nel canone di ogni lingua.
- **Il lessico** (`bonombo`, `macico`, `lerpio`, `pagosso`, `Ciok Ciok`): parole inventate, **uguali in tutte le lingue**. È un punto di
  forza: il filo comune dei mondi attraversa anche le lingue. Si traducono solo le spiegazioni e le usanze del file.
- **Nomi dei terreni** (`prato`, `muro di pietra`): oggi sono insieme id e testo (`tileCode` del validatore li cerca per nome). Diventano
  un id più un'etichetta per lingua; il Cartografo li vede nella lingua del mondo e il validatore li risolve in tutte e due.
- **Nomi dei modelli** (`models/index.json → nome`) e **nomi delle carte**: testo del mondo, nella lingua dell'universo che li ha creati.
  Una carta clonata in un universo di un'altra lingua tiene il suo nome (come un'opera tiene il titolo originale).

## 4. I prompt del Concilio

Oggi ogni richiesta porta i `COUNCIL_PRINCIPLES` (2.048 caratteri, ≈ 512 token stimati) e il prompt del suo agente (da 236 a 2.112
token stimati), più i frammenti dei moduli `agents/*.ts`. Tre alternative:

| alternativa | costo una tantum | costo per richiesta | rischio |
|---|---|---|---|
| P1. Prompt in italiano + blocco «Lingua» (proposta, non scelta) | ≈ 40 righe | + ≈ 30 token (una riga: «Scrivi ogni testo del mondo in inglese; gli id restano quelli dello schema») | gli esempi italiani dei prompt possono trapelare nell'uscita: lo misura il validatore (sotto) |
| **P2. Prompt in inglese come unica fonte** (decisa, D34) | tradurre 13.800 parole (prompt + frammenti) e riverificare tutto il comportamento del Concilio | − 10/20 % di token d'ingresso (l'inglese si tokenizza meglio: **stima**, non misurata) | regressione su tutto ciò che il Concilio sa fare oggi; l'autore scrive i prompt in italiano |
| P3. Prompt in 4 lingue | ×4 ogni modifica di prompt | nessuno | è la quadruplicazione che l'autore vuole evitare: scartata |

**Decisa: P2** (D34): i prompt diventano inglesi, con il blocco «Lingua» che dice in che lingua scrivere il testo del mondo (T310). **Fatto** (T310, ADR-0165): il blocco è `languageBlock` in `src/kernel/language.ts`, 128 token; testi fissi −6,9 %, richieste intere −3,3 % (il contesto del mondo resta italiano); in una prova a pagamento nessun testo del mondo è uscito in inglese. Il rilevatore c'è (`detectLanguage`); il controllo nel validatore resta L4. Resta il
**controllo della lingua nel validatore**, che con P2 conta ancora di più (un modello con i prompt inglesi scivola in inglese): un rilevatore deterministico (parole funzionali delle quattro lingue,
lo stesso metodo di `isItalian` del censimento, spostato in `src/kernel/language.ts`) dice in che lingua è un testo generato; un testo
lungo nella lingua sbagliata torna all'agente col motivo, come ogni invalido (regola 2). Gli esempi dei prompt restano italiani, ma
il blocco «Lingua» dice che sono solo forme. T310 misura con una prova piccola quanti testi del mondo escono in inglese per sbaglio.

Il **costo in token** delle lingue nuove, per richiesta: P1 aggiunge ≈ 30 token d'ingresso su richieste di 1.000-3.000: **+1-3 %**. Le
uscite in inglese sono probabilmente più corte in token di quelle italiane (stima del 10-20 %, da misurare con il conteggio dei token di
Gemini in una prova a pagamento che questo task non fa); in francese e spagnolo simili all'italiano. Nessun moltiplicatore: con la
lingua per universo il Concilio scrive una volta sola.

### Il filtro della quarta parete (`META_RE`, regola 0)

`META_RE` è italiano dalla prima all'ultima alternativa (9 espressioni, ≈ 70 alternative), come `glossaryBreak` («significa», «vuol dire»).
**Fatto per l'italiano e l'inglese** (T310, ADR-0165: `META_PATTERNS`, `GLOSSARY_PATTERNS`, i prestiti solo nella loro lingua; francese e spagnolo li porta T239). Prima: in un universo inglese oggi **non filtra nulla**: è il rischio più grave di tutto il progetto, perché rompe una regola inviolabile senza
errori. Decisa (D34): **la lingua del mondo, l'italiano e l'inglese**, come proposto qui sotto (T310).
- `META_PATTERNS: Record<Lingua, string[]>` in `fourthwall.ts`, una tabella per lingua, scritta e verificata dall'autore (≈ 70 voci
  ciascuna); `metaBreak(text, words, lingua)`.
- Si applica **la lingua dell'universo, l'italiano (i prompt sono italiani e i modelli possono ripeterne le parole) e l'inglese (i modelli
  scivolano in inglese)**; non tutte e quattro sempre, perché i falsi positivi tra lingue sono reali: `programa` (es.) e `programme` (fr.)
  sono anche il programma di una festa, `code` (fr./en.) è anche il codice civile, `server` in inglese è anche chi serve a tavola, `bug` è
  un insetto. Ogni tabella ha le sue eccezioni, come oggi ha `programm[ai]\b`.
- I `COUNCIL_PRINCIPLES` diventano inglesi (P2), e la frase finale («di' calcolatore, trasmissione, calciatore») è per lingua: ogni
  lingua ha le sue parole vietate e le sue alternative. Un test per lingua: le frasi di prova di `tests/fourthwall.test.ts`, tradotte,
  vengono prese tutte, e venti frasi innocue per lingua non vengono prese.
- Il lessico è inventato e uguale in ogni lingua: `lexiconWords` non cambia; cambiano solo le forme di `glossaryBreak`
  (`means`, `signifie`, `significa`, `quiere decir`…).

## 5. Le 83 espressioni regolari che leggono l'italiano

| file | quante | cosa leggono | proposta |
|---|---:|---|---|
| `src/kernel/ai/mock.ts` | 22 | le richieste ai modelli offline | risposte offline per lingua (i modelli offline sono il mondo senza chiave: devono parlare la lingua dell'universo) |
| `src/kernel/society.ts` | 21 | attività dalla routine (`inferActivity`), legami (`padre|madre…`), `BINDING_WORDS` | **un id nello schema**: la routine ha già `azione`, i legami prendono un `tipo` tra gli id di `KINDS`; la regex resta come ripiego solo per l'italiano |
| `src/kernel/fourthwall.ts` | 9 | la quarta parete | tabelle per lingua (§4) |
| `src/mj/classes.ts` | 9 | la classe di un modello dall'aspetto | la classe la dice già lo schema dello Scultore; ripiego per lingua |
| `src/kernel/screens.ts` | 6 | lo stato dei lavori nella Direzione | testo della corona, solo del master: dizionario |
| `src/kernel/plots.ts` | 5 | legami citati nelle trame, rune nelle trame | schema con id (`coinvolti` già lo è); la regex delle rune per lingua |
| `src/kernel/agents/forge.ts`, `stamps.ts`, `atlas.ts`, `content.ts`, `kernel.ts`, `server/access.ts` | 11 | nomi di strutture, direzioni, oggetti | caso per caso: id quando c'è uno schema, tabella per lingua altrimenti |

Il principio è uno: **ciò che il kernel deve capire di un testo generato lo chiede come id nello schema**, non lo indovina dalle parole.
È anche più robusto in italiano.

## 6. Il seme in quattro lingue

Il seme (`universe/`) resta italiano e immutabile (regola 6). Proposta: `universe-lingue/<lingua>/`, una **sovrapposizione** con i soli
testi: `prompts/theme.md`, `world/canone.md`, `world/lessico.md`, `world/bible.json`, `world/style.md` e un file
`testi.json` che per ogni manifest dà i campi di testo per percorso (`"modules/object.well/manifest.json": { "name": "Well",
"description": "…", "actions[0].label": "Draw water" }`), così i manifest non si duplicano e fisica, id, spawn restano uno.
Il kernel la applica **alla creazione dell'universo** (`newUniverse`, la Genesi): il repository dell'universo nasce già nella sua lingua
e da lì è monolingue. Le quattro ambientazioni di `themes.ts` (ADR-0134) hanno un testo per lingua, scelto con la lingua del mondo.

Un test per lingua: la sovrapposizione copre tutti i campi di testo del seme (lo stesso elenco di campi del censimento), non cambia
nessun id e non rompe la quarta parete della sua lingua.

## 7. Migrazione senza rompere gli universi salvati

1. `universe.json → lingua` facoltativo; assente = `it`. `repairLanguage` nel validatore come `repairGameSetup`. Nessun universo esistente
   cambia un byte.
2. Nessun id, nessun campo, nessun messaggio del protocollo si rinomina. Il Lua generato non cambia (le API restano `world.say`…).
3. I dizionari dell'interfaccia hanno l'italiano come ripiego: una chiave che manca in inglese si mostra in italiano, e un test la segnala.
4. `playerFiles` e `publicFiles` (ADR-0109) non cambiano: la lingua dell'interfaccia non esce dal browser; `lingua` dell'universo è
   in `universe.json`, che ha già il suo elenco di campi: va nominata lì (regola 8f) se il client deve vederla.
5. Prova: gli universi del 20/10 e `valmora` (come T183) si aprono senza guasti con il kernel nuovo, e un universo inglese offline fa
   una Genesi senza fault né parole italiane nei testi del mondo (il rilevatore del §4 come test).

## 8. Come si verifica

- **Automatico**: parità delle chiavi dei dizionari (test); il rilevatore di lingua sui testi generati offline e su un campione dei
  testi del Concilio; le tabelle della quarta parete con le frasi di prova per lingua; la sovrapposizione del seme completa.
- **L'autore**: legge tutto ciò che il giocatore vede, una lingua alla volta. A ≈ 2.000 parole l'ora di revisione (stima di
  revisione, non di traduzione), ≈ 21.000 parole per lingua sono **≈ 10-11 ore per lingua, ≈ 32 ore per le tre**, più le tabelle della
  quarta parete (≈ 1 ora per lingua) e una partita offline per lingua.
- **Il costo della traduzione** (bozza fatta da un modello, rivista dall'autore): 34.000 parole ≈ 45.000 token d'uscita per lingua; con
  `gemini-3.8-flash` (3,75 $ per milione d'uscita, `prices.ts`) ≈ **0,20 $ per lingua**. Trascurabile: il costo vero è il tempo dell'autore.
- **Dopo**: ogni task che tocca un testo scrive le quattro chiavi; la pipeline può farlo da sola (bozza di un modello nelle tre lingue,
  una riga `- Lingue: da rivedere` nel task) e l'autore rivede a lotti. È la quadruplicazione, ridotta a una revisione periodica.

## 9. La documentazione e la pipeline (per T240, punto 7)

Documentazione, ADR, backlog e pipeline sono ≈ **397.000 parole** (tabella nel censimento), dieci volte il gioco. Tradurle non serve a
giocare. Se il lancio punta anche alla comunità dello sviluppo agentico, basta un sottoinsieme in inglese: un `README` della pipeline,
un riassunto degli ADR principali (ADR-0009, 0021, 0025, 0036, 0072, 0101, 0110, una pagina ciascuno), il kernel di `AGENTS.md`
(≈ 6.500 parole): ≈ 15.000 parole, ≈ 8 ore di revisione. Il pregresso resta italiano, ed è anche una storia vera da raccontare
(«398.000 parole di decisioni scritte da agenti, in italiano»).

## 10. Il piano, in task

| task | cosa | dipende da | stima |
|---|---|---|---|
| L1 | `src/kernel/language.ts`: `Lingua`, rilevatore, `repairLanguage`; `universe.json → lingua`; test di migrazione | — | piccolo |
| L2 | schema con id per routine, legami, classi (§5); le regex restano ripiego italiano | L1 | medio |
| L3 | `META_PATTERNS` per lingua, `glossaryBreak` per lingua, principi con le parole per lingua; frasi di prova | L1 | medio (+ revisione autore) |
| L4 | blocco «Lingua» nei prompt, controllo della lingua nel validatore | L1, L3 | piccolo |
| L5 | dizionari UI e etichette degli id (`src/i18n/`), `t()`; lingua dell'interfaccia nel profilo | L1 | grande (≈ 3.400 parole) |
| L6 | sovrapposizioni del seme `universe-lingue/{en,fr,es}`, temi per lingua, Genesi nella lingua scelta | L1 | medio (≈ 3.600 parole) |
| L7 | modelli offline per lingua | L2, L6 | medio |
| L8 | il sito in quattro lingue (pagine generate alla build, `hreflang`) | L5 | medio (≈ 2.400 parole) |
| L9 | verifica dell'autore e una partita offline nel browser per lingua | tutti | ≈ 35 ore dell'autore |

## Decisioni per l'autore

Risposte del 05/11 (D34):

1. **C** (§2): il mondo nella lingua del suo universo, l'interfaccia in quella del viandante.
2. **L'inglese come lingua interna, subito**, prima della beta (§3): la migrazione degli id e dei campi la fanno T307a-T308b, un contratto
   ciascuno (ADR-0153, [`lingua-interna.md`](lingua-interna.md)).
3. **I token delle rune magiche in latino**, uguali in ogni lingua; i token di codice restano Lua (§3).
4. **P2**: i prompt in inglese, con il blocco «Lingua» (§4, T310).
5. Il filtro della quarta parete sulla **lingua del mondo + italiano + inglese** (§4, T310).
6. La documentazione resta italiana, a parte il sottoinsieme in inglese del §9 (Fase III).
