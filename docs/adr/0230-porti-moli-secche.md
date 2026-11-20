# ADR-0230 — Porti, moli e secche

Data: 2026-11-20 · Stato: accettato (task T443 del backlog, P6 di [`docs/design/acqua-spazio.md`](../design/acqua-spazio.md) § 1.5)
· Riferimenti: ADR-0211 (i timbri a 16: gli ingressi danno su caselle raggiungibili), ADR-0224 (la fisica rimodellabile, `depth`), ADR-0225 (il
layout che non scava l'acqua), ADR-0227 (il veicolo, `carries`), ADR-0228 (lo Scultore delle navi: il ponte 9 voxel sopra l'acqua), ADR-0229
(l'arcipelago), ADR-0134 (gli ambienti senza epoca), ADR-0136 (la versione del kernel)

## Contesto

Con l'arcipelago (T441) e le navi (T439, T440) mancava dove una nave si affianca: le rive sono spiagge, il ponte del generico sta 9 voxel sopra
l'acqua e da chi nuota non si sale. Lo studio (§ 1.5) chiedeva il porto come ambiente e timbro, con il **molo**, una casella che si cammina sopra
l'acqua fino all'acqua profonda e che il kernel controlla che tocchi l'acqua (se no lo allunga di una casella), come controlla gli ingressi dei
timbri (ADR-0211); la **secca**, roccia sotto il pelo dell'acqua dove un veicolo si ferma e chi nuota passa; il prompt del Cartografo per gli
arcipelaghi (porto, faro, cantiere, relitti, secche).

## Decisione

1. **La secca è una profondità dell'acqua**: `depth` vale `shallow`, `deep` o `reef` (`DEPTHS` in `src/kernel/nature.ts`). Una casella di secca
   si nuota come ogni acqua (`cross: swim`, il passo e la fatica dell'acqua) e **nessuno scafo vi galleggia**, qualunque pescaggio
   (`carries`): la nave che la tocca si ferma e il timoniere lo sente («Lo scafo tocca la secca e si ferma.», `vehicle:bumped` con `reef`).
   Chi è troppo carico la attraversa (non è acqua profonda). Il Fisico la può dire di un liquido alla Genesi (lo schema e il prompt di
   `genesis.physics`), il validatore la accetta solo dove si nuota.
2. **Il seme ha un molo e una secca**: due terreni nuovi in `world.terrain` (`i` «molo», id `pier`, un `floor` che si cammina e non ha tetto;
   `y` «secca», id `reef`). Arrivano agli universi come ogni terreno nuovo del seme, senza sostituire un codice che un universo ha già; nessun
   programma di prima li scrive.
3. **Il timbro `harbour`** (`src/kernel/stamps.ts`), che non è un disegno ma una regola: da una riva che si cammina per due caselle, un molo
   dritto di caselle `pier` sopra l'acqua che si nuota, finché due sue caselle stanno nell'acqua profonda (`PIER_INTO_DEEP`), al più
   `MAX_PIER` (8); dove l'acqua è bassa fino in fondo (un lago) un molo corto di `SHALLOW_PIER` (3), che non la attraversa. Prima le rive da cui
   l'acqua profonda si raggiunge, il molo più corto fra loro, poi il seme. **La garanzia**: la testa del molo tocca l'acqua profonda dove l'ha
   raggiunta, l'acqua comunque (`pierTouches`); se non la tocca il kernel allunga il molo di una casella, e una riva dove nemmeno così la
   tocca non si prende. Mai sul bordo del luogo né su ciò che un altro timbro ha preso; il molo, la sua radice e la casella dietro restano
   presi. Al largo della testa, di fianco alla via d'ingresso (almeno tre caselle dalla sua linea, mai accanto al molo), due o tre caselle di
   secca dove il mondo ha un terreno di secca. In un luogo senza riva non disegna niente. Il layout gli dice come si attraversa ogni codice
   (`StampCut.ground`, `stampGround`); i ruoli nuovi `pier` (un terreno che il mondo chiama così, se si cammina, altrimenti il
   ponte) e `reef` (un liquido che si nuota con `depth: reef`, altrimenti nessuno).
4. **L'ambiente «Porto»** del seme (`harbour`: il molo, due case, le strade dalle porte al molo) è senza epoca (`TIMELESS_LAYOUTS`): arriva
   anche agli universi di un'altra ambientazione. Non è una regione dell'atlante: un porto sta su una riva, dove il mare c'è.
5. **Il Cartografo**: alla Genesi di un arcipelago gli si dicono gli ambienti delle rive (il porto col suo timbro, il faro su un capo, il
   cantiere, la spiaggia dei relitti, la costa di secche: `ARCHIPELAGO_ENVIRONMENTS`); in ogni mondo il prompt delle terre chiede, per le isole,
   le tavole dei moli e una secca; nel piano di un luogo su un'isola, che un porto va solo dove il luogo ha il mare (`SHORE_LINE`). I modelli
   locali scelgono il porto solo sulla riva di un'isola, a parte: i mondi offline di prima restano quelli che erano.
6. **Il ponte di una nave si raggiunge dall'imbarco** (`cellarGround` in `src/kernel/forms.ts`): i piani di una forma sotto la sua linea di
   galleggiamento erano raggiunti solo a gradini dall'acqua, e il ponte del generico `vessel`, 9 voxel sopra, era tutto «dove non si sta»
   (nessuno ci camminava, nemmeno saltandoci); ora sono raggiunti anche dai piani delle colonne dell'area `boarding`, come li misura
   `measureVessel` per i controlli dello Scultore. Una forma senza quell'area non cambia.

## Alternative scartate

- **Il molo come disegno fisso** (un rettangolo di tavole che si prova in punti a caso, come gli altri timbri): una riva è una curva, un disegno
  fisso non la trova quasi mai e non sa dove comincia l'acqua profonda.
- **La secca come terzo modo di attraversare** (`cross: reef`): è acqua che si nuota; ciò che cambia è solo cosa vi galleggia, che è la
  profondità.
- **Le secche disegnate dal kernel nell'arcipelago** (nella bozza delle isole): cambierebbe le caselle dei luoghi già pianificati di un
  arcipelago; le mette il porto, e il Cartografo dove vuole.
- **Navi messe dal kernel ai moli**: il veicolo non è di un luogo e il Cartografo non lo mette nei luoghi (ADR-0227); un molo è dove una nave si
  affianca, non dove nasce.

## Conseguenze

- Kernel **0.10.6**: aggiuntivo (una profondità, due terreni e un ambiente del seme, un timbro, due ruoli, un parametro della Genesi); un
  universo di oggi non se ne accorge: i suoi piani non cambiano, i suoi ambienti non usano il timbro.
- Il molo sta, per il rilievo, sopra l'acqua di uno o due livelli (la terra scende verso l'acqua al più di due livelli a casella, ADR-0048):
  misurato nel browser, il molo a 0,75 e il ponte della barca a vela del seme a 1,06 (l'acqua a 0,5). Più di un gradino (0,2): dalla testa
  del molo si sale a bordo **con un salto**, non camminando (fuori dalla forma il kernel conta l'altezza della linea di galleggiamento).
- Restano: salire a bordo camminando dal molo (l'altezza fuori dalla forma di un veicolo) e dall'acqua nuotando; la stiva salvata (T444); un
  traghetto di NPC; il faro come luce del mondo.
- Sicurezza: nessuna superficie nuova (un timbro e un terreno passano dal layout e dal validatore come gli altri; la secca restringe ciò che
  galleggia).
