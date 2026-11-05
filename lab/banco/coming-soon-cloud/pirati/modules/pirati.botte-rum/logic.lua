-- Botte di rum: ne escono sei fiaschi; bussando si sente quanto ne resta.
local M = {}

local function botte(id) return ecs.get(id, "botte") or { fiaschi = 6 } end

function M.on_act(id, user, action)
  local b = botte(id)
  if action == "spilla" then
    if b.fiaschi <= 0 then return "Dalla spina esce solo una goccia e un odore dolce." end
    b.fiaschi = b.fiaschi - 1
    ecs.set(id, "botte", b)
    inventory.add(user, "item.rum", 1)
    return "Il rum scende scuro e lento nel fiasco."
  elseif action == "bussa" then
    if b.fiaschi >= 5 then return "Un suono sordo, pieno: la botte è quasi colma." end
    if b.fiaschi >= 2 then return "Un suono a metà: ne resta per qualche sera." end
    if b.fiaschi >= 1 then return "Un suono vuoto, con un fondo di rum." end
    return "La botte rimbomba come un tamburo: è vuota."
  elseif action == "rabbocca" then
    if b.fiaschi >= 6 then return "La botte è piena fino al tappo." end
    inventory.remove(user, "item.melassa", 1)
    b.fiaschi = math.min(6, b.fiaschi + 2)
    ecs.set(id, "botte", b)
    return "Versi la melassa e richiudi: tra qualche giorno sarà rum."
  end
  return nil
end

return M
