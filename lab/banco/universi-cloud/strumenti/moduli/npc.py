from common import module
import json
A=lambda i,l,r=None: dict(id=i,label=l,**({"requires":r} if r else {}))
def lua_str(s): return json.dumps(s, ensure_ascii=False)
def npc(mid,name,desc,context,color,glyph,aspetto,persona,inventory,actions,chiedi,racconti,scambi,reazioni,speed=1.1,spawn=None,extra=''):
    """chiedi: three answers, one after the other (the branch follows how far you got); racconti: by day phase;
    scambi: {action_id: (requires_item, n_in, give_item, n_out, text)}; reazioni: {state: text} when the wanderer carries a state."""
    L=["-- "+name+": dialoghi a rami (il passo sta nel componente dialogo), scambi e reazioni agli stati di chi ascolta.","local M = {}",""]
    L.append("local CHIEDI = {"+", ".join(lua_str(x) for x in chiedi)+"}")
    L.append("local RACCONTI = { mattina = "+lua_str(racconti[0])+", giorno = "+lua_str(racconti[1])+", sera = "+lua_str(racconti[2])+", notte = "+lua_str(racconti[3])+" }")
    L.append("local SCAMBI = {")
    for k,(req,nin,give,nout,txt) in scambi.items():
        L.append(f'  ["{k}"] = {{ chiede = "{req}", quanti = {nin}, da = "{give}", dati = {nout}, testo = {lua_str(txt)} }},')
    L.append("}")
    L.append("local REAZIONI = {")
    for k,txt in reazioni.items(): L.append(f'  {{ {lua_str(k)}, {lua_str(txt)} }},')
    L.append("}")
    L.append(r'''
local function nome(id)
  local i = ecs.get(id, "identity")
  return (i and i.name) or ''' + lua_str(name) + r'''
end

local function momento()
  local f = (time / 600 + 0.12) % 1
  if f < 0.12 or f >= 0.96 then return "mattina" end
  if f < 0.42 then return "giorno" end
  if f < 0.58 then return "sera" end
  return "notte"
end

-- Una reazione a ciò che il viandante si porta addosso (gli stati che gli incantesimi lasciano), se c'è.
local function reazione(user)
  local st = ecs.get(user, "stati")
  if not st then return nil end
  for _, r in ipairs(REAZIONI) do
    if st[r[1]] then return r[2] end
  end
  return nil
end

function M.on_spawn(id)
  local w = ecs.get(id, "wander")
  if w then w.speed = ''' + str(speed) + r''' * (0.8 + hash(id, 5) * 0.4) end
  ecs.set(id, "dialogo", { passo = 0, scambi = 0 })
end

function M.on_act(id, user, action)
  local d = ecs.get(id, "dialogo")
  if not d then
    ecs.set(id, "dialogo", { passo = 0, scambi = 0 })
    d = ecs.get(id, "dialogo")
  end
  local chi = nome(id)
  local r = reazione(user)
  if action == "chiedi" then
    local passo = math.min((d.passo or 0) + 1, #CHIEDI)
    d.passo = passo
    local t = CHIEDI[passo]
    if r and passo == 1 then t = r .. " " .. t end
    world.speak(id, t)
    return chi .. ": «" .. t .. "»"
  elseif action == "racconta" then
    local t = RACCONTI[momento()]
    return chi .. ": «" .. t .. "»"
  end
  local s = SCAMBI[action]
  if s then
    if inventory.count(user, s.chiede) < s.quanti then return chi .. " scuote la testa: «Non hai quello che mi serve.»" end
    inventory.remove(user, s.chiede, s.quanti)
    inventory.add(user, s.da, s.dati)
    d.scambi = (d.scambi or 0) + 1
    return chi .. ": «" .. s.testo .. "»"
  end
''' + extra + r'''
  return chi .. " ti guarda e aspetta."
end

return M''')
    acts=[A('chiedi','Chiedi del lavoro'),A('racconta','Fatti raccontare')]+actions
    m={"name":name,"kind":"entity","description":desc,"context":context,
       "appearance":{"model":"persona-vapore","classe":"persona","glyph":glyph,"color":color,"aspetto":aspetto},
       "physics":{"solid":False,"radius":0.35,"speed":speed},"tags":["persona"],
       "components":{"wander":{"dx":0,"dy":0,"t":0,"speed":speed}},
       "interaction":{"type":"talk"},"persona":persona,"inventory":inventory,"actions":acts}
    if spawn: m["spawn"]=spawn
    module(mid,m,"\n".join(L))
