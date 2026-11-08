# Modelli grandi a parti coerenti: la griglia a pezzi (T339)

L'autore (07/11): le misure massime dei modelli sono limitate perché MarkovJunior lavora sull'intera griglia, una fattoria di 50 × 50
caselle con il pascolo non entra, e una prova di prima con due griglie di misure diverse è fallita perché i pezzi quasi mai combaciavano.
Qui: dove sta il tetto oggi, misurato; perché la prova di prima non combaciava; le due vie provate con le misure; la via scelta, nel
motore e nella cache delle forme (ADR-0176). Si rifà tutto offline:

```bash
npx vite-node lab/scripts/misura-tetto.ts -- --lati 120,240,360,480 --z 96 --json lab/banco/pezzi/misure/tetto.json   # il tetto
npx vite-node lab/scripts/misura-tetto.ts -- --solo fattoria-pezzi,fattoria-intera,forte-pezzi,forte-intero,riferimento-forte,forte-di-frontiera --lati 240,360,500 --z 50 --json lab/banco/pezzi/misure/tetto-50.json
npx vite-node lab/scripts/banco-pezzi.ts -- --semi 4 --foto --json lab/banco/pezzi/misure/banco.json                   # le vie, i bordi, le foto
```

## In breve

- **Il tetto di oggi non è il motore.** Col censimento di ADR-0142 un programma che decide tutto su un piano gira sulla griglia intera
  in 1,3 s a 12,5 milioni di celle (la fattoria di 50 × 50 caselle a 10 voxel per casella) e in 4 s a 50 milioni. A fermare un modello
  grande sono le scatole delle classi (120 voxel di lato, ADR-0049), `FORM_LIMITS` (8 milioni di celle: la fattoria è rifiutata) e la
  **mesh**: un quadrato per faccia visibile, 1,8 milioni di vertici e 80 MB per la fattoria.
- **La prova di prima** (le strutture a blocchi degli step 8A-8E) componeva pezzi nati separati, ognuno nel suo programma, con le prese
  dichiarate: combaciavano solo se le dichiarazioni coincidevano. Qui le parti nascono dallo stesso piano.
- **La via scelta, (a)**: il piano grossolano decide, una `map` lo porta ai voxel, il dettaglio gira **a pezzi** (`<pieces>`): ogni
  pezzo legge la griglia come il piano l'ha lasciata e il suo margine cresce con le sue regole, poi si butta. Con regole che non dipendono
  dall'ordine i pezzi danno la griglia intera voxel per voxel; sulla fattoria tetti, recinti e cancelli sono identici alla griglia
  intera a ogni seme, sentieri e recinti restano continui.
- **La via (b)**, finestre che scorrono con i bordi già scritti come ingresso, spezza ciò che cresce da un pezzo al successivo (una
  scala), e non dà niente in cambio. **Il margine fermo** spezza i tetti in tutte e due (fino a 10.500 voxel per seme).
- I pezzi non vanno più veloci (16 pezzi: 1,7 s contro 1,3) e a queste misure non risparmiano memoria: tengono ogni pezzo in un tempo
  e in una memoria che non crescono col modello e danno a ognuno il suo tempo (4 s), il che permette di alzare il tetto solo per loro
  (`FORM_PIECES`: 32 milioni di celle).

## 1. Il tetto di oggi

`lab/scripts/misura-tetto.ts`: ogni programma in scatole sempre più grandi, ognuno in un processo suo (il picco di memoria è suo);
il tempo del programma, il picco di memoria residente sopra quella del processo prima di eseguirlo (prima della mesh e, tra parentesi,
dopo), la mesh che il worker farebbe (`meshVoxels`). Una riga oltre `FORM_LIMITS` il gioco oggi la rifiuta.

**Scatole alte 96 voxel** (`misure/tetto.json`; qui il picco comprende la mesh):

