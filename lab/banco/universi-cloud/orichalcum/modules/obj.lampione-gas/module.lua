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