RUNE="Delle rune sai quello che sa la gente delle Città del Vapore: lastre con un segno inciso che manda una luce tenue, posate qua e là sul suolo; gli inventori provano a capirle, i collezionisti le pagano bene, i vecchi le temono, e qualcuno dice che pronunciate fanno magie."
npc('npc.caldaista','Caldaista',"Gente delle caldaie: caldaisti e fuochisti della Gilda, con le braccia nere di carbone e l'orecchio fino per la pressione.","vicoli, piazze, officine e rimesse",'#5a4a3a','&',
 "un caldaista con il berretto di panno, la tuta sporca di carbone e una pala sulla spalla",
 "Sei un caldaista della Gilda delle Città del Vapore: lavori alle caldaie, conosci il carbone, la pressione e le valvole, e vuoi turni di dieci ore. "+RUNE+" Scambi volentieri carbone con chi ti aiuta.",
 ['item.carbone','item.caffe-nero'],
 [A('scambia-carbone','Dai un pane per del carbone','item.pane-nero'),A('scambia-chiave','Compra una chiave inglese (5 soldi)','item.soldo-rame')],
 ["Carbone, acqua, fuoco. E le valvole: due, sempre due. Chi ne mette una sola non ha visto lo scoppio.",
  "Senti come fischia quella laggiù? Nove atmosfere. A dodici si aprono gli sfoghi da sole, se uno ha avuto giudizio.",
  "Dieci ore, non dodici: è tutto quello che chiede la Gilda. Lunedì, alla Pesa, lo diciamo davanti a tutti."],
 ["Il primo fuoco della giornata è quello che conta: se parte storto, storta è la giornata.","A mezzogiorno si mangia seduti sul carbone, e il carbone è caldo.","La sera si va nel vicolo a parlare di turni. Non di altro.","Di notte le caldaie dormono, ma una si tiene sempre accesa. Non si sa mai."],
 {"scambia-carbone":("item.pane-nero",1,"item.carbone",3,"Affare fatto: tre pezzi di carbone buono, di quello che non fuma."),"scambia-chiave":("item.soldo-rame",5,"item.chiave-inglese",1,"Ecco, la mia vecchia: battila tre volte su ogni caldaia nuova, come si usa.")},
 {"nel vapore":"Ehi, sei tutto vapore! Ti sei messo davanti a uno sfiato?","nella fuliggine":"Mamma mia, sembri uscito da un comignolo.","tempra d'ottone":"Hai la pelle che luccica come una fascia di caldaia, sai?"})
