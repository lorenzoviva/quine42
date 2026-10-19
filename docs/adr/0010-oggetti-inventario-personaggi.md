# ADR-0010 — Oggetti, inventario e personaggi simulati

Data: 2026-10-20 · Stato: accettato

## Contesto
"Tutto è rune" era una semplificazione: sul terreno devono poter stare anche oggetti inerti, strumenti
da raccogliere e personaggi. L'autore chiede un inventario più ricco e NPC che siano un LLM che
interpreta un personaggio.

## Decisione
- **Tipi di modulo**: `entity` (personaggi e oggetti nel mondo, inerti o interattivi) e `item`
  (strumenti che finiscono nell'inventario; a terra sono entità con componente `pickup`).
- **Inventario** (`src/kernel/inventory.ts`, funzioni pure su componenti): 24 slot, i primi 6 sono la
  hotbar (tasti 1–6); pile (`item.maxStack`), peso con capacità 20 (oltre, il passo rallenta), uno slot
  impugnato (F esegue `on_action(user, target, item)`), `on_use(user, item)` per consumare/usare,
  trascinamento per riordinare, posare nel mondo o **combinare**: Narratore e Fisico giudicano se due
  cose si combinano e, se il risultato non esiste, la Fucina lo crea. Le rune restano una "mano" a parte,
  ordinabile, da incidere con Q.
- **Personaggi**: manifest con `persona` (scheda scritta dal Narratore) e `unique`. Parlare apre una chat
  libera; il Narratore risponde nel personaggio con una frase e un'azione da un insieme chiuso (`segui`,
  `resta`, `vaga`, `dai`, `nessuna`), validata dal kernel ed eseguita dai sistemi Lua (`sys.follow`,
  `sys.wander`). Memoria (ultimi 16 turni), umore e modalità vivono nel componente `mind`.
- **Fisica**: `sys.physics` (Lua) gestisce i corpi spingibili (massa, attrito); i terreni hanno un
  moltiplicatore di velocità; gli oggetti solidi bloccano le caselle.
- **API Lua** estesa per gli oggetti: `world.spawn/nearest/has_tag/break_entity/say/speak/player_pos`,
  `inventory.add/remove/count/equipped`, `ecs.set`. Il validatore rifiuta chiamate a funzioni inesistenti.

## Conseguenze
- Le azioni dei personaggi non possono inventare oggetti: "dai" cede solo ciò che il personaggio porta.
- Lo stato del mondo (inventario, oggetti raccolti, memoria dei personaggi) non è ancora persistito tra
  sessioni: solo i file (e quindi i moduli) lo sono.
