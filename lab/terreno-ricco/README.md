# Il terreno ricco del Paesaggista (T509)

Il laboratorio dello studio [`docs/design/terreno-ricco.md`](../../docs/design/terreno-ricco.md): il sottobosco a istanze, i marciapiedi col
cordolo, i binari allineati, i cespugli rotolanti nel vento. Niente del gioco cambia: gli script leggono il kernel, gli universi dal loro git
(senza scrivere) e la pagina di una preview.

| file | che cosa |
|---|---|
| `modelli/*.xml` | i programmi del sottobosco, uno per tipo e molti semi: ciuffo d'erba, foglie secche, brecciolino, sassolini, spighe, arbusto basso, cespuglio rotolante (MarkovJunior, 20 voxel per casella) |
| `prova-modelli.ts` | i programmi sul motore vero, qualche seme: voxel, triangoli, tempo, la pianta in testo (`--viste`) |
| `misura.ts` | le misure in Node (§ 1, § 2, § 3 dello studio), rapporto in `misure/node.md` e `misure/node.json` |
| `rotolanti-lua.ts` | dove va il tempo di un sistema Lua che porta le cose col vento, a pezzi |
| `pagina.ts` | il sottobosco nella pagina, per `misura-frame.mjs --sottobosco` (per luogo, per finestra, fuso; densità, ombre, inchiostro) |
| `strade.ts` | il cordolo dei marciapiedi e i binari allineati nella pagina, per `misura-frame.mjs --strade <universo>` (solo foto) |
| `misure/` | i rapporti: `node.md`/`node.json` (Node), `frame.json` (il frame nel browser headless) |
| `foto/` | le foto della preview: oggi, col sottobosco a 1-4 a casella, da vicino e da lontano; le strade e i binari |

```bash
npx vite-node lab/terreno-ricco/prova-modelli.ts -- --viste --semi 2
npx vite-node lab/terreno-ricco/misura.ts -- --universi <cartella degli universi> --json lab/terreno-ricco/misure/node.json --md lab/terreno-ricco/misure/node.md
npx vite-node lab/terreno-ricco/rotolanti-lua.ts
# con una preview della build sulla porta <n> (node tools/pipeline/pipeline.mjs turno browser -- npx vite preview --port <n> --strictPort):
node lab/scripts/misura-frame.mjs <n> --sottobosco --foto lab/terreno-ricco/foto --json lab/terreno-ricco/misure/frame.json
node lab/scripts/misura-frame.mjs <n> --strade neapolis --foto lab/terreno-ricco/foto   # una copia dell'universo in universes/
```

Le misure dello studio sono del 27/11/2026, sulla macchina di T459 e T331 (Windows 10, 12 core logici, RTX 2070, Chrome headless, Node 22),
con altri agenti al lavoro: i tempi sono buoni al 10-20 %.
