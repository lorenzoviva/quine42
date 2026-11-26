# ADR-0264 — Il paesaggio costruito: una fontana chiesta al Concilio è una cosa del luogo

- **Stato**: accettato
- **Data**: 2026-11-27
- **Task**: T515
- **Estende**: ADR-0092 (le taglie e le classi), ADR-0160 e ADR-0162 (le strutture che crescono a regole e i loro piani), ADR-0213 (la casa)

## Contesto

Nella run #2 (26/11) l'autore ha chiesto al Concilio, in `orichalcum`, di introdurre una fontana nella mappa. Il registro lo racconta: il
Referente ha dato la richiesta alla Fucina come strumento (`task: item`, il commit «agente: Nuovo strumento «Fontana di Piazza della Pesa»
(item.fontana-di-piazza-della-)»), il Narratore ha dato al concetto la classe `structure`, e lo Scultore ha rifiutato ogni programma:
`world/shortfalls.json` dice «taglia Grande, seme 1: piani: 1 (serve ≥ 2)». Una `structure` da Grande in su cresce a regole e i controlli
vogliono due piani raggiungibili (ADR-0162): una fontana non ne ha. Il modello è rimasto il generico, la voce una mancanza, la fontana uno
strumento da borsa che non stava in nessuna piazza.

Nelle cinque copie della run altre cose della Fucina hanno la classe `structure` (un abbeveratoio, una cisterna, un'edicola votiva, un argano,
un gozzo tirato a secco): lo schema del concetto offriva ogni classe, con «building…» come unico esempio, e il Narratore sceglie `structure`
per ciò che è costruito. Ma la Fucina stessa dice che gli edifici sono ambienti del Cartografo, mai oggetti (`isStructure`): una cosa della
Fucina sta sul terreno, nessuno ci entra.

## Decisione

1. **Una cosa della Fucina non è mai `structure`.** Lo schema del concetto non la offre (`FORGE_CLASSES`) e descrive ogni classe con il suo
   esempio (`AssetClass.hint`: `building` «well, fountain, hut»). Il kernel non si fida: `thingClass(detta, nome, ipotesi)` in
   `src/mj/classes.ts` tiene la classe detta tranne `structure`, che diventa la classe del **paesaggio costruito** se il nome la dice, altrimenti
   un edificio piccolo (`building`, 2,5 caselle, nessun piano chiesto); un'ipotesi che dà `structure` lo stesso.
2. **Il paesaggio costruito** (`landmarkClassOf`): la testa del nome, dopo articoli e pochi aggettivi come per gli edifici della Fucina, dice una
   fontana, un pozzo, un abbeveratoio, un lavatoio, una cisterna, un'edicola, un chiosco (`building`) o una statua, un monumento, un obelisco,
   una colonna, una stele, una meridiana (`monument`); in italiano e in inglese, le altre lingue con T239. «La Torre della fontana» e «una
   borraccia d'acqua della fontana» no. Le parole che dicono anche una cosa da portare (una croce, un busto, una vasca) non ci sono.
3. **Ciò che sta dove è costruito non è uno strumento** (`standsInPlace`): un concetto chiesto come `item` il cui nome dice il paesaggio
   costruito, o la cui classe è `building`, `monument` o `structure`, diventa una cosa del mondo (`object`, non si prende), e il feed lo dice.
4. **I manifest di prima**: la richiesta allo Scultore di un modulo senza modello prende la classe di `thingClass` (`ModelDirector.missing`), e
   così il riscolpire (`resculpt`); il manifest non si riscrive. La fontana di `orichalcum` chiede ora il modello di un `building`. I modelli
   già scolpiti come `structure` restano come sono.
5. **La cosa va nel luogo**: una cosa del mondo che il viandante trasceso chiede al Referente (`thing`, e ciò che la Fucina ha fatto cosa del
   mondo da una richiesta `item`) va nel luogo pianificato che il Referente nomina (`target`, ora detto anche per `thing`) o, senza, in quello
   dove il viandante sta: nel suo piano (`objects`, `outside`, salvato) e subito nel mondo se il luogo è caricato, dove le collocazioni del
   luogo la mettono (`placeAsked`, come `settleLoaded` per gli individui del master). Non in uno specchio, non una persona né uno strumento né
   un veicolo (ha il suo ormeggio). Il prompt del Referente separa `item` (ciò che si porta nella borsa) da `thing` (ciò che sta nel mondo:
   un mobile, una fontana, un pozzo, una statua, mai un edificio in cui si entra, che è un ambiente).

## Conseguenze

- La guardia della casa (`isDwelling`) non vede mai una fontana: niente stanze né piani le si chiedono, perché non è una struttura che cresce
  a regole.
- Il Narratore non può più chiedere una struttura alla Fucina: un edificio in cui si entra resta un ambiente o un lotto del Cartografo.
- La prova offline: `tests/fontana.test.ts` («metti una fontana in piazza» con i modelli locali, e con le risposte del Referente e del
  Narratore della run).
- Kernel 0.10.40 (0.10.39 era già di T526): niente cambia nel contratto; i manifest di prima si leggono come prima.
