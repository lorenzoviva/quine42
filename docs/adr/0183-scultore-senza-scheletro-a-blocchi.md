# ADR-0183 — Lo Scultore delle strutture senza scheletro: la composizione dal concetto, le parti nella richiesta, i blocchi col ritorno in testo

Data: 2026-11-13 · Stato: accettato (task T354 del backlog, step 30; passo 2 di D48) · Riferimenti: D48 (`docs/pipeline/domande/T337.md`, la
raccomandazione D scelta dall'autore il 10/11), il rapporto di T337 (`lab/banco/metodo/README.md`), ADR-0160 (le strutture procedurali, lo
scheletro nel prompt), ADR-0176 (i nodi nuovi nel mondo, le risorse elencate nella richiesta), ADR-0179 (ciò che entra nella taglia),
ADR-0182 (le parti abitabili come sottoblocchi, le `map` che tornano), il banco [`lab/banco/taglie/`](../../lab/banco/taglie/README.md)

## Contesto

T337 ha misurato perché gli edifici dello Scultore sembravano tutti lo stesso: il 78-92 % di ogni programma era lo scheletro del prompt
copiato alla lettera, e un programma uguale fino ai colori consuma i numeri casuali allo stesso modo (separazione tra concetti 1,11, vicini
0 %). Il metodo a zone provato lì (niente scheletro, la composizione del concetto su una griglia grossa, il ritorno in testo dopo ogni
blocco) separava i concetti (3,73, vicini 100 %) ma cadeva sulle misure abitabili: stanze, porta, scala. T346 ha fatto il passo 1 di D48, le
parti abitabili come sottoblocchi provati del seme (`part-stair`, `part-door`, `part-battlements`, `part-slits`), con le misure minime di T338 e
la `map` condivisa fra le taglie. Restava il prompt del gioco, che aveva ancora lo scheletro, e un modo di dare allo Scultore ciò che il banco
gli dava: il ritorno in testo.

Tre cose si sono viste scrivendo i programmi a mano come li scriverebbe lo Scultore: la scala del seme voleva una striscia di **esattamente**
16 voxel, che su un piano a celle non si segna; una striscia appoggiata al muro dal lato basso non si sale (il corpo sale una scala solo in
linea: serve un pianerottolo prima del primo gradino); la lettera `S`, la scena di prova delle parti, se usata da chi include fa salire i suoi
muri di 63 (i nodi «da soli» della parte la trovano).

## Decisione

