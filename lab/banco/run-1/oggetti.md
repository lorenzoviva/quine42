# Gli oggetti di «orichalcum»: a cosa servono (T489)

Generato da `npx vite-node lab/scripts/oggetti-uso.ts -- ../beta-run-1/universes/orichalcum --tag prima-della-run-1` sul kernel 0.10.25: un kernel sui modelli locali apre l'universo in memoria e legge gli usi che il kernel riconosce (`usesOf`, ADR-0251), senza chiamate e senza scrivere niente. Sono gli oggetti dei pacchetti che non sono del seme e quelli forgiati con un modulo loro.

## In breve

- Oggetti generati: **520**, di cui **382** entrati dopo il tag `prima-della-run-1` (la run).
- Con almeno un uso: **199** (38 %); **senza nessun uso: 321** (62 %), nella run 273 su 382 (71 %).
- Con un uso solo perché una scheda del mondo ha un posto per loro (l'equipaggiamento: «In mano», «Ai piedi»): 32; un uso vero, ma il più debole.
- Senza uso, la riparazione del kernel li marca da tenere (`decoration`): «riparazione: 321 oggetti da tenere (item.fischietto-di-canna, item.fischietto-di-canna-2, item.registro-dei-pesi-rilega, item.matita-grassa, item.pesi-campione-d-ottone, item.rotolo-di-cavo-d-acciaio…)».

| uso | oggetti |
|---|---:|
| effetto | 62 |
| si accende | 7 |
| borsa | 19 |
| posto addosso | 74 |
| azione | 2 |
| serve a un'azione del mondo | 25 |
| taglia | 0 |
| ricetta (entra) | 33 |
| ricetta (attrezzo) | 14 |
| mestiere | 0 |
| cantiere | 0 |
| missione | 0 |
| **nessuno** | **321** |

| ruolo | oggetti | senza uso |
|---|---:|---:|
| materia | 167 | 142 |
| altro | 106 | 98 |
| attrezzo | 94 | 66 |
| cibo | 63 | 1 |
| capo | 48 | 4 |
| contenitore | 18 | 0 |
| chiave | 14 | 7 |
| luce | 7 | 0 |
| magia | 3 | 3 |

| pacchetto | oggetti | senza uso |
|---|---:|---:|
| `item.chiave-inglese` | 1 | 0 |
| `item.lingotto-di-oricalco-anc` | 1 | 0 |
| `items.citati` | 379 | 288 |
| `items.pacco-1` | 16 | 1 |
| `items.pacco-2` | 16 | 2 |
| `items.pacco-3` | 16 | 4 |
| `items.pacco-4` | 16 | 7 |
| `items.pacco-5` | 16 | 10 |
| `items.pacco-6` | 16 | 4 |
| `items.vapore` | 41 | 5 |
| `lavoro.tessitore` | 1 | 0 |
| `magic.vapore` | 1 | 0 |

## Che cosa dice

- I pacchetti (`items.pacco-*`, la Genesi) hanno le ricette accanto: la maggior parte dei loro oggetti entra in una ricetta o si consuma. Gli oggetti di `items.citati` (`content.define`: ciò che qualcuno porta, nomina, trova a terra) nascono pochi per volta, senza ricette e senza azioni: lì stanno quasi tutti gli oggetti senza uso (288 su 379).
- La materia e gli attrezzi sono i più muti: una materia che nessuna ricetta usa, un attrezzo che non apre niente. Il cibo e i capi hanno quasi sempre un uso (l'effetto, il posto addosso).
- Un uso c'era e non si vedeva: 25 oggetti servono a un'azione di una cosa o di una persona del mondo («Dai un pane per del carbone» al caldaista), ma niente lo diceva dove li si tiene; la scheda «Crea» elencava tutte le ricette del mondo (53 qui), anche di cose mai viste.
- Nessun oggetto dei pacchetti ha un'azione propria (le 2 azioni sono dei moduli forgiati): le azioni le impara solo «Altro…». Una chiave non apre niente: il kernel non ha serrature, la chiave è un ruolo, non un uso, finché un'azione del mondo non la chiede.

## Dopo T489 (ADR-0251)

- Il Narratore dà a ogni oggetto un uso fra quelli che il kernel sa fare (`use`: consume, wear, light, bag, action, craft, decoration) con ciò che lo regge; il validatore rifiuta col motivo ciò che non ne ha e il Narratore lo riceve una volta; poi l'oggetto resta fuori, o resta da tenere se lo ha fatto il viandante o gli è stato dato.
- Gli oggetti di prima senza uso restano, marcati da tenere dal kernel senza chiamate (qui 321); un uso trovato dopo vince sul segno.
- L'inventario e «Esamina» dicono cosa ci si fa, con parole del mondo; la scheda «Crea» mostra solo le ricette che ciò che si porta apre, con ciò che manca; un oggetto preso che completa una ricetta fa pensare il viandante a cosa potrebbe fare.

## Ogni oggetto

### `item.chiave-inglese` (1)

| oggetto | ruolo | usi | da dove viene | run |
|---|---|---|---|---|
| Chiave inglese | chiave | azione: il suo modulo; serve a «Carica la molla» (Guardiano d'ottone); serve a «Batti tre volte con la chiave» (Caldaia a pressione) | — |  |

### `item.lingotto-di-oricalco-anc` (1)

| oggetto | ruolo | usi | da dove viene | run |
|---|---|---|---|---|
| Lingotto di oricalco ancora caldo | materia | azione: il suo modulo | — | sì |

### `items.citati` (379)

| oggetto | ruolo | usi | da dove viene | run |
|---|---|---|---|---|
| Fischietto di canna | altro | **niente** → da tenere | — |  |
| Fischietto di canna | altro | **niente** → da tenere | — |  |
| Registro dei pesi rilegato in tela rossa | altro | **niente** → da tenere | — |  |
| Matita grassa | attrezzo | **niente** → da tenere | — |  |
| Pesi campione d'ottone | attrezzo | **niente** → da tenere | — |  |
| Termos di caffè | cibo | effetto: drink hunger -2 thirst +15 energy +20 | — |  |
| Occhiali tondi di ricambio | capo | addosso: head; addosso: «In testa» di Equipaggiamento | — |  |
| Rotolo di cavo d'acciaio | attrezzo | **niente** → da tenere | — |  |
| Sacchetto di zavorra | materia | **niente** → da tenere | — |  |
| Guanto di cuoio unto | capo | addosso: «In mano» di Equipaggiamento | — |  |
| Banderuola di tela | attrezzo | **niente** → da tenere | — |  |
| Matassa di cotone | materia | **niente** → da tenere | — |  |
| Spoletta di legno | attrezzo | **niente** → da tenere | — |  |
| Bottone d'ottone | altro | **niente** → da tenere | — |  |
| Ritaglio di stoffa | materia | entra in Straccio unto | — |  |
| Occhiali da fuoco di vetro affumicato | capo | addosso: head; addosso: «In testa» di Equipaggiamento | — |  |
| Gavetta di latta col caffè | cibo | effetto: drink thirst +20 energy +15 | — |  |
| Fazzoletto rosso | capo | **niente** → da tenere | — |  |
| Trucioli di ferro | materia | **niente** → da tenere | — |  |
| Bulloni arrugginiti | materia | **niente** → da tenere | — |  |
| Cima catramata | attrezzo | **niente** → da tenere | — |  |
| Latta d'olio di macchina | attrezzo | **niente** → da tenere | — |  |
| Scialle di lana grigia | capo | addosso: back; addosso: «Addosso» di Equipaggiamento | — |  |
| Coltello da palombaro con il fodero di o | attrezzo | addosso: «In mano» di Equipaggiamento | — |  |
| Sagola di canapa avvolta a matassa | attrezzo | **niente** → da tenere | — |  |
| Gancio di recupero di ferro | attrezzo | **niente** → da tenere | — |  |
| Lanterna stagna con il vetro spesso | luce | si accende; addosso: «In mano» di Equipaggiamento | — |  |
| Guanti di cuoio ingrassati | capo | addosso: «In mano» di Equipaggiamento | — |  |
| Cima di canapa sfilacciata | materia | **niente** → da tenere | — |  |
| Cassa di rame ammaccata | contenitore | borsa da 6 | — |  |
| Rete da pesca annerita | attrezzo | **niente** → da tenere | — |  |
| Sacchetto di tela cerata con una runa cu | altro | **niente** → da tenere | — |  |
| Berretto di lana da marinaio | capo | addosso: head; addosso: «In testa» di Equipaggiamento | — |  |
| Maglione di lana grezza a collo alto | capo | addosso: torso; addosso: «Addosso» di Equipaggiamento | — |  |
| Rete da pesca strappata | materia | **niente** → da tenere | — |  |
| Gusci di cozze | materia | **niente** → da tenere | — |  |
| Galleggiante di sughero | attrezzo | **niente** → da tenere | — |  |
| Foglie di platano annerite | materia | **niente** → da tenere | — |  |
| Conchiglie grigie | altro | **niente** → da tenere | — |  |
| Pipa di schiuma spenta | altro | serve a «Fuma la pipa guardando i bastimenti» (Panchina di ghisa rivolta al mare) | — |  |
| Coda di topo rosicchiata | altro | **niente** → da tenere | — |  |
| Crosta di pagnotta al burro | cibo | effetto: eat hunger -15 energy +3 | — |  |
| Scorie nere | materia | **niente** → da tenere | — |  |
| Frammenti di oricalco | materia | **niente** → da tenere | — |  |
| Frammenti di oricalco | materia | **niente** → da tenere | — |  |
| Catene arrugginite | attrezzo | **niente** → da tenere | — |  |
| Scorie di metallo | materia | **niente** → da tenere | — |  |
| Fango di fonderia | altro | **niente** → da tenere | — |  |
| Goccia di oricalco | materia | **niente** → da tenere | — |  |
| Chiave inglese di Raniero | chiave | addosso: «In mano» di Equipaggiamento; attrezzo per Oliatore | — |  |
| Grembiule di cuoio rinforzato | capo | addosso: torso; addosso: «Addosso» di Equipaggiamento | — |  |
| Barattolo di grasso per valvole | attrezzo | **niente** → da tenere | — |  |
| Runa Fumaria | magia | **niente** → da tenere | — |  |
| Tazza di caffè forte | cibo | effetto: drink thirst -2 energy +5 | — |  |
| Corda di canapa | attrezzo | entra in Corde di canapa annodate | — |  |
| Segatura di legno | materia | **niente** → da tenere | — |  |
| Fuliggine | materia | serve a «Attizza la caldaia di poppa» (Chiatta a vapore della darsena) | — |  |
| Acqua termale di Solfara | cibo | effetto: drink thirst +2 | — |  |
| Frammento di binario arrugginito | materia | **niente** → da tenere | — |  |
| Corde di canapa annodate | attrezzo | **niente** → da tenere | ricetta: Corda di canapa + Bobina di filo di canapa (con Coltello da cordaio) |  |
| Pezzi di metallo arrugginito | altro | **niente** → da tenere | — |  |
| Cuffie da aviatore in pelle | capo | addosso: head; addosso: «In testa» di Equipaggiamento | — |  |
| Fango e cenere | altro | **niente** → da tenere | — | sì |
| Gocce di oricalco | materia | **niente** → da tenere | — | sì |
| Stivali da Caricatore | capo | addosso: «Ai piedi» di Equipaggiamento | — | sì |
| Lingotto di Oricalco | materia | **niente** → da tenere | — | sì |
| Grembiule di Cuoio | capo | addosso: torso; addosso: «Addosso» di Equipaggiamento | — | sì |
| Acqua termale di Solfara | cibo | effetto: drink thirst +20 | — | sì |
| Frammento di binario arrugginito | altro | **niente** → da tenere | — | sì |
| Cenere di sigaro | altro | **niente** → da tenere | — | sì |
| Piuma di gabbiano | altro | **niente** → da tenere | — | sì |
| Barattolo di vetro | contenitore | borsa da 3 | — | sì |
| Piume di corvo | altro | **niente** → da tenere | — | sì |
| Cenere fresca | materia | **niente** → da tenere | — | sì |
| Fango essiccato | materia | **niente** → da tenere | — | sì |
| Cenere di caldaia | materia | serve a «Attizza la caldaia di poppa» (Chiatta a vapore della darsena) | — | sì |
| Stivali chiodati | capo | addosso: «Ai piedi» di Equipaggiamento | — | sì |
| Lingotto d'oricalco | materia | **niente** → da tenere | — | sì |
| Registro di carico | attrezzo | **niente** → da tenere | — | sì |
| Grembiule di cuoio | capo | addosso: torso; addosso: «Addosso» di Equipaggiamento | — | sì |
| Pozzanghera di acqua termale | cibo | effetto: drink thirst +15 | — | sì |
| Spezzone di binario arrugginito | attrezzo | addosso: «In mano» di Equipaggiamento | — | sì |
| Fiaschetta di acqua termale | cibo | effetto: drink thirst +20 | — | sì |
| Frammento di binario arrugginito | altro | **niente** → da tenere | — | sì |
| Pezzi di scarto di rame | materia | **niente** → da tenere | — | sì |
| Catene di ferro arrugginite | attrezzo | **niente** → da tenere | — | sì |
| Cime di canapa marce | altro | **niente** → da tenere | — | sì |
| Frammenti di vetro di bottiglia | altro | **niente** → da tenere | — | sì |
| Piume di gabbiano bagnate | altro | **niente** → da tenere | — | sì |
| Uovo sodo | cibo | effetto: eat hunger +15 | — | sì |
| Frammento di scisto | materia | **niente** → da tenere | — | sì |
| Guanti da lavoro in cuoio | capo | addosso: «In mano» di Equipaggiamento | — | sì |
| Chiave inglese di bronzo | chiave | addosso: «In mano» di Equipaggiamento | — | sì |
| Straccio unto | altro | **niente** → da tenere | — | sì |
| Bobina di rame | materia | **niente** → da tenere | — | sì |
| Frammenti di scisto | materia | **niente** → da tenere | — | sì |
| Cavo di canapa logoro | attrezzo | **niente** → da tenere | — | sì |
| Trucioli di ottone | materia | **niente** → da tenere | — | sì |
| Boccetta d'olio di macchina | altro | **niente** → da tenere | — | sì |
| Pezzi di lamiera arrugginita | materia | **niente** → da tenere | — | sì |
| Pezzi di antracite | materia | serve a «Attizza la caldaia di poppa» (Chiatta a vapore della darsena) | — | sì |
| Chiave inglese arrugginita | chiave | addosso: «In mano» di Equipaggiamento | — | sì |
| Giornale di bordo sgualcito | altro | **niente** → da tenere | — | sì |
| Corde di canapa sfilacciate | attrezzo | **niente** → da tenere | — | sì |
| Vecchio scafandro di gomma | capo | addosso: torso; addosso: «Addosso» di Equipaggiamento | — | sì |
| Scorie di roccia rossa | materia | **niente** → da tenere | — | sì |
| Attrezzi da scavo abbandonati | attrezzo | addosso: «In mano» di Equipaggiamento | — | sì |
| Uovo sodo di miniera | cibo | effetto: eat hunger +10 | — | sì |
| Cristallo di zolfo | materia | **niente** → da tenere | — | sì |
| Uovo sodo di miniera | cibo | effetto: eat hunger +10 health +5 | — | sì |
| Tubo di rame ossidato | altro | **niente** → da tenere | — | sì |
| Impronta di stivale pesante | altro | **niente** → da tenere | — | sì |
| Fiasca di acqua termale | cibo | effetto: drink thirst +20 | — | sì |
| Scarti di rame | materia | **niente** → da tenere | — | sì |
| Sabbia nera | altro | **niente** → da tenere | — | sì |
| Ciuffo di alghe nere | altro | **niente** → da tenere | — | sì |
| Scaglie di scisto rossastro | materia | **niente** → da tenere | — | sì |
| Acqua termale di Solfara | cibo | effetto: drink thirst +20 | — | sì |
| Frammento di binario ossidato | altro | **niente** → da tenere | — | sì |
| Barattolo di catrame | materia | **niente** → da tenere | — | sì |
| Cima incatramata | attrezzo | **niente** → da tenere | — | sì |
| Sasso di scisto tiepido | materia | **niente** → da tenere | — | sì |
| Frammento di minerale rosso | materia | **niente** → da tenere | — | sì |
| Fiala di acqua sulfurea | cibo | effetto: drink thirst +10 | — | sì |
| Boccetta di olio minerale | altro | **niente** → da tenere | — | sì |
| Sasso scuro sporco di vapore | altro | **niente** → da tenere | — | sì |
| Tappo di caldaia arrugginito | altro | **niente** → da tenere | — | sì |
| Vecchi guanti di cuoio | capo | addosso: «In mano» di Equipaggiamento | — | sì |
| Ciottoli di scisto lucido | altro | **niente** → da tenere | — | sì |
| Fanghiglia calda | materia | **niente** → da tenere | — | sì |
| Scaglie di oricalco grezzo | materia | **niente** → da tenere | — | sì |
| Cappello di feltro unto | capo | addosso: head; addosso: «In testa» di Equipaggiamento | — | sì |
| Frammenti di minerale rosso | materia | **niente** → da tenere | — | sì |
| Sasso di Solfara | altro | **niente** → da tenere | — | sì |
| Acqua termale di Solfara | cibo | effetto: drink thirst +20 | — | sì |
| Frammento di binario arrugginito | altro | **niente** → da tenere | — | sì |
| Runa Caligo | magia | **niente** → da tenere | — | sì |
| Fiala di condensa salmastra | altro | **niente** → da tenere | — | sì |
| Barattolo di lubrificante nero | altro | **niente** → da tenere | — | sì |
| Bullone da scafo | altro | **niente** → da tenere | — | sì |
| Straccio sporco d'olio | altro | **niente** → da tenere | — | sì |
| Coda di pesce essiccata | cibo | effetto: eat hunger +5 | — | sì |
| Scaglie di minerale rosso | materia | **niente** → da tenere | — | sì |
| Lubrificante per ingranaggi | altro | **niente** → da tenere | — | sì |
| Pezzo di corda catramata | altro | **niente** → da tenere | — | sì |
| Scorie di fusione | materia | **niente** → da tenere | — | sì |
| Gusci d'uovo | altro | **niente** → da tenere | — | sì |
| Tubi di ottone | attrezzo | **niente** → da tenere | — | sì |
| Fango termale | cibo | effetto: apply health +5 | — | sì |
| Chiave della Fonderia Vecchia | chiave | **niente** → da tenere | — | sì |
| Stadera da Pesa | attrezzo | **niente** → da tenere | — | sì |
| Mestolo da colata | attrezzo | **niente** → da tenere | — | sì |
| Catrame colato | materia | **niente** → da tenere | — | sì |
| Vecchie cime incatramate | attrezzo | **niente** → da tenere | — | sì |
| Coltello da medico con manico d'osso | attrezzo | addosso: «In mano» di Equipaggiamento | — | sì |
| Berretto di lana scuro | capo | addosso: head; addosso: «In testa» di Equipaggiamento | — | sì |
| Scorie di oricalco fredde | materia | **niente** → da tenere | — | sì |
| Ossa di bestia da soma | altro | **niente** → da tenere | — | sì |
| Frammento di chiodo rivettato | altro | **niente** → da tenere | — | sì |
| Scarponi ferrati da minatore | capo | addosso: «Ai piedi» di Equipaggiamento | — | sì |
| Sasso di condensa | materia | **niente** → da tenere | — | sì |
| Tappo di caldaia arrugginito | altro | **niente** → da tenere | — | sì |
| Berretto di lana scura | capo | addosso: head; addosso: «In testa» di Equipaggiamento | — | sì |
| Frammenti di chiodi rivettati | altro | **niente** → da tenere | — | sì |
| Coltello da palombaro con fodero di cuoi | attrezzo | addosso: «In mano» di Equipaggiamento | — | sì |
| Pozzanghera d'acqua bollente | altro | **niente** → da tenere | — | sì |
| Binario di ferro ossidato | attrezzo | **niente** → da tenere | — | sì |
| Scafandro di tela gommata | capo | addosso: torso; addosso: «Addosso» di Equipaggiamento | — | sì |
| Cime di canapa umide | attrezzo | **niente** → da tenere | — | sì |
| Borraccia di acqua di Solfara | cibo | effetto: drink thirst +30 | — | sì |
| Fiala di condensa salmastra | cibo | effetto: drink thirst +10 | — | sì |
| Barattolo di lubrificante nero | altro | **niente** → da tenere | — | sì |
| Zolla di fango di fonderia | materia | **niente** → da tenere | — | sì |
| Cenere di carbone | materia | **niente** → da tenere | — | sì |
| Frammento di lamiera rivettata | materia | **niente** → da tenere | — | sì |
| Bullone di ottone ossidato | materia | **niente** → da tenere | — | sì |
| Stoppa di canapa incatramata | materia | **niente** → da tenere | — | sì |
| Frammenti di vetro di scarto | materia | **niente** → da tenere | — | sì |
| Stivali di cuoio inzuppati | capo | addosso: «Ai piedi» di Equipaggiamento | — | sì |
| Frammenti di ottone fuso | materia | **niente** → da tenere | — | sì |
| Frammenti di chiglia di quercia | materia | **niente** → da tenere | — | sì |
| Bulloni di rame ossidato | materia | **niente** → da tenere | — | sì |
| Bottiglie di vetro verde | contenitore | borsa da 2 | — | sì |
| Olio di macchina recuperato | materia | **niente** → da tenere | — | sì |
| Frammenti di scafandro | materia | **niente** → da tenere | — | sì |
| Corda incatramata | attrezzo | **niente** → da tenere | — | sì |
| Scarti di lamiera rivettata | materia | **niente** → da tenere | — | sì |
| Cima di canapa incatramata | attrezzo | **niente** → da tenere | — | sì |
| Olio di macchina esausto | altro | **niente** → da tenere | — | sì |
| Bulloni di ottone corrosi | materia | **niente** → da tenere | — | sì |
| Frammenti di lamiera rivettata | materia | **niente** → da tenere | — | sì |
| Pozzanghera oleosa | altro | **niente** → da tenere | — | sì |
| Scafandro di cuoio | capo | addosso: torso; addosso: «Addosso» di Equipaggiamento | — | sì |
| Catena di ferro arrugginita | attrezzo | **niente** → da tenere | — | sì |
| Cassa di campioni di Solfara | contenitore | borsa da 6 | — | sì |
| Frammento di minerale rosso | materia | **niente** → da tenere | — | sì |
| Scaglie di ghiaccio nero | materia | **niente** → da tenere | — | sì |
| Cime di canapa ghiacciate | attrezzo | **niente** → da tenere | — | sì |
| Uovo sodo di miniera | cibo | effetto: eat hunger +15 | — | sì |
| Chiave inglese pesante | chiave | **niente** → da tenere | — | sì |
| Giornale di bordo della ferrovia | altro | **niente** → da tenere | — | sì |
| Chiave inglese di bronzo | chiave | addosso: «In mano» di Equipaggiamento | — | sì |
| Stracci unti d'olio | altro | **niente** → da tenere | — | sì |
| Bobine di rame | materia | **niente** → da tenere | — | sì |
| Navetta di bosso intagliata | attrezzo | **niente** → da tenere | — | sì |
| Stoppino di cotone sporco d'olio | altro | **niente** → da tenere | — | sì |
| Registro dei transiti | attrezzo | **niente** → da tenere | — | sì |
| Sigillo in ottone della Compagnia | attrezzo | **niente** → da tenere | — | sì |
| Calamaio di fuliggine | materia | **niente** → da tenere | — | sì |
| Sacco di iuta aperto | contenitore | borsa da 8 | — | sì |
| Forcone di ferro | attrezzo | addosso: «In mano» di Equipaggiamento | — | sì |
| Stivali di gomma coperti di fango | capo | addosso: «Ai piedi» di Equipaggiamento | — | sì |
| Spighe di grano sparse | cibo | effetto: eat hunger +1 | — | sì |
| Stoppie di grano annerite | materia | **niente** → da tenere | — | sì |
| Olio lubrificante rappreso | materia | **niente** → da tenere | — | sì |
| Registro della trebbiatura | attrezzo | **niente** → da tenere | — | sì |
| Penna a serbatoio in ottone | attrezzo | **niente** → da tenere | — | sì |
| Sigillo di ceralacca della Gilda | attrezzo | **niente** → da tenere | — | sì |
| Sacco di grano | cibo | **niente** → da tenere | — | sì |
| Cima di canapa attorcigliata | attrezzo | **niente** → da tenere | — | sì |
| Grasso per ingranaggi | materia | **niente** → da tenere | — | sì |
| Stoppie di grano schiacciate | materia | **niente** → da tenere | — | sì |
| Manovella di ferro abbandonata | attrezzo | **niente** → da tenere | — | sì |
| Cinghia di trasmissione di cuoio consuma | materia | **niente** → da tenere | — | sì |
| Spiga di oricalco | altro | **niente** → da tenere | — | sì |
| Ingranaggio della trebbiatrice | attrezzo | **niente** → da tenere | — | sì |
| Paglia secca | materia | **niente** → da tenere | — | sì |
| Sacco di spighe d'orzo | materia | **niente** → da tenere | — | sì |
| Chiave del granaio | chiave | **niente** → da tenere | — | sì |
| Stoppie bruciacchiate | materia | **niente** → da tenere | — | sì |
| Chiave della trebbiatrice | chiave | addosso: «In mano» di Equipaggiamento | — | sì |
| Acqua stagnante nel solco | altro | **niente** → da tenere | — | sì |
| Ghiaia di scarto | materia | **niente** → da tenere | — | sì |
| Stoppie di grano bruciate | materia | **niente** → da tenere | — | sì |
| Stracci sporchi d'olio | altro | **niente** → da tenere | — | sì |
| Schegge di lamiera | materia | **niente** → da tenere | — | sì |
| Olio denso per macchine | materia | **niente** → da tenere | — | sì |
| Sacco di chicchi di grano | contenitore | borsa da 6 | — | sì |
| Attrezzo per la mietitura | attrezzo | addosso: «In mano» di Equipaggiamento | — | sì |
| Scarti di lamiera ondulata | materia | **niente** → da tenere | — | sì |
| Bottiglia di vetro scuro | contenitore | borsa da 2 | — | sì |
| Sacco di iuta | contenitore | borsa da 8 | — | sì |
| Berretto di lana pesante | capo | addosso: head; addosso: «In testa» di Equipaggiamento | — | sì |
| Barattolo di olio lubrificante | materia | **niente** → da tenere | — | sì |
| Cavi d'acciaio arrugginiti | materia | **niente** → da tenere | — | sì |
| Manciata di chicchi d'orzo | cibo | effetto: eat hunger +5 | — | sì |
| Bulloni di ferro fuori misura | materia | **niente** → da tenere | — | sì |
| Cime di canapa consumate | attrezzo | **niente** → da tenere | — | sì |
| Frammenti di vetro scuro | altro | **niente** → da tenere | — | sì |
| Cima di canapa incatramata | attrezzo | **niente** → da tenere | — | sì |
| Frammento di mattone di fornace | materia | **niente** → da tenere | — | sì |
| Foglietto di appunti | altro | **niente** → da tenere | — | sì |
| Schema delle valvole di Solfara | altro | **niente** → da tenere | — | sì |
| Lista della spesa della Gilda | altro | **niente** → da tenere | — | sì |
| Polvere di oricalco | materia | **niente** → da tenere | — | sì |
| Olio lubrificante di fonderia | materia | **niente** → da tenere | — | sì |
| Frammenti di lamiere contorte | materia | **niente** → da tenere | — | sì |
| Ingranaggio salmastro | altro | **niente** → da tenere | — | sì |
| Fogli di notizie | altro | **niente** → da tenere | — | sì |
| Giacca di tela consumata | capo | addosso: torso; addosso: «Addosso» di Equipaggiamento | — | sì |
| Viti di bronzo | altro | **niente** → da tenere | — | sì |
| Legname bagnato | materia | **niente** → da tenere | — | sì |
| Cenere tiepida | materia | **niente** → da tenere | — | sì |
| Chiave arrugginita | chiave | **niente** → da tenere | — | sì |
| Scarti di lamiera ossidata | materia | **niente** → da tenere | — | sì |
| Frammenti di vetro marino | altro | **niente** → da tenere | — | sì |
| Chiodi di rame arrugginiti | materia | **niente** → da tenere | — | sì |
| Frammenti di vetro di mare | altro | **niente** → da tenere | — | sì |
| Rottami di rame ossidato | materia | **niente** → da tenere | — | sì |
| Bulloni di ghisa | materia | **niente** → da tenere | — | sì |
| Ganci di ferro | attrezzo | **niente** → da tenere | — | sì |
| Frammenti di rivetti arrugginiti | materia | **niente** → da tenere | — | sì |
| Olio denso raccolto | altro | **niente** → da tenere | — | sì |
| Stoppa di canapa umida | materia | **niente** → da tenere | — | sì |
| Chiodo di rame piegato | materia | **niente** → da tenere | — | sì |
| Gomitolo di cima di canapa | attrezzo | **niente** → da tenere | — | sì |
| Frammento di scafo con vernice scrostata | materia | **niente** → da tenere | — | sì |
| Resti di cordame incatramato | altro | **niente** → da tenere | — | sì |
| Lamiera ondulata arrugginita | materia | **niente** → da tenere | — | sì |
| Cime di canapa incatramata | attrezzo | **niente** → da tenere | — | sì |
| Scarti di lamiera corrosa | materia | **niente** → da tenere | — | sì |
| Rottami di timone | altro | **niente** → da tenere | — | sì |
| Stivali di cuoio pieni d'acqua | capo | **niente** → da tenere | — | sì |
| Pezzi di lamiera salmastra | materia | **niente** → da tenere | — | sì |
| Pezzi di vetro smerigliato | altro | **niente** → da tenere | — | sì |
| Corda di canapa fradice | materia | **niente** → da tenere | — | sì |
| Frammenti di vetro verde | altro | **niente** → da tenere | — | sì |
| Olio di macchina galleggiante | materia | **niente** → da tenere | — | sì |
| Bulloni di ferro arrugginito | materia | **niente** → da tenere | — | sì |
| Barattolo di olio nero | attrezzo | **niente** → da tenere | — | sì |
| Vetro di bottiglia levigato | altro | **niente** → da tenere | — | sì |
| Frammento di scafo bruciato | materia | **niente** → da tenere | — | sì |
| Frammento di vetro di mare | altro | **niente** → da tenere | — | sì |
| Scaglie di ruggine | materia | **niente** → da tenere | — | sì |
| Frammento di vetro di serra | altro | **niente** → da tenere | — | sì |
| Borsa di cuoio per campioni | contenitore | borsa da 6 | — | sì |
| Osso di seppia secco | materia | **niente** → da tenere | — | sì |
| Scafandro in tela gommata | capo | addosso: torso; addosso: «Addosso» di Equipaggiamento | — | sì |
| Casco da palombaro | capo | addosso: head; addosso: «In testa» di Equipaggiamento | — | sì |
| Olio di macchina | materia | **niente** → da tenere | — | sì |
| Frammenti di guscio di granchio | materia | **niente** → da tenere | — | sì |
| Attrezzi da giardinaggio arrugginiti | attrezzo | **niente** → da tenere | — | sì |
| Vasi di terracotta spaccati | altro | **niente** → da tenere | — | sì |
| Stracci sporchi di grasso | altro | **niente** → da tenere | — | sì |
| Frammenti di vetro smerigliato | materia | **niente** → da tenere | — | sì |
| Legno marcio | materia | **niente** → da tenere | — | sì |
| Corde incatramate | materia | **niente** → da tenere | — | sì |
| Cima di canapa logora | attrezzo | **niente** → da tenere | — | sì |
| Berretto di cuoio | capo | addosso: head; addosso: «In testa» di Equipaggiamento | — | sì |
| Rottami di lamiera | materia | **niente** → da tenere | — | sì |
| Bulloni di ottone sparsi | altro | **niente** → da tenere | — | sì |
| Stoppa unta | attrezzo | **niente** → da tenere | — | sì |
| Conchiglia incrostata di catrame | altro | **niente** → da tenere | — | sì |
| Bulloni di ottone ossidato | materia | **niente** → da tenere | — | sì |
| Catrame rappreso | materia | **niente** → da tenere | — | sì |
| Frammenti di ottone ossidato | materia | **niente** → da tenere | — | sì |
| Corde di canapa incatramata | attrezzo | **niente** → da tenere | — | sì |
| Giacca di cuoio ingrassata | capo | addosso: torso; addosso: «Addosso» di Equipaggiamento | — | sì |
| Cocci di vetro smerigliato | materia | **niente** → da tenere | — | sì |
| Radici avvolgenti | materia | **niente** → da tenere | — | sì |
| Cima di canapa inzuppata | attrezzo | **niente** → da tenere | — | sì |
| Cassetta di attrezzi arrugginita | contenitore | borsa da 6 | — | sì |
| Fune incatramata | materia | **niente** → da tenere | — | sì |
| Frammenti di guscio | altro | **niente** → da tenere | — | sì |
| Sacchetto di segatura | altro | **niente** → da tenere | — | sì |
| Fascio di fogli di Ciok Ciok | altro | **niente** → da tenere | — | sì |
| Runa Cuprina | magia | **niente** → da tenere | — | sì |
| Cappotto lungo con molte tasche | capo | addosso: torso; addosso: «Addosso» di Equipaggiamento | — | sì |
| Scarti di tela gommata | materia | **niente** → da tenere | — | sì |
| Chiodi di rame piegati | materia | **niente** → da tenere | — | sì |
| Olio scuro per ingranaggi | attrezzo | **niente** → da tenere | — | sì |
| Scaglie di vernice navale | materia | **niente** → da tenere | — | sì |
| Foglie di metallo | materia | **niente** → da tenere | — | sì |
| Boccetta di olio lubrificante | attrezzo | **niente** → da tenere | — | sì |
| Corda di canapa logora | attrezzo | **niente** → da tenere | — | sì |
| Felce rampicante | materia | **niente** → da tenere | — | sì |
| Stivale di gomma bucato | capo | addosso: «Ai piedi» di Equipaggiamento | — | sì |
| Gancio da recupero arrugginito | attrezzo | addosso: «In mano» di Equipaggiamento | — | sì |
| Frammento di scafandro in rame | materia | **niente** → da tenere | — | sì |
| Orologio da taschino incrostato di sale | altro | **niente** → da tenere | — | sì |
| Lente da orologiaio | attrezzo | addosso: head; addosso: «In testa» di Equipaggiamento | — | sì |
| Frammenti di vetro di serra | materia | **niente** → da tenere | — | sì |
| Campione di morchia oleosa | altro | **niente** → da tenere | — | sì |
| Frammenti di vetro di serra | materia | **niente** → da tenere | — | sì |
| Tubature di rame ossidato | materia | **niente** → da tenere | — | sì |
| Casco di rame da palombaro | capo | addosso: head; addosso: «In testa» di Equipaggiamento | — | sì |
| Conchiglia incrostata di catrame | altro | **niente** → da tenere | — | sì |
| Tubazioni di rame ossidato | materia | **niente** → da tenere | — | sì |
| Fango caldo e nutriente | cibo | effetto: apply health +10 | — | sì |
| Ingranaggi arrugginiti tra le radici | altro | **niente** → da tenere | — | sì |
| Olio lubrificante denso | materia | **niente** → da tenere | — | sì |
| Scaglie di vernice rossa | materia | **niente** → da tenere | — | sì |
| Olio nero di chiatta | materia | **niente** → da tenere | — | sì |
| Stoppa intrisa d'olio | materia | **niente** → da tenere | — | sì |
| Orologio da taschino sporco d'olio | attrezzo | **niente** → da tenere | — | sì |
| Foglie di felce annerite | materia | **niente** → da tenere | — | sì |
| Barattolo di semi | contenitore | borsa da 2 | — | sì |
| Sapone oleoso | attrezzo | **niente** → da tenere | — | sì |
| Scarti di metallo | materia | **niente** → da tenere | — | sì |
| Scaglie di rame limato | materia | **niente** → da tenere | — | sì |
| Stoppacci unti | attrezzo | **niente** → da tenere | — | sì |
| Frammenti di vetro soffiato | materia | **niente** → da tenere | — | sì |
| Fertilizzante minerale rosso | altro | **niente** → da tenere | — | sì |
| Olio denso delle vaporiere | materia | **niente** → da tenere | — | sì |
| Barattolo di morchia oleosa | materia | **niente** → da tenere | — | sì |
| Cordame logoro | attrezzo | **niente** → da tenere | — | sì |
| Fiala di condensa di latania | cibo | effetto: drink thirst +15 | — | sì |
| Vetro frantumato | altro | **niente** → da tenere | — | sì |
| Piuma di metallo decorativo | altro | **niente** → da tenere | — | sì |
| Olio lubrificante nero | materia | **niente** → da tenere | — | sì |
| Sacco di terriccio della Fuliggine | materia | **niente** → da tenere | — | sì |
| Spezzone di tubazione in rame | materia | **niente** → da tenere | — | sì |
| Vaso di vetro graduato | contenitore | borsa da 2 | — | sì |
| Registro delle essenze | altro | **niente** → da tenere | — | sì |
| Tubicino di rame piegato | attrezzo | **niente** → da tenere | — | sì |
| Frammenti di vetro borosilicato | materia | **niente** → da tenere | — | sì |
| Manovella di ottone | attrezzo | addosso: «In mano» di Equipaggiamento | — | sì |
| Ingranaggio di bronzo ossidato | altro | **niente** → da tenere | — | sì |
| Schegge di vetro colorato | altro | **niente** → da tenere | — | sì |

### `items.pacco-1` (16)

| oggetto | ruolo | usi | da dove viene | run |
|---|---|---|---|---|
| Formaggio di malga stagionato | cibo | effetto: eat hunger +25 thirst -5; entra in Galletta del marinaio | — |  |
| Polenta fritta | cibo | effetto: eat hunger +20 energy +5 | — |  |
| Aringa affumicata | cibo | effetto: eat hunger +18 thirst -10 | — |  |
| Gazzosa con la pallina | cibo | effetto: drink thirst +25 energy +5 | — |  |
| Infuso di camomilla in barattolo | cibo | effetto: drink thirst +15 energy +3 health +3 | — |  |
| Sciroppo di catrame per la tosse | cibo | effetto: apply thirst -3 health +15 | — |  |
| Sali d'ammoniaca | cibo | effetto: apply energy +20 health +5 | — |  |
| Martello da ribattitore | attrezzo | addosso: «In mano» di Equipaggiamento; attrezzo per Lamina d'ottone; attrezzo per Ingranaggio d'ottone; attrezzo per Ribattini d'ottone; attrezzo per Tubo di rame; attrezzo per Borsa degli attrezzi; attrezzo per Rotolo di filo di rame; attrezzo per Grembiule di cuoio; attrezzo per Capsula d'ottone | — |  |
| Coltello da cordaio | attrezzo | addosso: «In mano» di Equipaggiamento; attrezzo per Sacca di tela; attrezzo per Borsa degli attrezzi; attrezzo per Straccio unto; attrezzo per Corde di canapa annodate | — |  |
| Bastone col pomo d'ottone | attrezzo | addosso: «In mano» di Equipaggiamento | — |  |
| Gomitolo di spago incatramato | materia | entra in Sacca di tela; entra in Borsa degli attrezzi | — |  |
| Fascina di legna secca | materia | **niente** → da tenere | ricetta: Assi di pioppo (con Falcetto da trebbia) |  |
| Lumino a petrolio | luce | si accende; addosso: «In mano» di Equipaggiamento | ricetta: Stoppino di cotone + Candela di sego (con Coltello da stivale) |  |
| Berretto di panno da caldaista | capo | addosso: head; addosso: «In testa» di Equipaggiamento | — |  |
| Scarponi chiodati da minatore | capo | addosso: «Ai piedi» di Equipaggiamento | — |  |
| Cesta di vimini da mercato | contenitore | borsa da 6 | — |  |

### `items.pacco-2` (16)

| oggetto | ruolo | usi | da dove viene | run |
|---|---|---|---|---|
| Pagnotta al burro di forno | cibo | effetto: eat hunger +25 energy +5 | — |  |
| Castagne arrosto nel cartoccio | cibo | effetto: eat hunger +15 energy +5 | — |  |
| Cipolla di Trebbia | cibo | effetto: eat hunger +6 thirst -2 | — |  |
| Fiaschetta di grappa di vinacce | cibo | effetto: drink thirst -3 energy +10 health -3 | — |  |
| Latte di capra in bottiglia | cibo | effetto: drink hunger +8 thirst +20 | — |  |
| Tintura d'arnica | cibo | effetto: apply health +12; entra in Unguento per le ustioni | — |  |
| Polvere di china contro la febbre | cibo | effetto: apply energy -3 health +15 | — |  |
| Chiave inglese a rullino | chiave | addosso: «In mano» di Equipaggiamento | — |  |
| Falcetto da trebbia | attrezzo | addosso: «In mano» di Equipaggiamento; attrezzo per Fascina di legna secca | — |  |
| Sfollagente di cuoio piombato | attrezzo | addosso: «In mano» di Equipaggiamento | — |  |
| Rotolo di filo di rame | materia | **niente** → da tenere | ricetta: Lingotto di rame (con Pinze da colata, Martello da ribattitore) |  |
| Assi di pioppo | materia | entra in Fascina di legna secca | — |  |
| Lampada a gas da banco | luce | si accende; addosso: «In mano» di Equipaggiamento | — |  |
| Spolverino di tela cerata | capo | addosso: torso; addosso: «Addosso» di Equipaggiamento | — |  |
| Gavetta di latta col coperchio | contenitore | borsa da 3 | — |  |
| Tabacchiera d'ottone incisa | altro | **niente** → da tenere | — |  |

### `items.pacco-3` (16)

| oggetto | ruolo | usi | da dove viene | run |
|---|---|---|---|---|
| Galletta del marinaio | cibo | effetto: eat hunger +10 | ricetta: Pane nero di segale + Formaggio di malga stagionato (con Coltello da stivale); ricetta: Pane nero di segale + Salsiccia affumicata (con Coltello da stivale) | sì |
| Barattolo di conserve di Solfara | cibo | effetto: eat hunger +15 | — | sì |
| Fiasca di vino cotto | cibo | effetto: drink thirst +20 | — | sì |
| Unguento al grasso di balena | cibo | effetto: apply health +10 | — | sì |
| Punteruolo da marcatura | attrezzo | attrezzo per Grembiule di cuoio; attrezzo per Borsa degli attrezzi; entra in Mappa dei cunicoli | — | sì |
| Lima piatta a grana grossa | attrezzo | **niente** → da tenere | — | sì |
| Bussola da miniera magnetica | altro | **niente** → da tenere | — | sì |
| Coltello da stivale | attrezzo | addosso: «In mano» di Equipaggiamento; attrezzo per Unguento per le ustioni; attrezzo per Lumino a petrolio; attrezzo per Galletta del marinaio; attrezzo per Candela di sego | — | sì |
| Scampolo di cuoio ingrassato | materia | entra in Grembiule di cuoio | — | sì |
| Bobina di filo di canapa | materia | entra in Corde di canapa annodate; entra in Borsa di tela rinforzata | — | sì |
| Barattolo di grasso lubrificante | altro | entra in Oliatore; entra in Candela di sego | — | sì |
| Bastoncino di magnesio | luce | si accende | — | sì |
| Sciarpa di lana pesante | capo | **niente** → da tenere | — | sì |
| Ghette protettive in tela gommata | capo | addosso: «Ai piedi» di Equipaggiamento; entra in Grembiule di cuoio | — | sì |
| Cassetta di legno per chiodi | contenitore | borsa da 8 | — | sì |
| Taccuino dei turni | altro | **niente** → da tenere | — | sì |

### `items.pacco-4` (16)

| oggetto | ruolo | usi | da dove viene | run |
|---|---|---|---|---|
| Boccetta di essenza di pino | altro | **niente** → da tenere | — | sì |
| Pane secco alle noci | cibo | effetto: eat hunger +25 thirst -5 | — | sì |
| Tè alle bacche nere | cibo | effetto: drink hunger +5 thirst +20 | — | sì |
| Acciughe sotto sale | cibo | effetto: eat hunger +30 thirst -10 | — | sì |
| Bastone da passeggio con punta ferrata | attrezzo | addosso: «In mano» di Equipaggiamento | — | sì |
| Stoppino di cotone | altro | entra in Lumino a petrolio; entra in Candela di sego | — | sì |
| Spazzola di setole dure | attrezzo | **niente** → da tenere | — | sì |
| Guanti da calderaio | capo | addosso: «In mano» di Equipaggiamento | — | sì |
| Sabbia di fiume setacciata | materia | **niente** → da tenere | — | sì |
| Cera per sigilli | altro | **niente** → da tenere | — | sì |
| Borsa di tela rinforzata | contenitore | borsa da 8 | ricetta: Telo di canapa + Bobina di filo cerato (con Cesoie per lamiera); ricetta: Telo di canapa + Bobina di filo di canapa (con Cesoie per lamiera) | sì |
| Lima tonda di precisione | attrezzo | **niente** → da tenere | — | sì |
| Tintura di corteccia di salice | cibo | effetto: apply health +15 | — | sì |
| Cinghia di trasmissione in cuoio | materia | **niente** → da tenere | — | sì |
| Mazza da demolizione | attrezzo | addosso: «In mano» di Equipaggiamento | — | sì |
| Fischietto di segnalazione | altro | **niente** → da tenere | — | sì |

### `items.pacco-5` (16)

| oggetto | ruolo | usi | da dove viene | run |
|---|---|---|---|---|
| Galletta alla crusca | cibo | effetto: eat hunger +15 | — | sì |
| Tisana alle erbe di montagna | cibo | effetto: drink thirst +20 | — | sì |
| Spatola per fuliggine | attrezzo | **niente** → da tenere | — | sì |
| Chiave a rullino | chiave | **niente** → da tenere | — | sì |
| Cesoie per lamiera | attrezzo | attrezzo per Borsa di tela rinforzata; attrezzo per Grembiule di cuoio | — | sì |
| Pennello a setole morbide | attrezzo | **niente** → da tenere | — | sì |
| Bobina di filo cerato | materia | entra in Grembiule di cuoio; entra in Borsa di tela rinforzata; entra in Borsa degli attrezzi | — | sì |
| Scampolo di velluto scuro | materia | **niente** → da tenere | — | sì |
| Sacchetto di borace | materia | **niente** → da tenere | — | sì |
| Fazzoletto di cotone | capo | **niente** → da tenere | — | sì |
| Tappo di sughero | altro | **niente** → da tenere | — | sì |
| Calamita da officina | attrezzo | **niente** → da tenere | — | sì |
| Occhiali da sole fumé | capo | addosso: head; addosso: «In testa» di Equipaggiamento | — | sì |
| Flacone di olio di lino | altro | **niente** → da tenere | — | sì |
| Seghetto per metallo | attrezzo | **niente** → da tenere | — | sì |
| Tazza di latta ammaccata | contenitore | borsa da 2 | — | sì |

### `items.pacco-6` (16)

| oggetto | ruolo | usi | da dove viene | run |
|---|---|---|---|---|
| Biscotti bruciacchiati del fornaio | cibo | effetto: eat hunger +10 | — | sì |
| Bottiglietta di acquavite di sorgente | cibo | effetto: drink thirst +15 | — | sì |
| Polvere stimolante alle erbe | cibo | effetto: apply energy +20 | — | sì |
| Chiave inglese pesante | chiave | **niente** → da tenere | — | sì |
| Scalpello da incisione | attrezzo | attrezzo per Mappa dei cunicoli | — | sì |
| Spranga di ferro | attrezzo | addosso: «In mano» di Equipaggiamento | — | sì |
| Scampolo di cuoio conciato | materia | entra in Borsa degli attrezzi | — | sì |
| Scatolina di zolfanelli | luce | si accende | — | sì |
| Berretto di lana grezza | capo | addosso: head; addosso: «In testa» di Equipaggiamento | — | sì |
| Zainetto di cuoio | capo | borsa da 8; addosso: back; addosso: «Addosso» di Equipaggiamento | — | sì |
| Taccuino dei turni | altro | entra in Mappa dei cunicoli | — | sì |
| Gomitolo di spago grezzo | materia | **niente** → da tenere | — | sì |
| Striscia di carne essiccata | cibo | effetto: eat hunger +20 | — | sì |
| Guanti da operaio | capo | addosso: «In mano» di Equipaggiamento | — | sì |
| Lastra di rame battuto | materia | **niente** → da tenere | — | sì |
| Levachiodi | attrezzo | **niente** → da tenere | — | sì |

### `items.vapore` (41)

| oggetto | ruolo | usi | da dove viene | run |
|---|---|---|---|---|
| Pane nero di segale | cibo | effetto: eat hunger +28; serve a «Dai un pane per del carbone» (Caldaista); serve a «Dai un pane per uova e acqua» (Gente di miniera); entra in Galletta del marinaio | — |  |
| Uova sode della sorgente | cibo | effetto: eat hunger +18 | — |  |
| Salsiccia affumicata | cibo | effetto: eat hunger +30; serve a «Dai un pezzo di salsiccia» (Gatto di fabbrica); entra in Galletta del marinaio | — |  |
| Gavetta di zuppa d'orzo | cibo | effetto: eat hunger +35 thirst +10 | — |  |
| Mela renetta | cibo | effetto: eat hunger +10 thirst +5; serve a «Dai una mela per una capsula d'ottone» (Cittadino) | — |  |
| Caffè nero bollente | cibo | effetto: drink thirst +12 energy +18 | — |  |
| Bottiglia d'acqua termale | cibo | effetto: drink thirst +30; serve a «Versa acqua termale» (Caldaia a pressione); entra in Benda di garza | — |  |
| Birra scura | cibo | effetto: drink thirst +20 energy -4 | — |  |
| Unguento per le ustioni | cibo | effetto: apply health +25 | ricetta: Benda di garza + Tintura d'arnica (con Coltello da stivale) |  |
| Benda di garza | cibo | effetto: apply health +12; entra in Unguento per le ustioni | ricetta: Straccio unto + Bottiglia d'acqua termale |  |
| Cacciavite fine | attrezzo | serve a «Tara il manometro» (Valvola con manometro); attrezzo per Manometro tarato; attrezzo per Ingranaggio d'ottone; attrezzo per Lanterna a carburo | — |  |
| Pinze da colata | attrezzo | attrezzo per Lingotto d'oricalco; attrezzo per Lamina d'ottone; attrezzo per Tubo di rame; attrezzo per Ribattini d'ottone; attrezzo per Rotolo di filo di rame; attrezzo per Lingotto di rame; attrezzo per Molla d'acciaio | — |  |
| Lente d'orologiaio | attrezzo | attrezzo per Ingranaggio d'ottone; attrezzo per Manometro tarato; attrezzo per Orologio da tasca | — |  |
| Oliatore | attrezzo | serve a «Dai l'oliatore per un caffè» (Macchinista); attrezzo per Straccio unto | ricetta: Straccio unto + Barattolo di grasso lubrificante (con Chiave inglese di Raniero) |  |
| Piccone da minatore | attrezzo | serve a «Scava tra le pietre» (Carrello del minerale) | — |  |
| Carbone | materia | serve a «Dai tre pezzi di carbone per del minerale» (Fonditrice); serve a «Metti carbone» (Caldaia a pressione); serve a «Attizza la caldaia di poppa» (Chiatta a vapore della darsena); serve a «Alimenta il forno» (Fucina d'oricalco); entra in Lingotto d'oricalco; entra in Lamina d'ottone; entra in Tubo di rame; entra in Lingotto di rame; entra in Lanterna a carburo | — |  |
| Minerale rosso di Solfara | materia | serve a «Carica minerale nel carrello» (Carrello del minerale); serve a «Cola l'oricalco» (Fucina d'oricalco); entra in Lingotto d'oricalco; entra in Lingotto di rame | mestiere: minatore |  |
| Lingotto di rame | materia | serve a «Tempra una lamina» (Fucina d'oricalco); entra in Lingotto d'oricalco; entra in Lamina d'ottone; entra in Tubo di rame; entra in Rotolo di filo di rame | ricetta: Minerale rosso di Solfara + Carbone (con Pinze da colata) |  |
| Pane di zinco | materia | entra in Lamina d'ottone | — |  |
| Lingotto d'oricalco | materia | serve a «Mostra un lingotto d'oricalco» (Guardiano d'ottone); serve a «Vendi un lingotto d'oricalco» (Fonditrice) | ricetta: Minerale rosso di Solfara + Lingotto di rame + Carbone (con Pinze da colata, Occhialoni da fonderia, Grembiule di cuoio); ricetta: Minerale rosso di Solfara + Lingotto di rame + Carbone (con Pinze da colata, Occhialoni da fonderia, Grembiule di cuoio); ricetta: Minerale rosso di Solfara + Carbone (con Pinze da colata); ricetta: Minerale rosso di Solfara + Lingotto di rame (con Pinze da colata); ricetta: Minerale rosso di Solfara + Lingotto di rame + Carbone (con Pinze da colata) |  |
| Lamina d'ottone | materia | serve a «Taglia ingranaggi da una lamina» (Banco dell'orologiaio); entra in Ingranaggio d'ottone; entra in Ribattini d'ottone; entra in Capsula d'ottone; entra in Orologio da tasca; entra in Lanterna a carburo | ricetta: Lingotto di rame + Pane di zinco + Carbone (con Pinze da colata, Martello da ribattitore); ricetta: Lingotto di rame + Pane di zinco + Carbone (con Pinze da colata, Martello da ribattitore); ricetta: Lingotto di rame + Pane di zinco (con Pinze da colata) |  |
| Ingranaggio d'ottone | materia | serve a «Vendi due ingranaggi» (Orologiaia); entra in Manometro tarato; entra in Orologio da tasca | ricetta: Lamina d'ottone (con Martello da ribattitore, Lente d'orologiaio); ricetta: Lamina d'ottone (con Martello da ribattitore, Lente d'orologiaio); ricetta: Viti e bulloni + Lamina d'ottone (con Cacciavite fine); ricetta: Lamina d'ottone + Viti e bulloni (con Cacciavite fine); mestiere: orologiaio |  |
| Molla d'acciaio | materia | serve a «Monta un orologio da tasca» (Banco dell'orologiaio); entra in Manometro tarato; entra in Orologio da tasca | ricetta: Limatura di ferro (con Pinze da colata) |  |
| Viti e bulloni | materia | entra in Manometro tarato; entra in Capsula d'ottone; entra in Ingranaggio d'ottone | — |  |
| Tubo di rame | materia | serve a «Consegna un tubo di rame» (Aeronauta); serve a «Porta un tubo di rame al bruciatore» (Dirigibile all'ormeggio) | ricetta: Lingotto di rame (con Martello da ribattitore, Pinze da colata); ricetta: Lingotto di rame + Carbone (con Martello da ribattitore, Pinze da colata); ricetta: Lingotto di rame (con Pinze da colata) |  |
| Vetro da manometro | materia | entra in Manometro tarato; entra in Lanterna a carburo | — |  |
| Straccio unto | materia | serve a «Rattoppa la tela» (Dirigibile all'ormeggio); serve a «Pulisci il vetro» (Lampione a gas); entra in Oliatore; entra in Benda di garza | ricetta: Telo di canapa (con Coltello da cordaio, Oliatore); ricetta: Ritaglio di stoffa (con Oliatore) |  |
| Lanterna a carburo | luce | si accende; addosso: «In mano» di Equipaggiamento | ricetta: Lamina d'ottone + Vetro da manometro + Carbone (con Cacciavite fine) |  |
| Candela di sego | luce | si accende; addosso: «In mano» di Equipaggiamento; entra in Lumino a petrolio | ricetta: Stoppino di cotone + Barattolo di grasso lubrificante (con Coltello da stivale) |  |
| Occhialoni da fonderia | capo | addosso: head; addosso: «In testa» di Equipaggiamento; attrezzo per Lingotto d'oricalco | — |  |
| Grembiule di cuoio | capo | addosso: torso; addosso: «Addosso» di Equipaggiamento; attrezzo per Lingotto d'oricalco | ricetta: Telo di canapa + Ribattini d'ottone (con Martello da ribattitore); ricetta: Scampolo di cuoio ingrassato + Bobina di filo cerato (con Punteruolo da marcatura); ricetta: Scampolo di cuoio ingrassato + Ghette protettive in tela gommata (con Cesoie per lamiera) |  |
| Soldo di rame | altro | serve a «Compra una chiave inglese (5 soldi)» (Caldaista); serve a «Compra una lanterna a carburo (4 soldi)» (Gente di miniera); serve a «Compra le notizie del giorno (un soldo)» (Cittadino); serve a «Compra un biglietto della linea alta (2 soldi)» (Macchinista); serve a «Manda una capsula (un soldo)» (Telegrafo pneumatico) | — |  |
| Capsula d'ottone | altro | serve a «Appendi un avviso» (Bacheca delle corporazioni); serve a «Rimanda una capsula vuota» (Telegrafo pneumatico) | ricetta: Lamina d'ottone + Viti e bulloni (con Martello da ribattitore) |  |
| Biglietto della linea alta | altro | **niente** → da tenere | — |  |
| Brevetto dell'ingegner Lenti | altro | **niente** → da tenere | — |  |
| Manometro rotto | altro | serve a «Porta un manometro rotto» (Orologiaia); serve a «Ripara un manometro» (Banco dell'orologiaio); entra in Manometro tarato | — |  |
| Manometro tarato | attrezzo | **niente** → da tenere | ricetta: Manometro rotto + Vetro da manometro + Molla d'acciaio (con Cacciavite fine, Lente d'orologiaio); ricetta: Manometro rotto + Vetro da manometro (con Cacciavite fine, Lente d'orologiaio); ricetta: Manometro rotto + Viti e bulloni (con Cacciavite fine); ricetta: Manometro rotto + Vetro da manometro + Viti e bulloni (con Cacciavite fine); ricetta: Manometro rotto (con Cacciavite fine); ricetta: Manometro rotto + Vetro da manometro + Viti e bulloni (con Cacciavite fine); ricetta: Vetro da manometro + Ingranaggio d'ottone + Molla d'acciaio (con Cacciavite fine); ricetta: Manometro rotto + Vetro da manometro (con Cacciavite fine, Lente d'orologiaio) |  |
| Orologio da tasca | altro | **niente** → da tenere | ricetta: Ingranaggio d'ottone + Molla d'acciaio + Lamina d'ottone (con Lente d'orologiaio) |  |
| Chiave di ghisa | chiave | **niente** → da tenere | — |  |
| Mappa dei cunicoli | altro | serve a «Scambia una mappa dei cunicoli» (Aeronauta) | ricetta: Taccuino dei turni + Punteruolo da marcatura (con Scalpello da incisione) |  |
| Borsa degli attrezzi | contenitore | borsa da 6 | ricetta: Telo di canapa + Gomitolo di spago incatramato + Ribattini d'ottone (con Coltello da cordaio, Martello da ribattitore); ricetta: Telo di canapa + Ribattini d'ottone + Gomitolo di spago incatramato (con Coltello da cordaio, Martello da ribattitore); ricetta: Scampolo di cuoio conciato + Bobina di filo cerato (con Punteruolo da marcatura) |  |

### `lavoro.tessitore` (1)

| oggetto | ruolo | usi | da dove viene | run |
|---|---|---|---|---|
| Telo di canapa | materia | entra in Sacca di tela; entra in Borsa degli attrezzi; entra in Straccio unto; entra in Grembiule di cuoio; entra in Borsa di tela rinforzata | mestiere: tessitrice |  |

### `magic.vapore` (1)

| oggetto | ruolo | usi | da dove viene | run |
|---|---|---|---|---|
| Limatura di ferro | materia | entra in Molla d'acciaio | — |  |