| programma | 120² (1,4 M celle) | 240² (5,5 M) | 360² (12,4 M) | 480² (22,1 M) |
|---|---|---|---|---|
| struttura-forte-di-frontiera (seme) | 0,26 s | 0,37 s | 0,62 s | 0,94 s |
| struttura-locanda (seme) | 0,28 s | 0,40 s | 0,65 s | 1,01 s |
| struttura-tempio-della-luna (seme) | 0,31 s | 0,40 s | 0,79 s | 0,97 s |
| forte di riferimento (T181) | 1,65 s | 1,83 s | 2,40 s | 2,40 s |
| palazzina di riferimento (T181) | 0,95 s | 1,49 s | 1,63 s | 1,79 s |
| fattoria, a pezzi | 0,41 s | 0,94 s | 1,55 s | 2,56 s |
| fattoria, griglia intera | 0,35 s | 0,63 s | 1,25 s | 1,82 s |

I programmi del seme e del banco non riempiono una scatola più grande (fanno un edificio in mezzo): il tempo cresce poco, la mesh resta
0,3-0,5 milioni di vertici. La fattoria riempie l'area: il tempo cresce con le celle, la mesh con l'area (2,7 milioni di vertici e
127 MB a 480², con il prato visibile).

**Scatole alte 50 voxel** (`misure/tetto-50.json`, il picco prima della mesh):

| programma | 240² (2,9 M) | 360² (6,5 M) | 500² (12,5 M) | mesh a 500² |
|---|---|---|---|---|
| fattoria, a pezzi | 0,71 s · 54 MB | 1,20 s · 81 MB | **1,72 s · 96 MB** (16 pezzi, il più lento 0,19 s) | 1,0 s, 1,76 M vertici, 82,5 MB |
| fattoria, griglia intera | 0,50 s · 26 MB | 0,83 s · 57 MB | 1,32 s · 67 MB | uguale |
| forte grande, a pezzi | 0,56 s · 39 MB | 0,92 s · 48 MB | 1,42 s · 71 MB (16 pezzi, il più lento 0,09 s) | 0,3 s, 0,33 M vertici, 14 MB |
| forte grande, griglia intera | 0,45 s · 27 MB | 0,70 s · 41 MB | 1,12 s · 56 MB | uguale |
| forte di riferimento (T181) | 0,67 s · 34 MB | 0,93 s · 59 MB | 1,34 s · 87 MB | 0,3 s, 0,25 M vertici, 11 MB |

A 50 milioni di celle (la fattoria in una scatola di 1000 × 1000 × 50, cioè 100 × 100 caselle): a pezzi 4,6 s in 16 pezzi (il più lento
0,26 s), intera 4,0 s; la corsa intera lascia sul heap 384 MB, quella a pezzi 169.

Quindi il tetto, in ordine: **la mesh** (un `WorkerRunner` tiene 128 MB in tutto: la fattoria da sola ne vuole 82, e le sue facce sono
per un quarto quelle di sotto dello strato di terra, che nessuno vede), **`FORM_LIMITS`** (8 milioni di celle, 512 di lato), **le
scatole delle classi** (120 di lato). Il motore viene dopo: la griglia intera costa in memoria quanto le sue celle (i timbri, il buffer
di `all`, le corrispondenze di tutta la griglia) e un nodo che costa quanto la griglia a ogni passo (`path`) costa di più quanto più la
griglia è grande.

## 2. La prova di prima, e perché non combaciava

