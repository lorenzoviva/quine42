# ADR-0002 — Grammatica ed esecuzione delle rune

Data: 2026-10-19 · Stato: accettato

## Contesto
"Quello che c'è scritto sulla mappa si esegue." Le rune sono frammenti veri del codice; una `x`
isolata è la posizione X globale del giocatore. Serve una grammatica che il giocatore possa scoprire
e che renda pericoloso (ma recuperabile) sperimentare.

## Decisione
- **Una runa = un token Lua** (identificatore, numero, operatore o punteggiatura), che occupa
  tante celle quanti sono i suoi caratteri. Le parole intere (`carpet`) sono rune singole: si leggono,
  si raccolgono e si spostano come unità.
- **Riga = rune che si toccano in orizzontale**, da sinistra a destra. I token si uniscono con spazi.
- Compilazione: prima come espressione (`return <riga>`), altrimenti come istruzione. Così una runa
  isolata `x` è codice valido (un'espressione che vale la posizione X) e il tooltip ne mostra il valore.
- **Le righe girano ogni tick**, come leggi della fisica. Le espressioni pure (senza chiamate) vengono
  rivalutate ogni 10 tick: non hanno effetti e risparmiano tempo.
- Ordine di esecuzione: ordine di lettura (riga per riga, poi colonna).
- Composizione: il giocatore raccoglie rune in **mano** (sequenza ordinabile) e le **incide** tutte
  insieme davanti a sé (`Q`), oppure ne posa una (`X`). Comporre in mano non esegue nulla; incidere sì.

## Conseguenze
- Raccogliere da una riga la spezza: `carpet . active` senza `active` diventa `carpet .` → fault.
  Togliere prima il token centrale lascia due righe valide (`carpet`, `active`): è una tecnica che il
  giocatore impara. I suggerimenti degli NPC e l'aiuto (F1) lo accennano.
- Un'incisione accanto a rune esistenti si fonde con loro in un'unica riga: è responsabilità del giocatore.
- Le assegnazioni hanno effetti duraturi (lo stato è nei componenti): togliere la runa non annulla
  l'effetto, serve il rollback o un'altra frase.
