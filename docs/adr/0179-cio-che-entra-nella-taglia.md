# ADR-0179 — Le strutture che si adattano alla taglia: ciò che entra, non l'edificio intero rimpicciolito

Data: 2026-11-10 · Stato: accettato (task T338 del backlog, step 30) · Riferimenti: l'autore in chat (07/11, epoca 328,
[`docs/userchats/to-do-2026-11-07.md`](../userchats/to-do-2026-11-07.md)), ADR-0049 (la densità dei modelli grandi), ADR-0092 (le taglie),
ADR-0160 (le strutture procedurali, un programma per più taglie), ADR-0162 (due piani raggiungibili), ADR-0178 (la griglia a pezzi); il banco
[`lab/banco/taglie/`](../../lab/banco/taglie/README.md)

## Contesto

L'autore (07/11): se l'area è piccola non si forza l'edificio completo del tipo. Un forte piccolo è una torre a base larga; una fattoria
di 5 × 5 caselle è una casa di misura normale con una tettoia e la paglia dietro, non una fattoria in miniatura (oggi passa per valida:
casa e cortile piccolissimi); a 15 × 15 si aggiungono campi, staccionata, sentiero, il fienile se entra; a 50 × 50 la fattoria completa
con gli animali al pascolo.

Due cose lo impedivano. **Nessuna misura delle parti**: i controlli dello Scultore guardavano che il programma finisse, toccasse terra,
non riempisse la scatola e avesse due piani raggiungibili, non quanto fossero grandi una porta o una stanza (la fattoria del seme ha la
stanza di 0,6-1,3 caselle a 20 voxel per casella). **Il programma non poteva sapere quanta area ha**: la scatola di una taglia era la sua
area alla densità che stava sotto i 120 voxel (`densityOf`, ADR-0049): Grande 100 voxel a 20, Enorme 120 a 16, Gargantuesca 120 a 12.
Enorme e Gargantuesca erano la stessa griglia: lo stesso programma dava gli stessi voxel, cioè lo stesso edificio più grande del 33 %
in caselle, porte comprese.

## Decisione

1. **Una scala sola per il mondo delle strutture che crescono** (`growsByRules`, la classe `structure` da Grande in su, che è il
   `procedural` di ADR-0160): girano a `TILE` (20) voxel per casella fino a `STRUCTURE_SIDE` (200) voxel di lato (`densityFor` in
   `src/mj/classes.ts`): Grande 100 × 100 × 80, Enorme 150 × 150 × 120, Gargantuesca 200 × 200 × 160. Una taglia più grande è un'area
   più grande alla stessa scala: ciò che il programma fa a `steps` (una casa, una porta) è uguale in caselle, ciò che cresce fino al
   bordo cresce con l'area, ciò che cerca un pattern di terreno libero della sua misura entra solo dove c'è posto.
2. **Ciò che è già scolpito non cambia**: la scatola di una voce è la sua taglia alla densità che la voce dice (`entryBox` in `forms.ts`,
   usata da `Forms.request`, `structureBox` e `addModel`): una Enorme di prima ha `vpt: 16` e resta in 120 voxel. Una voce nuova non
   scrive `vpt` (`modelSize`, che vale `TILE`); una carta portata da un altro universo tiene il suo (`bring.ts`). Il validatore prova una
   voce nella sua scatola, come prima.
3. **La scala delle parti** (`PARTS`, `partVoxels` in `classes.ts`), in caselle, la stessa a ogni taglia: porta 0,55 × 1,5 (11 × 30 a 20:
   ci passa il corpo, è alta come una persona), piano 1,5 di luce, stanza 1,4 di lato (le campate dello scheletro, 29 voxel, sono le più
   piccole che il banco chiama stanze), tettoia 1,5 di luce e 1 di fondo. Le leggono i controlli, il messaggio allo Scultore (`bodyLine`)
   e il banco; il prompt procedurale le ripete con il metodo.
4. **La misura** (`habitableParts` in `forms.ts`): i piani raggiunti a piedi come `reachableStoreys`; le stanze su ogni pavimento coperto
   dove sta un corpo, raggiunto o no (così una casa troppo piccola si dice tale anche se la palizzata la chiude): il lato del quadrato più
   grande di pavimento con il soffitto ad almeno la luce di un piano, il corpo compreso; le porte dalle celle che l'azione `open` cambia.
