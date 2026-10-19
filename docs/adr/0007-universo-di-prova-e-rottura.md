# ADR-0007 — Universo di prova, resa grafica e stato "rotto"

Data: 2026-10-19 · Stato: accettato, la resa a glifi è sostituita da [ADR-0008](0008-concilio-degli-agenti-e-gemini.md)

## Contesto
Il design doc lascia aperte: nome definitivo, tema dell'universo di prova, provider IA, cosa vede il
giocatore quando il gioco si rompe, meccanica di uscita. Servivano risposte provvisorie per consegnare
un prodotto giocabile.

## Decisione (risposte provvisorie)
- **Nome**: resta *RUNE* (provvisorio). L'intro usa le rune futhark ᚱᚢᚾᛖ.
- **Tema**: *Il Regno di Valmora*, medievale quieto con crepe ("il bordo è sempre a 44 passi",
  "si torna sempre in piazza"). Moduli: abitanti, gatti, cartelli, pozzi; terreno a prati, sentieri,
  boschi, acqua, roccia.
- **Resa grafica**: tutto è glifo monospazio (stile roguelike) perché "tutto è rune": terreno, esseri,
  rune, corona. Rune trovate dorate, incise dal giocatore azzurre, rotte rosse.
- **Provider IA**: mock offline finché non si sceglie (vedi ADR-0005).
- **Quando si rompe**: l'intensità del glitch cresce col numero di fault: tearing orizzontale, ghost
  cromatico, scanline, blocchi di rumore, glifi corrotti, schermo che trema, rune rotte rosse e
  tremolanti, crepitio audio, pannello delle anomalie con il messaggio vero di Lua e il commit a cui
  tornare. I sistemi rotti smettono davvero di funzionare (es. rompere `core.movement` blocca il
  movimento). Si guarisce rimettendo a posto le rune o con `R`.
- **Uscita (prima versione)**: fermato o rotto il tappeto, si cammina fino al bordo (raggio 44),
  banner "OLTRE IL BORDO", la corona è calpestabile, `E` apre l'editor sul codice sotto i piedi,
  e si sblocca l'agente nella console.

## Conseguenze
- Il tema si cambia riscrivendo `prompts/theme.md`, il catalogo e i moduli: il kernel non ne sa nulla.
- La corona oggi si legge a fatica (il testo segue gli anelli): è atmosfera, l'HUD indica file e riga.
