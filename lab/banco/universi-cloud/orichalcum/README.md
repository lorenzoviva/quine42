# orichalcum — Le Città del Vapore di Oricalco (Cantiere 4A)

Un universo Steampunk completo, scritto a mano senza chiamate ai modelli, con la stessa struttura di `universe/`, pronto da copiare in
`universes/orichalcum/`. Il tema è quello di `WORLD_THEMES` (`steampunk`, «Le Città del Vapore»), copiato alla lettera in `prompts/theme.md`.

```bash
npx vite-node lab/banco/universi-cloud/orichalcum/verifica.ts          # tutti i controlli e il kernel vero: ~1 minuto, scrive verifica.json
npx vite-node lab/banco/universi-cloud/strumenti/prova-modelli.ts      # solo modelli e suoni (anche: -- <id> …)
npx vite-node lab/banco/universi-cloud/strumenti/diagnosi.ts -- <id>   # voxel per lettera e pezzi staccati, seme per seme
```

**Per copiarlo**: `cp -r lab/banco/universi-cloud/orichalcum universes/orichalcum`, poi `git init` dentro se si vuole partire da un repository
pulito. `README.md`, `verifica.ts` e `verifica.json` non sono percorsi ammessi in un universo (`allowedPath`, ADR-0103): vanno tolti, o restano
fuori da ogni commit dell'universo (`strumenti/carica.ts` li salta allo stesso modo).

## Esito della verifica (verifica.json)

| controllo | con che cosa | esito |
|---|---|---|
| quarta parete su ogni testo del mondo (bibbia, stile, lessico, canone, atlante, società, trame, regole, mappe, manifest, commenti e stringhe Lua, nomi dei modelli) | `metaBreak` con le parole del lessico (anche `glossaryBreak`), `bibleBreaks` | 0 violazioni |
| società | `repairSociety` (nessuna correzione), nomi non simili, legami nei due versi | 0 correzioni |
| 8 trame | `reviewPlot` (persone, animali, legami detti, canone, quarta parete) | 0 problemi |
| 25 moduli nuovi | `parseManifest`, `checkLua`, `apiErrors`, `probe`; entità e oggetti anche `validateForged` | 0 errori, 0 avvisi |
| 19 piani dei luoghi | `validatePlan` (nulla di fatale, nulla scartato), ogni cosa «a terra» un oggetto noto | 0 problemi |
| 21 ambienti | `validateLayout` sulle bozze vere dei 19 luoghi (`generate_chunk`) | 0 errori |
| 12 rune nuove | `validateNewRune` contro le altre 18 (le 7 del seme e le 11 sorelle), la riga del canone di `canonWithRune`, un incantesimo ciascuna | 0 errori |
| 16 modelli | `modelErrors` (il validatore del kernel) nella scatola della classe, varianza mediana su 5 semi | tutti > 0,15 (0,17–0,64) |
| 8 programmi sonori | `modelErrors` e `analyzeSound` su 10 terne di semi | 0 difetti |
| il kernel | `Kernel.boot` con `MockAiModels` e le mappe, **1546 tick** (≥ 600) | **0 fault**, visti durante la prova e alla fine |

Nella prova a runtime il viandante: visita i 19 luoghi (39 spostamenti), che vengono tutti dai piani di `maps/` e non dal Cartografo;
raccoglie 24 rune dal suolo e 81 cose a terra; preme E in ogni luogo; incontra 8 individui della società, con il loro nome (il kernel ne
carica al più `NPC_CAP` = 2 per tipo alla volta: gli altri compaiono girando); prova ogni azione di ognuno dei 20 moduli di entità
(152 azioni dei moduli, 40 «Esamina», 16 «Parla» e 16 dialoghi con il Narratore offline), due volte: senza stati e con tutti gli stati che le
rune nuove lasciano addosso (`nel vapore`, `nella fuliggine`, `tempra d'ottone`, `passo a molla`, `calamitato`), a cui gli abitanti, la
caldaia, la fucina, il carrello, il dirigibile, la cassaforte, il lampione e il guardiano reagiscono; usa la chiave inglese (F) su caldaia,
guardiano, valvola e serratura; accende una caldaia e la lascia salire di pressione (`sys.pressione`), manda una capsula col telegrafo e la
vede arrivare (`sys.meccanismi`); fa le 10 ricette; mangia, beve e si cura (7 oggetti); pronuncia le 12 rune del canone e le 6 formule
(18 incantesimi, quelli di tre rune con il cristallo).

