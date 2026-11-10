# Strutture che si adattano alla taglia: ciò che entra, non l'edificio rimpicciolito (T338)

L'autore (07/11): se l'area è piccola non si forza l'edificio completo del tipo; un forte piccolo è una torre a base larga, una fattoria
di 5 × 5 è una casa normale con una tettoia e la paglia dietro; a un'area più grande si aggiungono campi, staccionata, sentiero, il
fienile; alla più grande gli animali al pascolo. La decisione è [ADR-0179](../../../docs/adr/0179-cio-che-entra-nella-taglia.md). Si
rifà tutto offline, senza modelli (costo in dollari: zero):

```bash
node lab/banco/taglie/genera.mjs                                                    # riscrive fattoria.xml e forte.xml
npx vite-node lab/scripts/banco-taglie.ts -- --semi 2 --foto --json lab/banco/taglie/misure.json
npx vite-node lab/scripts/banco-taglie.ts -- --misura --semi 2                      # le strutture del seme e lo scheletro
```

## In breve

- **Una scala sola**: le strutture che crescono a regole girano a 20 voxel per casella a ogni taglia: Grande 100 × 100 × 80, Enorme
  150 × 150 × 120, Gargantuesca 200 × 200 × 160 (`densityFor`). Prima Enorme e Gargantuesca erano la stessa griglia di 120 a 16 e a
  12 voxel per casella: lo stesso programma dava lo stesso edificio, più grande in caselle. Le voci già scolpite tengono la loro scatola.
- **Le parti abitabili** hanno misure minime in caselle (`PARTS`): porta 0,55 × 1,5 (11 × 30), piano 1,5 di luce (30), stanza 1,4 di
  lato (28), tettoia 1,5 di luce e 1 di fondo. Le strutture del seme fatte a regole e lo scheletro le rispettano tutte (stanza 30,
  porta 11 × 30); **la fattoria del seme** (5 × 5 caselle) e la casa a graticcio no: la stanza più grande è di 0,6-1,3 caselle, e lo
  Scultore che la scrivesse oggi la vedrebbe tornare con «stanza: la più grande in cui si sta in piedi ha il lato di 26 voxel (1,30
  caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia: se l'area è piccola fai meno parti, non più piccole».
- **Ciò che entra**: lo stesso programma, a un'area più grande, deve contenere di più (un tipo di parte in più, o un quarto di parti in
  più); lo scheletro senza la sua sezione 7 (lo stesso blocco a ogni taglia) torna con «varietà: alla taglia Enorme…».
- **Il modo, a regole**: il corpo principale cresce a `steps` (uguale in caselle a ogni taglia); il resto cresce fino al bordo; una parte
  che vuole spazio va dove un pattern di terreno libero della sua misura combacia, e dove non entra il nodo non fa niente; un anello oltre
  il cortile (staccionata, mura) solo dove il terreno continua oltre il cortile. Nessun numero della scatola.

## Le misure del seme (`--misura`, seme 1)

| modello | piani raggiunti | stanza più grande | porta | esito |
|---|---|---|---|---|
| le 12 strutture `struttura-*` del seme (Claude Cloud) | 2 | 30 voxel, 1,50 caselle (la locanda del cinghiale, a 16: 28, 1,75) | 11 × 30 | passano |
| lo scheletro del prompt | 2 | 30, 1,50 | 11 × 30 | passa |
| `fattoria` (5 × 5) | 0 (la palizzata è chiusa) | 26, 1,30 (seme 2: 12, 0,60) | 13 × 32 | **stanza** |
| `structure` (casa a graticcio) | 0 | 25, 1,25 (seme 2: 19) | 12 × 33 | **stanza** |

## La fattoria (`fattoria.xml`)

| taglia | cosa contiene | parti (tipi) | tempo a seme | voxel |
|---|---|---|---|---|
| Grande, 5 × 5 caselle | la casa di due piani (63 × 35 voxel, stanza 32, porta 11 × 30, scala di 16 gradini in fondo), il tetto di coppi col comignolo, la **tettoia** dietro su pali (20 di fondo, 35 di luce) con **tre balle di paglia** contro il muro, la strada di ghiaia dalla porta al bordo | 33-35 (14) | 0,22-0,30 s | 57 mila |
| Enorme, 7,5 × 7,5 | + il cortile, la **staccionata** (un paletto ogni 5, la traversa a 7-8) con la strada come cancello, i **campi** di grano tutt'attorno (22 di fascia) | 176-187 (18) | 0,29-0,31 s | 75 mila |
| Gargantuesca, 10 × 10 | + il **fienile** (35 × 35, muri di 36, tetto scuro, un'apertura di 15 × 28) dove un quadrato di 41 × 41 è libero oltre la staccionata, le **pecore** al pascolo dove finiscono i campi | 193-208 (22) | 0,54-0,60 s | 99 mila |

![la fattoria Grande](fattoria-large.png)
![la fattoria Enorme](fattoria-huge.png)
![la fattoria Gargantuesca](fattoria-gargantuan.png)

## Il forte (`forte.xml`)

| taglia | cosa contiene | parti (tipi) | tempo a seme | voxel |
|---|---|---|---|---|
| Grande, 5 × 5 | **una torre a base larga**: il mastio di 51 × 47, la scarpa di pietra (8 di fondo, in pendenza) dietro e ai lati, due piani (stanza 33, porta 11 × 30, scala), feritoie, la terrazza merlata con l'asta | 39-43 (13) | 0,14-0,15 s | 40 mila |
| Enorme, 7,5 × 7,5 | + il cortile e la **cinta** (4 di spessore, 24 di altezza, merli sulle due facce) con la strada come porta | 41-42 (14) | 0,25-0,27 s | 81 mila |
| Gargantuesca, 10 × 10 | + le **torri** (15 × 15, 44 di altezza) sugli angoli della cinta dove 30 × 30 sono liberi oltre l'angolo, il tetto di ardesia a piramide | 46-47 (15) | 0,34-0,40 s | 103 mila |

![il forte Grande](forte-large.png)
![il forte Enorme](forte-huge.png)
![il forte Gargantuesco](forte-gargantuan.png)

Le foto sono del seme 1, i quattro lati (davanti, destra, dietro, sinistra), a cartone. Le misure intere sono in `misure.json`.

## Costo

Nessuna chiamata ai modelli: i due programmi sono scritti a mano (`genera.mjs` scrive i pattern lunghi: la scala, il fienile, le
pecore). Un giro del forte costa 0,15-0,4 s a seme, uno della fattoria 0,2-0,6; i controlli di `checkProgram` a una taglia (quattro
semi e uno alla successiva) 1,5-3 s. Lo scheletro gira in 0,5 s a 100, 0,6 a 150, 0,7 a 200.

## Ciò che non c'è ancora

- **Lo Scultore su Gemini** con il prompt nuovo non è provato: il giro costa (T336: 2,39 $ per sette strutture) e va fatto con il
  prossimo banco delle strutture.
- **La fattoria di 50 × 50**: il tetto di oggi delle classi è 10 × 10 caselle (200 voxel a 20); oltre servono la griglia a pezzi
  (ADR-0178) e una taglia nuova, che sono un altro task.
- **Il limite di una regola** (1728 celle): il fienile cerca un quadrato di 41 × 41, non il suo rettangolo intero; le parti più grandi
  vanno cercate a pezzi (un seme dove entra un quadrato, poi la crescita).
- **La varietà del seme**: nei due programmi il seme sposta la casa, le finestre, la paglia, il fienile, le pecore e le feritoie; la
  pianta resta la stessa forma. Il banco misura ciò che entra, non la varianza (quella è di T180).
