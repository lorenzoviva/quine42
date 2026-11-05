# Cowboy — La Valle di Polvere Rossa

«Polvere, mandrie e città di frontiera.» Un reame di Step 37 (T184/T185), scritto a mano e verificato offline:
`npx vite-node lab/banco/coming-soon-cloud/verifica.ts -- cowboy`. Non è un universo generato: è il banco di ciò che un
universo di frontiera deve contenere e di ciò che il kernel di oggi regge. Si usa sovrapponendolo al seme (`realmUniverse`).

| cosa | dove | quanti |
|---|---|---:|
| tema, bibbia, stile, lessico (il filo comune + 3 usanze), canone | `prompts/theme.md`, `world/` | — |
| rune magiche e incantesimi | `modules/magic.runes/` (sostituisce quello del seme), `world/canone.md` | 10 + 2 formule |
| regioni dell'atlante | `world/atlas.json` | 8 |
| individui (15 persone e la gatta del saloon), legami in entrambi i versi | `world/people.json` | 16 |
| trame (4 con una missione) | `world/plots.json` | 6 |
| regole già giudicate | `world/rules.json` | 5 |
| moduli con Lua | `modules/cowboy.*` | 12 |
| merci, ricetta del caffè, bottino dell'emporio e della miniera | `modules/items.cowboy/` | 16 oggetti |
| modelli MarkovJunior | `models/*.xml` | 10 |
| programmi sonori (4 brani, 2 effetti) | `models/suono-cowboy-*.xml` | 6 |

## I moduli

Bancone del saloon (sarsaparilla e fagioli a pagamento o segnati sul conto, le voci del saloon), banchina della stazione
(il treno passa a ore fisse del tempo del mondo, il biglietto, la campana), ingresso della miniera (il setaccio dà una pepita
ogni tanto, tre travi prima di scendere), recinto della mandria (il cancello lascia uscire i manzi, il lazo li riporta
dentro), bacheca delle taglie (tre manifesti per bacheca, ognuno si riscuote una volta), telegrafo (gli ultimi tre messaggi
restano sul nastro), lattine sulla staccionata (tiro al bersaglio con le cartucce), abbeveratoio (l'acqua cala col tempo e
si riempie a secchiate), carro dell'elisir, cactus della piana (un fico alla volta, poi si aspetta), incudine del
maniscalco (una barra diventa un ferro in tre colpi), fuoco del bivacco (fa luce davvero con il componente `luce`, scalda il
caffè solo se acceso; usa il modello `falo` del seme).

Le armi ci sono senza violenza: si spara alle lattine, i duelli all'alba sono raccontati nelle trame e nelle regole e finiscono
con un caffè. Nessun modulo ferisce un individuo.

## Ciò che funziona e ciò che no

- Funziona con il kernel di oggi: lo stato per entità nei componenti, gli oggetti dati e tolti, la luce, il tempo del mondo
  (`time`) per il treno, l'abbeveratoio e il cactus, le rune e gli incantesimi a effetti chiusi.
- Gli ambienti sono quelli del seme, rinominati dall'atlante: la città è un `borgo`, la miniera un `dungeon`, il forte una
  `caserma`, il canyon `montagne`, la piana un `deserto`. Le case del borgo sono di pietra, non di legno con la facciata alta,
  e non c'è un terreno «binario»: un Cartografo vero li scriverebbe alla Genesi.
- Il treno non arriva davvero: è un fatto raccontato dalla banchina. Il kernel non tiene un corpo su un altro (T183,
  `mech.barca`), quindi niente vagoni né cavalli da cavalcare; la mandria è un numero nel recinto, non bestie che si muovono.
- La carabina non è un'arma del kernel: il tiro è un `on_act` con un seme, non un proiettile (T183, primitiva «proiettili»).
- I due effetti sonori (`campana-stazione`, `sparo`) non hanno un evento che li suoni: il direttore del suono ascolta solo gli
  eventi del kernel (ADR-0126) e Lua non può chiedere un suono.
- I brani del reame stanno nell'indice dopo quelli del seme: per gli stessi ambienti e momenti il direttore sceglie il primo.
