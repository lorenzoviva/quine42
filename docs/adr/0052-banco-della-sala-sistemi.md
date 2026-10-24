# ADR-0052 — I casi dei sistemi e il kernel in miniatura

Data: 2026-10-23 · Stato: accettato (task T27c del backlog) · Estende ADR-0028 (le meccaniche con i pannelli) e ADR-0008
(tutto il generato passa dal validatore).

## Contesto
La Sala sistemi deve far apprezzare cosa fa il codice: l'autore ha scelto (23/10/2026, [`corona-proposte.md`](../plans/corona-proposte.md)
§2, scelta A) il **codice vero**: un caso d'uso in miniatura che gira davvero, così che se il codice cambia il caso cambia (o si
rompe, e si vede). I sistemi del seme avranno casi scritti a mano (T27b); quelli forgiati, cioè le meccaniche (`mech.*`,
`forgeMechanic`), li devono scrivere l'Ingegnere e provare il kernel (T27c). T27c è stato fatto prima di T27b, quindi il
formato e l'esecuzione dei casi nascono qui.

## Decisione
1. **Un caso è un dato del manifest** (`Manifest.casi`, `BenchCase` in `src/kernel/types.ts`): titolo e racconto, una scena
   di 5 × 5 caselle attorno al viandante (`terreno`, `cose` per modulo con i loro componenti), il viandante (componenti, ciò
   che porta: oggetti dell'universo per nome o **oggetti di prova**, con posto e bonus), i `passi` (`slot`, `togli`,
   `pulsante`, `attendi`, `cammina` con il verso `su giu sinistra destra`: tiene premuti i tasti, T27b), la `durata` (al più 30 s), cosa `guarda` (`componente.campo` del viandante, `<n>:componente.campo`
   della n-esima cosa) e le `righe` del codice che contano.
2. **Il kernel in miniatura** è un `Kernel` vero (`KernelOptions.bench`): `runCase` in `src/kernel/bench.ts` lo avvia con i soli
   `universe.json`, `core.*`, i moduli che non sono sistemi (dati, cose, viandante, la tavolozza) e il sistema del caso; niente
   modelli né file di `world/`; gli oggetti di prova in un pacchetto `bench.prova` che esiste solo lì. Il terreno è quello della
   scena (fuori, il primo terreno calpestabile), la generazione è ferma, niente stato caricato, atlante, società, trame, grafo,
   quarta parete, riparazioni automatiche; un `MockModels` e uno store in memoria. Gira a 20 tick al secondo e registra un
   fotogramma ogni mezzo secondo e dopo ogni passo (`BenchRun.frames`: valori guardati e posizioni), i messaggi al viandante,
   i guasti del modulo. Nulla dell'universo vero cambia. `kernel.runBenchCase(manifest, logic, caso)` lo fa dal kernel vivo.
3. **I casi delle meccaniche passano dal validatore come i programmi di layout**: lo schema di `mechanic.design` chiede 1-3 `casi`;
   il kernel li ripara (`cleanCases`: slot e pulsanti del pannello, percorsi validi, durata), li esegue con il codice appena
   scritto e tiene solo quelli senza errori in cui ciò che guardano cambia. Se nessuno regge, l'Ingegnere riscrive la meccanica
   una volta con il motivo; al secondo tentativo la meccanica entra anche senza casi (il codice resta valido: ciò che si
   rifiuta è solo l'esempio).

## Conseguenze
- Nessuna chiamata in più: i casi vanno nella stessa risposta di `mechanic.design`; guardarli non chiama nessuno. Ogni caso
  costa un avvio del kernel in miniatura (~60-300 ms in Node, una sandbox Lua nuova, chiusa alla fine).
- T27b userà lo stesso formato e lo stesso `runCase` per i casi del seme (`casi` nei manifest di `sys.*`) e disegnerà i
  fotogrammi nella teca; se il giocatore riscrive un sistema, la teca esegue il codice nuovo.
- Il formato copre oggi ciò che serve a meccaniche e sistemi del seme; altri passi (usare un oggetto) si aggiungono
  in `BenchStep` e in `runCase`.
- T27b (fatto): ogni `sys.*` del seme ha 2-3 casi; nella Sala sistemi la teca 3 × 3 (`BENCH_AT`) li mostra tutti, nell'ordine
  del tick, con «<» «>»; `kernel.benchOf()` esegue il caso scelto con il codice che il sistema ha adesso (in cache per caso e
  codice: riscriverlo lo esegue di nuovo) e la teca ripete prima, la regola, dopo. Nel browser un caso costa meno di un secondo.
