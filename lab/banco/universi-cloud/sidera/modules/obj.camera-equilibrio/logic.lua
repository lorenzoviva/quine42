-- Camera di equilibrio: un ciclo dura dieci secondi; il gettone apre la via verso le banchine della cabina.
local M = {}

local function c(id)
  local v = ecs.get(id, "equilibrio")
  if not v then v = { ciclo = 0, pronta = true }; ecs.set(id, "equilibrio", v) end
  if not v.pronta and time - (v.ciclo or 0) > 10 then v.pronta = true end
  return v
end

function M.on_act(id, user, action)
  local v = c(id)
  if action == "ascolta" then
    if v.pronta then return "Silenzio, e una goccia che cade dal portello. La lampada è verde." end
    return "Un sibilo lungo: l'aria di dentro e quella di fuori si stanno mettendo d'accordo."
  end
  if action == "cicla" then
    if not v.pronta then return "La lampada è ancora rossa: il ciclo non è finito." end
    v.pronta = false
    v.ciclo = time
    local st = ecs.get(user, "stati")
    if st and st["alleggerito"] then return "Il portello si chiude, l'aria sibila: leggero come sei, ti senti sollevare un palmo da terra." end
    return "Il portello si chiude alle tue spalle, l'aria sibila, le orecchie si stappano. Poi la lampada torna verde."
  end
  if action == "gettone" then
    inventory.remove(user, items.find("Gettone della cabina"), 1)
    v.pronta = false
    v.ciclo = time
    return "Il gettone cade con un tintinnio d'ottone. «Banchina tre, prossima cabina tra poco», dice una voce stanca dall'altoparlante."
  end
end

return M
