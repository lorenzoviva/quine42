# ADR-0258 — L'acqua di ogni luogo col rilievo vero: un livello solo per la rete e per il passo

Data: 2026-11-23 · Stato: accettato (task T504 del backlog, nato dal difetto 1 di T503, `lab/banco/rilievo/README.md`) · Modifica ADR-0256 (punto 4: `worldLevels` con `keepCliffs`) · Estende ADR-0250 (la regola 10 della rete e delle enclavi), ADR-0094 (l'acqua che scorre), ADR-0048 (il rilievo e il mare)

## Contesto

La rete di un luogo (`Kernel.networkOf`, ADR-0250) livella il luogo **da solo**, come la miniatura: la sua acqua, le sue rive, i suoi lotti,
le rampe che pareggia. I piedi invece (`groundAt`, la collisione `free`/`bodyFree`/`freeReal`, il passo del server, le vie delle persone)
leggono il campo del mondo caricato (`levelsOf` → `worldLevels` su tutti i luoghi caricati, ADR-0048, T51a), dove uno specchio d'acqua che
continua oltre il bordo si porta al livello più basso dell'acqua dei vicini. Con `Hills` le due misure non si allontanavano mai oltre un
gradino, perché anche la terra scende verso l'acqua di due livelli per casella. Col rilievo vero (ADR-0256, `keepCliffs`) la terra resta dov'è
e l'acqua no: T503 ha visto in Far West 6 luoghi su 11 con caselle oltre il gradino fra le due misure; nel luogo (4,1) il lago è a 6 per la
rete e a 0 per i piedi, e la rampa che la rete ha scavato dal lago (8, 10, 12, 13) parte 8 livelli sopra l'acqua vera e non si sale; nel
luogo (5,1), tutto lago, la rete lo mette a 53 e il mondo a 0: un pozzo d'acqua con pareti di 14 caselle. Riprodotto offline sulla stessa
Genesi (35 luoghi attorno, 17 con livelli diversi; 169 luoghi in una griglia, 4 220 caselle diverse in 65 luoghi). Viola la regola 10: ciò
che la rete dà per percorribile (la rampa) non lo è, e ciò che sembra un lago di montagna è un pozzo.

## Decisione

1. **Col rilievo vero ogni luogo si livella da solo, anche per i piedi** (`src/kernel/relief.ts`, `worldLevels(..., keepCliffs = true)`):
   dove la terra tiene i suoi dirupi, niente attraversa il bordo di un luogo nel campo del mondo (l'acqua non segue l'acqua oltre il
   confine, le caselle costruite sopra l'acqua della bozza si abbassano solo verso l'acqua del loro luogo). Ogni specchio d'acqua sta al
   livello più basso delle sue caselle **nel suo luogo**, mai sopra la terra del suo luogo che lo tocca: lo stesso numero che la rete legge.
   Così `network.levels` e `groundAt` coincidono casella per casella (le rampe della rete sono la terra mossa su quei livelli), e i soli
   scostamenti restano quelli che la rete ignora per scelta (ADR-0250): gli scavi del giocatore e l'acqua che vi è scorsa sopra.
2. **I luoghi collinari restano come prima** (`Kernel.levelsOf`): i luoghi caricati si dividono per `relief.hasCliffs(col)`: quelli di
   `Hills` (e il vuoto) in un campo solo, con l'acqua che segue l'acqua oltre i bordi e le rive a due livelli per casella, identico a prima;
   quelli del rilievo vero ognuno da solo. Una fascia di pianeta col rilievo vero e l'orbita piana (ADR-0236) non si mescolano più in un campo
   con la scelta del primo luogo caricato. L'impronta delle mesh del seme (`lab/scripts/impronta-terreno.ts --luoghi`) è uguale byte per byte.
3. **L'acqua che scorre non si versa oltre una cascata fra luoghi** (`src/kernel/water.ts`, `WaterWorld.joined`; `Kernel.fallBetween`):
   due caselle vicine su due luoghi del rilievo vero, a più di un gradino nel campo del mondo, sono una **cascata**; l'automa (ADR-0094) non
   vi travasa acqua e non vi prende il corpo d'acqua di là. Senza questa guardia uno scavo in un lago di montagna, una volta che i luoghi sono
   livellati da soli, lo svuoterebbe a poco a poco nella valle oltre il bordo. Un mondo che non lo dice (`joined` assente: i test, `Hills`)
   versa come prima.
4. **Il test** (`tests/acqua-rete-passo.test.ts`): sulla Genesi offline del Far West, i dodici luoghi attorno a (4,1) e (5,1) hanno gli
   stessi livelli nella rete e nei piedi casella per casella; ogni coppia che la rete unisce non incontra un dislivello per il passo
   (`riseOnStep`); ogni rampa si sale a gradini; la rampa di (4,1) parte dall'acqua; il lago di (5,1) sta a 53, il più basso delle sue
   caselle; `worldLevels` con `keepCliffs` dà a ogni luogo il campo che ha da solo, senza `keepCliffs` segue ancora l'acqua oltre il bordo;
   l'automa non versa oltre una cascata. Sul kernel di prima falliscono i tre che devono.
5. **La misura ripetibile** (`lab/scripts/rete-gradini.ts -- --griglia R`): la corsa col viandante che si sposta pianifica i luoghi in modo
   diverso a ogni corsa (i tempi dei modelli locali: due corse sullo stesso kernel danno 1 683 e 1 483 coppie oltre il gradino
   nell'arcipelago), quindi non dice quali coppie sono nuove; con `--griglia R` i luoghi di un quadrato di `(2R + 1)²` attorno all'origine si
   pianificano uno alla volta e restano caricati, uguali a ogni corsa, e il JSON elenca le coppie oltre il gradino (`overPairs`) per il
   confronto fra due kernel. Lo script conta anche le caselle dove la rete e i piedi differiscono (`netDiff`, `netPlaces`) e le cascate
   (`falls`, `maxFall`).

## Misure (`rete-gradini.ts -- --griglia 6 --vero`, 169 luoghi, offline)

| | prima | dopo |
|---|---|---|
| Continente: coppie aperte oltre il gradino (di 95 511) | 4 736 | **4 061** (678 tolte, 3 nuove) |
| Continente: caselle con rete ≠ passo (luoghi) | 4 220 (65) | **0** (0) |
| Continente: cascate d'acqua fra luoghi (la più alta) | 0 | 202 (47 livelli) |
| Arcipelago: coppie oltre il gradino (di 108 109) | 172 | **139** (33 tolte, 0 nuove) |
| Arcipelago: caselle con rete ≠ passo (luoghi) | 228 (8) | **0** (0) |
| Arcipelago: cascate d'acqua fra luoghi (la più alta) | 0 | 16 (9 livelli) |

Rampe, enclavi tenute e caselle staccate non cambiano (la rete era già quella del luogo da solo); `networkOf` resta a 0,5 ms in mediana.
Le 3 coppie nuove stanno su un bordo solo: un fiume del luogo (-6,-5), da solo a 9, accanto alla riva del luogo (-6,-6) a 6 (prima l'acqua
del vicino lo portava a 4). Abbassare l'acqua di un luogo verso il rilievo oltre il bordo (provato con il limite al rilievo di là e al
rilievo di là più un gradino) crea più coppie nuove dentro i luoghi, fra l'acqua abbassata e le sue rive: 25 e 18.

## Conseguenze

- **Contratto invariato** (kernel `0.10.33`): i livelli sono derivati e mai salvati; un universo col rilievo vero si apre com'era, coi
  livelli dell'acqua che la sua rete aveva già. Gli universi collinari non cambiano di un byte.
- **In gioco**: il lago di montagna resta un lago di montagna; la rampa che la rete scava da un lago si sale dall'acqua; ciò che la rete dà per
  raggiungibile lo è per il passo, anche per il server e le persone. In multigiocatore lo specchio fa lo stesso conto (`ChunkView.relief`).
- **Le cascate fra luoghi**: dove l'acqua di due luoghi vicini sta a livelli diversi, il bordo è una cascata. Si nuota in su e in giù come
  prima (la rete e la collisione uniscono sempre due caselle d'acqua, ADR-0250: dentro un luogo hanno lo stesso livello, fra due luoghi è ciò
  che tiene connessi i luoghi i cui varchi sono d'acqua). Una cascata di 47 livelli che si risale a nuoto non è ancora «ciò che sembra
  invalicabile lo è»: resta un passo successivo (il Cartografo che non posa un lago su una terrazza che finisce su acqua più bassa, o i
  varchi d'acqua allineati come quelli di terra e la cascata che ferma il nuoto). Il modo locale ne fa più del Concilio vero, perché posa
  laghi sui massicci.
- **L'acqua che scorre** non attraversa una cascata: uno scavo accanto non svuota il lago di sopra né riempie quello di sotto.
- **Sicurezza**: nessuna superficie nuova (nessun messaggio, campo o API; la guardia dell'automa è del kernel).

## Alternative scartate

- **La rete che legge il campo del mondo caricato**: la rete e le sue rampe dipenderebbero da quali luoghi sono caricati quando il luogo si
  pianifica, non sarebbero più le stesse per il kernel, la miniatura e i client sottili, e cambierebbero a ogni ricarica.
- **L'acqua di un luogo limitata dal rilievo oltre il bordo** (deterministico: il rilievo del vicino non dipende dal suo piano): misurato, crea
  più coppie oltre il gradino di quante ne toglie (25 o 18 nuove contro 3), perché abbassa un lago sotto le sue rive.
- **La cascata che ferma il nuoto**: staccherebbe i luoghi i cui soli passaggi sono d'acqua; va prima garantito un varco d'acqua allineato.
