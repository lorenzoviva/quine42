-- Tavolo del cartografo: ogni tavolo ha la sua carta (il seme è l'entità), e se ne può fare una copia sola.
local M = {}
local CARTE = {
  "Una carta della laguna: le secche sono segnate con puntini, e una croce sbiadita sta dove l'acqua è più chiara.",
  "Una carta del forte: le batterie di cannoni sono numerate, una manca all'appello.",
  "Una carta delle grotte: il cartografo ha scritto «solo con la bassa marea» accanto a un cunicolo.",
  "Una carta della Secca della Sabbia Bianca: tre relitti, e una pozza d'acqua dolce disegnata con cura.",
}

function M.on_act(id, user, action)
  local i = math.floor(hash(id) * #CARTE) + 1
  if action == "studia" then return CARTE[i] end
  if action == "ricopia" then
    local t = ecs.get(id, "tavolo") or {}
    if t.copiata then return "Questa carta l'hai già ricopiata: il foglio è consumato dal carboncino." end
    inventory.remove(user, "item.carboncino", 1)
    inventory.add(user, "item.mappa-tesoro", 1)
    t.copiata = true
    ecs.set(id, "tavolo", t)
    return "Ricopi la carta riga per riga. Ora hai la tua mappa delle secche."
  end
  return nil
end

return M
