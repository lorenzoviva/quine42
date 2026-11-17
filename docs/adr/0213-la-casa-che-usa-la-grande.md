# ADR-0213 — La casa che usa la Grande: il pavimento di un'abitazione, misurato dal kernel e chiesto allo Scultore

Data: 2026-11-17 · Stato: accettato (task T413 del backlog, step 30; D62; § 10.0 di `docs/design/scenografo.md`, nato da T406) ·
Riferimenti: ADR-0179 (le parti abitabili, `PARTS`, `partErrors`), ADR-0183 (lo Scultore delle strutture senza scheletro, la villetta
offline), ADR-0209 (le strutture a 16 voxel per casella), ADR-0210 (il tetto del prompt delle strutture), ADR-0212 (la guardia degli interni,
`roomsOf`), ADR-0136 (la versione del kernel); le misure di T303, T406 e T413 in `docs/design/scenografo.md` § 9-10

## Contesto

T406 ha misurato lo spazio calpestabile delle case dello Scultore di oggi (Opus 5.5) a 16 voxel per casella: il riscalamento di T405 dà una
volta e mezza il pavimento, ma lo Scultore dà alla casa un corpo di 35-45 voxel di lato su un lotto di 100 e un piano di una stanza sola
(4,5-6,3 caselle² dove sta il centro di un corpo), il resto è giardino. La leva non è più la densità ma quanto della Grande va alla casa: il
blocco del corpo nel prompt (3 celle dietro il centro, 5 davanti, 4 per lato) fa proprio quel corpo. L'autore (D62) ha approvato una soglia,
**almeno 10 caselle² coperte per piano e due stanze a terra** (la sala e una stanza), solo per le abitazioni, prima della rigenerazione (T411).

## Decisione

1. **La misura nel kernel** (`storeyFloors` in `src/kernel/interior.ts`): sul cammino di `habitableParts` (ora `habitablePartsOf` su un
   cammino già fatto, così i controlli camminano l'edificio una volta), per ogni piano di `storeysOf` i centri del corpo con qualcosa sopra
   (il cortile e una terrazza non sono il pavimento della casa), tagliati in stanze dove un passaggio è più stretto di `NARROW` 0,4 caselle
   (`roomsOf`: una porta in un muro taglia). È la misura del banco dello Scenografo (`stanzeDi`, T303, T406): sugli edifici di `misura16/` e
   `misura/` le stesse stanze, seme per seme.
2. **La soglia** (`DWELLING` in `src/mj/classes.ts`, accanto a `PARTS`): almeno **10 caselle²** al piano terra **e a un altro piano** (non a
   ogni piano: una soffitta piccola non va scoraggiata), il piano terra in **almeno 2 stanze di 1,5 caselle² o più** (la stanza dello
   Scultore, 28 voxel di lato, ne ha 1,56 di centri). Il controllo (`dwellingErrors` in `src/mj/check.ts`) dice il pavimento di ogni piano e
   le stanze del piano terra, con ciò che vuole e cosa fare (`casa: …`, con il significato in `withMeaning`).
3. **Chi è un'abitazione**: lo dice la richiesta (`SculptRequest.dwelling`: le case comuni del mondo, `casa-comune-…`, lo sono sempre) o le
   parole del suo concetto (`isDwelling`: casa, villetta, fattoria, cascina, baita, locanda…, house, cottage, farm, inn…, in italiano e in
   inglese come `CLASS_WORDS`), e nessuna di un forte, una torre, un tempio, una chiesa, un mulino, una caserma (quelle vincono: una
   casa-torre non è un'abitazione per questo controllo). Le altre lingue con T239.
4. **Nei controlli dello Scultore** (`checkProgram(…, { dwelling })`, ogni seme della sua taglia e il primo della successiva, dove già
   valgono le parti abitabili) e **nella richiesta**: un'abitazione porta la riga della soglia (`DWELLING_LINE` in `describe`: circa 75 × 65
   voxel dentro i muri, la sala e una stanza divise da un muro con una porta); il prompt delle strutture (`sculptor.md`) dice il corpo di
   un'abitazione nel suo blocco (6 celle dietro il centro, 6 davanti, 7 per lato, «not 3 and 5»), il muro interno e la porta in un muro lungo
   x. Il prompt resta sotto i 16 023 caratteri (ADR-0210): le aggiunte pagate con i doppioni delle parole della richiesta (le misure delle parti,
   le scatole delle taglie, l'altezza minima).
5. **La villetta offline** (`MOCK_STRUCTURE_PROGRAM`, ADR-0183) è un'abitazione che passa: corpo di 75 × 65-70 voxel dentro, il muro
   interno sulla riga del centro con una porta di 11, la sala davanti (6,6-7,6 caselle²) e la stanza della scala dietro (3,6-5,0), il piano di
   sopra aperto (14,1); l'ala, gli alberi (ora in 5 × 5 di prato) e il pozzo solo dove c'è posto, cioè dall'Enorme.
6. **Kernel 0.9.6**: nessun formato cambia, nessun universo è toccato; cambia ciò che lo Scultore riceve e ciò che i suoi controlli
   rimandano indietro per un'abitazione.

## Conseguenze

- Le case di T303 e T406 (una stanza per piano, 4,5-6,3 caselle²) tornano allo Scultore col motivo; scritte col prompt nuovo passano su
  ogni seme: la villetta 13,2 caselle² a terra in tre stanze e 13,3 di sopra, la fattoria 11,0 in due o tre e 14,1; i mobili che entrano
  raddoppiano (da 7-10 a 14-15 pezzi, la via dei dati da 5,5-6,75 a 11-12; `docs/design/scenografo.md` § 9.2, `lab/banco/scenografo/casa/`).
- Una casa costa allo Scultore due o tre volte quella di prima (1,18 $ e 1,64 $ contro 0,36 $ e 0,81 $ di T406): le prime risposte cadono
  sulla soglia e si rifanno. La leva è che la prima risposta arrivi sopra 10, non una soglia più bassa.
- Il corpo detto nel prompt si copia (la fattoria di T413 ha esattamente 6, 6 e 7 celle, come la villetta offline): la prossima stesura del
  prompt può dirlo come un minimo che il seme allarga.
- Un'abitazione Grande ha meno giardino: il portico e il giardino prendono ciò che resta, l'ala, il fienile e l'orto vanno alle taglie più
  grandi, che devono contenere di più (ADR-0179).
- Il portico coperto conta come pavimento coperto (la misura non distingue un ambiente chiuso da uno aperto sotto un tetto); se una casa
  passasse per il portico, la misura va ristretta ai centri chiusi.
- Una fattoria con la stalla dentro la casa conta la stalla come stanza: la soglia è del pavimento, non dell'uso.
