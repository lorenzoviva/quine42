from common import module
A=lambda i,l,r=None: dict(id=i,label=l,**({"requires":r} if r else {}))
module('obj.cassaforte-combinazione',{"name":"Cassaforte a combinazione","kind":"entity",
"description":"Una cassaforte di ghisa annerita con una manopola a dodici tacche e una maniglia d'ottone. Chi ascolta bene sente lo scatto delle tacche giuste.",
"context":"magazzini, fonderie, uffici delle corporazioni",
"appearance":{"model":"cassaforte-ghisa","classe":"mobile","glyph":"■","color":"#3e4248","aspetto":"una cassaforte di ghisa scura con una manopola rotonda a tacche, una maniglia d'ottone e i rivetti sugli spigoli"},
"physics":{"solid":True,"radius":0.45},"tags":["cassaforte","ghisa","metallo"],
"components":{"combinazione":{"tacca":0,"giusti":0,"aperta":False,"tentativi":0}},
"interaction":{"type":"lua"},
"actions":[A('destra','Gira la manopola a destra'),A('sinistra','Gira la manopola a sinistra'),A('ascolta','Appoggia l\'orecchio'),A('maniglia','Tira la maniglia')]},r'''
-- Cassaforte a combinazione: tre numeri da dodici tacche, fissati dal luogo. Si gira la manopola, si ascolta
-- lo scatto quando la tacca è giusta, si tira la maniglia per fissarla. Tre tacche giuste e si apre.
-- Aperta, diventa un contenitore (bottino «cassaforte»); quella della fonderia vecchia custodisce un brevetto.
local M = {}

local function numeri(id)
  local o = ecs.get(id, "origin")
  local k = o and o.key or tostring(id)
  local h = 7
  for i = 1, #k do h = (h * 33 + string.byte(k, i)) % 1000003 end
  return { math.floor(hash(h, 11) * 12), math.floor(hash(h, 12) * 12), math.floor(hash(h, 13) * 12) }
end

local function giusta(id, c)
  local n = numeri(id)
  return c.tacca == n[(c.giusti or 0) + 1]
end

function M.on_interact(id, user)
  local c = ecs.get(id, "combinazione")
  if not c then return "Una cassaforte." end
  if c.aperta then
    world.open(id)
    return "Lo sportello pesante si apre sui cardini unti."
  end
  return "La manopola è sulla tacca " .. c.tacca .. ". Numeri già fissati: " .. (c.giusti or 0) .. " su tre."
end

function M.on_act(id, user, action)
  local c = ecs.get(id, "combinazione")
  if not c then return "La cassaforte non si muove." end
  if c.aperta then return M.on_interact(id, user) end
  if action == "destra" then
    c.tacca = (c.tacca + 1) % 12
    return "Clic. Tacca " .. c.tacca .. "."
  elseif action == "sinistra" then
    c.tacca = (c.tacca + 11) % 12
    return "Clic. Tacca " .. c.tacca .. "."
  elseif action == "ascolta" then
    local st = ecs.get(user, "stati")
    if giusta(id, c) then
      if st and st["calamitato"] then return "Senti uno scatto netto, e la limatura che hai addosso trema verso la manopola: questa tacca è giusta." end
      return "Dentro, uno scatto sordo: questa tacca è giusta."
    end
    return "Solo il fruscio della manopola."
  elseif action == "maniglia" then
    c.tentativi = (c.tentativi or 0) + 1
    if not giusta(id, c) then
      c.giusti = 0
      return "La maniglia non cede, e senti le tacche già fissate ricadere giù. Si ricomincia."
    end
    c.giusti = (c.giusti or 0) + 1
    if c.giusti < 3 then return "La maniglia scende di un dente: " .. c.giusti .. " numeri fissati." end
    c.aperta = true
    world.make_container(id, 8, "cassaforte")
    local o = ecs.get(id, "origin")
    if o and o.key and string.find(o.key, "^0,%-2#") and not c.brevetto then
      c.brevetto = true
      inventory.add(user, "item.brevetto-lenti", 1)
      world.open(id)
      return "CLONK. Lo sportello si apre: sopra i lingotti c'è una cartella di fogli bruciacchiati, con la firma di Amedeo Lenti."
    end
    world.open(id)
    return "CLONK. Lo sportello si apre con un sospiro d'aria vecchia."
  end
  return M.on_interact(id, user)
end

return M
''')
module('obj.lampione-gas',{"name":"Lampione a gas","kind":"entity",
"description":"Un lampione di ghisa con la lanterna di vetro giallo: il lampionaio lo accende di sera; una scintilla basta a riaccenderlo.",
"context":"strade, piazze, banchine e giardini delle Città del Vapore",
"appearance":{"model":"lampione-gas","classe":"monumento","glyph":"ǐ","color":"#2e3236","aspetto":"un lampione di ghisa nera alto e sottile con una lanterna di vetro giallo in cima"},
"physics":{"solid":True,"radius":0.25},"tags":["lampione","ghisa","luce"],
"components":{"lampione":{"rotto":False,"acceso_a_mano":False},"luce":{"raggio":4,"accesa":False,"colore":"#ffcf70"}},
"interaction":{"type":"lua"},
"actions":[A('accendi','Accendi il becco'),A('spegni','Chiudi il gas'),A('ripara','Pulisci il vetro','item.straccio')]},r'''
-- Lampione a gas: la luce è il componente noto luce {raggio, accesa, colore}; sys.meccanismi lo accende di sera.
local M = {}

function M.on_interact(id, user)
  local luce = ecs.get(id, "luce")
  local l = ecs.get(id, "lampione")
  if l and l.rotto then return "Il vetro è nero di fuliggine: non fa luce." end
  if luce and luce.accesa then return "La fiamma blu e gialla sibila dentro il vetro." end
  return "Il becco è spento. Si sente l'odore del gas."
end

function M.on_act(id, user, action)
  local luce = ecs.get(id, "luce")
  local l = ecs.get(id, "lampione")
  if not luce or not l then return "Il lampione non risponde." end
  if action == "accendi" then
    if l.rotto then return "Prima bisogna pulire il vetro." end
    luce.accesa = true
    l.acceso_a_mano = true
    return "Apri il rubinetto e accosti un fiammifero: il lampione si accende con un piccolo soffio."
  elseif action == "spegni" then
    luce.accesa = false
    l.acceso_a_mano = false
    local st = ecs.get(user, "stati")
    if st and st["nella fuliggine"] then return "Spegni il lampione: coperto di fuliggine come sei, il buio ti nasconde del tutto." end
    return "Chiudi il gas. La strada si fa scura."
  elseif action == "ripara" then
    inventory.remove(user, "item.straccio", 1)
    l.rotto = false
    return "Strofini il vetro con lo straccio: torna giallo e pulito."
  end
  return M.on_interact(id, user)
end

return M
''')
module('obj.bacheca-corporazione',{"name":"Bacheca delle corporazioni","kind":"entity",
"description":"Una bacheca di legno con la tettoia di lamiera, coperta di avvisi delle corporazioni: turni, prezzi della Pesa, offerte di lavoro, ricompense.",
"context":"piazze, vicoli, banchine",
"appearance":{"model":"bacheca-corporazione","classe":"monumento","glyph":"▥","color":"#8a6a44","aspetto":"una bacheca di legno scuro con una tettoia di lamiera e fogli di carta appuntati"},
"physics":{"solid":True,"radius":0.4},"tags":["bacheca","legno","avvisi"],
"components":{"bacheca":{"letti":0,"affissi":0}},
"interaction":{"type":"lua"},
"actions":[A('leggi','Leggi gli avvisi'),A('lavoro','Cerca lavoro'),A('affiggi','Appendi un avviso','item.capsula-pneumatica')]},r'''
-- Bacheca delle corporazioni: gli avvisi cambiano col giorno; chi cerca lavoro trova da fare (e una paga).
local M = {}

local AVVISI = {
  "GILDA DEI CALDAISTI: lunedì riunione nel vicolo. Dieci ore, due valvole. Chi è con noi porti il carbone.",
  "CASA RAMELLI: cercasi colatori esperti per il turno di notte. Paga doppia, nessuna domanda.",
  "COMPAGNIA DELLA FERROVIA SOSPESA: chi trova i ladri di rame dei cavi avrà un anno di biglietti gratis.",
  "BOTTEGA VITTI: taratura dei manometri, un soldo l'uno. Quelli della fonderia nuova, due.",
  "TORRE D'ORMEGGIO: la Rondine cerca un tubo di rame e un mozzo che non abbia paura del fuoco.",
  "MINIERE DI SOLFARA: vietato scendere oltre il cunicolo sedici, per ordine del caposquadra Sbarra.",
  "LA PESA GRANDE: oricalco in calo per la terza settimana. Ciok Ciok dice che risale. Ciok Ciok dice tante cose.",
}

local LAVORI = {
  { "item.carbone", 2, "Porti due sacchi di carbone alle caldaie del vicolo: il caldaista ti paga in carbone." },
  { "item.soldo-rame", 3, "Aiuti a scaricare un carro di lingotti al porto: tre soldi di rame." },
  { "item.pane-nero", 1, "Spazzi la pensilina dello scalo: il capostazione ti dà un pane nero." },
}

local function giorno() return math.floor(time / 600) end

function M.on_interact(id, user)
  return M.on_act(id, user, "leggi")
end

function M.on_act(id, user, action)
  local b = ecs.get(id, "bacheca")
  if not b then return "La bacheca è vuota." end
  if action == "leggi" then
    b.letti = (b.letti or 0) + 1
    local i = (giorno() + b.letti + math.floor(hash(id, 3) * #AVVISI)) % #AVVISI + 1
    return AVVISI[i]
  elseif action == "lavoro" then
    if (b.lavoro or -1) == giorno() then return "Per oggi gli avvisi di lavoro sono già stati presi. Torna domani." end
    b.lavoro = giorno()
    local l = LAVORI[math.floor(hash(id, giorno()) * #LAVORI) + 1]
    inventory.add(user, l[1], l[2])
    return l[3]
  elseif action == "affiggi" then
    inventory.remove(user, "item.capsula-pneumatica", 1)
    b.affissi = (b.affissi or 0) + 1
    return "Appendi il foglio che c'era nella capsula. Domani qualcuno lo leggerà ad alta voce, come si usa: pesare in piazza."
  end
  return M.on_interact(id, user)
end

return M
''')
module('item.chiave-inglese',{"name":"Chiave inglese","kind":"item",
"description":"Una chiave inglese di ferro con la ganascia regolabile e il manico consumato. Impugnala e premi F davanti a una caldaia, una valvola o un guardiano d'ottone.",
"context":"vicoli dei caldaisti, officine, rimesse",
"appearance":{"model":"chiave-inglese","classe":"oggetto","glyph":"⚒","color":"#8a8e96","aspetto":"una chiave inglese di ferro con la ganascia regolabile e il manico consumato"},
"physics":{"solid":False,"radius":0.2},"tags":["attrezzo","metallo","officina"],
"item":{"stackable":False,"maxStack":1,"weight":1.2,"equippable":True,"controls":{"azione":"stringe, svita, carica le molle di ciò che hai davanti"}}},r'''
-- Chiave inglese: stringe i bulloni delle caldaie, sfoga le valvole, carica la molla dei guardiani d'ottone.
local M = {}

function M.on_action(user, target, item)
  if not target then return "Fai girare la ganascia a vuoto: clic, clic." end
  local a = ecs.get(target, "automa")
  if a then
    a.carica = 100
    return "Infili la chiave nella schiena del guardiano e giri: la molla si carica, gli occhi di vetro si riaccendono."
  end
  local c = ecs.get(target, "caldaia")
  if c then
    if (c.pressione or 0) > 9 then
      c.pressione = c.pressione - 2
      return "Stringi i bulloni del coperchio che fischiava: la caldaia si calma un poco."
    end
    return "Stringi un bullone allentato. La caldaia ronza, soddisfatta."
  end
  local v = ecs.get(target, "valvola")
  if v then
    v.tarata = true
    return "Dai un colpo di chiave al raccordo del manometro: la lancetta salta e si mette a posto."
  end
  local r = ecs.get(target, "ruote")
  if r then return "Le ruote dentate non si forzano con la chiave: bisogna girarle una per una." end
  if world.has_tag(target, "metallo") then return "Stringi tutto quello che c'è da stringere. Ora non cigola più." end
  return "La chiave non trova niente da stringere."
end

return M
''')
