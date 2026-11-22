# Gli Scultori specializzati: un prompt per mestiere, gli esempi, le parti condivise per universo (T458)

Data: 2026-11-21 · Step 44, Fase III · Richiesta: l'autore, 20/11 ([`docs/userchats/to-do-2026-11-20.md`](../userchats/to-do-2026-11-20.md) § 1:
«dividerle in scultori specializzati, per non sprecare crediti», il few-shot, i pezzi condivisi fra gli scultori della stessa specialità e
dello stesso universo, il ciclo `<markov>` del forte) · Nasce da T354 (ADR-0183), T434, T440 (ADR-0228) · Misure: [`scultori-specializzati/misure.md`](scultori-specializzati/misure.md)
e `misure.json`, accanto a questo file.

Niente codice del gioco: questo documento dice che cosa cambierebbe, perché, quanto costa e in che ordine; ogni fatto sul kernel di oggi
(0.10.13) è letto nel codice, col file. L'unico codice nuovo è una modalità del banco dei prompt, `lab/scripts/prompt-tokens.ts -- --scultore`
(§ 1.1). **Nessun modello è stato chiamato**: le richieste le hanno scritte i modelli locali, i token li ha contati `countTokens` di Gemini,
che è gratis. Niente da vedere nel browser.

## In breve

1. **Ogni richiesta dello Scultore per una cosa che non cresce a regole porta tutto il prompt generale (5 207 token), e un terzo non le
   serve**: da 1 600 a 2 100 token, il 17-31 % dell'ingresso della chiamata. Sono le righe delle altre classi (580), i capi da indossare
   (503), le navi (458), la vetrina di tre programmi che lo Scultore non vede (219), i nodi che leggono file che il seme non ha (134), la
   tinta (68). Un'azione («Altro…») usa 2 045 token del prompt su 5 207: il 43 % del suo ingresso è sprecato. Le strutture che crescono a
   regole ricevono invece solo il loro prompt (4 895): non c'è niente da togliere, ma non hanno né la palette né i nodi né i cicli.
2. **In dollari è poco**: 0,0007 $ a chiamata oggi, 0,001 $ dall'1/12, **0,03-0,05 $ per ora di gioco, il 2 % dello Scultore** (1,59 $ l'ora
   oggi, 2,75 $ dall'1/12, nella stima della lobby); meno di un centesimo per Genesi. L'uscita (3 000-7 700 token) e le strutture (tre
   chiamate da 20 000 token) pesano più dell'ingresso, e la cache implicita ne serve il 60 %. **Specializzare non si fa per risparmiare**: si
   fa perché ogni mestiere possa avere istruzioni più lunghe e più sue senza farle pagare agli altri, e perché la cache regga.
3. **Il few-shot c'è già, costa più di ciò che si toglierebbe ed è scelto male.** `examplesFor` mette nel sistema i primi due programmi della
   libreria della stessa famiglia: da 933 a 6 682 token a chiamata, 0,075-0,116 $ l'ora, il doppio dello spreco. Per un monumento c'è il totem
   della corona, per un capanno la fattoria procedurale (6 317 token), per una barca a vela la capsula del vuoto, per un animale il viandante.
   Sceglierli bene è la prima cosa da fare, e la più semplice (S1).
4. **Le parti condivise hanno già il loro meccanismo**: `<import>` delle parti del seme (ADR-0171, ADR-0182) col contratto nel primo
   commento (ADR-0183). Manca chi le scrive per un universo. La proposta: lo Scultore della specialità ne **estrae** una da un suo modello
   buono, e il kernel la prende solo se il modello riscritto con l'`<import>` dà la stessa griglia, voxel per voxel, su tre semi. Ha un nome
   che non cambia, una carta sua, e viaggia con chi la include.
5. **Il ciclo `<markov>` con l'uscita non è insegnato**: il prompt generale gli dà mezza riga, quello delle strutture niente; il forte
   dell'autore ne ha cinque, il resto del seme otto. Mancano anche `<pieces>` (tre nel forte), `map clear="False"`, `path longest` e i
   colori traslucidi, che compaiono solo nella vetrina. La guida costa 300-500 token nel prompt dell'Architetto; il ciclo del mastio come
   esempio ne costa 131.
6. **Sette task** (§ 6, S1-S7, da approvare) e un ADR proposto: **lo Scultore a specialità**, un agente con otto ruoli e non otto agenti,
   e **le parti del mondo**.

## 1. Quanto del prompt serve a ogni richiesta (a)

### 1.1 Come si è misurato

`npx vite-node lab/scripts/prompt-tokens.ts -- --scultore [--conta] [--universi <cartella>] [--md f] [--json f]`:

- una Genesi offline (`MockAiModels`, come i test) per avere una guida di stile vera nel contesto dello Scultore;
- una richiesta per ogni tipo di modello, scolpita con `sculpt` coi modelli locali: le tredici classi, una cosa tinta (`tinta`, le forme
  comuni), una indossata in testa (`worn`), una struttura media (che non cresce a regole), una grande civile e una fortificata (che crescono a
  regole), una nave, e un'azione (`sculptAction` su una credenza). Ogni chiamata è **registrata come va ai modelli**, e il sistema
  ricomposto dal banco (ruolo, principi, «Lingua», contesto, esempi, come `Council.write`) è controllato uguale a quello registrato;
- il sistema diviso nelle sue parti: le sezioni di `prompts/agents/sculptor.md`, e dentro alcune le righe che servono a un tipo solo (la riga
  di ogni classe, le taglie, gli arti, le persone, i nodi che leggono file), poi i principi, il blocco «Lingua», la guida di stile, gli
  esempi della libreria;
- ogni parte segnata come «serve» o «non serve» a quella richiesta. **Nel dubbio serve**: la palette, i nodi, `field` e `observe`,
  «How to sculpt well», le trappole servono a tutti. Quindi ciò che non serve è un minimo;
- i token con `countTokens` di Gemini (`--conta`: gratis, la chiave del `.env` della cartella principale; senza, 3,5 caratteri a token). Il
  prompt delle strutture fa 4 895 token, come misurato da T434. Su OpenRouter Opus ha un altro tokenizzatore: i numeri cambiano di qualche
  per cento, le proporzioni no;
