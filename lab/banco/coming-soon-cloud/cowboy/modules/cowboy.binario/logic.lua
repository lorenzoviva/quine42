-- Banchina della stazione: il treno passa a ore fisse del giorno (il tempo del mondo), ma sempre con un po' di ritardo.
local M = {}
local PERIODO = 120

local function prossimo()
  local t = time % PERIODO
  return math.floor(PERIODO - t)
end

function M.on_act(id, user, action)
  if action == "orario" then
    return "Sul palo c'è scritto «un treno all'alba e uno al tramonto». Sotto, a matita: «più o meno»."
  elseif action == "aspetta" then
    local s = prossimo()
    if s < 20 then return "Un fischio lontano, poi il fumo dietro la collina: il treno arriva, in ritardo come sempre." end
    return "Il binario è vuoto e caldo. Il capotreno, se ci fosse, direbbe: ancora " .. s .. " respiri."
  elseif action == "biglietto" then
    inventory.remove(user, "item.dollaro", 1)
    inventory.add(user, "item.biglietto", 1)
    return "Il cartoncino passa dalla finestrella con un colpo di punzone."
  elseif action == "campana" then
    local c = ecs.get(id, "campana") or { rintocchi = 0 }
    c.rintocchi = c.rintocchi + 1
    ecs.set(id, "campana", c)
    if c.rintocchi % 3 == 0 then return "Tre rintocchi: alla stazione vuol dire che qualcuno deve partire." end
    return "La campana suona, e un cane abbaia in fondo alla strada."
  end
  return nil
end

return M
