-- Pozzo: la sua voce è scritta qui, non nel gateway.
local M = {}

local ECHI = {
  "Getti un sassolino nel pozzo. Non senti il tonfo.",
  "Nel riflesso dell'acqua scorrono caratteri: «... carpet . rate ...».",
  "Dal fondo sale un'eco: «la x... dice dove sei davvero...».",
  "Il pozzo ti restituisce il tuo volto. È al centro. È sempre al centro.",
  "Senti un ronzio regolare, come di un nastro che gira sotto il mondo.",
}

function M.on_interact(id)
  return ECHI[math.floor(hash(id, math.floor(time)) * #ECHI) + 1]
end

return M
