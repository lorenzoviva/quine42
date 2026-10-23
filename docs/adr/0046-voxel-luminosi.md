# ADR-0046 — Voxel luminosi

Data: 2026-10-23 · Stato: accettato (task T14 del backlog) · Segue ADR-0036 e 0038 (MarkovJunior del gioco),
ADR-0040 (il mondo in 3D) e ADR-0041 (asset come programmi).

## Contesto
Fiamme, braci, finestre accese, lanterne e le insegne al neon della corona (T19, T20) sono fatte di voxel che
devono **fare luce**: con il Lambert di tutto il resto prendevano ombra e occlusione, di notte sparivano. Il
bagliore poteva venire solo da luci a parte (componente `luce`) o da materiali «neon» interi (`MAT.glow`).

## Decisione
1. **Nel programma**: `<color symbol="F" value="ffcc66" glow="True"/>` (accanto a `part` e `hidden`); la
   voce della palette ha `glow: true` (`PaletteEntry`).
2. **Nelle mesh** (`meshVoxels`): un attributo per vertice `glow` (1 sui voxel che brillano), solo se la mesh ne
   ha; i voxel luminosi non hanno occlusione ambientale (solo la grana). Passa dai worker come gli altri buffer.
3. **Nei materiali** (`src/render/materials.ts`): ogni materiale tagliato (`clipped`) e quelli della corona e delle
   icone (`glowing`) aggiungono il colore del vertice × `glow` × `U.glow` (1,4) alla luce emessa; le geometrie
   senza attributo leggono 0 (`defaultAttributeValues`). `MAT.glow` (i bordi al neon) brilla tutto.
4. **Bloom leggero e selettivo** (`src/render/bloom.ts`, `Bloom`): la scena si disegna in un target con alfa
   (HalfFloat, 4 campioni); mentre il renderer disegna lì (`U.glowMask = 1`) i materiali scrivono alfa = 1 − glow;
   l'`UnrealBloomPass` al posto della soglia di luminosità prende `rgb × (1 − alfa)`, cioè solo ciò che brilla (un
   muro bianco al sole no), poi `OutputPass`. Il canvas non ha alfa, la maschera non si vede. Icone e
   laboratorio senza bloom vedono `glowMask = 0`.
5. **Foto dell'Artista** (`src/mj/photo.ts`): ciò che brilla non prende ombra né la faccia scura davanti.
6. **Lo Scultore** lo sa (prompt del gioco e del laboratorio: poche celle, mai tutto il modello); nelle `<action>`
   l'elenco delle lettere dice quali sono luminose (`ActionLetter.luce`), per accendere e spegnere scambiandole.
   Il falò del seme ha fiamme e brace luminose. Il laboratorio (`/lab/3d/`) le mostra con lo stesso bloom.

## Conseguenze
- Un passaggio in più a schermo (target a mezza precisione + mip del bloom): costo contenuto, misurato a 60 fps
  nel laboratorio di notte.
- I voxel luminosi non illuminano ciò che hanno intorno: la luce vera resta ai componenti `luce` (e al loro punto
  di luce). Le lastre delle rune (texture trasparenti) non sono ancora nel bloom.
- Le trasparenze sopra un voxel luminoso cambiano la maschera (il bloom ne è attenuato): accettato.
