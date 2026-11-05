# Sidera — Cantiere 4C: un universo Futuristico completo

Sidera è un universo intero, scritto a mano senza chiamare modelli (il Concilio e lo Scultore qui sono Claude Code), con la
stessa struttura di `universe/` e pronto da copiare in `universes/sidera/`:

```bash
cp -r lab/banco/universi-cloud/sidera universes/sidera
rm -rf universes/sidera/strumenti universes/sidera/verifica.ts universes/sidera/README.md universes/sidera/rapporto-verifica.md universes/sidera/models/index.sidera.json universes/sidera/models/rapporto-modelli.md
```

(Il negozio dell'universo lo inizializza come repository git al primo avvio; i percorsi rimasti sono tutti ammessi da
`src/kernel/paths.ts`.) Il tema è il Futuristico di `WORLD_THEMES` (`prompts/theme.md` identico, `themeOfText` lo riconosce).

## Il mondo

Una metropoli di torri di vetro e viadotti sotto una pioggia che non smette, su un mondo colonizzato da tre secoli. Di notte
si vede l'**Anello**, la colonia orbitale da cui scesero i coloni della Traversata, legato al suolo dal cordone
dell'ascensore. Attorno: le **Cupole di Serralta** (serre idroponiche dei xenobotanici), il **Cantiere della Fusione** (la
«Nonna», il reattore più vecchio), lo **Spazioporto di Ponente** (la Gilda della Navigazione Profonda e le rotte verso gli
avamposti di Brina di Calisto, Pozzo Ardente e Orlo Nero), la **Gola dei Cristalli**, il **Campo dei Relitti** (scafi più
antichi della Traversata), la **Costa Allagata** dalla Grande Mareggiata, i **Laboratori di Ombralta** con le capsule dei
dormienti. Le compagnie dell'acqua e dell'energia comandano; le gilde resistono; le celle energetiche sono la moneta dei vicoli.

| File | Cosa contiene |
|---|---|
| `universe.json` | nome `sidera`, seme 2177, partita singola, morte livello 2, stessi budget del seme |
| `prompts/theme.md`, `prompts/agents/` | il tema Futuristico; i prompt degli agenti del seme |
| `world/bible.json` | titolo, tono, sintesi, storia, 13 luoghi, 8 personaggi, 8 fatti, 4 misteri, 3 usanze |
| `world/style.md` | la guida di stile dei modelli (cartone, pioggia, neon, regole delle parti) |
| `world/lessico.md` | il lessico comune del seme intatto + 3 usanze e 3 modi di dire di Sidera |
| `world/canone.md` | il canone delle 16 rune: le 4 di sempre e le 12 «trovate dopo» scritte da `canonWithRune` |
| `world/atlas.json` | 10 regioni geolocalizzate, ognuna col suo ambiente |
| `world/people.json` | 24 individui (23 persone e un corvo) con mestiere, età, legami, routine, storia, persona, aspetto, ricordi; `origine` aggancia ognuno a un oggetto dei piani |
| `world/plots.json` | 8 trame orizzontali con tappe, indizi e una missione ciascuna |
| `world/rules.json`, `world/stato.json` | 6 regole del mondo; lo stato iniziale |
| `maps/` | i 19 piani dei luoghi, con la chiave del kernel (`sidera_2177_<firma della bibbia>_<cx>_<cy>.json`) |
| `modules/` | i 25 moduli di Sidera + il pavimento del seme (`core.*`, `sys.fire/follow/needs/physics/wander`, `runes.fragments`) copiato così com'è |
| `models/` | 16 modelli e 8 programmi sonori di Sidera + i modelli generici, della corona e gli effetti sonori del seme; `index.json` composto da `strumenti/indice.ts` |

### Le 12 rune

