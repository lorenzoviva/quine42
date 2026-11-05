-- Telescopio: il cielo cambia a ogni turno; chi annota la cometa ne ricava una carta stellare, una per telescopio.
local M = {}
local CIELO = {
  "La stella arancione è bassa e grande. Davanti le passa uno sciame di sassi, lento.",
  "La cometa ha la coda lunga stanotte: punta dritta verso le gallerie.",
  "Una stazione lontana brilla come una stella che si muove.",
  "Il cielo è pieno di polvere: si vede solo la stella, rossa come una brace.",
}

function M.on_act(id, user, action)
  if action == "osserva" then
    return CIELO[math.floor(hash(id, math.floor(time / 45)) * #CIELO) + 1]
  elseif action == "annota" then
    local t = ecs.get(id, "telescopio") or {}
    if t.annotata then return "Hai già ricopiato questa notte di cielo: il taccuino è pieno di croci." end
    inventory.remove(user, "item.taccuino", 1)
    inventory.add(user, "item.carta-stellare", 1)
    t.annotata = true
    ecs.set(id, "telescopio", t)
    return "Segni la cometa tra le stelle, una croce dopo l'altra. Ora hai la tua carta stellare."
  end
  return nil
end

return M
