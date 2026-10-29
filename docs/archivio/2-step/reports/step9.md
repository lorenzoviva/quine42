# Step 9 — il passaggio al 3D: riassunto

Data: 22/10/2026 · Branch: `3d` (da `2832382`, step 8.2C) · Decisione: [ADR-0037](../adr/0037-passaggio-al-3d.md)
(attuato) · Piano e diario delle fasi: [`docs/plans/step9-3d.md`](../plans/step9-3d.md) · Seguito:
[`docs/plans/backlog.md`](../plans/backlog.md).

## In breve

- **RUNE è un gioco 3D senza immagini generate.** Il mondo si disegna con three.js in 3/4; ogni cosa (persone,
  animali, alberi, rocce, mobili, oggetti, case) è un **programma MarkovJunior** della libreria `models/`, e ogni
  istanza è un seme di quel programma. Il Concilio scrive solo testo: lo Scultore i programmi, l'Artista li giudica
  dalle foto.
- **Lo spazio è una scala di griglie**: atlante → piano del luogo a caselle (18 × 18, il MarkovJunior a caselle di
  prima) → lotti, su cui stanno strutture intere girate verso la porta → modelli a voxel (collisione e pavimenti dai
  voxel) → corpi in posizione continua.
- **Le azioni sono regole sul modello**: «Apri la porta» è un'`<action>` del programma; «Altro…» che cambia la forma
  di una cosa fa scrivere allo Scultore una regola nuova, provata dal kernel e imparata da tutto il tipo.
- **I costi si vedono**: ogni chiamata passa dal registro dei consumi (`world/consumi.json`), il costo in dollari è
  nel pannello del Concilio; nessuna richiesta ripetuta dopo un tempo scaduto.
- **Spesa di Gemini nello step 9: $0,0205** (6 chiamate, la prova dello Scultore e dell'Artista del gioco in F6).
  Tutto il resto è stato sviluppato e verificato offline.

## Cosa è cambiato

| fase | commit | cosa | ADR |
|---|---|---|---|
| F0 | `a3cc228` | piano: inventario, decisioni D1-D12, fasi, rischi | — |
| F1 | `1d84aae` | MarkovJunior del gioco in `src/mj/` (motore 3D, XML alla lettera, mesh, rig, classi, foto, misure); il laboratorio diventa il laboratorio di MarkovJunior | 0038 |
| F2 | `4dedfc4` | registro dei consumi, un solo file di prezzi, ragionamento `low`, modello per chiamata, niente ripetizioni dopo un tempo scaduto | 0039 |
| F3 | `d6423d8` | il kernel senza immagini: via ArtDirector, Atelier, modello di immagini, sprite, texture, icone dipinte | (0040) |
| F4 | `0feb6bc` | renderer three.js: terreno per chunk, cose, rune come lastre, testi sopra, giorno e notte, corona e studio dalle celle, taglio al cerchio | 0040 |
| F5 | `32872e4` | le cose hanno il loro modello: libreria (28 programmi nel seme `aurora`), forme nei worker, collisione dai voxel, arti, vento, animazioni, `<action>` nel menu, icone come foto | 0041 |
| F6 | `be4f71a`, `53dc212` | lo Scultore nel Concilio (per classe), l'Artista giudica le foto, il `ModelDirector` scolpisce ciò che manca; prova con Gemini | 0042 |
| F7 | `bff4ddf`, `447c10e`, `34adee7` | lotti e strutture: gli edifici del piano diventano modelli interi girati verso la porta, dentro è sul pavimento del modello, una struttura importante (Argon) per zona di 56 × 56 luoghi | 0043 |
| F8 | `fd85a30` | azioni come regole: «Altro…» scrive un'`<action>` sul programma del tipo | 0044 |
| T03 | `b1fa100` | correzione: alberi, massi e le loro ombre tagliati oltre il cerchio | — |
| T04 | `de71498` | aiuto senza meta-gioco, con i comandi del 3D; la parte «oltre il bordo» solo dopo la corona | — |
| T06 | questo | AGENTS.md, README, GEMINI.md, ADR-0037 attuato, diario chiuso, questo riassunto | — |

In numeri (dallo step 8.2C a oggi): 20 commit, 204 file, +7 473 / −11 487 righe (il 2D tolto pesa più del 3D
scritto: il renderer canvas da solo erano 1650 righe). Il nuovo codice del 3D (`src/mj/`, `src/render/`, forme,
Scultore, `ModelDirector`) è circa 5 000 righe. Test: 13 file, **141 verdi** (all'inizio 155: i 47 dei blocchi, del
WFC e degli sprite sono andati con ciò che provavano; 33 nuovi per forme, Scultore, lotti, azioni, consumi, MarkovJunior).

## Quanto è costato

**Gemini, nello step 9**: una sola prova misurata (F6, `lab/scripts/sculpt-game.ts`), con il registro del kernel:

| richiesta | scultore | chiamate | voto |
|---|---|---|---|
| `forma-bottiglia` (oggetto) | 3.1 Flash-Lite, 2 programmi | 2 + 2 giudizi | 9/10 |
| `npc-mugnaio` (persona) | 3.8 Flash | 1 + 1 giudizio | 8/10 |
| **totale: $0,0205** (3.1 $0,0046; 3.8 $0,0088; Artista 3.5 Flash $0,0071, prezzo stimato) | | **6** | |

Le decisioni prese prima (step 8A-8.2B, [report dei costi](costi-step8.2B.md)) avevano speso $3,89-6,20 di
laboratorio e $1,02-1,09 per la prova del modello complesso. Nessuna Genesi completa con Gemini è stata fatta nel 3D.

**Quanto costerà un mondo** (stima del report 8.2B, sezione 4, confermata dalla prova di F6 per gli oggetti e le
figure): un mondo come `valmora` con 30 tipi semplici, 20 figure e 10 strutture grandi costa **$2,1-4,3 di modelli**
(secondo Argon e il listino del 2027) più $1,3-5,4 di testo, contro $9,90-20,41 di sole immagini spese nel 2D.

## Cosa manca

Dallo step 9, rimasto fuori (alcune voci sono già task del backlog):
- **Le ancore del piano** («vicino a…»): il Cartografo mette le cose dentro, fuori, ovunque, non accanto a qualcosa.
- **Forme che cambiano con «Altro…» per gli oggetti portati e per i terreni** (solo le cose con un modello proprio).
- **Il piano dei luoghi in XML** (MarkovJunior 2D alla lettera, o l'esempio «Hills» per le altezze: T16).
- **La telecamera non ruota** (il movimento del kernel è relativo allo schermo; T15).
- **Nessuna prova completa con Gemini nel 3D**: una Genesi con lo Scultore e qualche luogo, con il registro acceso,
  per misurare il costo vero di un mondo (la stima sopra è del report 8.2B).
- **Le immagini del README** sono ancora quelle del 2D.
- **Il backup degli universi 2D** è copiato e verificato in `H:/projects/rune-backup/universi-2d/`, ma gli originali
  in `H:/projects/rune/universes/` non sono stati cancellati (aspetta l'autore, T05); il repository non ha un
  remote, quindi il push del branch `3d` è rimandato.
- **Il giudizio dell'Artista è generoso** (un difetto visto non porta il voto sotto 7): da tenere d'occhio.

Il resto del lavoro (coerenza del mondo, grafo del mondo, voxel luminosi, terreno con le altezze, la corona più
grande, multiplayer) è nel [backlog](../plans/backlog.md), da T07.
