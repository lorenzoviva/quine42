# ADR-0047 — La telecamera che ruota

Data: 2026-10-23 · Stato: accettato (task T15 del backlog) · Modifica ADR-0040 (il mondo in 3D: camera fissa da sud).

## Contesto
La camera in 3/4 guardava sempre da sud: il nord in alto, come vuole il movimento del kernel (`core.movement`
legge `input.held("up")` e va verso −y). Dietro un edificio o un bosco non si vedeva nulla, e l'autore non trovava
come girarla (Q e R sono tasti del gioco).

## Decisione
1. **Quarti di giro**: `Input.turn` (0 = da sud, 1 = da est, 2 = da nord, 3 = da ovest; positivo = la camera gira
   in senso antiorario vista dall'alto). `,` e `.` girano di un quarto (tasti liberi, `Comma`/`Period` fisici);
   `rotate`/`setTurn` per il codice, `onTurn` avvisa chi deve sapere.
2. **I tasti seguono lo schermo**: l'`Input` traduce le direzioni. Il mondo chiede `isHeld("up")` (verso il nord);
   risponde vero se è premuto il tasto dello schermo che ora punta a nord (`DIRS[(d + turn) % 4]`, ordine
   orario `up right down left`). Il Lua del movimento e ogni altro lettore di `input.held` restano invariati e in
   coordinate del mondo; `W` porta sempre verso l'alto dello schermo. `facing` resta nel mondo.
3. **Il renderer** ha un angolo `yaw` che insegue `turn` per la via più breve (morbido, ~0,3 s); la camera sta a
   `(sin yaw, cos yaw)` dal viandante, inclinata come prima. Il **tasto centrale** trascinato gira la camera a mano:
   intanto i tasti seguono il quarto più vicino, al rilascio la vista si posa lì. Il sole e le ombre restano fermi
   nel mondo.
4. **Ciò che il kernel carica** (`kernel.view`) è il rettangolo di ciò che la camera vede: nei quarti dispari
   larghezza e profondità si scambiano (`Renderer.fitView`, chiamato da `onTurn`).
5. Nell'aiuto (barra in basso e pannello `H`).

## Conseguenze
- Il gioco non cambia: kernel, Lua, test e salvataggi restano in coordinate del mondo; la rotazione vive nel
  confine fra schermo e input. Un test (`tests/camera.test.ts`) fissa la traduzione e un passo nel kernel.
- Le rune si leggono in righe orizzontali del mondo: girata la vista, una frase incisa può apparire in verticale o
  al contrario. Si accetta: il testo sopra le rune (strato 2D) resta dritto.
- Niente angoli liberi da fermi: il movimento del kernel è a otto direzioni del mondo, e una vista storta li
  renderebbe obliqui sullo schermo.
