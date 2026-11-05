-- Faro di telemetria: lampeggia, conta i propri silenzi (quando la brina si posa sui cristalli, o quando la cabina scende).
-- Stato nel componente "faro"; la luce nel componente "luce". sys.cordone lo fa tremolare.
local M = {}

local function f(id)
  local v = ecs.get(id, "faro")
  if not v then v = { silenzi = 0, ultimo = 0 }; ecs.set(id, "faro", v) end
  return v
end

local function freddo_attorno(id)
  local p = ecs.get(id, "pos")
  if not p then return 0 end
  local n = 0
  for dy = -2, 2 do
    for dx = -2, 2 do
      local t = world.tile(p.x + dx, p.y + dy)
      if t == "n" or t == "r" then n = n + 1 end
    end
  end
  return n
end

function M.on_act(id, user, action)
  local v = f(id)
  local l = ecs.get(id, "luce")
  if action == "leggi" then
    local spento = l and not l.accesa
    local drone = world.nearest(ecs.get(id, "pos").x, ecs.get(id, "pos").y, 8, "drone")
    local righe = "Sul piccolo schermo scorrono le posizioni: tre navette in rotta, " .. (drone and "un drone vicino, in volo basso" or "nessun drone nei paraggi") .. "."
    if spento then righe = righe .. " Il faro è muto: l'ultimo segnale è di poco fa." end
    if freddo_attorno(id) > 6 then
      v.silenzi = v.silenzi + 1
      righe = righe .. " Il registro segna " .. v.silenzi .. " silenzi: tutti quando la brina si posa sui cristalli qui attorno."
    end
    return righe
  end
  if action == "accendi" then
    if l then l.accesa = true end
    v.ultimo = time
    return "Premi il pulsante sotto il treppiede: la luce ambra torna a girare e l'antenna fischia due volte."
  end
  if action == "ripara" then
    inventory.remove(user, items.find("Filo superconduttore"), 1)
    if l then l.accesa = true; l.raggio = 4 end
    v.silenzi = 0
    return "Avvolgi un filo nuovo attorno all'antenna: il faro risponde più forte, e la torre della Gilda ringrazia con tre lampi."
  end
end

return M
