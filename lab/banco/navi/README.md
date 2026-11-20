# Il banco delle navi (T440, ADR-0228)

La classe `vessel` a ogni taglia (`VESSEL_TILES` a `VESSEL_VPT`, 16 voxel per casella), misurata col viandante accanto: le scatole sono lunghe,
non i quadrati di D&D. La barca è quella con cui lo Scultore risponde offline per la scatola chiesta (`mockVesselProgram`,
`src/kernel/ai/mockVessel.ts`); alla Grande è il generico del seme (`universe/models/vessel.xml`). Ogni riga passa i controlli dello Scultore
(`checkProgram` → `src/mj/vessel.ts`): lo scafo alla linea di galleggiamento chiuso, lungo almeno il doppio della larghezza, la prua che si
stringe (l'ottavo davanti al più il 75 %); dalla Media in su il ponte asciutto raggiunto dall'imbarco, almeno metà sopra lo scafo, il timone accanto.

```bash
npx vite-node lab/scripts/banco-navi.ts -- --foto --md lab/banco/navi/misure.md      # tutte le taglie, le foto qui accanto
npx vite-node lab/scripts/banco-navi.ts -- --programma <file.xml> --taglia huge --foto  # un programma dello Scultore alla sua taglia
```

## Le misure

Il viandante è alto 1,5 caselle; la scialuppa è alta due terzi di lui, il galeone sei volte. La prua è la larghezza dell'ottavo davanti dello
scafo alla linea; il ponte, le caselle² dove un corpo sta asciutto raggiunte dall'imbarco e quanto ne sta sopra lo scafo alla linea.

| taglia | caselle | voxel | alta (viandanti) | linea (voxel) | scafo alla linea (caselle) | prua | ponte (caselle², sopra lo scafo) | controlli |
|---|---|---|---:|---:|---|---:|---|---|
| tiny (modellino) | 0.5 × 1.25 × 0.5 | 8 × 20 × 8 | 0,33 | 2 | 1 × 0,38 | 67% | 0,49 (63%) | passa |
| small (canoa) | 0.75 × 1.75 × 0.75 | 12 × 28 × 12 | 0,5 | 3 | 1,38 × 0,63 | 60% | 0,99 (69%) | passa |
| medium (scialuppa) | 1 × 2.5 × 1 | 16 × 40 × 16 | 0,67 | 4 | 2 × 0,88 | 57% | 1,93 (69%) | passa |
| large (barca a vela) | 2.5 × 6 × 4 | 40 × 96 × 64 | 2,67 | 10 | 5,5 × 2,38 | 63% | 12,56 (82%) | passa |
| huge (brigantino) | 4 × 10 × 6 | 64 × 160 × 96 | 4 | 16 | 9,06 × 3,75 | 67% | 32,62 (83%) | passa |
| gargantuan (galeone) | 6 × 16 × 9 | 96 × 256 × 144 | 6 | 24 | 14,5 × 5,63 | 64% | 76,97 (83%) | passa |

`misure.md` è la tabella scritta dal banco. Le soglie vengono da qui: un uovo tagliato ha la prua al 64-67 % nell'ottavo davanti (il 60 % le
scartava tutte), e la scialuppa aperta, svasata, ha il pagliolo sopra lo scafo alla linea per il 69 % (il 60 % la lasciava sul filo).

## Che cosa si vede

- `offline-<taglia>.png`: le quattro viste della barca offline (davanti, destra, dietro, sinistra), sotto l'acqua compresa: nel mondo la forma
  scende di `waterline` voxel.
- Nel laboratorio 3D (`/lab/3d/`), il gruppo «Navi alle taglie (T440)»: la scialuppa, la barca a vela, il brigantino e il galeone accanto al
  viandante, alla densità del gioco.

## Che cosa manca

Le navi dello Scultore vero (le prove costano: Argon e, su OpenRouter, Opus 5.5); le cabine misurate come piani; il riuso per i veicoli.