1. **Il prompt delle strutture non ha più uno scheletro** (`prompts/agents/sculptor.md` dopo `<!-- strutture -->`): un metodo e degli
   attrezzi, non un edificio da ricopiare. Tre livelli in un programma: **A** la composizione sul piano a un quinto (`map scale="1/5 1/5 1"`:
   una cella è 5 voxel, un quarto di casella; 20 × 20 celle a Grande, 30 a Enorme, 40 a Gargantuesca; `soil="E"` e `origin="bottom"`
   portati giù dalla prima `map`), **B** le altezze come colonne a passi dopo la `map` che torna alla scatola (`5 5 1`, un blocco per
   lettera del piano: un piano di 32, la striscia della scala nell'aria sopra la sua zona), **C** la scala piena (le porte dove la strada
   tocca il piede del muro, le parti incluse, finestre, tetti, pulizia). Gli attrezzi provati sono quelli dei due programmi scritti a mano
   (sotto): il corpo da una linea per il centro con una moneta su una cella sola (mai `p` su ogni cella di un bordo), l'ala, il cortile e la
   cinta, le torri sugli angoli convessi, la via dal centro al fronte (porta, selciato, corpo di guardia, strada), «il più lontano dal
   portone» con `field`, la zona della scala con il pianerottolo, ciò che entra con i pattern di terreno libero a `steps="1"` (una
   crescita senza `steps` si ripete finché c'è terreno, da un lato solo), gli anelli oltre il costruito misurati dal cortile verso fuori.
   Un programma nel prompt viene copiato (T337): offline la risposta dei modelli locali è `MOCK_STRUCTURE_PROGRAM` (`src/kernel/ai/mockStructure.ts`), la villetta scritta a mano come il prompt chiede, che sta nel codice e non nel prompt.
2. **Le parti nella richiesta** (`partResources`, come `libraryResources` di ADR-0176): per ogni `models/part-*.xml` dell'universo il primo
   paragrafo del commento in testa al file, il suo contratto per chi include (le lettere che legge e scrive, le unioni `+ = %`); il
   secondo paragrafo (cosa costruisce da sola, chi l'ha scritta) resta nel file. La richiesta dice di non usare mai `S` né `#90`-`#97`.
3. **Due blocchi, con il ritorno in testo** (`BLOCKS`, `planBlock`, `textViews`, `withMeaning` in `sculptor.ts`): la prima richiesta chiede la
   composizione sola (la radice, la prima `map` e il livello A: `isPlanOnly`, una `map` che non torna); il kernel la fa girare a tre semi
   alla taglia e al primo seme della successiva, con il suolo letto come `ground` (un piano su una griglia grossa non ha i voxel del
   modello finito per contare il suolo), e rimanda le piante in testo con ogni lettera e quanto differiscono i semi; la seconda chiede il
   programma intero con le piante davanti. Una risposta al primo blocco che già torna alla scatola è il programma intero e si controlla
   come tale: offline, una chiamata. Ciò che non passa torna col motivo e il suo significato, le viste in testo del seme caduto con la
   pianta e le altezze di altri due semi (`Checked.others`: dopo una caduta i semi fino al terzo girano comunque per le viste) e la
   traccia, che ora compila con i file inclusi; la revisione dell'Artista porta anche le viste. Le chiamate per struttura: due se il
   programma passa, fino a quattro con le correzioni, più la revisione come prima.
4. **Le viste in testo stanno nel kernel** (`src/mj/views.ts`, dal `lab/banco/viste.ts` di T337, che ora le riesporta): la pianta (la lettera
   in cima a ogni colonna) e le altezze in cifre, il fronte e il lato destro, un taglio a un'altezza, la legenda (una lettera nascosta con
   il solo nome della palette è «marker»), tutte entro una larghezza (un carattere è un quadrato di celle), i tagli a un terzo di ogni
   piano, due blocchi affiancati, la distanza tra due piante (le celle in cui la lettera in cima differisce, sulle celle costruite da
   almeno una, il terreno escluso). Una griglia piatta (un piano) dà solo la pianta.
5. **La scala del seme è tollerante** (`part-stair`, `lab/banco/taglie/parti.mjs`): prende i primi 16 voxel della striscia dal lato basso
   e rende il resto all'aria, apre il solaio sopra quei 16 attraverso tutti i suoi strati, non chiede aria sul lato basso della
   striscia; il contratto dice il pianerottolo di 10 prima del primo gradino e il pavimento oltre il sedicesimo. I commenti delle quattro
   parti hanno due paragrafi (il contratto, la provenienza).
6. **Il banco** (`lab/banco/taglie/`): due programmi scritti a mano come lo Scultore dal prompt nuovo, la villetta (la risposta offline) e
   la rocca (`scultore-rocca.xml`), alle tre taglie con le parti del seme: entrambi passano `checkProgram` a Grande e a Enorme, due piani
   raggiunti, porte 15 × 30 e 11 × 30, stanza 36, e a ogni taglia più grande una parte nuova (la villetta gli alberi poi il pozzo, la
   rocca il pozzo poi il fossato); `--viste` stampa ciò che lo Scultore riceve (il primo blocco ≈ 1 000 token a Grande, le viste del
   programma intero ≈ 8 000, più la traccia entro 2 500). Nel laboratorio 3D stanno accanto a fattoria e forte.
7. Kernel **0.6.10**: il contratto non cambia (un programma che il mondo prendeva lo prende ancora; i modelli scolpiti prima non cambiano).

## Alternative scartate

- **Il piano a 1/4** (il giro a zone di T337): 150 non è divisibile per 4 (le scatole di ADR-0179 sono 100, 150, 200); 1/5 e 1/10 dividono
  tutte, e 1/5 dà blocchi di `map` corti (25 caratteri) e un piano leggibile (20-40 celle di lato).
- **Il piano anche in z** (`1/5 1/5 1/4`): un blocco di `map` per lettera di 4 strati × 25, troppo lungo da scrivere a mano e da far
  scrivere; le altezze come colonne a passi sulla griglia piena sono corte e già provate (T337, T346).
- **La striscia della scala segnata a scala piena** con un pattern di 27 × 12 × 2 strati (il forte di T346, scritto per ripetizione da uno
  script): non lo scrive un modello a mano; la zona sul piano e la parte che prende i primi 16 sono due righe.
- **Un solo blocco** (la composizione e il programma insieme): T337 ha misurato che la forma è del concetto alla prima richiesta e che il
  ritorno delle piante corregge la composizione prima di costruire le altezze; il blocco in più costa una chiamata.
- **Un programma d'esempio nel prompt** al posto dello scheletro: sarebbe copiato come lo scheletro (T337). Sta nel codice, per i modelli
  locali e per il banco.

## Conseguenze

- Il prompt è una decisione da verificare su Gemini: il giro sul banco con 3.8 Flash e Argon è T355 (non prima del 15/11), con i costi;
  finché non è fatto, la qualità dello Scultore vero sul prompt nuovo non è misurata. Il tetto dei voxel delle gargantuesche è T356.
- Una struttura costa una chiamata in più quando passa alla seconda richiesta (due invece di una); la stima oraria dei coefficienti resta
  quella di prima (le strutture sono una parte dei modelli).
- Il banco del metodo (`lab/banco/metodo/`) tiene i suoi rapporti; le viste in testo che usava sono quelle del kernel, in inglese.
- Sicurezza: nessuna superficie nuova (il prompt, i controlli e le viste; le parti sono file di `models/` come prima).
