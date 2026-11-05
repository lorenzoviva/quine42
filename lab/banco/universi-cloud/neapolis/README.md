# Neapolis — un universo moderno completo (Cantiere 4B)

Neapolis è una metropoli di porto negli anni Novanta: rioni di panni stesi, un centro direzionale di vetro mezzo vuoto, la
stazione, il cantiere eterno della Linea 2, il mercato del Pendino, il lungomare e il porto che vuole il Molo Vecchio dei
pescatori. Il tema è quello «Moderno» di `WORLD_THEMES` (`src/kernel/themes.ts`), copiato alla lettera in `prompts/theme.md`.

La cartella ha la forma di `universe/` ed è pronta da copiare in `universes/neapolis/` (vedi «Come si usa»). Niente è stato
generato da modelli esterni: bibbia, persone, luoghi, codice, modelli e suoni sono scritti a mano, e ogni pezzo passa dai
validatori del kernel.

## Esito della verifica

```bash
npx vite-node lab/banco/universi-cloud/neapolis/verifica.ts   # ~3 minuti; scrive verifica.json
```

**VERDE**: nessun problema, **0 fault** sollevati in 600 tick (contati tutti, non solo quelli rimasti alla fine).

| Controllo | Strumento del kernel | Esito |
|---|---|---|
| Quarta parete su 106 file, 5110 testi | `metaBreak` (con le parole del lessico: anche il glossario), `canonBreak`, `bibleBreaks`, `reviewPlot` | 0 rotture |
| 25 moduli Lua + 4 di dati | `validateForged` (manifest, Lua, API, caricamento di prova); per sistema e dati gli stessi controlli uno per uno | 0 errori, 0 avvisi |
| 19 piani dei luoghi | `Validator.validatePlan` | 0 problemi, niente scartato |
| 12 ambienti sulle 19 bozze vere | `Validator.validateLayout` | 0 problemi |
| 24 individui, 28 legami | `checkSociety` (specie, genere, legami dalle due parti, nomi distinti) | 0 problemi |
| 8 trame | `reviewPlot` (persone esistenti, parentele del registro, canone delle rune) | 0 problemi |
| 12 rune urbane | `validateNewRune` contro le altre 15, quarta parete | 0 errori |
| 16 modelli | `modelErrors` + varianza di forma su 5 semi | 0 errori, varianza da 0,211 a 0,417 (> 0,15) |
| 8 programmi sonori | `modelErrors` + `analyzeSound` su 10 terne di semi (1-30) | 0 difetti |

