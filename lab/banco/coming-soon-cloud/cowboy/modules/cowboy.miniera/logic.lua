-- Ingresso della miniera: il setaccio dà una pepita ogni tanto (il seme è l'entità e il tentativo); la galleria va puntellata prima di scendere.
local M = {}

local function stato(id) return ecs.get(id, "miniera") or { travi = 0, lavaggi = 0 } end

function M.on_act(id, user, action)
  local m = stato(id)
  if action == "setaccia" then
    m.lavaggi = m.lavaggi + 1
    ecs.set(id, "miniera", m)
    if hash(id, m.lavaggi) < 0.35 then
      inventory.add(user, "item.pepita", 1)
      return "Fai girare il setaccio sotto l'acqua: in fondo, tra la sabbia nera, brilla una pepita."
    end
    return "Solo sabbia e sassolini. Il fiume, oggi, non regala niente."
  elseif action == "puntella" then
    if m.travi >= 3 then return "La galleria è già puntellata a dovere." end
    inventory.remove(user, "item.trave", 1)
    m.travi = m.travi + 1
    ecs.set(id, "miniera", m)
    return "Incastri la trave sotto il soffitto e la batti con il martello: " .. m.travi .. " su tre."
  elseif action == "scendi" then
    if m.travi < 3 then return "Dal soffitto cade polvere a ogni passo: senza tre travi nuove non è prudente scendere." end
    return "Scendi tra le travi nuove. In fondo alla galleria la roccia ha una vena gialla, sottile come un capello."
  end
  return nil
end

return M
