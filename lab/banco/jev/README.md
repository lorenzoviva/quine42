# Il banco di Jev (T313)

Jev di TypeSafe AI ([typesafe.ai/blog/jev-1-14](https://typesafe.ai/blog/jev-1-14), [docs.typesafe.ai](https://docs.typesafe.ai)) è un modello «System One»: non genera
testo, **sceglie**. Riceve uno stato (testo o JSON) e domande tipizzate — *Choice* (un'opzione di un elenco, con le probabilità), *Score*
(un livello di una rubrica), *Noul* (la probabilità di un sì) — e risponde solo dentro le opzioni. Costa **0,042 $ al milione di token in
ingresso** (l'uscita è gratis), il contesto di produzione è 64k per richiesta e 32k per domanda, immagini e contesto lungo sono «Danger
Zone». Questo banco misura se le decisioni chiuse del gioco e alcuni giudizi sulla scultura si possono chiedere a Jev
invece che a Gemini 3.1 Flash-Lite, con le **stesse domande**, e dove conviene. Le immagini le prova solo T324, sul banco: la sezione
[«Le immagini (T324)»](#le-immagini-t324) e le tabelle di [`riepilogo-immagini.md`](riepilogo-immagini.md).

Niente cambia in `src/`: il banco è solo `lab/`. La proposta di portarlo nel gioco è
[ADR-0157](../../../docs/adr/0157-jev-per-le-decisioni-chiuse.md) (proposta, non decisa). Gli altri casi d'uso di TypeSafe — quanto delle
richieste è contesto, le guardie, le battute riusate, il contesto scelto da Jev — sono in [`casi-d-uso.md`](casi-d-uso.md) (T325).

## Come si usa

```bash
npx vite-node lab/scripts/jev-banco.ts -- --offline                       # risposte finte, nessuna chiave, nessuna spesa (lab/out/jev/)
npx vite-node lab/scripts/jev-banco.ts -- --gruppi decisioni --run giro-2 \
     --env <.env con TYPESAFE_KEY> --env <.env con GEMINI_API_KEY> \
     [--modelli jev-1.13.0,jev-1.14.0,gemini-3.1-flash-lite] [--varianti base,rovescio,domande-2] [--compiti azione,referente] [--casi id,id] [--mostra]
npx vite-node lab/scripts/jev-banco.ts -- --oggi --casi …                 # gli stessi casi con i prompt veri del gioco su Flash-Lite, e i modelli locali
npx vite-node lab/scripts/jev-banco.ts -- --prepara scultura|vita        # riscrive casi/scultura.json, casi/vita.json dal banco e dagli universi
npx vite-node lab/scripts/jev-banco.ts -- --rapporto                     # riepilogo.md dal registro
```

- **Le chiavi** si leggono solo nello script, dai `.env` dati con `--env` (altrimenti quello di questa cartella e del checkout principale):
  `TYPESAFE_KEY` e `GEMINI_API_KEY`. Lo script dice solo dove ha cercato, mai il valore; nel registro non arriva (il test lo prova).
- **I tetti** (`--tetto-typesafe`, predefinito 3 $; `--tetto-gemini`, predefinito 1 $) si sommano su **tutto** il registro, non sul giro:
  prima di ogni chiamata si riserva la stima, dopo vale il costo vero; una chiamata che non ci sta è una riga con `error: tetto`.
- **Il registro** è `consumi.jsonl`: una riga per chiamata (giro, fornitore, modello, versione che ha risposto, gruppo, compito, caso,
  variante, domande, token in/out, cache, ragionamento, dollari, ms, esito, le risposte con le probabilità, quali sono giuste). Le prove
  prima del primo giro (`prova-1`) restano nel registro e fuori dalle tabelle.
- **Il test** (`lab/tests/jev-banco.test.ts`) prova la modalità offline, i tetti, le stesse domande ai due modelli, i casi e che la chiave non
  finisca nel registro.

| file | cosa |
|---|---|
| `banco.ts` | tipi, il giudice Jev (`POST https://api.typesafe.ai/v1/systemone`), il giudice Gemini con le stesse domande (`typedPrompt`: lo stato, le domande, uno schema con gli `enum` delle opzioni, attraverso `lab/scripts/gemini.ts` → `GeminiAiModels` del kernel), quello finto, il voto, il registro, i tetti, il giro |
| `domande.ts` | le domande di ogni compito (in inglese, la lingua interna; lo stato resta nella lingua del mondo), le opzioni chiuse (effetti, squadre, bivi), le `domande-2` |
| `oggi.ts` | gli stessi casi con le chiamate vere del gioco (`judgeAction`, `judgeCombination`, `judgeCraft`, `liaisonReply`, la revisione della quarta parete) su un kernel acceso, a Flash-Lite e ai modelli locali |
| `scultura.ts`, `vita.ts` | i casi dei gruppi 2 e 3 dal banco e dagli universi |
| `rapporto.ts`, `riepilogo.md` | le tabelle, generate dal registro |
| `casi/decisioni.json`, `casi/scultura.json`, `casi/vita.json` | i casi registrati: lo stato, le risposte giuste, la regola di oggi (gruppo 3) |

## Il metodo

**I modelli**: `jev-1.13.0` (produzione) e `jev-1.14.0` (oggi `jev-preview` e `jev-latest` puntano a lui: la 1.14 è uscita il 14/10 con
«supporto multilingue migliore»); `gemini-3.1-flash-lite` con il ragionamento `low` e la temperatura 0,3, come i `lab/scripts`.
**Le stesse domande**: Jev riceve lo stato e le domande; Gemini lo stesso stato in JSON, le stesse domande con le stesse opzioni e una
`responseSchema` che chiude ogni risposta alle opzioni (un Noul diventa un booleano). Domande corte: lo stato del luogo e le scelte, mai la bibbia.

**Le varianti**: `base` le domande scritte prima di misurare; `rovescio` le stesse con le opzioni in ordine inverso (Jev tende alla prima,
dice la sua documentazione); `domande-2` domande più atomiche per la quarta parete e le combinazioni, scritte **dopo** il primo giro (lo
si dice: sono la seconda prova, non la prima); `oggi` i prompt veri del gioco su Flash-Lite, su metà dei casi del gruppo 1 (uno sì e uno
no) e su tutta la quarta parete in una chiamata sola, come fa `reviewFourthWall`; `locale` i modelli locali del gioco (`MockAiModels`) e il
filtro di parole (`metaBreak`): ciò che il kernel fa quando la manopola o i crediti mandano la chiamata lì.

**Le risposte giuste**: le regole registrate dei mondi (`world/rules.json` di valmora, sidera, orichalcum, neapolis), le ricette dei pacchetti,
i moduli che l'Arbitro ha ritirato in valmora (commit `c8478c4` del suo repository) e quelli che ha tenuto, i casi di `tests/fourthwall.test.ts`,
i giudizi di `lab/banco/finale/giudizio.md` e `lab/banco/conferma/giudizio.md`; il resto è scritto per il banco da chi l'ha scritto
(Claude Opus 5.5), con le risposte accettate per ogni caso. **Vanno rilette dall'autore.** Un caso può accettare più risposte; una
domanda senza risposta giusta (speculativa) non si vota.

## I risultati

Spesa del **primo giro di benchmark (`giro-1`)**, su cui sono calcolate le tabelle sotto:
- **TypeSafe: 0,161 $** (~0,16 $) per 1568 chiamate (3,84 milioni di token in ingresso a 0,042 $/M, uscita gratis a 0 $; di cui la variante principale `base` conta 2,92 milioni di token in ingresso);
- **Gemini: 0,662 $** (~0,66 $) per 598 righe (1,65 milioni di token in ingresso, prezzi da `src/kernel/ai/prices.ts`).

L'intero file di log (`consumi.jsonl`) comprende inoltre il giro di stabilità (`giro-1-ripeti`: 596 chiamate TypeSafe, 0,80 M token, 0,034 $) per misurare la concordanza tra due esecuzioni identiche, e le prove preliminari (`prova-1`: 12 chiamate TypeSafe per 0,001 $, 13 righe Gemini per 0,018 $), per un totale complessivo a registro di:
- **TypeSafe: 0,196 $** (2176 chiamate, 4,66 milioni di token in ingresso);
- **Gemini: 0,680 $** (611 righe, 1,69 milioni di token in ingresso).

> **Riconciliazione con la dashboard di TypeSafe:** sulla dashboard l'autore vede **0,16 $ con circa 3 milioni di token in ingresso**. La cifra coincide esattamente con la fatturazione del primo giro `giro-1` (0,1613 $ su 3,84 M token totali, o ~2,92 M per la variante `base`), al prezzo ufficiale documentato di **0,042 $ al milione di token in ingresso** (uscita gratis a 0 $). Non esiste una tariffa a ~0,053 $/M: l'apparente differenza nasceva solo dalla divisione a mente 0,16 $ / 3 M; infatti 0,161328 $ / 3.841.142 token fa esattamente **0,042 $/M**.

Il primo giro basta a concludere: i tetti più alti (5 $ e 5 $) non sono serviti.
Le tabelle intere, compito per compito e domanda per domanda, sono in [`riepilogo.md`](riepilogo.md).

### Gruppo 1: le decisioni del gioco

Giuste sul totale delle domande votate; costo per 1000 decisioni (ogni domanda fatta è una decisione); latenza mediana di una chiamata.

| compito | Jev 1.13 | Jev 1.14 | Flash-Lite, stesse domande | Flash-Lite, prompt del gioco (`oggi`) | modelli locali | $/1000 Jev | $/1000 Flash-Lite | $/1000 oggi | ms Jev / Flash-Lite / oggi |
|---|---|---|---|---|---|---|---|---|---|
| azione libera (`action.judge`): possibile, effetto, attrezzo, ripetibile | **98 %** | 95 % | 96 % | 92 % | 52 % | 0,013 | 0,107 | 0,539 | 184 / 911 / 2975 |
| squadra del Referente e rifiuto (`referente.coordinate`) | **98 %** | 97 % | 97 % | 90 % | 71 % | 0,016 | 0,153 | 0,507 | 158 / 900 / 1514 |
| oggetto citato → modello della libreria o «nuovo» (compito nuovo) | 93 % (**97 %** composto) | 93 % (97 %) | **100 %** | — (oggi si scolpisce sempre) | — | 0,071 | 0,461 | — | 177 / 941 / — |
| combinazione → oggetto noto o nessuno (`craft.judge`) | 65 % | 65 % | 88 % | **91 %** | 55 % | 0,028 | 0,216 | 0,764 | 168 / 885 / 1623 |
| fabbricazione libera: possibile, quale oggetto noto (`craft.free`) | 79 % (oggetto **100 %**) | 79 % (95 %) | 79 % (90 %) | 67 % (50 %) | 44 % | 0,027 | 0,216 | 0,669 | 161 / 937 / 1398 |
| quarta parete, un Noul | 75 % | 83 % | 62 % | 81 % (una chiamata per 53 testi) | 72 % (`metaBreak`) | 0,026 | 0,283 | 0,054 | 159 / 836 / — |
| quarta parete, quattro Noul (`domande-2`) | 91 % | 91 % | **96 %** | | | 0,006 | 0,078 | | 160 / 937 / — |
| quarta parete, quattro Noul **o** `metaBreak` | 94 % | 94 % | **100 %** | | | | | | |

- **Jev costa 6-12 volte meno di Flash-Lite con le stesse domande (di solito 8-10), 25-40 volte meno dei prompt del gioco, e risponde in 150-250 ms contro 0,9-3 s.**
  Sulle decisioni di classificazione (effetti, squadre, quarta parete, quale oggetto noto) è al livello di Flash-Lite o sopra.
- **Dove no**: le combinazioni («cosa esce da A e B?») vogliono sapere come si fanno le cose: Jev riconosce il panino, non il cuoppo di alici
  né la benda dalla stoffa; la versione `domande-2` non lo aiuta (56 %). Il «si può fare a mano» della fabbricazione sbaglia per tutti e tre
  allo stesso modo: senza fuoco, dicono, pizza e zuppa non si fanno, e le ricette del mondo dicono di sì; non distingue i modelli.
- **Il companion Noul** (lo schema di TypeSafe): per il riuso dei modelli Jev da solo sceglie il modello più vicino anche quando non va (un
  lupo per il drago, il gatto per la pecora); con «la scelta vale solo se `fits` ≥ 0,5» è al 97 %, e la separazione è netta: tutti i «nuovo»
  stanno sotto 0,22 di `fits`, tutti i riusi sopra 0,51, nessun riuso sbagliato a soglia 0,5.
- **I prompt del gioco** su Flash-Lite sono più cari (6000-8500 token in ingresso con la bibbia, il catalogo, il canone) e non migliori sulle
  decisioni; in `craft.free` danno al risultato un nome nuovo invece di quello noto («Panino» per «Panino con la mozzarella»): il kernel ne
  farebbe un doppione. I modelli locali sono il pavimento: 44-72 %.
- **La quarta parete** è il caso in cui la domanda conta più del modello: con un Noul solo che chiede quattro cose Flash-Lite dice quasi
  sempre «no» (62 %); con quattro Noul atomici sale al 96 % e Jev al 91 %. Le parole vietate «anche per altro» («il programma della radio»,
  «i giocatori della squadra») nessun modello le vede: le vede `metaBreak`, che va tenuto davanti.

### Gruppo 2: la scultura

| compito | Jev 1.13 | Jev 1.14 | Flash-Lite | $/1000 Jev | $/1000 Flash-Lite | ms Jev / Flash-Lite |
|---|---|---|---|---|---|---|
| rubriche sulle quattro facciate, il tetto e le piante in testo (`rubrica-viste`, 28 programmi giudicati × 9) | 73 % | 65 % | 81 % | 0,050 | 0,327 | 221 / 1148 |
| rubriche sugli strati (`rubrica-strati`) | 66 % | 43 % | 80 % | 0,037 | 0,257 | 199 / 1169 |
| rubriche sulle scatole per simbolo (`rubrica-simboli`) | 69 % | 64 % | 83 % | 0,013 | 0,106 | 176 / 1102 |
| il nodo che rovina la forma (`colpevole`, 29 programmi che passano con un nodo aggiunto) | **69 %** (nei primi 3: **100 %**) | 69 % | 31 % | 0,659 | 7,975 | 247 / 2290 |

- **Le rubriche non funzionano per nessuno dei due**, e i numeri ingannano: i giudizi del banco sono quasi tutti «sì» (la risposta più
  frequente, criterio per criterio, prende l'87 %). Flash-Lite risponde «sì» e «passa» a tutto (19 veri positivi, 9 falsi positivi, 0 negativi);
  Jev dà quasi sempre lo stesso livello e un «passa» fermo fra 0,19 e 0,43 senza legame con il giudizio. Dalle viste in testo nessuno dei
  due ricava ciò che l'Artista vede nelle foto: `model.judge` resta all'Artista (le immagini di Jev sono Danger Zone).
- **Il nodo colpevole sì**: con il difetto detto a parole («la porta sul davanti è murata») e i nodi del programma come opzioni (fino a
  250, con le celle, le lettere e la scatola di ciò che hanno cambiato) Jev indica quello giusto 20 volte su 29 e lo ha sempre tra i primi
  tre; Flash-Lite 9 su 29, a dodici volte il prezzo. Le porte murate sono le più difficili (2 su 6): il nodo che mura è piccolo e ce ne
  sono altri simili. Sono sabotaggi: un nodo intero aggiunto tardi; un difetto vero può essere un nodo che manca.
- Enorme e Gargantuesca: a mezza risoluzione (un carattere ogni 2×2 voxel) la rocca (Enorme, 120 × 120 × 96) sta in 15 mila token di Jev,
  sotto i 32k di una domanda: «a pezzi» non è servito. A risoluzione piena (circa 90 mila caratteri) non ci starebbe, e lì andrebbe a pezzi.

### Gruppo 3: la vita degli individui

| compito | regola di oggi | Jev 1.13 | Jev 1.14 | Flash-Lite | $/1000 Jev | $/1000 Flash-Lite | ms Jev / Flash-Lite |
|---|---|---|---|---|---|---|---|
| mestiere → programma di lavoro (38 mestieri, 29 da valmora) | 63 % (`matchJob`: 25 mestieri su 34 di valmora senza programma) | **87 %** | 82 % | 76 % | 0,079 | 0,620 | 168 / 892 |
| bivio (20, neapolis) | 55 % (`aspetta`) | 90 % | 90 % | **95 %** | 0,029 | 0,295 | 159 / 874 |
| meta della fase con un fatto del giorno (20, neapolis) | 50 % (la routine) | 75 % | 80 % | 80 % | 0,032 | 0,329 | 161 / 867 |
| le stesse in 3 richieste (`meta-lotto`, 19) | | 74 % | 74 % | 89 % | **0,018** | 0,136 | 167 / 1022 |
| chi entra in squadra (5) | 40 % (`fillTeam`) | 100 % | 100 % | 100 % | 0,026 | 0,294 | 163 / 866 |
| il passo dell'impresa (6) | 100 % (`nextStep`, esatto) | 83 % | 83 % | 83 % | 0,026 | 0,306 | 158 / 853 |

- **La soglia**: «Jev se la sua probabilità è almeno *t*, altrimenti la regola» non aiuta: dove Jev è incerto la regola sbaglia di più
  (mestieri: 87 % Jev solo, 82 % a soglia 0,5, 68 % a 0,7). La regola resta il pavimento per quando la risposta **manca** (rete, tetto,
  modello fuori servizio), non per quando è incerta; e per ciò che è aritmetica (il passo).
- **I lotti**: le mete di una fase chieste tutte insieme costano il 43 % in meno per decisione (434 token invece di 764: lo stato e le ~270
  righe fisse di ogni richiesta si pagano una volta) con la stessa precisione per Jev (74 % e 75 %).
- **Stabilità**: le stesse richieste rifatte danno la stessa risposta nel 99 % dei casi (la probabilità di un Noul si muove di 0,01 in
  mediana, 0,04-0,05 al 90 %); con le opzioni al contrario resta uguale il 90-100 % delle risposte.

## Dove conviene, dove no

- **Conviene** dove la risposta è una scelta fra cose che il gioco già ha e la scelta evita una generazione: il riuso di un modello
  (la scultura è il 60 % della spesa di un'ora: `Modelli nuovi` 0,44 $ e `Revisioni` 0,18 $ su 1,04 $ di `hourlyEstimate` del seme), un
  oggetto noto invece di un doppione, un programma di lavoro esistente invece di nessuno; e dove la regola di oggi è povera e la scelta
  dà vita (bivi, mete con un fatto del giorno, squadre): a 0,00003 $ a decisione un'ora di 30 individui con una meta e un bivio a fase costa
  4,6 ¢ (2,6 a lotti) contro 1,87 $ del `npc.decide` progettato su Flash-Lite.
- **Conviene come filtro**: la quarta parete su ogni testo generato (persone, trame, «Esamina»), con `metaBreak` davanti: oggi il
  controllo del modello è una volta per universo; a Jev costa 2,5 millesimi di centesimo a testo.
- **Conviene per lo Scultore**: i tre nodi sospetti per la seconda richiesta, o da togliere uno alla volta rifacendo le misure, senza modello.
- **Non conviene**: le combinazioni e ciò che vuole sapere come si fanno le cose; i giudizi estetici su viste in testo (né Jev né
  Flash-Lite); i conti (il passo dell'impresa: la regola è esatta); la generazione (racconti, nomi, programmi).
- **Il risparmio grande che l'autore si aspettava c'è sul prezzo per decisione** (6-12× contro Flash-Lite, 25-40× contro i prompt del
  gioco), **ma le decisioni pesano poco nella spesa di oggi**: «Altro…» e fabbricazioni sono 0,01 $ l'ora. Il guadagno vero è indiretto
  (scolpire meno, non fare doppioni) e nella vita del mondo, che Jev rende abbordabile.

## Gruppo 3, parte 1: il censimento di `CENSUS`

I compiti di `src/kernel/coefficients.ts → CENSUS` (nessuno cambia: è la lettura). «Sceglie» vuol dire che la risposta del modello è, in
tutto o in parte, una scelta fra opzioni note.

| compito | cosa sceglie oggi dentro la chiamata | cosa scrive | Jev |
|---|---|---|---|
| `genesis.*` (8) | — | la bibbia, lo stile, i terreni, la fisica, i layout, l'atlante, il cast | no: si genera, una volta |
| `chunk.plan` | l'ambiente (elenco), i moduli dentro e fuori (il catalogo), le rune | nome, descrizione | da provare per le scelte; il nome resta del Cartografo |
| `cartographer.environment`, `forge.concept`, `forge.code`, `forge.fix`, `content.items`, `content.define`, `content.recipes`, `npc.individuate`, `npc.sheet`, `npc.dialogue`, `plot.weave`, `text.examine`, `text.read`, `spell.name`, `rune.invent`, `agent.chat`, `model.sculpt`, `model.action`, `mechanic.design`, `sound.compose` | poco o niente | tutto | no |
| `forge.physics`, `content.physics` | | numeri | no: Jev non fa i conti |
| `forge.review`, `content.review`, `genesis.review` | approvato sì/no | i problemi | da provare come filtro: chiamare il revisore solo quando Jev non è sicuro del sì |
| `action.judge` | possibile, gli effetti (insieme chiuso), l'attrezzo, ripetibile | il racconto, l'etichetta, i parametri | **sì** per le scelte (98 %); il racconto resta da scrivere |
| `craft.judge` | possibile, quale strumento noto | la spiegazione | **no** (65 % contro 91 %) |
| `craft.free` | possibile, quale oggetto noto | racconto, ingredienti | **sì** per «quale oggetto noto» (100 %), no per «si può fare» |
| `referente.coordinate` | la squadra (elenco), il rifiuto | la risposta, la richiesta riformulata | **sì** (98 %) |
| `review.fourthwall` | chi ritirare | il motivo | **sì**, quattro Noul con `metaBreak` (94 %); già economico oggi (una chiamata per universo) |
| `model.judge` | voto, riconoscibile | problemi, consigli | **no** su viste in testo; resta all'Artista con le foto |
| `council.session` | l'intervento (elenco) | la valutazione, la richiesta | da provare per l'intervento |
| `npc.reply` | l'azione (`segui resta vaga dai nessuna`), l'umore, il legame | la battuta | la battuta domina: no |
| `player.death` | perde tutto, ripartenza | il racconto | no: decide già il livello della Genesi |

E le scelte che il kernel fa oggi con una regola fissa, senza chiamate: il programma di un mestiere (`matchJob`), la meta di una fase
(`placeFor` dalla routine), i bivi (non ancora: `npc.decide` è progettato in `docs/design/comportamento-npc.md`, 2.1), la squadra di
un'impresa (`fillTeam`), il passo (`nextStep`). In più un compito nuovo che oggi non c'è: **riusare un modello** prima di scolpirne uno.

## Gruppo 3, parte 2: compito → oggi, con Jev, risparmio, rischio

Misure di questo banco; i dollari l'ora vengono da `hourlyEstimate` del seme (1,04 $ l'ora, Flash-Lite) e dalle ipotesi di `HOUR`
(6 giorni di mondo l'ora, 4 fasi al giorno). Il pavimento è sempre la regola di oggi: se la risposta manca o non è fra le opzioni (Jev non
può, ma il validatore controlla lo stesso) vale lei. In `MockAiModels` (o nella sua parte per le decisioni) la risposta è la regola, così i
test e il gioco senza chiave restano quelli di oggi.

| compito | oggi | con Jev (misurato) | risparmio stimato | rischio | pavimento e `MockAiModels` |
|---|---|---|---|---|---|
| riuso dei modelli, prima di `model.sculpt` (nuovo) | ogni tipo nuovo ha un modello scolpito: 0,62 $ l'ora fra scultura e revisioni | 97 % con il companion Noul, 0 riusi sbagliati a `fits` ≥ 0,5; 0,0001 $ a decisione | **0,19-0,31 $ l'ora** se si riusa il 30-50 % dei modelli chiesti (18-30 % dell'ora), più mondo pronto prima | meno varietà: un tipo nuovo veste un modello vecchio; da decidere per classe (persone sì o no) | scolpire, come oggi |
| mestiere → programma, quando `matchJob` non trova | 25 dei 34 mestieri di valmora non lavorano | 87 % (82 % la 1.14), una volta per mestiere: 0,00008 $ | `job.program` evitati (0,08 $ per universo nel progetto); la gente lavora anche in Cronaca | un mestiere su otto nel programma sbagliato (un bottaio fabbro va bene, uno speziale contadino no) | `matchJob`, poi nessuno |
| bivi (`npc.decide`, progettato) | in progetto: Vita 36 l'ora, Teatro 144 a 0,13 ¢ su Flash-Lite (0,05-0,19 $ l'ora; 0,13-0,50 con l'Attore su 3.8 Flash) | 90 % (Flash-Lite 95 %) a 0,00003 $ | **0,05-0,50 $ l'ora**, o bivi per tutti a ogni fase: 30 individui 2,1 ¢ l'ora | la battuta del bivio resta da scrivere (le righe `dice` dei programmi, o una chiamata solo per chi è vicino) | il seme pesato dai tratti, `aspetta` |
| meta della fase quando il giorno ha un fatto | la routine, sempre (50 % sui casi con un fatto) | 75-80 % (89 % Flash-Lite a lotti); a lotti 0,000018 $ | nessuno da risparmiare: è vita in più; chiedere solo quando c'è un fatto (pioggia, festa, malattia, un appuntamento) | il fatto va scritto nello stato dal kernel (eventi, trame) | la routine |
| squadra di un'impresa | `fillTeam` per mestiere e vicinanza (40 % sui casi con una sfumatura) | 100 % su 5 casi | vita in più (il rivale del capo non entra, il gatto non porta basoli) | campione piccolo | `fillTeam` |
| passo dell'impresa | `nextStep`, esatto | 83 % | — | Jev non conta | **resta la regola** |
| scelte di `action.judge` | 6700 token, 0,002 $ a chiamata, 8 l'ora | 98 %, 0,00005 $ | ~0,01 $ l'ora: poco; scartare senza chiamata ciò che non si può fare, e chiedere il racconto breve solo per ciò che riesce | il testo del viandante è nello stato: un testo scritto per convincere il giudice (jaggedness #6) va provato | il giudizio semplice dei modelli locali |
| squadra del Referente | 1700 token, 0,001 $ a chiamata, solo nello studio | 98 % | poco (lo studio è raro) | la risposta cordiale resta da scrivere | i modelli locali |
| `craft.free`: quale oggetto noto | 50 % dei nomi giusti con il prompt di oggi | 100 % | doppioni e `content.define` evitati | — | il nome scritto, come oggi |
| filtro della quarta parete su ogni testo generato | `metaBreak`, più l'Arbitro una volta per universo | 94 % con `metaBreak` davanti | nessuno: è una guardia nuova a ~0,000025 $ a testo | falsi positivi su ciò che somiglia (le rune di neapolis, il calcolatore della banca): va rimandato al Narratore, non cancellato | `metaBreak` |
| il nodo colpevole per lo Scultore | la seconda richiesta con la traccia (`--traccia`) | 69 %, sempre fra i primi 3, a 0,0007 $ | una seconda richiesta da ~0,015 $ in meno quando togliere il nodo basta | sabotaggi del banco, non difetti veri | la seconda richiesta di oggi |
| `craft.judge`, rubriche dei modelli | | 65 %; rubriche senza discriminazione | — | — | restano a Gemini |

**Come tagliare ancora i token**: domande raggruppate (tutte le mete di una fase in una richiesta: −43 % a decisione, misurato); stato
compresso (i nomi delle persone e i legami in parole, la routine in quattro righe, mai la persona intera: 600-760 token a richiesta);
nessuna chiamata quando lo stato è quello della routine (la meta senza un fatto del giorno, il mestiere già abbinato: una cache per
stato uguale è quasi sempre «la regola»); una risposta per sempre dove la scelta non cambia (mestiere → programma, oggetto → modello,
come oggi le azioni imparate diventano regole). La soglia di probabilità non conviene, per i motivi sopra.

## Jev in italiano contro l'inglese (T323)

Il task T323 misura l'impatto dell'italiano sui compiti del gruppo 1 e sui mestieri (244 casi, 425 decisioni votate) nelle tre varianti:
1. **tutto in inglese**: stato tradotto in inglese, domande e opzioni in inglese (il riferimento ideale);
2. **stato in italiano con domande e opzioni in inglese (`base`)**: lo stato vive nella lingua del mondo, i prompt e gli enum nella lingua interna (ADR-0153);
3. **tutto in italiano**: stato in italiano, domande e opzioni tradotte in italiano.

### Tabella per compito (Jev 1.13 contro Flash-Lite)

| compito | Jev tutto-en | Jev misto (`base`) | Jev tutto-it | Flash-Lite tutto-en | Flash-Lite misto | Flash-Lite tutto-it | $/1000 Jev (en/misto/it) | $/1000 Lite (en/misto/it) | ms Jev / Lite |
|---|---|---|---|---|---|---|---|---|---|
| azione | 96 % | **98 %** | 97 % | 93 % | **96 %** | 97 % | 0.017 / 0.017 / 0.019 | 0.141 / 0.147 / 0.154 | 184 / 911 |
| referente | 98 % | **98 %** | 98 % | 97 % | **97 %** | 97 % | 0.016 / 0.016 / 0.018 | 0.155 / 0.158 / 0.165 | 158 / 900 |
| modello | 82 % | **93 %** | 82 % | 93 % | **100 %** | 89 % | 0.112 / 0.072 / 0.112 | 0.707 / 0.467 / 0.720 | 177 / 941 |
| combinazione | 60 % | **65 %** | 63 % | 79 % | **88 %** | 81 % | 0.024 / 0.028 / 0.029 | 0.197 / 0.221 / 0.222 | 168 / 885 |
| fabbricazione | 79 % | **79 %** | 76 % | 76 % | **79 %** | 82 % | 0.024 / 0.028 / 0.028 | 0.202 / 0.227 / 0.230 | 161 / 937 |
| quarta-parete | 75 % | **75 %** | 81 % | 62 % | **62 %** | 64 % | 0.026 / 0.026 / 0.028 | 0.267 / 0.283 / 0.292 | 159 / 836 |
| mestiere | 76 % | **87 %** | 76 % | 68 % | **76 %** | 79 % | 0.057 / 0.078 / 0.078 | 0.458 / 0.620 / 0.608 | 168 / 892 |
| **TOTALE** | 84 % | **88 %** | 85 % | 85 % | **88 %** | 87 % | 0.039 / 0.035 / 0.043 | 0.296 / 0.277 / 0.324 | 167 / 895 |

### Il testo libero del viandante (azioni libere, richieste al Referente, quarta parete: 127 casi, 233 decisioni)

Il testo libero non ha un vocabolario chiuso. Risultati su Jev 1.13:
- **Tutto in italiano**: **94 %** (218/233)
- **Stato in italiano, domande in inglese (`base`)**: **93 %** (217/233)
- **Solo testo libero tradotto in inglese**: **93 %** (217/233)
- **Tutto in inglese**: **92 %** (214/233)

Su `quarta-parete`, la variante in italiano raggiunge l'**81 %** (contro il 75 % in inglese).
Jev cattura le sfumature espressive dell'italiano direttamente nei suoi embedding; non c'è alcuna perdita qualitativa sul testo naturale.

### Quanto costa tradurre (misura empirica con Flash-Lite)

Misurata la traduzione integrale dei 244 casi con Flash-Lite contro la tabella statica (`internalNames.ts`):

| metodo | cosa traduce | token medi per richiesta | costo per 1000 chiamate | latenza mediana | precisione finale |
|---|---|---|---|---|---|
| **Nessuna traduzione** (stato IT, domande EN) | Niente | 0 | **$0,00** | **0 ms** | **88,5 % (massima)** |
| **Tabella statica** (`internalNames.ts`) | Oggetti, mestieri, modelli noti | 0 | **$0,00** | **0 ms** | Allineamento perfetto |
| **Traduzione LLM** (Flash-Lite) | Testo libero / stati arbitrari | ~670 in + ~580 out | **$1,20 - $1,55** | **1800 - 3500 ms** | 84,5 % (**−4 %**) |

Un'intera decisione di Jev costa **0,035 $ / 1000 decisioni** e richiede **167 ms**. Tradurre il testo con un modello costa **28-35 volte di più** dell'intera decisione e richiede **10-20 volte più tempo**, peggiorando al contempo la precisione per il disallineamento dei sinonimi.

### La regola che ne esce (ADR-0157)

1. **Non tradurre il testo libero del viandante**: Jev comprende nativamente l'italiano (93,6 % contro 91,8 %).
2. **Non tradurre lo stato del mondo**: i nomi di oggetti, modelli e mestieri in italiano garantiscono l'allineamento con i cataloghi dei moduli.
3. **Mantenere domande ed enum in inglese (`base`)**: risparmiano il 18 % di token (840 contro 1029) e danno la massima precisione (**88,5 %**).
4. **Se mai servisse tradurre, solo tabella statica**: mai un LLM di traduzione a runtime.

## Le immagini (T324)

L'autore (06/11) ha chiesto di provare Jev con le immagini, che T313 non aveva toccato perché TypeSafe le dà come funzione sperimentale.
Qui le foto dei modelli in 3/4 a cartone — quelle che l'Artista giudica (`views()` in `src/kernel/agents/sculptor.ts`, `model.judge`) — vanno
a Jev e a Gemini 3.1 Flash-Lite con le **stesse immagini e le stesse domande chiuse**. Solo `lab/`: niente arriva al gioco.

### I limiti della funzione sperimentale

Dalla documentazione ([docs.typesafe.ai/images.md](https://docs.typesafe.ai/images.md), [models.md](https://docs.typesafe.ai/models.md),
[changelog](https://docs.typesafe.ai/changelog.md), lette il 07/11/2026):

- **«Dreamer-ready»**: per TypeSafe le immagini non sono pronte per la produzione; formato, risposte, limiti e precisione possono cambiare
  da una versione all'altra. Vanno accese con l'intestazione `TypeSafe-Danger-Zone-Images: true` su ogni richiesta che ne ha (senza: `400`).
  Le accettano sia `jev-1.13.0` sia `jev-1.14.0` (arrivate con la 1.14, il 14/10, «funziona anche sulla 1.13»); le domande *Box* (dove sta
  una cosa nell'immagine) solo la 1.14.
- **Dove**: un'immagine va ovunque va il testo — nello `state`, nelle `instructions` di una domanda, nei `criteria` (un'opzione di una
  Choice, un livello di uno Score, il `true`/`false` di un Noul) — come un **riferimento** testuale (qui `img-<10 cifre esadecimali>`, stabile
  per la foto) che il servizio sostituisce con l'immagine elencata in `assets`. **Ogni uso del riferimento aggiunge di nuovo l'immagine**
  (si paga e conta nei limiti ogni volta): un'immagine che più domande guardano va nello stato, una volta sola. Un asset non citato è un `400`.
- **Misure**: PNG o JPEG fermi; ogni lato fra **280 e 1568 pixel**, l'area fra 78 400 e 2 458 624 pixel; 16 MiB a file, 32 MiB la richiesta,
  tutte le immagini e la richiesta espansa. Un'immagine fuori misura è rifiutata, mai ridimensionata; se una è rifiutata, cade la richiesta
  intera. I metadati (EXIF) si buttano senza applicare l'orientamento.
- **Prezzo**: le immagini sono token in ingresso al prezzo del testo (0,042 $ al milione), dentro `usage.input_tokens` e dentro i contesti
  di 64k per richiesta e 32k per domanda; «come stimare i token di un'immagine» TypeSafe non lo dice ancora. Nessun limite di frequenza a parte.

**Misurato qui**: Jev conta circa **due token per riquadro di 28 × 28 pixel e un centinaio a immagine** (≈ 390 pixel a token: la striscia
dei quattro lati di una struttura, 1100 × 375, ≈ 1230 token; il lato solo, 280 × 390, ≈ 390; la griglia 2×2 quanto la striscia con gli
stessi pixel); Flash-Lite **~1100 token a foto** qualunque sia la misura. Le foto del gioco sono più basse di 280 pixel: lo script le **allarga con lo sfondo** del foglio, senza
scalarle (`padded` in `foto.ts`).

### Come si usa

```bash
npx vite-node lab/scripts/jev-banco.ts -- --prepara immagini            # le foto in lab/out/jev/foto (11 MB, ignorate da git) e casi-immagini/immagini.json, ~9 minuti
npx vite-node lab/scripts/jev-banco.ts -- --gruppi immagini --offline --varianti lati4    # risposte finte, nessuna spesa
npx vite-node lab/scripts/jev-banco.ts -- --gruppi immagini --varianti lati4,nomi8 --run img-1 \
     --tetti-giri img,prova-immagini --tetto-typesafe 0.5 --tetto-gemini 0.5            # i tetti contano solo i giri di T324
npx vite-node lab/scripts/jev-banco.ts -- --gruppi immagini --oggi-artista --casi … --run img-oggi   # l'Artista del gioco (judge, gemini-3.5-flash)
npx vite-node lab/scripts/jev-banco.ts -- --rapporto                    # riepilogo.md e riepilogo-immagini.md
```

Una **variante è una forma** delle foto: `lati4` (i quattro lati in fila, la foto che il gioco manda all'Artista), `lato1` (il davanti),
`griglia` (i quattro lati 2×2), `separate` (quattro foto nello stato: `front`, `right`, `back`, `left`); per l'oggetto → modello `nomi8`,
`foto8`, `foto50`. Le foto si rigenerano uguali (MarkovJunior è deterministico, i riferimenti vengono dal nome della foto); se mancano, lo
script le rifà prima di chiedere. I casi con le immagini stanno in `casi-immagini/`, fuori da `casi/`: il banco di T313 e i suoi test
restano quelli. File nuovi: `foto.ts` (le foto e i limiti), `immagini.ts` (i casi, i difetti), `artista-oggi.ts` (l'Artista del gioco),
`rapporto-immagini.ts` (le tabelle), `lab/tests/jev-immagini.test.ts`.

### I casi (936) e le risposte giuste

| compito | casi | domande | da dove vengono le risposte giuste |
|---|---|---|---|
| `artista`: la rubrica dell'Artista | 28 giudicati × 4 forme, più 95 difettosi in `lati4` | i sei criteri che si vedono da fuori (riconosce, regge, lati, tetto, colori, dettaglio: Score a tre livelli, come T313), `passa` (Noul), `voto` (Score a quattro livelli: sotto 7 o da 7 in su, la soglia dell'Artista) | `lab/banco/finale/giudizio.md` e `lab/banco/conferma/giudizio.md` (19 passano, 9 no); i difettosi non devono passare |
| `concetto`: quale dei sette edifici è | 28 × 3 forme | Choice fra i sette bersagli del banco (nome e stile) | il bersaglio del programma |
| `difetto`: cinque difetti fatti apposta | 19 edifici che passano × (intero + 5 difetti) × 3 forme | cinque Noul: buco nel tetto, puntini sui muri, una parte tagliata, un colore solo, porta murata | il difetto fatto sulla griglia finita (`withDefect`): noto, non giudicato |
| `confronto`, `migliore` | 38 coppie intero/difetto e 18 giudicato/giudicato (in tutti e due gli ordini), 19 quattro | Choice A/B (A-D) | l'intero; quello che il giudizio fa passare |
| `riconosci` | 50 modelli del mondo della libreria | Choice fra i 50 nomi | l'id del modello (i doppioni di nome, come le due locande, valgono) |
| `quarta-parete-foto` | 50 del mondo e 17 dello studio della corona | Noul `modern` (neon, schermi, macchine elettriche) e `belongs` (sta in Valmora) | lo studio della corona non è mai nel mondo; panchina, totem e albero di luce dello studio non si votano; gerboa, schermi e circuito (scatole vuote finché il gioco non ci scrive) fuori |
| `modello-foto` | i 37 casi di T313 × 3 | Choice + `fits` (il companion Noul) | le risposte di T313; `nomi8`: gli otto candidati che i nomi di T313 mettono prima, con i giusti; `foto8`: gli stessi otto, solo foto e chiavi opache; `foto50`: tutta la libreria, il davanti |

I difetti si fanno sulla griglia finita, non nel programma: cambia ciò che si vede e nient'altro. Il **buco** è un quadrato di un terzo
dell'impronta dove il tetto è più alto, scavato per un piano; i **puntini** il 12 % delle celle della lettera dei muri, nel colore più lontano;
la **parte tagliata** il 38 % a destra della larghezza; il **colore unico** tutto nella lettera dei muri; la **porta murata** l'ingresso misurato
dal banco (`misure.ts → porta`) riempito fino sopra la testa.

### I risultati

Spesa di T324: **TypeSafe 0,280 $** (2846 chiamate, 6,67 milioni di token in ingresso), **Gemini 0,477 $** (576 righe, 1,31 milioni di token,
di cui 0,028 $ per le 10 chiamate dell'Artista del gioco su gemini-3.5-flash); tetti 0,50 $ e 0,50 $. Le prove prima del giro (`prova-immagini`,
`img-prova`, con un doppione di casi poi tolto) sono nella spesa e fuori dalle tabelle. Forma `lati4` dove non è detto; giuste sulle
domande votate; costo per 1000 decisioni; latenza mediana.

| compito | Jev 1.13 | Jev 1.14 | Flash-Lite | da sola, la risposta più frequente | $/1000 Jev | $/1000 Flash-Lite | ms Jev / Flash-Lite |
|---|---|---|---|---|---|---|---|
| `artista` (passa, voto, criteri) | 71 % | 69 % | 48 % | — | 0,013 | 0,102 | 217 / 1396 |
| … `passa` sui giudicati: passano detti sì / non passano detti no | 0/19 / 9/9 | 0/19 / 9/9 | 19/19 / 0/9 | | | | |
| … `passa` sui difettosi: detti no | 94/95 | 95/95 | 14/95 | | | | |
| … AUC di p(passa): giudicati / interi contro difettosi | 0,77 / 0,57 | 0,72 / 0,58 | (0 o 1) | | | | |
| `difetto` (5 Noul) | 74 % | **88 %** | **89 %** | 83 % (sempre «no») | 0,014 | 0,114 | 206 / 1461 |
| … AUC per difetto: tetto, puntini, tagliato, un colore, porta | 0,89, **1,00**, 0,83, **1,00**, 0,71 | **0,93**, **1,00**, **0,90**, **1,00**, 0,53 | (sì/no) | | | | |
| … visti a soglia 0,5 / falsi allarmi sugli interi | | | 37 %, 79 %, 11 %, 74 %, 0 % / 1 interi su 19 | | | | |
| `migliore`: l'intero fra tre suoi difetti | **79 %** | 74 % | 32 % | 25 % | 0,225 | 1,451 | 253 / 1217 |
| `confronto` intero contro difetto (due ordini) | **82 %** | 79 % | 66 % (sceglie A il 63 %) | 50 % | 0,119 | 0,814 | 220 / 1101 |
| `confronto` giudicato contro giudicato | 67 % | 67 % | **78 %** | 50 % | | | |
| `concetto` (quale dei 7) | 86 % | 89 % (griglia **96 %**) | **100 %** | 14 % | 0,073 | 0,528 | 230 / 1274 |
| `riconosci` (quale dei 50 modelli) | 44 % | 42 % | **66 %** | 2 % | 0,093 | 0,674 | 198 / 1303 |
| `quarta-parete-foto` | 80 % | **92 %** | **94 %** | 78 % (tutto «del mondo») | 0,024 | 0,269 | 187 / 1058 |
| `modello-foto` composta: `nomi8` / `foto8` / `foto50` | **97 %** / 65 % / 68 % | **100 %** / 65 % / 68 % | 95 % / — / — | | 0,018 / 0,127 / 0,287 | 0,176 / 1,325 / — | 167 / 986 |
| … sugli stessi 14 casi: `nomi8` / `foto8` / `foto50` | 14 / 8 / 9 | 14 / 7 / 9 | 12 / 12 / — | | | | |

L'**Artista del gioco** (`judge` di `sculptor.ts` su gemini-3.5-flash, con la sua foto e il suo prompt, 10 casi): 6 su 10 giusti col voto
≥ 7; boccia il buco nel tetto (3/10) e le due pagode e la torre che il giudizio boccia, **promuove con 8/10** la rocca tutta grigia e il tempio
tagliato pur scrivendo nei problemi «la palette è quasi interamente monocromatica» e «la struttura appare tagliata sul retro»; 0,0028 $ e
3,3 s a chiamata (30-40 volte Jev, più del doppio del tempo di Flash-Lite). Il campione è piccolo: dice come lavora, non quanto vale.

Le forme (tutte le tabelle in [`riepilogo-immagini.md`](riepilogo-immagini.md)):
- **`griglia` vale `lati4`** e costa uguale (1581 token contro 1593 sulle stesse richieste): difetti 89 % e AUC 0,95-0,97 sul
  tagliato e sul buco con la 1.14, il concetto 96 %.
- **`lato1`** costa meno della metà (753 token contro 1593) e perde ciò che sta dietro o di lato: i criteri «lati» crollano (0-4 %), la parte tagliata
  passa da 0,90 a 0,75 di AUC, il concetto da 89 a 64 %. Basta per i puntini e il colore unico (AUC 1,00).
- **`separate`** (quattro foto) non aggiunge niente alla striscia e costa di più (2446 token contro 2381 sulla rubrica).

**Stabilità** (lo stesso giro rifatto, `img-1-ripeti`): Jev dà le stesse risposte nel 95-100 % dei casi (la 1.14 l'82 % su `riconosci` e
l'84 % su `migliore`), la probabilità di un sì si muove di 0,01 in mediana e di 0,02-0,07 al 90 %; Flash-Lite, sui 28 giudicati, il 100 %
(dice sempre sì).

### Cosa ne esce

- **I giudizi d'insieme non passano alle immagini**, per nessuno dei due: come sulle viste in testo di T313, Flash-Lite dice «passa» a tutto
  (anche all'85 % dei difettosi), Jev «non passa» a tutto, con una probabilità che ordina appena i giudicati (AUC 0,72-0,77 su 19 contro 9)
  e non i difettosi (0,57). I criteri non fanno meglio della risposta più frequente; «regge» Jev lo dice sempre «no» (il criterio è scritto
  al negativo: «nessuna parte fluttua…», jaggedness #1 e #7).
- **Le domande atomiche sui difetti visibili sì, e lì Jev è meglio di Flash-Lite**: le sue probabilità separano i puntini e il colore unico
  in ogni foto (AUC 1,00), il buco nel tetto e la parte tagliata quasi sempre (0,89-0,97 con la 1.14); Flash-Lite, che risponde sì o no,
  ne vede il 79 %, 74 %, 37 % e 11 %. Con la soglia 0,5 Jev è mal tarato: al colore unico dà 0,00-0,02 sugli interi e 0,14-0,33 (mediana) sui
  grigi, al buco 0,10 contro 0,28 (la 1.14): la soglia va scelta per domanda e per versione, su casi nuovi. **La porta murata nessuno la vede** (AUC 0,53-0,71, Flash-Lite 0 %).
- **Scegliere la versione buona fra quelle rotte**: Jev sceglie l'intero fra quattro il 79 % delle volte, Flash-Lite il 32 %; in coppia 82 %
  contro 66 % (Flash-Lite preferisce la prima). Fra due tentativi veri che il giudizio separa per gusto Flash-Lite fa meglio (78 % contro 67 %).
- **Riconoscere** che cosa è: Flash-Lite meglio (concetto 100 %, i 50 modelli 66 %); Jev 86-96 % sui sette edifici, 42-44 % sui modelli
  piccoli della libreria (un lupo, un sasso, un gatto in poche decine di voxel).
- **La foto al posto del nome peggiora**: per l'oggetto → modello i nomi danno il 97-100 % con il companion Noul, le foto il 65-68 %, a
  7-16 volte i token. Il nome di un modello dice già ciò che serve; la foto di un modello piccolo no.
- **La 1.13 e la 1.14 sono due modelli diversi sulle immagini**: la 1.13 dice «tagliato» a tutti gli interi (19 su 19, p 0,84 in mediana),
  la 1.14 a 2; la 1.14 vede meno il buco a soglia 0,5 ma lo ordina meglio. Una soglia vale per una versione: la versione va fissata (non `jev-latest`).

### Dove le immagini con Jev valgono la spesa e dove no

| uso | oggi | con Jev e le immagini (misurato) | vale la spesa? |
|---|---|---|---|
| filtro dei difetti evidenti sulle foto di un modello scolpito, prima dell'Artista (puntini, colore unico, buco, parte mancante) | l'Artista (3.5 Flash, 0,0028 $, 3 s) li scrive nei problemi ma può dare 8/10 lo stesso | AUC 0,93-1,00 (1.14, `griglia`), 0,00007 $ e 0,2 s a foto, 40 volte meno dell'Artista | **sì, come filtro** a soglie per domanda tarate su casi nuovi, la versione fissata: rimanda allo Scultore ciò che è rotto senza chiamare l'Artista, o abbassa il voto; non sostituisce l'Artista |
| scegliere la versione migliore fra più semi o fra la prima e la seconda richiesta, quando una è rotta | nessuno (si tiene il voto più alto dell'Artista) | 79 % fra quattro, 82 % in coppia (Flash-Lite 32 % e 66 %), 0,0002 $ | **sì** per scartare la versione rotta; no per scegliere per gusto (67 % contro 78 % di Flash-Lite) |
| il giudizio dell'Artista (`passa`, voto ≥ 7, i criteri) | Gemini 3.5 Flash con la foto | dice no a tutto; AUC 0,57 contro i difettosi | **no** |
| riconoscere il concetto («è una pagoda?») | il voto `riconoscibile` dell'Artista | 89-96 % fra sette edifici (Flash-Lite 100 %) | **forse**, come controllo grezzo a 0,00007 $; dove serve la risposta giusta, Flash-Lite |
| riconoscere un modello piccolo della libreria | — | 42-44 % fra 50 (Flash-Lite 66 %) | **no** |
| oggetto → modello della libreria con le foto | i nomi (T313: 97 % con il companion Noul) | 65-68 % | **no**: i nomi sono meglio e costano 7-16 volte meno |
| la quarta parete sulle foto (un modello con neon, schermi, macchine in un mondo medievale) | nessuno: la quarta parete si guarda sui testi | 92 % la 1.14 (Flash-Lite 94 %), 0,00007 $ | **sì, la 1.14**, come guardia economica sui modelli nuovi di un mondo che ha un'epoca; il campione è facile (lo studio al neon contro Valmora) |
| la porta murata, ciò che è dentro | le misure del kernel (`misure.ts`, `reachableStoreys`) | AUC 0,53-0,71 | **no**: lo dicono le misure, non le foto |

Il guadagno vero, come per T313, non è il prezzo (l'Artista costa poco l'ora) ma **ciò che oggi non si guarda**: ogni seme e ogni taglia di
una struttura procedurale (ADR-0160) potrebbe passare dal filtro a 0,00007 $ la foto, dove l'Artista ne guarda uno. Restano contro:
la funzione è sperimentale («Dreamer-ready», può cambiare senza preavviso), le soglie vanno tarate su difetti veri (questi sono fatti
apposta, grandi), e una chiamata nuova del gioco passerebbe da un varco sul server come quello proposto in ADR-0157.

### I limiti di queste misure (immagini)

- **I difetti sono fatti apposta e grandi** (un terzo del tetto, il 38 % dell'edificio, il 12 % delle celle): i difetti veri dei programmi
  del Concilio (una finestra fuori posto, un tetto un po' storto) non sono stati provati; le soglie migliori della tabella di
  `riepilogo-immagini.md` sono scelte sugli stessi dati.
- **Pochi giudizi negativi veri**: 9 programmi su 28 non passano il giudizio delle foto, e il giudizio guarda anche dentro (`sezioni.png`),
  che dalla foto non si vede; i giudizi sono di Claude Opus 5.5 e vanno riletti dall'autore.
- **Flash-Lite con le foto dell'oggetto → modello** solo su 14 casi (7 «nuovo», 7 no), `foto50` su Flash-Lite no (57 mila token, 0,0145 $ a
  chiamata); l'Artista del gioco su 10 casi; la stabilità di Flash-Lite solo sui 28 giudicati.
- Le domande della rubrica sono quelle di T313 riscritte per le foto: non sono state provate domande più atomiche sul gusto (il
  *composite scoring* di TypeSafe) né le domande *Box*.

## I limiti di queste misure

- **Le risposte giuste scritte per il banco sono giudizi** di chi ha scritto il banco: 206 casi nel gruppo 1, 92 nel gruppo 3; molti
  accettano più risposte. L'autore dovrebbe rileggerle, soprattutto le combinazioni, i mestieri e i bivi.
- **Campioni piccoli** dove sono piccoli: 5 squadre, 6 passi, 3 lotti; `oggi` su metà dei casi del gruppo 1.
- **Il colpevole è un sabotaggio**: un nodo aggiunto che cambia molte celle, scelto tra quattro tipi; i difetti veri dei programmi del
  Concilio non sono stati provati.
- **Domande in inglese e in italiano misurate in T323**: la variante mista (`base`) supera sia tutto-inglese che tutto-italiano.
- **Non provato**: un testo del viandante scritto per ingannare il giudice; il contesto lungo (Danger Zone); Jev dal Vercel AI Gateway
  (si è usata l'API diretta). Le immagini le ha provate T324, solo sul banco (sopra, con i loro limiti).

## Sicurezza

Una chiave nuova, `TYPESAFE_KEY`, nel `.env` del base: la legge solo `lab/scripts/jev-banco.ts`, non va in `src/`, `dist/`, nel registro
né in un commit (il test lo prova sul registro). Nessuna superficie nuova nel gioco: niente cambia in `src/` né in `server/`. T324 (le
immagini) non aggiunge superfici: le foto restano in `lab/out/` (ignorata da git), nel registro vanno i riferimenti e le risposte, mai i
pixel né la chiave (il test lo prova).
