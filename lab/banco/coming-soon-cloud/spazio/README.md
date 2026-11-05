# Spazio — Le Rotte di Vesta

«Rotte tra le stelle e stazioni alla deriva.» Un reame di Step 37 (T184/T185), scritto a mano e verificato offline:
`npx vite-node lab/banco/coming-soon-cloud/verifica.ts -- spazio`. Non è un universo generato: è il banco di ciò che un
universo dello spazio deve contenere e di ciò che il kernel di oggi regge. Si usa sovrapponendolo al seme (`realmUniverse`).

| cosa | dove | quanti |
|---|---|---:|
| tema, bibbia, stile, lessico (il filo comune + 3 usanze), canone | `prompts/theme.md`, `world/` | — |
| rune magiche e incantesimi | `modules/magic.runes/` (sostituisce quello del seme), `world/canone.md` | 10 + 2 formule |
| regioni dell'atlante | `world/atlas.json` | 8 |
| individui (15 persone e il gatto della stazione), legami in entrambi i versi | `world/people.json` | 16 |
| trame (3 con una missione) | `world/plots.json` | 6 |
| regole già giudicate | `world/rules.json` | 5 |
| moduli con Lua | `modules/spazio.*` | 12 |
| merci, ricetta delle razioni, bottino dei relitti e delle capsule | `modules/items.spazio/` | 12 oggetti |
| modelli MarkovJunior | `models/*.xml` | 10 |
| programmi sonori (4 brani, 2 effetti) | `models/suono-spazio-*.xml` | 6 |

## I moduli

Cavo di deriva (agganciati, il passo si fa lungo: uno stato del viandante con `velocita`), scanner stellare (cerca
un'entità col tag `relitto` entro una portata che si allarga con una cella), generatore di scudo deflettore (tre accensioni
per cella, luce viola vera), portello del relitto (non si apre senza aria dall'altra parte; aperto, la stiva è un
contenitore), serbatoio d'ossigeno (cinque bombole, una boccata non si conta), banco del mercante orbitale (il prezzo del
minerale cambia a ogni turno, dal tempo del mondo), antenna di trasmissione (ciò che si ascolta dipende da dove guarda il
piatto), vasca idroponica (cresce a ogni irrigazione), trivella da asteroide (si surriscalda), capsula di salvataggio,
boa di segnalazione (luce vera), telescopio (una carta stellare per telescopio).

## Ciò che funziona e ciò che no

Lo spazio è il caso difficile (T184): il reame tiene perché si svolge **dentro** le stazioni, sotto le cupole e sulla
roccia degli asteroidi, non nel vuoto.
- Funziona con il kernel di oggi: tutto ciò che sta in `on_act` e nei componenti, i contenitori creati da Lua, la luce,
  gli stati del viandante (la gravità zero è uno stato che allunga il passo), le rune e gli incantesimi a effetti chiusi.
- Gli ambienti sono quelli del seme, rinominati dall'atlante: la stazione è una `fortezza`, il mercato un `borgo_mattoni`,
  il relitto le `rovine`, le serre una `giungla`, l'asteroide un `deserto`, la cometa le `montagne`, le miniere un
  `dungeon`. Il terreno resta quello del seme: prato, bosco, mare e neve ci sono anche dentro una stazione, e il «vuoto»
  non è un terreno. Un Cartografo vero scriverebbe alla Genesi terreni di lamiera, grate e regolite; qui non si chiama
  nessun modello.
- Il cielo è quello del seme, con il giorno e la notte: niente cielo stellato, niente pianeta all'orizzonte. Il clima
  (pioggia, neve) non ha senso sotto una cupola e non si può spegnere per reame.
- L'acqua del seme scorre e si beve: in una stazione dovrebbe essere rara e contata, come l'ossigeno. L'ossigeno è un
  oggetto (la bombola), non un bisogno: il kernel ha quattro bisogni fissi (fame, sete, energia, salute) e un reame non
  ne aggiunge uno.
- Le navette non volano: come la scialuppa dei pirati, il kernel non tiene un corpo su un altro (T183). Sono raccontate.
- I due effetti sonori (`aggancio`, `spinta`) non hanno un evento che li suoni: Lua non può chiedere un suono (ADR-0126).
- La quarta parete è più stretta che altrove: le parole del mestiere (calcolatore di bordo, programma di volo, server,
  simulazione d'attracco) sono vietate da `META_RE`, e il reame dice schermo, rotta, trasmissione. Un Concilio vero ci
  inciamperebbe spesso: è il punto dove il tema può tradirsi nei contenuti generati.
