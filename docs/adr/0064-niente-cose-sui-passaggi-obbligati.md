# ADR-0064 — Niente cose solide sui passaggi obbligati

Data: 2026-10-24 · Stato: accettato (task T56a del backlog) · Riferimenti: Regola 10, ADR-0041, ADR-0043

## Contesto
Nella segnalazione del 24/10 (`docs/userchats/Blocchi.png`), su una passerella larga una sola casella che attraversa uno specchio d'acqua venivano collocati elementi di arredo solidi generati dal piano (`obj.banco`, `obj.cassa`, `obj.letto`, `object.sign`), bloccando totalmente il passaggio del viandante e violando la Regola Inviolabile 10 di `AGENTS.md`:
> «Ciò che sembra invalicabile lo è: il terreno blocca a caselle, i modelli con i loro voxel (ADR-0041); ogni luogo è connesso (varchi + sentieri scavati dal kernel, porte delle strutture sul sentiero).»

Fino a oggi, `placementsOf` sceglieva le caselle estraendo casualmente dall'insieme delle caselle raggiungibili (`result.reachable`), escludendo solo i varchi (`result.gates`) e le porte (`result.buildings[].doors`), senza verificare se la chiusura della casella scelta avrebbe sconnesso il grafo delle caselle calpestabili.

## Decisione
1. **Punti di articolazione del grafo delle caselle libere**:
   - In `src/kernel/layout.ts` è introdotta la funzione `articulationPoints(freeCells, size)`, basata sull'algoritmo di Tarjan (DFS con tempi di scoperta e valori `low`).
   - Identifica in tempo lineare $O(V + E)$ tutti i vertici di taglio (cut vertices) del grafo 4-connesso delle caselle libere del luogo (varchi, porte e sentieri garantiti inclusi). La rimozione di un punto di articolazione aumenterebbe il numero di componenti connesse, separando parti del luogo.
2. **Piazzamento guidato dalla connettività (`placementsOf`)**:
   - Il piazzamento distingue tra ostacoli solidi (`isSolidModule`, ossia entità con `body.solid === true` non spingibili) e contenuti non solidi (rune, oggetti a terra, bottino calpestabile, NPC).
   - Per gli oggetti solidi, il pool di estrazione esclude tassativamente tutti i punti di articolazione attuali (`!arts.has(cell)`).
   - Quando un oggetto solido viene posizionato, la casella viene rimossa da `freeCells` e i punti di articolazione vengono ricalcolati dinamicamente, garantendo che anche combinazioni di più oggetti solidi adiacenti non chiudano passaggi di larghezza maggiore (es. larghezza 2).
   - Se in un luogo non esistono caselle sicure non-articolazione per un oggetto solido, il piazzamento viene omesso con sicurezza (`undefined`).
3. **Protezione degli ingressi negli interni (`placeInside`)**:
   - Negli interni su modello 3D, gli oggetti solidi vengono filtrati per mantenere una distanza di sicurezza (≥ 1.2 caselle) dalle porte dell'edificio (`b.doors`), impedendo che mobilio solido blocchi l'accesso dall'esterno.
4. **Cose non solide permesse**:
   - Rune, oggetti a terra (`ground`, `loot`) e personaggi non solidi possono ancora essere distribuiti lungo i sentieri, arricchendo la scena senza bloccare la navigazione del giocatore.

## Conseguenze
- Sentieri a casella singola, passerelle su laghi, corridoi e strettoie rimangono sempre sgombri da ostacoli solidi.
- Negli slarghi o nelle nicchie cieche laterali (non articolazioni) gli oggetti solidi possono invece essere collocati normalmente.
- La connettività del mondo è garantita a livello strutturale in ogni fase di layout e pianificazione.
- Suite di test dedicata in `tests/bottlenecks.test.ts` (8 test unitari e d'integrazione).
