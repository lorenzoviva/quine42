# ADR-0261 — I climi della bozza: la neve solo dove il mondo, o il pianeta, la ammette

- **Stato**: accettato
- **Data**: 2026-11-26
- **Task**: T510 (run #2 della beta, `mesa`)
- **Estende**: ADR-0224 (la natura del mondo), ADR-0236 (i pianeti, `natureOfBand`), ADR-0134 (le ambientazioni)

## Contesto

Nella run #2 (26/11) l'autore ha trovato la neve in `mesa`, un universo del Far West. Le fonti, misurate sui file della run
(`git -C universes/mesa log prima-della-run-2..`) e sulla bozza del suo generatore:

1. **il generatore** (`world.terrain/logic.lua`): la bozza disegna i biomi dalla temperatura e dall'umidità su grande scala, uguali in
   ogni universo, e il «nord gelato» (`temp < 0.3`) dà `n`, la neve; col seme 1337 di `mesa` è il codice più frequente di un quadrato di
   17 × 13 luoghi attorno alla partenza (37 181 caselle su ~100 000, più di metà della terra). Col rilievo vero ci sono anche le cime fredde;
2. **la Genesi** chiede ogni volta il codice `n` come «cold walkable, slow ground (snow, frost)»: in `mesa` il Cartografo l'ha chiamato
   «brina d'altura» e ha scritto l'ambiente «Alture della Brina» (`g → n` all'80 %), con una regione dell'atlante;
3. **l'ambiente «Montagne» del seme**, senza epoca e quindi dato a ogni universo (`TIMELESS_LAYOUTS`), mette la neve sulle cime (`g → n`);
4. dalla bozza il Cartografo ha battezzato i luoghi («Passo del Vento Gelato», «Ansa della Brina»…) e da lì il Narratore ha fatto gli
   individui e le cose (il tagliatore di ghiaccio, gli stivali ghiacciati): quasi tutti i 43 luoghi della run sono gelati.

La natura del mondo (ADR-0224) diceva la geografia, il cielo, il giorno, la gravità e il respiro, non che cosa la bozza disegna.

## Decisione

1. **I climi della bozza** (`src/kernel/nature.ts`): `CLIMATES` = `temperate` (erba e boschi), `desert`, `jungle`, `frozen` (la neve e la
   neve sulle cime). `nature.climates` dice quali il mondo ammette; assente, tutti (il mondo di oggi, che non cambia di un byte: il seme
   medievale, un tema scritto a mano). `repairClimates` li tiene noti, una volta, nell'ordine di `CLIMATES`, almeno uno; tutti o nessuno noto
   è come non dirli. Si fissano alla Genesi con la natura (`chooseNature`) e non si rimodellano (`keptNature` non li tocca).
2. **Le ambientazioni li portano** (`WorldTheme.nature.climates`): il Far West, i Pirati e il Futuristico non hanno la neve
   (`temperate desert jungle`); gli altri tutti. La giungla resta in ogni ambientazione: il suo `j` è il folto di ogni mondo (in `mesa` i
   «cactus fitti», che stanno bene), mentre `n` è terra fredda comunque il Cartografo la chiami.
3. **Un pianeta ha i suoi** (`Planet.climates`, `repairPlanets`, `natureOfBand`): un pianeta ghiacciato `['frozen']`, la neve dappertutto
   (anche il quadrato di partenza al suo centro); l'orbita ha quelli del mondo.
4. **Il generatore li legge** (`world.nature().climates`): un clima che il mondo non ammette diventa il temperato, o il primo che ammette;
   la neve sulle cime solo col `frozen`. Il confine di Lua dà le liste come viste (`userdata`, non `table`), e il generatore le legge così.
5. **Il pavimento del kernel** (`genDraft`, `planetTile`): ciò che resta di un clima non ammesso nella bozza, qualunque cosa dica il
   generatore (uno scritto da altri), diventa la terra di base: `n → g`, `j → t` (`CLIMATE_CODES`, `offClimate`). La sabbia non è un codice
   del solo deserto (è anche la riva): non ha pavimento.
6. **Gli ambienti che scrivono un clima non ammesso** non si offrono ai luoghi nuovi (`offClimateWrites`, `environmentsFor`: anche quelli
   della loro regione dell'atlante prendono gli altri) e uno nuovo così non si prende (la Genesi, `createEnvironment`: `climateErrors`, col
   motivo al Cartografo). Alla Genesi, dove la neve non c'è, il Cartografo riceve `n` come «another slow walkable ground of this world»
   (e `j`, dove non c'è giungla, come un altro folto): `baseCodesFor(trueRelief, climates)`.
7. **Gli universi di prima si riparano senza chiamate** (`natureOfUniverse` in `readConfig`): una natura che non dice i climi prende quelli
   della sua ambientazione, se il suo `prompts/theme.md` è uno dei testi della lista (`themeClimates`); derivati a ogni lettura, mai scritti.
8. **Un piano di prima tiene la sua bozza** (`ChunkPlan.climates`, il segno come `swim` e `vpt`): ogni piano che il kernel fa dice
   `climates: true`; uno che non lo dice, in un mondo (o una fascia) che restringe i climi, si posa sulla bozza su cui è stato fatto, con
   tutti i climi (`genDraft(cx, cy, plan)`, `draftBefore`: `world.nature()` non li dice): i suoi lotti, le sue cose e ciò che vi è stato
   spostato restano dove erano. Solo i luoghi nuovi non hanno la neve.

## Conseguenze

- In `mesa` (copia della run) le bozze dei luoghi nuovi non hanno più `n`: prateria (`g`) al suo posto, i cactus restano; «Alture della
  Brina» e «Montagne» non si offrono più ai luoghi nuovi; i 43 luoghi della run restano com'erano, coi loro nomi gelati. La bibbia e gli
  individui gelati restano: non si riscrivono senza chiamate.
- `lab/scripts/climi-bozze.ts -- universes/<nome> [--raggio 8]` dice i climi di un universo sul disco, la mappa delle bozze dei luoghi
  nuovi e gli ambienti che non si offrono, senza chiamate.
- Visto nel browser su una copia di `mesa` (`?skip&offline`): i luoghi nuovi attorno a (0, -8), dove la bozza di prima era neve, sono
  prateria e cactus senza un `n`; «Passo del Vento Gelato» (2, -3) e i luoghi gelati della run restano com'erano.
- `tests/pirati-offline.test.ts` visita più luoghi: senza la neve i Pirati posano altrove la cassa sommersa, e una cassa su un letto troppo
  basso ferma lo scafo, come deve (`underKeel`).
- Il kernel sale a 0.10.38: gli universi della 0.10 restano buoni (un campo facoltativo, un segno nei piani nuovi).
- Trovato e non toccato: in `world.terrain/logic.lua` il controllo `type(nature) == "table"` di `generate_chunk` e `generate_relief` è
  sempre falso (la natura arriva come `userdata`), così il ramo del rilievo vero di `tile_at` (le montagne `k` sui massicci) e l'arcipelago
  del generatore non girano mai; la bozza col rilievo vero è quella delle colline (le isole le fa comunque il kernel, `islandDraft`).
  Correggerlo cambia la bozza di ogni universo col rilievo vero: è un task a sé.
