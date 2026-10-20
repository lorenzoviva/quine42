# ADR-0026 — Meccaniche nuove (stati), morte, trascendenza, camminate valide

Data: 2026-10-20 · Stato: accettato

## Contesto
Il Concilio deve permettere l'evolversi del gioco (un cavallo sellato si deve poter usare). Se il
viandante muore di sete o di fame la sessione deve finire, con la scelta di continuare nello stesso
universo o ricominciare; nella corona non si muore più e non si perde nulla. Lo sprite del viandante
in cammino appariva tagliato o vuoto nelle direzioni diverse da sud.

## Decisione
- **Stati** (effetti `stato {nome, velocita, peso, luce, durata}` e `togli_stato {nome}`): condizioni del
  viandante (a cavallo, in barca, con lo zaino, con la torcia) che `core.movement` usa per la velocità,
  il kernel per il peso trasportabile e la luce; durata 0 = finché non si toglie. Il giudizio delle azioni
  libere invita a rendere possibili le meccaniche nuove con uno stato; diventano azioni dell'oggetto.
- **Morte**: `sys.needs` emette `morte` quando la salute arriva a zero; il kernel ferma il mondo e la
  schermata offre «Continua in questo universo» (una vita nuova in piazza: bisogni pieni, la borsa delle
  rune, il mondo com'è; resta una regola) o «Ricomincia da capo» (l'universo va nel cestino e rinasce dal seme).
- **Trascendenza**: entrato nella corona (`exitedOnce`, salvato nello stato della partita) il viandante
  non muore più e i bisogni restano pieni.
- **Camminate**: un fotogramma molto più vuoto o più basso dello sprite fermo è scartato, sia quando
  l'Artista dipinge (`ImageTools.measure`) sia quando il renderer lo mostra (`ImageCache.inkOf`).
