# ADR-0040 — Il gioco è 3D: renderer three.js, niente immagini

Data: 2026-10-22 · Stato: accettato (step 9, fasi F3 e F4) · Sostituisce: ADR-0030 (prospettiva 3/4 dipinta e
scontorno), ADR-0011 per la resa (tile con texture), ADR-0013 e ADR-0017 per la parte grafica (Atelier, sprite,
camminate dipinte, icone a fogli).

## Contesto
ADR-0037 decide il passaggio al 3D. Il renderer 2D (1650 righe di canvas) disegnava chunk come immagini con
texture dipinte o procedurali, sprite e camminate dell'Atelier, tetti, la corona e lo studio; il kernel aveva un
ArtDirector che dipingeva texture, ostacoli, sprite e icone con un modello di immagini.

## Decisione
1. **Niente immagini generate nel gioco** (F3): via ArtDirector, Atelier, `Models.image()`, `imageModel`,
   `maxImages`, `animation`, i campi grafici dei tipi (`sprite frames scale texture sprites icon`) e l'archivio
   delle immagini. Ciò che descriveva l'immagine diventa `aspetto` (per lo Scultore). Le immagini restano solo
   **in ingresso**: l'Artista guarda le foto dei modelli.
2. **Renderer three.js** (`src/render/`, F4) con la stessa interfaccia del 2D (`render`, `toReal`, `mouse`,
   `showWalk`): HUD, pannelli e kernel non cambiano.
   - Camera **fissa** in 3/4 da sud, a 15 caselle: il movimento del kernel è relativo allo schermo (W = nord) e
     Q, R sono tasti del gioco, quindi niente rotazione della camera.
   - Spazi: kernel (x, y) = three.js (x, z), una casella un'unità. La simulazione in coordinate del tappeto,
     spostata del suo scorrimento; viandante, corona, studio in coordinate reali. Quando la corona è rivelata, i
     materiali della simulazione scartano ciò che sta oltre il cerchio (un `discard` nello shader): la corona è
     davvero fuori.
   - Terreno: una mesh per chunk (caselle colorate, acqua più bassa con le sponde, muri estrusi, porte come varchi,
     tetti a padiglione per edificio nascosti quando si entra); ricostruita quando cambia il chunk o un vicino.
   - Entità, viandante, rune (lastre luminose con il glifo, sempre una per casella), luci dei componenti `luce`
     (le più vicine), giorno e notte dal `daylight()`, lampi degli incantesimi.
   - Corona e studio dalle celle del kernel (`corona3d.ts`): torri con bordi al neon, viale, porte; sale con
     griglia, scaffali, modelli in mostra, schermi, teletrasporti, scale, il tavolo del Concilio con l'universo
     che gira. Hanno una luce loro, giorno e notte.
   - Uno strato 2D sopra (`overlay.ts`) per testo e interfaccia: fumetti, nomi, insegne, «E», la casella sotto il
     mouse, la mappa del calpestabile (V), il glitch.
3. Finché un'entità o una casella non ha il suo modello MarkovJunior (F5), si vede un **segnaposto** per tipo
   (una figura con arti che oscillano, un blocco, una gemma; alberi e massi a voxel sulle caselle).

## Conseguenze
- Il menu delle caselle funziona come prima (raggio sul terreno → casella); il menu di ciò che si guarda arriva
  con i modelli.
- three.js entra nelle dipendenze del gioco (era del laboratorio).
- Nessun test copre il renderer (gira solo nel browser): si verifica con `npm run build && npx vite preview`.
