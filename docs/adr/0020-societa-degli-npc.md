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

## Aggiornamento (2026-10-23, T10): una società coerente
L'analisi dell'autore (`docs/userchats/to-do-2026-10-22.md`) e le misure su `valmora` (T07) mostravano gatti con
fratelli umani e apprendisti, gatti padroni di gatti, donne «padre», legami da un lato solo, molti nomi quasi uguali
(l'epiteto del kernel, «Elias il Giovane», «Elias la Rossa», ne creava di nuovi).
- Ogni individuo ha una **specie** (`persona | animale`, dal tipo: la classe del modello, `animale` e `bestia` sono
  animali; `Kernel.speciesOf`) e un **genere** (`maschio | femmina`, dal Narratore; per i registri vecchi lo stima il
  kernel dal nome, dal mestiere e dalle parole dei legami).
- Un legame nella `famiglia` di P dice **cosa è P per l'altro**, nella forma del genere di P
  (`{nome: "Tazio", legame: "figlia"}`: P è la figlia di Tazio). Il kernel conosce i tipi di legame
  (`KINDS` in `society.ts`: genitore, figlio, fratello, coniuge, nonno, zio, nipote, cugino, maestro, apprendista,
  padrone, animale, amico, rivale…), chi può esserlo per chi (parentela solo nella stessa specie; coniugi, maestri,
  cugini solo tra persone; una persona è `padrone` di un animale, l'animale ne ha uno solo) e il rovescio.
- **Validatore e riparazione** (`repairSociety`, `checkSociety` = l'elenco delle correzioni): specie e genere,
  nomi (chi viene dopo e ha un nome simile al primo, per il nome proprio, riceve un nome nuovo, dappertutto: società
  e trame), legami possibili per le due specie e per il genere, simmetrici (vale il primo detto), un padre, una madre e
  un coniuge al massimo, coniugi senza un genitore in comune, l'animale fa un mestiere da animale, gli attesi ricavati
  dai legami. `addPerson` ripara a ogni aggiunta; all'avvio `reviewSociety` ripara il registro e fa un commit
  (`società: N correzioni`). Nessuna chiamata ai modelli; ripararlo due volte non cambia nulla.
- Il Narratore (`npc.individuate`) riceve la specie, le parole possibili, le regole dei legami e i nomi da non
  usare; un nome troppo simile si richiede una volta, poi lo sceglie il kernel (`freshName`). L'epiteto non c'è più;
  i nati hanno un nome loro.
