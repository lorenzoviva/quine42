# Il taglio verso la camera (T476, ADR-0257, riga 3 di T459)

Dove il terreno davanti copre il viandante dalla camera 3/4 (col rilievo vero, ADR-0256), il disco del taglio sotto terra di T416 si
accende all'altezza della testa, solo dal lato della camera (`Kernel.cameraCut`, `src/kernel/underground.ts`). Qui le misure e la
verifica nel browser.

## Le misure

`npx vite-node lab/scripts/taglio-camera.ts -- --punti 8 [--vero] [--arcipelago] [--distanza 30] --json <f>`: il kernel del seme offline, i
luoghi pianificati attorno a una griglia di 8 × 8 punti, ogni casella aperta (non solida) alle quattro direzioni della camera, con la 3/4
(0,95 radianti) alla distanza della simulazione (15, 8,7 caselle in piano) o del timone (30, 17,4).

| Mondo | Luoghi | Caselle aperte | Viste coperte | Dopo il taglio | Oltre il disco | File |
|---|---:|---:|---:|---:|---:|---|
| Seme (collinare) | 69 | 13 050 | **0** | 0 | 0 | `seme.json` |
| Rilievo vero, continente | 73 | 14 155 | **1 232 (2,2 %)** | 0 | 0 | `vero.json` |
| Rilievo vero, arcipelago | 84 | 2 573 | **308 (3,0 %)** | 0 | 0 | `arcipelago.json` |
| Rilievo vero, camera del timone (30) | 73 | 14 155 | 1 232 (2,2 %) | 0 | 0 | `vero-timone.json` |

- «Dopo il taglio»: con le colonne del disco abbassate al taglio (quello che fanno gli shader e i tappi), la linea guardata fin dove sta la
  camera. «Oltre il disco»: coperte da una colonna più lontana di `CUT_REACH` (9), che il taglio non può togliere: nessuna, anche alla
  distanza del timone.
- Il 4,6 % dello studio era sul rilievo grezzo del prototipo, senza le rampe, i lotti e la rete del kernel, su tutte le caselle.
- Il test (`cameraCutAt`) costa 0,012 ms in mediana, 0,016 al p95.

## Nel browser

Build di produzione del kernel 0.10.33, `vite preview`, Claude in Chrome, modelli locali. Un universo nuovo, `t476-west`, con una Genesi
offline col tema Far West (`nature.relief: 'true'`, `k` «monte» camminabile); il viandante spostato fermando il tappeto. Per il «senza»
la funzione del kernel è stata spenta dalla console (`k.cameraCut = () => undefined`), poi rimessa.

| Screenshot | Che cosa si vede |
|---|---|
| `01-dirupo-senza-taglio.jpg` | Luogo (5,1), casella (93, 34), camera da sud: un dirupo di 12,75 caselle a quattro caselle davanti; la camera sta dentro la parete, si vede solo lei |
| `02-dirupo-col-taglio.jpg` | Lo stesso col taglio: il viandante sul suo isolotto nel lago, il tappo marrone del dirupo alla testa in basso, il fianco a bande a destra |
| `03-trincea-senza-taglio.jpg` | Luogo (5,3), casella (98, 58): una trincea fra due pareti di 7 caselle, camera da sud; del viandante resta solo l'indicatore «E» |
| `04-trincea-col-taglio.jpg` | Lo stesso col taglio: la parete davanti tagliata alla testa (tappi marroni), il viandante dal mezzo in su, la parete di fondo intera con le ombre degli alberi |
| `05-trincea-da-ovest.jpg` | Girata la camera di un quarto (da ovest), lungo la trincea: il viandante si vede e il taglio non c'è |

Il seme (`?skip&offline`): 0 viste coperte su 31 104 dei luoghi caricati. Console: nessun errore del gioco (solo tre messaggi
dell'estensione del browser), nessun guasto.

## Che cosa resta

- Le ombre delle cose tagliate restano (come in T416): gli alberi tolti dal dirupo fanno ancora ombra nella trincea (`04`).
- Il tappo sta a 1,15 caselle sopra il pavimento: il viandante si vede dal mezzo in su dietro la riga tagliata più vicina.
- Il taglio compare d'un colpo al cambio di casella, senza dissolvenza.
- Le strutture e gli alberi che coprono il viandante senza il terreno non lo accendono.
