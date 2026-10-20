# ADR-0020 — La società degli NPC

Data: 2026-10-20 · Stato: accettato

## Contesto
L'autore vuole NPC con una narrativa, contestualizzati con gli altri: una famiglia, un lavoro, azioni proprie.

## Decisione
- **Registro delle persone** `world/people.json` (`src/kernel/society.ts`): nome, tipo, mestiere, età,
  famiglia, routine, storia, luogo, origine. Quando nasce un individuo il Narratore riceve la società
  (persone note con legami, e persone nominate ma non ancora incontrate): lega il nuovo arrivato agli
  altri con i nomi esatti, o può *essere* un parente atteso. I legami sono resi simmetrici dal kernel
  (madre ↔ figlio, rivale ↔ rivale…).
- Gli individui nascono quando li incontri (entro 9 caselle, due alla volta), non più solo parlandoci;
  con la stessa origine (stesso luogo) sono la stessa persona, senza nuove chiamate.
- **Routine**: mattina, giorno, sera, notte (`dayPhase`, allineata al ciclo giorno/notte) → casa
  (un edificio del loro luogo), lavoro (un edificio per i mestieri al chiuso, un punto fisso all'aperto
  per gli altri), piazza, in giro. Il kernel mette la meta nel componente `meta`; `sys.wander` (Lua) ci
  cammina e lì gironzola. Al cambio di momento dicono cosa fanno.
- **Incontri**: due parenti vicini si salutano con battute secondo il legame (nessuna chiamata ai modelli).
- In chat la persona sa il proprio mestiere, la famiglia, la storia e cosa sta facendo adesso.

## Conseguenze
- Il villaggio sembra vivo e coerente; costo: 1-2 chiamate per persona incontrata la prima volta.
