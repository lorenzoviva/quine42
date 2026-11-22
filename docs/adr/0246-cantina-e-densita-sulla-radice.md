# ADR-0246 — La cantina e la densità sulla radice del programma (`under`, `vpt` predefinito)

Data: 2026-11-22 · Stato: accettato (task T494 del backlog, step 13) · Riferimenti: ADR-0091 (i sotterranei), ADR-0135 (la lettera del suolo),
ADR-0049 (la densità di un modello), ADR-0208 (il forte dell'autore a 10), ADR-0209 (le strutture a 16), ADR-0227 (`waterline`), ADR-0161
(le carte fatte a mano), ADR-0136 (la versione del kernel)

## Contesto

L'autore ha sollevato il suo forte per le segrete (`lab/mjx/models/handmade/forte-handmade-segrete.xml`, `soil="E"`), ma nel laboratorio 3D e
nell'editor le segrete restavano a quota 0. Lo strato del suolo lo sceglie il kernel dalla voce dell'indice, `cellar` × `vpt`
(`cellarVoxels`), e il laboratorio non passava mai questo numero ai modelli fatti a mano: per loro `base` era 0. Anche la densità del forte
(10 voxel per casella) stava in una tabella del laboratorio (`HANDMADE_VPT`), non nel programma. Un programma fatto a mano dice già sulla
radice la sua scatola (`size`), il suolo (`soil`), l'origine e la linea di galleggiamento (`waterline`): la cantina e la densità sono della
stessa specie, sono come l'autore l'ha disegnato.

## Decisione

1. **`under="N"` sulla radice**, in voxel (1-120, `ROOT_UNDER_MAX`): quanto il programma scava sotto il suolo. Il compilatore lo legge
   (`MjxModel.under`) e lo dà come `soilAt` dove chi lo fa girare non dice un'altra `base`; un numero fuori dall'intervallo non compila, col
   motivo; senza `soil` è un avviso. La voce di `models/index.json` che non dice `cellar` ne ricava le caselle di cantina (`cellarOf(info,
   xml)`: `under / vpt` per eccesso, al più 3; la scatola si allunga di `under` voxel, come per una cantina) e i voxel esatti
   (`cellarVoxels(info, xml)`, `Forms.cellarVoxelsOf`); una voce che dice `cellar` vince, anche `cellar: 0`, che posa il modello a terra col
   suolo allo strato 0, come oggi senza cantina. Il Cartografo decide ancora quali strutture la vogliono (`structures[].cellar`).
2. **`vpt="N"` sulla radice**, facoltativo (4-40, come una voce): solo un **predefinito** per i modelli fatti a mano. La voce che non dice
   `vpt` lo prende (`withRoot`, `Forms.entry`: letto, mai scritto nella voce); una voce che lo dice e `densityFor` vincono.
3. **Lo Scultore non li scrive mai**: `checkProgram` li toglie dalla radice prima di provarlo (`withoutRootDensity`), così ciò che entra
   nella libreria non li ha. La densità delle sue voci è `densityFor`, la cantina quella che la richiesta chiede (`cellar` della voce): scritti
   nel programma cambierebbero la scatola, il lotto e il suolo che il kernel gli dà.
4. **Chi legge l'XML li legge dall'XML, senza tabelle**: il laboratorio 3D (la densità del catalogo da `rootVptOf`; il modello posato
   `base / vpt` sotto il prato, impronta e pavimenti dal suolo, il prato nascosto quando il taglio scende sotto il suolo, così le segrete si
   vedono dall'alto), l'editor (la densità della radice), il controllo delle carte fatte a mano (la scatola `under` più profonda) e le carte
   portate (una carta fatta a mano con `vpt` sulla radice non ne scrive un altro nella voce). Il validatore prova un programma con `under`
   come lo fa girare il mondo (`modelErrors`: senza `base` detta, quella della radice). `HANDMADE_VPT` resta solo per `forte-handmade.xml`,
   finché il suo autore non vi scrive `vpt="10"`.

## Conseguenze

- Kernel 0.10.21 (solo `Z`): nessun programma del seme ha `under` o `vpt`, le voci restano come sono, le richieste e le chiavi delle forme
  dei programmi di oggi sono le stesse (l'impronta dei luoghi di `lab/scripts/impronta-terreno.ts` uguale prima e dopo).
- Sicurezza: nessuna superficie nuova. Due attributi della radice, letti come interi in un intervallo chiuso; il loro effetto è la `base`
  che il kernel già dava da `cellar` (al più 120 voxel, entro i tetti delle forme).
- `forte-handmade-segrete.xml` dice `under="20" vpt="10"`: in un mondo, con una voce senza `cellar`, ha due caselle di cantina e il suolo allo
  strato 20.
- `tests/root-cellar.test.ts`.
