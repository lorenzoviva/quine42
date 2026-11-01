# ADR-0088 — I turni delle operazioni pesanti

Data: 2026-10-30 · Stato: accettato · Estende ADR-0072 e ADR-0087.

## Contesto
`npm test` intero dura ~30 minuti; lanciato da più agenti insieme rallenta tutta la macchina (anche `agy -p /usage` ci mette due
minuti). Più verifiche nel browser insieme si pestano i piedi: lo stesso Chrome, le stesse porte, le schede degli altri.

## Decisione
1. **Un semaforo su disco** per le operazioni pesanti, in `.pipeline/lock/` della cartella principale del repository (la
   `--git-common-dir`: ogni worktree ha il suo `.pipeline/`, il semaforo è uno solo; `PIPELINE_LOCK` per i test). Due turni:
   `browser` (al più una verifica nel browser in tutta la pipeline) e `test` (al più una suite intera di vitest).
2. **`node tools/pipeline/pipeline.mjs turno browser|test -- <comando>`** aspetta il turno, esegue il comando con la sua uscita e
   il suo codice, e lascia il turno quando il comando finisce, comunque finisca. Chi tiene il turno è un file creato in modo
   esclusivo (`<tipo>.json`: task da `PIPELINE_TASK`, che la pipeline dà a ogni CLI, comando, pid, da quando); chi aspetta sta in
   coda nell'ordine d'arrivo (`<tipo>.attesa/`), così nessuno aspetta per sempre dietro chi arriva dopo. Un processo morto (anche
   ucciso senza lasciare il turno) o un turno tenuto oltre `turni.<tipo>.massimoMinuti` (45 il browser, 60 i test) non blocca più.
3. La verifica nel browser sta nel turno della sua **preview** (`turno browser -- npx vite preview --port <n> --strictPort`, in
   background): il browser è del task finché la preview vive, fermarla lo lascia. Un solo file di test non chiede il turno.
4. Il prompt dei task (`config.json → prompt`) e le «Regole per chi esegue un task» dicono di usare il turno; `turno` da solo e
   `stato` mostrano chi tiene ogni turno e quanti aspettano.
5. **La pipeline distribuisce il carico** (`holdBack`): non lancia (né riprende) un task che chiede il browser mentre ne gira un
   altro che lo chiede, e distanzia i lanci nuovi di `intervalloLanciMinuti` (10) mentre altri task sono in corso, così le suite
   finali non arrivano tutte insieme.

## Aggiornamento (T118, 01/11/2026)
Misure in `docs/plans/backlog.md`, T118. La CPU satura per i worker di Vitest (11 predefiniti su 6 core e 12 thread), non per gli agenti.
6. **I worker di Vitest**: sotto la pipeline (`PIPELINE_TASK` o `PIPELINE_TURNO`) al più `turni.test.worker` (6, uno per core fisico; `server/testWorkers.ts`). A
   mano nulla cambia e `--maxWorkers` vince.
7. **Due turni in più**: `typecheck` e `build` (10 minuti al più).
8. **Un comando dentro un turno già tenuto non aspetta** (`COVERS`, `coveredBy`): `PIPELINE_TURNO` è l'elenco dei turni tenuti dagli antenati; il browser copre se stesso, build e
   typecheck, i test se stessi, build e typecheck, la build se stessa e il typecheck. Un task la cui preview tiene il browser da un'altra shell ha la stessa copertura: è l'unico turno
   che non finisce da solo. Una suite non è mai coperta da un browser o da una build: la sua coda vale anche per chi tiene altro; un eventuale incrocio lo scioglie `massimoMinuti`.
9. **I timeout dei test non misurano il carico**: l'avvio di un kernel supera da solo i 10 s predefiniti di un hook, anche a CPU scarica. `hookTimeout` è 60 s come `testTimeout`, e
   i limiti scritti nei test che avviano più kernel (20-30 s) salgono a 60 s.

## Conseguenze
- Un task può restare a lungo in attesa del turno: il tempo è della macchina, non dei crediti (la CLI aspetta senza chiamate).
- Il turno è una regola del prompt, non una costrizione: un agente che lancia `npm test` da solo non è fermato, ma la pipeline
  ne lancia comunque di meno insieme.
- Gli strumenti del browser restano uno solo: due agenti nel turno del browser non ci sono mai, quindi niente schede altrui da
  evitare durante la verifica.