Le strutture a blocchi degli step 8A-8E (ADR-0032…0035, `lab/mj3d/` nel commit `23323f18`): uno Scultore dei blocchi scriveva blocchi di
una casella per un livello, ognuno col suo programma nella sua griglia, con le prese sui sei lati e le facce in voxel; un Architetto li
componeva con un WFC su una pianta a blocchi. Non combaciavano perché i blocchi nascevano separati e prima della pianta: le loro facce si
incontravano solo se le prese dichiarate e i voxel coincidevano, e lo Scultore dava nomi diversi alle zone che si toccano («niente
combaciava», ADR-0035); le prese vedono quattro lati e non il contesto (le torri con l'acqua verso il cortile); l'Architetto inventava
adiacenze che i modelli 3D non avevano (ADR-0036); nessuna regola vedeva oltre il bordo di un blocco (ADR-0034). Qui niente si dichiara:
il bordo fra due zone lo disegna la `map` dalle due celle del piano, e ogni pezzo vede oltre il suo bordo quanto il margine.

## 3. Le due vie

Il piano grossolano è la «stessa griglia» in cui le parti nascono insieme: una cella per casella (fattoria) o per quattro voxel (forte),
dove stanno le cose e quanto sono alte; le `map` lo portano ai voxel (nella fattoria la seconda disegna ogni cella dieci per dieci: i
solchi, le linee dei recinti da centro a centro con un paletto ogni cinque voxel, le porte verso l'aia); il dettaglio a piena scala gira
a pezzi. Le vie differiscono in ciò che un pezzo legge attorno a sé:

- **(a)** `halo="before"`: la griglia com'era quando il nodo è cominciato, cioè come il piano l'ha lasciata: i pezzi non dipendono l'uno
  dall'altro. È la via del task «un piano grossolano e il dettaglio di ogni zona dentro la sua casella con i bordi fissati dal piano e dai
  vicini».
- **(b)** `halo="written"`: ciò che hanno scritto i pezzi prima (in righe dal fondo), che restano fermi: la «griglia sola generata a
  pezzi, finestre che scorrono con i bordi già scritti come ingresso».

E per tutte e due il margine: **cresce** con le regole del pezzo e poi si butta (`edge="grow"`), oppure resta **fermo** com'è stato letto
(`edge="frozen"`).

`lab/scripts/banco-pezzi.ts` fa girare la fattoria (500 × 500 × 50, pezzi di 130) e il forte grande (384 × 384 × 96, pezzi di 128) a
quattro semi, sulla griglia intera e nei quattro modi. Lo stesso seme dà lo stesso piano (le estrazioni sono le stesse fino a
`<pieces>`): si confronta solo il dettaglio. `bordi.ts`:

- **strutture diverse**: i voxel delle lettere che il dettaglio costruisce senza caso (fattoria: tetti `R`, traverse `L`, paletti `n`,
  cancelli `Q`; forte: le scale `Q`) che non stanno dove li ha la griglia intera; 0 vuol dire che le parti combaciano come se la griglia
  non fosse mai stata tagliata;
- **salti**: dove due pezzi si incontrano, colonne vicine di qualcosa di alto (8 voxel o più) con le cime a più di un voxel di distanza;
  lo stesso conteggio sulle linee a mezzo pezzo, dentro i pezzi, dice ciò che è normale per il modello;
- **continui**: in quanti pezzi stanno i sentieri a terra e le traverse dei recinti (fattoria), il selciato (forte): come nella griglia
  intera, o spezzati.

**Fattoria** (`misure/banco.json`; tempo, strutture diverse; salti ai bordi e dentro; sentieri e traverse sempre uguali all'intera; il pezzo più lento 0,2-0,26 s):

| seme | intera | (a) | (a) margine fermo | (b) | (b) margine fermo |
|---|---|---|---|---|---|
| 1 | 1,27 s | 1,69 s · **0** · 0 / 0 | 1,43 s · **7.030** · 0 / 0 | 1,55 s · 0 · 0 / 0 | 1,38 s · 6.366 · 0 / 0 |
| 2 | 1,31 s | 1,76 s · **0** · 0 / 0 | 1,42 s · **3.990** · 0 / 0 | 1,58 s · 0 · 0 / 0 | 1,41 s · 3.738 · 1 / 0 |
| 3 | 1,28 s | 1,77 s · **0** · 0 / 0 | 1,41 s · **9.960** · 0 / 0 | 1,54 s · 0 · 0 / 0 | 1,47 s · 9.357 · 0 / 0 |
| 4 | 1,25 s | 1,69 s · **0** · 0 / 0 | 1,42 s · **10.520** · 0 / 0 | 1,52 s · 0 · 0 / 0 | 1,39 s · 9.905 · 1 / 0 |

**Forte grande** (`misure/banco-forte.json`): strutture diverse 0 in tutti i modi (nessuna scala ha attraversato un bordo nei quattro
semi); salti ai bordi dell'intera 2-14, di (a) 4-15, di (b) 5-16, dentro i pezzi 7-28 per tutti: sono le merlature, che si impacchettano a
caso anche nella griglia intera. Il forte gira in 1,2-1,5 s a pezzi (9 pezzi, il più lento 0,08-0,12 s), 0,8-1,1 s intero.

`fattoria-bordo.png` e `forte-bordo.png` mostrano, da sinistra, il riquadro dove due pezzi si incontrano nella griglia intera, in (a),
in (a) col margine fermo e in (b): col margine fermo il tetto del fienile si spezza in due falde dove passa il bordo; (a) e (b) sono la
griglia intera, salvo ciò che è a caso (le finestre si impacchettano in un altro ordine).

**Dove (b) perde**: il test `tests/mj-pieces.test.ts` ha una scala di trenta gradini che nasce in un pezzo e sale nel successivo. In
(b) il pezzo prima la finisce nel suo margine, che butta; il pezzo dopo legge la sua parte finita, senza la testa da cui crescere: la
scala si ferma al bordo. In (a) il pezzo dopo vede il seme nel suo margine, la rifà fino al bordo e tiene il resto: è la griglia intera.
La fattoria e il forte non hanno di queste crescite che passano un bordo, per questo lì (b) pareggia. Le vie non si equivalgono: **(a)**.

## 4. Cosa insegnano i due programmi

- **Il piano decide ciò che è non locale.** Dove stanno le cose, quanto sono alte, dove si apre una porta, dove passa un recinto e dove
  ha un cancello: tutto sul piano. Nei pezzi solo ciò che guarda vicino: i tetti (a padiglione: guardano fino a metà dell'edificio, e il
  margine della fattoria è 28), i muri svuotati, le finestre, il grano, gli alberi, gli animali.
- **I pezzi si allineano alle celle del piano** (130 nella fattoria, dove una cella è 10): ciò che si timbra in una cella (un animale, un
  pagliaio, un albero) non è mai tagliato.
- **`one` nei pezzi conta per pezzo**: le feritoie del forte pilota erano `steps="40"` per tutto il forte; nei nove pezzi diventavano
  360 (una torre crivellata dove la griglia intera non ne aveva); ora sono 5 per pezzo.
- **La mesh**: il grano a file larghe un voxel faceva il doppio delle facce (quattro lati per stelo); a file di due la fattoria è passata
  da 2,3 a 1,8 milioni di vertici. Il prato non si disegna (nel mondo sotto c'è il prato).

## File

- `fattoria.xml`: la fattoria di 50 × 50 caselle (la scatola la decide chi la fa girare: a 10 voxel per casella, 500 × 500 × 50); il
  piano (cortile con casa, fienile, tettoia e pagliai, sentieri dal cortile e linee da un bordo all'altro, campi per regioni di grano,
  ortaggi, frutteto e pascolo, recinti con i cancelli, animali), le due `map`, il dettaglio in `<pieces piece="130" margin="28">`.
- `forte.xml`: il forte pilota di T337 (`lab/banco/metodo/pilota/forte.xml`) con il cortile che cresce con la scatola, le torri lungo le
  mura, le caserme, e il dettaglio a piena scala in `<pieces piece="128" margin="40">`.
- `bordi.ts`: i controlli sui bordi; `fattoria.png`, `forte.png` (da quattro lati, via a, seme 1); `fattoria-bordo.png`,
  `forte-bordo.png` (il riquadro di un bordo: intera, a, a col margine fermo, b); `misure/` (i JSON delle tabelle).
- `browser/fattoria-nel-gioco.jpg`: la fattoria nel gioco (`?skip&offline`, caricata nella libreria dalla console e indossata da un'entità accanto al viandante): forma pronta in 2,3 s dal worker, 500 × 500 × 50 a 10 voxel per casella; blocca i corpi con la sua impronta (23 caselle in più in un riquadro di 19 × 11, che si liberano togliendola). Nella sandbox 3D del laboratorio i due programmi stanno nel gruppo «Banco: modelli grandi a pezzi (T339)».
