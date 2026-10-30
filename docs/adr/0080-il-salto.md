# ADR-0080 — Il salto

Data: 2026-10-29 · Stato: accettato (task T56b del backlog) · Riferimenti: Regola 10, ADR-0043 (T53a: le rampe; T53b: i piani), ADR-0048, ADR-0064

## Contesto
La segnalazione del 24/10 (`docs/userchats/Blocchi.png`): un sentiero largo una casella su un lago, con un banco, una cassa e un
letto sopra. T56a (ADR-0064) non mette più cose solide sui passaggi obbligati; resta che il viandante non ha modo di superare una
cassa o un gradino alto. I dislivelli piccoli (il rilievo, le rampe di T53a) si salgono già camminando e devono restare così.

## Decisione
1. **Spazio salta** (azione `jump` di `src/kernel/input.ts`); `E` resta l'unico tasto di interazione nella simulazione. Nella corona e
   nello studio nulla cambia: `kernel.jump()` restituisce `false` fuori dalla zona `sim` e Spazio fa ciò che fa `E`.
2. **Il kernel decide il salto** (`kernel.jump()`, TypeScript, nessuna API Lua nuova): la direzione è quella in cui il viandante cammina
   (i tasti tenuti, nel verso della camera) o, fermo, quella in cui guarda. Lungo la linea, a passi di 0,1 caselle, il corpo deve poter
   passare in aria (`airFree`): l'acqua sì; muri, rocce e ogni casella solida del terreno che non è un liquido no; un modello solo se
   non va più in alto di `JUMP_UP` (1,05 caselle) sopra il pavimento da cui si salta (i tratti di pieno di ogni colonna di voxel, `topUnder`
   in `forms.ts` sui `Form.levels` di T53b; anche per istanza dopo le azioni del modello). Si atterra nel primo punto,
   da 1 a `JUMP_FAR` (2,6) caselle, dove il corpo sta (`free`, con le rampe di T53a) e il pavimento non è più alto di `JUMP_UP`; mai
   fuori dal cerchio. Senza un punto così è un salto sul posto: niente salto nell'acqua profonda né oltre i muri dei modelli alti.
3. **Stato nel componente** `salto {da, a, h0, h1, alto, t, dur}` del viandante (coordinate del tappeto): dopo i sistemi di ogni tick
   `jumpTick` lo porta lungo la linea, qualunque cosa abbia fatto il cammino, e all'arrivo il componente sparisce. Il tappeto continua
   a compensare (la posizione sul tappeto è quella del salto). Un salto con valori non finiti o fuori dalla simulazione si scarta.
4. **Si vede**: `kernel.jumping()` dà l'altezza dei piedi (dal pavimento di partenza a quello d'arrivo, più un arco alto quanto ciò che
   si scavalca più un margine); il renderer posa lì il viandante, con le gambe ferme, e un'ombra sul pavimento sotto di lui che
   rimpicciolisce con l'altezza; la camera non segue l'arco.
5. **Con i piani** (T70, ADR-0043 T53b): si salta dal pavimento su cui si sta (`floorAt` con `pos.z`); conta solo il pieno che comincia
   sotto `JUMP_UP` sopra quel pavimento (`Levels.base`, l'inizio di ogni tratto: una cassa, un muro fino al tetto; non il soffitto né il
   piano di sopra); si atterra sul pavimento più alto che il salto supera (`floorBelow`), se il corpo ci sta (`free` con quell'altezza), e
   durante il salto `pos.z` va dal pavimento di partenza a quello d'arrivo, così `settleHeights` lascia il viandante sul piano giusto.
6. **Multigiocatore**: nel kernel specchio (`mirror`) il salto non c'è ancora (il server, che muove il viandante con la collisione del
   cammino, lo riporterebbe indietro): Spazio fa ciò che fa `E`. Un messaggio `salta` nel protocollo è lavoro a parte.

## Conseguenze
- I mobili e le casse non chiudono più un sentiero per chi salta; un muro, un albero o un edificio sì (Regola 10: ciò che sembra
  invalicabile lo è). Dentro una struttura con più piani si salta su ogni piano (T70): il soffitto non ferma, i muri sì.
- Aiuto (`H`) e barra dei tasti dicono Spazio; Spazio non è più un secondo `E` nella simulazione.
- `tests/jump.test.ts`: la cassa su un sentiero si salta, il muro no, un ruscello sì, l'acqua larga no; un livello di rilievo si sale
  ancora camminando; nella corona nessun salto. `tests/storeys.test.ts` (T70): nella torre a due piani una cassa si salta al piano
  terra e al primo piano, atterrando sullo stesso piano; contro il muro esterno il salto è sul posto.
