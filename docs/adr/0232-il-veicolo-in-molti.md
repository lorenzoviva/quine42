# ADR-0232 — Il veicolo in molti

Data: 2026-11-20 · Stato: accettato (task T442 del backlog, P4 di [`docs/design/acqua-spazio.md`](../design/acqua-spazio.md) § 1.3) ·
Riferimenti: ADR-0227 (il veicolo, da soli), ADR-0228 (lo Scultore delle navi: l'area del timone), ADR-0058 e ADR-0059 (il kernel sul server, il
client sottile), ADR-0139 (i tasti di ogni viandante), ADR-0073 (la spinta fra viandanti, `wanderer:pushed`), ADR-0107 (il ritmo dei messaggi),
ADR-0109 (ciò che esce è un elenco), ADR-0136 (la versione del kernel)

## Contesto

Con T439 il veicolo portava e faceva governare solo i viandanti del kernel che lo muove: in una partita di molti chi gioca da un suo client
non era portato (il server lo rimetteva dove il client diceva di essere, contro il ponte che andava), non prendeva il timone, e lo specchio non
aveva né il ponte (il manifest arrivava senza `vehicle`) né il verso dopo la prima vista; il veicolo vi si muoveva a scatti, inseguito come ogni
cosa (`FOLLOW`), e chi vi stava sopra avrebbe tremato. Lo studio (§ 1.3, «In multigiocatore») chiedeva quattro cose: la parte `vehicle`
estrapolata, il passo relativo al ponte, gli altri a bordo relativi, il timone in molti; e le voci di sicurezza del passo relativo, del timone,
del rapimento e di ciò che esce (§ 5).

## Decisione

1. **Il server è l'autorità del veicolo**, come di tutto: lo muove `vehicleTick` e **porta chi sta sul ponte, anche chi gioca da un suo
   client** (`wanderersAboard` non li salta più). Chi gioca da un suo client si sposta sul suo tappeto (`shiftWanderer`: il server non lo
   riporta al centro del cerchio), chi il kernel muove sul suo cerchio come prima.
2. **Ai client va la posa del veicolo a elenco** (regola 8f): `EntityView.vehicle` = `{ heading, speed, turn, anchored, helm? }`
   (`vehicleSeen`), a ogni suo spostamento; mai ciò che gli si chiede (`thrust`, `steer`, `power`) né `bumped`. La sua forma esce senza `yaw`:
   il verso è quello del veicolo. Il manifest esce con `vehicle` (`medium`, `speed`, `accel`, `turn`, `draught`, a elenco anche lui), così lo
   specchio ha il ponte, il passo sul ponte e il menu. Una vista che dice solo dov'è una cosa (`x`, `y`, `on`, `lx`, `ly`, `vehicle`) è uno
   spostamento (`isMove`): ciò che la cosa è resta quello di prima.
