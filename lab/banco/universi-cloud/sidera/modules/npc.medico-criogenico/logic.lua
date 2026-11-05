-- Medico criogenico: cura (una volta al giorno di Sidera), racconta delle capsule, e ringrazia chi porta il siero.
local M = {}

local function d(id)
  local v = ecs.get(id, "dialogo")
  if not v then v = { fase = 0, fiducia = 0, cura = -1000 }; ecs.set(id, "dialogo", v) end
  -- Il manifest dà un dialogo con fase e fiducia soltanto: il resto si aggiunge qui.
  if v.cura == nil then v.cura = -1000 end
  return v
end

function M.on_act(id, user, action)
  local v = d(id)
  if action == "cura" then
    if time - (v.cura or -1000) < 120 then return "«Ti ho già messo le mani addosso poco fa. Riposa, bevi acqua filtrata, torna domani.»" end
    v.cura = time
    local n = ecs.get(user, "needs")
    if n then n.health = math.min(100, n.health + 30) end
    local st = ecs.get(user, "stati")
    if st and st["intirizzito"] then
      st["intirizzito"] = false
      return "Ti avvolge in una coperta termica e ti massaggia le mani: il gelo del vuoto se ne va. «Nulla è una runa da pronunciare coi guanti.»"
    end
    return "Ti pulisce un taglio, ti mette un cerotto al gel e non vuole niente in cambio. «Qui si cura, non si fa il conto.»"
  end
  if action == "capsule" then
    v.fase = v.fase + 1
    if v.fase == 1 then return "«I dormienti aspettano una cura che non c'è ancora, o un viaggio troppo lungo. Il freddo li tiene come sono.»" end
    if v.fiducia >= 2 then return "Abbassa la voce. «Ce n'è uno che dorme da prima della Grande Mareggiata. Nessuno ha mai pagato per svegliarlo. Gli parlo, la sera.»" end
    return "«Le capsule vanno rabboccate di siero, sempre. Se il freddo cala, il sonno diventa un'altra cosa.»"
  end
  if action == "siero" then
    inventory.remove(user, items.find("Siero criogenico"), 1)
    v.fiducia = v.fiducia + 2
    inventory.add(user, items.find("Cerotto al gel"), 2)
    return "«Proprio quello che mi mancava. La capsula più vecchia perdeva freddo.» Ti mette in mano due cerotti al gel, per sdebitarsi."
  end
end

return M