5. **I controlli** (`checkOnce`, `checkProgram`): una parte sotto la sua misura è un errore col motivo (`partErrors` in `src/mj/check.ts`:
   «stanza: la più grande in cui si sta in piedi ha il lato di 26 voxel (1,30 caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia:
   se l'area è piccola fai meno parti, non più piccole»). Al primo seme delle due taglie provate la più grande deve contenere di più
   (`compositionOf`: le parti sono i pezzi 26-connessi di una lettera di almeno 8 voxel; `varietyError`: un tipo di parte in più, o un
   quarto di parti in più, perché lo stesso edificio in una scatola più grande, per il caso della sua crescita, ne ha un settimo in più o
   in meno), altrimenti l'errore è della taglia più grande al seme 1 (`failedAt`). L'altezza minima di una struttura che cresce è quella
   della scatola della sua classe (`leastHeight`): l'area cresce, l'altezza non deve.
6. **Lo scheletro e il prompt**: lo scheletro aggiunge «ciò che entra attorno» (sezione 7): un cortile di 14, un muro basso dove il
   terreno continua oltre il cortile (a 150), un viale fuori dal muro dove restano 20 liberi in linea retta (a 200); a 100 resta la
   palazzina sola. Il prompt dice le tre scatole a 20 voxel per casella, la scala delle parti, la scala delle composizioni per concetto
   («cosa entra»: un forte è una torre a 5 × 5, una rocca con il cortile murato a 7,5, il forte con le torri a 10) e il modo di scriverla
   con le regole: il corpo a `steps`, ciò che cresce fino al bordo, un pattern di terreno libero della misura della parte, un anello oltre
   il cortile dove il terreno continua.

## Alternative scartate

- **La taglia nella griglia come segno** (il kernel che scrive un righello o una lettera per taglia, come `soil`): il programma avrebbe
  dovuto leggerla con regole apposite, e a densità diverse le parti a `steps` sarebbero comunque cambiate in caselle.
- **Rami per taglia con `observe`/`field`**: costano e non dicono l'area; un pattern di terreno libero dice esattamente se una parte entra,
  e un nodo che non trova niente non fa niente.
- **Le misure delle parti nel validatore**: il seme ha modelli di prima che non le rispettano (la fattoria, la casa a graticcio) e il
  validatore li rifiuterebbe; lo Scultore le chiede a ciò che scrive, come i due piani di ADR-0162.
- **La varietà a sole parti** (+10 %): lo scheletro senza la sezione 7 passa per caso da 92 a 105 parti tra 100 e 150; i tipi di parte
  non cambiano mai per caso.
- **Alzare `MAX_SIDE` per tutte le classi**: le bestie e le altre classi grandi non hanno parti da comporre; restano come sono.

## Conseguenze

- `KERNEL_VERSION` `0.6.3`: gli universi della `0.6` restano buoni, nessuna voce di prima cambia scatola; le strutture nuove Enorme e
  Gargantuesca hanno più voxel (2,7 e 6,4 milioni di celle, sotto `FORM_LIMITS`): lo scheletro gira in 0,6 e 0,7 s a 150 e 200, i
  controlli di un programma Enorme (4 semi a 150 e uno a 200) circa 3 s.
- Lo Scultore riceve le misure e il metodo; un programma che fa lo stesso edificio più grande torna con il motivo. Su Gemini non è
  provato (il banco è scritto a mano, a costo zero).
- Il banco `lab/banco/taglie/`: fattoria e forte a tre taglie, scritti a regole (`genera.mjs`), con le foto e le misure
  (`lab/scripts/banco-taglie.ts`). La fattoria del seme non è cambiata: è la «fattoria di 5 × 5 di oggi» che i controlli rifiutano.
- **Le carte fatte a mano restano alla densità di prima** (`boxUnderMaxSide`, in `handmade.ts`, nel laboratorio e in `bring.ts`): i loro
  tetti (2 milioni di celle, ADR-0161) sono misurati lì, e una struttura Enorme a 150 voxel li passerebbe; una carta portata gira dove
  è stata provata. Il banco delle strutture di T154-T182 (`lab/banco/misure.ts`, le impronte di `mj-hashes.ts`) resta alla scala del suo
  tempo, con i suoi bersagli e i suoi rapporti.
- Sicurezza: nessuna superficie nuova (misure, controlli e prompt dello Scultore; le carte fatte a mano tengono scatole e tetti di prima).