3. **Lo specchio porta avanti il veicolo, non lo insegue** (`sail` nel client sottile): dall'ultima parola del server col suo abbrivio e il suo
   giro (`coast`, sull'arco della prua), al più `COAST` (mezzo secondo) oltre; lo scarto da dove il server lo ha si chiude a poco a poco
   (`SETTLE`), tutto insieme oltre `JUMP` o `JUMP_TURN`. Il kernel specchio sposta il veicolo e porta il suo viandante sul ponte
   (`carryMirrored`, solo in uno specchio); al timone il viandante guarda dove guarda la prua. Il client del timoniere **non predice** il veicolo:
   una nave è lenta e un decimo di secondo al timone si accetta.
4. **Il passo sul ponte**: chi sta sul ponte manda il punto del ponte dove è, nel riferimento del veicolo (`step { x, y, on }`); il server lo
   mette dove ha il veicolo ora (`offDeck`) e ne fa un passo come ogni altro (il credito, `FAR`, la collisione). Così il ponte porta, il passo è
   solo ciò che si è camminato sul ponte e il credito non conta il viaggio. `on` nomina un veicolo in vista (`deckNear`: entro `near`), un punto
   entro `near` dal suo mezzo; altrimenti il passo non si fa e il client è corretto. La correzione dice anche il punto del ponte
   (`correction.on/lx/ly`), che il client mette dove ha il ponte lui.
5. **Gli altri a bordo arrivano dove stanno sul ponte** (`OtherView.on`, `lx`, `ly`; e così le cose che vi giacciono, `EntityView.on`): lo
   specchio li mette in quel punto del ponte che porta avanti lui, scivolando nel riferimento del ponte (`onDecks`), così non tremano; il
   renderer muove le loro gambe solo se camminano sul ponte.
6. **Il timone in molti**: il menu del veicolo è lo stesso nello specchio (dal veicolo che il server manda) e la scelta va al server come ogni
   azione (`helm`, `unhelm`, `anchor`, `weigh`); il veicolo su cui si sta è a portata da tutto il suo ponte (un galeone è lungo 16). I tasti
   viaggiano già (`keys`, ADR-0139); al timone lo specchio non cammina (`HELM_STILLS` saltato) e la camera arretra come da soli. **Un timone
   tenuto da un altro** lo prende solo il master (che libera ogni cosa) o chiunque se la partita dice `pvp` (un ammutinamento), dal menu e mai da
   Lua (`seizesHelm`); chi lo perde lo sente («Qualcuno ti prende il timone.»). Si libera all'uscita, alla morte, scendendo: come da soli.
7. **Tuffarsi** («Tuffati», sui carri «Scendi»: `over`, `leaveDeck`): dal menu, a chiunque stia sul ponte, chiunque governi; il posto più
   vicino fuori dallo scafo dove il corpo sta, entro `LEAVE_REACH` (3) caselle, e il timone, se suo, si lascia. In molti un client non salta:
   così **nessuno è portato dove non vuole** (il rapimento dello studio).
8. **La spinta dello scafo** (`pushAside`, il resto di ADR-0227): chi non sta sul ponte e si trova sopra lo scafo dove è arrivato (`overHull`:
   le colonne della forma sopra la linea, non la collisione di un corpo, per cui dall'acqua un ponte basso è un gradino) va da parte per dove è
   andato quel punto dello scafo, quanto basta, al più `PUSH_REACH` (2) caselle; mai schiacciato: senza posto resta, e chi il mondo ha
   circondato può sempre uscire. Lo sente («Lo scafo ti spinge da parte.»).
9. **Ciò che il mondo fa a un viandante fuori da ciò che fa lui arriva al suo client**: le parole (`tell` → `wanderer:told` → l'avviso `world`,
   quando non sono già nella risposta di un suo messaggio: l'urto al timoniere, il timone perso, la spinta) e il posto (`wanderer:pushed` → una
   correzione subito, anche a chi sta fermo e non manda passi: la spinta, il tuffo, e la spinta fra viandanti di ADR-0073).
10. **Sul ponte si cammina** (un difetto di T439): sopra l'acqua `world.speed_at` dava il passo del nuoto anche sul ponte, e il credito del
    server pure; ora sul ponte (`onAnyDeck`, `aboard`) si cammina al passo di chi cammina, da soli e in molti.

## Conseguenze

- Kernel **0.10.8** (la 0.10.7 è di T457): aggiuntivo; il filo cresce di campi facoltativi (`step.on`, `correction.on/lx/ly`,
  `EntityView.vehicle`, `on`, `lx`, `ly`, `OtherView.on`, `lx`, `ly`, l'avviso `world`), il manifest esce con `vehicle`. Nessun universo se ne
  accorge.
- Sicurezza: **V-046** (il passo sul ponte, il timone, il tuffo, ciò che esce; `tests/sicurezza/veicolo-molti.test.ts`); V-045 cambia una riga:
  il timone va anche a chi gioca da un suo client, sul ponte.
- Restano: affondare, il danno e la stiva salvata (T444); le persone del mondo a bordo; la cosa che giace sul ponte gira nello specchio col verso
  del server (un attimo dopo il ponte); un client che dice di non stare sul ponte quando il server lo ha sopra cammina contro il ponte finché
  la correzione non arriva.
- I test: `tests/veicolo-molti.test.ts` (due client sulla stessa barca, il timone dal client, il passo sul ponte, il tuffo, la spinta, il timone
  conteso), `tests/fleet.ts` (la flotta dei test, anche per la suite di sicurezza).
