-- Drone da ricognizione: vola (sys.wander lo muove), consuma batteria (sys.cordone la scala), porta pacchi.
local M = {}

local function d(id)
  local v = ecs.get(id, "drone")
  if not v then v = { batteria = 100, consegne = 0, pacco = false }; ecs.set(id, "drone", v) end
  return v
end

function M.on_spawn(id)
  local v = d(id)
  v.batteria = 40 + math.floor(hash(id, 9) * 60)
  local w = ecs.get(id, "wander")
  if w then w.speed = 1.8 + hash(id, 4) * 1.2 end
end

function M.on_act(id, user, action)
  local v = d(id)
  if action == "stato" then
    local b = math.floor(v.batteria)
    if b < 15 then return "La spia è rossa e lampeggia: batteria " .. b .. ". Il drone scende a terra e aspetta una cella." end
    return "La spia è azzurra: batteria " .. b .. ", " .. v.consegne .. " consegne fatte" .. (v.pacco and ", un pacco a bordo." or ".")
  end
  if action == "carica" then
    inventory.remove(user, items.find("Cella energetica"), 1)
    v.batteria = 100
    local w = ecs.get(id, "wander")
    if w then w.speed = 2.4 end
    return "Sfili la cella scarica e infili quella nuova: le eliche ronzano più forte, il drone fa un giro di festa."
  end
  if action == "affida" then
    if v.pacco then return "Il drone ha già un pacco agganciato sotto la pancia." end
    v.pacco = true
    return "Agganci un pacco sotto la pancia del drone. Lo porterà dove lo porta il vento e i fari."
  end
  if action == "ritira" then
    if not v.pacco then
      if hash(id, math.floor(time / 30), 2) < 0.5 then
        inventory.add(user, items.find("Borraccia d'acqua filtrata"), 1)
        return "Dal gancio pende una borraccia che qualcuno ha dimenticato di ritirare. Ora è tua."
      end
      return "Il gancio è vuoto."
    end
    v.pacco = false
    v.consegne = v.consegne + 1
    inventory.add(user, items.find("Cella energetica"), 1)
    return "Stacchi il pacco: dentro c'è una cella energetica, il compenso per la consegna."
  end
end

return M
