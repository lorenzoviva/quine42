from common import module
A=lambda i,l,r=None: dict(id=i,label=l,**({"requires":r} if r else {}))
module('npc.automa-guardia',{"name":"Guardiano d'ottone","kind":"entity",
"description":"Un automa a molla di ottone e ghisa, alto come un uomo, con gli occhi di vetro verde e una chiave nella schiena: fa la ronda attorno ai magazzini della Casa Ramelli finché la molla è carica.",
"context":"magazzini e fonderie della Casa Ramelli",
"appearance":{"model":"automa-ottone","classe":"persona","glyph":"Ä","color":"#c8a04a","aspetto":"un automa d'ottone e ghisa con il corpo a botte, gli occhi di vetro verde e una grossa chiave nella schiena"},
"physics":{"solid":True,"radius":0.4,"speed":0.9},"tags":["automa","metallo","ottone","guardiano"],
"components":{"wander":{"dx":0,"dy":0,"t":0,"speed":0.9},"automa":{"carica":80,"fermo":False,"allarmi":0}},
"interaction":{"type":"lua"},
"actions":[A('carica','Carica la molla','item.chiave-inglese'),A('saluta','Saluta il guardiano'),A('mostra','Mostra un lingotto d\'oricalco','item.lingotto-oricalco')]},r'''
-- Guardiano d'ottone: cammina finché la molla è carica (sys.meccanismi la scarica); vede chi passa,
-- tranne chi è coperto di fuliggine; ferma chi porta via lingotti.
local M = {}

local function vede(user)
  local st = ecs.get(user, "stati")
  return not (st and st["nella fuliggine"])
end

function M.on_spawn(id)
  local a = ecs.get(id, "automa")
  if a then a.carica = 60 + math.floor(hash(id, 3) * 40) end
end

function M.on_interact(id, user)
  local a = ecs.get(id, "automa")
  if not a then return "Un mucchio di ottone fermo." end
  if (a.carica or 0) <= 0 then return "Il guardiano è fermo, la testa china: la molla è scarica." end
  if not vede(user) then return "Il guardiano gira la testa di qua e di là, con un ronzio. Non ti vede: sei nero di fuliggine come il muro." end
  local st = ecs.get(user, "stati")
  if st and st["calamitato"] then return "Il guardiano si inclina verso di te, tirato dalla limatura che hai addosso: «CLANG. Ferro. Ferro. Allontanarsi.»" end
  return "«TIC-TAC. Magazzini Ramelli. Proseguire.» Gli occhi verdi ti seguono finché non te ne vai."
end

function M.on_act(id, user, action)
  local a = ecs.get(id, "automa")
  if not a then return "Il guardiano non risponde." end
  if action == "carica" then
    a.carica = 100
    a.fermo = false
    return "Giri la grossa chiave nella schiena: crr, crr, crr. Gli occhi verdi si riaccendono e il guardiano riparte."
  elseif action == "saluta" then
    if (a.carica or 0) <= 0 then return "Il guardiano non risponde: è scarico." end
    if not vede(user) then return "Saluti, ma il guardiano guarda attraverso di te." end
    return "Il guardiano alza un braccio di ottone, piano, e lo riabbassa: «TIC. Buona giornata. TAC.»"
  elseif action == "mostra" then
    if (a.carica or 0) <= 0 then return "Il guardiano è scarico: non vede il lingotto." end
    if not vede(user) then return "Il lingotto luccica, ma il guardiano non ti vede nemmeno." end
    a.allarmi = (a.allarmi or 0) + 1
    world.speak(id, "DRIN DRIN DRIN!")
    return "«LINGOTTO. CASA RAMELLI. DICHIARARE LA PROVENIENZA.» Un campanello suona dentro il petto del guardiano."
  end
  return M.on_interact(id, user)
end

return M
''')
module('npc.gatto-fabbrica','Gatto di fabbrica' and {"name":"Gatto di fabbrica","kind":"entity",
"description":"Un gatto delle fonderie e degli scali, che dorme sui lingotti tiepidi e viaggia sui vagoni del minerale.",
"context":"fonderie, scali, magazzini",
"appearance":{"model":"animale","glyph":"c","color":"#a8442a","aspetto":"un gatto magro dal pelo rosso ruggine o nero, con le zampe sporche di fuliggine"},
"physics":{"solid":False,"radius":0.25,"speed":2.4},"tags":["animale","gatto"],
"components":{"wander":{"dx":0,"dy":0,"t":0,"speed":2.4},"fusa":{"carezze":0}},
"interaction":{"type":"talk"},
"persona":"Sei un gatto di fabbrica delle Città del Vapore. Rispondi solo con versi, fusa e azioni descritte tra parentesi. Ami il calore dei forni e delle caldaie, cacci topi tra i lingotti e i binari, segui chi ti dà da mangiare, se ne hai voglia.",
"actions":[A('accarezza','Accarezza il gatto'),A('salsiccia','Dai un pezzo di salsiccia','item.salsiccia')]},r'''
-- Gatto di fabbrica: fusa contate nel componente; con la salsiccia ti segue (mind.mode = "segui", sys.follow).
local M = {}

function M.on_spawn(id)
  local w = ecs.get(id, "wander")
  if w then w.speed = 2 + hash(id, 7) * 0.8 end
end

function M.on_act(id, user, action)
  local f = ecs.get(id, "fusa")
  if not f then
    ecs.set(id, "fusa", { carezze = 0 })
    f = ecs.get(id, "fusa")
  end
  if action == "accarezza" then
    f.carezze = (f.carezze or 0) + 1
    local st = ecs.get(user, "stati")
    if st and st["nel vapore"] then return "(il gatto si strofina contro le tue gambe tiepide di vapore e fa le fusa forte, come una caldaia contenta)" end
    if f.carezze > 3 then return "(il gatto si rotola sulla schiena e ti mostra la pancia sporca di fuliggine) Rrrrr." end
    return "(il gatto chiude gli occhi e fa le fusa) Rrrr."
  elseif action == "salsiccia" then
    inventory.remove(user, "item.salsiccia", 1)
    local m = ecs.get(id, "mind")
    if m then m.mode = "segui" end
    return "(il gatto mangia la salsiccia in tre morsi, poi si mette a trotterellare dietro di te) Miao."
  end
  return "(il gatto ti guarda, sbadiglia e si lecca una zampa)"
end

return M
''')
