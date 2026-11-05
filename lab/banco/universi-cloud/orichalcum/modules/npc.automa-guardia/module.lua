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
