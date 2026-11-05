-- Serbatoio d'ossigeno: cinque bombole e poi è vuoto; una boccata non si nega a nessuno e non si conta.
local M = {}

local function serbatoio(id) return ecs.get(id, "serbatoio") or { bombole = 5 } end

function M.on_act(id, user, action)
  local s = serbatoio(id)
  if action == "riempi" then
    if s.bombole <= 0 then return "Il rubinetto sputa un filo d'aria e si ferma: il serbatoio è vuoto." end
    inventory.remove(user, "item.bombola-vuota", 1)
    inventory.add(user, "item.bombola-ossigeno", 1)
    s.bombole = s.bombole - 1
    ecs.set(id, "serbatoio", s)
    return "La bombola si riempie con un fischio lungo e si fa fredda tra le mani."
  elseif action == "manometro" then
    if s.bombole >= 4 then return "L'ago è sul verde: il serbatoio è quasi pieno." end
    if s.bombole >= 1 then return "L'ago è a metà: ne restano " .. s.bombole .. " bombole." end
    return "L'ago è sul rosso. Qualcuno dovrà chiamare la navetta dei rifornimenti."
  elseif action == "respira" then
    return "Apri la valvola per un istante: l'aria è fredda e sa di metallo, ma è buona."
  end
  return nil
end

return M
