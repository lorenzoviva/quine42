from common import module
A=lambda i,l,r=None: dict(id=i,label=l,**({"requires":r} if r else {}))
module('obj.caldaia',{"name":"Caldaia a pressione","kind":"entity",
"description":"Una caldaia di ghisa panciuta con le fasce d'ottone, il portello del fuoco e due valvole di sfogo. Vuole carbone e acqua; senz'acqua non si accende.",
"context":"piazze, officine, fonderie, rimesse e aie delle Città del Vapore",
"appearance":{"model":"caldaia-vapore","classe":"edificio","glyph":"♨","color":"#5a5e66","aspetto":"una caldaia di ghisa panciuta con fasce d'ottone, un portello del fuoco arancio e un comignolo"},
"physics":{"solid":True,"radius":0.55},"tags":["caldaia","metallo","macchina"],
"components":{"caldaia":{"accesa":False,"carbone":0,"acqua":0,"pressione":0,"sfoghi":0,"battuta":False}},
"interaction":{"type":"lua"},
"actions":[A('carbone','Metti carbone','item.carbone'),A('acqua',"Versa acqua termale",'item.acqua-termale'),A('accendi','Accendi il fuoco'),A('sfiata','Apri lo sfiato'),A('batti','Batti tre volte con la chiave','item.chiave-inglese'),A('ascolta','Ascolta la caldaia')]},r'''
-- Caldaia a pressione: carbone e acqua dentro, fuoco, pressione. Il sistema sys.pressione la fa vivere.
local M = {}

local function stato(c)
  local p = math.floor((c.pressione or 0) * 10 + 0.5) / 10
  local fuoco = c.accesa and "il fuoco ruggisce" or "il fuoco è spento"
  return string.format("Carbone %d, acqua %d, %s; la lancetta segna %.1f atmosfere.", math.floor(c.carbone or 0), math.floor(c.acqua or 0), fuoco, p)
end

function M.on_interact(id, user)
  local c = ecs.get(id, "caldaia")
  if not c then return "Una caldaia fredda." end
  return stato(c)
end

function M.on_act(id, user, action)
  local c = ecs.get(id, "caldaia")
  if not c then return "La caldaia non risponde." end
  if action == "carbone" then
    local n = inventory.remove(user, "item.carbone", 3)
    if n <= 0 then return "Non hai carbone." end
    c.carbone = (c.carbone or 0) + n * 4
    return "Spali " .. n .. " pezzi di carbone nel portello. " .. stato(c)
  elseif action == "acqua" then
    local n = inventory.remove(user, "item.acqua-termale", 1)
    if n <= 0 then return "Non hai acqua." end
    c.acqua = (c.acqua or 0) + 10
    return "L'acqua gorgoglia nel serbatoio. " .. stato(c)
  elseif action == "accendi" then
    if (c.acqua or 0) <= 0 then return "Una caldaia senz'acqua non si accende: scoppierebbe. Prima l'acqua." end
    if (c.carbone or 0) <= 0 then return "Non c'è carbone da accendere." end
    if c.accesa then return "È già accesa. " .. stato(c) end
    c.accesa = true
    local st = ecs.get(user, "stati")
    if st and st["passo a molla"] then return "Accendi il fuoco e salti indietro con un balzo leggero, prima che la vampata ti arrivi." end
    return "Il fuoco prende con un ruggito. La lancetta comincia a salire."
  elseif action == "sfiata" then
    local prima = c.pressione or 0
    c.pressione = math.max(0, prima - 4)
    if prima < 1 then return "Lo sfiato soffia appena: non c'è pressione." end
    local st = ecs.get(user, "stati")
    if st and st["tempra d'ottone"] then return "Il getto di vapore ti investe, ma la pelle d'ottone non sente il caldo. " .. stato(c) end
    return "FSSSS! Un getto di vapore bianco sale dritto verso il cielo. " .. stato(c)
  elseif action == "batti" then
    if c.battuta then return "L'hai già battuta tre volte: la caldaia conosce il suo nome." end
    c.battuta = true
    return "Tan, tan, tan. Dici il nome di chi l'ha fatta, come si usa, e il ferro risponde con un ronzio basso."
  elseif action == "ascolta" then
    local p = c.pressione or 0
    if not c.accesa then return "Silenzio, e un ticchettio di metallo che si raffredda." end
    if p > 9 then return "Fischia forte: la pressione è alta. Meglio aprire lo sfiato." end
    if p > 4 then return "Un brontolio regolare, come una pentola che bolle contenta." end
    return "Un respiro lento: la pressione sta salendo."
  end
  return stato(c)
end

return M
''')
module('obj.valvola-manometro',{"name":"Valvola con manometro","kind":"entity",
"description":"Un tubo che esce dal muro con una valvola a volantino rosso e un manometro d'ottone: segna la pressione della caldaia più vicina e, aperto, la sfoga.",
"context":"accanto alle caldaie, nelle officine e nelle fonderie",
"appearance":{"model":"valvola-manometro","classe":"mobile","glyph":"◎","color":"#c8a04a","aspetto":"una valvola a volantino rosso su un tubo di rame con un manometro d'ottone dal quadrante bianco"},
"physics":{"solid":True,"radius":0.35},"tags":["valvola","metallo","meccanismo"],
"components":{"manometro":{"lettura":0},"valvola":{"tarata":False}},
"interaction":{"type":"lua"},
"actions":[A('leggi','Leggi il manometro'),A('apri','Gira il volantino'),A('tara','Tara il manometro','item.cacciavite-fine')]},r'''
-- Valvola e manometro: la lettura la scrive sys.pressione; il volantino sfoga la caldaia vicina.
local M = {}

local function lettura(id)
  local m = ecs.get(id, "manometro")
  local v = ecs.get(id, "valvola")
  local l = m and m.lettura or 0
  -- Un manometro non tarato segna mezza atmosfera in meno del vero, come quelli della fonderia nuova.
  if v and not v.tarata then l = math.max(0, l - 0.5) end
  return l
end

function M.on_interact(id, user)
  return string.format("La lancetta trema su %.1f atmosfere.", lettura(id))
end

function M.on_act(id, user, action)
  if action == "leggi" then return M.on_interact(id, user) end
  if action == "tara" then
    local v = ecs.get(id, "valvola")
    if not v then return "Non c'è niente da tarare." end
    if v.tarata then return "È già tarato: la lancetta dice il vero." end
    v.tarata = true
    return "Con il cacciavite fine giri la vite di taratura: la lancetta salta di mezza atmosfera. Ora dice il vero."
  end
  if action == "apri" then
    local p = ecs.get(id, "pos")
    local c = p and world.nearest(p.x, p.y, 4, "caldaia")
    local cc = c and ecs.get(c, "caldaia")
    if not cc then return "Il volantino gira a vuoto: il tubo non porta a nessuna caldaia." end
    if (cc.pressione or 0) < 0.5 then return "Il volantino gira, ma non esce niente: la caldaia è a riposo." end
    cc.pressione = math.max(0, cc.pressione - 3)
    if c then world.speak(c, "Fsss...") end
    return string.format("Il vapore esce sibilando dal tubo. Ora la caldaia è a %.1f atmosfere.", cc.pressione)
  end
  return M.on_interact(id, user)
end

return M
''')
module('obj.banco-orologiaio',{"name":"Banco dell'orologiaio","kind":"entity",
"description":"Un banco di noce pieno di cassettini, con la lampada a braccio, le pinzette e i quadranti smontati: qui si riparano manometri e si montano orologi.",
"context":"botteghe di orologiai e officine di inventori",
"appearance":{"model":"banco-orologiaio","classe":"mobile","glyph":"π","color":"#7a5030","aspetto":"un banco di noce con molti cassettini, una lampada a braccio d'ottone e quadranti smontati"},
"physics":{"solid":True,"radius":0.45},"tags":["banco","legno","bottega"],
"components":{"banco":{"lavori":0}},
"interaction":{"type":"lua"},
"actions":[A('ripara','Ripara un manometro','item.manometro-rotto'),A('orologio','Monta un orologio da tasca','item.molla-acciaio'),A('ingranaggi','Taglia ingranaggi da una lamina','item.lamina-ottone'),A('studia','Studia i quadranti')]},r'''
-- Banco dell'orologiaio: lavori fini con ciò che porti. Conta i lavori fatti nel componente banco.
local M = {}

local function ha(user, item, n) return inventory.count(user, item) >= (n or 1) end

local function fatto(id)
  local b = ecs.get(id, "banco")
  if b then b.lavori = (b.lavori or 0) + 1 end
end

function M.on_interact(id, user)
  local b = ecs.get(id, "banco")
  local n = b and b.lavori or 0
  if n == 0 then return "Il banco è in ordine: pinzette, lenti, viti piccole come semi." end
  return "Sul banco restano i segni di " .. n .. " lavori fatti, e un odore d'olio fine."
end

function M.on_act(id, user, action)
  if action == "ripara" then
    if not ha(user, "item.vetro-manometro") then return "Per ripararlo serve un vetro da manometro nuovo." end
    inventory.remove(user, "item.manometro-rotto", 1)
    inventory.remove(user, "item.vetro-manometro", 1)
    inventory.add(user, "item.manometro", 1)
    fatto(id)
    if ha(user, "item.lente-orologiaio") then return "Con la lente nell'occhio raddrizzi la lancetta e monti il vetro nuovo: un manometro tarato, perfetto." end
    return "Senza lente ci metti un'ora, ma alla fine la lancetta torna sullo zero: un manometro tarato."
  elseif action == "orologio" then
    if not ha(user, "item.ingranaggio", 2) or not ha(user, "item.lamina-ottone") then return "Per un orologio servono due ingranaggi, una molla e una lamina d'ottone." end
    inventory.remove(user, "item.ingranaggio", 2)
    inventory.remove(user, "item.molla-acciaio", 1)
    inventory.remove(user, "item.lamina-ottone", 1)
    inventory.add(user, "item.orologio-tasca", 1)
    fatto(id)
    local st = ecs.get(user, "stati")
    if st and st["passo a molla"] then return "Le mani ti vanno svelte come la molla negli stivali: l'orologio ticchetta al primo colpo." end
    return "Infili gli ingranaggi, carichi la molla, chiudi la cassa: l'orologio ticchetta forte."
  elseif action == "ingranaggi" then
    inventory.remove(user, "item.lamina-ottone", 1)
    inventory.add(user, "item.ingranaggio", 2)
    fatto(id)
    return "Con la seghetta fine tagli due ruote dentate dalla lamina, dodici denti ciascuna."
  elseif action == "studia" then
    local frasi = {
      "Un quadrante smontato: sotto la lancetta c'è una molla che respira.",
      "Un orologio aperto: ogni dente spinge il dente dopo, come le operaie dei telai si passano il canto.",
      "Un manometro della fonderia nuova: la vite di taratura è stata girata di mezzo giro. Da chi?",
    }
    return frasi[math.floor(hash(id, math.floor(time / 30)) * #frasi) + 1]
  end
  return M.on_interact(id, user)
end

return M
''')
module('obj.fucina-oricalco',{"name":"Fucina d'oricalco","kind":"entity",
"description":"Un forno a crogiolo di mattoni refrattari con il mantice a vapore: con il carbone giusto il minerale rosso e il rame diventano oricalco.",
"context":"fonderie e officine dei fonditori",
"appearance":{"model":"fucina-oricalco","classe":"edificio","glyph":"Ψ","color":"#e08a3a","aspetto":"un forno a crogiolo di mattoni refrattari con una bocca rovente, un mantice e un canale di colata"},
"physics":{"solid":True,"radius":0.6},"tags":["forno","fonderia","caldo"],
"components":{"forno":{"calore":0,"colate":0}},
"interaction":{"type":"lua"},
"actions":[A('alimenta','Alimenta il forno','item.carbone'),A('cola',"Cola l'oricalco",'item.minerale-rosso'),A('tempra','Tempra una lamina','item.lingotto-rame'),A('guarda','Guarda la colata')]},r'''
-- Fucina d'oricalco: il calore sale col carbone e cala col tempo; a forno caldo si cola la lega.
local M = {}

local function calore(id)
  local f = ecs.get(id, "forno")
  if not f then return 0, nil end
  -- Il forno si raffredda da sé: un grado ogni due secondi da quando l'hai alimentato.
  if f.da then
    f.calore = math.max(0, (f.calore or 0) - (time - f.da) * 0.5)
    f.da = time
  end
  return f.calore or 0, f
end

function M.on_interact(id, user)
  local c = calore(id)
  if c >= 60 then return "La bocca del forno è bianca: è il calore giusto per l'oricalco." end
  if c >= 30 then return "Il forno è rosso, ma non basta ancora per la lega." end
  return "Il forno è tiepido. Serve carbone, tanto carbone."
end

function M.on_act(id, user, action)
  local c, f = calore(id)
  if not f then return "Il forno non risponde." end
  if action == "alimenta" then
    local n = inventory.remove(user, "item.carbone", 2)
    f.calore = math.min(100, c + n * 18)
    f.da = time
    return "Il mantice soffia, il carbone si accende: il forno sale a " .. math.floor(f.calore) .. " gradi di colore."
  elseif action == "cola" then
    if c < 60 then return "Il forno non è abbastanza caldo: il minerale resterebbe pietra." end
    if inventory.count(user, "item.minerale-rosso") < 2 or inventory.count(user, "item.lingotto-rame") < 1 then
      return "Per la lega servono due pezzi di minerale rosso e un lingotto di rame."
    end
    inventory.remove(user, "item.minerale-rosso", 2)
    inventory.remove(user, "item.lingotto-rame", 1)
    inventory.add(user, "item.lingotto-oricalco", 1)
    f.colate = (f.colate or 0) + 1
    f.calore = c - 25
    local st = ecs.get(user, "stati")
    if st and st["tempra d'ottone"] then return "Prendi il crogiolo a mani nude, la pelle dura come l'ottone: la colata scende rosso-dorata nello stampo." end
    return "Il crogiolo si inclina, la lega scende rosso-dorata nello stampo e fuma: un lingotto d'oricalco."
  elseif action == "tempra" then
    if c < 30 then return "Il forno è troppo freddo per temprare." end
    if inventory.count(user, "item.lingotto-zinco") < 1 then return "Per l'ottone serve anche un pane di zinco." end
    inventory.remove(user, "item.lingotto-rame", 1)
    inventory.remove(user, "item.lingotto-zinco", 1)
    inventory.add(user, "item.lamina-ottone", 3)
    f.calore = c - 10
    return "Rame e zinco si sposano nel crogiolo: martelli tre lamine d'ottone giallo."
  elseif action == "guarda" then
    local n = f.colate or 0
    if n == 0 then return "Il canale di colata è vuoto e annerito." end
    return "Nel canale restano le tracce di " .. n .. " colate, rosse come il tramonto sopra le Fonderie."
  end
  return M.on_interact(id, user)
end

return M
''')
module('obj.carrello-minerario',{"name":"Carrello del minerale","kind":"entity",
"description":"Un carrello di ferro sui binari, mezzo pieno di minerale rosso di Solfara, con il freno a leva e le ruote che stridono.",
"context":"miniere, scali ferroviari e banchine",
"appearance":{"model":"carrello-minerario","classe":"mobile","glyph":"▣","color":"#6a5a4a","aspetto":"un carrello di ferro su ruote con il cassone pieno di pietre rosse e un freno a leva"},
"physics":{"solid":True,"radius":0.45},"tags":["carrello","metallo","miniera"],
"components":{"carrello":{"minerale":6,"frenato":True}},
"interaction":{"type":"lua"},
"actions":[A('prendi','Prendi un pezzo di minerale'),A('carica','Carica minerale nel carrello','item.minerale-rosso'),A('freno','Tira il freno a leva'),A('scava','Scava tra le pietre','item.piccone')]},r'''
-- Carrello del minerale: il minerale dentro è contato nel componente; la Compagnia paga chi lo carica.
local M = {}

function M.on_interact(id, user)
  local c = ecs.get(id, "carrello")
  if not c then return "Un carrello vuoto." end
  local f = c.frenato and "frenato" or "libero sui binari"
  return "Nel carrello ci sono " .. (c.minerale or 0) .. " pezzi di minerale rosso; il carrello è " .. f .. "."
end

function M.on_act(id, user, action)
  local c = ecs.get(id, "carrello")
  if not c then return "Il carrello non c'è più." end
  if action == "prendi" then
    if (c.minerale or 0) <= 0 then return "Il cassone è vuoto: solo polvere rossa." end
    c.minerale = c.minerale - 1
    inventory.add(user, "item.minerale-rosso", 1)
    return "Prendi un pezzo di minerale, pesante e caldo. Ne restano " .. c.minerale .. "."
  elseif action == "carica" then
    local n = inventory.remove(user, "item.minerale-rosso", 5)
    c.minerale = (c.minerale or 0) + n
    inventory.add(user, "item.soldo-rame", n)
    return "Carichi " .. n .. " pezzi: il caposquadra ti allunga " .. n .. " soldi di rame."
  elseif action == "freno" then
    c.frenato = not c.frenato
    local st = ecs.get(user, "stati")
    if not c.frenato and st and st["nel vapore"] then return "Sblocchi il freno e il vapore che ti avvolge spinge il carrello di un palmo lungo i binari." end
    return c.frenato and "La leva scatta: il carrello è frenato." or "La leva si alza con uno stridio: il carrello è libero."
  elseif action == "scava" then
    if (c.scavato or 0) > time then return "Le pietre rimaste sono sterili: riprova più tardi." end
    c.scavato = time + 60
    inventory.add(user, "item.minerale-rosso", 1)
    if hash(id, math.floor(time)) < 0.2 then
      inventory.add(user, "item.carbone", 1)
      return "Col piccone spacchi un sasso: dentro c'è una vena rossa, e sotto un pezzo di carbone."
    end
    return "Col piccone spacchi un sasso grosso: dentro c'è una vena rossa."
  end
  return M.on_interact(id, user)
end

return M
''')
module('obj.telegrafo-pneumatico',{"name":"Telegrafo pneumatico","kind":"entity",
"description":"Una colonnina d'ottone con un tubo che sparisce nel selciato, uno sportello per le capsule e la fessura per il soldo: in pochi minuti la capsula è dall'altra parte della città.",
"context":"piazze, scali, torri e banchine",
"appearance":{"model":"telegrafo-pneumatico","classe":"monumento","glyph":"¶","color":"#d4a83a","aspetto":"una colonnina d'ottone alta con uno sportello rotondo, una leva e un tubo che entra nel suolo"},
"physics":{"solid":True,"radius":0.35},"tags":["telegrafo","ottone","meccanismo"],
"components":{"telegrafo":{"in_viaggio":False,"arrivo":0,"inviate":0,"arrivate":0}},
"interaction":{"type":"lua"},
"actions":[A('invia','Manda una capsula (un soldo)','item.soldo-rame'),A('rimanda','Rimanda una capsula vuota','item.capsula-pneumatica'),A('ascolta','Ascolta il tubo')]},r'''
-- Telegrafo pneumatico: una capsula parte e, otto secondi dopo, ne arriva una (sys.meccanismi).
local M = {}

function M.on_interact(id, user)
  local t = ecs.get(id, "telegrafo")
  if t and t.in_viaggio then return "Dentro il tubo si sente correre una capsula: sta arrivando." end
  return "Lo sportello è chiuso. Sopra la fessura c'è scritto il prezzo: un soldo."
end

function M.on_act(id, user, action)
  local t = ecs.get(id, "telegrafo")
  if not t then return "Il telegrafo è muto." end
  if action == "invia" then
    if t.in_viaggio then return "Aspetta: c'è già una capsula nel tubo." end
    if inventory.remove(user, "item.soldo-rame", 1) <= 0 then return "Ti serve un soldo di rame." end
    t.in_viaggio = true
    t.arrivo = time + 8
    t.inviate = (t.inviate or 0) + 1
    return "Il soldo cade, tiri la leva: FOP! La capsula sparisce nel tubo con un soffio. La risposta arriverà presto."
  elseif action == "rimanda" then
    inventory.remove(user, "item.capsula-pneumatica", 1)
    if inventory.count(user, "item.caffe-nero") > 0 then
      return "Rimandi la capsula vuota con il profumo del caffè dentro, come si usa: chi l'ha mandata saprà che è arrivata."
    end
    return "Rimandi la capsula vuota: chi l'ha mandata saprà che è arrivata."
  elseif action == "ascolta" then
    if t.in_viaggio then return "Un fruscio che corre sotto i piedi, sempre più vicino." end
    return "Un respiro lungo, come il vento in un camino: il tubo è vuoto."
  end
  return M.on_interact(id, user)
end

return M
''')
module('obj.dirigibile-attracco',{"name":"Dirigibile all'ormeggio","kind":"entity",
"description":"Il pilone d'ormeggio della torre con un dirigibile legato ai cavi: la Rondine di Marta Ventidue, con lo squarcio sul fianco e il bruciatore spento.",
"context":"torri d'ormeggio e piazzali degli aeronauti",
"appearance":{"model":"pilone-ormeggio","classe":"monumento","glyph":"Ѫ","color":"#8a6a4a","aspetto":"un pilone di ferro a traliccio con un anello in cima e cavi tesi verso un dirigibile color sabbia"},
"physics":{"solid":True,"radius":0.5},"tags":["dirigibile","ormeggio","metallo"],
"components":{"dirigibile":{"tubi":0,"toppe":0,"riparato":False,"voli":0}},
"interaction":{"type":"lua"},
"actions":[A('tubo','Porta un tubo di rame al bruciatore','item.tubo-rame'),A('toppa','Rattoppa la tela','item.straccio'),A('sali','Sali a bordo'),A('osserva','Osserva il cielo')]},r'''
-- Dirigibile all'ormeggio: la Rondine si ripara con un tubo e una toppa; riparata, porta in giro chi sale.
local M = {}

local function aggiusta(d)
  if not d.riparato and (d.tubi or 0) >= 1 and (d.toppe or 0) >= 1 then
    d.riparato = true
    return " La Rondine è riparata: il bruciatore si accende e la tela si gonfia."
  end
  return ""
end

function M.on_interact(id, user)
  local d = ecs.get(id, "dirigibile")
  if not d then return "Un pilone vuoto." end
  if d.riparato then return "La Rondine dondola piano ai cavi, pronta a partire col vento da ponente." end
  local manca = {}
  if (d.tubi or 0) < 1 then manca[#manca + 1] = "un tubo di rame per il bruciatore" end
  if (d.toppe or 0) < 1 then manca[#manca + 1] = "una toppa per lo squarcio" end
  return "La Rondine è ferita. Le serve " .. table.concat(manca, " e ") .. "."
end

function M.on_act(id, user, action)
  local d = ecs.get(id, "dirigibile")
  if not d then return "Il dirigibile è partito." end
  if action == "tubo" then
    inventory.remove(user, "item.tubo-rame", 1)
    d.tubi = (d.tubi or 0) + 1
    return "Avviti il tubo nuovo al bruciatore, stringendo bene i raccordi." .. aggiusta(d)
  elseif action == "toppa" then
    inventory.remove(user, "item.straccio", 1)
    d.toppe = (d.toppe or 0) + 1
    return "Cuci lo straccio unto sullo squarcio, a punti larghi da velaio." .. aggiusta(d)
  elseif action == "sali" then
    if not d.riparato then return "Con lo squarcio sul fianco la Rondine non si alza di un palmo." end
    d.voli = (d.voli or 0) + 1
    local st = ecs.get(user, "stati")
    if st and st["passo a molla"] then return "Salti sulla passerella con un balzo solo. Dall'alto la città è un tappeto di tetti, fumo e binari." end
    return "Sali la scaletta di corda. Dall'alto la città è un tappeto di tetti, fumo e binari che luccicano."
  elseif action == "osserva" then
    local f = (time / 600 + 0.12) % 1
    if f >= 0.42 then return "Il cielo si fa scuro sopra le Fonderie; il fumo sale giallo." end
    return "Nuvole basse da levante. Il vento da ponente non è ancora arrivato."
  end
  return M.on_interact(id, user)
end

return M
''')
module('obj.enigma-ingranaggi',{"name":"Serratura a ingranaggi","kind":"entity",
"description":"Una piastra di ghisa con tre ruote dentate incastrate l'una nell'altra: girandone una si muovono anche le altre. Quando i tre denti segnati stanno in alto, qualcosa scatta.",
"context":"porte murate, cancelli dei giardini, cunicoli e botteghe",
"appearance":{"model":"enigma-ingranaggi","classe":"mobile","glyph":"⚙","color":"#8a7a5a","aspetto":"una piastra di ghisa con tre ruote dentate d'ottone incastrate e tre denti dipinti di rosso"},
"physics":{"solid":True,"radius":0.4},"tags":["enigma","meccanismo","ghisa"],
"components":{"ruote":{"a":0,"b":0,"c":0,"aperta":False,"mosse":0}},
"interaction":{"type":"lua"},
"actions":[A('prima','Gira la ruota grande'),A('seconda','Gira la ruota media'),A('terza','Gira la ruota piccola'),A('guarda','Guarda i denti segnati')]},r'''
-- Serratura a ingranaggi: tre ruote da dodici denti, accoppiate. La ruota grande trascina la media,
-- la media trascina la piccola di due denti. Si apre quando i tre denti segnati sono in alto (la
-- combinazione è fissata dal luogo dove sta la serratura).
local M = {}

local function meta(id)
  local o = ecs.get(id, "origin")
  local k = o and o.key or tostring(id)
  local h = 0
  for i = 1, #k do h = (h * 31 + string.byte(k, i)) % 1000003 end
  return math.floor(hash(h, 1) * 12), math.floor(hash(h, 2) * 12), math.floor(hash(h, 3) * 12)
end

local function descrivi(r, id)
  local ta, tb, tc = meta(id)
  local function quanto(v, t)
    local d = (t - v) % 12
    if d == 0 then return "in alto" end
    if d <= 3 or d >= 9 then return "vicino" end
    return "lontano"
  end
  return "Dente rosso della grande: " .. quanto(r.a, ta) .. "; della media: " .. quanto(r.b, tb) .. "; della piccola: " .. quanto(r.c, tc) .. "."
end

local function controlla(id, user, r)
  local ta, tb, tc = meta(id)
  if r.a == ta and r.b == tb and r.c == tc and not r.aperta then
    r.aperta = true
    inventory.add(user, "item.ingranaggio", 2)
    inventory.add(user, "item.molla-acciaio", 1)
    if hash(id, 9) < 0.5 then inventory.add(user, "item.cristallo-magico", 1) end
    bus.emit("enigma", { id = id, mosse = r.mosse })
    return " CLAC! I tre denti rossi sono in alto: dietro la piastra si apre uno sportellino, e dentro ci sono ingranaggi di ricambio."
  end
  return ""
end

function M.on_interact(id, user)
  local r = ecs.get(id, "ruote")
  if not r then return "Una piastra di ghisa." end
  if r.aperta then return "Lo sportellino è aperto: la serratura ha già detto il suo segreto." end
  return descrivi(r, id)
end

function M.on_act(id, user, action)
  local r = ecs.get(id, "ruote")
  if not r then return "La piastra non si muove." end
  if r.aperta then return "Le ruote girano a vuoto: la serratura è già aperta." end
  r.mosse = (r.mosse or 0) + 1
  if action == "prima" then
    r.a = (r.a + 1) % 12
    r.b = (r.b + 1) % 12
  elseif action == "seconda" then
    r.b = (r.b + 1) % 12
    r.c = (r.c + 2) % 12
  elseif action == "terza" then
    r.c = (r.c + 1) % 12
  elseif action == "guarda" then
    r.mosse = r.mosse - 1
    return descrivi(r, id)
  end
  return "Clic. " .. descrivi(r, id) .. controlla(id, user, r)
end

return M
''')
