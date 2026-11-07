# Censimento delle lingue (T239)

> Generato da `npx vite-node lab/scripts/censimento-lingue.ts` sul commit corrente: non modificarlo a mano, rilancia lo script.
> Il progetto delle lingue è in [`lingue.md`](lingue.md).

## Come conta

- **testi**: stringhe in italiano che una traduzione tocca (ciò che si mostra, si dice, si scrive); in TypeScript i letterali con almeno due parole e parole
  funzionali italiane o accenti, in HTML nodi di testo e attributi visibili, in JSON i valori, in Lua le stringhe del codice, in Markdown ogni blocco.
- **prompt**: i letterali template di almeno 200 caratteri con forma di istruzione (`Rispondi`, `JSON`, `##`…) e i file di `universe/prompts/agents/`.
- **id per nome**: parole italiane singole che il codice confronta (`===`, `case`, `includes`, unioni di tipi) o che stanno in un campo identificatore
  (`id`, `tipo`, `classe`, `uso`, `ambiente`, `azione`…): **non si traducono**, si etichettano.
- **chiavi su disco**: nomi di campo italiani distinti nei JSON (`persone`, `famiglia`, `tappe`…): sul disco e sul filo, non si rinominano senza migrazione (ADR-0117).
- **parole nei commenti**: commenti italiani (i commenti sono inglesi, in Lua e negli XML del seme da T309, ADR-0153): ciò che resta è da tradurre.
- Euristica deterministica, non un parser di lingua: sbaglia sui casi di confine (una parola inglese che finisce in vocale, un'etichetta di una parola sola).
  Le cifre servono a dimensionare, non a fatturare. Controllato a campione su `src/kernel/kernel.ts`, `src/ui/hud.ts` e `server/production.ts`:
  i letterali con segnaposto `${…}` contano solo le parole fisse; percorsi, tipi MIME e variabili d'ambiente non contano.

## Totale

| file letti | testi | parole | prompt | parole dei prompt | id per nome | chiavi su disco | parole nei commenti |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 325 | 4254 | 26.773 | 21 | 7291 | 3849 | 212 | 28.049 |

## Per area

| area | file | testi | parole | prompt | parole dei prompt | id per nome | chiavi su disco | parole nei commenti |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `src` | 137 | 2257 | 16.430 | 11 | 1215 | 2589 | 0 | 1006 |
| `site` | 26 | 435 | 2384 | 0 | 0 | 91 | 1 | 19 |
| `server` | 22 | 157 | 783 | 0 | 0 | 93 | 0 | 10 |
| `universe` | 139 | 1321 | 6568 | 10 | 6076 | 1076 | 211 | 27.014 |
| `index.html` | 1 | 84 | 608 | 0 | 0 | 0 | 0 | 0 |

## Per categoria

| categoria | file | testi | parole | prompt | parole dei prompt | id per nome | chiavi su disco | parole nei commenti |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| MarkovJunior (motore) | 16 | 190 | 1340 | 0 | 0 | 96 | 0 | 0 |
| UI del gioco | 20 | 470 | 2832 | 0 | 0 | 117 | 0 | 0 |
| altro di src/ | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| audio | 5 | 4 | 15 | 0 | 0 | 23 | 0 | 0 |
| canone delle rune | 1 | 26 | 545 | 0 | 0 | 0 | 0 | 0 |
| kernel: agenti e prompt | 12 | 413 | 6511 | 11 | 1215 | 444 | 0 | 24 |
| kernel: messaggi e logica | 54 | 1142 | 5855 | 0 | 0 | 1602 | 0 | 966 |
| lessico | 1 | 29 | 564 | 0 | 0 | 0 | 0 | 0 |
| modelli (programmi) | 60 | 879 | 2756 | 0 | 0 | 616 | 76 | 25.327 |
| moduli: codice Lua | 16 | 21 | 161 | 0 | 0 | 29 | 0 | 620 |
| moduli: manifest | 26 | 292 | 1873 | 0 | 0 | 294 | 115 | 0 |
| mondo del seme | 3 | 47 | 483 | 0 | 0 | 24 | 14 | 0 |
| multigiocatore (sessione) | 11 | 79 | 399 | 0 | 0 | 238 | 0 | 16 |
| prompt degli agenti (seme) | 11 | 3 | 117 | 10 | 6076 | 0 | 0 | 0 |
| render (etichette 3D) | 18 | 43 | 86 | 0 | 0 | 69 | 0 | 0 |
| seme: configurazione | 1 | 1 | 1 | 0 | 0 | 1 | 6 | 0 |
| server | 22 | 157 | 783 | 0 | 0 | 93 | 0 | 10 |
| sito | 24 | 426 | 2209 | 0 | 0 | 91 | 1 | 19 |
| sito: notizie | 2 | 9 | 175 | 0 | 0 | 0 | 0 | 0 |
| suoni (programmi) | 20 | 23 | 68 | 0 | 0 | 112 | 0 | 1067 |

## Ciò che va con ogni richiesta ai modelli

| testo | dove | caratteri | parole | token stimati (car./4) |
|---|---|---:|---:|---:|
| COUNCIL_PRINCIPLES (con ogni richiesta) | `src/kernel/fourthwall.ts` | 2048 | 322 | 512 |
| META_RE (filtro, parole e frasi) | `src/kernel/fourthwall.ts` | 1599 | 70 | 400 |
| agents/arbitro.md | `universe/prompts/` | 2200 | 338 | 550 |
| agents/artista.md | `universe/prompts/` | 1807 | 309 | 452 |
| agents/attore.md | `universe/prompts/` | 2281 | 393 | 570 |
| agents/cartografo.md | `universe/prompts/` | 5637 | 892 | 1409 |
| agents/fisico.md | `universe/prompts/` | 1633 | 266 | 408 |
| agents/ingegnere.md | `universe/prompts/` | 6291 | 964 | 1573 |
| agents/musicista.md | `universe/prompts/` | 4651 | 819 | 1163 |
| agents/narratore.md | `universe/prompts/` | 3553 | 562 | 888 |
| agents/referente.md | `universe/prompts/` | 945 | 152 | 236 |
| agents/scultore.md | `universe/prompts/` | 8449 | 1381 | 2112 |
| theme.md | `universe/prompts/` | 702 | 117 | 176 |

## Gli identificatori che il codice confronta per nome

Letti dal codice (unioni di tipi, `case` del validatore, manifest del seme). Restano in italiano in ogni lingua: sono la lingua interna.

| dominio | dove | valori | elenco |
|---|---|---:|---|
| classi dei modelli | `src/mj/classes.ts` | 12 | sasso, roccia, cespuglio, albero, oggetto, mobile, persona, animale, bestia, monumento, edificio, grande |
| taglie | `src/mj/classes.ts` | 6 | minuscola, piccola, media, grande, enorme, gargantuesca |
| effetti (`tipo`) | `src/kernel/validator.ts` | 19 | messaggio, bisogni, crea_oggetto, consuma, distruggi, apri, contenitore, terreno, rilievo, fuoco, luce, scudo, spingi, evoca, legame, ricordo, stato, togli_stato, nascita |
| momenti del giorno | `src/kernel/society.ts` | 4 | mattina, giorno, sera, notte |
| dove (routine) | `src/kernel/society.ts` | 4 | casa, lavoro, piazza, in giro |
| attività | `src/kernel/society.ts` | 14 | dorme, zappa, lavora, cucina, mangia, prega, commercia, pattuglia, chiacchiera, legge, pesca, taglia_legna, pascola, passeggia |
| specie e genere | `src/kernel/society.ts` | 4 | persona, animale, maschio, femmina |
| uso dei suoni | `src/mj/sound.ts` | 2 | musica, effetto |
| tipi di modulo | `src/kernel/types.ts` | 6 | system, entity, item, player, generator, data |
| azioni del seme (`id`) | `universe/modules/*/manifest.json` | 6 | ascolta, attingi, dormi, fruga, moneta, raccogli |
| ambienti (layout) del seme | `universe/modules/world.layouts` | 20 | borgo, borgo_mattoni, bosco, campi, capanne, caserma, castello, deserto, dungeon, fortezza, giungla, lago, locanda, maneggio, montagne, piramide, rovine, tana_drago, tempio, torre_mago |
| nomi dei terreni del seme | `universe/modules/world.terrain` | 21 | acqua, bosco, campo arato, giungla, lava, mare, montagna, muro, muro di mattoni, muro di pietra, neve, parete di paglia, pavimento di legno, pavimento di pietra, ponte levatoio, porta, prato, roccia, sabbia, sentiero, staccionata |

## I 40 file con più parole da tradurre

| file | testi | parole | prompt | parole dei prompt | id per nome | chiavi su disco | parole nei commenti |
|---|---:|---:|---:|---:|---:|---:|---:|
| `src/kernel/kernel.ts` | 354 | 1751 | 0 | 0 | 405 | 0 | 10 |
| `src/kernel/agents/effects.ts` | 83 | 1472 | 1 | 64 | 43 | 0 | 0 |
| `src/kernel/ai/mock.ts` | 251 | 1382 | 0 | 0 | 240 | 0 | 0 |
| `universe/prompts/agents/scultore.md` | 0 | 0 | 1 | 1381 | 0 | 0 | 0 |
| `src/kernel/agents/minds.ts` | 57 | 1029 | 2 | 156 | 40 | 0 | 0 |
| `universe/prompts/agents/ingegnere.md` | 0 | 0 | 1 | 964 | 0 | 0 | 0 |
| `universe/prompts/agents/cartografo.md` | 0 | 0 | 1 | 892 | 0 | 0 | 0 |
| `universe/prompts/agents/musicista.md` | 0 | 0 | 1 | 819 | 0 | 0 | 0 |
| `src/kernel/agents/content.ts` | 42 | 769 | 0 | 0 | 52 | 0 | 0 |
| `src/kernel/agents/genesis.ts` | 31 | 334 | 3 | 389 | 58 | 0 | 0 |
| `src/kernel/agents/cartography.ts` | 32 | 608 | 1 | 49 | 37 | 0 | 0 |
| `src/kernel/agents/forge.ts` | 38 | 622 | 0 | 0 | 86 | 0 | 0 |
| `index.html` | 84 | 608 | 0 | 0 | 0 | 0 | 0 |
| `src/kernel/themes.ts` | 5 | 422 | 1 | 156 | 4 | 0 | 0 |
| `src/kernel/coefficients.ts` | 85 | 577 | 0 | 0 | 173 | 0 | 0 |
| `site/index.html` | 87 | 572 | 0 | 0 | 0 | 0 | 0 |
| `src/ui/studio.ts` | 108 | 565 | 0 | 0 | 13 | 0 | 0 |
| `universe/world/lessico.md` | 29 | 564 | 0 | 0 | 0 | 0 | 0 |
| `universe/prompts/agents/narratore.md` | 0 | 0 | 1 | 562 | 0 | 0 | 0 |
| `universe/world/canone.md` | 26 | 545 | 0 | 0 | 0 | 0 | 0 |
| `src/kernel/fourthwall.ts` | 10 | 204 | 1 | 322 | 0 | 0 | 24 |
| `universe/prompts/agents/attore.md` | 0 | 0 | 1 | 393 | 0 | 0 | 0 |
| `src/kernel/agents/sculptor.ts` | 26 | 299 | 2 | 79 | 37 | 0 | 0 |
| `src/mj/soundanalysis.ts` | 44 | 372 | 0 | 0 | 12 | 0 | 0 |
| `src/ui/lobby.ts` | 55 | 355 | 0 | 0 | 17 | 0 | 0 |
| `src/kernel/validator.ts` | 71 | 354 | 0 | 0 | 51 | 0 | 0 |
| `src/kernel/agents/mechanics.ts` | 25 | 347 | 0 | 0 | 31 | 0 | 0 |
| `universe/prompts/agents/arbitro.md` | 0 | 0 | 1 | 338 | 0 | 0 | 0 |
| `src/mj/model.ts` | 42 | 331 | 0 | 0 | 2 | 0 | 0 |
| `src/ui/genesis.ts` | 32 | 322 | 0 | 0 | 30 | 0 | 0 |
| `site/pagamenti.html` | 69 | 317 | 0 | 0 | 0 | 0 | 0 |
| `universe/prompts/agents/artista.md` | 0 | 0 | 1 | 309 | 0 | 0 | 0 |
| `universe/models/index.json` | 97 | 305 | 0 | 0 | 113 | 76 | 0 |
| `universe/modules/items.base/manifest.json` | 73 | 297 | 0 | 0 | 151 | 6 | 0 |
| `src/kernel/plots.ts` | 16 | 273 | 0 | 0 | 27 | 0 | 17 |
| `universe/modules/magic.runes/manifest.json` | 33 | 267 | 0 | 0 | 26 | 13 | 0 |
| `universe/prompts/agents/fisico.md` | 0 | 0 | 1 | 266 | 0 | 0 | 0 |
| `src/ui/console.ts` | 33 | 251 | 0 | 0 | 5 | 0 | 0 |
| `universe/modules/world.layouts/manifest.json` | 39 | 242 | 0 | 0 | 32 | 22 | 0 |
| `src/kernel/society.ts` | 106 | 240 | 0 | 0 | 192 | 0 | 0 |

## File per file

<details><summary>Tutti i file con almeno un conteggio non nullo</summary>

| file | testi | parole | prompt | parole dei prompt | id per nome | chiavi su disco | parole nei commenti |
|---|---:|---:|---:|---:|---:|---:|---:|
| `src/audio/director.ts` | 0 | 0 | 0 | 0 | 19 | 0 | 0 |
| `src/audio/prepare.ts` | 1 | 3 | 0 | 0 | 2 | 0 | 0 |
| `src/audio/renders.ts` | 3 | 12 | 0 | 0 | 2 | 0 | 0 |
| `src/kernel/agents/cartography.ts` | 32 | 608 | 1 | 49 | 37 | 0 | 0 |
| `src/kernel/agents/composer.ts` | 26 | 219 | 0 | 0 | 28 | 0 | 0 |
| `src/kernel/agents/content.ts` | 42 | 769 | 0 | 0 | 52 | 0 | 0 |
| `src/kernel/agents/council.ts` | 38 | 186 | 0 | 0 | 28 | 0 | 0 |
| `src/kernel/agents/effects.ts` | 83 | 1472 | 1 | 64 | 43 | 0 | 0 |
| `src/kernel/agents/forge.ts` | 38 | 622 | 0 | 0 | 86 | 0 | 0 |
| `src/kernel/agents/genesis.ts` | 31 | 334 | 3 | 389 | 58 | 0 | 0 |
| `src/kernel/agents/mechanics.ts` | 25 | 347 | 0 | 0 | 31 | 0 | 0 |
| `src/kernel/agents/minds.ts` | 57 | 1029 | 2 | 156 | 40 | 0 | 0 |
| `src/kernel/agents/sculptor.ts` | 26 | 299 | 2 | 79 | 37 | 0 | 0 |
| `src/kernel/ai/gemini.ts` | 4 | 11 | 0 | 0 | 0 | 0 | 0 |
| `src/kernel/ai/mock.ts` | 251 | 1382 | 0 | 0 | 240 | 0 | 0 |
| `src/kernel/ai/models.ts` | 1 | 5 | 0 | 0 | 0 | 0 | 0 |
| `src/kernel/ai/prices.ts` | 1 | 13 | 0 | 0 | 0 | 0 | 0 |
| `src/kernel/ai/subscription.ts` | 7 | 20 | 0 | 0 | 5 | 0 | 0 |
| `src/kernel/ai/usage.ts` | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| `src/kernel/archive.ts` | 2 | 7 | 0 | 0 | 4 | 0 | 0 |
| `src/kernel/atlas.ts` | 2 | 8 | 0 | 0 | 0 | 0 | 0 |
| `src/kernel/bench.ts` | 17 | 87 | 0 | 0 | 14 | 0 | 0 |
| `src/kernel/bible.ts` | 1 | 1 | 0 | 0 | 15 | 0 | 20 |
| `src/kernel/cards.ts` | 0 | 0 | 0 | 0 | 24 | 0 | 0 |
| `src/kernel/chain.ts` | 1 | 2 | 0 | 0 | 5 | 0 | 0 |
| `src/kernel/clone.ts` | 4 | 23 | 0 | 0 | 3 | 0 | 0 |
| `src/kernel/coefficients.ts` | 85 | 577 | 0 | 0 | 173 | 0 | 0 |
| `src/kernel/content.ts` | 2 | 20 | 0 | 0 | 5 | 0 | 0 |
| `src/kernel/corona.ts` | 52 | 165 | 0 | 0 | 103 | 0 | 0 |
| `src/kernel/forms.ts` | 1 | 5 | 0 | 0 | 10 | 0 | 0 |
| `src/kernel/fourthwall.ts` | 10 | 204 | 1 | 322 | 0 | 0 | 24 |
| `src/kernel/gameSetup.ts` | 14 | 207 | 0 | 0 | 10 | 0 | 0 |
| `src/kernel/graph.ts` | 23 | 96 | 0 | 0 | 93 | 0 | 30 |
| `src/kernel/heritage.ts` | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| `src/kernel/input.ts` | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| `src/kernel/kernel.ts` | 354 | 1751 | 0 | 0 | 405 | 0 | 10 |
| `src/kernel/lathe.ts` | 9 | 72 | 0 | 0 | 1 | 0 | 0 |
| `src/kernel/magic.ts` | 12 | 101 | 0 | 0 | 1 | 0 | 0 |
| `src/kernel/mj.ts` | 14 | 51 | 0 | 0 | 0 | 0 | 12 |
| `src/kernel/modeldirector.ts` | 5 | 32 | 0 | 0 | 45 | 0 | 0 |
| `src/kernel/paths.ts` | 5 | 20 | 0 | 0 | 0 | 0 | 0 |
| `src/kernel/plots.ts` | 16 | 273 | 0 | 0 | 27 | 0 | 17 |
| `src/kernel/prelude.lua` | 7 | 35 | 0 | 0 | 2 | 0 | 877 |
| `src/kernel/repo.ts` | 5 | 12 | 0 | 0 | 1 | 0 | 0 |
| `src/kernel/sandbox.ts` | 4 | 17 | 0 | 0 | 2 | 0 | 0 |
| `src/kernel/scoredirector.ts` | 6 | 44 | 0 | 0 | 10 | 0 | 0 |
| `src/kernel/screens.ts` | 22 | 68 | 0 | 0 | 6 | 0 | 0 |
| `src/kernel/shortfalls.ts` | 5 | 32 | 0 | 0 | 8 | 0 | 0 |
| `src/kernel/situation.ts` | 9 | 20 | 0 | 0 | 18 | 0 | 0 |
| `src/kernel/society.ts` | 106 | 240 | 0 | 0 | 192 | 0 | 0 |
| `src/kernel/stamps.ts` | 0 | 0 | 0 | 0 | 56 | 0 | 0 |
| `src/kernel/themes.ts` | 5 | 422 | 1 | 156 | 4 | 0 | 0 |
| `src/kernel/types.ts` | 1 | 1 | 0 | 0 | 61 | 0 | 0 |
| `src/kernel/universe.ts` | 5 | 27 | 0 | 0 | 6 | 0 | 0 |
| `src/kernel/universes.ts` | 6 | 38 | 0 | 0 | 2 | 0 | 0 |
| `src/kernel/validator.ts` | 71 | 354 | 0 | 0 | 51 | 0 | 0 |
| `src/kernel/wanderers.ts` | 9 | 35 | 0 | 0 | 1 | 0 | 0 |
| `src/main.ts` | 33 | 167 | 0 | 0 | 12 | 0 | 0 |
| `src/master.ts` | 2 | 5 | 0 | 0 | 0 | 0 | 0 |
| `src/mj/check.ts` | 13 | 136 | 0 | 0 | 0 | 0 | 0 |
| `src/mj/classes.ts` | 22 | 106 | 0 | 0 | 45 | 0 | 0 |
| `src/mj/engine.ts` | 31 | 195 | 0 | 0 | 8 | 0 | 0 |
| `src/mj/model.ts` | 42 | 331 | 0 | 0 | 2 | 0 | 0 |
| `src/mj/palette.ts` | 7 | 7 | 0 | 0 | 3 | 0 | 0 |
| `src/mj/photo.ts` | 0 | 0 | 0 | 0 | 8 | 0 | 0 |
| `src/mj/rig.ts` | 0 | 0 | 0 | 0 | 5 | 0 | 0 |
| `src/mj/sound.ts` | 7 | 39 | 0 | 0 | 6 | 0 | 0 |
| `src/mj/soundanalysis.ts` | 44 | 372 | 0 | 0 | 12 | 0 | 0 |
| `src/mj/synth.ts` | 1 | 7 | 0 | 0 | 2 | 0 | 0 |
| `src/mj/trace.ts` | 14 | 102 | 0 | 0 | 5 | 0 | 0 |
| `src/mj/xml.ts` | 9 | 45 | 0 | 0 | 0 | 0 | 0 |
| `src/render/bench.ts` | 4 | 11 | 0 | 0 | 3 | 0 | 0 |
| `src/render/cartoon.ts` | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| `src/render/corona3d.ts` | 18 | 18 | 0 | 0 | 31 | 0 | 0 |
| `src/render/coronaview.ts` | 5 | 21 | 0 | 0 | 11 | 0 | 0 |
| `src/render/entities.ts` | 3 | 3 | 0 | 0 | 14 | 0 | 0 |
| `src/render/glitch.ts` | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| `src/render/materials.ts` | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| `src/render/overlay.ts` | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| `src/render/renderer.ts` | 2 | 2 | 0 | 0 | 2 | 0 | 0 |
| `src/render/screens.ts` | 8 | 28 | 0 | 0 | 2 | 0 | 0 |
| `src/render/terrain.ts` | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| `src/render/worker.ts` | 0 | 0 | 0 | 0 | 4 | 0 | 0 |
| `src/session/client.ts` | 2 | 6 | 0 | 0 | 12 | 0 | 0 |
| `src/session/files.ts` | 2 | 2 | 0 | 0 | 27 | 0 | 0 |
| `src/session/host.ts` | 4 | 15 | 0 | 0 | 1 | 0 | 0 |
| `src/session/login.ts` | 7 | 51 | 0 | 0 | 4 | 0 | 0 |
| `src/session/protocol.ts` | 0 | 0 | 0 | 0 | 47 | 0 | 0 |
| `src/session/server.ts` | 42 | 218 | 0 | 0 | 60 | 0 | 16 |
| `src/session/socket.ts` | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| `src/session/thin.ts` | 18 | 93 | 0 | 0 | 61 | 0 | 0 |
| `src/session/worldProcess.ts` | 4 | 14 | 0 | 0 | 13 | 0 | 0 |
| `src/session/worldwire.ts` | 0 | 0 | 0 | 0 | 12 | 0 | 0 |
| `src/ui/actions.ts` | 4 | 27 | 0 | 0 | 0 | 0 | 0 |
| `src/ui/atlas.ts` | 5 | 23 | 0 | 0 | 4 | 0 | 0 |
| `src/ui/chat.ts` | 8 | 37 | 0 | 0 | 3 | 0 | 0 |
| `src/ui/console.ts` | 33 | 251 | 0 | 0 | 5 | 0 | 0 |
| `src/ui/creditdialog.ts` | 9 | 69 | 0 | 0 | 3 | 0 | 0 |
| `src/ui/editor.ts` | 6 | 32 | 0 | 0 | 0 | 0 | 0 |
| `src/ui/feed.ts` | 2 | 5 | 0 | 0 | 6 | 0 | 0 |
| `src/ui/genesis.ts` | 32 | 322 | 0 | 0 | 30 | 0 | 0 |
| `src/ui/graph.ts` | 15 | 79 | 0 | 0 | 3 | 0 | 0 |
| `src/ui/hud.ts` | 28 | 119 | 0 | 0 | 8 | 0 | 0 |
| `src/ui/inventory.ts` | 30 | 125 | 0 | 0 | 13 | 0 | 0 |
| `src/ui/lobby.ts` | 55 | 355 | 0 | 0 | 17 | 0 | 0 |
| `src/ui/profile.ts` | 16 | 43 | 0 | 0 | 0 | 0 | 0 |
| `src/ui/studio.ts` | 108 | 565 | 0 | 0 | 13 | 0 | 0 |
| `site/beta.json` | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| `site/carte.html` | 30 | 94 | 0 | 0 | 0 | 0 | 0 |
| `site/carte.ts` | 32 | 116 | 0 | 0 | 42 | 0 | 0 |
| `site/index.html` | 87 | 572 | 0 | 0 | 0 | 0 | 0 |
| `site/istruzioni.html` | 14 | 37 | 0 | 0 | 0 | 0 | 0 |
| `site/landing.ts` | 1 | 3 | 0 | 0 | 0 | 0 | 0 |
| `site/notizie-testo.ts` | 12 | 53 | 0 | 0 | 10 | 0 | 0 |
| `site/notizie.html` | 21 | 68 | 0 | 0 | 0 | 0 | 0 |
| `site/notizie.ts` | 1 | 3 | 0 | 0 | 0 | 0 | 0 |
| `site/notizie/2026-11-04-le-notizie-del-sito.md` | 8 | 99 | 0 | 0 | 0 | 0 | 0 |
| `site/notizie/LEGGIMI.md` | 1 | 76 | 0 | 0 | 0 | 0 | 0 |
| `site/pagamenti.html` | 69 | 317 | 0 | 0 | 0 | 0 | 0 |
| `site/pagamenti.ts` | 24 | 191 | 0 | 0 | 12 | 0 | 0 |
| `site/profilo.html` | 52 | 208 | 0 | 0 | 0 | 0 | 0 |
| `site/profilo.ts` | 22 | 130 | 0 | 0 | 10 | 0 | 0 |
| `site/sessioni.html` | 44 | 212 | 0 | 0 | 0 | 0 | 0 |
| `site/sessioni.ts` | 10 | 172 | 0 | 0 | 12 | 0 | 19 |
| `site/shared.ts` | 7 | 33 | 0 | 0 | 4 | 0 | 0 |
| `site/video-testo.ts` | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| `server/access.ts` | 4 | 29 | 0 | 0 | 3 | 0 | 0 |
| `server/account.ts` | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| `server/betaGuide.ts` | 0 | 0 | 0 | 0 | 7 | 0 | 0 |
| `server/buildServer.ts` | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| `server/geminiProxy.ts` | 12 | 42 | 0 | 0 | 0 | 0 | 0 |
| `server/git.ts` | 1 | 9 | 0 | 0 | 0 | 0 | 0 |
| `server/ledger.ts` | 4 | 19 | 0 | 0 | 0 | 0 | 0 |
| `server/production.ts` | 21 | 196 | 0 | 0 | 1 | 0 | 0 |
| `server/rates.ts` | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| `server/serve.ts` | 2 | 12 | 0 | 0 | 1 | 0 | 0 |
| `server/session.ts` | 9 | 51 | 0 | 0 | 6 | 0 | 0 |
| `server/stripe.ts` | 27 | 135 | 0 | 0 | 1 | 0 | 10 |
| `server/subscriptionQueue.ts` | 9 | 32 | 0 | 0 | 22 | 0 | 0 |
| `server/universeStore.ts` | 31 | 104 | 0 | 0 | 7 | 0 | 0 |
| `server/video.ts` | 4 | 13 | 0 | 0 | 0 | 0 | 0 |
| `server/wallet.ts` | 4 | 9 | 0 | 0 | 8 | 0 | 0 |
| `server/wanderer.ts` | 15 | 54 | 0 | 0 | 9 | 0 | 0 |
| `server/worldHost.ts` | 14 | 78 | 0 | 0 | 25 | 0 | 0 |
| `universe/models/albero.xml` | 1 | 3 | 0 | 0 | 6 | 0 | 22 |
| `universe/models/animale.xml` | 10 | 20 | 0 | 0 | 6 | 0 | 28 |
| `universe/models/banco.xml` | 2 | 5 | 0 | 0 | 4 | 0 | 20 |
| `universe/models/barile.xml` | 4 | 8 | 0 | 0 | 2 | 0 | 27 |
| `universe/models/bestia.xml` | 6 | 14 | 0 | 0 | 7 | 0 | 27 |
| `universe/models/betulla.xml` | 3 | 6 | 0 | 0 | 5 | 0 | 117 |
| `universe/models/cartello.xml` | 0 | 0 | 0 | 0 | 6 | 0 | 29 |
| `universe/models/cespuglio-con-bacche.xml` | 0 | 0 | 0 | 0 | 3 | 0 | 101 |
| `universe/models/cespuglio.xml` | 1 | 3 | 0 | 0 | 3 | 0 | 24 |
| `universe/models/circuito-3D.xml` | 9 | 35 | 0 | 0 | 9 | 0 | 180 |
| `universe/models/contadina.xml` | 7 | 17 | 0 | 0 | 6 | 0 | 22 |
| `universe/models/corona-albero-luce.xml` | 11 | 27 | 0 | 0 | 2 | 0 | 612 |
| `universe/models/corona-concilio.xml` | 11 | 25 | 0 | 0 | 14 | 0 | 835 |
| `universe/models/corona-cose.xml` | 7 | 16 | 0 | 0 | 7 | 0 | 804 |
| `universe/models/corona-drone.xml` | 25 | 106 | 0 | 0 | 5 | 0 | 425 |
| `universe/models/corona-galleria.xml` | 9 | 21 | 0 | 0 | 18 | 0 | 1172 |
| `universe/models/corona-gerboa-arbitro.xml` | 35 | 125 | 0 | 0 | 19 | 0 | 849 |
| `universe/models/corona-gerboa-artista.xml` | 35 | 110 | 0 | 0 | 12 | 0 | 637 |
| `universe/models/corona-gerboa-attore.xml` | 37 | 105 | 0 | 0 | 11 | 0 | 506 |
| `universe/models/corona-gerboa-cartografo.xml` | 38 | 120 | 0 | 0 | 11 | 0 | 679 |
| `universe/models/corona-gerboa-fisico.xml` | 38 | 127 | 0 | 0 | 10 | 0 | 697 |
| `universe/models/corona-gerboa-ingegnere.xml` | 35 | 134 | 0 | 0 | 13 | 0 | 785 |
| `universe/models/corona-gerboa-musicista.xml` | 36 | 110 | 0 | 0 | 11 | 0 | 570 |
| `universe/models/corona-gerboa-narratore.xml` | 31 | 94 | 0 | 0 | 9 | 0 | 531 |
| `universe/models/corona-gerboa-referente.xml` | 36 | 136 | 0 | 0 | 14 | 0 | 663 |
| `universe/models/corona-gerboa-scultore.xml` | 33 | 116 | 0 | 0 | 12 | 0 | 667 |
| `universe/models/corona-gerboa.xml` | 23 | 67 | 0 | 0 | 9 | 0 | 705 |
| `universe/models/corona-lampione.xml` | 35 | 150 | 0 | 0 | 22 | 0 | 702 |
| `universe/models/corona-luoghi.xml` | 19 | 51 | 0 | 0 | 7 | 0 | 770 |
| `universe/models/corona-magia.xml` | 21 | 53 | 0 | 0 | 24 | 0 | 1606 |
| `universe/models/corona-mondo.xml` | 10 | 21 | 0 | 0 | 13 | 0 | 1294 |
| `universe/models/corona-nucleo.xml` | 15 | 35 | 0 | 0 | 7 | 0 | 1081 |
| `universe/models/corona-oggetti.xml` | 11 | 26 | 0 | 0 | 14 | 0 | 918 |
| `universe/models/corona-panchina.xml` | 11 | 34 | 0 | 0 | 8 | 0 | 664 |
| `universe/models/corona-persone.xml` | 10 | 22 | 0 | 0 | 8 | 0 | 1116 |
| `universe/models/corona-sistemi.xml` | 20 | 55 | 0 | 0 | 9 | 0 | 1446 |
| `universe/models/corona-totem.xml` | 16 | 61 | 0 | 0 | 3 | 0 | 862 |
| `universe/models/corona-treno.xml` | 25 | 112 | 0 | 0 | 5 | 0 | 823 |
| `universe/models/corona-universo.xml` | 20 | 49 | 0 | 0 | 14 | 0 | 535 |
| `universe/models/credenza.xml` | 1 | 2 | 0 | 0 | 5 | 0 | 28 |
| `universe/models/edificio.xml` | 11 | 27 | 0 | 0 | 5 | 0 | 173 |
| `universe/models/falo.xml` | 2 | 5 | 0 | 0 | 9 | 0 | 103 |
| `universe/models/fattoria.xml` | 11 | 28 | 0 | 0 | 22 | 0 | 328 |
| `universe/models/forbici.xml` | 0 | 0 | 0 | 0 | 7 | 0 | 23 |
| `universe/models/grande.xml` | 7 | 16 | 0 | 0 | 17 | 0 | 299 |
| `universe/models/index.json` | 97 | 305 | 0 | 0 | 113 | 76 | 0 |
| `universe/models/letto.xml` | 0 | 0 | 0 | 0 | 10 | 0 | 24 |
| `universe/models/masso-muschioso.xml` | 2 | 7 | 0 | 0 | 4 | 0 | 69 |
| `universe/models/mobile.xml` | 0 | 0 | 0 | 0 | 6 | 0 | 28 |
| `universe/models/monumento.xml` | 1 | 2 | 0 | 0 | 5 | 0 | 19 |
| `universe/models/oggetto.xml` | 1 | 3 | 0 | 0 | 3 | 0 | 42 |
| `universe/models/palma.xml` | 6 | 15 | 0 | 0 | 4 | 0 | 26 |
| `universe/models/persona.xml` | 13 | 32 | 0 | 0 | 5 | 0 | 28 |
| `universe/models/pozzo.xml` | 11 | 32 | 0 | 0 | 2 | 0 | 244 |
| `universe/models/quercia.xml` | 2 | 4 | 0 | 0 | 4 | 0 | 124 |
| `universe/models/roccia.xml` | 2 | 4 | 0 | 0 | 4 | 0 | 23 |
| `universe/models/sasso.xml` | 5 | 10 | 0 | 0 | 2 | 0 | 26 |
| `universe/models/schermo-scritte.xml` | 3 | 16 | 0 | 0 | 4 | 0 | 44 |
| `universe/models/schermo-struttura.xml` | 3 | 16 | 0 | 0 | 6 | 0 | 101 |
| `universe/models/suono-architettura-frattale.xml` | 0 | 0 | 0 | 0 | 7 | 0 | 50 |
| `universe/models/suono-effetto-arpeggio.xml` | 0 | 0 | 0 | 0 | 6 | 0 | 21 |
| `universe/models/suono-effetto-guasto.xml` | 0 | 0 | 0 | 0 | 3 | 0 | 9 |
| `universe/models/suono-effetto-incantesimo.xml` | 0 | 0 | 0 | 0 | 6 | 0 | 14 |
| `universe/models/suono-effetto-morte.xml` | 0 | 0 | 0 | 0 | 3 | 0 | 12 |
| `universe/models/suono-effetto-oggetto.xml` | 0 | 0 | 0 | 0 | 6 | 0 | 15 |
| `universe/models/suono-effetto-ritorno.xml` | 0 | 0 | 0 | 0 | 6 | 0 | 7 |
| `universe/models/suono-effetto-runa.xml` | 0 | 0 | 0 | 0 | 6 | 0 | 14 |
| `universe/models/suono-effetto-salto.xml` | 0 | 0 | 0 | 0 | 5 | 0 | 9 |
| `universe/models/suono-effetto-soglia.xml` | 0 | 0 | 0 | 0 | 5 | 0 | 21 |
| `universe/models/suono-fuga-cellulare.xml` | 1 | 3 | 0 | 0 | 6 | 0 | 61 |
| `universe/models/suono-musica-notte.xml` | 3 | 9 | 0 | 0 | 6 | 0 | 80 |
| `universe/models/suono-musica-oltre.xml` | 3 | 9 | 0 | 0 | 5 | 0 | 99 |
| `universe/models/suono-musica-pastorale.xml` | 3 | 9 | 0 | 0 | 6 | 0 | 102 |
| `universe/models/suono-musica-pietra.xml` | 3 | 9 | 0 | 0 | 6 | 0 | 99 |
| `universe/models/suono-musica-profondo.xml` | 3 | 9 | 0 | 0 | 6 | 0 | 101 |
| `universe/models/suono-musica-selva.xml` | 3 | 9 | 0 | 0 | 6 | 0 | 102 |
| `universe/models/suono-musica-tramonto.xml` | 3 | 9 | 0 | 0 | 6 | 0 | 77 |
| `universe/models/suono-scontro-finale.xml` | 0 | 0 | 0 | 0 | 6 | 0 | 58 |
| `universe/models/suono-sentiero-melodico.xml` | 1 | 2 | 0 | 0 | 6 | 0 | 116 |
| `universe/models/viandante.xml` | 5 | 13 | 0 | 0 | 11 | 0 | 24 |
| `universe/modules/core.carpet/logic.lua` | 0 | 0 | 0 | 0 | 0 | 0 | 22 |
| `universe/modules/core.carpet/manifest.json` | 2 | 12 | 0 | 0 | 1 | 0 | 0 |
| `universe/modules/core.effects/logic.lua` | 1 | 5 | 0 | 0 | 5 | 0 | 61 |
| `universe/modules/core.effects/manifest.json` | 2 | 29 | 0 | 0 | 1 | 0 | 0 |
| `universe/modules/core.items/logic.lua` | 3 | 24 | 0 | 0 | 6 | 0 | 13 |
| `universe/modules/core.items/manifest.json` | 2 | 31 | 0 | 0 | 1 | 0 | 0 |
| `universe/modules/core.movement/logic.lua` | 0 | 0 | 0 | 0 | 0 | 0 | 83 |
| `universe/modules/core.movement/manifest.json` | 2 | 11 | 0 | 0 | 1 | 0 | 0 |
| `universe/modules/core.player/manifest.json` | 2 | 7 | 0 | 0 | 2 | 2 | 0 |
| `universe/modules/item.forbici/logic.lua` | 2 | 10 | 0 | 0 | 0 | 0 | 15 |
| `universe/modules/item.forbici/manifest.json` | 5 | 37 | 0 | 0 | 4 | 2 | 0 |
| `universe/modules/items.base/manifest.json` | 73 | 297 | 0 | 0 | 151 | 6 | 0 |
| `universe/modules/magic.runes/manifest.json` | 33 | 267 | 0 | 0 | 26 | 13 | 0 |
| `universe/modules/npc.cat/logic.lua` | 0 | 0 | 0 | 0 | 0 | 0 | 9 |
| `universe/modules/npc.cat/manifest.json` | 5 | 49 | 0 | 0 | 2 | 2 | 0 |
| `universe/modules/npc.villager/logic.lua` | 0 | 0 | 0 | 0 | 0 | 0 | 15 |
| `universe/modules/npc.villager/manifest.json` | 6 | 102 | 0 | 0 | 4 | 2 | 0 |
| `universe/modules/obj.banco/manifest.json` | 4 | 28 | 0 | 0 | 4 | 1 | 0 |
| `universe/modules/obj.cassa/manifest.json` | 4 | 24 | 0 | 0 | 3 | 1 | 0 |
| `universe/modules/obj.credenza/manifest.json` | 4 | 27 | 0 | 0 | 4 | 1 | 0 |
| `universe/modules/obj.letto/logic.lua` | 5 | 28 | 0 | 0 | 4 | 0 | 20 |
| `universe/modules/obj.letto/manifest.json` | 6 | 31 | 0 | 0 | 6 | 1 | 0 |
| `universe/modules/object.bush/logic.lua` | 3 | 23 | 0 | 0 | 3 | 0 | 14 |
| `universe/modules/object.bush/manifest.json` | 5 | 25 | 0 | 0 | 4 | 1 | 0 |
| `universe/modules/object.crate/manifest.json` | 4 | 20 | 0 | 0 | 1 | 1 | 0 |
| `universe/modules/object.sign/manifest.json` | 5 | 40 | 0 | 0 | 2 | 1 | 0 |
| `universe/modules/object.well/logic.lua` | 7 | 71 | 0 | 0 | 2 | 0 | 11 |
| `universe/modules/object.well/manifest.json` | 7 | 25 | 0 | 0 | 8 | 1 | 0 |
| `universe/modules/runes.fragments/manifest.json` | 2 | 24 | 0 | 0 | 0 | 0 | 0 |
| `universe/modules/sys.fire/logic.lua` | 0 | 0 | 0 | 0 | 5 | 0 | 14 |
| `universe/modules/sys.fire/manifest.json` | 8 | 91 | 0 | 0 | 3 | 14 | 0 |
| `universe/modules/sys.follow/logic.lua` | 0 | 0 | 0 | 0 | 2 | 0 | 20 |
| `universe/modules/sys.follow/manifest.json` | 6 | 56 | 0 | 0 | 7 | 12 | 0 |
| `universe/modules/sys.needs/logic.lua` | 0 | 0 | 0 | 0 | 0 | 0 | 43 |
| `universe/modules/sys.needs/manifest.json` | 8 | 100 | 0 | 0 | 18 | 12 | 0 |
| `universe/modules/sys.physics/logic.lua` | 0 | 0 | 0 | 0 | 0 | 0 | 47 |
| `universe/modules/sys.physics/manifest.json` | 6 | 50 | 0 | 0 | 3 | 12 | 0 |
| `universe/modules/sys.wander/logic.lua` | 0 | 0 | 0 | 0 | 2 | 0 | 100 |
| `universe/modules/sys.wander/manifest.json` | 5 | 59 | 0 | 0 | 1 | 8 | 0 |
| `universe/modules/world.layouts/manifest.json` | 39 | 242 | 0 | 0 | 32 | 22 | 0 |
| `universe/modules/world.terrain/logic.lua` | 0 | 0 | 0 | 0 | 0 | 0 | 133 |
| `universe/modules/world.terrain/manifest.json` | 47 | 189 | 0 | 0 | 5 | 0 | 0 |
| `universe/prompts/agents/arbitro.md` | 0 | 0 | 1 | 338 | 0 | 0 | 0 |
| `universe/prompts/agents/artista.md` | 0 | 0 | 1 | 309 | 0 | 0 | 0 |
| `universe/prompts/agents/attore.md` | 0 | 0 | 1 | 393 | 0 | 0 | 0 |
| `universe/prompts/agents/cartografo.md` | 0 | 0 | 1 | 892 | 0 | 0 | 0 |
| `universe/prompts/agents/fisico.md` | 0 | 0 | 1 | 266 | 0 | 0 | 0 |
| `universe/prompts/agents/ingegnere.md` | 0 | 0 | 1 | 964 | 0 | 0 | 0 |
| `universe/prompts/agents/musicista.md` | 0 | 0 | 1 | 819 | 0 | 0 | 0 |
| `universe/prompts/agents/narratore.md` | 0 | 0 | 1 | 562 | 0 | 0 | 0 |
| `universe/prompts/agents/referente.md` | 0 | 0 | 1 | 152 | 0 | 0 | 0 |
| `universe/prompts/agents/scultore.md` | 0 | 0 | 1 | 1381 | 0 | 0 | 0 |
| `universe/prompts/theme.md` | 3 | 117 | 0 | 0 | 0 | 0 | 0 |
| `universe/universe.json` | 1 | 1 | 0 | 0 | 1 | 6 | 0 |
| `universe/world/atlas.json` | 28 | 167 | 0 | 0 | 24 | 6 | 0 |
| `universe/world/bible.json` | 12 | 143 | 0 | 0 | 0 | 8 | 0 |
| `universe/world/canone.md` | 26 | 545 | 0 | 0 | 0 | 0 | 0 |
| `universe/world/lessico.md` | 29 | 564 | 0 | 0 | 0 | 0 | 0 |
| `universe/world/style.md` | 7 | 173 | 0 | 0 | 0 | 0 | 0 |
| `index.html` | 84 | 608 | 0 | 0 | 0 | 0 | 0 |

</details>


## Le espressioni regolari che leggono l'italiano

Ciò che il codice capisce di un testo scritto (dai modelli o dal giocatore) cercandovi parole italiane: il filtro della quarta parete,
le attività dalle routine, i legami, le intenzioni del giocatore. In un'altra lingua tacciono. Una per una vanno rese multilingue o sostituite da un campo con un id.

| file | espressioni |
|---|---:|
| `src/kernel/ai/mock.ts` | 22 |
| `src/kernel/society.ts` | 21 |
| `src/kernel/fourthwall.ts` | 9 |
| `src/mj/classes.ts` | 9 |
| `src/kernel/screens.ts` | 6 |
| `src/kernel/plots.ts` | 5 |
| `src/kernel/agents/forge.ts` | 3 |
| `src/kernel/stamps.ts` | 3 |
| `src/kernel/atlas.ts` | 2 |
| `src/kernel/content.ts` | 1 |
| `src/kernel/kernel.ts` | 1 |
| `server/access.ts` | 1 |
| **totale** | 83 |

## La documentazione (fuori dal gioco)

Non si traduce per giocare; conta solo se il lancio punta alla comunità dello sviluppo agentico (T240, punto 7).

| dove | file | parole |
|---|---:|---:|
| `AGENTS.md` | 1 | 6490 |
| `docs/architettura-dettagli.md` | 1 | 15.607 |
| `docs/adr` | 136 | 90.677 |
| `docs/plans` | 1 | 114.755 |
| `docs/pipeline` | 31 | 56.535 |
| `docs/archivio` | 37 | 49.434 |
| `docs` (tutto) | 237 | 397.608 |

## Volume di una traduzione

Parole da tradurre per lingua (testi + prompt, senza commenti né id): **34.064**; per tre lingue in più: **102.192**.
Di queste, i testi (UI, sito, seme, Lua, messaggi del kernel e del server, risposte dei modelli offline) sono 26.773 parole; i prompt 7291 (si possono lasciare in italiano, vedi `lingue.md`).
