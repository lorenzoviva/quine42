# ADR-0257 — Il taglio verso la camera (R2 di T459: il disco di T416 quando il terreno davanti copre il viandante)

Data: 2026-11-23 · Stato: accettato (task T476 del backlog, la riga 3 dello studio di T459, `docs/design/terreno-3d.md` § 3.2, § 7) · Estende ADR-0091 punto 6 (il taglio sotto terra di T416) e ADR-0256 (il rilievo vero, che nelle sue conseguenze lo chiede) · Rispetta la regola 8 (la corona) e ADR-0124

## Contesto

Col rilievo vero (ADR-0256) un dirupo, una terrazza o la parete di una gola fra il viandante e la camera 3/4 lo coprono: lo studio di T459
lo misurava sul 4,6 % delle caselle aperte del prototipo (con `Hills` sullo 0 %). Il rimedio esisteva quasi: il taglio sotto terra di T416
(`src/kernel/underground.ts`) non disegna, in un disco di caselle attorno a chi sta in una cantina, ciò che sta più di `CUT_ABOVE` sopra
il suo pavimento, e mette i tappi del colore dello strato e i fianchi a bande (`buildCut`, `strataSide`). La riga 3 chiede lo stesso disco
acceso quando il terreno davanti copre il viandante, all'altezza della sua testa.

## Decisione

1. **Quando**: `hiddenFromCamera(top, tile, mid, line)` (puro, in `underground.ts`) è il test del prototipo lungo il quarto della camera
   (`towardsCamera`): la linea dal mezzo del corpo (`CAMERA_AIM`, 0,6 sopra i piedi, dove la camera guarda) sale di `tan(pitch)` a casella
   (1,40 per la 3/4) e passa sotto la cima di una colonna fra il viandante e la camera, al suo bordo vicino (`s − 0,5`). Si guarda fin dove
   la camera sta in piano (`cos(pitch) · distanza`, 8,7 caselle alla vista della simulazione) e mai oltre il disco (`CUT_REACH`, 9): ciò che
   il disco non può togliere non lo accende. Il test legge le colonne del kernel (`groundAt`), quindi è per casella e cambia solo quando
   cambia la casella, il quarto della camera o il terreno.
2. **Chi lo chiede**: `Kernel.cameraCut(line, at?)`, accanto a `Kernel.underground(at?)`, con la camera del renderer (`CameraLine`: il
   quarto, la salita, la distanza in piano) e il punto (il viandante, o chi il master segue); solo nella simulazione (`zone === 'sim'`).
   Restituisce un `Cut` (`cut` = pavimento + `CUT_ABOVE`, `tile`, `around: false`) o niente. Il renderer lo chiede quando il viandante non
   è sotto terra (il taglio sotto terra viene prima) e non è in viaggio (ADR-0236).
3. **Il disco solo davanti** (`Cut.around`): sotto terra il disco va tutto attorno (ciò che è sopra la testa copre da ogni lato); verso la
   camera solo le caselle che non stanno dietro la riga del viandante (`inCutDisc(…, around = false)`: il prodotto con il verso della camera
   ≥ 0). Ciò che sta dietro non copre il viandante e resta intero: la parete di fondo di una gola resta in piedi, e i suoi fianchi verso il
   disco sono il fondo del taglio, a bande di strati. È la sola differenza dallo «stesso disco» dello studio, scelta perché tagliare dietro
   toglieva contesto senza mostrare niente in più.
4. **Gli shader e i tappi**: un'uniforme in più, `U.cutBack` (`cutBackOf(around)`: −1e9 sotto terra, 0 verso la camera), nello stesso
   `CUT_FRAGMENT` di `clipped` e degli id dell'inchiostro; i tappi e i fianchi di `buildCut` dallo stesso `inCutDisc`, e `cutSig` dice se il
   disco va attorno. Nessuna luce cambia (il sole si attenua solo sotto terra, `dimAt`). Il viandante e le ombre non si tagliano, come in T416.
5. **La corona**: niente. Il taglio toglie soltanto e solo ai materiali della simulazione (regola 8, ADR-0124).

## Misure

`lab/scripts/taglio-camera.ts` sui luoghi pianificati offline (resoconto in `lab/banco/taglio-camera/README.md`), alle quattro direzioni
della camera, alla distanza della simulazione (15): col rilievo vero **2,2 %** delle viste (73 luoghi, 14 155 caselle aperte), nell'arcipelago
**3,0 %** (84 luoghi), col seme **0** (69 luoghi); dopo il taglio **0** in tutti e tre; alla distanza del timone (30, 17,4 caselle in piano)
nessuna vista coperta oltre il disco. Il test costa 0,012 ms (p95 0,016).

## Conseguenze

- Gli universi collinari non se ne accorgono: con `Hills` nessuna casella è coperta (`tests/taglio-camera.test.ts` su 120 × 120 caselle).
- Il tappo sta a 1,15 caselle sopra il pavimento, come sotto terra: il viandante si vede dal mezzo in su dietro la riga tagliata più vicina.
- Le ombre delle cose tagliate restano (i materiali delle ombre non si tagliano, come in T416): un albero tolto sopra il dirupo fa ancora
  ombra nella gola.
- Il taglio scatta per casella, senza dissolvenza: avvicinandosi a un dirupo compare d'un colpo.
- Non coperto: l'orbita libera e il timone oltre 9 caselle (il disco non arriva più lontano); le strutture e gli alberi che coprono il
  viandante senza il terreno (il test guarda solo il terreno).
- Kernel 0.10.33 (una `Z`: nessun formato cambia).
