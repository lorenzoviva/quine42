-- Pappagallo: ripete l'ultima parola che ha imparato; con una galletta in pancia ne impara un'altra.
local M = {}
local PAROLE = { "Bonombo!", "Rum! Rum!", "Terra a prua!", "Lerpio! Lerpio!", "Ammaina!", "Dobloni!", "Bonombo bonombo!" }

local function becco(id) return ecs.get(id, "pappagallo") or { parola = 1, sazio = false } end

function M.on_interact(id, user)
  local b = becco(id)
  return "Il pappagallo piega la testa e strilla: «" .. PAROLE[b.parola] .. "»"
end

function M.on_act(id, user, action)
  local b = becco(id)
  if action == "nutri" then
    inventory.remove(user, "item.galletta", 1)
    b.sazio = true
    ecs.set(id, "pappagallo", b)
    return "Il pappagallo sbriciola la galletta e ti guarda con un occhio solo, attento."
  elseif action == "insegna" then
    if not b.sazio then return "Il pappagallo ti volta le spalle: a pancia vuota non impara niente." end
    b.parola = (b.parola % #PAROLE) + 1
    b.sazio = false
    ecs.set(id, "pappagallo", b)
    return "Ripeti la parola dieci volte. Alla decima il pappagallo strilla: «" .. PAROLE[b.parola] .. "»"
  end
  return nil
end

return M
