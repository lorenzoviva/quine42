-- Bacheca delle taglie: tre manifesti per bacheca, decisi dal seme dell'entità; ogni manifesto si riscuote una volta.
local M = {}
local TAGLIE = {
  "«Ladro di manzi del Pascolo Alto: 20 dollari. Si fa chiamare il Gufo.»",
  "«Chi ha preso la cassa della diligenza di primavera: 50 dollari, o una buona notizia.»",
  "«Venditore di pepite false, baffi tinti: 10 dollari.»",
  "«Cavallo pezzato scappato dal ranch: 5 dollari a chi lo riporta.»",
  "«Ladro di galline della piana: 3 dollari e una gallina.»",
}

function M.on_act(id, user, action)
  local b = ecs.get(id, "bacheca") or { staccati = 0, riscossi = 0 }
  if action == "leggi" then
    local i = math.floor(hash(id, b.staccati) * #TAGLIE) + 1
    return TAGLIE[i]
  elseif action == "stacca" then
    if b.staccati >= 3 then return "Sulla bacheca restano solo i chiodi: i manifesti li hai staccati tutti." end
    b.staccati = b.staccati + 1
    ecs.set(id, "bacheca", b)
    inventory.add(user, "item.manifesto", 1)
    return "Stacchi un manifesto e lo pieghi in quattro nella tasca."
  elseif action == "riscuoti" then
    if b.riscossi >= b.staccati then return "Lo sceriffo guarda il manifesto: «Questo non è di qui, forestiero.»" end
    inventory.remove(user, "item.manifesto", 1)
    b.riscossi = b.riscossi + 1
    ecs.set(id, "bacheca", b)
    inventory.add(user, "item.dollaro", 5)
    return "Lo sceriffo conta cinque dollari d'argento sul bancone: «Lavoro pulito. Grazie.»"
  end
  return nil
end

return M
