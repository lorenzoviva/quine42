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