- i dollari sul modello di ogni classe (`modelFor`: Flash-Lite le cose semplici, 3.8 Flash le figure, Argon tutto ciò che è costruito, le
  navi comprese; dall'1/12 su OpenRouter Opus 5.5, `sculptorsOn`), con la cache implicita che serve il 60 % del prefisso stabile
  (`IMPLICIT_CACHE_SHARE`, T325) tranne su 3.8 Flash (`NO_IMPLICIT_CACHE`);
- quanto pesa ogni tipo: i modelli che lo Scultore ha scritto nei cinque universi veri (aurora, mesa, neapolis, orichalcum, sidera; non
  quelli a mano né i suoni; una struttura che cresce a regole una volta per programma, non per taglia): 100 mobili, 91 oggetti (84 tinti, 4
  indossati), 75 persone, 71 edifici, 49 strutture grandi, 27 monumenti, 7 alberi, 5 strutture medie, 2 rocce, 1 animale; nessuna nave
  (T440 è del 20/11). Ogni tipo conta per le sue chiamate (due programmi per una cosa semplice, uno e mezza revisione per una figura o una
  cosa costruita, tre per una struttura che cresce a regole): 1,91 chiamate a modello;
- l'ora è quella della lobby (`hourlyEstimate`, HOUR, manopole a 1): 51 chiamate di «Modelli nuovi», 26,5 modelli; la Genesi sono i modelli
  che il mondo chiede dopo una Genesi offline (11: 4 forme tinte, 2 alberi, 2 rocce, un oggetto, una persona, un mobile; una Genesi con
  Gemini ne chiede circa il doppio, le 20 immagini dell'Artista che dice `CLAUDE.md`).

### 1.2 Le richieste

Dal rapporto ([`misure.md`](scultori-specializzati/misure.md)), in token:

| tipo | specialità proposta (§ 2) | modello oggi | sistema | di cui il ruolo | di cui esempi | richiesta | non serve | dell'ingresso |
|---|---|---|---:|---:|---:|---:|---:|---:|
| sasso, roccia, cespuglio, albero | Paesaggista | Flash-Lite | 7 140-8 143 | 5 207 | 1 226-2 229 | 47-56 | 2 102-2 113 | 26-29 % |
| oggetto, oggetto tinto | Mobiliere | Flash-Lite | 6 847 | 5 207 | 933 | 44-71 | 2 043-2 111 | 30-31 % |
| mobile | Mobiliere | Flash-Lite | 8 254 | 5 207 | 2 340 | 50 | 2 114 | 25 % |
| oggetto indossato | Sarto | Flash-Lite | 6 847 | 5 207 | 933 | 72 | 1 608 | 23 % |
| persona, animale, bestia | Figurinista | 3.8 Flash | 9 573-11 222 | 5 207 | 3 659-5 308 | 47-58 | 2 011-2 017 | 18-21 % |
| monumento, edificio, struttura media | Capomastro | Argon | 10 293-12 596 | 5 207 | 4 379-6 682 | 55-77 | 2 033-2 110 | 17-20 % |
| struttura grande, civile o fortificata | Architetto | Argon | 5 603 | 4 895 | 0 | 1 358-1 619 | 0 | 0 % |
| nave | Carrozziere | Argon | 7 928 | 5 207 | 2 014 | 334 | 1 625 | 20 % |
| azione («Altro…») | (le azioni) | Flash-Lite | 5 915 | 5 207 | 0 | 1 461 | 3 175 | 43 % |

Il resto del sistema è uguale per tutti: i principi del Concilio (507), il blocco «Lingua» (128), la guida di stile (73 nella Genesi offline;
in un mondo vero 150-400). La richiesta della struttura grande è il solo primo blocco: il secondo e le correzioni portano le viste in testo
e la traccia (le viste del forte fanno da sole 2 900 token; `STRUCTURE_SCULPT` di T397 dice 20 000 token a chiamata), che non sono del ruolo.

### 1.3 Le parti del prompt generale

| parte | token | chi la usa |
|---|---:|---|
| il nucleo: chi sei, coordinate, il programma, la palette, i pattern, i nodi, i figli `<in>`/`<out>`, `field`, `observe`, «How to sculpt well», le trappole | 3 068 | tutti (le azioni non la palette, `field`, `observe` né «How to sculpt well») |
| la riga di ogni classe | 38-69 l'una, 621 tutte | la sua |
| le taglie di D&D | 61 | chi ha una taglia che non è quella della classe |
| gli arti (`part="leg"`), le persone | 60 + 28 | le figure |
| «The colour of the thing» (la tinta `C`) | 68 | le cose tinte |
| `wfc`, `convchain`, i file di `models/` | 134 | nessuno nel seme: senza tileset né campioni la richiesta non elenca file (`libraryResources`) |
| la vetrina (`schermo-scritte`, `schermo-struttura`, `circuito-3D`) | 219 | nessuno: nomina tre programmi che lo Scultore non riceve |
| «Worn things» | 503 | le cose indossate |
| «Vessels» | 458 | le navi |
| **il prompt generale** | **5 207** | |

Il prompt delle strutture (dopo `<!-- strutture -->`, 4 895 token) serve tutto alle strutture che crescono a regole: la composizione
(1 199), la scala intera (869), ciò che entra (665), il metodo (584), le altezze (526), il forte come metro (288) e il resto. **Non ha
invece niente del prompt generale**: né la palette, né i pattern, né l'elenco dei nodi. Le strutture imparano i nodi dai pezzi di
programma della composizione, e `<markov>` non c'è.

### 1.4 Il risparmio

| via | $ a chiamata (media) | token tolti a chiamata | $ per Genesi (11 modelli) | $ per ora di gioco | dello Scultore l'ora | gli esempi di oggi, $ l'ora | lo Scultore l'ora (lobby) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Google, oggi | 0,0007 | 1 697 | 0,0071 | 0,034 | 2 % | 0,075 | 1,59 |
| Google, dall'1/12 | 0,0010 | 1 697 | 0,0071 | 0,051 | 2 % | 0,116 | 2,75 |
| OpenRouter, dall'1/12 | 0,0010 | 1 697 | 0,0071 | 0,051 | 2 % | 0,116 | 2,75 |

(Le due vie dall'1/12 costano uguale: Argon a 4 $ e Opus 5.5 a 4 $ al milione in ingresso, 0,2 in cache. Lo Scultore delle strutture
«performante» o «massimo», `ai.sculptorTier`, non cambia niente qui, perché le strutture non hanno niente da togliere.)

Perché così poco. Il 49 % delle chiamate pesate va a Flash-Lite, dove 1 000 token di prefisso costano 0,000115 $; le chiamate care sono
le strutture, che non hanno niente da togliere; e anche su Argon 2 000 token sono 0,0017 $ contro i 0,03 $ dei 3 000 token che escono. Nella
coda degli abbonamenti (la rigenerazione dei modelli, ADR-0216) i dollari sono zero e conta la finestra delle 5 ore: lì una chiamata dello
Scultore ha ricevuto fra 20 400 e 24 900 token, di cui 12 000 fuori cache, e ne ha scritti 7 700 (neapolis, orichalcum, sidera, `world/usage.json`):
2 000 token sono l'8-10 % dell'ingresso e il 7 % del totale.

**Che cosa vuol dire.** Togliere ciò che non serve vale da solo pochi centesimi. Vale di più lo spazio che libera: ogni mestiere può ricevere fino a 1 500 token di
istruzioni sue, che oggi non ci sono perché andrebbero in ogni richiesta, e costare ancora meno di oggi (§ 2.2). Conta anche spostare il
discorso sugli esempi, che pesano più dello spreco e non sono scelti per la loro qualità (§ 3). E conta il silenzio: un sasso non legge più
che `z o r m` sono lettere del kernel, una sedia non legge più dove va la linea di galleggiamento. Quanto questo valga in programmi che
passano e in voti dell'Artista non si misura offline: è la prova pagata S7.

## 2. Le specialità e i loro prompt (b)

### 2.1 Otto ruoli, un agente

| specialità (codice) | che cosa scolpisce | modello oggi · dall'1/12 su OpenRouter | ciò che tiene del prompt di oggi | ciò che aggiunge (proposta) |
|---|---|---|---|---|
| **Paesaggista** (`landscaper`) | `tree`, `bush`, `rock`, `pebble` | Flash-Lite · Flash-Lite | il nucleo, le sue righe; 3 243 | la crescita naturale (seme, crescita a caso, convoluzione), il vento (`animation: wind` della classe), le radici con `field` verso l'acqua, le famiglie di forma (chioma, tronco, masso) senza simmetrie perfette; ~400 |
| **Mobiliere** (`joiner`) | `furniture`, `object` (anche tinti) | Flash-Lite · Flash-Lite | il nucleo, le sue righe, la tinta; 3 215 | i contenitori e le azioni `open`/`close` coi segni nascosti, i ripiani dove si posa qualcosa (la faccia libera in cima, ADR-0150), ciò che si prende e si porta (`takeable`, ADR-0168), ciò che si impugna e da dove (la presa dalla forma, ADR-0167); ~500 |
| **Sarto** (`tailor`) | gli oggetti indossati (`worn`) | Flash-Lite · Flash-Lite | il nucleo, «Worn things»; 3 612 | le tre zone, i capi su corpi diversi (in piedi, a quattro zampe), il viso libero, i mantelli che cadono; più avanti gli abiti degli individui (ADR-0181); ~300 |
| **Figurinista** (`figurist`) | `person`, `animal`, `beast` | 3.8 Flash · 3.8 Flash | il nucleo, le righe delle figure, gli arti, le persone; 3 308 | gli arti come lettere distinte e il rig che il kernel ne fa (`src/mj/rig.ts`), la camminata, le quattro zampe, la testa grande (chibi), il muso verso y grande, la mano che tiene (`hold.ts`); ~500 |
| **Capomastro** (`mason`) | `building`, `monument`, `structure` sotto la Grande | Argon · Opus 5.5 | il nucleo, le sue righe, le taglie; 3 275 | le cose costruite in una scatola sola: porte, tetti, finestre come segni, basamenti, i materiali, la porta che si apre; dal prompt delle strutture ciò che vale anche in piccolo; ~600 |
| **Architetto** (`architect`) | `structure` dalla Grande (cresce a regole) | Argon · Opus 5.5 (o «performante», «massimo») | tutto il prompt delle strutture; 4 895 | i cicli (`<markov>` con l'uscita, § 5), `<pieces>` per la Gargantuesca, un elenco compatto dei nodi che oggi non riceve; ~800 |
| **Carrozziere** (`coachbuilder`; per le navi Maestro d'ascia) | `vessel`, e i veicoli di terra e del vuoto quando avranno una classe | Argon · Opus 5.5 | il nucleo, la sua riga, «Vessels»; 3 595 | per mezzo (`water`, `land`, `void`): lo scafo e la linea (oggi), le ruote e gli assi, il portello e il ponte di una capsula (ADR-0234); ~400 |
| (le azioni) | `model.action`, per qualunque classe | Flash-Lite · Flash-Lite | i pattern, i nodi, le trappole; 2 045 | la sezione della specialità del modello (le sue lettere e le sue convenzioni) |

Il codice ha già quasi tutto: la classe sceglie il modello (`categoryOf`, `modelFor`), la taglia sceglie il prompt delle strutture
(`procedural`), la richiesta dice tinta, zona e fortificazione. Una funzione `specialtyOf(cls, req)` le legge una volta, e
`sculptorRole(files, specialty)` mette insieme il nucleo e la sezione.

**Un agente, non otto.** Lo Scultore resta `sculptor`: una riga del censimento (`model.sculpt`, la manopola `models`), la sezione «Scultore e
Artista» delle direttive del master (ADR-0191), una postazione nello studio, un registro dei consumi. Otto agenti vorrebbero otto righe di
`CENSUS`, otto voci di `AGENTS`, otto gerboa, il permesso di ogni direttiva e una regola della lobby per ognuno, per un prompt che cambia e
niente altro. La specialità va nel registro come dato della chiamata, così che le misure di S7 la dividano. Nello studio, se l'autore
lo vuole, la casa dello Scultore ha i banchi dei mestieri, come la casa dell'Artista ospita il Musicista e lo Scenografo (ADR-0127,
ADR-0214): solo l'aspetto.

### 2.2 Il prompt di una specialità e quanto costa

Il prompt diventa il **nucleo** (`prompts/agents/sculptor.md`, i 3 068 token che servono a tutti) più la **sezione** della specialità
(`prompts/agents/sculptor/<specialità>.md`: ciò che oggi è nel prompt generale e serve a lei sola, più le istruzioni nuove della tabella). I
percorsi sono ammessi (`prompts/` a ogni profondità, `paths.ts`) e arrivano dal seme agli universi che non hanno riscritto i loro
(`upgradeFromSeed`). Un universo col prompt di prima, senza il segno del nucleo, continua come oggi: il prompt intero.

| specialità | oggi (ruolo) | proposta: nucleo e sezione, con le istruzioni nuove | differenza a chiamata |
|---|---:|---:|---:|
| Paesaggista | 5 207 | ~3 650 | −1 550 |
| Mobiliere | 5 207 | ~3 700 | −1 500 |
| Sarto | 5 207 | ~3 900 | −1 300 |
| Figurinista | 5 207 | ~3 800 | −1 400 |
| Capomastro | 5 207 | ~3 900 | −1 300 |
| Architetto | 4 895 | ~5 700 | +800 |
| Carrozziere | 5 207 | ~4 000 | −1 200 |
| azioni | 5 207 | ~2 500 | −2 700 |

In dollari, ai pesi del § 1.4: l'Architetto paga 800 token in più per tre chiamate a struttura, 0,004 $ su Opus. Gli altri ne pagano 1 200-1 550
in meno. Il conto dell'ora resta quasi uguale (−0,016 $ oggi, −0,021 $ dall’1/12) e il prompt di ogni mestiere ha il 10-20 % di istruzioni sue
in più.

### 2.3 La cache e l'ordine delle richieste

Oggi il prefisso uguale per tutte le cose che non crescono a regole è il ruolo, i principi, la «Lingua» e la guida di stile (circa 6 000
token). Gli esempi vengono dopo e cambiano con la famiglia. Se il ruolo di ogni specialità venisse per primo, il prefisso comune fra le
specialità sparirebbe. Perciò:

- **l'ordine del sistema**: il nucleo, i principi, la «Lingua», la guida di stile, poi la sezione della specialità, poi gli esempi. La cache
  di Gemini serve il prefisso comune a tutte (3 800 token circa) e, dentro una specialità, il resto;
- **su OpenRouter**, dove Opus mette in cache solo ciò che la richiesta segna (`cacheSystem` in `src/kernel/ai/openrouter.ts`, oggi un segno
  solo a fine sistema): due parti con `cache_control`, la fine del comune e la fine della specialità (Anthropic ne prende fino a quattro);
- **l'ordine del direttore**: `ModelDirector.missing()` in fila per specialità, così le chiamate che si seguono entro i cinque minuti della
  cache leggono lo stesso prefisso. La pausa fra due modelli (`modelGap`, 0 a manopola 1) non cambia.

**Fatto in T468 (S2, ADR-0239, kernel 0.10.16)**: le specialità (`specialtyOf`), il nucleo in `prompts/agents/sculptor.md` e le sezioni in
`prompts/agents/sculptor/<specialità>.md`, con ciò che c'era e nient'altro (le istruzioni nuove sono S4); l'Architetto col prompt delle
strutture di prima, carattere per carattere; la vetrina fuori; i nodi che leggono file solo dove `models/` ne ha (la nota `files`); l'azione
col nucleo senza le sezioni per scolpire (la nota `sculpting`) e la sezione del mestiere del suo modello; l'ordine qui sopra, con un segno
`cache_control` alla fine di ogni parte stabile su OpenRouter (il comune, la sezione, gli esempi: tre, non due, perché gli esempi cambiano con
la classe dentro un mestiere); `missing()` in fila per specialità, il mestiere scolpito per ultimo davanti; la specialità nel registro dei
consumi (`world/usage.json → specialties`); il ripiego del prompt intero per gli universi di prima. Il nucleo è venuto più corto del previsto,
2 856 token e non 3 068 (senza la vetrina, i nodi dei file, gli arti e le persone), il nucleo delle azioni 1 473; il sistema di ogni richiesta
che non cresce a regole perde 1 705-2 179 token, 1 755 in media, 0,035 $ l'ora oggi e 0,052 $ dall'1/12, come il § 1.4 prevedeva; ciò che non
serve ancora è 0-173 token a richiesta. Richiesta per richiesta, prima e dopo: [`misure-s2.md`](scultori-specializzati/misure-s2.md).

## 3. Il few-shot: quali esempi e quanto costano (c)

### 3.1 Che cosa c'è oggi

`examplesFor(files, classe)` (`src/kernel/agents/sculptor.ts`) dà allo Scultore, nel sistema, fino a due programmi della libreria della
stessa famiglia di classi: prima quelli scritti a mano, poi quelli venuti con le carte, poi gli altri, nell'ordine dell'indice. Alle
strutture che crescono a regole niente, apposta (T156, T337: un programma nel prompt viene copiato, e ogni concetto usciva lo stesso
edificio). Nel seme:

| richiesta | esempi di oggi | token | che cosa non va |
|---|---|---:|---|
| sasso, roccia, cespuglio, albero | `pebble`+`rock`, `rock`+`masso-muschioso`, `bush`+`cespuglio-con-bacche`, `tree`+`quercia` | 1 226-2 229 | niente: il generico della classe e un modello a mano |
| oggetto (anche tinto, anche indossato) | `object`, `forbici` | 933 | al Sarto nessun capo indossato (il seme non ne ha uno a mano) |
| mobile | `barile`, `falo` | 2 340 | un falò, che viene prima nell'indice |
| persona | `viandante`, `contadina` | 5 308 | il viandante è il corpo di chi gioca, circa 2 400 token da solo |
| animale | `animal`, `viandante` | 3 659 | una persona per un animale (la famiglia `animal → person`) |
| bestia | `beast`, `animal` | 4 022 | |
| monumento | `monument`, `corona-totem` | 6 682 | un modello della corona, dello studio e non del mondo, a 8 voxel per casella |
| edificio | `pozzo`, `building` | 4 379 | |
| struttura media | `structure`, `fattoria` | 6 317 | la fattoria è un programma che cresce a regole (T270): insegna il contrario della scatola sola |
| nave | `vessel`, `capsule` | 2 014 | la capsula del vuoto per una barca a vela |

Costano 0,075 $ l'ora oggi e 0,116 $ dall'1/12, il doppio dello spreco del § 1. Escludere ciò che non è del mondo (`corona-`, `schermo-`,
`circuito-`, `part-`, come fa già `reuseOptions` di `modeldirector.ts`) e i programmi che crescono a regole per le classi a scatola sola è
una correzione piccola, senza decisioni (S1).

### 3.2 I candidati

| esempio | token | per chi |
|---|---:|---|
| un modello a mano del seme della stessa classe | 400-2 600 | tutti tranne l'Architetto |
| il migliore dell'universo per voto dell'Artista, della stessa classe: `letto` (7/10, aurora) 845, `shape-blade` (7) 462, `caldaia-vapore` (7) 1 391, `contadina` (6) 1 449, `terreno-cactus-fitti` (6) 1 914 | 460-1 900 | tutti tranne l'Architetto |
| una struttura dell'universo, `struttura-bistrot-medium` (7/10, neapolis) | 4 609 | — (vedi sotto) |
| il forte dell'autore intero (`lab/mjx/models/handmade/forte-handmade.xml`) | 10 354 | nessuno |
| le sue viste in testo (`forte-v1-viste.txt`) | 2 894 | nessuno (il prompt lo descrive, ADR-0210) |
| i programmi del banco (`lab/banco/riferimento/`: forte, palazzina, tempio, cantiere, cantina) | 3 758-10 283 | nessuno |
| la villetta offline (`MOCK_STRUCTURE_PROGRAM`) | 4 441 | nessuno |
| **il ciclo del forte che allarga il mastio** (`<markov>` con l'uscita `z`) | **131** | Architetto (§ 5) |
| **il cortile a bracci che si fermano a caso** (il primo `<markov>` del forte) | **118** | Architetto |
| i piani del mastio, uno dopo l'altro finché una moneta lo ferma | 1 125 | Architetto, solo se lo si accorcia |
| le parti del seme (`part-door` 707, `part-battlements` 743, `part-slits` 817, `part-stair` 2 797, `part-cellar` 4 408) | — | già nella richiesta come contratto di una riga (`partResources`), non come programma |

**Voti.** Negli universi veri 211 modelli hanno un voto dell'Artista, in media 5,1, e solo 12 hanno 7 o più. Un esempio «dell'universo» con
la soglia a 7 ci sarebbe di rado per i primi giorni di un mondo: il seme resta il primo, e l'universo lo sostituisce quando ha di meglio.

**Il rischio è la copia, non il prezzo.** Per una cosa semplice o una figura un esempio costa 460-1 900 token, cioè 0,00005-0,0002 $ su
Flash-Lite e 0,001 $ su 3.8 Flash: meno della sezione di un mestiere. Copiarlo non è grave (un sasso somiglia a un sasso), e un esempio
dell'universo fa crescere lo stile del mondo da ciò che il mondo ha già, come le carte portate (ADR-0170). Per una struttura un programma
intero costa 4 600-10 400 token a chiamata (0,008-0,018 $ su Opus, tre chiamate: fino a 0,05 $ a struttura, il 9 % di una struttura da
0,58 $). Soprattutto riporta il guasto di T337, la stessa composizione per ogni concetto, e quello di T434, i merli su una cattedrale. **Per
l'Architetto, idiomi e non programmi**: i pezzi di composizione che il prompt già ha (la sezione A, 1 199 token, è un few-shot di frammenti, e con
questo prompt Opus 5.5 è passato 11 volte su 12, T397) più i due cicli del forte (§ 5), 250 token.

**Contro le istruzioni lunghe.** A parità di token un esempio insegna più forme e meno regole: mostra come si scrive, non dice che cosa il
kernel controlla. Le regole che il kernel misura (la linea di galleggiamento, le zone indossate, le parti abitabili) restano istruzioni;
gli esempi mostrano lo stile. La proposta per ogni specialità che non sia l'Architetto:

1. un modello a mano del seme della stessa classe, mai della corona né un programma che cresce a regole;
2. il migliore dell'universo della stessa classe e specialità con voto ≥ 7, se c'è (al più uno, per non arrivare a 6 000 token);
3. scelti in modo deterministico (voto, poi id) e cambiati solo quando arriva un modello migliore: gli esempi stanno in fondo al sistema e
   la cache li tiene finché non cambiano.

**Fatto in T467 (S1, kernel 0.10.15)**, con la soglia a 6 (l'autore, 21/11): `examplesFor` dà un modello scritto a mano della classe (nella
scatola della richiesta, il generico per primo) e, se c'è, il migliore dell'universo della stessa classe, taglia e densità con voto ≥
`EXAMPLE_SCORE` (il voto, poi l'id); mai lo studio, la vetrina, le parti, ciò che cresce a regole, una nave che non galleggia, un capo
indossato a chi non si indossa, un programma oltre i 12 000 caratteri (`EXAMPLE_CHARS`). Nel seme gli esempi scendono da 2 528 a 936 token a
chiamata (media pesata), da 0,075 $ a 0,025 $ l'ora di gioco (dall'1/12 da 0,116 a 0,041); nei cinque universi veri, dove entra il migliore
dell'universo, da 2 084-7 161 a 1 491-1 972 token, da 0,060-0,100 $ a 0,035-0,049 $ l'ora (dall'1/12 da 0,095-0,133 a 0,052-0,074). Richiesta
per richiesta e universo per universo, prima e dopo: [`misure-s1.md`](scultori-specializzati/misure-s1.md).

## 4. Le parti condivise per specialità e universo (d)

### 4.1 Che cosa c'è già

- `<import file="x"/>` esegue `models/x.xml` dentro un programma, con le sue lettere, i colori e le unioni (ADR-0171). Al più 64 file letti e
  3 import uno dentro l'altro (`WORLD_NODE_LIMITS`, ADR-0176).
- Le **parti del seme** (`part-stair`, `part-door`, `part-battlements`, `part-slits`, `part-cellar`, ADR-0182, ADR-0091): ognuna ha il suo
  contratto nel primo paragrafo del commento in cima (le lettere che legge e scrive, le unioni `+ = %` che chi include ridefinisce) e da
  sola costruisce la sua scena di prova, così si valida come modello. `partResources` le elenca nella richiesta delle strutture, una riga
  ciascuna, e toglie quelle del forte a chi non è una fortificazione (T434).
- La **cache delle forme** conta i file inclusi: `formKey` e l'impronta di un modello mettono nella chiave il contenuto di ogni file che il
  programma legge (`includesOf`, `src/kernel/forms.ts`). Se cambia una parte, cambia la forma di chi la include.
- Le carte portate (`bring.ts`, ADR-0170) e le carte guaste (ADR-0172): una carta portata che non compila si isola col generico.

### 4.2 Il nome

L'autore le chiama «pezzi». Nel gioco **pezzo** è già il pezzo della griglia di `<pieces>` (la griglia a pezzi, ADR-0178). Il concetto
della richiesta, un sottoprogramma col suo contratto che altri programmi includono, è invece quello della **parte** del seme. La proposta,
da mettere nel glossario: **parte del mondo**, la parte che lo Scultore di un universo scrive, accanto alla **parte del seme**. Il file
resta `models/part-<nome>.xml`; la voce dell'indice dice la specialità e l'origine (`{ class, specialty, part: true, author, score }`).
`partResources` elenca a una richiesta le parti della sua specialità: quelle del seme dell'Architetto (le cinque di oggi) e quelle del suo
universo. Al più otto, ognuna in una riga (60-120 token).

### 4.3 Chi le scrive

| via | come | pro | contro |
|---|---|---|---|
| **A. a mano nel seme** | come le cinque di oggi, per ogni specialità che ne ha bisogno: una ruota (`part-wheel`, legge il segno dell'asse), una finestra (`part-window`, legge la fascia `U` dove il prompt mette le finestre), un'anta che si apre | nessuna chiamata, nessuna decisione nuova, provate sul banco | uguali in ogni universo: niente stile di neapolis |
| **B. estratta da un modello buono** | quando un modello della specialità passa con voto ≥ 7, lo Scultore (sul modello della sua classe) riceve il programma e scrive una parte col suo contratto e il modello riscritto che la include; il kernel prende la parte solo se il modello riscritto dà **la stessa griglia, voxel per voxel, su tre semi** (il motore è deterministico, ADR-0142, e una parte inclusa consuma lo stesso caso del testo che sostituisce) | verificabile senza giudizio; la parte nasce da ciò che il mondo ha già fatto bene; la paga chi ha pagato il modello | una chiamata in più per parte; non tutte le forme si estraggono |
| C. chiesta nella composizione | nel primo blocco l'Architetto dice quali parti vorrebbe; il kernel le fa scrivere prima del secondo blocco | parti pensate per essere condivise | due chiamate in più, una parte senza un modello che la provi, il blocco 2 che aspetta |

**Raccomandazione: A, poi B.** Esempio. A neapolis il Carrozziere scolpisce la prima auto; se l'Artista le dà 7, il kernel chiede la ruota e
la prende solo se l'auto riscritta è la stessa. La seconda auto riceve nella richiesta `<import file="part-ruota-neapolis"/>: legge W, il
centro dell'asse; scrive T, gomma, e R, cerchio; …` e la include invece di riscriverla. All'Architetto di neapolis arriva lo schema delle
finestre del primo palazzo buono, e la città prende un'aria sola.

### 4.4 La validazione, la cache, le carte

- **Validazione** (il validatore, regola 2): una parte del mondo è un modello. Compila, gira la sua scena da sola entro `WORLD_NODE_LIMITS`,
  ha il contratto (il primo paragrafo, non vuoto, con le lettere che scrive), **non include niente** (così chi la include resta entro i tre
  livelli e la si prova da sola) e non usa le lettere riservate delle parti del seme (`S`, `#90`-`#97`). In più il controllo di B, la stessa
  griglia.
- **Cache delle forme**: niente da cambiare nel meccanismo, che già mette le parti nella chiave. Una regola sola: **una parte del mondo non
  cambia mai e non si cancella finché qualcuno la include**. Una versione nuova è un nome nuovo, e chi la vuole viene riscolpito. Così le
  forme di cento modelli non si rifanno per una ruota, e nessun modello resta senza la sua parte. La rigenerazione dei modelli (ADR-0216)
  tiene le parti in uso.
- **Carte** (ADR-0056, ADR-0195): una parte estratta è una carta, col costo della chiamata che l'ha scritta (`usd`) e chi l'ha pagata; i
  modelli che la includono sono i suoi utilizzi. **Una carta viaggia con le sue parti**: portare (ADR-0170) o clonare (ADR-0068) un
  modello porta la chiusura dei suoi `<import>` (`mjxIncludes`); oggi `bring.ts` non lo fa, e un modello portato senza la sua parte sarebbe
  una carta guasta. Le parti del seme ci sono in ogni universo e non viaggiano.
- **Le carte fatte a mano** (ADR-0161) potranno includere le parti del mondo dell'universo in cui entrano: dopo, non qui.
- **Sicurezza**: nessuna superficie nuova. Le parti sono file di `models/`, che il Concilio scrive già (`councilMayWrite`), e passano dal
  validatore come ogni modello.

**Fatto in T471 (S5, la via A, ADR-0241)**: tre parti del seme scritte a mano come le cinque abitabili, dallo stesso generatore
(`lab/banco/taglie/parti.mjs`): **`part-wheel`** (il mozzo `H` che chi include segna sull'asse o oltre la sua fine; la ruota nel piano
attraverso l'asse, lungo x o lungo y, grande quanto il mozzo è alto su ciò che ha sotto, ad anelli ottagonali finché tocca: cerchione e mozzo
`I`, quarti e otto razze `J`), **`part-window`** (la fascia `U`: una finestra centrata su ogni tratto con l'aria oltre i due capi, poi
pilastri di 6 e finestre di 8, telaio `N` col davanzale che sporge, vetro `G`, il muro aperto dietro; nessuna negli angoli interni; un tratto
che corre al bordo della scatola dal suo capo libero) e **`part-leaf`** (l'anta `L` e il cardine `#80` davanti al suo capo: `#81`,
nascosta, dove l'anta va aperta, quanto è larga; i coperchi verso l'alto; le azioni di chi include, `#82` e `#83`). La voce dell'indice dice la
specialità (`specialty`, una o un elenco; senza, l'Architetto, come le parti di prima e le voci che un universo tiene) e
`partResources(files, specialty, fortified)` le offre al mestiere, al più otto; ai mestieri in una scatola con una riga che dice come si usa
una parte (`TRADE_PARTS`). **Che cosa è cambiato dal previsto**: l'anta è anche il coperchio, e le parti vanno a due mestieri (la finestra
all'Architetto e al Capomastro, l'anta al Capomastro e al Mobiliere, la ruota al Mobiliere e al Carrozziere: le ruote dei carri oggi le scolpisce
il Mobiliere, perché un veicolo di terra non ha una classe); la ruota non legge il segno dell'asse ma il mozzo (un asse lungo il carro ha la
ruota a ogni capo, una carriola a metà); le righe dei contratti sono 170-215 token, non 60-120: 416 token in più a richiesta del Mobiliere, 491 del
Capomastro, 216 del Carrozziere, 178 dell'Architetto (41 in meno nel suo prompt, che nomina la parte al posto della ricetta
delle finestre a caso), 320 in media pesata, 0,016 $ l'ora oggi e 0,030 $ dall'1/12
([`misure-s5.md`](scultori-specializzati/misure-s5.md), `countTokens`; i sistemi degli altri mestieri non cambiano); una faccia sul bordo della scatola non ha finestre, perché un pattern non vede
il bordo. **Il banco** (`lab/banco/parti/`, `lab/scripts/banco-parti.ts`, `tests/seed-parts.test.ts`): l'armadio e il carretto del Mobiliere,
la casetta del Capomastro, la villetta offline dello Scultore con `part-window` al posto delle sue finestre a caso (passa i controlli a Grande
e a Enorme, 31 finestre); nel laboratorio 3D le parti da sole e i modelli. Che lo Scultore le usi coi modelli veri resta da vedere (S7, T473).

## 5. `<markov>` come ciclo con l'uscita, e gli altri nodi che il prompt non insegna (e)

### 5.1 Come il kernel lo esegue

In `src/mj/engine.ts`:

- `MarkovRunner.go`: a ogni passo prova i figli in ordine e fa lavorare **il primo che trova qualcosa**. Se a lavorare è **l'ultimo**
  figlio, tutti i figli ripartono (i loro `steps` si contano di nuovo). Quando nessun figlio trova niente, il `<markov>` finisce.
- `SequenceRunner.go`: fa lavorare il figlio corrente finché può, poi passa al successivo; dice «niente» quando li ha finiti tutti.

Un `<markov>` con dentro una sola `<sequence>` è quindi un **ciclo while**. La sequenza è l'ultimo figlio: dopo ogni passo che fa qualcosa
riparte dal suo primo figlio. A ogni giro si prova l'uscita, poi ciò che la propaga, poi la crescita. Il ciclo finisce al giro in cui
l'intera sequenza non trova niente.

Il ciclo del mastio dell'autore (forte-handmade, «expands the keep»):

```xml
<markov>
  <sequence>
    <prl p="0.00005" in="k" out="z"/>          <!-- l'uscita: ogni tanto una k del mastio diventa z -->
    <prl in="kz" out="zz" steps="100"/>        <!-- z si allarga su tutto il mastio -->
    <all steps="1">                             <!-- altrimenti il mastio cresce di un anello -->
      <rule in="[Kk]x" out="*k"/>
      <rule in="[Kk]*/*x" out="**/*k"/>
      <rule in="vk" out="vz"/>                  <!-- toccata la strada, si ferma lì -->
    </all>
  </sequence>
</markov>
<prl in="z" out="k"/>                           <!-- finito il ciclo, il segno torna mastio -->
```

Finché non c'è una `z` il mastio cresce di un anello a giro. Nato il segno, si propaga e copre il mastio, l'anello non trova più una `k` e
il giro dopo nessun figlio trova niente: il ciclo esce, come dice l'autore. `p` vale per cella: più il mastio è grande, prima si ferma. La
grandezza a cui si ferma la decidono il caso e `p`, non il numero dei passi. Il secondo idioma è il ciclo dei piani: un segno `#6` apre un piano nuovo, la
sequenza lo costruisce e lo consuma (`#6 → #7`), e `<prl p="0.5" in="#7" out="#6"/>` decide a moneta se ce n'è un altro. I piani sono uno,
due, tre… con metà delle probabilità ogni volta.

**Una differenza dall'originale da fissare con un test.** In MarkovJunior di mxgmn una `<sequence>` dentro un `<markov>` diventa il ramo
corrente e corre fino in fondo prima di tornare al `<markov>`. Nel nostro motore riparte dopo ogni passo, se è l'ultimo figlio. Il ciclo
del mastio fa lo stesso nei due (un anello a giro, l'uscita provata a ogni giro, il segno che si allarga prima di un altro anello), ma la guida deve descrivere il nostro, e un test (`tests/mj-*.test.ts`, S3) deve tenerlo fermo:
un programma che lo usa non deve cambiare sotto i piedi (ADR-0142). Fatto in T469: `tests/mj-markov.test.ts`.

### 5.2 La guida proposta (in inglese, come i prompt)

Nel nucleo, cinque righe, perché un ciclo serve anche a un albero (rami finché la chioma non tocca il bordo):

```text
- Loops: `<markov>` repeats; at each step the first child that finds something works, and when the last one works they all start again.
  It ends when no child finds anything. So `<markov><sequence>…</sequence></markov>` is a loop whose body runs from its first child at
  every turn: put the exit first (a rare mark), what spreads the mark next, the growth last. A loop without an exit ends only when there is
  no room left: give every growth inside it a letter it consumes or steps.
```

Nell'Architetto, il ciclo del mastio qui sopra (131 token) e il ciclo dei piani detto in tre righe (non il programma da 1 125 token), con
il loro uso: un cortile o un mastio che cresce finché un segno non lo ferma (la grandezza a caso, non dal numero di passi), i piani a
moneta, le torri lungo le mura finché c'è posto. Circa 400 token.

### 5.3 Gli altri nodi

| nodo, attributo | nel motore | prompt generale | prompt delle strutture | forte dell'autore | proposta |
|---|---|---|---|---|---|
| `<markov>` come ciclo con l'uscita | sì | mezza riga | no | 5 | § 5.2, nel nucleo e nell'Architetto |
| `<sequence>` come corpo di un ciclo | sì | no | no | 4 | con `<markov>` |
| `<pieces piece margin time halo edge>` (ADR-0178) | sì (i tetti grandi solo dove il gioco fa le forme) | no | no | 3 | Architetto: la scala intera della Gargantuesca a pezzi, con la regola del margine (una regola che guarda non oltre il margine dà la stessa griglia) |
| `map scale` frazionaria (`1/5`) | sì | no (solo interi) | sì | sì | nel nucleo una riga |
| `map clear="False"` (tiene la griglia, ADR-0123) | sì | no | no | — | nel nucleo una riga |
| `path longest` | sì | no | no | — | Paesaggista (radici e sentieri lunghi) |
| `field` con `essential`, `recompute`, `temperature` | sì | sì | solo nell'esempio | 1 | Architetto, con l'esempio del mastio lontano dal portone |
| `observe`, `search`, `depthCoefficient` | sì | sì (non `depthCoefficient`) | no | — | resta nel nucleo |
| `wfc` con `periodic`, `shannon`, `fullSymmetry`; `convolution periodic` | sì | no | no | — | solo quando la richiesta elenca un tileset o un campione |
| `<color>` con `alpha`, `opacity`, `glass`, `translucent` | sì | solo nella vetrina | no | — | Mobiliere e Capomastro: vetri, acqua in un vaso, schermi |
| `<color area>` | sì | navi | sì | — | Carrozziere e Architetto (come oggi) |
| simmetria `(xyz+)` (rotazioni) | sì | no | no | — | Paesaggista (rocce) |

### 5.4 Che cosa ha fatto S3 (T469)

- **Il test**: `tests/mj-markov.test.ts` fissa la nostra semantica (il corpo di un ciclo riparte dal primo figlio a ogni passo: in una gara fra
  due crescite vince la prima, che nell'originale di mxgmn si fermerebbe a metà; una sequenza che non è l'ultimo figlio tiene il suo posto) e
  i due idiomi del forte, voxel per voxel: il mastio che cresce finché la strada o il segno non lo ferma (com'è scritto, e col segno più
  frequente, che dà un mastio diverso a ogni seme), i piani a moneta (su 400 semi uno, due, tre piani circa 200, 100, 50 volte).
- **La guida**: nel nucleo le righe del § 5.2 e la `map` frazionaria con `clear`; nell'Architetto il ciclo del mastio e i piani a moneta,
  le trame, la cantina, la Gargantuesca a pezzi con la regola del margine; al Paesaggista `path longest` e `(xyz+)`, al Mobiliere e al
  Capomastro le lettere traslucide. La misura prima e dopo: [`scultori-specializzati/misure-s3.md`](scultori-specializzati/misure-s3.md).
- **`wfc` e `convchain`**, che l'autore vuole all'Architetto (21/11): così com'erano non potevano stare in una struttura (leggevano file che lo
  Scultore non scrive, e `convchain` girava solo su una griglia piana). ADR-0240: il campione di `convchain` scritto nel nodo e, su più strati,
  strato per strato; la `wfc` resta com'è e il prompt dice perché non è per una struttura.
- **Il banco**: `lab/banco/taglie/scultore-rocca-ciclo.xml`, la rocca col ciclo del mastio e il cortile lastricato; `banco-taglie.ts` alle
  scatole del gioco (16 voxel per casella).
- **Per l'autore**: «Come si usa `<pieces>`» in `lab/banco/pezzi/README.md`, coi tre `<pieces>` del suo forte.

## 6. I task e l'ADR proposto (f)

L'ordine proposto: S1 subito (non chiede decisioni); S2 e S3 insieme; poi S4 e S5; S6 dopo S5; S7, la prova pagata, quando S2-S4 sono
dentro. Le stime sono nella misura della pipeline.

| task | che cosa | dipende da | stima | provider, sforzo | browser |
|---|---|---|---|---|---|
| **S1** Gli esempi dello Scultore scelti bene | `examplesFor` senza `corona-`, `schermo-`, `circuito-`, `part-`, senza programmi che crescono a regole per le classi a scatola sola; le navi dal loro mezzo; un modello a mano del seme della stessa classe e, se c’è, il migliore dell’universo col voto della domanda 3 (7 finché l’autore non dice altro), in quest’ordine (§ 3.2); la scelta deterministica; un test; la misura `--scultore` prima e dopo; kernel Z | — | 1 % | claude high | no |
| **S2** Lo Scultore a specialità | `SculptorSpecialty`, `specialtyOf`, `sculptorRole(files, specialty)`; il prompt in nucleo e sezioni (`prompts/agents/sculptor.md`, `prompts/agents/sculptor/<specialità>.md`), il ripiego del prompt intero per gli universi di prima; l'ordine del sistema per la cache, due segni `cache_control` su OpenRouter, `missing()` in fila per specialità; la specialità nel registro dei consumi; l'azione col nucleo delle azioni e la sezione del modello; test (ogni classe la sua specialità, ogni richiesta il suo prompt, il prompt intero dove manca il nucleo); misura prima e dopo; ADR, glossario, AGENTS.md; kernel Z | — | 3 % | claude extra | no |
| **S3** I cicli e i nodi che il prompt non insegna | il test che fissa `<markov>` e `<sequence>` nel nostro motore (i due idiomi del forte, voxel per voxel); la guida del § 5.2 nel nucleo e nell'Architetto; `<pieces>`, `map` frazionaria e `clear`, `path longest`, i colori traslucidi nelle sezioni del § 5.3; sul banco delle taglie una rocca scritta come lo Scultore col ciclo del mastio (`banco-taglie.ts`), offline | S2 (o prima, nel prompt delle strutture di oggi) | 2 % | claude high | no |
| **S4** Le sezioni dei mestieri | il testo nuovo di Paesaggista, Mobiliere, Sarto, Figurinista, Capomastro e Carrozziere (§ 2.1), entro i token del § 2.2; le risposte offline restano; un test per sezione che la richiesta di quella classe la porti e le altre no | S2 | 3 % | claude high | no |
| **S5** Le parti del mondo, A: a mano nel seme | `part-wheel` e `part-window` (e l'anta) col contratto e la scena di prova, come le parti del seme; `partResources(files, specialty, fortified)` per specialità (la voce `specialty` dell'indice); la voce del glossario «Parte del mondo»; test del banco | S2 | 2 % | claude high | sì: le parti da sole e in un modello nel laboratorio 3D |
| **S6** Le parti del mondo, B: estratte da un modello buono | il compito `model.part` (schema XML, risposta in `MockAiModels`, voce del registro, riga di `CENSUS` con la manopola `models`); il controllo della stessa griglia su tre semi; la voce dell'indice, l'immutabilità e «in uso» (`mjxIncludes` sulla libreria); la carta della parte e la chiusura degli `<import>` in `bring.ts` e nel clone; la rigenerazione che tiene le parti; test; ADR; sicurezza: nessuna superficie nuova | S5 | 4 % | claude extra | no |
| **S7** La prova pagata delle specialità | `scultore-gemini.ts` con i prompt di oggi e quelli di S2-S4 sugli stessi concetti (una cosa semplice, una figura, un edificio, una nave, una struttura), Flash-Lite, 3.8 Flash, Argon o Opus: programmi che passano al primo colpo, voti dell'Artista, token, costo; col tetto sul registro | S2, S3, S4 | 2 % e 3-5 $ | claude high | sì: le foto dei modelli |

Ognuna di S1-S6 si chiude con `npm test`, `npm run typecheck` e la misura `prompt-tokens.ts -- --scultore --conta` prima e dopo. Nessuna
chiama i modelli. S7 sì, e va approvata dall'autore per la spesa.

### 6.1 L'ADR proposto (da approvare)

> **ADR-NNNN — Lo Scultore a specialità e le parti del mondo** (proposto da T458)
>
> **Contesto.** Il prompt generale dello Scultore (5 207 token) va intero a ogni cosa che non cresce a regole, e un terzo non le serve
> (T458 § 1). I mestieri non possono avere istruzioni loro senza farle pagare a tutti. Gli esempi della libreria sono scelti per ordine
> dell'indice. Le parti del seme si includono con `<import>`, ma solo il seme le scrive.
>
> **Decisione.** (1) Lo Scultore resta un agente (`sculptor`, `model.sculpt`, la manopola `models`) con otto **specialità**: Paesaggista,
> Mobiliere, Sarto, Figurinista, Capomastro, Architetto, Carrozziere e le azioni. Le decide il kernel dalla classe, dalla taglia e dalla
> richiesta (`specialtyOf`). Il prompt è un **nucleo** comune e una **sezione** per specialità (`prompts/agents/sculptor/<specialità>.md`),
> nell'ordine che tiene la cache: nucleo, principi, «Lingua», guida di stile, sezione, esempi. (2) Gli **esempi** sono un modello a mano del
> seme della stessa classe e il migliore dell'universo con voto ≥ 7, scelti in modo deterministico; mai della corona, mai un programma che
> cresce a regole a una classe a scatola sola; all'Architetto idiomi, mai programmi interi. (3) Le **parti del mondo**: programmi di
> `models/part-*.xml` con la loro specialità, scritti a mano nel seme o estratti dallo Scultore da un suo modello buono, presi solo se il
> modello riscritto dà la stessa griglia; non includono niente, non cambiano e non si cancellano finché sono in uso, viaggiano con le carte
> che le includono.
>
> **Conseguenze.** Il conto dell'ora quasi uguale (−0,016 $ oggi, −0,021 $ dall’1/12), il 10-20 % di istruzioni in più per ogni mestiere; una riga del registro
> in più (la specialità); i prompt in più file; `bring.ts` porta la chiusura degli `<import>`; un universo col prompt di prima resta col
> prompt intero.
>
> **Alternative scartate.** Otto agenti (otto righe di `CENSUS`, otto manopole, otto direttive per lo stesso lavoro). Un prompt per classe
> (tredici prompt quasi uguali; le classi di un mestiere si somigliano). Il forte intero come esempio (10 354 token, la copia di T337, i
> merli di T434). Parti generate senza il controllo della stessa griglia (una parte che nessuno ha provato in un modello).

### 6.2 Domande per l'autore (non fermano S1)

1. I nomi delle specialità (Paesaggista, Mobiliere, Sarto, Figurinista, Capomastro, Architetto, Carrozziere) vanno bene, anche nello studio?
2. «Parte del mondo» invece di «pezzo», perché «pezzo» è già della griglia a pezzi (`<pieces>`)?
3. La soglia per un esempio o una parte dall'universo: 7 (12 modelli su 211 oggi) o 6?
4. S7, la prova pagata (3-5 $), dopo S2-S4?

## 7. Che cosa non è provato

- **Nessuna qualità è misurata**: che le specialità facciano programmi migliori, che gli esempi scelti per voto aiutino, che la guida dei
  cicli venga usata. Offline si misurano i token, non i programmi. È S7.
- La Genesi è quella offline: 11 modelli. Una con Gemini ne chiede circa 20, e il risparmio per Genesi raddoppia (resta sotto i due
  centesimi).
- I pesi delle classi vengono da cinque universi generati in buona parte dalla coda degli abbonamenti (la rigenerazione dei modelli,
  Opus): un mondo giocato con Gemini può chiedere più figure e meno strutture.
- I token sono di Gemini (`countTokens` di Flash-Lite); su Opus il tokenizzatore è un altro.
- Il controllo «la stessa griglia» della via B non è provato: che una parte inclusa consumi lo stesso caso del testo che sostituisce si
  legge nel motore (`importNode` compila il programma incluso al suo posto), va provato in S6.
- La semantica di `<markov>` era letta nel codice: T469 l'ha provata (`tests/mj-markov.test.ts`). Che lo Scultore usi la guida dei cicli resta da
  vedere coi modelli veri (S7).
