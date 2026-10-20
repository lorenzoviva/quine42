# ADR-0024 — La vita degli NPC: attività, dialoghi, ricordi, trame, famiglia

Data: 2026-10-20 · Stato: accettato

## Contesto
L'autore vuole vedere gli NPC fare fisicamente la loro giornata (il contadino zappa, chi va a dormire va a
letto), parlare tra loro secondo le relazioni, ricordare (promesse, tradimenti), trame orizzontali alla
Westworld integrate con Cartografo e Concilio, missioni ed eventi, poter creare una famiglia con un NPC, e
un «Altro…» anche verso le persone.

## Decisione
- **Attività**: ogni voce della routine ha un'`azione` (`dorme zappa lavora cucina mangia prega commercia
  pattuglia chiacchiera legge pesca taglia_legna pascola passeggia`). Il kernel sceglie il posto giusto (un
  letto del luogo, un campo arato, una riva, il margine del bosco, un edificio), `sys.wander` ci cammina,
  arrivati il componente `attivita {tipo, ferma}` li tiene lì e il renderer ne mostra la posa (sdraiati con
  la «z», chini sulla zappa con la terra che vola, seduti con la lenza).
- **Dialoghi**: due persone vicine al viandante parlano davvero (`npc.dialogue`: legame, ricordi, cosa
  stanno facendo, trame in cui sono coinvolte), una conversazione alla volta; altrimenti saluti secondo il
  legame.
- **Ricordi** (`people.json → ricordi`, fino a 30, pesati 1-3): dopo ogni chat (`ricordo`, `importanza`),
  dopo i dialoghi, le tappe delle trame, le missioni. Tornano nel prompt di ogni conversazione.
- **Legami col viandante** (`legame` nella risposta, `legameViandante`): amicizia, amore, matrimonio
  diventano regole del mondo. Con «Altro…» su una persona: effetti sociali `legame`, `ricordo`, `nascita`
  (un figlio del viandante e di chi lo vuole, con la famiglia già scritta).
- **Trame** (`world/plots.json`, `weavePlot`): un mistero, 2-4 persone esistenti, tappe nei prossimi
  giorni (chi, dove, quando, cosa, battuta, indizio), a volte una **missione** (porta / vai / parla) con
  ricompensa. Le tappe accadono al cambio del momento del giorno (viste o no); le persone ne conoscono i
  segreti e lasciano indizi; il Narratore ne intreccia una nuova quando non ce n'è.
- **Missioni**: affidate con l'azione `missione` della chat (chi chiede di portare qualcosa te la dà),
  diario nell'HUD, compiute arrivando, parlando o consegnando; la ricompensa è un oggetto e un ricordo.
- Due persone non condividono mai un nome (un omonimo riceve un appellativo).

## Conseguenze
- Costo: ~1 chiamata per conversazione tra NPC ascoltata, 1 per trama, 1-2 per persona incontrata.
