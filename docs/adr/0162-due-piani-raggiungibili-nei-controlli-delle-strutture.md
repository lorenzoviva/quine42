# ADR-0162 — Almeno due piani raggiungibili a piedi nei controlli delle strutture grandi

Data: 2026-11-06 · Stato: accettato (task T320 del backlog) · Riferimenti: ADR-0042 (lo Scultore), ADR-0160 (strutture procedurali), T156, T182

## Contesto

I controlli di `checkProgram` introdotti con ADR-0160 (T156) garantivano che un programma procedurale per la classe `structure` finisse entro 8 secondi, non galleggiasse a z=0, rispettasse l'altezza minima e non saturasse oltre l'85% della scatola. Tuttavia non verificavano che la scala consentisse effettivamente di salire al piano superiore. Nelle misurazioni su Gemini 3.8 Flash (`lab/banco/gemini/giudizio.md`, T156), la scala che non porta in alto o si interrompe era il difetto più comune (4 tentativi su 7), consentendo a edifici con un solo piano accessibile di entrare nel mondo come validi.

## Decisione

1. **Misura dei piani raggiungibili nel kernel**: in `src/kernel/forms.ts` è definita la funzione `reachableStoreys` (senza importare da `lab/`). Dalla quota del suolo esterno davanti all'edificio (e aprendo la porta se esiste l'azione `apri`), un'esplorazione BFS trova tutte le celle calpestabili raggiungibili dal corpo del viandante (`BODY_R = 0.22`), muovendosi sia a piedi sui gradini (`Math.abs(to - at) <= stepOf(vpt)` con `rampBlocks`) sia tramite salti ove consentito dalle regole del gioco (`JUMP_UP = 1.05`, `JUMP_FAR = 2.6`, atterraggi piani liberi da ostacoli con `topUnder`).
2. **Soglia delle strutture grandi**: per la classe `structure` da Grande in su (`procedural(cls, taglia)`), `checkOnce` in `src/kernel/agents/sculptor.ts` richiede che `reachableStoreys` individui almeno due piani coperti distinti (area coperta di almeno $(1{,}1 \cdot \text{vpt})^2$ voxel per piano, distanti verticalmente almeno $0{,}7 \cdot \text{vpt}$).
3. **Motivo di scarto**: sotto i due piani (`storeys.length < 2`), il controllo fallisce con la dicitura `piani: <n> (serve ≥ 2)`, che `checkProgram` formula come `taglia <nome>, seme <n>: piani: <n> (serve ≥ 2)`. Questa dicitura è direttamente comprensibile dal prompt della seconda richiesta dello Scultore.
4. **Costo e classi semplici**: il controllo richiede circa 60-110 ms a seme (meno di un decimo di secondo per esecuzione); non viene eseguito per le classi semplici (come `rock`, `tree`, `person`) o strutture sotto la taglia Grande, non alterandone il comportamento.

## Conseguenze

- `KERNEL_VERSION` sale a `0.4.3` (+Z).
- Programmi di strutture con scale interrotte o piani irraggiungibili vengono respinti con il motivo esatto.
- Lo scheletro procedurale offline continua a passare a tutte le taglie e semi provati.