npc('npc.orologiaia','Orologiaia',"Gente dalle mani fini: orologiai, taratrici di manometri, inventori; lenti nell'occhio e tasche piene di viti.","botteghe del Quartiere dei Telai e officine del canale",'#6a5a8a','&',
 "un'orologiaia con la lente nell'occhio, il grembiule pieno di tasche e un cacciavite fine dietro l'orecchio",
 "Sei un'orologiaia, o un inventore, delle Città del Vapore: ripari orologi e manometri, monti ingranaggi, sogni macchine nuove. "+RUNE+" Paghi bene chi ti porta ingranaggi e molle.",
 ['item.ingranaggio','item.molla-acciaio'],
 [A('scambia-manometro','Porta un manometro rotto','item.manometro-rotto'),A('scambia-ingranaggi','Vendi due ingranaggi','item.ingranaggio')],
 ["Un manometro bugiardo è peggio di un manometro rotto: quello rotto almeno lo sai.",
  "Quelli della fonderia nuova segnano mezza atmosfera in meno. Mezza! Qualcuno ha girato le viti di taratura.",
  "Portami un manometro rotto e ti do un soldo; portamene uno della fonderia nuova e ti do la verità, che vale di più."],
 ["La mattina si tarano i manometri, con la luce giusta.","Di giorno le botteghe ticchettano tutte insieme: senti?","La sera si leggono i giornali dei brevetti. Quaranta brevetti, e nemmeno uno venduto, dice Ingegni.","Di notte una molla si carica da sola, se la lasci tesa. Ne ho sentite."],
 {"scambia-manometro":("item.manometro-rotto",1,"item.soldo-rame",2,"Dammi qua. Due soldi, e lo rimetto in sesto per qualcuno che ne ha bisogno."),"scambia-ingranaggi":("item.ingranaggio",2,"item.vetro-manometro",1,"Dodici denti, ben tagliati. Ecco un vetro da manometro, senza un graffio.")},
 {"passo a molla":"Cammini a scatti, come un orologio caricato troppo.","calamitato":"Non avvicinarti al banco! Hai addosso tanta di quella limatura che mi tiri via le viti."})
npc('npc.macchinista','Macchinista',"Gente della ferrovia sospesa: macchinisti, scambiste, frenatori, con il fazzoletto al collo e il fischietto in tasca.","scali, rimesse, viadotti",'#3a4a6a','&',
 "un macchinista con il berretto della Compagnia, gli occhialoni sulla fronte e un fazzoletto bianco al collo",
 "Sei della gente della Ferrovia Sospesa delle Città del Vapore: macchinista, scambista o frenatore. Conosci binari, scambi, orari e curve del viadotto. "+RUNE+" Vendi biglietti a chi è gentile.",
 ['item.biglietto-linea','item.caffe-nero'],
 [A('scambia-biglietto','Compra un biglietto della linea alta (2 soldi)','item.soldo-rame'),A('scambia-olio',"Dai l'oliatore per un caffè",'item.oliatore')],
 ["La linea alta parte all'alba e torna col buio. Una rotaia sola, e sotto il vuoto.",
  "Ultimamente dietro la rimessa tagliano i cavi di rame. Puliti, come con le cesoie.",
  "Se vedi qualcuno con le cesoie dei frenatori dove non dovrebbe stare, dimmelo. La Compagnia paga."],
 ["All'alba si scalda la locomotiva: un'ora di carbone prima del primo fischio.","Di giorno il minerale scende dalle miniere: trenta vagoni, e Tizzone sopra il primo.","La sera si fuma la pipa al Giardino della Fuliggine.","Di notte lo scalo è buio, e qualcuno ci gira con una lanterna schermata."],
 {"scambia-biglietto":("item.soldo-rame",2,"item.biglietto-linea",1,"Ecco il biglietto, forato e verde. Tieniti forte nelle curve."),"scambia-olio":("item.oliatore",1,"item.caffe-nero",2,"Un oliatore! Ci voleva. Tieni, due caffè neri della rimessa.")},
 {"nel vapore":"Sei fumante come una locomotiva in partenza.","passo a molla":"Con quel passo arriveresti alle miniere prima del treno."})