## Che cosa c'è

**Mondo** (`world/`). `bible.json`: Fornace Alta e le fonderie d'oricalco della Casa Ramelli, la Gilda dei Caldaisti e i turni di dieci
ore, la Compagnia della Ferrovia Sospesa, la Torre d'Ormeggio, le Miniere Termali di Solfara; 12 fatti, 5 misteri (la lega pallida, la
porta di ghisa del cunicolo diciassette, il brevetto perduto di Amedeo Lenti, il dirigibile senza fanali), 3 usanze proprie. `style.md`:
guida di stile del vapore. `lessico.md`: il lessico del seme, intatto, più tre usanze e tre modi di dire delle Città del Vapore (come il
lessico permette). `canone.md`: il canone del seme più le 12 rune nuove sotto «Le rune trovate dopo», scritte da `canonWithRune`
(`strumenti/canone.ts` lo rigenera). `atlas.json`: 10 regioni con centro, raggio, ambiente e descrizione. `people.json`: 24 individui (22
persone e 2 gatti) con mestiere, età, genere, storia, persona, aspetto, cose che portano, routine nei quattro momenti con l'attività,
ricordi, 17 legami incrociati, e l'`origine` che li lega all'oggetto del piano del loro luogo (così il kernel li riconosce, `ensureIdentity`);
due attesi (Ottavia Ramelli, Amedeo Lenti). `plots.json`: 8 trame con tre o quattro tappe e una missione ciascuna (porta, vai, parla).
`rules.json`: 6 regole già giudicate (la caldaia senz'acqua non si accende, l'acqua termale disseta…). `stato.json`: lo stato di partenza.

**Terreni e ambienti**. `world.terrain`: la palette del vapore (terra battuta, strada lastricata, mattoni, lamiera, ghisa, selciato,
binari, scorie, colata di metallo, passerella di ferro…), i codici di base intatti, `commonHouse` («case di mattoni rossi strette e alte»).
`world.layouts`: 13 ambienti del vapore (piazza della Pesa, quartiere di mattoni, quartiere dei telai, fonderia, scalo ferroviario, torre
d'ormeggio, miniera termale, campagne delle trebbie, porto, officine del canale, giardino della fuliggine, baracche, magazzini Ramelli) e gli
8 senza epoca del seme.

**Luoghi** (`maps/`). I 19 piani: (0,0), gli otto vicini, i quattro a distanza due sugli assi e sei «a cavallo» ((±1,±2) a nord e a sud,
(±2,1)). Ognuno con nome, descrizione, ambiente, cose (anche gli abitanti), oggetti a terra e rune.

**Moduli** (25 nuovi). Dati: `items.vapore` (41 oggetti, 10 ricette di leghe, ingranaggi, molle, manometri e orologi, 9 tabelle di
bottino), `magic.vapore` (12 rune, 18 incantesimi, la limatura di ferro). Sistemi: `sys.pressione` (carbone, acqua, pressione, fischio,
valvole di sfogo; una fiamma accanto riaccende una caldaia: la `Fulgia` e la `Brace` la accendono), `sys.meccanismi` (capsule del telegrafo,
guardiani a molla che si scaricano, lampioni che si accendono di sera e a una scintilla). Oggetti: caldaia, valvola con manometro, banco
dell'orologiaio, fucina d'oricalco, carrello del minerale, telegrafo pneumatico, dirigibile all'ormeggio, serratura a ingranaggi (tre ruote
accoppiate, combinazione fissata dal luogo, sempre risolvibile), cassaforte a combinazione (quella della fonderia vecchia custodisce il
brevetto di Lenti), lampione a gas, bacheca delle corporazioni, chiave inglese. Abitanti: caldaisti, orologiaie, macchinisti, aeronauti,
fonditrici, gente di miniera, cittadini (dialoghi a rami: «Chiedi del lavoro» va avanti di passo in passo, «Fatti raccontare» cambia col
momento del giorno; scambi; reazioni agli stati delle rune), il guardiano d'ottone, il gatto di fabbrica (con la salsiccia ti segue).
Ogni logica è in `module.lua` (il manifest dice `"logic": "module.lua"`), lo stato nei componenti.