Ognuna entra con `validateNewRune` (`src/kernel/magic.ts`) contro quelle già presenti, con la sua riga di canone
(`canonWithRune`) e il suo incantesimo (effetti dall'insieme chiuso, passati da `validateEffects`):

| Runa | Token | Elemento | Incantesimo |
|---|---|---|---|
| ⊛ Gravis | `grava` | gravità | Ancora: stato «zavorrato» (passo × 0,7, peso +20) |
| ⊚ Levis | `lieve` | leggerezza | Piuma: stato «alleggerito» (passo × 1,5) |
| ⟁ Traforo | `tunnel` | attraversamento | apre un sentiero anche nelle paratie |
| ⧖ Gemella | `intreccio` | legame | legame «amico» e un ricordo in chi ha davanti |
| ◬ Risacca | `onda` | onda | spinge via (forza 6) |
| ⨀ Nulla | `vuoto` | vuoto | brina sul suolo, stato «intirizzito» |
| ⟡ Afelio | `marea` | marea | rilievo −2, raggio 2 |
| ⦿ Accresco | `massa` | massa | rilievo +2 |
| ⧗ Trottola | `spin` | rotazione | stato «in rotazione», spinta |
| ⌬ Scintilla | `quanto` | energia | energia +15 e una cella energetica |
| ⟐ Perielio | `orbita` | orbita | scudo e luce per 25 s |
| ⊗ Sospesa | `stasi` | stasi | stato «sospeso» (passo × 0,3), salute +20 |

E cinque formule: `grava grava` (Collasso), `lieve onda` (Planata), `orbita grava` (Satellite), `quanto stasi` (Riposo del
dormiente), `tunnel massa tunnel` (Galleria, con un cristallo di risonanza). **Una scelta:** `MAX_MAGIC_RUNES` è 16 e il seme ne
ha 7; per farne entrare 12 Sidera tiene le 4 di sempre (`luce`, che è tra le rune con cui si parte, `fuoco`, `acqua`,
`scudo`) e lascia `terra`, `vita`, `vento`.

### I 25 moduli

| Gruppo | Moduli |
|---|---|
| Luoghi | `world.terreno-sidera` (bozza continua: asfalto, passerelle, canali, boschetti di vetro, cristalli, sabbia vitrea, felceti, brina, mare; 22 terreni), `world.ambienti-sidera` (13 ambienti: piazza dei viadotti, vicoli, mercato, cupole, spazioporto, laboratori, gola dei cristalli, relitti, costa allagata, torri, cantiere della fusione, cratere, base dell'ascensore) |
| Dati | `items.sidera` (39 oggetti, 10 ricette di metamateriali, celle e medicine, 10 tabelle di bottino), `magic.runes` (16 rune, 21 incantesimi) |
| Oggetti | `item.scanner` (impugnato legge lega, età e temperatura; usato misura brina, cristalli e le condizioni delle rune) |
| Macchine e cose | `obj.sintetizzatore` (con il calore che sale), `obj.reattore` (carico, spurgo, prelievi, il debito saldato davanti al nucleo), `obj.serra-idroponica` (crescita nel tempo), `obj.capsula-criogenica` (registro, siero, riposo), `obj.faro-telemetria` (silenzi quando la brina si posa), `obj.estrattore-plasma` (pressione, inceppamenti), `obj.camera-equilibrio` (ciclo e gettone), `obj.relitto` (frugare, tagliare, incisioni), `obj.armadietto` (contenitore), `obj.drone-ricognizione` (batteria, pacchi) |
| Persone | `npc.colono`, `npc.xenobotanica`, `npc.ingegnere-fusione`, `npc.navigatore`, `npc.medico-criogenico`, `npc.astroarcheologo`, `npc.sintetista`, `npc.corvo-tetto`: parlano dal Narratore con la loro persona, e hanno azioni a rami (fiducia nel componente `dialogo`, oggetti portati, rune in tasca, condizioni delle rune) |
| Sistemi | `sys.anomalie` (risonanza dei cristalli che ridà mana, brina che stanca, le condizioni lasciate dalle rune che durano nel corpo), `sys.cordone` (ogni sei minuti la cabina scende e fanno tremolare fari e luci; i droni consumano la cella) |

Lo stato vive nei componenti, la logica è senza stato; le condizioni del viandante si leggono per nome (`stati["zavorrato"]`),
mai iterando una tabella del kernel.

### I 19 luoghi

(0, 0) e i 18 attorno entro raggio 2 (Chebyshev), ognuno con l'ambiente della sua regione o, al centro, uno di quelli liberi.
Ogni oggetto ha la sua origine `cx,cy#oN`: le persone di `people.json` con la stessa origine e lo stesso archetipo sono loro
quando il kernel le incontra.

## Come si verifica

```bash
npx vite-node lab/banco/universi-cloud/sidera/strumenti/rune.ts      # le 12 rune → magic.runes e canone.md
npx vite-node lab/banco/universi-cloud/sidera/strumenti/moduli.ts    # i 25 moduli: 0 errori, 0 avvisi
npx vite-node lab/banco/universi-cloud/sidera/strumenti/luoghi.ts    # i 19 piani → maps/
npx vite-node lab/banco/universi-cloud/sidera/strumenti/modelli.ts   # 16 modelli e 8 suoni (varianza, analisi sonora)
npx vite-node lab/banco/universi-cloud/sidera/strumenti/indice.ts    # models/index.json
npx vite-node lab/banco/universi-cloud/sidera/verifica.ts            # tutto, e il kernel vero per almeno 600 tick
```

`verifica.ts` scrive [`rapporto-verifica.md`](rapporto-verifica.md); `modelli.ts` scrive
[`models/rapporto-modelli.md`](models/rapporto-modelli.md).

## Esito

RISULTATI

## Ciò che è cambiato rispetto alla richiesta, e ciò che si è scoperto

- **I nomi delle funzioni.** `validateModule`, `validateWorldPlan`, `validateModelProgram`, `validateSoundProgram` non
  esistono con questi nomi: i moduli passano da `Validator.parseManifest`, `checkLua`, `apiErrors` e `Sandbox.probe` (ciò che
  fa `validateForged` per la Fucina), i piani da `Validator.validatePlan` più `layout()`, i modelli e i suoni da `modelErrors`
  (`src/kernel/validator.ts`) e, per i suoni, da `analyzeSound` su dieci terne di semi.
- **`logic.lua`, non `module.lua`**: è il nome di ogni modulo del seme e di ciò che scrive la Fucina.
- **Le mappe non si chiamano `maps/0,0.json`**: il kernel cerca `maps/<nome>_<seme>_<firma della bibbia>_<cx>_<cy>.json`
  (`recordKey`), e la virgola non è ammessa nei percorsi di un universo (`paths.ts`).
- **I prefissi degli id decidono la stanza dello studio** (`folderOf` in `corona.ts`): terreno e ambienti si chiamano
  `world.*`. Un universo senza nessun modulo `world.*` fa cadere `Corona.build` al boot (la stanza dei luoghi, che ha un
  congegno, riceve i campioni dei terreni al pianterreno con più posti di quanti ne abbia): è un difetto del kernel, da un task.
- **Al più due individui dello stesso archetipo nel mondo caricato** (`Kernel.NPC_CAP`): non tutte le 24 persone sono in
  piedi insieme; il giro della verifica ne incontra e riconosce una buona metà, le altre arrivano quando i luoghi vicini si
  scaricano.
- **Il seme ha testi d'altri tempi** (il pozzo che parla di «nastro sotto il mondo»): Sidera non copia nessun modulo di
  contenuto del seme, solo il pavimento meccanico.