npc('npc.aeronauta','Aeronauta',"Gente dei dirigibili: aeronauti, ormeggiatori e osservatori del vento, con i guanti di pelle e la testa per aria.","torri d'ormeggio e piazzali degli aeronauti",'#8a6a3a','&',
 "un'aeronauta con il giubbotto di pelle, la sciarpa lunga, i guanti da pilota e il cuffiotto",
 "Sei della gente dei dirigibili delle Città del Vapore: aeronauta, ormeggiatore o osservatore del vento. Parli di cavi, nodi, venti e nuvole. "+RUNE+" Paghi bene tubi di rame e tela per le riparazioni.",
 ['item.benda','item.orologio-tasca'],
 [A('consegna-tubo','Consegna un tubo di rame','item.tubo-rame'),A('scambia-mappa','Scambia una mappa dei cunicoli','item.mappa-cunicoli')],
 ["Una tela, un bruciatore e il vento giusto: un dirigibile non chiede altro.",
  "La Rondine è bucata sopra il bruciatore. Con un tubo di rame nuovo e una toppa riparte.",
  "Il ponente arriva fra tre giorni. Se la Rondine non è pronta, il debito con la Casa Ramelli mi mangia."],
 ["All'alba si leggono le nuvole: chi le legge male non torna.","Di giorno si caricano le casse e si tendono i cavi.","La sera si gioca a carte nel piazzale, aspettando il vento.","Di notte, dalla torre, si vede passare un dirigibile senza fanali. Non è dei nostri."],
 {"consegna-tubo":("item.tubo-rame",1,"item.soldo-rame",6,"Un tubo di rame! Sei soldi, e il mio grazie quando la Rondine vola."),"scambia-mappa":("item.mappa-cunicoli",1,"item.orologio-tasca",1,"Una mappa di Solfara: dall'alto i cunicoli non si vedono. Prendi questo orologio, va avanti di due minuti.")},
 {"passo a molla":"Con quello slancio potresti saltare sulla passerella senza scaletta.","nella fuliggine":"Lassù quella fuliggine te la porta via il vento in un attimo."})
npc('npc.fonditrice','Fonditrice',"Gente delle fonderie: colatrici, capi forno e direttori della Casa Ramelli, con il grembiule di cuoio e gli occhialoni affumicati.","fonderie, magazzini, la fonderia vecchia",'#a8442a','&',
 "una fonditrice con il grembiule di cuoio bruciacchiato, gli occhialoni affumicati sul collo e le pinze da colata",
 "Sei della gente delle fonderie d'oricalco delle Città del Vapore: colatrice, capo forno o direttore. Conosci il minerale rosso, il rame, il calore del forno e il colore della lega. "+RUNE+" Scambi minerale e lingotti con chi lavora sodo.",
 ['item.unguento-ustioni','item.minerale-rosso'],
 [A('scambia-minerale','Dai tre pezzi di carbone per del minerale','item.carbone'),A('scambia-oricalco',"Vendi un lingotto d'oricalco",'item.lingotto-oricalco')],
 ["Due di minerale, uno di rame, e il forno bianco. Così si fa l'oricalco, da cent'anni.",
  "La lega nuova è più pallida. Chi la cola lo vede, chi la vende fa finta di no.",
  "Se vuoi sapere se una lega è giusta, portala a Selene Vitti: lei la sente nei manometri."],
 ["La mattina si preparano i crogioli, uno per uno.","Di giorno si cola: guai a chi parla durante una colata.","La sera ci si spalma l'unguento sulle braccia e si mangia con chi si vuole bene.","Di notte i forni restano accesi, e la gatta dorme sui lingotti tiepidi."],
 {"scambia-minerale":("item.carbone",3,"item.minerale-rosso",2,"Carbone buono. Prendi due pezzi di minerale rosso, di quello delle vene profonde."),"scambia-oricalco":("item.lingotto-oricalco",1,"item.soldo-rame",12,"Rosso e dorato, come si deve: dodici soldi, il prezzo della Pesa di lunedì.")},
 {"tempra d'ottone":"Con quella pelle potresti prendere un crogiolo senza guanti.","calamitato":"Stai lontano dagli stampi, hai addosso più ferro di un'incudine."})