**Modelli e suoni** (`models/`, più quelli del seme). 16 programmi MarkovJunior a mano: caldaia, valvola, banco, fucina, carrello,
telegrafo, pilone d'ormeggio, serratura, cassaforte, lampione, bacheca, guardiano d'ottone, chiave inglese, la gente del vapore (tutti gli
abitanti: ogni individuo è un seme) e le due case comuni che `commonHouse` chiede (`casa-comune-edificio-ee18c0d6`,
`casa-comune-grande-ee18c0d6`: senza di loro ogni lotto chiederebbe una casa allo Scultore). Il metodo è in `strumenti/genera_modelli.py`:
un corpo fisso, cavo dove non si vede, e gruppi di varianti; ogni variante è disegnata in una lettera nascosta, una `one` sceglie un
marcatore per variante (scelta uniforme, anche «nessuna»), un `all` la riempie, le altre tornano aria; ogni gruppo disegna dopo che il
precedente ha scelto, così le varianti si appoggiano a ciò che resta. 8 programmi sonori: 5 brani legati agli ambienti del vapore
nell'indice (`fonderia-notturna`, `valzer-ottone`, `binari-alti`, `miniera-calda`, `dirigibile-ponente`) e 3 effetti (`sfiato`,
`ingranaggio`, `capsula`).

## Scarti dalla richiesta, e perché

- **I nomi dei validatori.** `validateWorldPlan`, `validateModule`, `validateModelProgram` e `validateSoundProgram` non esistono nel kernel: si
  usano quelli che il kernel usa davvero (`validatePlan`, `parseManifest` + `checkLua` + `apiErrors` + `probe` + `validateForged`,
  `modelErrors`, `analyzeSound`). `validateForged` rifiuta per costruzione i moduli `system` senza pannello e i `data` («la Fucina non può
  creare moduli di tipo…», ADR-0028): per i 4 moduli di sistema e di dati vale il resto, che è ciò che il kernel fa caricando i file.
- **I nomi delle mappe.** Il kernel non cerca `maps/0,0.json` ma `maps/<nome>_<seme>_<firma del titolo della bibbia>_<cx>_<cy>.json`
  (`recordKey`, `UniverseChunks`): i file hanno quel nome (`orichalcum_1887_be6999bf_0_0.json`…), così vengono letti. Cambiare il titolo
  della bibbia o il seme li rende orfani.
- **Le rune sono 19.** `MAX_MAGIC_RUNES` è 16 e il seme ne ha 7: le 12 nuove si validano contro le altre 18 a gruppi sotto il tetto (il tetto
  vale per ciò che aggiunge il Concilio). In questo universo il Concilio non inventerà altre rune finché il tetto resta 16.
- **La varianza.** «Varianza su 5 semi > 0,15» è misurata come la quota `voxel` di `lab/banco/varianza.ts`: per ogni coppia dei semi 1–5, i
  voxel visibili pieni in uno solo dei due su quelli pieni in almeno uno; la mediana delle 10 coppie (`strumenti/modelli.ts`).
- **I 600 tick** sono un minimo: la prova ne fa 1546, perché ogni gruppo di azioni lascia girare il mondo.
- **Gli effetti sonori** si chiamano `sfiato`, `ingranaggio`, `capsula`: il direttore del suono oggi chiede solo i suoi effetti (runa,
  oggetto, incantesimo…), quindi sono pronti ma nessuno li chiede ancora.
- **I modelli locali** (`MockAiModels`) scrivono sempre di Valmora: i luoghi oltre i 19 pianificati, offline, prendono nomi del seme
  (`docs/temi-censimento.md` lo dice). Con Gemini li pianifica il Cartografo con la bibbia del vapore.
- **Il canone** del seme diceva «altri segni luminosi nel terreno» nel divieto: quelle parole sono proprio ciò che `metaBreak` cerca; qui
  il divieto dice «altre incisioni che brillano nel terreno», stesso significato.

## Strumenti (`lab/banco/universi-cloud/strumenti/`)

| file | che cosa |
|---|---|
| `carica.ts` | legge l'universo dal disco come `FileMap` (solo i percorsi ammessi), le mappe con le chiavi del kernel, avvia un `Kernel` |
| `controlli.ts` | quarta parete, piani, società e trame, moduli |
| `modelli.ts`, `prova-modelli.ts`, `diagnosi.ts` | il banco dei modelli e dei suoni |
| `canone.ts` (+ `canone-righe.json`) | valida le 12 rune e riscrive `world/canone.md` |
| `genera_mondo.py`, `genera_trame.py`, `genera_modelli.py`, `moduli/*.py` | come sono stati scritti persone e piani, trame, modelli e moduli (rigenerano i file) |
| `luoghi.ts`, `ambienti.ts` | i 19 luoghi; gli ambienti sulle loro bozze |
