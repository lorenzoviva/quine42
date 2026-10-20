-- Pozzo: acqua per chi ha un secchio, un'eco per chi ascolta.
local M = {}

local ECHI = {
  "Dal fondo sale un'eco: «la x... dice dove sei davvero...».",
  "Il pozzo ti restituisce il tuo volto. È al centro. È sempre al centro.",
  "Senti un ronzio regolare, come di un nastro che gira sotto il mondo.",
  "Nel riflesso dell'acqua scorrono caratteri: «... carpet . rate ...».",
}

function M.on_act(id, user, action)
  if action == "attingi" then
    local otre = items.find("Otre d'acqua")
    if otre then inventory.add(user, otre, 1) end
    return "Il secchio risale pieno. Riempi un otre d'acqua fresca."
  end
  if action == "moneta" then
    inventory.remove(user, items.find("Moneta di rame"), 1)
    return "La moneta cade a lungo. Non senti il tonfo. Poi, dietro di te, un tintinnio."
  end
  return ECHI[math.floor(hash(id, math.floor(time)) * #ECHI) + 1]
end

return M