npc('npc.cartografo-miniera','Gente di miniera',"Gente delle Miniere Termali di Solfara: minatori, capisquadra e cartografi di miniera, con il casco e la lanterna a carburo.","miniere, cunicoli, sorgenti calde",'#7a5a3a','&',
 "un minatore con il casco ammaccato, la lanterna a carburo al fianco e il viso rosso per il calore",
 "Sei della gente delle Miniere Termali di Solfara: minatore, caposquadra o cartografo. Conosci i cunicoli, il minerale rosso, l'acqua calda delle sorgenti. "+RUNE+" Scambi uova sode e acqua termale con chi scende con te.",
 ['item.uova-sode','item.acqua-termale'],
 [A('scambia-uova','Dai un pane per uova e acqua','item.pane-nero'),A('scambia-lanterna','Compra una lanterna a carburo (4 soldi)','item.soldo-rame'),A('mappa','Chiedi una copia della mappa')],
 ["Qui sotto l'acqua è calda come il tè, e a mezzogiorno ci si cuociono le uova.",
  "Il cunicolo diciassette finisce contro una porta di ghisa. Sulle mappe vecchie, invece, andava avanti.",
  "La serratura di quella porta ha la forma di un ingranaggio a dodici denti. Chi sa girarlo, sa aprirla."],
 ["La mattina si conta chi scende, la sera si conta chi risale.","A mezzogiorno uova sode e acqua della sorgente.","La sera ci si lava nella pozza calda, tutti insieme.","Di notte la miniera respira: si sente l'acqua che scorre sotto la roccia."],
 {"scambia-uova":("item.pane-nero",1,"item.uova-sode",2,"Due uova della sorgente, ancora tiepide. E un sorso d'acqua, offro io."),"scambia-lanterna":("item.soldo-rame",4,"item.lanterna-carburo",1,"Riempila di carburo ogni mattina e non ti lascerà mai al buio.")},
 {"nella fuliggine":"Ti sei rotolato nella polvere di carbone? Qui sotto si fa così.","nel vapore":"Sei fumante come una pozza della sorgente."},
 extra=r'''
  if action == "mappa" then
    if inventory.count(user, "item.mappa-cunicoli") > 0 then return chi .. ": «Hai già una mappa. Guarda il diciassette: va avanti, oltre la porta.»" end
    inventory.add(user, "item.mappa-cunicoli", 1)
    return chi .. ": «Tieni, una copia a matita. Non perderla nei cunicoli.»"
  end''')
npc('npc.cittadino','Cittadino',"Gente di città: giornalai, tessitrici, doganieri, che sanno le notizie e le canzoni prima di tutti.","piazze, capannoni dei telai, banchine del porto",'#8a7a6a','&',
 "un cittadino con il berretto a visiera, il gilet e un giornale piegato sotto il braccio",
 "Sei della gente comune delle Città del Vapore: giornalaio, tessitrice o doganiere. Sai le notizie, i prezzi della Pesa, le canzoni dei telai. "+RUNE+" Vendi notizie e piccole cose per pochi soldi.",
 ['item.soldo-rame','item.mela-renetta'],
 [A('scambia-giornale','Compra le notizie del giorno (un soldo)','item.soldo-rame'),A('scambia-capsula',"Dai una mela per una capsula d'ottone",'item.mela-renetta')],
 ["Lunedì c'è la Pesa Grande: nessuno compra niente prima di mezzogiorno, si sa.",
  "L'oricalco cala da tre settimane. Le caldaie nuove fischiano. Qualcuno dice che le due cose vanno insieme.",
  "Al porto mancano casse di rame, e di notte passa un dirigibile senza fanali. Pesalo in piazza, se hai coraggio."],
 ["La mattina le notizie sono fresche come il pane.","Di giorno i telai cantano e la piazza vende.","La sera si sta nel cortile a chiacchierare con le vicine.","Di notte, sulle banchine, è meglio non fare domande."],
 {"scambia-giornale":("item.soldo-rame",1,"item.capsula-pneumatica",1,"Il giornale te lo racconto io, e per giunta ti do questa capsula vuota: mandala a chi vuoi."),"scambia-capsula":("item.mela-renetta",1,"item.capsula-pneumatica",1,"Una renetta delle Trebbie! Prendi la capsula, è tua.")},
 {"nella fuliggine":"Sei nero come lo spazzacamino del vicolo.","calamitato":"Hai addosso chiodi e limatura: sembri il carro del ferraio."})
