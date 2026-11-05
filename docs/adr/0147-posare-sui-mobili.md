# ADR-0147 — Posare sui mobili: il ripiano vero, l'impronta, il componente `posato`

Data: 2026-11-05 · Stato: accettato (task T291 del backlog) · Riferimenti: testo dell'autore in `docs/userchats/to-do-2026-11-05.md` («Interazioni grafiche di oggetti»), ADR-0041 (ogni aspetto è un programma), ADR-0043 e T53b (i pavimenti delle forme), ADR-0058 e ADR-0059 (il kernel sul server, il client sottile), ADR-0109 (ciò che esce, a elenco), ADR-0136 (la versione del kernel), regola 10

## Contesto

L'autore vuole «la possibilità di posare gli oggetti sui mobili», con la stessa mesh di quando l'oggetto è a terra. Le forme sanno già dove un corpo sta (`Form.levels`: ogni pavimento di ogni colonna, con le azioni fatte sull'istanza); un oggetto a terra è un'entità `pickup` che fluttua e gira, e se lo si getta non è salvato. Serve che l'oggetto stia sul piano vero del mobile, alla sua altezza, che quanti ne stanno lo decida la loro impronta, che resti nel salvataggio e per gli altri viandanti, che non renda invalicabile nulla e non si perda se il mobile sparisce.

## Decisione

1. **L'azione.** Nel menu di una cosa con un corpo che non è una persona né una struttura, chi impugna qualcosa ha «Posa *X* qui sopra» (`perform(id, 'posa')` → `kernel.placeOn`); su ciò che è già posato, «Posa *X* accanto», sullo stesso mobile. Si posa uno dell'oggetto impugnato. Un **mobile** è una cosa della classe `mobile` (cassa, banco, letto, credenza, barile, altare…), solida e ferma: un pozzo, una statua o un albero non lo sono, una cassa che si spinge si muove. Il rifiuto è una frase del mondo (`placeRefusal`), senza parole del gioco.
2. **Il ripiano e l'impronta, sulle forme vere** (`src/kernel/placing.ts`, funzioni pure). Un ripiano è un pavimento della forma del mobile sopra il suo suolo, con lo spazio sopra che si legge dagli stessi `Levels`. L'impronta di un oggetto è il suo modello visto dall'alto (`itemShape`): ogni colonna con qualcosa deve stare su un pavimento alla stessa altezza, con lo spazio per l'altezza dell'oggetto, e così le colonne intorno al suo perno; il **rettangolo** dell'impronta prende il posto sul ripiano, e due rettangoli non si toccano (così le forbici non si incastrano), né toccano il disco di chi ci sta in piedi. L'oggetto è girato come il mobile, più le quarte di giro che lo fanno stare. Quanti oggetti stanno su un ripiano è quanti rettangoli ci stanno: la cassapanca del seme ne tiene due generici, il banco con i suoi attrezzi uno, il barile basso nessuno.
3. **Quale ripiano e dove.** Il più largo per quell'oggetto (poi il più alto), entro la portata (da 1 casella sotto a 1,5 sopra i piedi, a 2 caselle da chi posa), e su quello, riga per riga, dall'angolo più vicino a chi posa: il primo che ci sta (first fit), sempre la stessa risposta per lo stesso mondo, senza orologio né caso.
4. **Il componente `posato {z}`.** L'oggetto resta un `pickup` senza luogo (non si scarica con il luogo, come ciò che si getta), con l'altezza del ripiano. A ogni tick `settleHeights` lo posa sul pavimento più alto non sopra `z` (`floorBelow`): il ripiano, o ciò che sta sotto se il mobile non c'è più (rotto, portato via) o non è ancora pronto; `z` resta, quindi il mobile che torna lo riprende. Non è solido e non aggiunge pavimenti (regola 10). Si raccoglie come da terra.
5. **Il salvataggio.** `world/stato.json → posati`: oggetto, quanti, x, y, z, yaw e la borsa, al più `MAX_PLACED` (4000), i più recenti; il campo c'è solo se qualcosa è posato. Alla lettura (`restorePlaced`) ciò che non è un oggetto noto in un punto finito resta fuori; una borsa passa da `readInventory`. La Genesi toglie ciò che era posato nel mondo di prima.
6. **Il filo.** L'azione viaggia nel messaggio `azione` che c'è (nessun messaggio nuovo, non chiama i modelli, nel ritmo leggero, con il raggio del server); `posato` entra in `ENTITY_PARTS`, e il kernel specchio posa l'oggetto sulla sua copia del mobile con le sue forme; il client sottile instrada `placeOn` al server.
7. **La versione.** Un campo nuovo nello stato, che un kernel 0.1.x di prima conserva com'è (T245a): sale `Z`, 0.1.7.

## Alternative scartate

- **Ogni cosa solida come appoggio, decide solo la geometria**: il bordo del pozzo, largo sette voxel, terrebbe le forbici; l'autore lo vuole tra i rifiuti, e «sui mobili» è una classe che c'è già.
- **L'impronta esatta anche per gli altri oggetti**: più oggetti per ripiano, ma due oggetti radi (forbici, una forchetta) si incastrerebbero l'uno nell'altro; il rettangolo è la stessa impronta, letta come si legge una cosa posata.
- **Il centro del ripiano per il primo oggetto**: bello da vedere, ma lascia ai lati strisce dove non sta più niente (un vaso al centro della cassapanca ne tiene uno solo invece di due).
- **L'oggetto legato al mobile (id o origine)**: gli id cambiano a ogni avvio e i mobili dei luoghi tornano solo quando il luogo si carica; l'altezza basta a ritrovarli, e a cadere quando non ci sono.
- **Un messaggio nuovo del protocollo (`posa` con lo slot)**: «ciò che impugni» è già sul server; `azione` porta tutto, con i suoi controlli.

## Conseguenze

- `tests/posare.test.ts`: il punto sulle forme vere del seme (banco, credenza, cassapanca, letto, barile: sul legno, con lo spazio sopra, controllato sui voxel), quanti ne stanno per impronta, l'angolo vicino, il giro su un ripiano stretto, i perché di un rifiuto, la posa nel kernel e le frasi, la regola 10, il mobile che si rompe, il salvataggio e la riapertura (anche di un salvataggio scritto male), due viandanti con il client sottile, ciò che arriva dal filo con `posa`.
- Il renderer disegna ciò che è posato fermo, all'altezza del kernel, girato come lo si è posato; un suono (`item:placed`, l'effetto `oggetto`).
- Ciò che si getta a terra resta com'era: non salvato, fuori da questo ADR.
- Sicurezza: nessuna superficie nuova fuori dal gioco. L'azione passa da `azione` (raggio, ritmo, `handleSafely`); `posato` dice di un oggetto ciò che la sua posizione già dice; `posati` è un file dell'universo che il master può scrivere, letto senza fidarsi.
