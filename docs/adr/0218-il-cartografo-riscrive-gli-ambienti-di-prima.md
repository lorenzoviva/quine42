# ADR-0218 — Il Cartografo riscrive l'ambiente che il kernel non sa allargare

Data: 2026-11-18 · Stato: accettato (task T422 del backlog; proposta di T411 approvata dall'autore il 18/11, D2) · Riferimenti: ADR-0216 (la
rigenerazione dei modelli), ADR-0209 (le strutture a 16 voxel per casella), ADR-0211 (timbri e ambienti tagliati per le strutture a 16),
ADR-0143 (la generazione differita), ADR-0077 e ADR-0106 (la coda degli abbonamenti)

## Contesto

La rigenerazione dei modelli (ADR-0216) ritaglia prima delle strutture gli ambienti i cui lotti, tagliati per 20, non terrebbero le strutture a 16:
col programma del seme di oggi, con le regole-scatola del Cartografo allargate di 20/16 o fino a 7, coi timbri a 16. Prende la prima via con cui
nessun luogo perde una struttura; se nessuna va, l'ambiente resta com'era e le strutture che vi stanno si riscolpiscono a 20.

In sidera due ambienti non passano: `vicoli_pioggia` (case di 6 × 5 e 4 × 4 su un 20 % di boschetto rimasto) e `cantiere_fusione` (sale di 7 × 5
accanto a un canale, con metà dell'acqua lasciata a chiazze). Allargate, le case non trovano più posto nella «Scalinata dei Corrieri» e nel
«Cantiere della Fusione», e così restavano a 20 sei strutture (la casa comune, i due laboratori, la residenza modulare, lo scalo delle navette,
la stazione di transito). Un programma che le tenga va scritto, non allargato: chi sa cosa è l'ambiente e quali terreni sgombrare è il Cartografo.

## Decisione

1. **Un compito nuovo del Cartografo**, `environment.recut` (`recutEnvironment` in `src/kernel/agents/cartography.ts`, `RECUT_TASK`), chiesto solo
   dalla rigenerazione dei modelli, mai da un mondo che gioca. Nel censimento ha la manopola dei modelli (`models`); la risposta è il programma intero
   (`program_json`) e una frase; offline i modelli locali sgombrano la bozza e disegnano due edifici del lato chiesto coi codici del mondo.
2. **Quando**: un ambiente per cui `regenerationPlan` non trova una via del kernel diventa `how: 'cartographer'` (prima `kept`), col lato che i suoi
   edifici devono avere (`need`: 7 una Grande a 16, 10 un'Enorme, mura comprese; le gargantuesche hanno il loro blocco). Il passo è sempre
   `ambiente:<id>`.
3. **Cosa gli si dice**: il programma di oggi, il lato, la regola degli edifici (5 o più sul lato lungo: almeno il lato chiesto; più piccoli: al più
   4 × 4), i suoi luoghi col nome e le coordinate, le loro strutture, gli edifici che hanno oggi e la bozza (le quote dei terreni; intera, 18 righe,
   per i luoghi con una struttura), la tavolozza.
4. **Cosa il kernel controlla**: il validatore degli ambienti sulle bozze di prova, poi le bozze vere dei suoi luoghi (`recutFaults`): ogni struttura
   del piano trova un edificio che la tiene a 16, nell'ordine in cui i lotti si danno, e, se la casa comune si riscolpisce, ogni edificio di 5 o più
   la tiene. Ciò che non tiene torna al Cartografo col motivo, fino a `RECUT_TRIES` = 3 volte nello stesso passo.
5. **Dopo**: scritto (commit del kernel, `setEnvironmentProgram`), i piani dei suoi luoghi prendono `vpt: 16`; prima delle strutture le densità si
   ricalcolano sui lotti nuovi (un secondo `regenerationPlan` con gli ambienti fatti), così una struttura va a 20 solo se un lotto non la tiene davvero.
   Se il Cartografo non riesce l'ambiente resta com'era, con una mancanza, il passo è fatto e le sue strutture vanno a 20, come prima di questa
   decisione: niente si ferma per lui.
6. **La diagnosi senza chiamate**: `lab/scripts/piano-rigenerazione.ts -- universes/<nome> [--progresso …] [--lotti]` dice cosa la rigenerazione farebbe
   a un universo sul disco (gli ambienti, come e perché, le strutture a 20), senza scrivere.

## Conseguenze

- In sidera (18/11, Opus 5.5 dalla coda) i due ambienti sono stati riscritti al primo tentativo, una chiamata ciascuno: edifici di 7 × 7 con il loro
  anello, prima i grandi e poi le case di 4 × 4, la bozza sgombrata (boschetti, felci, speroni) e, nel cantiere, le sale anche sopra i canali. I due
  programmi, quelli di prima e le bozze vere dei 15 luoghi sono in `lab/banco/rigenerazione/sidera-ambienti.json`, che `tests/rigenera-sidera.test.ts`
  ritaglia offline; le sei strutture si sono riscolpite a 16.
- I lotti cambiano anche dove non stava una struttura (le case comuni): è il prezzo di un ambiente che tiene le strutture a 16 ovunque, ed è ciò che
  la rigenerazione già faceva con le regole allargate.
- Il lavoro resta nella storia dell'universo: il tag `prima-della-rigenerazione` ha lo stato di prima, ogni ambiente è un commit.
- Kernel 0.9.13: un compito in più, nessun formato cambiato.
