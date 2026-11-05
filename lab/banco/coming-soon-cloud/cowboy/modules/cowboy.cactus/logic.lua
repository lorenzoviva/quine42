-- Cactus della piana: un fico per volta, poi bisogna aspettare che il sole ne maturi un altro.
local M = {}
local MATURAZIONE = 60

function M.on_act(id, user, action)
  local c = ecs.get(id, "cactus") or { colto = -1000 }
  if action == "raccogli" then
    if time - c.colto < MATURAZIONE then return "I fichi rimasti sono ancora verdi e duri." end
    c.colto = time
    ecs.set(id, "cactus", c)
    inventory.add(user, "item.fico-india", 1)
    return "Stacchi un fico rosso con il fazzoletto, attento alle spine."
  elseif action == "tocca" then
    return "Ahi. Le spine sono sottili come aghi e restano nel dito per un pezzo."
  elseif action == "ombra" then
    return "L'ombra del cactus è stretta, ma basta per riprendere fiato."
  end
  return nil
end

return M
