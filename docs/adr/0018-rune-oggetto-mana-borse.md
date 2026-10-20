# ADR-0018 — Rune come oggetti, frase, mana e cristalli, borse nell'inventario

Data: 2026-10-20 · Stato: accettato

## Contesto
L'autore apprezza glifi, combinazioni con `T` e l'energia come limite, ma chiede di poter scegliere la
combinazione, di consumare le rune (perché valga la pena raccoglierle e conservarle), di trattarle come
oggetti piccoli e leggeri, un sistema di cristalli magici trovati nelle case e nelle casse, e — come in
Project Zomboid — oggetti dell'inventario che sono contenitori (una borsa per le rune).

## Decisione
- **Ogni runa è un oggetto** `rune:<token>` (sintetizzato dal registro dei contenuti, non scritto nei
  pacchetti): peso 0,02, pila 50, glifo e colore della runa; le magiche hanno categoria `magia`.
- Raccolta, una runa va nella **borsa delle rune** (se c'è) e si aggiunge alla **frase** (`hand.tokens`):
  la frase è la selezione ordinata delle rune che userai. Si compone dalla borsa (clic), si riordina
  trascinando, si toglie con un clic; non può mai usare rune che non porti (`syncHand`).
- `Q` incide la frase (le rune lasciano l'inventario e tornano raccogliendole); `T` pronuncia le rune
  magiche della frase e le **consuma**.
- **Mana** (`needs.mana`): gli incantesimi costano mana (non più energia); torna piano da solo
  (`sys.needs`); i **cristalli magici** (categoria `magia`, effetto `mana`) lo ridanno se assorbiti. Un
  incantesimo di 3 o più rune consuma anche un cristallo.
- Qualsiasi contenitore (non il bottino «terreno») ha il 18% di probabilità di contenere qualcosa
  dalla tabella `magia` (cristalli, rune magiche, una sacca), in `magic.runes`.
- **Borse**: `ItemDef.container {size, accepts?}`; lo slot tiene il suo `inv`. Peso, conteggi e consumi
  guardano anche dentro le borse; una borsa posata o messa in un mobile conserva il contenuto. Gli
  oggetti nuovi vanno prima nelle borse dedicate (`accepts`), poi nelle tasche, poi nelle altre borse.
  Il giocatore parte con la borsa delle rune; il Narratore può inventare borse (`contenitore` nei pacchetti).

## Conseguenze
- La magia ha un'economia: rune da trovare e conservare, mana, cristalli.
- Il codice inciso resta un rompicapo di rune raccolte: incidere le sposta sul tappeto, non le distrugge.