Il mondo che gira (Kernel vero, `MockAiModels`, i piani di `maps/` nell'archivio dei luoghi):

| Che cosa fa il viandante | Quanto |
|---|---|
| tick | 600 (a 1/60 s) |
| luoghi pianificati dai piani dopo 60 tick | 16 (gli altri si aprono andandoci) |
| individui nei luoghi dei piani riconosciuti dal registro per origine | 16 su 16, senza chiedere al Narratore |
| azioni su 20 individui e 50 cose (ogni azione di ogni manifest, con ciò che chiede in tasca) | 314 |
| oggetti raccolti da terra / rune magiche raccolte | 30 / 12 |
| ricette fatte (tutte e 12) / oggetti usati (mangiare, bere, medicarsi, la torcia) | 12 / 9 |
| incantesimi pronunciati: le 12 rune urbane e 4 formule di città | 16 |
| il rione al buio (`sys.quartiere`) e la luce ridata cambiando il fusibile alla cabina | sì / sì |
| cammino con l'input (il tappeto riporta al centro, il mondo scorre) | 4 caselle |
| luoghi visitati | 19 su 19 |
| missioni accettate e compiute («vai» alla Torre C, «porta» la busta a Rosaria, i pomodori a Carmela) | 3 su 3 |
| fault sollevati / alla fine | **0 / 0** |

I quattro individui «nuovi altrove» (Bastiano, Agnese, Gualtiero, Gemma) stanno in luoghi fuori dai piani, che i modelli locali
pianificano con i moduli di Neapolis: il registro li accoglie come farebbe con il Concilio. Offline i modelli locali scrivono
ancora luoghi e nomi di Valmora (`docs/temi-censimento.md`): è un limite noto di `MockAiModels`, non di Neapolis.

## Che cosa c'è

**Mondo** (`world/`): `bible.json` (titolo, tono, storia, 12 luoghi, 7 personaggi, 7 fatti, 4 misteri, 3 usanze); `style.md`
(con le case comuni: palazzine di tufo); `lessico.md` (quello di sempre più «A Neapolis»: caffè sospeso, sedie in strada, il primo
biglietto in vetrina, due modi di dire); `canone.md` (le 12 rune nuove sotto «Le rune trovate dopo», scritte da `canonWithRune`);
`atlas.json` (10 regioni: Colle dei Gelsi, Rione delle Lavandaie, Corso Partenope, Centro Direzionale, Mercato del Pendino,
Stazione Centrale, Cantiere della Linea 2, Lungomare delle Rondini, Porto di Neapolis, Officine dei Granili; ognuna con
`bioma` e `rilievo` in più, campi che il kernel conserva e non legge); `people.json` (24 individui, due per tipo, con routine,
ricordi, `tratti` e `opinioni` come li prevede `docs/design/comportamento-npc.md` §8.1); `plots.json` (8 trame con 3-4 tappe e una
missione con ricompensa ciascuna); `rules.json` (7 regole); `stato.json` (si parte di mattina).

**Le 12 rune urbane** (`magic.runes`): corrente (Scintilla: luce e «carico»), lamiera (Serranda: scudo), marea (Risacca: acqua),
asfalto (Carreggiata: strada), caffe (Ristretto: energia), voce (Banditore: spinge), sirena (Lampeggiante: luce e «allerta»), pane
(Sfornata: fame), nebbia (Foschia: «nascosto»), motore (Sgasata: «di corsa»), sutura (Ricucitura: salute), tufo (Gradone: rilievo);
più 4 formule (corrente sirena, caffe pane, marea nebbia, tufo asfalto). Individui e cose reagiscono sia alle rune portate sia agli
stati che gli incantesimi lasciano addosso.

**I 19 luoghi** (`maps/`): la piazza di partenza e 18 attorno, righe da -2 a 2 (il colle a nord, il mare a sud). Ogni piano ha
ambiente, individui, cose, oggetti a terra e rune; la Torre C e il mercato chiedono le loro strutture.

**I 25 moduli Lua**: 12 tipi di individui (`npc.barista`, `giornalista`, `meccanico`, `medico`, `portuale`, `elettricista`,
`edicolante`, `tranviere` — l'autista di tram e taxi —, `cuoca`, `vigile`, `impiegato`, `gatto`) con dialoghi a rami (saluto per ora del
giorno, quartiere e lavoro che vanno avanti, insistere secondo il ramo), reazioni alle 16 rune e agli stati, uno scambio in monete;
12 cose (`obj.distributore`, `espresso` con il caffè sospeso, `scrivania` con l'archivio a cassetti e la busta gialla,
`banco-officina`, `quadro-elettrico` che ridà la luce, `edicola` con i titoli del giorno, `transenna` del cantiere col coccio
antico, `cucina-trattoria`, `lampione`, `motorino` con la miscela, `cabina-telefonica` col quiz di Radio Ciok Ciok, `cassonetto`);
`sys.quartiere` (lampioni e insegne la sera, certe notti il buio). Più 4 moduli senza logica propria o generatori:
`items.neapolis` (67 oggetti, 12 ricette di bar, cucina ed elettricità, 14 tabelle di bottino), `magic.runes`,
`world.terrain` (bozza della città: reticolo di strade, colle, costa; 22 terreni) e `world.layouts` (12 ambienti urbani).
I moduli costanti del seme (`core.*`, `sys.*`, `runes.fragments`) sono copiati com'erano, salvo tre descrizioni riscritte per la
quarta parete.

**I 16 modelli** (`models/`): i 12 delle cose, le due palazzine di tufo che fanno da case comuni (`casa-comune-edificio-…` e
`casa-comune-grande-…`, gli id che `commonHouseModel` ricava da `commonHouse` del terreno), la torre di vetro e il mercato
coperto (`struttura-…`, gli id che il kernel chiede per le strutture dei piani). Ognuno ha una «testa» che sale e si ferma a caso,
poi il corpo si riempie fino a lì: a ogni seme un'altra altezza, un'altra pila di cassette, un piano in più.

**Gli 8 suoni**: 5 brani (mercato e corso di giorno, porto e lungomare, la sera e la notte in città, scelti per ambiente e
momento da `models/index.json → suono`) e 3 effetti (la tazzina per gli oggetti, il campanello del tram per ciò che si fa, il
blackout per i guasti, al posto di `oggetto`, `arpeggio` e `guasto` del seme, tolti da questa copia). Sono varianti di città dei
programmi del seme: tempo, scala, tonica, dinamica e qualche disegno.

## Scostamenti dalla richiesta, e perché

- **I file dei piani non si chiamano `maps/0,0.json`**: la virgola non è un nome ammesso (`src/kernel/paths.ts`, ADR-0103) e il
  kernel cerca i piani con la chiave di `recordKey`, che il server scrive sostituendo `:` e `,` con `_`:
  `maps/neapolis_1990_c534aeb4_<cx>_<cy>.json` (`c534aeb4` è l'impronta del titolo della bibbia: cambiarlo rende i piani di
  un altro mondo).
- **`logic.lua`, non `module.lua`**: è il nome di ogni modulo dell'universo e del manifest (`logic`).
- **Le funzioni nominate nella richiesta hanno altri nomi nel kernel**: `validateWorldPlan` è `Validator.validatePlan`,
  `validateModule` è `validateForged`, `validateModelProgram` è `modelErrors`, `validateSoundProgram` è `analyzeSound` (con le soglie
  che usa `modelErrors`); `checkFourthWall` è `strumenti/quarta-parete.ts`, costruito su `metaBreak`, `canonBreak`, `bibleBreaks` e
  `reviewPlot`.
- **Rune: 4 del seme + 12 nuove = 16**: `MAX_MAGIC_RUNES` è 16, quindi restano luce, fuoco, terra e vento (la prima serve alle rune
  iniziali della piazza, le altre alle formule del canone).
- **Il canone del seme cambia in due frasi** che il filtro della quarta parete prende alla lettera («una runa nascere», «segni
  luminosi», dette per negarle): stesse cose con altre parole.
- **La quarta parete non guarda** i prompt degli agenti (`prompts/agents/`, istruzioni al Concilio: parlano di codice per
  mestiere), i programmi dei modelli e i commenti del codice Lua; guarda tutte le stringhe che il mondo può mostrare.
- **Varianza**: è quella di forma (voxel pieni in un seme solo sui voxel pieni in almeno uno, mediana delle coppie di 5 semi), la
  quota `voxel` di `lab/banco/varianza.ts`; il colore non conta.
- **Le missioni nella verifica** si accettano scrivendo le trame (come farebbe l'azione «missione» di un dialogo, che i modelli
  locali non scelgono) e si compiono come nel gioco: arrivando nel luogo e parlando a chi aspetta.

## Come si usa

```bash
cp -r lab/banco/universi-cloud/neapolis universes/neapolis       # poi via strumenti/, README.md, verifica.ts, verifica.json
cd universes/neapolis && rm -rf strumenti README.md verifica.ts verifica.json
git init -q && git add -A && git commit -qm "genesi: Neapolis, la città del porto"   # il messaggio «genesi:» evita una nuova Genesi
# poi http://localhost:5173/?universo=neapolis
```

Gli strumenti (`strumenti/`) rifanno ogni pezzo: `rune.ts`, `ambienti.mjs`, `oggetti.mjs`, `npc.mjs`, `cose.mjs`,
`trame.mjs`, `luoghi.ts` (piani e registro delle persone), `modelli.mjs`, `suoni.mjs`; e lo provano: `prova-quarta-parete.ts`,
`prova-moduli.ts`, `prova-ambienti.ts`, `prova-modelli.ts`, `prova-suoni.ts`, `prova-avvio.ts`.

Non è stata fatta una prova nel browser: Neapolis non tocca il codice del gioco, e la verifica gira sul kernel vero.
