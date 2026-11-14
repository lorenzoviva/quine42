# ADR-0198 — Il gioco al tocco: la levetta tiene i tasti, i pulsanti premono i tasti, le dita sono i tasti del mouse

Data: 2026-11-14 · Stato: accettato · Riferimenti: T387 (step 43, Fase IV: la open beta), ADR-0040 e ADR-0047 (la camera e i tasti che girano con
lei), ADR-0139 (i tasti di ogni viandante, `keys`), ADR-0111 (la CSP)

## Contesto

L'autore ha provato il gioco da un telefono (14/11, in orizzontale): il sito si vede bene, ma nel gioco funzionavano solo il clic sinistro (il
tocco) e il destro (la pressione lunga, solo dove il browser la dà: Chrome su Android sì, Safari su iOS no); movimento, orbita, zoom e i comandi
che sono solo tasti no. Nel gioco non c'era nessun gestore del tocco.

## Decisione

1. **Uno strato a parte, solo col dito** (`TouchControls`, `src/ui/touch.ts`): si accende quando un puntatore di tipo `touch` tocca la pagina
   (o il puntatore principale è `coarse`: un telefono) e si spegne al primo clic di un mouse; la classe `touch` sulla radice lo mostra. Su un
   desktop non cambia niente: nessun elemento visibile, la legenda dei tasti al suo posto, la rotella e il tasto centrale come prima.
2. **Nessuna via nuova nel kernel.** La levetta (in basso a sinistra) tiene le quattro direzioni dello schermo di WASD con `Input.setHeld`: la
   direzione del pollice diventa una delle otto che danno due tasti (`stickAxes`, `axesKeys`, con una zona morta), e il kernel la gira nel
   mondo come gira WASD (`Input.isHeld`); in multigiocatore partono gli stessi `keys`. I **pulsanti** premono i tasti: un `keydown` (e il
   `keyup`) sul `body`, come un tasto vero con niente a fuoco (`pressKey`), così ogni finestra che ascolta i tasti risponde come fa (il menu
   delle azioni si chiude con Esc ed E, `Input` sa quali tasti valgono anche con una finestra aperta). Sempre in vista E, salta, T, la borsa
   (I) e ⋯; nel menu ⋯ gli altri tasti del pannello dei controlli (P, F, Q, X, Z, C, ⇧Z, ⇧C, `,`, `.`, V, R, H; G e F2 solo per chi ha
   passato il bordo o lo sviluppatore, come i tasti); una finestra aperta lascia solo ✕, che è Esc. Le caselle della hotbar si toccano come
   `1`–`6`. Chat e atlante non hanno un tasto loro: si aprono con E, come da tastiera.
3. **Le dita sulla scena sono i tasti del mouse** (`SceneGestures`, `src/ui/gestures.ts`, puro): un tocco breve è il clic sinistro
   (`clickStudio`) e mostra per un poco ciò che il mouse direbbe passandoci sopra; un tocco lungo (500 ms senza muoversi) è il destro
   (`contextAt`), su ogni browser; un dito che si muove oltre 10 px è il tasto centrale trascinato (`dragStart`/`dragMove`: l'orbita con i
   limiti di oggi); due dita sono la rotella (`pinchDistance`). Il riconoscitore cancella il `pointerdown` del dito, quindi niente eventi del
   mouse dopo; il menu del tocco lungo del browser e un clic in ritardo sono riconosciuti come eco del dito (`ownsMouse`) e non rifanno ciò che
   il dito ha fatto. Un gesto finito (un pizzico che perde un dito, un tocco lungo) non ne diventa un altro finché tutte le dita non si alzano.
4. **I limiti della camera sono uno** (`src/render/camera.ts`): `ZOOM` (2,5; 15 nella simulazione; 45 con l'orbita libera), `zoomDistance`,
   `wheelFactor`, `pinchDistance`; la rotella e il pizzico passano di lì (`Renderer.zoom`, `Renderer.zoomTo`).
5. **La pagina sopra la scena non si ingrandisce né scorre**: `touch-action: none` sulla scena e sullo strato, `manipulation` sul resto (niente
   zoom col doppio tocco, il pizzico sulle finestre resta). **La tastiera sullo schermo non copre il campo**: `interactive-widget=resizes-content`
   nel `viewport` (Chrome su Android rimpicciolisce la pagina), e dove il browser non lo fa `--keyboard` (ciò che il `visualViewport` dice
   nascosto); scrivendo (`typing`) lo strato si toglie, la chat e la riga di «Altro…» stanno sopra la tastiera e il campo si porta in vista.

## Conseguenze

- Su un telefono si cammina, si gira la vista, si avvicina, si usa ogni tasto del pannello. Ciò che resta solo del mouse o della tastiera:
  trascinare nell'inventario (le sue azioni hanno pulsanti), l'editor e la console del master (finestre di testo).
- Un tasto nuovo del pannello dei controlli è una riga di `TOUCH_MAIN` o `TOUCH_MORE`.
- Solo client: nessun messaggio, nessuna rotta, nessuna superficie nuova.
- La prova nel browser: eventi `PointerEvent` con `pointerType: 'touch'` dalla console, o un Chrome headless con `Emulation.setTouchEmulationEnabled`
  e `Input.dispatchTouchEvent` (tocchi veri) a 844 × 390; la pagina non si apre in un iframe (`frame-ancestors 'none'`). Catture in `docs/catture/T387/`.
