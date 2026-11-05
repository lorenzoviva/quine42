-- Estrattore di plasma: si pompa per alzare la pressione, si imbottiglia quando è piena; a volte si inceppa.
local M = {}

local function e(id)
  local v = ecs.get(id, "estrattore")
  if not v then v = { pressione = 0, inceppato = false, ultima = 0 }; ecs.set(id, "estrattore", v) end
  return v
end

function M.on_act(id, user, action)
  local v = e(id)
  if action == "sblocca" then
    v.inceppato = false
    return "Allenti tre bulloni, ne stringi due: i pistoni ripartono con un colpo di tosse."
  end
  if v.inceppato then return "I pistoni sono bloccati e il serbatoio fischia. Serve una chiave dinamometrica." end
  if action == "pompa" then
    v.pressione = math.min(100, v.pressione + 25)
    v.ultima = time
    local n = ecs.get(user, "needs")
    if n then n.energy = math.max(0, n.energy - 3) end
    -- Ogni tanto si inceppa: dipende dal pezzo e dal momento, sempre uguale per tutti.
    if hash(id, math.floor(time / 10), 7) < 0.2 then
      v.inceppato = true
      return "Il pistone si pianta a metà corsa con un clangore. Inceppato."
    end
    return "I pistoni salgono e scendono: il plasma risale azzurro nel serbatoio. Pressione " .. v.pressione .. "."
  end
  if action == "imbottiglia" then
    if v.pressione < 50 then return "Il serbatoio è mezzo vuoto: pompa ancora un po'." end
    v.pressione = v.pressione - 50
    inventory.add(user, items.find("Bottiglia di plasma"), 1)
    return "Una bottiglia magnetica si riempie di plasma azzurro e si sigilla con uno scatto."
  end
end

return M
