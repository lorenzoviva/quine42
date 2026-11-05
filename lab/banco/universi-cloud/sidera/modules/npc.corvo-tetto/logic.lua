-- Corvo di tetto: briciole e cose lucide; ogni tanto lascia cadere qualcosa dal becco.
local M = {}

local function c(id)
  local v = ecs.get(id, "corvo")
  if not v then v = { bottino = 0 }; ecs.set(id, "corvo", v) end
  return v
end

function M.on_act(id, user, action)
  local v = c(id)
  if action == "briciole" then
    inventory.remove(user, items.find("Pane d'alghe"), 1)
    local mind = ecs.get(id, "mind")
    if mind then mind.mode = "segui" end
    return "(becca le briciole in fretta, poi saltella dietro di te gracchiando piano)"
  end
  if action == "lucido" then
    v.bottino = v.bottino + 1
    if v.bottino >= 2 then
      v.bottino = 0
      local g = items.find("Gettone della cabina")
      if g then inventory.add(user, g, 1) end
      return "(fissa la spia verde della cella, gracchia, vola via e torna con un gettone d'ottone che ti lascia cadere sulla scarpa)"
    end
    return "(inclina la testa, gli occhi neri fissi sulla spia verde; gracchia una volta)"
  end
  if action == "guarda" then
    if hash(id, math.floor(time / 60), 3) < 0.4 then return "(nel becco ha un anellino di filo superconduttore, che non ti darà)" end
    return "(il becco è vuoto, ma ti guarda come chi sa dove sono le cose lucide)"
  end
end

return M
