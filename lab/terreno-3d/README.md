# Il terreno in tre dimensioni e gli automi: i prototipi e le misure (T459)

Lo studio è [`docs/design/terreno-3d.md`](../../docs/design/terreno-3d.md). Qui c'è ciò che lo misura: un prototipo per ogni via, puro (né
kernel né three.js), lo stesso in Node e nella pagina. Niente di questo è del gioco, e niente lo importa da `src/`.

| file | che cosa |
|---|---|
| [`vie.ts`](vie.ts) | le vie e gli automi: il rilievo vero (`trueRelief`: massicci, terrazze, passi, il letto sotto l'acqua), la regola 10 sul grafo dei gradini con le rampe e le enclavi (`stepGraph`, anche alla lettera con `strict`), il viandante nascosto alla camera (`hiddenFromCamera`), gli strati in MarkovJunior (`STRATA_XML`, `strataMj`), il terreno in voxel (`voxelPlace`, `terrainXml`, i pavimenti 3D `voxelFloors`, la mesh fusa `voxelMesh`), la mesh a colonne (`columnsMesh`), l'acqua a tubi virtuali (`PipesWater`), il vento D2Q9 (`LbmWind`), il fumo (`Diffuse`), il fuoco a tabella (`RuleTable`) e lo stesso fuoco in MarkovJunior e in Lua |
| [`misura.ts`](misura.ts) | le misure in Node sul kernel offline del seme: per luogo (oggi, colonne, voxel a 1, 2, 4, 8), la memoria, i triangoli, la regola 10, il Lua della grande scala, gli automi per passo; scrive `misure/node.md` e `misure/node.json` |
| [`pagina.ts`](pagina.ts) | le stesse vie nella pagina, per il frame: `window.__t459.where()`, `.ground('columns' \| 'voxels2' \| 'voxels4')`, `.automata(true)`, `.restore()`; la compila e la valuta `misura-frame.mjs --terreno` |
| [`misure/`](misure/) | i rapporti della corsa dello studio: `node.md` e `node.json` (Node), `frame.json` (il browser); `m0-prima.json` e `m0-dopo.json`, `misura-frame.mjs` senza modalità prima e dopo la mesh dei luoghi in un worker (T486, ADR-0242); `vento.md` e `vento.json`, la risoluzione del vento di `lab/scripts/misura-vento.ts` (T484, ADR-0255) |

```bash
# per luogo e per passo, in Node (circa 10 minuti; --luoghi e --voxel per una prova più corta)
npx vite-node lab/terreno-3d/misura.ts -- [--luoghi 300] [--voxel 12] [--json f] [--md f]

# il frame, in un Chrome headless sulla GPU vera, su una preview della build (npm run build, poi npx vite preview --port <n>)
node lab/scripts/misura-frame.mjs <porta> --terreno [--secondi 8] [--json lab/terreno-3d/misure/frame.json]
```

Che cosa sapere prima di leggere i numeri:

- **Il rilievo vero è un generatore plausibile, non quello del gioco**: le statistiche della regola 10 (rampe, enclavi, passi, caselle
  nascoste) dipendono da lui, i costi quasi no.
- **I voxel in Node sono il caso costoso**: i 10 luoghi col dislivello più grande fra i 300, più uno di mezzo e la partenza; nel browser la
  finestra attorno al luogo più mosso, più piana.
- **La mesh a colonne non ha l'acqua, la schiuma e le istanze** di `buildChunk`: se ne confrontano i triangoli, non il tempo.
- **I programmi 3D del terreno vogliono `symmetry="(xy)"`** sulla radice: il predefinito di MarkovJunior in 3D è il cubo intero, e una regola
  di ciò che sta sotto diventa una regola di ciò che sta accanto.
- **Una griglia per `runOn` comincia con `.`** all'indice 0: il motore mette lì la cella vuota (`alphabetOf`) e il primo valore del programma
  è letto come lei; una griglia che comincia con un'altra lettera è letta sfasata di uno.
- **Il Lua a passo intero va chiamato con soli numeri**: una tabella di Lua passata da JS e tornata indietro costa il ponte a ogni accesso.
