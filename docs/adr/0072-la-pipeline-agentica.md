# ADR-0072 — La pipeline agentica

Data: 2026-10-28 · Stato: accettato (task T61 del backlog) · Estende il protocollo delle sessioni di `AGENTS.md`.

## Contesto
Il kernel si sviluppa con due provider in abbonamento (Claude Code CLI, Gemini con Antigravity IDE e CLI), senza cloud, con limiti
di consumo settimanali. Fin qui una sessione alla volta, in un solo worktree (`step8.2A-lab3d`, branch `3d`), lanciata a mano con il
prompt del backlog. L'autore vuole che i task vadano avanti da soli, in parallelo, sul provider adatto, senza superare i limiti e
senza che un agente si interrompa a metà per risparmiare (to-do del 28/10/2026, «Automatizzare il lavoro agentico»).

## Decisione
1. **Il backlog resta l'unica fonte dei task**: nessun task (fatto o no) cambia posto. La pianificazione aggiunge al task una riga
   `- Pipeline: <claude|gemini> · stima <n>% · [approvato ·] priorità <n>` (la stima è la quota del limite settimanale). Al posto dei
   file per provider proposti (PLAN_CLAUDE.md, TASK_GEMINI.md…) un solo piano generato, `docs/pipeline/PIANO.md`, con le code.
2. **Fasi 1-4 a un agente, fase 5 a uno script.** La pianificazione (to-do → backlog, scambio di domande in
   `docs/pipeline/domande/<Txx>.md`, sblocco degli `in attesa`, provider e stima) è un compito dell'agente che lancia la pipeline
   (`docs/pipeline/pianifica.md`, `/pipeline` in Claude Code), con il filtro che l'autore gli dà. L'esecuzione è deterministica:
   `tools/pipeline/pipeline.mjs` (Node, senza dipendenze).
3. **Il budget lo tiene lo script, non gli agenti**: residuo per provider (`.pipeline/budget.json`, locale), che l'autore corregge e
   che torna a 100 al reset settimanale; un task parte se la stima sta nel residuo meno ciò che i task in corso impegnano e una
   riserva; al più 5 in parallelo, uno solo per provider sotto il 10 %. Un limite toccato sospende il task con la sua sessione, che
   lo script riprende al reset («Ti sei fermato in questo punto, riprendi.»). Lo storico (`docs/pipeline/consumi.jsonl`) serve alle stime.
4. **Un worktree per task** (`.claude/worktrees/<txx>`, branch `task/<Txx>` dal base, `node_modules` del base per junction), con le
   regole dell'ambiente condiviso: solo il proprio worktree e il proprio blocco del backlog, niente merge, push né domande in chat.
   Il merge nel base lo fa l'autore (`integra`); una dipendenza è fatta quando il suo `fatto` è nel base.
5. Le CLI girano senza prompt dei permessi (`--dangerously-skip-permissions` in `config.json`): nessuno risponde. È una scelta
   dell'autore, modificabile lì.

## Conseguenze
- La pipeline non sa il consumo vero: la stima scala il residuo e l'autore lo corregge (`budget`). Il costo in dollari, se la CLI lo
  dà, va nello storico.
- I task paralleli possono scontrarsi su numeri di ADR e su AGENTS.md: chi integra risolve.
- I vecchi worktree (`t20`, `t23-studio`, `t27a`, `t27b`) sono superati; `pipeline.mjs worktree` dice cosa resta in ciascuno, nessuno
  script li cancella.
