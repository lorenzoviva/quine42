# ADR-0272 — I mobili degli interni si usano

- **Stato**: accettato
- **Data**: 2026-11-27
- **Task**: T514 (run #2 della beta, 26/11: in nessun universo i mobili dentro una casa rispondono a `E`)
- **Estende**: ADR-0214 (lo Scenografo, la via dei dati: i mobili sono voxel dell'edificio), ADR-0150 (posare sui mobili), ADR-0168
  (prendere e spostare i mobili), ADR-0212 (la guardia degli interni), T431 (il cursore trova un mobile per la sua scatola)

## Contesto

Lo Scenografo sceglie i mobili di un tipo di edificio e il kernel li posa a ogni seme **dentro la forma dell'edificio** (`furnishWithRules`):
sono voxel della sua griglia, disegnati con lui in una mesh sola, e i suoi pavimenti per chi cammina. Così costano nulla al disegno, ma non
sono cose del mondo: niente azioni del loro modulo, niente contenitore, niente «Prendi», niente ripiani; il cursore (T431) ne dice solo il
nome («Arredo»). La run #2 lo ha visto in ogni universo: una cassapanca dentro una casa non si apre.

Le vie possibili: (a) mobili veri, ognuno un'entità con la sua forma, e l'edificio disegnato nudo: una mesh e un corpo solido per mobile,
il costo del disegno moltiplicato per i mobili, e la guardia degli interni che non vale più per ciò che si disegna; (b) l'edificio resta come
è, e **accanto a ogni mobile un'entità che non si disegna**.

## Decisione

La via (b).

1. **La cosa di un mobile** (il componente `fitted`, `src/kernel/fitted.ts`): per ogni mobile che la forma di un edificio arredato posa
   (`FormResult.furniture`) il kernel fa un'entità **del modulo che indossa il suo modello** (`pieceModule`: un'entità, non qualcuno, non un
   veicolo, non unica; prima quella ferma che fa qualcosa, un contenitore, un'azione, delle parole; poi per id), con le sue azioni, il suo
   contenitore e `takeable` come il manifest li dice. Un mobile che nessun modulo indossa è una cosa col menu di ogni cosa: «Esamina»,
   «Altro…», «Posa … qui sopra»; e, **se il suo nome dice che contiene** (una cassa, una credenza, un baule, un armadio, un archivio, un
   barile; in italiano la testa del nome, in inglese le prime parole, `storeNamed`), un contenitore del kernel di `PIECE_STORE` posti col
   bottino comune del mondo. Negli universi del Concilio i moduli del seme (`obj.chest`, `obj.cupboard`, `obj.bed`) non ci sono, ma i loro
   modelli sì e lo Scenografo li sceglie: senza questo, in orichalcum una credenza dentro una casa non si aprirebbe. È la regola di ADR-0244
   («ciò che sembra un veicolo si guida») per i mobili: ciò che sembra un contenitore si apre. Non si prende: nessun manifest lo dice. La cosa **non si disegna** (niente glifo: l'edificio disegna i suoi voxel), **non ferma
   nessuno** (i voxel dell'edificio lo fanno), sta **sul pavimento del suo piano** (`fitted.z`, che `settleHeights` non tocca) e il suo
   aspetto è il modello del mobile al seme che ha nell'edificio (`PIECE_SEED`). Nasce col luogo dell'edificio e se ne va con lui.
2. **Chi è**: la sua origine è quella dell'edificio e la **chiave** del mobile (`pieceOrigin`, `pieceKeys`: l'id e l'angolo più basso della
   sua scatola, che due mobili non condividono): la stessa a ogni caricamento, su ogni macchina. Il salvataggio tiene ciò che il contenitore
   contiene (`containers`, per origine) come per le cose del luogo; un luogo che si scarica ricorda i contenitori aperti delle sue cose (prima
   si perdevano se nessun salvataggio era venuto prima).
3. **La sincronia** (`Kernel.syncFitted`, a ogni tick dopo i luoghi, prima dei solidi): un edificio si guarda di nuovo solo quando cambia il
   suo aspetto, i mobili che ha perso o il suo stadio, o una forma è pronta (`Forms.version`). Un mobile la cui cosa è già lì resta com'è (il
   suo stato, ciò che contiene); uno che non è più nell'edificio (un interno nuovo) lascia il mondo e il contenitore resta per origine. Un
   edificio in costruzione non ha mobili. Un mirror non li fa: li riceve dal mondo.
4. **Un mobile preso lascia l'edificio** (`FormComp.out`): la sua origine va in `consumed` come per ogni cosa presa o rotta, e l'istanza
   dell'edificio dice le chiavi dei mobili tolti; la sua griglia è quella arredata **senza i loro voxel** (`withoutPieces`, `instanceGrid`),
   come una porta aperta è la griglia con l'azione fatta: le stesse vie per il disegno (`changedBody`), per chi cammina (`groundOf`) e per le
   azioni del modello. Per questo la forma arredata dice anche i voxel di ogni mobile (`FormResult.furniture[].cells`; `FURNISHING` 3). Non
   si rifà il programma dell'edificio. Preso, il mobile è la cosa `thing:<modulo>` di ADR-0168 col seme che aveva nell'edificio; posato
   altrove resta così (`MovedRecord.seed`, solo quando non è quello che l'origine darebbe), con la sua forma e il suo glifo, una cosa come le
   altre. La rottura (`breakEntity`) lo toglie dall'edificio allo stesso modo.
5. **Dove si trova**: `E`, il tasto destro e il cursore trovano un mobile **per la sua scatola** sul piano del viandante (`pieceAt`, prima
   dell'edificio di cui è voxel), anche dove il suo mezzo è lontano (l'estremità di un letto). Il cursore dice ciò che la sua cosa è (il nome
   e la descrizione del modulo, «E per aprire»); di un mobile senza modulo, come prima, il nome della libreria e «Arredo — …».
6. **I ripiani** (ADR-0150): un mobile dell'interno è un supporto coi **pavimenti dell'edificio sopra la sua scatola** (`pieceLevels`), fra il
   suo fondo e la sua cima (`Support.top`: il piano di sopra non è un suo ripiano); ciò che vi si posa sta lì (`supportOf` lo ritrova per
   altezza), e il mobile con qualcosa sopra non si prende.
7. **In molti**: la cosa va ai client come le altre (`ENTITY_PARTS` ha `fitted`), **mai chi è** (`shownFitted`: niente origine dell'edificio
   né chiave), letta senza fidarsi (`readFitted`); l'edificio porta le chiavi dei mobili tolti (`FormView.out`, `outList`). Il mirror trova i
   mobili per la scatola e ne fa il menu; ciò che si sceglie lo fa il mondo, come per ogni cosa.
8. **Solo il kernel**: Lua non scrive `fitted` (`ecs.set`) né lo dà a ciò che fa (`ecs.spawn`); le azioni del modello sulla cosa di un mobile
   non ci sono (cambierebbero un modello che non si vede) e «Altro…» non le insegna.

## Conseguenze

- Ogni mobile di un interno risponde a `E` in ogni universo, col suo modulo dove c'è; il costo del disegno non cambia (un'entità senza mesh
  per mobile, nessuna draw call in più); prendere un mobile rifà la mesh dell'edificio una volta, come aprire una porta.
- I personaggi trovano i letti degli interni (le vie dei mestieri cercano per nome e tag): chi non ha via ci rinuncia, come sempre.
- Kernel 0.10.44: la forma arredata si rifà una volta (`FURNISHING`), i campi nuovi (`out`, `MovedRecord.seed`, `fitted` sul filo) sono
  aggiuntivi; un universo di prima si apre e i suoi edifici arredati hanno i mobili che si usano.
- Non fatto: un mobile rimesso dentro un edificio è una cosa come le altre (con la sua mesh), non torna voxel dell'edificio; i mobili di una
  struttura scolpita con la cantina profonda due caselle non sono stati provati; un `on_spawn` di un modulo di mobili che legge il glifo non
  lo trova.
