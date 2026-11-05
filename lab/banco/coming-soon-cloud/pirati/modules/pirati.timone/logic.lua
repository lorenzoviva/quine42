-- Ruota del timone: ogni giro sposta la barra di un quarto di vento; la rotta resta finché qualcuno non la cambia.
local M = {}
local ROTTE = { "nord", "nord-est", "est", "sud-est", "sud", "sud-ovest", "ovest", "nord-ovest" }

local function barra(id) return ecs.get(id, "timone") or { rotta = 1 } end

function M.on_act(id, user, action)
  local t = barra(id)
  if action == "babordo" then
    t.rotta = (t.rotta - 2) % #ROTTE + 1
  elseif action == "tribordo" then
    t.rotta = t.rotta % #ROTTE + 1
  elseif action ~= "barra" then
    return nil
  end
  ecs.set(id, "timone", t)
  if action == "barra" then return "La barra punta a " .. ROTTE[t.rotta] .. "." end
  return "La ruota gira con un cigolio di cime. Ora la prua guarda a " .. ROTTE[t.rotta] .. "."
end

return M
