# ADR-0047 — La telecamera che ruota e la camera libera

Data: 2026-10-23 (aggiornato 2026-10-24, task T55 del backlog) · Stato: accettato · Modifica ADR-0040.

## Contesto
La camera in 3/4 guardava originariamente sempre da sud: il nord in alto, come vuole il movimento del kernel.
Il primo passo (T15) ha introdotto i quarti di giro (`,` e `.`) e il trascinamento col tasto centrale con riaggancio
al quarto più vicino. Con T55 l'autore richiede la rotazione libera e continua (orbita come in `/lab/3d/`) con il tasto
centrale, mantenendo i quarti di giro su `,` `.`, più lo zoom in/out con la rotellina del mouse.
Tuttavia, un giocatore immerso nella simulazione non deve poter vedere la corona anticipatamente con una prospettiva
alterata (regola 8: la corona è invisibile finché il tappeto tiene).

## Decisione
1. **Camera libera (orbita continua)**: `Input.angle` tiene l'angolo continuo in radianti; `Renderer.yaw` ruota in modo continuo
   trascinando col tasto centrale (`dragStart`/`dragMove`/`dragEnd`). Al rilascio la camera resta all'angolo continuo impostato;
   `,` e `.` continuano a ruotare a scatti di un quarto di giro (`Input.rotate`/`setTurn`), riportando l'angolo al quarto esatto.
2. **I tasti seguono lo schermo ad angolo continuo**: l'`Input` traduce il vettore schermo `(sx, sy)` dei tasti premuti
   ruotandolo per `Input.angle` in coordinate del mondo `(wx, wy)`, mappandolo sul settore a 8 direzioni più vicino
   (N, NE, E, SE, S, SW, W, NW). Con W si cammina sempre verso l'alto dello schermo; a 45° W attiva contemporaneamente
   i due assi ortogonali nel mondo muovendosi in diagonale.
3. **Due modalità per orbita verticale e zoom**:
   - **Giocatore immerso nella simulazione** (non master, non god mode, e corona non svelata): l'orbita è puramente orizzontale
     (il pitch resta bloccato a 3/4, `0.95`); lo zoom con rotellina permette zoom-in fino a 2.5 caselle, ma non zoom-out oltre
     le 15 caselle predefinite (`[2.5, 15]`).
   - **Master / god mode o corona svelata** (`?god`, `?master`, master in multigiocatore, o giocatore uscito nella corona/studio):
     orbita libera in tutte le direzioni (pitch regolabile da 0.2 a 1.45 rad trascinando verticalmente) e zoom-out fino a lontano
     (distanza fino a 45 caselle, come in `/lab/3d/`).
   - Al rientro nella simulazione senza god mode, distanza e pitch tornano morbidamente entro i limiti consentiti.
4. **Ciò che il kernel carica** (`kernel.view`): `Renderer.fitView` calcola l'inviluppo rettangolare ruotato dell'area visibile
   tenendo conto sia della rotazione continua che della distanza di zoom corrente.
5. **Comandi**: tasto centrale del mouse trascinato (orbita), rotellina (zoom), `,` e `.` (quarti di giro), tasto destro invariato
   (menu della casella). Aggiornati la barra dei tasti e l'aiuto (`H`).

## Conseguenze
- Massima libertà di esplorazione visiva senza violare la quarta parete della simulazione: chi gioca normalmente non può
  scorgere la corona abbassando l'alzo o allontanandosi troppo.
- In god mode e nella corona la visione è totale, a scala architettonica e panoramica.
- Il movimento del viandante resta coerente e intuitivo ad ogni inclinazione dello sguardo.
