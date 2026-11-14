# ADR-0199 — Ogni finestra ha una via d'uscita al tocco: la croce e il tocco fuori, da un censimento

Data: 2026-11-14 · Stato: accettato · Riferimenti: T393 (step 43, Fase IV: la open beta), ADR-0198 (il gioco al tocco), T388 (l'HUD su un
telefono)

## Contesto

L'autore ha provato T387 sul telefono vero (14/11): chiudere l'inventario è difficile, forse anche altre finestre. Al tocco una finestra si
chiudeva con il ✕ «chiudi» dello strato del tocco (che preme Esc, in basso a destra) o con il tasto che la apre; l'inventario non aveva una
croce sua, l'aiuto e il menu delle azioni nemmeno, le croci che c'erano (chat, profilo, studio, atlante, grafo, console, «?») erano piccole.

## Decisione

1. **Un censimento delle finestre** (`PANELS`, `src/ui/panels.ts`): per ognuna come si apre, come si chiudeva al tocco, come si chiude ora, se
   un tocco fuori la chiude e perché no. Tre specie: una **finestra** sopra il gioco ha sempre la croce; una **scelta** (crediti esauriti,
   morte, lobby, Genesi, entrare) esce dai suoi pulsanti, perché chiuderla non direbbe come continuare; ciò che **non copre il gioco** (il
   fumetto, il segno di chi il master segue, il registro, il menu ⋯, «Gira il telefono») ha la sua via. Nessuna via d'uscita è un tasto
   (`touchExits`); `tests/pannelli-tocco.test.ts` lo controlla, con la croce nel file che costruisce la finestra e la sua misura.
2. **La croce** è una sola (`closeButton`): ✕ in alto a destra, che non prende il fuoco; col dito almeno `--touch-target` (44 × 44 px CSS,
   il passo della scala `--measure-47`), col mouse com'era. Dove non c'era (inventario, menu delle azioni, aiuto, fumetto) ora c'è anche su
   desktop; l'editor la mostra solo col dito, al posto di «Chiudi Esc». La testa dell'inventario resta in vista mentre la finestra scorre.
3. **Il tocco fuori** (`OutsideTouches`): solo un puntatore `touch`; guarda la finestra aperta più in alto e la chiude se il censimento lo dice
   (`yes`), o se dice `unlessTyped` e nessun campo di testo ha qualcosa scritto (inventario, menu delle azioni con «Altro…», studio); mai
   chat, profilo, console ed editor (`no`: si perderebbe ciò che è scritto, o toccare la scena chiude solo la tastiera). Il tocco che chiude
   non arriva a niente sotto: né alla scena (un clic, l'orbita) né al clic che segue. Lo strato del tocco (`#touch`) non è mai «fuori». Col
   mouse resta ciò che c'era: il clic sul velo dell'inventario lo chiude, ora solo col mouse (`pointerType !== 'touch'`), perché l'eco del
   tocco lo chiudeva anche con qualcosa scritto.

## Conseguenze

- Una finestra nuova entra nel censimento con `closeButton`, e in `main.ts` con `outside.watch` se un tocco fuori la può chiudere; il test
  rifiuta una finestra senza croce o senza un motivo dove il tocco fuori non chiude.
- Il ✕ «chiudi» dello strato del tocco resta: è Esc, e chiude anche ciò che non è nel censimento.
- Solo client: nessuna superficie nuova.
